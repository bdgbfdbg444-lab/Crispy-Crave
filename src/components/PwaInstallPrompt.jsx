import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PwaInstallPrompt() {
  const { lang } = useLanguage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if running inside APK or standalone PWA
    const ua = navigator.userAgent || '';
    const isNative = /TheBlackBoxApp/i.test(ua) || window.isNativeApp === true || window.TheBlackBoxNative === true;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isNative || isStandalone) {
      return; // Already in app, never show
    }

    // 2. Check if dismissed recently (within 5 days)
    const dismissedTime = localStorage.getItem('theblackbox_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 5 * 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. Detect iOS Safari
    const isApple = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isApple);

    // 4. Capture beforeinstallprompt for Android Chrome / Edge
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 2.5 seconds
      setTimeout(() => setShowPrompt(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // On iOS Safari, beforeinstallprompt does not exist, so show prompt after 3 seconds
    let iosTimer = null;
    if (isApple) {
      iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('theblackbox_pwa_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install error:', err);
      }
    } else {
      // Fallback: direct download APK
      const link = document.createElement('a');
      link.href = './TheBlackBox.apk';
      link.download = 'TheBlackBox.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-20 md:bottom-8 left-4 right-4 max-w-sm mx-auto z-50 bg-[#141414]/95 border border-brand-red/50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-text-light shadow-black/80"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* App Icon */}
            <div className="w-11 h-11 rounded-xl bg-black border border-brand-red/40 flex items-center justify-center p-1.5 shrink-0 shadow-md shadow-brand-red/10">
              <img
                src="./icons/icon-192.png"
                alt="App Icon"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-white leading-tight">
                {lang === 'en' ? 'The Black Box App' : 'تطبيق The Black Box'}
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
                {lang === 'en'
                  ? 'Add to home screen for faster ordering'
                  : 'أضف التطبيق لشاشتك الرئيسية لطلب أسرع'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors shrink-0"
            title="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Buttons */}
        {!showIOSGuide ? (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800/80">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 active:scale-98 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-red/20"
            >
              <Smartphone size={15} />
              <span>{lang === 'en' ? 'Add to Home Screen' : 'تثبيت الآن'}</span>
            </button>

            <a
              href="./TheBlackBox.apk"
              download="TheBlackBox.apk"
              onClick={() => handleDismiss()}
              className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-text-light py-2 px-3 rounded-xl text-xs font-bold transition-colors border border-gray-700"
              title="تحميل APK"
            >
              <Download size={14} />
              <span>{lang === 'en' ? 'APK' : 'تحميل APK'}</span>
            </a>
          </div>
        ) : (
          /* iOS Step-by-step Guide */
          <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-text-muted space-y-1.5 bg-black/40 p-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-white font-bold text-[11px]">
              <Share size={13} className="text-brand-red" />
              <span>{lang === 'en' ? 'Install on iPhone:' : 'طريقة الإضافة على الآيفون:'}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              1. اضغط على زر المشاركة <span className="text-white font-bold">⎋</span> في أسفل المتصفح.
              <br />
              2. اختر <span className="text-white font-bold">(إضافة إلى الصفحة الرئيسية ⊕)</span>.
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
