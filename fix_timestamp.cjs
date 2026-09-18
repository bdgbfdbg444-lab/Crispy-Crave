const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

// Add serverTimestamp to imports
if (!content.includes('serverTimestamp')) {
    content = content.replace("import { ref, push, set, remove } from 'firebase/database';", "import { ref, push, set, remove, serverTimestamp } from 'firebase/database';");
}

// Replace { ".sv": "timestamp" } with serverTimestamp()
content = content.replace(/\{ "\.sv": "timestamp" \}/g, "serverTimestamp()");

fs.writeFileSync('src/pages/CheckoutPage.jsx', content, 'utf8');
console.log('Fixed serverTimestamp');
