const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      // Handle the checkout.session.completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const imageId = session.metadata?.imageId;
        
        console.log(\`Payment successful for checkout session: \${session.id}\`);
        if (imageId) {
          console.log(\`Verified purchase for imageId: \${imageId}\`);
          // Confirmed successful payment, but we will not create a Firestore purchases collection.
        }
      }`;

const replacement = `      // Handle the checkout.session.completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        
        if (session.payment_status === "paid") {
          const imageId = session.metadata?.imageId;
          
          console.log(\`Payment successful for checkout session: \${session.id}\`);
          if (imageId) {
            console.log(\`Verified purchase for imageId: \${imageId}\`);
            // Confirmed successful payment, but we will not create a Firestore purchases collection.
          }
        }
      }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log('Successfully patched server.ts');
} else {
  console.log('Target block not found');
}
