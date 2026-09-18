const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const newCompleteReg = `  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('يرجى إدخال اسمك');
    if (!selectedZone) return setError('يرجى اختيار منطقة السكن');
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);

    const cleanPhone = normalizePhone(phone);
    try {
      const emailToUse = email.trim() ? email.trim() : getInternalEmail(cleanPhone);
      try {
        await updateEmail(auth.currentUser, emailToUse);
      } catch(e) {}
      await updatePassword(auth.currentUser, password);

      await set(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
        Name: name,
        Phone: cleanPhone,
        Email: email.trim() || null,
        Address: address.trim() || null,
        Zone: selectedZone,
        uid: auth.currentUser.uid,
        AuthEmail: emailToUse
      });

      await refreshCustomerData(cleanPhone);
      setStep('dashboard');
    } catch (err) {
      setError('حدث خطأ أثناء إكمال التسجيل: ' + err.message);
    }
    setLoading(false);
  };`;

content = content.replace(/const handleCompleteRegistration = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/, newCompleteReg);

const newSetPass = `  const handleSetPasswordForExisting = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);

    const cleanPhone = normalizePhone(phone);
    try {
      const emailToUse = getInternalEmail(cleanPhone);
      try {
        await updateEmail(auth.currentUser, emailToUse);
      } catch(e) {}
      await updatePassword(auth.currentUser, password);

      await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
        uid: auth.currentUser.uid,
        AuthEmail: emailToUse
      });

      await refreshCustomerData(cleanPhone);
      setStep('dashboard');
    } catch (err) {
      setError('حدث خطأ أثناء تحديث كلمة المرور: ' + err.message);
    }
    setLoading(false);
  };`;

content = content.replace(/const handleSetPasswordForExisting = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/, newSetPass);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Final website replacements completed successfully');
