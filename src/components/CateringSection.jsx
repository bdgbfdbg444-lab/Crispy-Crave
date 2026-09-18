import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Send, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { ref, set } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

export default function CateringSection({ websiteData }) {
  const { lang } = useLanguage();
  const { customerData, userPhone } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    guests: '',
    date: '',
    notes: ''
  });

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Auto-fill if logged in
  useEffect(() => {
    if (customerData?.Name || userPhone) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || customerData?.Name || '',
        phone: prev.phone || userPhone || ''
      }));
    }
  }, [customerData, userPhone]);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const normalizePhone = (phone) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('20') && p.length === 12) p = p.substring(2);
    else if (p.startsWith('+20')) p = p.substring(3);
    if (p.startsWith('0020')) p = p.substring(4);
    return p;
  };

  const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    setGeneratedOtp(code);
    setOtpExpiry(expiry);
    setOtpCountdown(120);

    const reqId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await set(ref(db, `PendingOtpRequests/${reqId}`), {
      phone: cleanPhone,
      uid: auth.currentUser.uid,
      otp: code,
      createdAt: Date.now()
    });

    return code;
  };

  const handleTriggerOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setOtpError('');
    try {
      await sendWhatsAppOtp(formData.phone);
    } catch (err) {
      setOtpError(lang === 'en' ? 'Failed to send OTP: ' + err.message : 'فشل إرسال الرمز: ' + err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitToWorker = async () => {
    setIsSubmitting(true);
    try {
      const WORKER_URL = "https://smoke-catering-bot.abusaudgaming.workers.dev";
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      setIsSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setIsSuccess(false);
        setFormData({ name: '', phone: '', guests: '', date: '', notes: '' });
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(lang === 'en' ? 'Failed to submit. Please try again.' : 'فشل في إرسال الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOtp = (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError(lang === 'en' ? 'Please enter the 6-digit verification code.' : 'يرجى إدخال كود التحقق المكون من 6 أرقام.');
      return;
    }
    if (Date.now() > otpExpiry) {
      setOtpError(lang === 'en' ? 'Verification code expired.' : 'انتهت صلاحية الكود.');
      return;
    }
    if (otpInput.trim() !== generatedOtp) {
      setOtpError(lang === 'en' ? 'Incorrect verification code.' : 'الكود غير صحيح.');
      return;
    }

    setIsOtpModalOpen(false);
    setOtpError('');
    setOtpInput('');
    submitToWorker();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(formData.phone);
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      alert(lang === 'en' ? "Please enter a valid 11-digit Egyptian phone number." : "برجاء إدخال رقم هاتف مصري صحيح (11 رقم)");
      return;
    }

    const isAuthVerified = Boolean(userPhone && normalizePhone(userPhone) === cleanPhone);

    if (!isAuthVerified) {
      setIsOtpModalOpen(true);
      setOtpError('');
      setOtpInput('');
      sendWhatsAppOtp(formData.phone).catch(() => {});
      return;
    }

    submitToWorker();
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = `${new Date().getFullYear() + 1}-12-31`;

  return (
    <section id="catering" className="py-24 bg-black-primary relative overflow-hidden" id="catering">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Image Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] group shadow-2xl shadow-brand-red/10 border border-white/5">
              <img 
                src={websiteData?.cateringImageUrl || "https://res.cloudinary.com/vgk0saib/image/upload/v1789401239/cqutdoqk1iptig3mjbkh.webp"}
                alt="Catering & Events"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black-primary via-black-primary/20 to-transparent opacity-80 pointer-events-none"></div>
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 right-6 lg:right-10 bg-brand-red p-6 rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 hover:scale-110 hover:-translate-y-2 transition-all duration-300 cursor-default">
                <div className="flex items-center gap-4 text-white">
                  <div>
                    <p className="text-sm font-bold opacity-90">{lang === 'en' ? (websiteData?.cateringBadgeLine1En || 'Discounts up to') : (websiteData?.cateringBadgeLine1 || 'خصومات تصل إلى')}</p>
                    <p className="text-2xl font-black">{lang === 'en' ? (websiteData?.cateringBadgeLine2En || '15% for groups') : (websiteData?.cateringBadgeLine2 || '15% للمجموعات')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-red/20 rounded-full blur-3xl -z-10"></div>
          </motion.div>

          {/* Text/Form Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 text-center lg:text-right"
          >
            <div className="inline-flex items-center gap-2 bg-black-surface/5 border border-white/10 rounded-full px-4 py-2 mb-6 text-brand-red">
              <Users size={18} />
              <span className="text-sm font-bold tracking-wide">{lang === 'en' ? 'Events & Gatherings' : 'عزومات وحفلات'}</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-text-light mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((lang === 'en' ? (websiteData?.cateringTitleEn || 'Make Your Gatherings <span class="text-brand-red">More Enjoyable</span>') : (websiteData?.cateringTitle || 'اجعل تجمعاتك <span class="text-brand-red">أكثر متعة</span>')), { ALLOWED_TAGS: ['span', 'br', 'b', 'strong', 'em'], ALLOWED_ATTR: ['class'] }) }} />
            
            <AnimatePresence mode="wait">
              {!showForm ? (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-lg text-gray-300 leading-relaxed mb-8 whitespace-pre-line">
                    {(lang === 'en' && websiteData?.cateringDescriptionEn ? websiteData?.cateringDescriptionEn : websiteData?.cateringDescription) || (lang === 'en' ? 'Whether it is a family gathering, friends meetup, or a special occasion, we prepared Saver Boxes to suit all group sizes.' : 'سواء كان لمة عائلة، خروجة أصحاب، أو مناسبة خاصة، جهزنا بوكسات التوفير تناسب كل الأحجام.')}
                  </p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 w-full sm:w-auto outline-none group mx-auto lg:mx-0"
                  >
                    <span>{lang === 'en' ? (websiteData?.cateringButtonTextEn || 'Book Now For Events') : (websiteData?.cateringButtonText || 'احجز الآن للحفلات')}</span>
                    <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-900/30 border border-green-500/50 rounded-2xl p-8 text-center"
                >
                  <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">رائع جداً!</h3>
                  <p className="text-green-200">
                    تم استلام طلبك بنجاح. سيقوم فريق الحفلات بالتواصل معك قريباً لتأكيد التفاصيل.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 text-right"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Name' : 'الاسم'}</label>
                      <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-red outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Phone Number' : 'رقم الهاتف'}</label>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-red outline-none transition-colors" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Number of People' : 'عدد الأفراد'}</label>
                      <input required type="number" name="guests" value={formData.guests} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-red outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Event Date' : 'تاريخ المناسبة'}</label>
                      <input required type="date" min={today} max={maxDate} name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-red outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Additional Details (Optional)' : 'تفاصيل إضافية (اختياري)'}</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-brand-red outline-none transition-colors resize-none"></textarea>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 bg-brand-red hover:bg-brand-red-dark disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> <span>{lang === 'en' ? 'Submit Request' : 'إرسال الطلب'}</span></>}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      disabled={isSubmitting}
                      className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                    >
                      {lang === 'en' ? 'Cancel' : 'إلغاء'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {isOtpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-black-surface border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
              dir={lang === 'en' ? 'ltr' : 'rtl'}
            >
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setIsOtpModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="text-brand-red" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-light">
                    {lang === 'en' ? 'Phone Verification' : 'تأكيد رقم الهاتف'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === 'en' 
                      ? 'Confirming phone number via WhatsApp OTP' 
                      : 'للتأكد من صحة رقمك، أرسلنا لك كود على الواتساب'}
                  </p>
                </div>
              </div>

              <div className="bg-black-primary/50 rounded-xl p-4 mb-6 border border-white/5">
                <p className="text-sm text-gray-300 leading-relaxed text-center">
                  {lang === 'en' 
                    ? `We sent a 6-digit verification code to WhatsApp on number (${formData.phone}). Please enter it below:` 
                    : `لقد أرسلنا كود مكون من 6 أرقام إلى واتساب الرقم (${formData.phone}). يرجى إدخاله للتحقق:`}
                </p>
              </div>

              <form onSubmit={handleConfirmOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 text-center">
                    {lang === 'en' ? 'Enter 6-Digit Code' : 'أدخل الكود (6 أرقام)'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="w-full bg-black-primary border border-brand-red/40 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] text-text-light focus:outline-none focus:border-brand-red transition-colors"
                    autoFocus
                  />
                </div>

                {otpError && (
                  <p className="text-xs text-brand-red font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                    <AlertCircle size={14} />
                    {otpError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerOtp}
                    disabled={otpCountdown > 0 || isSendingOtp}
                    className="text-xs text-brand-red hover:underline disabled:opacity-50 disabled:no-underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                    {otpCountdown > 0 
                      ? (lang === 'en' ? `Resend in (${otpCountdown}s)` : `إعادة الإرسال بعد (${otpCountdown} ث)`) 
                      : (lang === 'en' ? 'Resend WhatsApp Code' : 'إعادة إرسال الكود')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOtpModalOpen(false); setOtpError(''); }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {lang === 'en' ? 'Change Phone' : 'تغيير الرقم'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={otpInput.length !== 6 || isSubmitting}
                  className="w-full py-4 bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (lang === 'en' ? 'Confirm and Proceed' : 'تأكيد وإرسال الطلب')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
