import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, X, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { APP_CONFIG } from '../config/appConfig';

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
      const remaining = Math.max(0, expiresAt - Date.now());

      if (remaining <= 0) {
        // Time expired! Clean up and redirect to track page
        localStorage.removeItem('editingOrderId');
        localStorage.removeItem('editingOrderDetails');
        localStorage.removeItem('modificationExpiresAt');
        setTimeLeft(null);
        setEditingOrderId(null);
        if (setIsCartOpen) setIsCartOpen(false);

        // Update Firebase that modification timed out
        try {
          fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${orderId}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ IsModifying: false })
          });
        } catch(e) {}

        alert(lang === 'en' 
          ? 'The 3-minute modification window has expired. Your original order will be prepared.' 
          : 'انتهت مهلة الـ 3 دقائق المتاحة لتعديل الطلب، وتم تثبيت طلبك الأصلي لمواصلة تحضيره.');

        navigate(`/track/${encodeURIComponent(orderId)}`);
      } else {
        setEditingOrderId(orderId);
        const totalSeconds = Math.floor(remaining / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [navigate, setIsCartOpen, lang]);

  if (!editingOrderId || !timeLeft) return null;

  const handleCancel = () => {
    if (confirm(lang === 'en' ? 'Cancel editing and keep your original order?' : 'هل تريد إلغاء التعديل والاحتفاظ بطلبك الأصلي؟')) {
      const orderId = editingOrderId;
      localStorage.removeItem('editingOrderId');
      localStorage.removeItem('editingOrderDetails');
      localStorage.removeItem('modificationExpiresAt');
      setTimeLeft(null);
      setEditingOrderId(null);
      if (setIsCartOpen) setIsCartOpen(false);

      try {
        fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${orderId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ IsModifying: false })
        });
      } catch(e) {}

      navigate(`/track/${encodeURIComponent(orderId)}`);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black py-2.5 px-4 shadow-xl sticky top-0 z-[110] flex items-center justify-between border-b border-amber-600">
      <div className="flex items-center gap-2">
        <Clock className="animate-pulse text-black shrink-0" size={20} />
        <span className="font-bold text-sm">
          {lang === 'en' ? `Modifying Order #${editingOrderId}:` : `مهلة تعديل الطلب #${editingOrderId}:`}
        </span>
        <span className="font-mono text-base bg-black/20 px-2 py-0.5 rounded font-black tracking-wider">
          {timeLeft}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          type="button"
          onClick={() => navigate('/checkout')}
          className="bg-black text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-black/80 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>{lang === 'en' ? 'Finish Edit' : 'إتمام التعديل'}</span>
          <ArrowLeft size={14} className={lang === 'ar' ? '' : 'rotate-180'} />
        </button>
        <button 
          type="button"
          onClick={handleCancel}
          className="bg-black/15 hover:bg-black/25 text-black px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          title={lang === 'en' ? 'Cancel edit' : 'إلغاء التعديل'}
        >
          {lang === 'en' ? 'Cancel' : 'إلغاء'}
        </button>
      </div>
    </div>
  );
}
