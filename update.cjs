const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const newHandlePhoneSubmit = `  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(phone);
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      return setError(lang === 'en' ? 'Please enter a valid Egyptian mobile number (e.g. 01012345678)' : 'يرجى إدخال رقم موبايل مصري صحيح (مثال: 01012345678)');
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
      setOtpCountdown(60);
      setStep('otp_verify');
    } catch (err) {
      setError('حدث خطأ أثناء طلب الرمز: ' + err.message);
    }
    setLoading(false);
  };`;

content = content.replace(/const handlePhoneSubmit = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/, newHandlePhoneSubmit);

const newSendWhatsAppOtp = `  const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    try {
      const cred = await signInAnonymously(auth);
      const uid = cred.user.uid;
      const reqId = \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
      await set(ref(db, \`PendingOtpRequests/\${reqId}\`), {
        phone: cleanPhone,
        uid: uid,
        createdAt: Date.now()
      });
      setOtpCountdown(60);
    } catch (err) {
      throw err;
    }
  };`;

content = content.replace(/const sendWhatsAppOtp = async \(targetPhone\) => \{[\s\S]*?console\.warn\('PendingOtpRequests write failed:', writeErr\.message\);\n    \}\n  \};/, newSendWhatsAppOtp);

const newHandleVerifyOtp = `  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      return setError(lang === 'en' ? 'Please enter the 6-digit verification code' : 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
    }
    setError('');
    setLoading(true);

    try {
      const cleanPhone = normalizePhone(phone);
      const uid = auth.currentUser.uid;
      const reqId = \`ver_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;

      const { onValue } = require('firebase/database');
      const phoneRef = ref(db, \`UidToPhone/\${uid}\`);
      
      let verified = false;
      const unsub = onValue(phoneRef, (snap) => {
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
          setError('رمز التحقق غير صحيح أو منتهي الصلاحية');
          setLoading(false);
        }
      }, 15000);
    } catch (err) {
      setError('حدث خطأ أثناء التحقق: ' + err.message);
      setLoading(false);
    }
  };`;

content = content.replace(/const handleVerifyOtp = async \(e\) => \{[\s\S]*?setStep\('complete_profile'\);\n    \}\n  \};/, newHandleVerifyOtp);

content = content.replace(/const \[generatedOtp, setGeneratedOtp\] = useState\(''\);\n/, '');
content = content.replace(/import \{ httpsCallable \} from 'firebase\/functions';\n/, '');

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Replacements completed successfully');
