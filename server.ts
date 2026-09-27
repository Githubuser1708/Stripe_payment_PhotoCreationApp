import express from "express";
import crypto from "crypto";
import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";


const storage = new Storage();
// Ensure you have GCS_BUCKET_NAME environment variable set
const bucketName = process.env.GCS_BUCKET_NAME || 'my-secure-bucket';
const bucket = storage.bucket(bucketName);

/**
 * Processes the raw AI generated image for high-resolution delivery.
 * By default (or when ENABLE_HIGH_RES_UPSCALE=true), upscales the image to 3584x4800 (17MP),
 * applies adaptive unsharp masking, embeds 300 DPI metadata, and encodes high quality.
 * Can be reverted to raw output by setting ENABLE_HIGH_RES_UPSCALE=false in environment variables.
 */
async function prepareHighResImageBuffer(rawBuffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  const enableUpscale = process.env.ENABLE_HIGH_RES_UPSCALE !== "false";

  if (!enableUpscale) {
    return { buffer: rawBuffer, contentType: "image/png" };
  }

  try {
    const highResBuffer = await sharp(rawBuffer)
      .resize(3584, 4800, {
        fit: "inside",
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false,
      })
      .sharpen({
        sigma: 1.0,
        m1: 0.7,
        m2: 1.5,
      })
      .jpeg({
        quality: 98,
        chromaSubsampling: "4:4:4",
      })
      .withMetadata({ density: 300 })
      .toBuffer();

    return { buffer: highResBuffer, contentType: "image/jpeg" };
  } catch (err) {
    console.warn("High-res upscaling failed, falling back to raw buffer:", err);
    return { buffer: rawBuffer, contentType: "image/png" };
  }
}

/**
 * Creates an enticing, crisp retina preview for display in the app.
 * Sized at 800px width with 85% JPEG quality and light sharpening,
 * ensuring it looks sharp on all mobile and desktop screens while keeping
 * the high-res 17MP print-ready file exclusively for paid download.
 */
async function createEnticingPreviewBuffer(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(800, 1067, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({
      sigma: 0.8,
      m1: 0.5,
      m2: 1.2,
    })
    .jpeg({
      quality: 85,
      mozjpeg: true,
    })
    .toBuffer();
}

const app = express();
const PORT = 3000;


import Stripe from "stripe";
let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Stripe Webhook MUST be placed before express.json middleware
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const stripe = getStripe();
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not set");
        return res.status(500).send("Webhook secret missing in server configuration.");
      }

      if (!sig) {
        return res.status(400).send("Missing stripe-signature header.");
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          webhookSecret
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the checkout.session.completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        
        if (session.payment_status === "paid") {
          const imageId = session.metadata?.imageId;
          
          console.log(`Payment successful for checkout session: ${session.id}`);
          if (imageId) {
            console.log(`Verified purchase for imageId: ${imageId}`);
            // Confirmed successful payment, but we will not create a Firestore purchases collection.
          }
        }
      }

      // Return a 200 res to acknowledge receipt of the event
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// High body limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { history, message } = req.body;
    const ai = getAi();

    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction:
          "You are a helpful and knowledgeable photography and style assistant. You can help with concept ideas, photo styling, lighting, and general questions.",
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process chat" });
  }
});

// Image edit endpoint
app.post("/api/edit-image", async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;
    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt" });
    }

    const ai = getAi();
    const modelsToTry = [
      "gemini-3.1-flash-image",
      "gemini-3.1-flash-lite-image",
    ];
    let lastError: any = null;

    const enhancedEditPrompt = `${prompt}. Maintain crisp photographic quality, sharp eye focus, natural skin texture with subtle pores, professional portrait lighting, clean high fidelity finish.`;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: mimeType || "image/png",
                },
              },
              { text: enhancedEditPrompt },
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const imageId = crypto.randomUUID();
            
            // 1. Prepare high-res (3584x4800, 300 DPI) and upload to GCS securely
            const highResData = await prepareHighResImageBuffer(imageBuffer);
            const file = bucket.file(`${imageId}.png`);
            await file.save(highResData.buffer, {
              contentType: highResData.contentType,
              resumable: false
            });
            
            // 2. Create an enticing, crisp retina preview for the browser (800px @ 85% quality)
            const previewBuffer = await createEnticingPreviewBuffer(imageBuffer);
              
            const previewBase64 = previewBuffer.toString('base64');

            return res.json({
              imageUrl: `data:image/jpeg;base64,${previewBase64}`,
              imageId: imageId
            });
          }
        }
      } catch (err: any) {
        console.warn(
          `Edit model ${model} failed, trying fallback:`,
          err?.message || err,
        );
        lastError = err;
      }
    }

    let errorMsg = lastError?.message || "No image generated.";
    if (errorMsg.includes("free_tier") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      errorMsg = "Image editing models require a paid-tier Gemini API key. Your current key is on the Free Tier which has a limit of 0 for these models. Please enable billing in your Google Cloud Project to use this feature.";
    }
    throw new Error(errorMsg);
  } catch (error: any) {
    console.error("Edit Image Error:", error);
    res.status(500).json({ error: error?.message || "Failed to edit image" });
  }
});



// Stripe checkout endpoint
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const stripe = getStripe();
    const { imageId } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ error: "Missing imageId" });
    }

    // Now the frontend sends a short UUID instead of base64
    let safeImageId = imageId;

    const origin = req.headers.origin || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sgd",
            product_data: {
              name: "High Resolution Cinematic Photo",
              description: "Full 8K resolution download without watermarks.",
            },
            unit_amount: 499, // $4.99 SGD
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        imageId: safeImageId,
      },
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-cancelled`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    res
      .status(500)
      .json({ error: error?.message || "Failed to create checkout session" });
  }
});

// Generate photo endpoint
app.post("/api/generate-photo", async (req, res) => {
  try {
    const { referenceImages, styleDescription, customPrompt } = req.body;
    if (
      !referenceImages ||
      !Array.isArray(referenceImages) ||
      referenceImages.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "At least one reference image is required." });
    }

    const ai = getAi();
    const parts: any[] = [];

    referenceImages.forEach((img: { base64: string; mimeType: string }) => {
      parts.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType || "image/jpeg",
        },
      });
    });

    let promptText = `
Generate an exceptionally high-quality, professional studio portrait photograph adhering to these directives:
1. Identity Preservation: Strictly preserve the exact facial structure, eye shape and color, nose, lips, hair, bone structure, and natural skin tone from the reference photo(s).
2. Style & Concept: ${styleDescription || "Cinematic soft decor studio portrait"}
3. Photographic Quality & Camera Optics: Shot with an 85mm f/1.8 prime portrait lens, Rembrandt studio lighting, soft diffused rim light, subtle natural catchlights in the pupils, razor-sharp focus on the eyes and eyelashes, natural textured skin with visible pores (no artificial plastic smoothing or over-blurring), rich color grading, and elegant shallow depth of field.
`;

    if (customPrompt) {
      promptText += `\n4. Additional Directives: ${customPrompt}`;
    }

    parts.push({ text: promptText });

    const modelsToTry = [
      { name: "gemini-3.1-flash-image", size: "1K" },
      { name: "gemini-3.1-flash-image", size: undefined },
      { name: "gemini-3.1-flash-lite-image", size: undefined },
      { name: "gemini-3-pro-image", size: "1K" },
    ];

    let lastError: any = null;

    for (const targetModel of modelsToTry) {
      try {
        const config: any = {
          imageConfig: {
            aspectRatio: "3:4",
          },
        };
        if (targetModel.size) {
          config.imageConfig.imageSize = targetModel.size;
        }

        const response = await ai.models.generateContent({
          model: targetModel.name,
          contents: { parts },
          config,
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const imageId = crypto.randomUUID();
            
            // 1. Prepare high-res (3584x4800, 300 DPI) and upload to GCS securely
            const highResData = await prepareHighResImageBuffer(imageBuffer);
            const file = bucket.file(`${imageId}.png`);
            await file.save(highResData.buffer, {
              contentType: highResData.contentType,
              resumable: false
            });
            
            // 2. Create an enticing, crisp retina preview for the browser (800px @ 85% quality)
            const previewBuffer = await createEnticingPreviewBuffer(imageBuffer);
              
            const previewBase64 = previewBuffer.toString('base64');

            return res.json({
              imageUrl: `data:image/jpeg;base64,${previewBase64}`,
              imageId: imageId
            });
          }
        }
      } catch (err: any) {
        console.warn(
          `Model ${targetModel.name} failed, trying fallback:`,
          err?.message || err,
        );
        lastError = err;
      }
    }

    let errorMsg = lastError?.message || "Failed to generate image.";
    if (errorMsg.includes("free_tier") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      errorMsg = "Image generation models (like gemini-3.1-flash-image) require a paid-tier Gemini API key. Your current key is on the Free Tier which has a limit of 0 for these models. Please enable billing in your Google Cloud Project to use this feature.";
    }
    throw new Error(errorMsg);
  } catch (error: any) {
    console.error("Generate Photo Error:", error);
    res
      .status(500)
      .json({ error: error?.message || "Failed to generate photo" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}


app.post("/api/verify-payment", async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const imageId = session.metadata?.imageId;
      
      if (!imageId) {
         return res.status(400).json({ error: "No image associated with this payment." });
      }

      const file = bucket.file(`${imageId}.png`);
      const [exists] = await file.exists();
      if (!exists) {
         return res.status(404).json({ error: "High-resolution image not found." });
      }

      // Generate a signed URL that expires in 15 minutes with download attachment disposition
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
        responseDisposition: `attachment; filename="cinematic-photo-highres-${imageId.slice(0, 8)}.jpg"`,
      });

      return res.json({ downloadUrl: url });
    } else {
      return res.status(400).json({ error: "Payment not completed." });
    }
  } catch (err: any) {
    console.error("Verification Error:", err);
    res.status(500).json({ error: err.message || "Failed to verify payment." });
  }
});

startServer();
