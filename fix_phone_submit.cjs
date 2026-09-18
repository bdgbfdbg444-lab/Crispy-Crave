const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = /const custRef = ref\(db, \`PublicCustomers\/\$\{phone\}\`\);\s*const custSnap = await get\(custRef\);/m;
const replacement = `const custRef = ref(db, \`CustomerLoginEmails/\${phone}\`);
        const custSnap = await get(custRef);`;

if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Fixed handlePhoneSubmit');
} else {
    console.log('Target not found in handlePhoneSubmit');
}
