import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, CheckCircle, Share, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { APP_CONFIG } from '../config/appConfig';

export default function AppDownloadModal({ isOpen, onClose, deferredPrompt, onPwaInstalled }) {
  const { lang } = useLanguage();
  const [isIOS, setIsIOS] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent || '';
      const isApple = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      setIsIOS(isApple);
    }
  }, []);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    // Link to public APK file
    const link = document.createElement('a');
    link.href = './TheBlackBox.apk';
    link.download = 'TheBlackBox.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 4000);
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          if (onPwaInstalled) onPwaInstalled();
          onClose();
        }
      } catch (err) {
        console.error('PWA prompt error:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#121212] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-text-light z-10 overflow-hidden"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Subtle Top Red Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent opacity-80" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 bg-[#1A1A1A] border border-brand-red/40 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-red/10">
              <Smartphone size={32} className="text-brand-red" />
            </div>
            <h3 className="text-xl font-black text-white">
              {lang === 'en' ? 'Get The Black Box App' : 'حمّل تطبيق The Black Box'}
            </h3>
            <p className="text-text-muted text-xs mt-1">
              {lang === 'en'
                ? 'Order faster, track delivery live, and get exclusive rewards'
                : 'اطلب بأسرع طريقة وتابع أوردرك لحظة بلحظة واستمتع بعروض حصرية'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Option 1: Android APK Download */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-4 transition-all hover:border-brand-red/50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {lang === 'en' ? 'Android APK App' : 'تطبيق أندرويد الرسمي (APK)'}
                    </span>
                    <span className="bg-brand-red/20 text-brand-red text-[10px] font-black px-2 py-0.5 rounded-full border border-brand-red/30">
                      {lang === 'en' ? 'Direct' : 'مباشر'}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs mt-0.5">
                    {lang === 'en'
                      ? 'Full official Android release (8 MB)'
                      : 'النسخة الأصلية الكاملة برابط مباشر فوري (حجم 8 ميجا)'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadApk}
                className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-red/20"
              >
                {downloadStarted ? (
                  <>
                    <CheckCircle size={18} className="text-emerald-400" />
                    <span>{lang === 'en' ? 'Downloading...' : 'جاري التحميل الآن...'}</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>{lang === 'en' ? 'Download APK Directly' : 'تحميل الـ APK الآن'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Option 2: Instant PWA Install (Works on Android & iOS) */}
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-4 transition-all hover:border-gray-700">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {lang === 'en' ? 'Instant Web App (PWA)' : 'تثبيت سريع بدون تحميل (PWA)'}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {isIOS ? 'iPhone & Android' : 'سريع وخفيف'}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs mt-0.5">
                    {lang === 'en'
                      ? 'Adds app icon directly to your home screen'
                      : 'إضافة أيقونة التطبيق مباشرة على شاشتك الرئيسية'}
                  </p>
                </div>
              </div>

              {deferredPrompt ? (
                <button
                  onClick={handleInstallPwa}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-all border border-gray-700"
                >
                  <Smartphone size={18} />
                  <span>{lang === 'en' ? 'Install to Home Screen' : 'إضافة للشاشة الرئيسية'}</span>
                </button>
              ) : isIOS ? (
                <div className="bg-black/40 border border-gray-800 rounded-xl p-3 text-xs text-text-muted">
                  <div className="flex items-center gap-2 text-white font-bold mb-1">
                    <Share size={14} className="text-brand-red" />
                    <span>{lang === 'en' ? 'How to install on iPhone:' : 'طريقة التثبيت على الآيفون:'}</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>
                      {lang === 'en'
                        ? 'Tap the Share icon at the bottom of Safari'
                        : 'اضغط على زر المشاركة (Share) في أسفل متصفح Safari'}
                    </li>
                    <li>
                      {lang === 'en'
                        ? 'Select "Add to Home Screen"'
                        : 'اختر (إضافة إلى الصفحة الرئيسية - Add to Home Screen)'}
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="bg-black/40 border border-gray-800 rounded-xl p-2.5 text-center text-xs text-text-muted">
                  <span>
                    {lang === 'en'
                      ? 'You can also install via browser menu (⋮) > Install app'
                      : 'يمكنك أيضاً التثبيت من قائمة المتصفح (⋮) ثم (تثبيت التطبيق)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-5 pt-4 border-t border-gray-900">
            <span className="text-[11px] text-text-muted">
              {lang === 'en' ? 'Official application of ' : 'التطبيق الرسمي لـ '}
              <strong className="text-white">{APP_CONFIG.restaurantName}</strong>
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
