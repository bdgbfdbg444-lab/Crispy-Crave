const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const fixSetPassword = `const handleSetPasswordForExisting = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);

    const cleanPhone = normalizePhone(phone);
    try {
      const emailToUse = getInternalEmail(cleanPhone);
      try { 
        await updateEmail(auth.currentUser, emailToUse); 
      } catch(authErr) {
        if (authErr.code === 'auth/email-already-in-use' || authErr.message.includes('email-already-in-use')) {
          const altEmail = \`\${cleanPhone}_\${Date.now()}@internal.theblackbox.com\`;
          await updateEmail(auth.currentUser, altEmail);
        } else {
          throw authErr;
        }
      }
      await updatePassword(auth.currentUser, password);
      
      await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
        uid: auth.currentUser.uid,
        AuthEmail: auth.currentUser.email
      });
      await refreshCustomerData(cleanPhone);
      setStep('dashboard');
    } catch (err) {
      setError('Error: ' + err.message);
    }
    setLoading(false);
  };`;

content = content.replace(/const handleSetPasswordForExisting = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/, fixSetPassword);

const fixCompleteRegistration = `const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('يرجى إدخال اسمك');
    if (!selectedZone) return setError('يرجى اختيار المنطقة');
    if (password.length < 6) return setError('كلمة المرور 6 أحرف على الأقل');
    setError('');
    setLoading(true);

    const cleanPhone = normalizePhone(phone);
    try {
      const emailToUse = email.trim() ? email.trim() : getInternalEmail(cleanPhone);
      try { 
        await updateEmail(auth.currentUser, emailToUse); 
      } catch(authErr) {
        if (authErr.code === 'auth/email-already-in-use' || authErr.message.includes('email-already-in-use')) {
          const altEmail = \`\${cleanPhone}_\${Date.now()}@internal.theblackbox.com\`;
          await updateEmail(auth.currentUser, altEmail);
        } else {
          throw authErr;
        }
      }
      await updatePassword(auth.currentUser, password);
      
      await set(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
        Name: name,
        Phone: cleanPhone,
        Email: email.trim() || null,
        Address: address.trim() || null,
        Zone: selectedZone,
        uid: auth.currentUser.uid,
        AuthEmail: auth.currentUser.email
      });
      await refreshCustomerData(cleanPhone);
      setStep('dashboard');
    } catch (err) {
      setError('Error: ' + err.message);
    }
    setLoading(false);
  };`;

content = content.replace(/const handleCompleteRegistration = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/, fixCompleteRegistration);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed auth updateEmail logic');
