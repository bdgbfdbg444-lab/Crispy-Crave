const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = "const [step, setStep] = useState('phone');";

const stateAndLogic = `
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  
  const normalizePhone = (p) => {
    let cp = p.replace(/\\D/g, '');
    if (cp.startsWith('20') && cp.length === 12) cp = '0' + cp.substring(2);
    else if (cp.startsWith('0020') && cp.length === 14) cp = '0' + cp.substring(4);
    else if (cp.startsWith('+20') && cp.length === 13) cp = '0' + cp.substring(3);
    else if (cp.length === 10 && !cp.startsWith('0')) cp = '0' + cp;
    return cp;
  };

  const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    setGeneratedOtp(code);
    setOtpExpiry(expiry);
    
    const reqId = \`otp_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
    await set(ref(db, \`PendingOtpRequests/\${reqId}\`), {
      phone: cleanPhone,
      otp: code,
      createdAt: Date.now()
    });
    return code;
  };

  const handleConfirmOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) return setOtpError('يرجى إدخال الكود المكون من 6 أرقام.');
    if (Date.now() > otpExpiry) return setOtpError('الكود منتهي الصلاحية، يرجى طلب كود جديد.');
    if (otpInput.trim() !== generatedOtp) return setOtpError('الكود غير صحيح.');
    
    // OTP Success!
    setIsOtpModalOpen(false);
    setOtpError('');
    setOtpInput('');
    setLoading(true);
    try {
      const cleanPhone = normalizePhone(phone);
      const custRef = ref(db, \`CustomerLoginEmails/\${cleanPhone}\`);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        if (isForgotPasswordFlow) {
          setStep('set_password');
        } else {
          await signInAnonymously(auth);
          await refreshCustomerData(cleanPhone);
          setStep('dashboard');
        }
      } else {
        await signInAnonymously(auth);
        setStep('register');
      }
    } catch (err) {
      console.error(err);
      setOtpError('حدث خطأ أثناء فحص الحساب.');
    }
    setLoading(false);
  };
`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, targetStr + '\n' + stateAndLogic);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Injected state and logic!");
} else {
    console.log("Could not find step state.");
}
