const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const regex = /const handlePhoneSubmit = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/m;

const newLogic = `const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');
    setError('');
    setIsSendingOtp(true);
    setLoading(true);
    try {
      setIsForgotPasswordFlow(false); // Make sure it's not forgot password
      await sendWhatsAppOtp(phone);
      setIsOtpModalOpen(true);
    } catch (err) {
      setError('حدث خطأ أثناء إرسال كود واتساب');
    }
    setIsSendingOtp(false);
    setLoading(false);
  };`;

if (content.match(regex)) {
   content = content.replace(regex, newLogic);
   fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
   console.log('Successfully replaced handlePhoneSubmit');
} else {
   console.log('Regex did not match handlePhoneSubmit');
}
