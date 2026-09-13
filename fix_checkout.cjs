const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

const sendWhatsAppPattern = /const sendWhatsAppOtp = async[\s\S]*?return code;\n    \};/m;
const newSendWhatsApp = `const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);

    // 1. Server-side cooldown guard (120s / 2 minutes)
    try {
      await set(ref(db, \`OtpRateLimits/\${cleanPhone}\`), {
        lastRequestedAt: Date.now()
      });
    } catch (rateErr) {
      throw new Error(lang === 'en' 
        ? 'Please wait 2 minutes before requesting a new verification code.' 
        : 'يرجى الانتظار دقيقتين قبل طلب رمز جديد.');
    }

    setOtpCountdown(120);

    const uid = currentUser?.uid;
    if (!uid) throw new Error("Authentication error. Please refresh the page.");

    // 2. Send request to POS (with uid so POS accepts it)
    const reqId = \`otp_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
    await set(ref(db, \`PendingOtpRequests/\${reqId}\`), {
      phone: cleanPhone,
      uid: uid,
      createdAt: Date.now()
    });
  };`;

content = content.replace(sendWhatsAppPattern, newSendWhatsApp);

const confirmOtpPattern = /const handleConfirmOtp = \(e\) => \{[\s\S]*?setShowPayment\(true\);\n    \};/m;
const newConfirmOtp = `const handleConfirmOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError(lang === 'en' ? 'Please enter the 6-digit verification code.' : 'يرجى إدخال رمز التحقق.');
      return;
    }
    
    const cleanPhone = normalizePhone(formData.customerPhone);
    const uid = currentUser?.uid;
    if (!uid) return;
    
    setIsSendingOtp(true);
    setOtpError('');
    
    const { onValue, off } = await import('firebase/database');
    
    let verified = false;
    const dispRef = ref(db, \`UidToPhone/\${uid}\`);
    const unsub = onValue(dispRef, (snap) => {
      if (snap.exists() && snap.val() === cleanPhone) {
        verified = true;
        off(dispRef, 'value', unsub);
        setVerifiedPhone(cleanPhone);
        setIsOtpModalOpen(false);
        setIsSendingOtp(false);
        setOtpError('');
        setOtpInput('');
        setShowPayment(true);
      }
    });
    
    const reqId = \`ver_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
    await set(ref(db, \`PendingOtpVerifications/\${reqId}\`), {
      phone: cleanPhone,
      code: otpInput.trim(),
      uid: uid,
      createdAt: Date.now()
    });
    
    setTimeout(() => {
      if (!verified) {
        off(dispRef, 'value', unsub);
        setOtpError(lang === 'en' ? 'Incorrect or expired verification code.' : 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
        setIsSendingOtp(false);
      }
    }, 10000);
  };`;

content = content.replace(confirmOtpPattern, newConfirmOtp);

fs.writeFileSync('src/pages/CheckoutPage.jsx', content, 'utf8');
console.log('Replaced CheckoutPage OTP logic');
