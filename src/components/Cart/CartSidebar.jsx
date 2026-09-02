import { useLanguage } from '../../context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartSidebar() {
  const { lang } = useLanguage();
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [activeOrderId, setActiveOrderId] = useState(null);

  useEffect(() => {
    const actId = localStorage.getItem('activeOrderId');
    const editingId = localStorage.getItem('editingOrderId');
    if (actId && !editingId) {
      const cleanId = actId.replace('#', '').trim();
      fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${cleanId}.json`)
        .then(res => res.json())
        .then(data => {
          if (data && data.Status && data.Status !== 'Completed' && data.Status !== 'Cancelled') {
            setActiveOrderId(cleanId);
          } else {
            setActiveOrderId(null);
          }
        })
        .catch(() => {});
    } else {
      setActiveOrderId(null);
    }
  }, [isCartOpen]);
  const navigate = useNavigate();

  // Prevent background scrolling when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black-primary/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }} // RTL pushes from right
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-black-surface shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-brand-red-dark/30 flex items-center justify-between bg-black-surface shrink-0">
              <div className="flex items-center gap-3 text-text-light">
                <ShoppingBag size={24} className="text-brand-red" />
                <h2 className="text-2xl font-display font-black pt-1">{lang === 'en' ? 'Cart' : 'سلة الطلبات'}</h2>
                <span className="bg-brand-red/10 text-brand-red font-bold px-2 py-0.5 rounded-full text-sm">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full bg-black-surface hover:bg-black-surface flex items-center justify-center text-text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow overflow-y-auto p-6 bg-black-primary custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p className="text-lg">{lang === 'en' ? 'Cart is empty' : 'السلة فارغة حالياً'}</p>
                  <button 
                    onClick={() => { navigate('/menu'); setIsCartOpen(false); }}
                    className="mt-4 px-6 py-2 bg-black-surface text-brand-red font-bold rounded-full shadow-sm border border-brand-red-dark/30"
                  >
                    {lang === 'en' ? 'Browse Menu' : 'تصفح المنيو'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {cartItems.map((item, index) => (
                      <motion.div 
                        key={index}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-black-surface p-4 rounded-2xl shadow-sm border border-brand-red-dark/30 relative group"
                      >
                        <button 
                          onClick={() => removeFromCart(index)}
                          className="absolute top-4 left-4 text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        
                        <div className="flex gap-4">
                          {/* Item Image */}
                          <div className="w-20 h-20 bg-black-primary rounded-xl overflow-hidden shrink-0">
                            {item.product.imagePath ? (
                              <img src={item.product.imagePath} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-muted">{lang === 'en' ? 'No Image' : 'بدون صورة'}</div>
                            )}
                          </div>
                          
                          {/* Item Details */}
                          <div className="flex-grow flex flex-col">
                            <h3 className="font-bold text-text-light text-lg leading-tight mb-1 pe-">{item.product.name}</h3>
                            
                            {item.product.isSoldByWeight && (
                              <span className="text-sm text-text-muted mb-1">الوزن: {item.product.selectedWeight} جرام</span>
                            )}
                            
                            {item.product.selectedModifiers?.length > 0 && (
                              <div className="text-xs text-text-muted mb-2">
                                {item.product.selectedModifiers.map((mod, i) => (
                                  <span key={i} className="inline-block bg-black-primary px-2 py-0.5 rounded-md me- mb-1">
                                    {mod.name} {mod.chargedPrice > 0 && `(+${mod.chargedPrice})`}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-auto flex items-center justify-between">
                              <span className="font-bold text-brand-red">
                                {(item.product.calculatedPrice || item.product.sellingPrice) + (item.product.finalModifiersPrice || 0)} {lang === 'en' ? 'EGP' : 'ج.م'}
                              </span>
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 bg-black-surface rounded-lg p-1">
                                <button 
                                  onClick={() => updateQuantity(index, -1)}
                                  className="w-7 h-7 bg-black-surface rounded shadow-sm flex items-center justify-center hover:bg-black-primary"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(index, 1)}
                                  className="w-7 h-7 bg-black-surface rounded shadow-sm flex items-center justify-center hover:bg-black-primary"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer / Checkout */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-black-surface border-t border-brand-red-dark/30 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6 text-lg">
                  <span className="font-bold text-text-muted">الإجمالي:</span>
                  <span className="font-black text-2xl text-text-light">{cartTotal} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full py-4 bg-brand-red text-text-light font-bold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors shadow-lg shadow-brand-red/30"
                >
                  <span>{lang === 'en' ? 'Checkout' : 'إتمام الطلب'}</span>
                  <ArrowLeft size={20} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
