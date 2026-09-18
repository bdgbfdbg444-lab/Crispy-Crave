const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

content = content.replace(
    /await set\(ref\(db, \`PublicCustomers\/\$\{phone\}\`\), \{/g,
    "await update(ref(db, `PublicCustomers/${phone}`), {"
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed all sets to update');
