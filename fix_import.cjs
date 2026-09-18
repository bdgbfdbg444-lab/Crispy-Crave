const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

content = content.replace(
  "import { ref, set, push, update, remove, get } from 'firebase/database';",
  "import { ref, set, push, update, remove, get, serverTimestamp } from 'firebase/database';"
);

fs.writeFileSync('src/pages/CheckoutPage.jsx', content, 'utf8');
console.log('Added serverTimestamp import properly!');
