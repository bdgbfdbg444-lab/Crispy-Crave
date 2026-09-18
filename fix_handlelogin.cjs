const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = /const custRef = ref\(db, \`PublicCustomers\/\$\{phone\}\`\);\n\s*const custSnap = await get\(custRef\);\n\s*const internalEmail = getInternalEmail\(phone\);\n\s*const dbEmail = custSnap\.exists\(\) && custSnap\.val\(\)\.Email \? custSnap\.val\(\)\.Email\.trim\(\) : null;\n\s*const authEmail = custSnap\.exists\(\) && custSnap\.val\(\)\.AuthEmail \? custSnap\.val\(\)\.AuthEmail\.trim\(\) : null;/m;

const replacement = `const cleanPhone = normalizePhone(phone);
      const custRef = ref(db, \`CustomerLoginEmails/\${cleanPhone}\`);
      const custSnap = await get(custRef);
      
      const internalEmail = getInternalEmail(cleanPhone);
      const authEmail = custSnap.exists() ? custSnap.val().trim() : null;`;

if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Fixed handleLogin auth email fetch!");
} else {
    console.log("Could not find handleLogin fetch logic.");
}
