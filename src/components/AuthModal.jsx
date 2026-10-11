import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../firebase';
import { ref, set, get, onValue, off } from 'firebase/database';
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import AddressMapPicker from './AddressMapPicker';
import { getDeviceId, getClientIp, checkLocalDailyOtpLimit, recordLocalOtpAttempt } from '../utils/deviceTracker';

const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export default function AuthModal({ isOpen, onClose, onSuccess, zonesList = [] }) {
  const { lang } = useLanguage();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loginTab, setLoginTab] = useState('otp'); // 'otp' | 'password'
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login Fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Register Address
  const [mapAddress, setMapAddress] = useState({
    zone: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    lat: 31.2001,
    lng: 29.9187,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // OTP Fields
  const [otpReqId, setOtpReqId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const normalizePhone = (p) => {
    let cp = p.replace(/\D/g, '');
    if (cp.startsWith('20') && cp.length === 12) cp = '0' + cp.substring(2);
    else if (cp.startsWith('0020') && cp.length === 14) cp = '0' + cp.substring(4);
    else if (cp.startsWith('+20') && cp.length === 13) cp = '0' + cp.substring(3);
    else if (cp.length === 10 && !cp.startsWith('0')) cp = '0' + cp;
    return cp;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(loginPhone);
    if (!EGYPTIAN_PHONE_REGEX.test(cleanPhone)) {
      return setError(lang === 'en' ? 'Enter a valid Egyptian number (e.g. 01012345678)' : 'أدخل رقم مصري صحيح (مثال: 01012345678)');
    }

    setLoading(true);
    setError('');
    
    if (loginTab === 'password') {
      if (!loginPassword) {
        setLoading(false);
        return setError(lang === 'en' ? 'Password is required' : 'كلمة المرور مطلوبة');
      }
      try {
        const custRef = ref(db, `CustomerLoginEmails/${cleanPhone}`);
        const custSnap = await get(custRef);
        if (!custSnap.exists()) throw new Error('not_found');
        const authEmail = custSnap.val();
        await signInWithEmailAndPassword(auth, authEmail, loginPassword);
        onSuccess(cleanPhone);
        onClose();
      } catch (err) {
        setError(lang === 'en' ? 'Incorrect credentials or account not found.' : 'بيانات الدخول غير صحيحة أو الحساب غير موجود.');
      } finally {
        setLoading(false);
      }
    } else {
      // OTP Flow for Login
      try {
        const custRef = ref(db, `CustomerLoginEmails/${cleanPhone}`);
        const custSnap = await get(custRef);
        if (!custSnap.exists()) {
          setLoading(false);
          return setError(lang === 'en' ? 'Account not found. Please register.' : 'الحساب غير موجود، يرجى إنشاء حساب جديد.');
        }

        const localCheck = checkLocalDailyOtpLimit();
        if (!localCheck.allowed) {
          setLoading(false);
          return setError(localCheck.message);
        }

        if (!auth.currentUser) await signInAnonymously(auth);

        const reqId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const deviceId = getDeviceId();
        const clientIp = await getClientIp();
        await set(ref(db, `PendingOtpRequests/${reqId}`), {
          phone: cleanPhone,
          uid: auth.currentUser.uid,
          deviceId,
          clientIp,
          createdAt: Date.now()
        });
        recordLocalOtpAttempt();
        
        setOtpReqId(reqId);
        setOtpCountdown(45);
        setStep('otp');
      setLoading(false);

      const resultRef = ref(db, `OtpResults/${reqId}`);
        onValue(resultRef, async (snapshot) => {
          const data = snapshot.val();
          if (data) {
            if (data.status === 'success') {
              await set(ref(db, `UidToPhone/${auth.currentUser.uid}`), cleanPhone);
              off(resultRef);
              setLoading(false);
              if (onSuccess) onSuccess(cleanPhone);
              if (onClose) onClose();
            } else if (data.status === 'failed') {
              setError(lang === 'en' ? 'Incorrect code.' : 'الكود غير صحيح.');
              off(resultRef);
              setLoading(false);
            } else if (data.status === 'daily_limit_exceeded') {
              setError(lang === 'en' ? 'Daily OTP limit reached (3 codes max per day). Please try again tomorrow.' : 'تم استنفاد الحد الأقصى لمحاولات إرسال الكود اليوم (3 محاولات كحد أقصى). يرجى المحاولة غداً.');
              off(resultRef);
              setStep('form');
              setLoading(false);
            } else if (data.status === 'rate_limited') {
              setError(lang === 'en' ? (data.message || 'Please wait before requesting another code.') : (data.message || 'يرجى الانتظار قبل طلب كود جديد.'));
              off(resultRef);
              setLoading(false);
            }
          }
        });
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
          setError(lang === 'en' ? 'This email is already registered. Please use a different email.' : 'هذا البريد الإلكتروني مسجل بالفعل، يرجى استخدام بريد إلكتروني آخر.');
        } else {
          setError(lang === 'en' ? 'An error occurred during registration. Please try again.' : 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
        }
        setLoading(false);
      }
    }
  };

  const handleRegisterInitiate = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      return setError(lang === 'en' ? 'Please accept terms & conditions.' : 'يرجى الموافقة على شروط الاستخدام.');
    }
    const cleanPhone = normalizePhone(regPhone);
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !mapAddress.zone || !mapAddress.street.trim() || !mapAddress.building.trim()) {
      return setError(lang === 'en' ? 'Please fill all required fields including Address details.' : 'يرجى تعبئة جميع الحقول المطلوبة بما فيها تفاصيل العنوان.');
    }
    if (!EGYPTIAN_PHONE_REGEX.test(cleanPhone)) {
      return setError(lang === 'en' ? 'Enter a valid Egyptian number (e.g. 01012345678)' : 'أدخل رقم مصري صحيح (مثال: 01012345678)');
    }

    
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_\-]{8,}$/;
      if (!passwordRegex.test(regPassword)) {
        return setError(lang === 'en' ? 'Password must be at least 8 characters and contain letters and numbers.' : 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل وتحتوي على أرقام وحروف.');
      }
      setLoading(true);
    setError('');

    try {
      const custSnap = await get(ref(db, `CustomerLoginEmails/${cleanPhone}`));
      if (custSnap.exists()) {
        setLoading(false);
        return setError(lang === 'en' ? 'Phone already registered.' : 'رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول.');
      }

      const localCheck = checkLocalDailyOtpLimit();
      if (!localCheck.allowed) {
        setLoading(false);
        return setError(localCheck.message);
      }

      if (!auth.currentUser) await signInAnonymously(auth);

      const reqId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const deviceId = getDeviceId();
      const clientIp = await getClientIp();
      await set(ref(db, `PendingOtpRequests/${reqId}`), {
        phone: cleanPhone,
        uid: auth.currentUser.uid,
        deviceId,
        clientIp,
        createdAt: Date.now()
      });
      recordLocalOtpAttempt();
      
      setOtpReqId(reqId);
      setOtpCountdown(45);
      setStep('otp');
      setLoading(false);

      const resultRef = ref(db, `OtpResults/${reqId}`);
      onValue(resultRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.status === 'success') {
            finalizeRegistration(cleanPhone, reqId, resultRef);
          } else if (data.status === 'failed') {
            setError(lang === 'en' ? 'Incorrect code.' : 'كود التحقق غير صحيح.');
            off(resultRef);
            setLoading(false);
          } else if (data.status === 'daily_limit_exceeded') {
            setError(lang === 'en' ? 'Daily OTP limit reached (3 codes max per day). Please try again tomorrow.' : 'تم استنفاد الحد الأقصى لمحاولات إرسال الكود اليوم (3 محاولات كحد أقصى). يرجى المحاولة غداً.');
            off(resultRef);
            setStep('form');
            setLoading(false);
          } else if (data.status === 'rate_limited') {
            setError(lang === 'en' ? (data.message || 'Please wait before requesting another code.') : (data.message || 'يرجى الانتظار قبل طلب كود جديد.'));
            off(resultRef);
            setLoading(false);
          }
        }
      });
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'en' ? 'This email is already registered. Please use a different email.' : 'هذا البريد الإلكتروني مسجل بالفعل، يرجى استخدام بريد إلكتروني آخر.');
      } else {
        setError(lang === 'en' ? 'An error occurred during registration. Please try again.' : 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
      }
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) return setError(lang === 'en' ? 'Enter a 6-digit code.' : 'أدخل الكود المكون من 6 أرقام.');
    setLoading(true);
    setError('');
    const cleanPhone = normalizePhone(mode === 'register' ? regPhone : loginPhone);
    await set(ref(db, `OtpValidations/${otpReqId}`), {
      guess: otpInput.trim(),
      phone: cleanPhone,
      uid: auth.currentUser.uid
    });
  };

  const finalizeRegistration = async (cleanPhone, reqId, resultRef) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = userCredential.user;
      await updateProfile(user, { displayName: regName });

      await set(ref(db, `UidToPhone/${user.uid}`), cleanPhone);
      await set(ref(db, `CustomerLoginEmails/${cleanPhone}`), regEmail);

      const addressObj = {
        id: Date.now().toString(),
        zone: mapAddress.zone,
        street: mapAddress.street,
        building: mapAddress.building,
        floor: mapAddress.floor,
        apartment: mapAddress.apartment,
        lat: mapAddress.lat,
        lng: mapAddress.lng,
        fullAddress: `${mapAddress.street}, عماره ${mapAddress.building}${mapAddress.floor ? `, دور ${mapAddress.floor}` : ''}`,
        isDefault: true,
        label: 'المنزل'
      };

      await set(ref(db, `PublicCustomers/${cleanPhone}`), {
        Name: regName,
        Phone: cleanPhone,
        Email: regEmail,
        Zone: mapAddress.zone,
        zone: mapAddress.zone,
        addresses: [addressObj],
        CreatedAt: new Date().toISOString()
      });

      off(resultRef);
      setOtpReqId(null);
      setLoading(false);
      
      if (onSuccess) onSuccess(cleanPhone);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(lang === 'en' ? 'This email is already registered. Please use a different email.' : 'هذا البريد الإلكتروني مسجل بالفعل، يرجى استخدام بريد إلكتروني آخر.');
      } else {
        setError(lang === 'en' ? 'An error occurred during registration. Please try again.' : 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] block bg-[#070707]/95 overflow-y-auto"
        dir={lang === 'en' ? 'ltr' : 'rtl'}
      >
        <button onClick={onClose} className="fixed top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
          <X size={24} />
        </button>

        <div className="w-full max-w-7xl mx-auto my-0 pt-24 pb-10 md:py-16 px-4 md:px-8 flex flex-col lg:flex-row items-stretch gap-10 min-h-screen lg:min-h-0">
          
          {/* Left Column - Image */}
          <div className="hidden lg:flex lg:w-5/12 relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 min-h-[600px] flex-col justify-between group">
            <img src="https://firebasestorage.googleapis.com/v0/b/restaurantpos-9fa81.appspot.com/o/images%2Fburger_login.jpg?alt=media" alt="The Black Box" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => e.target.src='https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop'} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>
            
            <div className="relative z-10 p-8 pt-10">
              <button onClick={() => {setMode(mode === 'login' ? 'register' : 'login'); setError(''); setStep('form');}} className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                {mode === 'login' ? (lang === 'en' ? 'New Member? Sign Up' : 'عضو جديد؟ إنشاء حساب') : (lang === 'en' ? 'Existing Member? Login' : 'عضو سابق؟ تسجيل الدخول')}
              </button>
            </div>

            <div className="relative z-10 p-8 pb-10">
              <h2 className="text-4xl font-black text-white mb-3">TheBlackBox</h2>
              <p className="text-gray-300 font-medium">{lang === "en" ? "The Premium Brisket & Original Nashville Crunch Experience" : "تجربة البريسكت الفاخر وناشفيل كرانش الأصلي"}</p>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="w-full lg:w-7/12 flex flex-col justify-center">
            
            <div className="lg:hidden flex justify-center mb-6">
              <button onClick={() => {setMode(mode === 'login' ? 'register' : 'login'); setError(''); setStep('form');}} className="px-5 py-2.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-bold hover:bg-white/10 transition-colors shadow-lg">
                {mode === 'login' ? (lang === 'en' ? 'New Member? Sign Up' : 'عضو جديد؟ إنشاء حساب') : (lang === 'en' ? 'Existing Member? Login' : 'عضو سابق؟ تسجيل الدخول')}
              </button>
            </div>

            
            <div className="bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#e52d3a] to-transparent opacity-80"></div>

              {step === 'form' && mode === 'login' && (
                <div className="space-y-6">
                  <div className="mb-8 text-center sm:text-right">
                    <span className="inline-block px-4 py-1.5 bg-[#e52d3a]/10 border border-[#e52d3a]/30 rounded-full text-[#e52d3a] text-xs font-bold mb-4">{lang === "en" ? "Member Portal • The Flavor Box" : "بوابة الأعضاء • صندوق النكهة"}</span>
                    <h2 className="text-3xl font-black text-white">{lang === "en" ? "Login & Track Your Order" : "تسجيل الدخول ومتابعة طلبك"}</h2>
                  </div>

                  <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-xl mb-6">
                    <button type="button" onClick={() => setLoginTab('otp')} className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${loginTab === 'otp' ? 'bg-[#25D366] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                      {lang === 'en' ? 'WhatsApp OTP' : 'رمز التحقق عبر واتساب (OTP)'}
                    </button>
                    <button type="button" onClick={() => setLoginTab('password')} className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${loginTab === 'password' ? 'bg-[#333] text-white shadow-lg border border-white/10' : 'text-gray-400 hover:text-white'}`}>
                      {lang === 'en' ? 'Password Login' : 'الدخول بكلمة المرور'}
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                      <AlertCircle size={18} /> {error}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    {loginTab === 'otp' && (
                      <div className="p-4 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl text-[#25D366] text-sm font-medium flex items-center gap-3">
                        <span className="flex-shrink-0 animate-pulse">💬</span>
                        {lang === 'en' ? 'A direct verification code will be sent via WhatsApp immediately' : 'سيتم إرسال رمز التحقق المباشر عبر WhatsApp إلى رقمك فوراً'}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">{lang === "en" ? "Phone Number" : "رقم الجوال"}</label>
                      <div className="flex" dir="ltr">
                        <div className="flex items-center justify-center px-4 bg-[#1a1a1a] border border-white/10 rounded-l-xl text-white font-bold border-r-0">+20</div>
                        <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="10 1234 5678" className="w-full bg-[#121212] border border-white/10 text-white p-3.5 rounded-r-xl focus:outline-none focus:border-[#e52d3a] tracking-wider font-mono text-lg" required />
                      </div>
                    </div>

                    {loginTab === 'password' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">{lang === "en" ? "Password" : "كلمة المرور"}</label>
                        <div className="relative">
                          <input type={showLoginPassword ? "text" : "password"} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-[#121212] border border-white/10 text-white p-3.5 pr-12 rounded-xl focus:outline-none focus:border-[#e52d3a]" dir="ltr" required />
                          <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-4 text-gray-500 hover:text-white">
                            {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full mt-6 bg-[#e52d3a] hover:bg-[#b91c28] text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(229,45,58,0.3)] disabled:opacity-50 text-lg">
                      {loading ? (lang === 'en' ? 'Processing...' : 'جاري المعالجة...') : (lang === 'en' ? 'Login' : 'تسجيل الدخول')}
                    </button>
                  </form>
                </div>
              )}

              {step === 'form' && mode === 'register' && (
                <div className="space-y-5">
                  <div className="mb-6">
                    <span className="inline-block px-4 py-1.5 bg-[#e52d3a]/10 border border-[#e52d3a]/30 rounded-full text-[#e52d3a] text-xs font-bold mb-3">{lang === "en" ? "Exclusive Membership • Join The Flavor Box" : "عضوية حصرية • انضمام لصندوق النكهة"}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">{lang === "en" ? "Create Account & Discover Smoked Secrets" : "أنشئ حسابك واكتشف أسرار المذاق المدخن"}</h2>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                      <AlertCircle size={18} /> {error}
                    </div>
                  )}

                  <form onSubmit={handleRegisterInitiate} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">{lang === 'en' ? 'Full Name' : 'الاسم الكامل'} <span className="text-[#e52d3a]">*</span></label>
                      <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder={lang === "en" ? "e.g., John Doe" : "مثال: سلمان بن عبد العزيز"} className="w-full bg-[#121212] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-[#e52d3a]" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">{lang === 'en' ? 'Phone Number' : 'رقم الجوال'} <span className="text-[#e52d3a]">*</span></label>
                        <div className="flex" dir="ltr">
                          <div className="flex items-center justify-center px-3 bg-[#1a1a1a] border border-white/10 rounded-l-xl text-white font-bold border-r-0 text-sm">+20</div>
                          <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="10 1234 5678" className="w-full bg-[#121212] border border-white/10 text-white p-3 rounded-r-xl focus:outline-none focus:border-[#e52d3a] tracking-wider font-mono" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">{lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'} <span className="text-[#e52d3a]">*</span></label>
                        <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder={lang === "en" ? "name@example.com" : "البريد الإلكتروني"} className="w-full bg-[#121212] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-[#e52d3a]" dir="ltr" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">{lang === 'en' ? 'Password' : 'كلمة المرور'} <span className="text-[#e52d3a]">*</span></label>
                      <div className="relative">
                        <input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full bg-[#121212] border border-white/10 text-white p-3 pr-12 rounded-xl focus:outline-none focus:border-[#e52d3a]" dir="ltr" required />
                        <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-3.5 text-gray-500 hover:text-white">
                          {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 border border-white/10 rounded-2xl overflow-hidden bg-[#161616]">
                      <div className="bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 border-b border-white/10">
                        <MapPin size={18} className="text-[#e52d3a]" />
                        <span className="font-bold text-white text-sm">{lang === "en" ? "Delivery Address (For hot & precise delivery)" : "عنوان التوصيل (للتوصيل ساخناً وبدقة)"}</span>
                      </div>
                      <div className="p-4">
                        <AddressMapPicker value={mapAddress} onChange={setMapAddress} error={null} zonesList={zonesList} lang={lang} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-5 h-5 rounded border-white/20 bg-[#121212] text-[#e52d3a] focus:ring-0 focus:ring-offset-0" />
                      <label htmlFor="terms" className="text-sm text-gray-300">
                        {lang === "en" ? <>I agree to the <a href="#" className="text-white font-bold underline">Terms of Use</a> and Privacy Policy</> : <>أوافق على <a href="#" className="text-white font-bold underline">شروط الاستخدام</a> وسياسة الخصوصية</>}
                      </label>
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-4 bg-[#e52d3a] hover:bg-[#b91c28] text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(229,45,58,0.3)] disabled:opacity-50 text-lg flex items-center justify-center gap-2">
                      إنشاء الحساب وبدء الطلب
                    </button>
                  </form>
                </div>
              )}

              {step === 'otp' && (
                <div className="flex flex-col h-full justify-center text-center py-10">
                  <button onClick={() => setStep('form')} className="absolute top-8 right-8 text-gray-400 hover:text-white text-sm">
                    &larr; رجوع
                  </button>
                  
                  <div className="w-20 h-20 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#25D366]/20 shadow-[0_0_30px_rgba(37,211,102,0.2)]">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-3">{lang === "en" ? "Verify WhatsApp Number" : "تأكيد رقم الواتساب"}</h2>
                  <p className="text-gray-400 mb-8">
                    أرسلنا لك كود من 6 أرقام على الرقم <br/> <b className="text-white text-lg font-mono tracking-widest mt-2 block" dir="ltr">{mode === 'register' ? regPhone : loginPhone}</b>
                  </p>

                  {error && (
                    <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="max-w-xs mx-auto w-full space-y-6">
                    <input 
                      type="text" 
                      maxLength={6}
                      autoFocus
                      placeholder="••••••"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[1em] font-black text-3xl bg-[#121212] border-2 border-white/10 text-white rounded-xl p-4 focus:outline-none focus:border-[#25D366] transition-colors" 
                      dir="ltr" 
                    />
                    
                    <button type="submit" disabled={loading || otpInput.length !== 6} className="w-full bg-[#25D366] hover:bg-[#20bd59] text-black font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] disabled:opacity-50 text-lg">
                      {loading ? (lang === 'en' ? 'Verifying...' : 'جاري التأكيد...') : (lang === 'en' ? 'Instant Encrypted Verify' : 'تحقق مشفر فوري')}
                    </button>
                  </form>

                  <div className="mt-8 text-sm text-gray-500">
                    {otpCountdown > 0 ? (
                        <span>{lang === "en" ? `Resend in ${otpCountdown} seconds` : `إعادة الإرسال خلال ${otpCountdown} ثانية`}</span>
                    ) : (
                      <button type="button" onClick={mode === 'login' ? handleLoginSubmit : handleRegisterInitiate} className="text-white hover:underline font-bold">
                        إعادة إرسال الكود
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
