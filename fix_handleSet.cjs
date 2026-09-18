const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const r = /const handleSetPasswordForExisting = async \(e\) => \{[\s\S]*?setLoading\(false\);\n    \};/;
const replacement = `const handleSetPasswordForExisting = async (e) => {
      e.preventDefault();
      if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setError('');
      setLoading(true);
  
      const cleanPhone = normalizePhone(phone);
      try {
        const emailToUse = getInternalEmail(cleanPhone);
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
        
        await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          AuthEmail: auth.currentUser.email
        });
        await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), auth.currentUser.email);
        
        await refreshCustomerData(cleanPhone);
        setStep('dashboard');
      } catch (err) {
        setError('Error: ' + err.message);
      }
      setLoading(false);
    };`;

content = content.replace(r, replacement);
fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed handleSetPasswordForExisting');
