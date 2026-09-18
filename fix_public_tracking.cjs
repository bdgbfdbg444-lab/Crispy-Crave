const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

// Replace the fetch block with Firebase SDK set
const oldCode = `        try {
          const publicInit = {
            Status: 'Pending',
            OrderType: formData.orderType,
            DisplayOrderId: displayOrderId,
            LastUpdate: serverTimestamp()
          };
          await fetch(\`\${APP_CONFIG.firebaseDbUrl}PublicTracking/\${trackingToken}.json\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(publicInit)
          });
        } catch (e) {}`;

const newCode = `        try {
          const publicInit = {
            Status: 'Pending',
            OrderType: formData.orderType,
            DisplayOrderId: displayOrderId,
            LastUpdate: serverTimestamp()
          };
          await set(ref(db, \`PublicTracking/\${trackingToken}\`), publicInit);
        } catch (e) {
          console.warn("Could not init PublicTracking:", e);
        }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/pages/CheckoutPage.jsx', content, 'utf8');
console.log('Fixed PublicTracking init');
