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
              { text: prompt },
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const imageId = crypto.randomUUID();
            
            // 1. Upload high-res to GCS securely
            const file = bucket.file(`${imageId}.png`);
            await file.save(imageBuffer, {
              contentType: 'image/png',
              resumable: false
            });
            
            // 2. Create a smaller preview to send to the browser
            // Watermarking could also be added here, but resizing is a good start.
            const previewBuffer = await sharp(imageBuffer)
              .resize(400) // Much smaller width for preview
              .jpeg({ quality: 60 })
              .toBuffer();
              
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
Generate a high-quality, professional cinematic photo based on these rules:
1. Identity Preservation: Preserve the exact facial identity, eyes, nose, lips, hair, and natural skin tone from the reference photo(s).
2. Style & Concept: ${styleDescription || "Cinematic soft decor studio portrait"}
3. Quality: Ultra-detailed 8K photographic quality, professional lighting, rich color grading, sharp focus, beautiful depth of field.
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
            
            // 1. Upload high-res to GCS securely
            const file = bucket.file(`${imageId}.png`);
            await file.save(imageBuffer, {
              contentType: 'image/png',
              resumable: false
            });
            
            // 2. Create a smaller preview to send to the browser
            // Watermarking could also be added here, but resizing is a good start.
            const previewBuffer = await sharp(imageBuffer)
              .resize(400) // Much smaller width for preview
              .jpeg({ quality: 60 })
              .toBuffer();
              
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

      // Generate a signed URL that expires in 15 minutes
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, 
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
