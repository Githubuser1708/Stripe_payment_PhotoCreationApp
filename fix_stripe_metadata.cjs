const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Add crypto import if missing
if (!code.includes('import crypto from "crypto";')) {
  code = code.replace('import express from "express";', 'import express from "express";\nimport crypto from "crypto";');
}

const target = `    const { imageId } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ error: "Missing imageId" });
    }

    const origin = req.headers.origin || "http://localhost:3000";`;

const replacement = `    const { imageId } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ error: "Missing imageId" });
    }

    // Stripe metadata values are limited to 500 characters. 
    // If the frontend sends the full base64 data URI as the imageId, we must hash it.
    let safeImageId = imageId;
    if (safeImageId.length > 400) {
      safeImageId = crypto.createHash('sha256').update(safeImageId).digest('hex');
    }

    const origin = req.headers.origin || "http://localhost:3000";`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  
  // also need to replace metadata: { imageId: imageId } to metadata: { imageId: safeImageId }
  const metadataTarget = `      metadata: {
        imageId: imageId,
      },`;
  const metadataReplacement = `      metadata: {
        imageId: safeImageId,
      },`;
      
  code = code.replace(metadataTarget, metadataReplacement);
  
  fs.writeFileSync('server.ts', code);
  console.log('Successfully patched server.ts');
} else {
  console.log('Target block not found');
}
