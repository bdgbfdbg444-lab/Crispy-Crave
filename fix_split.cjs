const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const s1 = content.split('const handleSetPasswordForExisting = async (e) => {');
const s2 = s1[1].split('const handleCompleteRegistration = async (e) => {');
const s3 = s2[1].split('const handleGoogleLogin = async () => {');

const newHandleSet = `\n      e.preventDefault();
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
          AuthEmail: auth.currentUser.email || emailToUse
        });
        await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), auth.currentUser.email || emailToUse);
        
        await refreshCustomerData(cleanPhone);
        setStep('dashboard');
      } catch (err) {
        setError('Error: ' + err.message);
      }
      setLoading(false);
    };\n\n  `;

const newHandleComplete = `\n      e.preventDefault();
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
    };\n\n    `;

const finalStr = s1[0] + 'const handleSetPasswordForExisting = async (e) => {' + newHandleSet + 'const handleCompleteRegistration = async (e) => {' + newHandleComplete + 'const handleGoogleLogin = async () => {' + s3[1];
fs.writeFileSync('src/pages/MyAccountPage.jsx', finalStr, 'utf8');
console.log('Fixed using split');
