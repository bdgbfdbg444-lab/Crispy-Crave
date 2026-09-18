const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const r = /const handleCompleteRegistration = async \(e\) => \{[\s\S]*?setLoading\(false\);\n    \};/;
const replacement = `const handleCompleteRegistration = async (e) => {
      e.preventDefault();
      if (!name.trim()) return setError('يرجى إدخال الاسم');
      if (!selectedZone) return setError('يرجى اختيار المنطقة');
      if (password.length < 6) return setError('كلمة المرور 6 أحرف على الأقل');
      setError('');
      setLoading(true);
  
      const cleanPhone = normalizePhone(phone);
      try {
        const emailToUse = email.trim() ? email.trim() : getInternalEmail(cleanPhone);
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
        }
        
        await set(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          Name: name.trim(),
          Phone: cleanPhone,
          Address: address.trim(),
          Zone: selectedZone,
          Email: emailToUse,
          AuthEmail: auth.currentUser.email || emailToUse
        });
        await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), auth.currentUser.email || emailToUse);
        
        await refreshCustomerData(cleanPhone);
        setStep('dashboard');
      } catch (err) {
        setError('Error: ' + err.message);
      }
      setLoading(false);
    };`;

content = content.replace(r, replacement);

// Make sure EmailAuthProvider and linkWithCredential are imported!
if (!content.includes('linkWithCredential')) {
    content = content.replace(
        "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup } from 'firebase/auth';",
        "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup, linkWithCredential, EmailAuthProvider } from 'firebase/auth';"
    );
}

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed handleCompleteRegistration');
