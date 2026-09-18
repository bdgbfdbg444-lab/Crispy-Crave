const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// Replace handleLogin reading AuthEmail
const handleLoginTarget = /const dbEmailSnap = await get\(ref\(db, \`PublicCustomers\/\$\{cleanPhone\}\/Email\`\)\);[\s\S]*?if \(authEmailSnap\.exists\(\)\) authEmail = authEmailSnap\.val\(\)\.trim\(\);/m;
const handleLoginReplace = `const dbEmailSnap = await get(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`));
          if (dbEmailSnap.exists()) authEmail = dbEmailSnap.val().trim();`;
content = content.replace(handleLoginTarget, handleLoginReplace);

// Update AuthEmail writes in handleSetPasswordForExisting
const setPwdTarget = /await update\(ref\(db, \`PublicCustomers\/\$\{cleanPhone\}\`\), \{[\s\S]*?AuthEmail: auth\.currentUser\.email\n        \}\);/m;
const setPwdReplace = `await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          AuthEmail: auth.currentUser.email
        });
        await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), auth.currentUser.email);`;
content = content.replace(setPwdTarget, setPwdReplace);

// Update AuthEmail writes in handleCompleteRegistration
const completeTarget = /await set\(ref\(db, \`PublicCustomers\/\$\{cleanPhone\}\`\), \{[\s\S]*?AuthEmail: auth\.currentUser\.email\n        \}\);/m;
const completeReplace = `await set(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          Name: name.trim(),
          Phone: cleanPhone,
          Address: address.trim(),
          Zone: selectedZone,
          Email: emailToUse,
          AuthEmail: auth.currentUser.email
        });
        await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), auth.currentUser.email);`;
content = content.replace(completeTarget, completeReplace);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed handleLogin AuthEmail');
