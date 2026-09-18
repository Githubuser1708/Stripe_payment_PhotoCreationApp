const fs = require('fs');

let c = fs.readFileSync('server.ts', 'utf8');

// 1. Move getStripe and Stripe import up
const stripeSetupRegex = /import Stripe from "stripe";[\s\S]*?export function getStripe\(\): Stripe \{[\s\S]*?return stripeClient;\n\}/;
const match = c.match(stripeSetupRegex);
if (match) {
  c = c.replace(match[0], ''); // remove from bottom
  
  // insert before app.use(express.json())
  const splitPoint = "// High body limit for base64 image uploads";
  
  const webhookCode = `
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
        return res.status(400).send(\`Webhook Error: \${err.message}\`);
      }

      // Handle the checkout.session.completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const imageId = session.metadata?.imageId;
        
        console.log(\`Payment successful for checkout session: \${session.id}\`);
        if (imageId) {
          console.log(\`Verified purchase for imageId: \${imageId}\`);
          // Confirmed successful payment, but we will not create a Firestore purchases collection.
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

`;

  c = c.replace(splitPoint, webhookCode + splitPoint);
}

fs.writeFileSync('server.ts', c);
console.log("Patched server.ts");
