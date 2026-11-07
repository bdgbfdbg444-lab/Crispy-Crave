import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell, Volume2, Cookie, Sparkles, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ExperienceConsentModal() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if consent was already handled
    const consent = localStorage.getItem('bb_experience_consent');
    if (consent) {
      return;
    }

    // Do not show on isolated screens like KDS or Driver Portal
    const path = window.location.hash || window.location.pathname;
    if (path.includes('/kds') || path.includes('/driver')) {
      return;
    }

    // Show after a gentle 1.8-second delay so the page loads smoothly
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleAllowAll = async () => {
    setIsActivating(true);

    // 1. Unlock Web Audio Context for Pager Buzzer & Alert Chimes
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

    // 2. Request System Push & Screen Notifications
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }

    // 3. Request GPS Geolocation for Accurate Address Pinning & Transit ETA
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            localStorage.setItem('bb_last_known_lat', pos.coords.latitude.toString());
            localStorage.setItem('bb_last_known_lng', pos.coords.longitude.toString());
            // Dispatch event for any map or checkout components listening
            window.dispatchEvent(new CustomEvent('BB_LOCATION_DETECTED', {
              detail: { lat: pos.coords.latitude, lng: pos.coords.longitude }
            }));
          } catch (_) {}
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }

    // 4. Save Consent in LocalStorage
    try {
      localStorage.setItem('bb_experience_consent', 'granted');
      localStorage.setItem('bb_cookie_consent', 'granted');
      localStorage.setItem('bb_consent_timestamp', Date.now().toString());
    } catch (_) {}

    setIsActivating(false);
    setIsSuccess(true);

    // Auto dismiss after brief success animation
    setTimeout(() => {
      setIsVisible(false);
    }, 1400);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('bb_experience_consent', 'declined');
      localStorage.setItem('bb_cookie_consent', 'essential_only');
      localStorage.setItem('bb_consent_timestamp', Date.now().toString());
    } catch (_) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
      >
        <motion.div
          initial={{ y: 50, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 50, scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-[#141416]/95 border-2 border-brand-red/40 rounded-3xl p-5 sm:p-7 shadow-[0_15px_50px_rgba(230,57,70,0.25)] relative overflow-hidden backdrop-blur-xl"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close / Dismiss button */}
          <button
            onClick={handleDecline}
            aria-label="Close"
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-10 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                {lang === 'en' ? 'Permissions Activated!' : 'تم تفعيل الصلاحيات بنجاح!'}
              </h3>
              <p className="text-gray-300 text-sm">
                {lang === 'en' 
                  ? 'Ready for the ultimate dining & tracking experience 🍔' 
                  : 'أهلاً بك في The Black Box! جاهزون لخدمتك بأعلى جودة وتتبع فوري 🍔'}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-red/20 border border-brand-red/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(230,57,70,0.3)]">
                  <Sparkles className="w-6 h-6 text-brand-red animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-red bg-brand-red/10 border border-brand-red/25 px-2 py-0.5 rounded-md">
                      Smart Experience
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {lang === 'en' ? 'Enable Full Restaurant Experience' : 'تفعيل تجربة المطعم المتكاملة'}
                  </h3>
                </div>
              </div>

              <p className="text-gray-300 text-xs sm:text-sm mb-5 leading-relaxed">
                {lang === 'en'
                  ? 'To give you seamless live order tracking, loud pager alarms, and precise GPS delivery, please allow the following features:'
                  : 'لضمان رنين البيجر عند جاهزية أكلك، وحساب مسافة التوصيل بدقة عبر الـ GPS، وحفظ سلتك وتفضيلاتك:'}
              </p>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                {/* 1. GPS Location */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-brand-red/30 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {lang === 'en' ? 'GPS Location' : 'تحديد الموقع (GPS)'}
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      {lang === 'en' ? 'Accurate delivery pin & ETA' : 'تحديد العنوان تلقائياً وحساب وقت الدليفري'}
                    </p>
                  </div>
                </div>

                {/* 2. Pager Alarm Sound */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-brand-red/30 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {lang === 'en' ? 'Pager Audio' : 'صوت البيجر الذكي'}
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      {lang === 'en' ? 'Loud chime when food is ready' : 'رنين قوي فوري عند استواء وجبتك'}
                    </p>
                  </div>
                </div>

                {/* 3. Screen Notifications */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-brand-red/30 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {lang === 'en' ? 'Notifications' : 'إشعارات الشاشة'}
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      {lang === 'en' ? 'Lock screen alert when food is ready' : 'تنبيه مباشر على شاشة القفل'}
                    </p>
                  </div>
                </div>

                {/* 4. Cookies & Cart */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-brand-red/30 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Cookie className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {lang === 'en' ? 'Cookies & Cart' : 'الكوكيز وحفظ السلة'}
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      {lang === 'en' ? 'Saves cart & previous orders' : 'حفظ سلتك وطلباتك السابقة بأمان'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleAllowAll}
                  disabled={isActivating}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-red to-orange-600 hover:from-brand-red-dark hover:to-orange-700 text-white font-black text-base sm:text-lg rounded-2xl shadow-[0_8px_25px_rgba(230,57,70,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                >
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span>
                    {isActivating
                      ? (lang === 'en' ? 'Activating...' : 'جاري التفعيل...')
                      : (lang === 'en' ? 'Allow All & Continue 🚀' : 'سماح وتفعيل الكل 🚀')}
                  </span>
                </button>

                <div className="flex items-center justify-between px-2 pt-1">
                  <button
                    onClick={handleDecline}
                    className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer py-1"
                  >
                    {lang === 'en' ? 'Necessary only (Skip)' : 'الضرورية فقط (تخطي)'}
                  </button>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? '100% Secure & Private' : 'آمن ومشفر 100%'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
