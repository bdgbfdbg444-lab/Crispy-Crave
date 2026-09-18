const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

// Replace orderDate: serverTimestamp() with orderDate: new Date().toISOString()
content = content.replace(/orderDate:\s*serverTimestamp\(\)/g, "orderDate: new Date().toISOString()");

fs.writeFileSync('src/pages/CheckoutPage.jsx', content, 'utf8');
console.log('Fixed orderDate to string');
