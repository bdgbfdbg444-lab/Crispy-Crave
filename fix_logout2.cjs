const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = /localStorage\.removeItem\('activeOrderNumber'\);\n\s*localStorage\.removeItem\('editingOrderId'\);/m;
const replacement = `localStorage.removeItem('activeOrderNumber');
      localStorage.removeItem('editingOrderId');
      
      // Clear all order-specific local storage details
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('order_') || key.startsWith('placed_order_') || key === 'crispy_cart_items')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('placed_order_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));`;

if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Fixed localStorage clearing on logout');
} else {
    console.log('Target not found for logout clearing');
}
