import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { lang } = useLanguage();
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: '',
    onConfirm: null
  });

  const showAlert = useCallback(({
    title,
    message,
    type = 'warning',
    confirmText,
    onConfirm = null
  }) => {
    let resolvedType = type;
    let cleanMessage = typeof message === 'string' ? message : String(message || '');

    if (cleanMessage.includes('⚠️') || cleanMessage.includes('تنبيه')) {
      resolvedType = 'warning';
      cleanMessage = cleanMessage.replace(/⚠️/g, '').trim();
    } else if (cleanMessage.includes('❌') || cleanMessage.includes('خطأ')) {
      resolvedType = 'error';
      cleanMessage = cleanMessage.replace(/❌/g, '').trim();
    } else if (cleanMessage.includes('✅') || cleanMessage.includes('نجاح')) {
      resolvedType = 'success';
      cleanMessage = cleanMessage.replace(/✅/g, '').trim();
    }

    const defaultTitle = title || (
      resolvedType === 'error' ? (lang === 'en' ? 'Attention' : 'خطأ') :
      resolvedType === 'success' ? (lang === 'en' ? 'Success' : 'تم بنجاح') :
      resolvedType === 'info' ? (lang === 'en' ? 'Information' : 'معلومة') :
      (lang === 'en' ? 'Notice' : 'تنبيه هام')
    );

    const defaultConfirmText = confirmText || (
      lang === 'en' ? 'Got It' : 'حسناً، فهمت'
    );

    setAlertState({
      isOpen: true,
      title: defaultTitle,
      message: cleanMessage,
      type: resolvedType,
      confirmText: defaultConfirmText,
      onConfirm
    });
  }, [lang]);

  const closeAlert = useCallback(() => {
    setAlertState(prev => {
      if (prev.onConfirm) {
        try { prev.onConfirm(); } catch (e) {}
      }
      return { ...prev, isOpen: false };
    });
  }, []);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showAlert({ message: msg });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && alertState.isOpen) {
        closeAlert();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alertState.isOpen, closeAlert]);

  const showWarning = (msg, title) => showAlert({ message: msg, title, type: 'warning' });
  const showError = (msg, title) => showAlert({ message: msg, title, type: 'error' });
  const showSuccess = (msg, title) => showAlert({ message: msg, title, type: 'success' });
  const showInfo = (msg, title) => showAlert({ message: msg, title, type: 'info' });

  return (
    <AlertContext.Provider value={{ showAlert, showWarning, showError, showSuccess, showInfo, closeAlert }}>
      {children}

      <AnimatePresence>
        {alertState.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAlert}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-[#141416] border-2 border-brand-red/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center overflow-hidden z-10"
              style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
            >
              <div 
                className={`absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none ${
                  alertState.type === 'error' ? 'bg-red-500' :
                  alertState.type === 'success' ? 'bg-emerald-500' :
                  alertState.type === 'info' ? 'bg-blue-500' :
                  'bg-amber-500'
                }`}
              />

              <button
                type="button"
                onClick={closeAlert}
                className="absolute top-4 left-4 md:top-5 md:left-5 text-text-muted hover:text-text-light transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="flex justify-center mb-5 mt-2">
                <div 
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${
                    alertState.type === 'error' ? 'bg-red-500/15 border border-red-500/30 text-red-400' :
                    alertState.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' :
                    alertState.type === 'info' ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400' :
                    'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  }`}
                >
                  {alertState.type === 'error' && <AlertCircle size={42} strokeWidth={2.2} />}
                  {alertState.type === 'success' && <CheckCircle2 size={42} strokeWidth={2.2} />}
                  {alertState.type === 'info' && <Info size={42} strokeWidth={2.2} />}
                  {alertState.type === 'warning' && <AlertTriangle size={42} strokeWidth={2.2} />}
                </div>
              </div>

              <h3 className="text-2xl font-display font-black text-text-light mb-3">
                {alertState.title}
              </h3>

              <p className="text-text-muted text-sm md:text-base leading-relaxed mb-7 whitespace-pre-line font-medium px-2">
                {alertState.message}
              </p>

              <button
                type="button"
                onClick={closeAlert}
                autoFocus
                className="w-full py-3.5 px-6 rounded-2xl font-black text-base text-text-light bg-brand-red hover:bg-brand-red-dark transition-all duration-200 shadow-lg shadow-brand-red/30 hover:shadow-brand-red/50 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{alertState.confirmText}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
