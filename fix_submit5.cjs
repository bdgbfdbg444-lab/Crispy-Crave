const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStart = "const handlePhoneSubmit = async (e) => {";
const targetEnd = "  const handleLogin = async (e) => {";

const idxStart = content.indexOf(targetStart);
const idxEnd = content.indexOf(targetEnd);

if (idxStart !== -1 && idxEnd !== -1) {
    const targetStr = content.substring(idxStart, idxEnd);
    
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
  };

`;
    content = content.replace(targetStr, newLogic);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Successfully replaced handlePhoneSubmit!");
} else {
    console.log("Could not find start or end index.");
}
