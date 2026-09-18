const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

content = content.replace(/await set\(ref\(db, `UidToPhone\/\$\{userRes\.user\.uid\}`\), cleanPhone\);/g, '');
content = content.replace(/await set\(ref\(db, `UidToPhone\/\$\{res\.user\.uid\}`\), cleanPhone\);/g, '');
content = content.replace(/await set\(ref\(db, `UidToPhone\/\$\{auth\.currentUser\.uid\}`\), phone\);/g, '');

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Removed UidToPhone client writes successfully');
