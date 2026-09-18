const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = /const handlePhoneSubmit = async \(e\) => \{[\s\S]*?setLoading\(false\);\n    \};/;
const replacement = `const handlePhoneSubmit = async (e) => {
      e.preventDefault();
      if (phone.length < 10) return setError('رقم الموبايل غير صحيح');
      setError('');
      setLoading(true);
  
      try {
        const cleanPhone = normalizePhone(phone);
        // Always send WhatsApp OTP for login/register
        await sendWhatsAppOtp(cleanPhone);
        setIsForgotPasswordFlow(false); // This is standard login, not forgot password
        setStep('otp');
      } catch (err) {
        setError('حدث خطأ أثناء إرسال الكود');
      }
      setLoading(false);
    };`;

if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Fixed handlePhoneSubmit to send OTP');
} else {
    console.log('Target not found for handlePhoneSubmit');
}
