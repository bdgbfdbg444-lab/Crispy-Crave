const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStart = "const handlePhoneSubmit = async (e) => {";
const targetEnd = "};\n\n  const handleLogin = async (e) => {";
const fullTarget = content.substring(
    content.indexOf(targetStart),
    content.indexOf(targetEnd) + "};\n\n".length
);

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
  };

  `;

content = content.replace(fullTarget, newLogic);
fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed handlePhoneSubmit properly');
