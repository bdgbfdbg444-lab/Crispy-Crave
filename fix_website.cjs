const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// Replace handlePhoneSubmit
const startIdx1 = content.indexOf('const handlePhoneSubmit = async (e) => {');
const endIdx1 = content.indexOf('  };', startIdx1) + 4;
const newHandlePhoneSubmit = `const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(phone);
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      return setError(lang === 'en' ? 'Please enter a valid Egyptian mobile number' : 'يرجى إدخال رقم موبايل صحيح');
    }
    setError('');
    setLoading(true);

    try {
      const cred = await signInAnonymously(auth);
      const uid = cred.user.uid;
      const reqId = \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
      await set(ref(db, \`PendingOtpRequests/\${reqId}\`), {
        phone: cleanPhone,
        uid: uid,
        createdAt: Date.now()
      });
      setStep('otp_verify');
    } catch (err) {
      setError('Error: ' + err.message);
    }
    setLoading(false);
  };`;
content = content.substring(0, startIdx1) + newHandlePhoneSubmit + content.substring(endIdx1);

// Replace handleVerifyOtp
const startIdx2 = content.indexOf('const handleVerifyOtp = async (e) => {');
const endIdx2 = content.indexOf('  };', startIdx2) + 4;
const newHandleVerifyOtp = `const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) return setError('Invalid OTP');
    setError('');
    setLoading(true);

    try {
      const cleanPhone = normalizePhone(phone);
      const uid = auth.currentUser.uid;
      const reqId = \`ver_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
      const { onValue } = require('firebase/database');
      
      let verified = false;
      const unsub = onValue(ref(db, \`UidToPhone/\${uid}\`), (snap) => {
        if (snap.exists() && snap.val() === cleanPhone) {
          verified = true;
          unsub();
          setVerifiedOtpPhone(cleanPhone);
          get(ref(db, \`PublicCustomers/\${cleanPhone}\`)).then(custSnap => {
            if (custSnap.exists()) {
              setIsExistingCustomer(true);
              setStep('set_password');
            } else {
              setIsExistingCustomer(false);
              setStep('complete_profile');
            }
            setLoading(false);
          });
        }
      });

      await set(ref(db, \`PendingOtpVerifications/\${reqId}\`), {
        phone: cleanPhone,
        code: otpInput.trim(),
        uid: uid,
        createdAt: Date.now()
      });

      setTimeout(() => {
        if (!verified) {
          unsub();
          setError('Timeout verifying OTP');
          setLoading(false);
        }
      }, 15000);
    } catch (err) {
      setError('Error: ' + err.message);
      setLoading(false);
    }
  };`;
content = content.substring(0, startIdx2) + newHandleVerifyOtp + content.substring(endIdx2);

// Replace sendWhatsAppOtp
const startIdx3 = content.indexOf('const sendWhatsAppOtp = async (targetPhone) => {');
const endIdx3 = content.indexOf('  };', startIdx3) + 4;
const newSendWhatsAppOtp = `const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const cred = await signInAnonymously(auth);
    const uid = cred.user.uid;
    const reqId = \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
    await set(ref(db, \`PendingOtpRequests/\${reqId}\`), {
      phone: cleanPhone, uid: uid, createdAt: Date.now()
    });
  };`;
content = content.substring(0, startIdx3) + newSendWhatsAppOtp + content.substring(endIdx3);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Done!');
