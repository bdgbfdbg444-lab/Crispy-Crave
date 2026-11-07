import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ExperienceConsentModal() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  
  const [prefs, setPrefs] = useState({
    essential: true,
    location: true,
    notifications: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const consent = localStorage.getItem('bb_cookie_consent');
    if (consent) return;

    const path = window.location.hash || window.location.pathname;
    if (path.includes('/kds') || path.includes('/driver')) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const executeConsents = async (allowAudioAndGps = true, allowNotifications = true) => {
    // 1. Unlock Audio
    if (allowAudioAndGps) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') await ctx.resume();
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }
      } catch (_) {}
    }

    // 2. Notifications
    if (allowNotifications && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }

    // 3. Geolocation
    if (allowAudioAndGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            localStorage.setItem('bb_last_known_lat', pos.coords.latitude.toString());
            localStorage.setItem('bb_last_known_lng', pos.coords.longitude.toString());
            window.dispatchEvent(new CustomEvent('BB_LOCATION_DETECTED', {
              detail: { lat: pos.coords.latitude, lng: pos.coords.longitude }
            }));
          } catch (_) {}
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  };

  const handleAcceptAll = async () => {
    await executeConsents(true, true);
    try {
      localStorage.setItem('bb_cookie_consent', 'accepted');
      localStorage.setItem('bb_consent_timestamp', Date.now().toString());
    } catch (_) {}
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    try {
      localStorage.setItem('bb_cookie_consent', 'rejected');
      localStorage.setItem('bb_consent_timestamp', Date.now().toString());
    } catch (_) {}
    setIsVisible(false);
  };

  const handleSavePreferences = async () => {
    await executeConsents(prefs.location, prefs.notifications);
    try {
      localStorage.setItem('bb_cookie_consent', JSON.stringify(prefs));
      localStorage.setItem('bb_consent_timestamp', Date.now().toString());
    } catch (_) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const isRtl = lang !== 'en';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="fixed bottom-20 sm:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-[9999] sm:max-w-[420px] w-auto bg-[#141416]/95 border border-brand-red/30 text-white rounded-2xl p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl"
      >
        {/* Header & Close */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-red/15 border border-brand-red/30 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4 text-brand-red" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              {lang === 'en' ? 'Cookies & Experience' : 'الكوكيز وتجربة الطلب'}
            </h3>
          </div>

          <button
            onClick={handleRejectAll}
            aria-label="Close"
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Short & Concise Text */}
        <p className="text-gray-300 text-xs sm:text-[13px] leading-relaxed mb-4">
          {lang === 'en'
            ? 'We use cookies and location to ensure fast delivery, save your cart, and alert you when your food is ready.'
            : 'نستخدم ملفات الكوكيز والموقع لضمان دقة التوصيل، وحفظ سلتك، وتنبيهك فور جاهزية وجبتك.'}
        </p>

        {/* Inline Preferences (Customize Mode) */}
        {showCustomize && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 mb-4 pt-3 border-t border-white/10 text-xs"
          >
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="font-semibold text-gray-200">
                {lang === 'en' ? 'Essential & Cart' : 'الملفات الأساسية وحفظ السلة'}
              </span>
              <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded font-bold">
                {lang === 'en' ? 'Required' : 'مفعل دائماً'}
              </span>
            </div>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors">
              <span className="font-semibold text-gray-200">
                {lang === 'en' ? 'GPS Location (Delivery)' : 'الموقع (GPS) لحساب الدليفري'}
              </span>
              <input
                type="checkbox"
                checked={prefs.location}
                onChange={(e) => setPrefs({ ...prefs, location: e.target.checked })}
                className="w-4 h-4 accent-brand-red rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors">
              <span className="font-semibold text-gray-200">
                {lang === 'en' ? 'Order Alerts & Chime' : 'تنبيهات الشاشة ورنين البيجر'}
              </span>
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => setPrefs({ ...prefs, notifications: e.target.checked })}
                className="w-4 h-4 accent-brand-red rounded cursor-pointer"
              />
            </label>
          </motion.div>
        )}

        {/* Buttons Row (Matching The Black Box Dark Theme) */}
        <div className="flex items-center gap-2">
          {showCustomize ? (
            <button
              onClick={handleSavePreferences}
              className="flex-1 py-2.5 px-4 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-red/25 cursor-pointer text-center active:scale-95"
            >
              {lang === 'en' ? 'Save Preferences' : 'حفظ التفضيلات'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowCustomize(true)}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                {lang === 'en' ? 'Customize' : 'تخصيص'}
              </button>

              <button
                onClick={handleRejectAll}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                {lang === 'en' ? 'Reject All' : 'رفض'}
              </button>

              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-3 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-red/30 cursor-pointer text-center active:scale-95"
              >
                {lang === 'en' ? 'Accept All' : 'قبول الكل'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
