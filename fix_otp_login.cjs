const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = `          await signInAnonymously(auth);
          await refreshCustomerData(cleanPhone);`;

const newStr = `          await signInAnonymously(auth);
          await set(ref(db, \`UidToPhone/\${auth.currentUser.uid}\`), cleanPhone);
          await refreshCustomerData(cleanPhone);`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Injected UidToPhone map for existing user OTP login!");
} else {
    console.log("Could not find target string.");
}
