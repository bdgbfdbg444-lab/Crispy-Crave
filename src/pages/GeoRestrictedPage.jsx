import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ShieldAlert, RefreshCw, MessageSquare } from 'lucide-react';
import Logo from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { clearGeoCache } from '../utils/geoGuard';

export default function GeoRestrictedPage({ visitorCountry = '', onRetry }) {
  const { lang, setLang } = useLanguage();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    clearGeoCache();
    if (onRetry) {
      await onRetry();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRetrying(false), 1500);
  };

  return (
    <div 
      className="min-h-screen bg-black-primary text-text-light flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
      dir={lang === 'en' ? 'ltr' : 'rtl'}
    >
      {/* Ambient Red Glows */}
      <motion.div 
        animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-96 h-96 bg-brand-red/20 rounded-full blur-[140px] pointer-events-none"
      />
      
      {/* Language Switcher Pill */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-text-muted hover:text-white hover:border-brand-red/50 transition-all"
        >
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="relative z-10 max-w-lg w-full bg-black-surface/90 border border-brand-red/30 rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(230,57,70,0.2)] text-center backdrop-blur-md">
        
        {/* Brand Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="text-4xl sm:text-5xl drop-shadow-[0_0_20px_rgba(230,57,70,0.6)]" />
        </div>

        {/* Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-brand-red/10 border-2 border-brand-red/40 flex items-center justify-center mb-6 shadow-lg shadow-brand-red/20">
          <Globe size={40} className="text-brand-red animate-pulse" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 border-2 border-black-primary flex items-center justify-center">
            <ShieldAlert size={14} className="text-white" />
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-text-light mb-3">
          {lang === 'en' ? 'Service Available in Egypt Only' : 'الخدمة متاحة داخل مصر فقط'}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-text-muted leading-relaxed mb-6">
          {lang === 'en' 
            ? 'We apologize, The Black Box online ordering, catering, and delivery services are currently available exclusively within the Arab Republic of Egypt.'
            : 'نعتذر منك، خدمات الطلب والتوصيل وحجز المناسبات الخاصة بمطعم The Black Box متاحة حالياً حصرياً داخل جمهورية مصر العربية فقط.'}
        </p>

        {/* VPN / Proxy notice */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-xs text-text-muted/80 leading-relaxed text-right">
          <div className="flex items-start gap-2.5">
            <span className="text-brand-red text-base shrink-0">💡</span>
            <div>
              <p className="font-bold text-text-light mb-1">
                {lang === 'en' ? 'Are you currently in Egypt?' : 'هل أنت متواجد داخل مصر حالياً؟'}
              </p>
              <p>
                {lang === 'en'
                  ? 'If you are using a VPN, proxy, or private relay, please turn it off and click "Refresh" to verify your connection.'
                  : 'إذا كنت تستخدم تطبيق VPN أو متصفح مزود ببروكسي خارجي، يرجى إيقاف تشغيله ثم الضغط على "إعادة الفحص" لتأكيد اتصالك وتصفح الموقع.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-sm shadow-lg shadow-brand-red/30 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
            <span>{lang === 'en' ? 'Re-check Connection' : 'إعادة فحص الاتصال'}</span>
          </button>

          <a
            href="https://wa.me/201116348079?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D9%88%D8%A7%D8%AC%D9%87%D8%AA%20%D9%85%D8%B4%D9%83%D9%84%D8%A9%20%D9%81%D9%8A%20%D8%AA%D8%AD%D8%AF%D9%8A%D8%AF%20%D8%A7%D9%84%D9%85%D9%88%D9%82%D8%B9%20%D8%A7%D9%84%D8%AC%D8%BA%D8%B1%D8%A7%D9%81%D9%8A"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-sm transition-all"
          >
            <MessageSquare size={16} />
            <span>{lang === 'en' ? 'Contact Support' : 'تواصل مع الدعم'}</span>
          </a>
        </div>

        {/* Technical Footer */}
        {visitorCountry && (
          <div className="mt-8 pt-4 border-t border-white/5 text-[11px] text-text-muted/40 font-mono">
            {lang === 'en' ? `Detected Region: ${visitorCountry}` : `المنطقة المكتشفة: ${visitorCountry}`}
          </div>
        )}
      </div>
    </div>
  );
}
