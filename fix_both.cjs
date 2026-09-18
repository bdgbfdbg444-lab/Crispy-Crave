const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const oldHandleSet = /const handleSetPasswordForExisting = async \(e\) => \{[\s\S]*?setLoading\(false\);\n    \};/;
const oldHandleComplete = /const handleCompleteRegistration = async \(e\) => \{[\s\S]*?setLoading\(false\);\n    \};/;

const newHandleSet = `const handleSetPasswordForExisting = async (e) => {
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

const newHandleComplete = `const handleCompleteRegistration = async (e) => {
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

if (content.match(oldHandleSet)) {
    content = content.replace(oldHandleSet, newHandleSet);
    console.log('Successfully replaced handleSet');
} else {
    console.log('Failed to match handleSet');
}

if (content.match(oldHandleComplete)) {
    content = content.replace(oldHandleComplete, newHandleComplete);
    console.log('Successfully replaced handleComplete');
} else {
    console.log('Failed to match handleComplete');
}

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
