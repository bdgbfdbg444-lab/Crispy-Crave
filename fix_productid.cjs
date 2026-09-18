const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

// Replace productId: item.product.id, with productId: Number(item.product.id) || 0,
content = content.replace(/productId:\s*item\.product\.id,/g, "productId: Number(item.product.id) || 0,");

fs.writeFileSync('src/pages/CheckoutPage.jsx', content, 'utf8');
console.log('Fixed productId to number');
