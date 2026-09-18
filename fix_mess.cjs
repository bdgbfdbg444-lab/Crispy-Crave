const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// Find the first instance of handlePhoneSubmit
const idxStart = content.indexOf('impconst handlePhoneSubmit');
if (idxStart !== -1) {
    // It's messed up. Let's find the end of the second handlePhoneSubmit
    const idxEnd = content.indexOf('const handleLogin = async');
    if (idxEnd !== -1) {
        const target = content.substring(idxStart, idxEnd);
        const correctCode = `const handlePhoneSubmit = async (e) => {
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
  };

  `;
        content = content.replace(target, correctCode);
        fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
        console.log('Fixed multiple handlePhoneSubmit functions');
    }
}
