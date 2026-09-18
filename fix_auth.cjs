const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// Ensure EmailAuthProvider and linkWithCredential are imported
if (!content.includes('linkWithCredential')) {
    content = content.replace(
        "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup } from 'firebase/auth';",
        "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup, linkWithCredential, EmailAuthProvider } from 'firebase/auth';"
    );
}

const handleSetPasswordTarget = /const emailToUse = getInternalEmail\(cleanPhone\);\n        try \{ \n          await updateEmail\(auth\.currentUser, emailToUse\); \n        \} catch\(authErr\) \{[\s\S]*?await updatePassword\(auth\.currentUser, password\);/m;

const handleSetPasswordReplace = `const emailToUse = getInternalEmail(cleanPhone);
        try { 
          const credential = EmailAuthProvider.credential(emailToUse, password);
          await linkWithCredential(auth.currentUser, credential);
        } catch(authErr) {
          if (authErr.code === 'auth/email-already-in-use' || authErr.message.includes('email-already-in-use') || authErr.code === 'auth/credential-already-in-use') {
            const altEmail = \`\${cleanPhone}_\${Date.now()}@internal.theblackbox.com\`;
            const altCredential = EmailAuthProvider.credential(altEmail, password);
            await linkWithCredential(auth.currentUser, altCredential);
          } else {
            throw authErr;
          }
        }`;

content = content.replace(handleSetPasswordTarget, handleSetPasswordReplace);

const completeProfileTarget = /const emailToUse = email\.trim\(\) \? email\.trim\(\) : getInternalEmail\(cleanPhone\);\n        try \{ \n          await updateEmail\(auth\.currentUser, emailToUse\); \n        \} catch\(authErr\) \{[\s\S]*?await updatePassword\(auth\.currentUser, password\);/m;

const completeProfileReplace = `const emailToUse = email.trim() ? email.trim() : getInternalEmail(cleanPhone);
        try { 
          const credential = EmailAuthProvider.credential(emailToUse, password);
          await linkWithCredential(auth.currentUser, credential);
        } catch(authErr) {
          if (authErr.code === 'auth/email-already-in-use' || authErr.message.includes('email-already-in-use') || authErr.code === 'auth/credential-already-in-use') {
            const altEmail = \`\${cleanPhone}_\${Date.now()}@internal.theblackbox.com\`;
            const altCredential = EmailAuthProvider.credential(altEmail, password);
            await linkWithCredential(auth.currentUser, altCredential);
          } else {
            throw authErr;
          }
        }`;

content = content.replace(completeProfileTarget, completeProfileReplace);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed auth/operation-not-allowed by using linkWithCredential');
