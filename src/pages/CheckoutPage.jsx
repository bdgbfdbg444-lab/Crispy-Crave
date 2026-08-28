import { useLanguage } from '../context/LanguageContext';
import PaymentSection from '../components/PaymentSection';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewModal from '../components/ReviewModal';

export default function CheckoutPage({ menuData }) {
  const { lang } = useLanguage();
  const { cartItems, cartTotal, clearCart, tableNumber } = useCart();
  const { customerData, userPhone } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: customerData?.Name || '',
    customerPhone: userPhone || '',
    notes: '',
    orderType: tableNumber ? 'DineIn' : 'takeaway', deliveryAddress: '', tableNumber: tableNumber || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState("New");
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const marketing = menuData?.marketing || {};
  const walletNumber = marketing.walletNumber;
  const whatsappNumber = marketing.orderWhatsAppNumber || '201000000000'; // Default fallback

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (formData.orderType === 'delivery' && !formData.deliveryAddress.trim()) { setErrorMessage('يرجى إدخال عنوان التوصيل بالتفصيل'); return; }
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Prepare Order Data
      const displayOrderId = '#' + Math.floor(1000 + Math.random() * 9000);
      
      const items = cartItems.map(item => {
        let modifierText = '';
        if (item.product.selectedModifiers?.length > 0) {
          modifierText = ' - ' + item.product.selectedModifiers.map(m => m.name).join(', ');
        }
        
        let weightText = '';
        if (item.product.isSoldByWeight && item.product.selectedWeight) {
          weightText = ` (${item.product.selectedWeight} ${lang === 'en' ? 'gm' : 'جرام'})`;
        }

        const finalProductName = `${item.product.name}${weightText}${modifierText}`;
        const unitPrice = (item.product.calculatedPrice || item.product.sellingPrice) + (item.product.finalModifiersPrice || 0);

        return {
            productName: finalProductName,
            quantity: item.quantity,
            unitPrice: unitPrice,
            productId: item.product.id,
            weightInGrams: item.product.selectedWeight || 0,
            modifierNotes: modifierText
          };
      });

      const orderPayload = {
        orderDate: new Date().toISOString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone, deliveryAddress: formData.orderType === 'delivery' ? formData.deliveryAddress : '',
        notes: formData.notes,
        totalAmount: cartTotal,
        orderType: formData.orderType,
          tableNumber: formData.tableNumber,
        displayOrderId: displayOrderId,
        items: items
      };

      // 2. Send to Firebase POST /Orders.json
      const response = await fetch(`${APP_CONFIG.firebaseDbUrl}Orders.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'فشل في إرسال الطلب، يرجى التأكد من اتصالك بالإنترنت.');
      }

      if (!responseData || !responseData.name) {
        throw new Error('استجابة غير متوقعة من السيرفر. لم يتم تأكيد الطلب.');
      }

      // 3. Success Handling (ONLY runs if fetch succeeded and threw no errors)
      setGeneratedOrderId(displayOrderId);
      setFinalTotal(cartTotal);
      clearCart();
      localStorage.setItem('activeOrderId', displayOrderId);
      localStorage.setItem('activeOrderTotal', cartTotal);
      setIsSubmitting(false);
      navigate('/track/' + encodeURIComponent(displayOrderId));
      return;

    } catch (error) {
      console.error("Error submitting order:", error);
      
      let msg = "حدث خطأ غير متوقع أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.";
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        msg = "حصل خطأ في الاتصال، تأكد من الإنترنت وحاول تاني.";
      } else if (error.message) {
        // Use our custom thrown Arabic errors if available
        // If it's a generic English error, fallback to the connection message
        if (/[a-zA-Z]/.test(error.message) && !error.message.includes('فشل')) {
           msg = "حصل خطأ في الاتصال، تأكد من الإنترنت وحاول تاني.";
        } else {
           msg = error.message;
        }
      }
      
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const text = `${lang === 'en' ? 'Hello, I would like to confirm my new order from' : 'مرحباً، أود تأكيد طلبي الجديد من'} ${APP_CONFIG.restaurantName}.\n\n${lang === 'en' ? 'Name:' : 'الاسم:'} ${formData.customerName}\n${lang === 'en' ? 'Order Number:' : 'رقم الأوردر:'} ${generatedOrderId}\n${lang === 'en' ? 'Total:' : 'الإجمالي:'} ${finalTotal} ${lang === 'en' ? 'EGP' : 'ج.م'}\n${lang === 'en' ? 'Type:' : 'النوع:'} ${formData.orderType === 'DineIn' ? (lang === 'en' ? 'Dine-in' : 'صالة') : formData.orderType === 'delivery' ? (lang === 'en' ? 'Delivery' : 'دليفري') : (lang === 'en' ? 'Takeaway' : 'تيك أواي')}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    navigate('/');
  };

  if (isSuccess) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-black-surface p-10 rounded-3xl shadow-xl max-w-md w-full border border-green-100">
          <div className="w-20 h-20 bg-green-900/30 border border-green-700/50 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-display font-black text-text-light mb-2">تم استلام طلبك!</h2>
          <p className="text-text-muted mb-6">رقم الأوردر الخاص بك هو <strong className="text-text-light text-lg">{generatedOrderId}</strong></p>
          
          <div className="bg-black-primary p-4 rounded-xl mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">{lang === 'en' ? 'Total:' : ''}</span>
              <span className="font-bold text-lg">{finalTotal} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted"></span>
              <span className="font-bold">{formData.customerName}</span>
            </div>
          </div>

          {formData.orderType === 'DineIn' ? (
            <div className="bg-brand-red/5 border border-brand-red/20 text-text-light p-5 rounded-xl font-bold text-center">
              {lang === 'en' ? 'Please head to the cashier with your order number' : 'برجاء التوجه للكاشير مع رقم طلبك'} 
              <span className="text-brand-red mx-1">{generatedOrderId}</span>
              {lang === 'en' ? 'to complete payment' : 'لإتمام الدفع'}
            </div>
          ) : (
            <>
            <button 
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] text-text-light py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebd5a] transition-colors shadow-lg shadow-green-500/20"
              >
                تواصل عبر واتساب
              </button>

            {/* Live Order Tracking */}
            <div className="bg-black-surface p-5 rounded-xl border mt-6 text-right">
              <h3 className="font-bold mb-4">تتبع الطلب لحظياً</h3>
              <div className="relative">
                <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-black-surface"></div>
                {[
                  { id: 'New', label: 'تم الاستلام' },
                  { id: 'Accepted', label: 'تم القبول (جاري المراجعة)' },
                  { id: 'InKitchen', label: 'في المطبخ (جاري التحضير)' },
                  { id: 'Ready', label: 'جاهز' },
                  { id: 'Completed', label: 'تم التسليم' }
                ].map((step, index) => {
                  let statusIndex = ['New', 'Accepted', 'InKitchen', 'Ready', 'Completed'].indexOf(orderStatus);
                  let isCompleted = index <= statusIndex;
                  let isCurrent = index === statusIndex;
                  
                  return (
                    <div key={step.id} className="relative flex items-center gap-4 mb-4 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-black-surface ${isCompleted ? 'bg-brand-red' : 'bg-black-surface'}`}>
                        {isCompleted && <CheckCircle size={14} className="text-text-light" />}
                      </div>
                      <span className={`font-bold ${isCurrent ? 'text-brand-red' : isCompleted ? 'text-text-light' : 'text-text-muted'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <br/>
            <button 
              className="w-full bg-[#25D366] text-text-light py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebd5a] transition-colors shadow-lg shadow-green-500/20"
            >
              مراسلتنا لتأكيد الطلب 💬
            </button>
            </>
          )}

          <button 
            onClick={() => setIsReviewModalOpen(true)}
            className="w-full mt-4 bg-black-surface text-text-light border-2 border-brand-red-dark/30 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-brand-red hover:text-brand-red transition-colors"
          >
            شاركنا رأيك في الطلب ⭐️
          </button>
        </div>

        <ReviewModal 
          isOpen={isReviewModalOpen} 
          onClose={() => setIsReviewModalOpen(false)} 
        />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag size={64} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-text-light mb-4">{lang === 'en' ? 'Cart is empty' : 'سلة الطلبات فارغة'}</h2>
        <p className="text-text-muted mb-8">أضف بعض المنتجات الشهية أولاً لتقوم بإتمام الطلب.</p>
        <button 
          onClick={() => navigate('/menu')}
          className="bg-brand-red text-text-light px-8 py-3 rounded-full font-bold hover:bg-brand-red-dark transition-colors"
        >
          تصفح المنيو
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 min-h-screen bg-black-surface">
      <div className="container mx-auto px-6 max-w-4xl">
        <button 
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-text-muted hover:text-text-light font-bold mb-8 transition-colors w-fit"
        >
          <ArrowRight size={20} />
          {lang === 'en' ? 'Back to Menu' : 'العودة للمنيو'}
        </button>

        <h1 className="text-4xl font-display font-black text-text-light mb-8">{lang === 'en' ? 'Checkout' : 'إتمام الطلب'}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-black-surface p-6 md:p-8 rounded-3xl shadow-sm border border-brand-red-dark/30">
              
              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6 bg-red-900/30 border border-red-900/50 text-red-400 px-4 py-4 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <span className="font-bold">{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order Type */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-text-light mb-4">{lang === 'en' ? 'Order Type' : 'نوع الطلب'}</h3>
                
                {!tableNumber ? (
                  <div className="grid grid-cols-3 gap-4">
                    {['DineIn', 'takeaway', 'delivery'].map(type => (
                      <label key={type} className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${formData.orderType === type ? 'border-brand-red bg-brand-red/5 text-brand-red' : 'border-brand-red-dark/30 text-text-muted hover:border-brand-red-dark/50'}`}>
                        <input 
                          type="radio" 
                          name="orderType" 
                          value={type} 
                          checked={formData.orderType === type}
                          onChange={handleChange}
                          className="hidden" 
                        />
                        <span className="font-bold block">{type === 'DineIn' ? (lang === 'en' ? 'Dine-in' : 'صالة') : type === 'delivery' ? (lang === 'en' ? 'Delivery' : 'توصيل') : (lang === 'en' ? 'Takeaway' : 'تيك اواي')}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-brand-red/10 border border-brand-red text-brand-red p-4 rounded-xl text-center">
                    <span className="font-bold text-lg">أنت تطلب من طاولة رقم {tableNumber}</span>
                  </div>
                )}

              </div>

              {/* Customer Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Full Name' : 'الاسم بالكامل'} *</label>
                  <input 
                    type="text" 
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all"
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Phone Number' : 'رقم الهاتف'} *</label>
                  <input 
                    type="tel" 
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all"
                    placeholder="مثال: 010xxxxxxxx" />
                </div>

                <AnimatePresence>
                  {formData.orderType === 'delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-bold text-text-light mt-6 mb-2">{lang === 'en' ? 'Detailed Address' : 'العنوان بالتفصيل'} *</label>
                      <textarea 
                        name="deliveryAddress"
                        required={formData.orderType === 'delivery'}
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        rows="2"
                        className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all resize-none"
                        placeholder='المنطقة، الشارع، رقم العمارة، الدور، أي علامة مميزة...'
                      ></textarea>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Additional Notes (Optional)' : 'ملاحظات إضافية (اختياري)'}</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all resize-none"
                    placeholder={lang === 'en' ? 'No onions, well done...' : 'بدون بصل، تسوية زيادة...'}
                  ></textarea>
                </div>
              </div>

                <PaymentSection marketing={marketing} />

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full mt-8 py-4 rounded-xl font-bold text-lg text-text-light transition-all shadow-lg ${isSubmitting ? 'bg-brand-red-dark/50 text-text-muted cursor-not-allowed' : 'bg-brand-red hover:bg-brand-red-dark shadow-brand-red/30'}`}
              >
                {isSubmitting ? 'جاري الإرسال...' : (lang === 'en' ? 'Confirm and Submit Order' : 'تأكيد وإرسال الطلب')}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-black-surface p-6 rounded-3xl shadow-sm border border-brand-red-dark/30 sticky top-24">
              <h3 className="text-xl font-bold text-text-light mb-6 flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-red" />
                {lang === 'en' ? 'Order Summary' : 'ملخص الطلب'}
              </h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pe-">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-start gap-2 border-b border-brand-red-dark/30 pb-4 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-bold text-sm text-text-light">{item.quantity}x {item.product.name}</h4>
                      {item.product.isSoldByWeight && (
                        <p className="text-xs text-text-muted mt-1">{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'EGP' : 'ج'}رام</p>
                      )}
                      {item.product.selectedModifiers?.length > 0 && (
                        <div className="text-xs text-text-muted mt-1">
                          {item.product.selectedModifiers.map(m => m.name).join('، ')}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-sm shrink-0">
                      {((item.product.calculatedPrice || item.product.sellingPrice) + (item.product.finalModifiersPrice || 0)) * item.quantity} {lang === 'en' ? 'EGP' : 'ج'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-brand-red-dark/30 flex justify-between items-center text-xl">
                <span className="font-bold text-text-muted">{lang === 'en' ? 'Total' : 'الإجمالي'}</span>
                <span className="font-black text-brand-red">{cartTotal} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

