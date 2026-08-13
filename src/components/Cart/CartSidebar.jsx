import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartSidebar() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
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
            className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }} // RTL pushes from right
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 text-dark">
                <ShoppingBag size={24} className="text-primary" />
                <h2 className="text-2xl font-display font-black pt-1">سلة الطلبات</h2>
                <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-sm">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full bg-light hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p className="text-lg">السلة فارغة حالياً</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-6 py-2 bg-white text-primary font-bold rounded-full shadow-sm border border-gray-200"
                  >
                    تصفح المنيو
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
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative group"
                      >
                        <button 
                          onClick={() => removeFromCart(index)}
                          className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        
                        <div className="flex gap-4">
                          {/* Item Image */}
                          <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                            {item.product.imagePath ? (
                              <img src={item.product.imagePath} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">بدون صورة</div>
                            )}
                          </div>
                          
                          {/* Item Details */}
                          <div className="flex-grow flex flex-col">
                            <h3 className="font-bold text-dark text-lg leading-tight mb-1 pr-6">{item.product.name}</h3>
                            
                            {item.product.isSoldByWeight && (
                              <span className="text-sm text-gray-500 mb-1">الوزن: {item.product.selectedWeight} جرام</span>
                            )}
                            
                            {item.product.selectedModifiers?.length > 0 && (
                              <div className="text-xs text-gray-500 mb-2">
                                {item.product.selectedModifiers.map((mod, i) => (
                                  <span key={i} className="inline-block bg-gray-100 px-2 py-0.5 rounded-md mr-1 mb-1">
                                    {mod.name} {mod.chargedPrice > 0 && `(+${mod.chargedPrice})`}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-auto flex items-center justify-between">
                              <span className="font-bold text-primary">
                                {(item.product.calculatedPrice || item.product.sellingPrice) + (item.product.finalModifiersPrice || 0)} ج.م
                              </span>
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 bg-light rounded-lg p-1">
                                <button 
                                  onClick={() => updateQuantity(index, -1)}
                                  className="w-7 h-7 bg-white rounded shadow-sm flex items-center justify-center hover:bg-gray-50"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(index, 1)}
                                  className="w-7 h-7 bg-white rounded shadow-sm flex items-center justify-center hover:bg-gray-50"
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
              <div className="p-6 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6 text-lg">
                  <span className="font-bold text-gray-600">الإجمالي:</span>
                  <span className="font-black text-2xl text-dark">{cartTotal} ج.م</span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                >
                  <span>إتمام الطلب</span>
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
