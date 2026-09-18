const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = `const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');
    setError('');
    setLoading(true);

    try {
      const custRef = ref(db, \`PublicCustomers/\${phone}\`);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        setStep('login');
      } else {
        setStep('register');
      }
    } catch (err) {
      setError('حدث خطأ أثناء فحص الرقم');
    }
    setLoading(false);
  };`;

const newLogic = `const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');
    setError('');
    setIsSendingOtp(true);
    setLoading(true);
    try {
      setIsForgotPasswordFlow(false);
      await sendWhatsAppOtp(phone);
      setIsOtpModalOpen(true);
    } catch (err) {
      setError('حدث خطأ أثناء إرسال كود واتساب');
    }
    setIsSendingOtp(false);
    setLoading(false);
  };`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newLogic);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Found and replaced handlePhoneSubmit!");
} else {
    // English version maybe?
    const targetStrEn = targetStr.replace('رقم الهاتف غير صحيح', 'OU,U. O U,UO OU? OUSO OO-USO-').replace('حدث خطأ أثناء فحص الرقم', 'O-O_O OrOO OOU+O O U?O-O O U,OU,U.');
    if (content.includes(targetStrEn)) {
        content = content.replace(targetStrEn, newLogic);
        fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
        console.log("Found and replaced English handlePhoneSubmit!");
    } else {
        console.log("Target string NOT found.");
    }
}
