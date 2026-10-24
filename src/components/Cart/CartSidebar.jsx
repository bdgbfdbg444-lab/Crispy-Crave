import { useLanguage } from '../../context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowLeft, Truck, Sparkles, CheckCircle2, Users, Pencil } from 'lucide-react';
import BurgerLabModal from '../Customizer/BurgerLabModal';
import ShakeLabModal from '../Customizer/ShakeLabModal';
import { getCustomizerType } from '../Menu/ProductCard';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import SmartUpsellBar from '../Menu/SmartUpsellBar';

export default function CartSidebar({ websiteData, menuData }) {
  const { lang } = useLanguage();
  const [editingCartItem, setEditingCartItem] = useState(null);

  const findBaseProduct = (productId) => {
    if (!menuData || !productId) return null;
    const cats = menuData.Categories || menuData.categories || {};
    for (const cat of Object.values(cats)) {
      const prods = cat.Products || cat.products || {};
      for (const p of Object.values(prods)) {
        if (p.id?.toString() === productId?.toString()) {
          return p;
        }
      }
    }
    return null;
  };
  const { currentUser, customerData } = useAuth();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    closeCart,
    continueShopping,
    removeFromCart,
    updateCartItem,
    updateQuantity,
    cartTotal,
    isGroupOrder,
    isGroupHost,
    groupOrderId,
    groupData,
    currentGuestName,
    setIsGroupModalOpen,
    leaveGroupOrder,
    orderType
  } = useCart();
  const [activeOrderId, setActiveOrderId] = useState(() => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) return null;
    const actId = localStorage.getItem('activeOrderId');
    return actId ? actId.replace('#', '').trim() : null;
  });

  useEffect(() => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) {
      setActiveOrderId(null);
      return;
    }

    const actId = localStorage.getItem('activeOrderId');
    if (actId) {
      const cleanId = actId.replace('#', '').trim();
      fetch(`${APP_CONFIG.firebaseDbUrl}PublicTracking/${cleanId}.json`)
        .then(res => res.json())
        .then(data => {
          if (!data || data.Status === 'Completed' || data.Status === 'Cancelled') {
            localStorage.removeItem('activeOrderId');
            setActiveOrderId(null);
          } else {
            setActiveOrderId(cleanId);
          }
        })
        .catch(() => {
          setActiveOrderId(null);
        });
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

  // Live Free Delivery configuration
  const [liveFreeDelivery, setLiveFreeDelivery] = useState(null);

  useEffect(() => {
    if (!isCartOpen) return;
    fetch(`${APP_CONFIG.firebaseDbUrl}FreeDelivery.json?t=${Date.now()}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && typeof data === 'object' && !data.error) setLiveFreeDelivery(data);
      })
      .catch(() => {});
  }, [isCartOpen]);

  const fdConfig = (liveFreeDelivery && !liveFreeDelivery.error)
    ? liveFreeDelivery
    : (menuData?.FreeDelivery || menuData?.freeDelivery || websiteData?.FreeDelivery || websiteData?.freeDelivery || null);

  const isFreeDeliveryEnabled = fdConfig && fdConfig.enabled !== undefined
    ? Boolean(fdConfig.enabled)
    : (websiteData?.enableFreeDeliveryBar !== undefined ? Boolean(websiteData.enableFreeDeliveryBar) : true);

  const freeDeliveryThreshold = Number(
    fdConfig?.threshold || fdConfig?.Threshold || websiteData?.freeDeliveryThresholdAmount || 350
  );

  const currentTotal = Number(cartTotal || 0);
  const progress = Math.min(100, Math.round((currentTotal / freeDeliveryThreshold) * 100));
  const isUnlocked = progress >= 100;
  const remaining = Math.max(0, Math.round(freeDeliveryThreshold - currentTotal));

  const progressMessage = (lang === 'en'
    ? (fdConfig?.messageEn || fdConfig?.MessageEn || websiteData?.freeDeliveryMessageEn || 'Add {remaining} EGP more to get FREE Delivery!')
    : (fdConfig?.message || fdConfig?.Message || websiteData?.freeDeliveryMessage || 'أضف بـ {remaining} ج.م فقط لتحصل على توصيل مجاني!')
  ).replace('{remaining}', remaining).replace('🚀', '').trim();

  const successMessage = (lang === 'en'
    ? (fdConfig?.successMessageEn || fdConfig?.SuccessMessageEn || websiteData?.freeDeliverySuccessMessageEn || 'Congrats! You unlocked FREE Delivery')
    : (fdConfig?.successMessage || fdConfig?.SuccessMessage || websiteData?.freeDeliverySuccessMessage || 'مبروك! طلبك مؤهل الآن للتوصيل المجاني بالكامل')
  ).replace('🎉', '').replace('✨', '').trim();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
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
            <div className="p-5 border-b border-brand-red-dark/30 flex items-center justify-between bg-black-surface shrink-0">
              <div className="flex items-center gap-2.5 text-text-light">
                <ShoppingBag size={22} className="text-brand-red" />
                <h2 className="text-xl font-display font-black pt-0.5">{lang === 'en' ? 'Cart' : 'سلة الطلبات'}</h2>
                <span className="bg-brand-red/10 text-brand-red font-bold px-2 py-0.5 rounded-full text-xs">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={closeCart}
                className="w-9 h-9 rounded-full bg-black-surface hover:bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors"
                title={lang === 'en' ? 'Close' : 'إغلاق'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Active Group Order Live Banner */}
            {isGroupOrder && (
              <div className="px-5 py-3 bg-brand-red-dark/20 border-b border-brand-red-dark/40 shrink-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-text-light">
                      {lang === 'en' ? `Group: ${groupData?.hostName}` : `طلب جماعي: ${groupData?.hostName}`}
                      {isGroupHost && <span className="ms-1 text-[10px] text-brand-red font-bold">({lang === 'en' ? 'Host' : 'المنظم'})</span>}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(true)}
                    className="text-[11px] font-bold text-brand-red hover:underline flex items-center gap-1"
                  >
                    <span>{lang === 'en' ? 'Invite & Details' : 'دعوة وتفاصيل'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>{lang === 'en' ? 'Your Name:' : 'اسمك على الساندوتش:'} <b className="text-text-light font-bold">{currentGuestName || (lang === 'en' ? 'Guest' : 'ضيف')}</b></span>
                  <span className="font-mono text-[11px] text-text-light font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">{groupOrderId}</span>
                </div>
              </div>
            )}

            {/* Group Order Card - Clean & Professional Dark Red */}
            {currentUser && !isGroupOrder && (
              <div className="mx-4 my-2.5 p-3 rounded-2xl bg-black-surface border border-brand-red-dark/40 shadow-sm shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center shrink-0 border border-brand-red/30">
                      <Users size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text-light">
                        {lang === 'en' ? 'Group Ordering' : 'الطلب الجماعي'}
                      </h4>
                      <p className="text-[11px] text-text-muted truncate mt-0.5">
                        {lang === 'en'
                          ? 'Order together, each sandwich labeled by name'
                          : 'اطلب مع أصحابك وكل ساندوتش يوصل باسم صاحبه'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(true)}
                    className="shrink-0 px-3 py-1.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    {lang === 'en' ? 'Start Order' : 'بدء طلب'}
                  </button>
                </div>
              </div>
            )}

            {/* Free Delivery Progress Bar */}
            {isFreeDeliveryEnabled && cartItems.length > 0 && orderType === 'delivery' && (
              <div className="px-5 py-3.5 bg-gradient-to-r from-brand-red-dark/20 via-black-surface to-brand-red-dark/20 border-b border-brand-red-dark/30 shrink-0">
                <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm font-bold">
                  {isUnlocked ? (
                    <>
                      <Truck className="w-4 h-4 text-brand-red shrink-0" />
                      <span className="text-brand-red font-black flex-1 leading-snug">
                        {successMessage}
                      </span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 text-brand-red shrink-0" />
                      <span className="text-text-light flex-1 leading-snug">
                        {progressMessage}
                      </span>
                    </>
                  )}
                </div>
                {/* Progress track */}
                <div className="w-full bg-black-primary/90 h-2.5 rounded-full overflow-hidden border border-brand-red-dark/40 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      isUnlocked 
                        ? 'bg-gradient-to-r from-brand-red-dark via-brand-red to-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]' 
                        : 'bg-gradient-to-r from-brand-red-dark to-brand-red shadow-[0_0_8px_rgba(220,38,38,0.3)]'
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-text-muted mt-1 font-mono">
                  <span>{currentTotal} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
                  <span className={isUnlocked ? 'text-brand-red font-bold' : 'text-text-muted'}>
                    {isUnlocked ? '100%' : `${progress}%`}
                  </span>
                  <span>{freeDeliveryThreshold} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
                </div>
              </div>
            )}

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
                            
                            {/* Group Order Guest Badge */}
                            {(item.guestName || item.product?.guestName) && (
                              <div className="mb-1.5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                                  
                                  <span>{lang === 'en' ? 'For:' : 'لـ:'} {item.guestName || item.product?.guestName}</span>
                                </span>
                              </div>
                            )}
                            
                            {item.product.isSoldByWeight && (
                              <span className="text-sm text-text-muted mb-1">{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'g' : 'جرام'}</span>
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

                            {/* Edit Button for customizable items */}
                            {Boolean(item.product?.isCustomBurger || item.product?.isCustomShake || item.product?.isCustomMeal || item.product?.isCustomizable || (item.product?.selectedModifiers && item.product.selectedModifiers.length > 0)) && (
                              <div className="mb-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCartItem({ item, index })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-red/15 hover:bg-brand-red text-brand-red hover:text-white border border-brand-red/30 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <Pencil size={12} />
                                  <span>{lang === 'en' ? 'Edit Ingredients' : 'تعديل المكونات'}</span>
                                </button>
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

                  {/* Smart Upsell & Cross-Selling Bar */}
                  <SmartUpsellBar menuData={menuData} />
                </div>
              )}
            </div>

            {/* Footer / Checkout */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-black-surface border-t border-brand-red-dark/30 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6 text-lg">
                  <span className="font-bold text-text-muted">{lang === 'en' ? 'Total:' : 'الإجمالي:'}</span>
                  <span className="font-black text-2xl text-text-light">{cartTotal} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
                </div>
                {isGroupOrder && !isGroupHost ? (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center text-xs text-purple-200 font-bold flex items-center justify-center gap-2">
                      
                      <span>
                        {lang === 'en' 
                          ? `Waiting for host (${groupData?.hostName}) to complete checkout` 
                          : `في انتظار المنظم (${groupData?.hostName}) لتأكيد وإرسال الطلب`}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsGroupModalOpen(true)}
                      className="w-full py-3 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <Users size={16} />
                      <span>{lang === 'en' ? 'Invite More Friends' : 'دعوة أصدقاء آخرين'}</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full py-4 bg-brand-red text-text-light font-bold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors shadow-lg shadow-brand-red/30 active:scale-[0.99]"
                  >
                    <span>{isGroupOrder ? (lang === 'en' ? 'Checkout Group Order 🚀' : 'إتمام الطلب الجماعي') : (lang === 'en' ? 'Checkout' : 'إتمام الطلب')}</span>
                    <ArrowLeft size={20} />
                  </button>
                )}

                {/* زر أضف منتج آخر */}
                <button 
                  type="button"
                  onClick={() => {
                    continueShopping();
                    navigate('/menu');
                  }}
                  className="group w-full mt-2.5 py-3.5 px-4 bg-black-primary/80 hover:bg-black-primary active:bg-white/[0.08] text-text-light hover:text-white font-bold rounded-xl text-base flex items-center justify-center gap-2.5 border border-white/10 hover:border-brand-red/60 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-red/15 text-brand-red flex items-center justify-center shrink-0 group-hover:bg-brand-red group-hover:text-white transition-all duration-200">
                    <Plus size={15} strokeWidth={2.5} />
                  </div>
                  <span className="tracking-wide font-bold">{lang === 'en' ? 'Add Another Item' : 'أضف منتج آخر'}</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Customizable Item Edit Modal */}
          {editingCartItem && (
            getCustomizerType(editingCartItem.item.product) === 'drink' ? (
              <ShakeLabModal
                key={`edit_shake_${editingCartItem.index}_${editingCartItem.item.product.id}`}
                isOpen={true}
                onClose={() => setEditingCartItem(null)}
                baseProduct={findBaseProduct(editingCartItem.item.product.id) || editingCartItem.item.product}
                menuData={menuData}
                initialCustomization={editingCartItem.item.product}
                onSaveEdit={(updatedProduct) => {
                  updateCartItem(editingCartItem.index, updatedProduct);
                  setEditingCartItem(null);
                }}
              />
            ) : (
              <BurgerLabModal
                key={`edit_burger_${editingCartItem.index}_${editingCartItem.item.product.id}`}
                isOpen={true}
                onClose={() => setEditingCartItem(null)}
                baseProduct={findBaseProduct(editingCartItem.item.product.id) || editingCartItem.item.product}
                menuData={menuData}
                initialCustomization={editingCartItem.item.product}
                onSaveEdit={(updatedProduct) => {
                  updateCartItem(editingCartItem.index, updatedProduct);
                  setEditingCartItem(null);
                }}
              />
            )
          )}
        </>
      )}
    </AnimatePresence>
  );
}
