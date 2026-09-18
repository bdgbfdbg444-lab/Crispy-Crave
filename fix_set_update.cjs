const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = `await set(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          Name: name.trim(),
          Phone: cleanPhone,
          Address: address.trim(),
          Zone: selectedZone,
          Email: emailToUse,
          AuthEmail: auth.currentUser.email || emailToUse
        });`;

const replaceStr = `await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          Name: name.trim(),
          Phone: cleanPhone,
          Address: address.trim(),
          Zone: selectedZone,
          Email: emailToUse,
          AuthEmail: auth.currentUser.email || emailToUse
        });`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed set to update');
