const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = content.substring(content.indexOf('<AnimatePresence>'), content.indexOf('</AnimatePresence>') + '</AnimatePresence>'.length);
content = content.replace(targetStr, '');

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Removed invalid OTP modal');
