const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const forgotPassTarget = /const handleForgotPassword = \(\) => \{[\s\S]*?setStep\('reset_options'\);\s*\};/m;
const forgotPassReplace = `const handleForgotPassword = async () => {
    setError('');
    setIsForgotPasswordFlow(true);
    if (!phone || phone.length < 10) return setError('يرجى إدخال رقم الهاتف أولاً.');
    setLoading(true);
    try {
      await sendWhatsAppOtp(phone);
      setIsOtpModalOpen(true);
    } catch (err) {
      setError('حدث خطأ أثناء إرسال الكود');
    }
    setLoading(false);
  };`;

if (content.match(forgotPassTarget)) {
    content = content.replace(forgotPassTarget, forgotPassReplace);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Fixed handleForgotPassword');
} else {
    console.log('Could not find handleForgotPassword');
}
