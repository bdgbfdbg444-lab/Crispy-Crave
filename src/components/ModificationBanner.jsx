import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { APP_CONFIG } from '../config/appConfig';
import { ref, remove, update } from 'firebase/database';
import { db } from '../firebase';

export default function ModificationBanner() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { setIsCartOpen, clearCart } = useCart();
  const [timeLeft, setTimeLeft] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  useEffect(() => {
    const checkTimer = () => {
      const orderId = localStorage.getItem('editingOrderId');
      const expiresAtStr = localStorage.getItem('modificationExpiresAt');

      if (!orderId || !expiresAtStr) {
        setTimeLeft(null);
        setEditingOrderId(null);
        return;
      }

      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        // Expired
        localStorage.removeItem('editingOrderId');
        localStorage.removeItem('editingOrderDetails');
        localStorage.removeItem('modificationExpiresAt');
        clearCart();
        setTimeLeft(null);
        setEditingOrderId(null);
        if (setIsCartOpen) setIsCartOpen(false);

        try {
          remove(ref(db, `ActiveHoldRequests/${orderId}`));
          update(ref(db, `PublicTracking/${orderId}`), {
            IsModifying: false,
            ModificationExpired: true,
            ModificationCount: 1
          });
        } catch (e) {}

        navigate(`/track/${orderId}`);
      } else {
        setEditingOrderId(orderId);
        setTimeLeft(Math.ceil(remaining / 1000));
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [navigate, clearCart, setIsCartOpen]);

  const handleCancelModification = () => {
    const orderId = localStorage.getItem('editingOrderId');
    if (orderId) {
      localStorage.removeItem('editingOrderId');
      localStorage.removeItem('editingOrderDetails');
      localStorage.removeItem('modificationExpiresAt');
      clearCart();
      setTimeLeft(null);
      setEditingOrderId(null);
      if (setIsCartOpen) setIsCartOpen(false);

      try {
        remove(ref(db, `ActiveHoldRequests/${orderId}`));
        update(ref(db, `PublicTracking/${orderId}`), {
          IsModifying: false,
          ModificationCount: 1
        });
      } catch (e) {}

      navigate(`/track/${orderId}`);
    }
  };

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-brand-primary text-white px-4 py-3 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 safe-top">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
          <Clock size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm sm:text-base">
            {lang === 'en' ? 'Modifying Order' : 'تعديل الطلب الحالي'} #{editingOrderId}
          </h3>
          <p className="text-white/80 text-xs">
            {lang === 'en' ? 'Time remaining to submit changes' : 'الوقت المتبقي لتقديم التعديلات'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        <div className="text-2xl font-black font-display tracking-widest bg-black/20 px-4 py-1.5 rounded-full">
          {timeString}
        </div>
        <button 
          onClick={handleCancelModification}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-sm font-medium whitespace-nowrap"
        >
          <X size={16} />
          {lang === 'en' ? 'Cancel' : 'إلغاء التعديل'}
        </button>
      </div>
    </div>
  );
}
