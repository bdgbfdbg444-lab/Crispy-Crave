const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// We need to insert the OTP state and functions.
const importTarget = "import { ref, get, set, update } from 'firebase/database';";
const importReplace = "import { ref, get, set, update } from 'firebase/database';\nimport { ShieldCheck, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';\nimport { motion, AnimatePresence } from 'framer-motion';";

content = content.replace(importTarget, importReplace);

const stateTarget = "const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');";
const stateReplace = `const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);`;

content = content.replace(stateTarget, stateReplace);

const timerTarget = /useEffect\(\(\) => \{\n\s*if \(\!authLoading\).*?\}, \[currentUser, customerData, authLoading\]\);/s;
const timerReplace = `${content.match(timerTarget)[0]}
  
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    setGeneratedOtp(code);
    setOtpExpiry(expiry);
    setOtpCountdown(120);
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
        setIsExistingCustomer(true);
        if (isForgotPasswordFlow) {
          setStep('set_password');
        } else {
          // Check if already authenticated, otherwise we need to sign them in.
          // Wait, if they are logging in via OTP, they need an auth token!
          // We will use signInAnonymously to give them a valid session.
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
    }
    setLoading(false);
  };
`;
content = content.replace(timerTarget, timerReplace);


const phoneSubmitTarget = /const handlePhoneSubmit = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/m;
const phoneSubmitReplace = `const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');
    setError('');
    setIsSendingOtp(true);
    setLoading(true);
    try {
      await sendWhatsAppOtp(phone);
      setIsOtpModalOpen(true);
    } catch (err) {
      setError('حدث خطأ أثناء إرسال كود واتساب');
    }
    setIsSendingOtp(false);
    setLoading(false);
  };`;
content = content.replace(phoneSubmitTarget, phoneSubmitReplace);

const forgotPassTarget = /const handleForgotPassword = async \(\) => \{[\s\S]*?setIsForgotPasswordFlow\(true\);/m;
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
    }`;
content = content.replace(forgotPassTarget, forgotPassReplace);


const otpModalUI = `
      <AnimatePresence>
        {isOtpModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-black-surface border border-brand-red/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-text-light">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-light">تأكيد ملكية رقم الهاتف</h3>
                  <p className="text-xs text-text-muted mt-0.5">رسالة واتساب لحماية حسابك</p>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                <MessageSquare className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-text-muted leading-relaxed">
                  تم إرسال كود تحقق مكون من 6 أرقام على واتساب الرقم ({phone}). يرجى إدخاله للمتابعة:
                </p>
              </div>
              <form onSubmit={handleConfirmOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">أدخل رمز التحقق (6 أرقام)</label>
                  <input type="text" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\\D/g, ''))} placeholder="------" className="w-full bg-black-primary border border-brand-red-dark/40 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-text-light focus:outline-none focus:border-brand-red" autoFocus />
                </div>
                {otpError && <p className="text-xs text-brand-red font-bold flex items-center gap-1.5"><AlertCircle size={14} />{otpError}</p>}
                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={() => sendWhatsAppOtp(phone)} disabled={otpCountdown > 0 || isSendingOtp} className="text-xs text-brand-red hover:underline disabled:opacity-50 disabled:no-underline font-bold flex items-center gap-1">
                    <RefreshCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                    {otpCountdown > 0 ? \`إعادة الإرسال بعد (\${otpCountdown} ث)\` : 'إعادة إرسال الكود'}
                  </button>
                  <button type="button" onClick={() => { setIsOtpModalOpen(false); setOtpError(''); }} className="text-xs text-text-muted hover:text-white">إلغاء</button>
                </div>
                <button type="submit" disabled={otpInput.length !== 6 || loading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30">
                  {loading ? 'جاري التحقق...' : 'تأكيد ومتابعة'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

const renderTarget = "return (\n    <div className=";
const renderReplace = `return (\n    <div className=`;

content = content.replace(renderTarget, otpModalUI + renderTarget);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('OTP logic restored!');
