const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const handleSetPasswordFn = `const handleSetPasswordForExisting = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);
    try {
      const cleanPhone = normalizePhone(phone);
      const custRef = ref(db, \`CustomerLoginEmails/\${cleanPhone}\`);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        const authEmail = custSnap.val();
        
        // Ensure user is signed in to link credentials
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }

        try {
          const credential = EmailAuthProvider.credential(authEmail, newPassword);
          await linkWithCredential(auth.currentUser, credential);
        } catch (linkErr) {
           const newAuthEmail = \`\${cleanPhone}_\${Date.now()}@internal.smokeandsmash.com\`;
           const res = await createUserWithEmailAndPassword(auth, newAuthEmail, newPassword);
           
           await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), { AuthEmail: newAuthEmail, uid: res.user.uid });
           await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), newAuthEmail);
           await set(ref(db, \`UidToPhone/\${res.user.uid}\`), cleanPhone);
        }
        
        await refreshCustomerData(cleanPhone);
        setStep('dashboard');
      } else {
        setError('تعذر العثور على حسابك.');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تعيين كلمة المرور الجديدة.');
    }
    setLoading(false);
  };

  `;

const target = "const handleRegister = async (e) => {";
if (content.includes(target)) {
    content = content.replace(target, handleSetPasswordFn + target);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Added handleSetPasswordForExisting!");
} else {
    console.log("Could not find handleRegister");
}
