import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, ShoppingBag, UtensilsCrossed, X, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderTypeModal() {
  const { lang } = useLanguage();
  const { orderType, setOrderType, isOrderTypeModalOpen, setIsOrderTypeModalOpen, isDineInAvailable, tableNumber } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOrderTypeModalOpen) return null;

  const handleSelect = (type) => {
    setOrderType(type);
    setIsOrderTypeModalOpen(false);
    
    // If not already on menu or checkout, navigate smoothly to menu
    if (location.pathname !== '/menu' && location.pathname !== '/checkout') {
      navigate('/menu');
    }
  };

  const handleClose = () => {
    // If user closes without choosing, default to takeaway so they aren't blocked
    if (!orderType) {
      setOrderType('takeaway');
    }
    setIsOrderTypeModalOpen(false);
  };

  const options = [
    {
      id: 'delivery',
      title: lang === 'en' ? 'Home Delivery' : 'توصيل للمنزل',
      subtitle: lang === 'en' ? 'Fast delivery right to your door' : 'نوصل طلبك ساخناً وسريعاً لباب بيتك',
      badge: lang === 'en' ? 'Fast Delivery' : 'الأسرع لبابك',
      icon: Bike,
      iconColor: 'text-brand-red',
      bgGlow: 'hover:border-brand-red hover:shadow-[0_0_25px_rgba(255,59,48,0.15)]'
    },
    {
      id: 'takeaway',
      title: lang === 'en' ? 'Takeaway / Pickup' : 'استلام من المطعم',
      subtitle: lang === 'en' ? 'Order ahead and pick up with zero wait' : 'اطلب مسبقاً واستلم بنفسك ساخناً دون انتظار',
      badge: lang === 'en' ? 'No Delivery Fee' : 'بدون رسوم توصيل',
      icon: ShoppingBag,
      iconColor: 'text-amber-500',
      bgGlow: 'hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]'
    },
    ...(isDineInAvailable ? [{
      id: 'DineIn',
      title: lang === 'en' ? `Dine-In ${tableNumber ? `(Table ${tableNumber})` : ''}` : `تناول في المطعم ${tableNumber ? `(طاولة ${tableNumber})` : ''}`,
      subtitle: lang === 'en' ? 'Enjoy your hot meal inside our hall' : 'استمتع بوجبتك ساخنة مباشرة داخل صالة المطعم',
      badge: lang === 'en' ? 'Dining Hall' : 'صالة المطعم',
      icon: UtensilsCrossed,
      iconColor: 'text-red-400',
      bgGlow: 'hover:border-red-400 hover:shadow-[0_0_25px_rgba(248,113,113,0.15)]'
    }] : [])
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-black-surface border border-brand-red-dark/50 rounded-2xl sm:rounded-3xl p-4.5 sm:p-8 shadow-2xl z-10 text-text-light overflow-hidden my-auto"
          style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
        >
          {/* Subtle Top Red Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 rtl:left-auto rtl:right-4 sm:top-5 sm:left-5 sm:rtl:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black-primary/80 hover:bg-black-primary text-text-muted hover:text-text-light flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="text-center mb-5 sm:mb-8 pt-1 sm:pt-2">
            <span className="inline-block px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest bg-brand-red/15 text-brand-red border border-brand-red/30 mb-2 sm:mb-3">
              {lang === 'en' ? 'Start Your Order' : 'طريقة استلام الطلب'}
            </span>
            <h2 className="text-xl sm:text-3xl font-display font-black text-text-light mb-1.5 sm:mb-2">
              {lang === 'en' ? 'How would you like your order?' : 'كيف تود استلام طلبك؟'}
            </h2>
            <p className="text-text-muted text-xs sm:text-base max-w-sm mx-auto leading-relaxed">
              {lang === 'en' 
                ? 'Choose your preferred order method to view menu options and delivery zones'
                : 'اختر طريقة الاستلام لعرض المنيو وخيارات التوصيل المناسبة'}
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-3 sm:space-y-3.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = orderType === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full group text-start p-3 sm:p-4.5 rounded-2xl border transition-all duration-200 flex items-center gap-3 sm:gap-4 cursor-pointer relative ${
                    isSelected
                      ? 'border-brand-red bg-brand-red/10 shadow-[0_0_20px_rgba(255,59,48,0.2)]'
                      : `border-white/10 bg-black-primary/60 hover:bg-black-primary ${opt.bgGlow}`
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isSelected ? 'bg-brand-red text-white' : 'bg-black-surface border border-white/10 ' + opt.iconColor
                  }`}>
                    <Icon size={22} strokeWidth={2.2} />
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 mb-0.5">
                      <span className="font-bold text-sm sm:text-lg text-text-light group-hover:text-white leading-tight">
                        {opt.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-text-muted shrink-0">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-sm text-text-muted line-clamp-1 leading-snug">
                      {opt.subtitle}
                    </p>
                  </div>

                  {/* Indicator Check */}
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-brand-red border-brand-red text-white'
                      : 'border-white/20 group-hover:border-white/40 text-transparent'
                  }`}>
                    <Check size={13} strokeWidth={3} className={isSelected ? 'block' : 'hidden'} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-5 sm:mt-6 text-center text-[11px] sm:text-xs text-text-muted">
            {lang === 'en' 
              ? 'You can easily switch this anytime while browsing the menu.'
              : 'يمكنك تغيير طريقة الاستلام في أي وقت بسهولة أثناء تصفح المنيو.'}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
