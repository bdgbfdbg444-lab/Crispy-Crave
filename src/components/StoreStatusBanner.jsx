import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { APP_CONFIG } from '../config/appConfig';
import { checkStoreOpenStatus } from '../utils/storeStatusUtils';

export default function StoreStatusBanner({ initialStatus = null, onStatusChange = null }) {
  const { lang } = useLanguage();
  const [storeStatus, setStoreStatus] = useState(initialStatus);
  const [, setTick] = useState(0);

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
      } catch (err) {
        // Silently handle
      }
    };
    fetchStatus();

    // 2. Refresh clock evaluation every 30 seconds (so cross-hour transitions trigger seamlessly)
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const evalStatus = checkStoreOpenStatus(storeStatus, lang);
  const isClosed = !evalStatus.isOpen;

  useEffect(() => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(evalStatus);
    }
  }, [evalStatus.isOpen, evalStatus.reason, onStatusChange]);

  const title = lang === 'en' ? evalStatus.titleEn : evalStatus.title;
  const message = lang === 'en' ? evalStatus.messageEn : evalStatus.message;
  const openHours = lang === 'en'
    ? `${evalStatus.openDisplayEn || '1:00 PM'} – ${evalStatus.closeDisplayEn || '2:00 AM'}`
    : `${evalStatus.openDisplayAr || '1 مساءً'} – ${evalStatus.closeDisplayAr || '2 صباحاً'}`;

  return (
    <AnimatePresence mode="wait">
      {isClosed ? (
        <motion.div
          key="closed-banner"
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl mx-auto my-6 px-4"
          dir={lang === 'en' ? 'ltr' : 'rtl'}
        >
          <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl border border-red-500/40 bg-gradient-to-br from-[#1c080b]/95 via-[#120708]/95 to-[#24090e]/95 p-5 md:p-6 shadow-[0_0_35px_rgba(230,57,70,0.22)] backdrop-blur-xl transition-all duration-300 hover:border-red-500/60 hover:shadow-[0_0_45px_rgba(230,57,70,0.32)]">
            {/* Ambient Background Glow Accents */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-red-800/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-5 text-center md:text-start">
              
              {/* Alert Badge Icon with Pulsing Effect */}
              <div className="relative shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600/25 to-red-950/60 border border-red-500/50 shadow-[0_0_20px_rgba(230,57,70,0.35)]">
                <AlertCircle className="w-7 h-7 text-brand-red animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-red shadow-[0_0_8px_#E63946]" />
                </span>
              </div>

              {/* Text Information */}
              <div className="flex-1 flex flex-col">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h3 className="text-brand-red font-black text-lg md:text-xl tracking-wide flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(230,57,70,0.4)]">
                    <span>⛔</span>
                    <span>{title}</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/30 text-red-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    <Clock size={11} className="text-red-400" />
                    <span>{lang === 'en' ? 'Operating Schedule' : 'مواعيد العمل'}</span>
                  </span>
                </div>

                <p className="text-text-light/90 text-sm md:text-base leading-relaxed mt-2 font-medium">
                  {message}
                </p>

                {/* Operating Schedule Footer Pill */}
                <div className="mt-4 pt-3 border-t border-red-500/20 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-brand-red shrink-0" />
                    <span>{lang === 'en' ? 'Daily Hours:' : 'مواعيد العمل اليومية:'}</span>
                    <span className="text-white font-bold tracking-wide bg-black-primary/60 px-2.5 py-0.5 rounded-lg border border-red-500/20">
                      {openHours}
                    </span>
                  </div>

                  <span className="text-text-muted/70 text-[11px] md:text-xs">
                    {lang === 'en' ? '• Cairo Local Time' : '• بتوقيت القاهرة'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="open-badge"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl mx-auto my-4 px-4 flex justify-center"
          dir={lang === 'en' ? 'ltr' : 'rtl'}
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-emerald-950/60 border border-emerald-500/40 text-emerald-300 backdrop-blur-md shadow-[0_0_25px_rgba(16,185,129,0.2)] text-xs md:text-sm font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </span>
            <span className="text-white font-black">{title}</span>
            <span className="text-emerald-500/50">•</span>
            <span className="text-text-light/90 font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
