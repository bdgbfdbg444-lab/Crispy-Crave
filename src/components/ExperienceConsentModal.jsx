import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ExperienceConsentModal() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  
  // Custom preferences
  const [prefs, setPrefs] = useState({
    essential: true, // always true
    analytics: true,
    notifications: true,
    location: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if consent was already handled
    const consent = localStorage.getItem('bb_cookie_consent');
    if (consent) {
      return;
    }

    // Do not show on isolated internal screens like KDS or Driver Portal
    const path = window.location.hash || window.location.pathname;
    if (path.includes('/kds') || path.includes('/driver')) {
      return;
    }

    // Show after 1.5s delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const executeConsents = async (allowAudioAndGps = true, allowNotifications = true) => {
    // 1. Audio Unlock (Web Audio Context)
    if (allowAudioAndGps) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }
      } catch (_) {}
    }

    // 2. Notifications Permission
    if (allowNotifications && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }

    // 3. Geolocation Permission
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
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="fixed bottom-20 sm:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-[9999] sm:max-w-[480px] w-auto bg-white text-gray-900 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-gray-200"
      >
        {/* Header & Close Button */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight leading-snug">
            {lang === 'en' ? 'We value your privacy' : 'نحن نهتم بخصوصيتك وتجربتك'}
          </h3>
          <button
            onClick={handleRejectAll}
            aria-label="Close"
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0 -mt-1 -mr-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Text */}
        <p className="text-gray-600 text-xs sm:text-[13px] leading-relaxed mb-5">
          {lang === 'en' ? (
            <>
              We use cookies, location services (GPS), and alert technologies to enhance your browsing experience, ensure accurate delivery ETA, and notify you when your food is ready. By clicking &quot;Accept All&quot;, you consent to our use of cookies and experience features.
            </>
          ) : (
            <>
              نحن نستخدم ملفات تعريف الارتباط (Cookies) وخدمات الموقع الجغرافي (GPS) والتنبيهات لتحسين تجربة تصفحك، وحساب وقت التوصيل بدقة، وتنبيهك فور جاهزية وجبتك. بالضغط على «قبول الكل»، أنت توافق على استخدامنا لهذه التقنيات.
            </>
          )}
        </p>

        {/* Expandable Preferences (Customize Mode) */}
        {showCustomize && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2.5 mb-5 pt-3 border-t border-gray-100 text-xs"
          >
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-bold text-gray-800">
                {lang === 'en' ? 'Essential & Cart Cookies' : 'الملفات الأساسية وحفظ السلة'}
              </span>
              <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">
                {lang === 'en' ? 'Required' : 'دائماً مفعل'}
              </span>
            </div>

            <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer">
              <span className="font-semibold text-gray-800">
                {lang === 'en' ? 'Live GPS Location' : 'الموقع الجغرافي (GPS) لحساب الدليفري'}
              </span>
              <input
                type="checkbox"
                checked={prefs.location}
                onChange={(e) => setPrefs({ ...prefs, location: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer">
              <span className="font-semibold text-gray-800">
                {lang === 'en' ? 'Order Alerts & Audio Chime' : 'تنبيهات الشاشة ورنين البيجر'}
              </span>
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => setPrefs({ ...prefs, notifications: e.target.checked })}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
            </label>
          </motion.div>
        )}

        {/* Buttons Row (Matching Image 3) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {showCustomize ? (
            <button
              onClick={handleSavePreferences}
              className="flex-1 py-2.5 px-4 bg-gray-950 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center"
            >
              {lang === 'en' ? 'Save Preferences' : 'حفظ التفضيلات'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowCustomize(true)}
                className="flex-1 py-2.5 px-3.5 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-950 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center"
              >
                {lang === 'en' ? 'Customize' : 'تخصيص'}
              </button>

              <button
                onClick={handleRejectAll}
                className="flex-1 py-2.5 px-3.5 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-950 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center"
              >
                {lang === 'en' ? 'Reject All' : 'رفض الكل'}
              </button>

              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2.5 px-3.5 bg-gray-950 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer text-center shadow-md"
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
