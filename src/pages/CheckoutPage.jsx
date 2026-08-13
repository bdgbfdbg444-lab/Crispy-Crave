import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { APP_CONFIG } from '../config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewModal from '../components/ReviewModal';

export default function CheckoutPage({ menuData }) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    notes: '',
    orderType: 'takeaway' // default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');
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
          weightText = ` (${item.product.selectedWeight} جرام)`;
        }

        const finalProductName = `${item.product.name}${weightText}${modifierText}`;
        const unitPrice = (item.product.calculatedPrice || item.product.sellingPrice) + (item.product.finalModifiersPrice || 0);

        return {
          productName: finalProductName,
          quantity: item.quantity,
          unitPrice: unitPrice
        };
      });

      const orderPayload = {
        orderDate: new Date().toISOString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        notes: formData.notes,
        totalAmount: cartTotal,
        orderType: formData.orderType,
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
      setIsSuccess(true);
      clearCart();
      setIsSubmitting(false);

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
    const text = `مرحباً، أود تأكيد طلبي الجديد من ${APP_CONFIG.restaurantName}.\n\nالاسم: ${formData.customerName}\nرقم الأوردر: ${generatedOrderId}\nالإجمالي: ${cartTotal} ج.م\nالنوع: ${formData.orderType === 'dine_in' ? 'صالة' : formData.orderType === 'delivery' ? 'دليفري' : 'تيك أواي'}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    navigate('/');
  };

  if (isSuccess) {
    return (
      <div className="pt-24 min-h-screen bg-light flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-green-100">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-display font-black text-dark mb-2">تم استلام طلبك!</h2>
          <p className="text-gray-500 mb-6">رقم الأوردر الخاص بك هو <strong className="text-dark text-lg">{generatedOrderId}</strong></p>
          
          <div className="bg-gray-50 p-4 rounded-xl mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">الإجمالي:</span>
              <span className="font-bold text-lg">{cartTotal} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الاسم:</span>
              <span className="font-bold">{formData.customerName}</span>
            </div>
          </div>

          {formData.orderType === 'dine_in' ? (
            <div className="bg-primary/5 border border-primary/20 text-dark p-5 rounded-xl font-bold text-center">
              برجاء التوجه للكاشير مع رقم طلبك 
              <span className="text-primary mx-1">{generatedOrderId}</span>
              لإتمام الدفع
            </div>
          ) : (
            <button 
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebd5a] transition-colors shadow-lg shadow-green-500/20"
            >
              مراسلتنا لتأكيد الطلب 💬
            </button>
          )}

          <button 
            onClick={() => setIsReviewModalOpen(true)}
            className="w-full mt-4 bg-white text-dark border-2 border-gray-200 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
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
      <div className="pt-24 min-h-screen bg-light flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag size={64} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-dark mb-4">سلة الطلبات فارغة</h2>
        <p className="text-gray-500 mb-8">أضف بعض المنتجات الشهية أولاً لتقوم بإتمام الطلب.</p>
        <button 
          onClick={() => navigate('/menu')}
          className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
        >
          تصفح المنيو
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 min-h-screen bg-light">
      <div className="container mx-auto px-6 max-w-4xl">
        <button 
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-gray-500 hover:text-dark font-bold mb-8 transition-colors w-fit"
        >
          <ArrowRight size={20} />
          العودة للمنيو
        </button>

        <h1 className="text-4xl font-display font-black text-dark mb-8">إتمام الطلب</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              
              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-4 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <span className="font-bold">{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order Type */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-dark mb-4">نوع الطلب</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['dine_in', 'takeaway', 'delivery'].map(type => (
                    <label key={type} className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${formData.orderType === type ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="orderType" 
                        value={type} 
                        checked={formData.orderType === type}
                        onChange={handleChange}
                        className="hidden" 
                      />
                      <span className="font-bold block">
                        {type === 'dine_in' ? 'صالة' : type === 'takeaway' ? 'تيك أواي' : 'دليفري'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الاسم بالكامل *</label>
                  <input 
                    type="text" 
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف *</label>
                  <input 
                    type="tel" 
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="مثال: 010xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات إضافية (اختياري)</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    placeholder="بدون بصل، تسوية زيادة..."
                  ></textarea>
                </div>
              </div>

              {/* Wallet Info */}
              {walletNumber && (
                <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Wallet size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark mb-1">الدفع عبر المحافظ الإلكترونية</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      يمكنك تحويل قيمة الطلب على الرقم <strong>{walletNumber}</strong> (فودافون كاش / إنستا باي) وإرفاق سكرين شوت عند تأكيد الطلب على الواتساب.
                    </p>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full mt-8 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-primary/30'}`}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'تأكيد وإرسال الطلب'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-dark mb-6 flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                ملخص الطلب
              </h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-start gap-2 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-bold text-sm text-dark">{item.quantity}x {item.product.name}</h4>
                      {item.product.isSoldByWeight && (
                        <p className="text-xs text-gray-500 mt-1">الوزن: {item.product.selectedWeight} جرام</p>
                      )}
                      {item.product.selectedModifiers?.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.product.selectedModifiers.map(m => m.name).join('، ')}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-sm shrink-0">
                      {((item.product.calculatedPrice || item.product.sellingPrice) + (item.product.finalModifiersPrice || 0)) * item.quantity} ج
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xl">
                <span className="font-bold text-gray-600">الإجمالي</span>
                <span className="font-black text-primary">{cartTotal} ج.م</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
