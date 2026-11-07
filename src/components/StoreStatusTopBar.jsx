import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { APP_CONFIG } from '../config/appConfig';
import { checkStoreOpenStatus } from '../utils/storeStatusUtils';

export default function StoreStatusTopBar() {
  const { lang } = useLanguage();
  const [storeStatus, setStoreStatus] = useState(null);
  const [, setTick] = useState(0);
  
  // Show once per session, and auto-dismiss
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('bb_status_bar_dismissed') === 'true';
    }
    return false;
  });

  // 1. Live Realtime Firebase Sync
  useEffect(() => {
    let unsubscribe = null;
    try {
      const statusRef = ref(db, 'StoreStatus');
      unsubscribe = onValue(statusRef, (snapshot) => {
        if (snapshot.exists()) {
          setStoreStatus(snapshot.val());
        }
      }, (error) => {
        console.warn('StoreStatus realtime listener warning:', error);
      });
    } catch (e) {
      console.warn('Failed to subscribe to StoreStatus RTDB:', e);
    }

    // Fallback fetch
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${APP_CONFIG.firebaseDbUrl}StoreStatus.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data) setStoreStatus(data);
        }
      } catch (err) {}
    };
    fetchStatus();

    // Refresh clock evaluation every 30 seconds
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // 2. Auto-dismiss automatically after 5.5 seconds
  useEffect(() => {
    if (isDismissed) return;

    const timer = setTimeout(() => {
      setIsDismissed(true);
      try {
        sessionStorage.setItem('bb_status_bar_dismissed', 'true');
      } catch (_) {}
    }, 5500);

    return () => clearTimeout(timer);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('bb_status_bar_dismissed', 'true');
    } catch (_) {}
  };

  const evalStatus = checkStoreOpenStatus(storeStatus, lang);
  const isClosed = !evalStatus.isOpen;

  const openHoursText = lang === 'en'
    ? `${evalStatus.openDisplayEn || '1:00 PM'} – ${evalStatus.closeDisplayEn || '2:00 AM'}`
    : `${evalStatus.openDisplayAr || '1 مساءً'} – ${evalStatus.closeDisplayAr || '2 صباحاً'}`;

  return (
    <AnimatePresence>
      {!isDismissed && (
        isClosed ? (
          <motion.div
            key="closed-top-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full bg-gradient-to-r from-red-950 via-[#26070b] to-red-950 border-b border-red-500/40 text-red-100 shadow-[0_2px_12px_rgba(230,57,70,0.25)] relative z-50 overflow-hidden"
            dir={lang === 'en' ? 'ltr' : 'rtl'}
          >
            <div className="container mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center">
                <span className="inline-flex items-center gap-1.5 font-black text-brand-red shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red shadow-[0_0_6px_#E63946]" />
                  </span>
                  <span>⛔ {lang === 'en' ? 'Store Currently Closed' : 'المطعم مغلق حالياً'}</span>
                </span>

                <span className="hidden md:inline text-red-500/40">•</span>

                <span className="text-text-light/90 font-medium">
                  {lang === 'en'
                    ? 'Daily orders open from 1:00 PM to 2:00 AM'
                    : 'نسعد باستقبال طلباتكم يومياً وفقاً لمواعيد العمل الرسمية من 1 مساءً حتى 2 صباحاً'}
                </span>

                <span className="inline-flex items-center gap-1 bg-black-primary/60 border border-red-500/30 text-white px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                  <Clock size={11} className="text-brand-red" />
                  <span>{openHoursText}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-red-300/70 hover:text-white p-1 rounded-md transition-colors shrink-0"
                aria-label="Close announcement"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="open-top-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full bg-gradient-to-r from-emerald-950 via-[#071f13] to-emerald-950 border-b border-emerald-500/30 text-emerald-200 shadow-[0_2px_12px_rgba(16,185,129,0.15)] relative z-50 overflow-hidden"
            dir={lang === 'en' ? 'ltr' : 'rtl'}
          >
            <div className="container mx-auto px-4 py-1.5 sm:py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex-1 flex items-center justify-center gap-2 text-center">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                </span>
                <span className="font-bold text-white">
                  {lang === 'en' ? 'Open Now for Orders' : 'مفتوح الآن لاستقبال طلباتكم'}
                </span>
                <span className="text-emerald-500/40">•</span>
                <span className="text-emerald-200/90 font-medium">
                  {lang === 'en' 
                    ? `Serving you daily until ${evalStatus.closeDisplayEn || '2:00 AM'}`
                    : `نسعد بخدمتكم يومياً حتى ${evalStatus.closeDisplayAr || '2 صباحاً'}`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-emerald-300/70 hover:text-white p-1 rounded-md transition-colors shrink-0"
                aria-label="Close announcement"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
