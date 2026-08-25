const fs = require('fs');
let code = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

const regex = /return\s*\{\s*productName:\s*finalProductName,\s*quantity:\s*item\.quantity,\s*unitPrice:\s*unitPrice\s*\};/g;
const replacement = `return {
            productName: finalProductName,
            quantity: item.quantity,
            unitPrice: unitPrice,
            productId: item.product.id,
            weightInGrams: item.product.selectedWeight || 0,
            modifierNotes: modifierText
          };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/CheckoutPage.jsx', code, 'utf8');
