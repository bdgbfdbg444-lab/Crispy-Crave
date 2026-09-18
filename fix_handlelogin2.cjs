const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const strToReplace = `      const custRef = ref(db, \`PublicCustomers/\${phone}\`);
      const custSnap = await get(custRef);
      
      const internalEmail = getInternalEmail(phone);
      const dbEmail = custSnap.exists() && custSnap.val().Email ? custSnap.val().Email.trim() : null;
      const authEmail = custSnap.exists() && custSnap.val().AuthEmail ? custSnap.val().AuthEmail.trim() : null;`;

const newLogic = `      const cleanPhone = normalizePhone(phone);
      const custRef = ref(db, \`CustomerLoginEmails/\${cleanPhone}\`);
      const custSnap = await get(custRef);
      const authEmail = custSnap.exists() ? custSnap.val().trim() : null;
      const internalEmail = getInternalEmail(cleanPhone);`;

if (content.includes(strToReplace)) {
    content = content.replace(strToReplace, newLogic);
    
    // Also remove the dbEmail reference below it
    content = content.replace(
        "if (dbEmail) {\n            await signInWithEmailAndPassword(auth, dbEmail, password);\n          } else {\n            throw firstErr;\n          }",
        "throw firstErr;"
    );
    
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Fixed handleLogin auth email fetch!");
} else {
    console.log("Could not find handleLogin fetch logic (string).");
}
