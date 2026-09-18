const fs = require('fs');

// 1. Update index.tsx for routing
const indexCode = `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import PaymentSuccess from "./components/PaymentSuccess";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
`;
fs.writeFileSync('index.tsx', indexCode);

// 2. Update server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');

// Add Storage and sharp imports
if (!serverCode.includes('@google-cloud/storage')) {
  serverCode = serverCode.replace(
    'import crypto from "crypto";',
    'import crypto from "crypto";\nimport { Storage } from "@google-cloud/storage";\nimport sharp from "sharp";'
  );
  if (!serverCode.includes('@google-cloud/storage')) {
    // fallback if crypto wasn't there
    serverCode = serverCode.replace(
      'import express from "express";',
      'import express from "express";\nimport crypto from "crypto";\nimport { Storage } from "@google-cloud/storage";\nimport sharp from "sharp";'
    );
  }
}

// Add GCS init
const gcsInit = `
const storage = new Storage();
// Ensure you have GCS_BUCKET_NAME environment variable set
const bucketName = process.env.GCS_BUCKET_NAME || 'my-secure-bucket';
const bucket = storage.bucket(bucketName);
`;
if (!serverCode.includes('new Storage()')) {
  serverCode = serverCode.replace('const app = express();', gcsInit + '\nconst app = express();');
}

// Replace generate-photo
// We need to find the existing logic and modify it.
const generateTarget = `        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return res.json({
              imageUrl: \`data:image/png;base64,\${part.inlineData.data}\`,
            });
          }
        }`;

const generateReplacement = `        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const imageId = crypto.randomUUID();
            
            // 1. Upload high-res to GCS securely
            const file = bucket.file(\`\${imageId}.png\`);
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
              imageUrl: \`data:image/jpeg;base64,\${previewBase64}\`,
              imageId: imageId
            });
          }
        }`;

serverCode = serverCode.replace(generateTarget, generateReplacement);

// Update /api/create-checkout-session to use imageId directly
const checkoutTarget = `    // Stripe metadata values are limited to 500 characters. 
    // If the frontend sends the full base64 data URI as the imageId, we must hash it.
    let safeImageId = imageId;
    if (safeImageId.length > 400) {
      safeImageId = crypto.createHash('sha256').update(safeImageId).digest('hex');
    }`;

const checkoutReplacement = `    // Now the frontend sends a short UUID instead of base64
    let safeImageId = imageId;`;
serverCode = serverCode.replace(checkoutTarget, checkoutReplacement);

// Add /api/verify-payment endpoint
const verifyPaymentEndpoint = `
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

      const file = bucket.file(\`\${imageId}.png\`);
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
    res.status(500).json({ error: "Failed to verify payment." });
  }
});
`;

if (!serverCode.includes('/api/verify-payment')) {
  serverCode = serverCode.replace('startServer();', verifyPaymentEndpoint + '\nstartServer();');
}

fs.writeFileSync('server.ts', serverCode);
console.log('Successfully patched server.ts and index.tsx');
