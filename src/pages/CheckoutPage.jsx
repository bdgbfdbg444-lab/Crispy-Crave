import { useLanguage } from '../context/LanguageContext';
import PaymentSection from '../components/PaymentSection';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewModal from '../components/ReviewModal';
import imageCompression from 'browser-image-compression';

export default function CheckoutPage({ menuData }) {
  const { lang } = useLanguage();
  const { cartItems, cartTotal, clearCart, tableNumber } = useCart();
  const { customerData, userPhone } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: customerData?.Name || '',
    customerPhone: userPhone || '',
    notes: '',
    orderType: tableNumber ? 'DineIn' : 'takeaway', deliveryAddress: customerData?.addresses?.find(a => a.isDefault)?.fullAddress || customerData?.Address || '', tableNumber: tableNumber || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState("New");
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [activeOrderWarning, setActiveOrderWarning] = useState(() => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) return null;
    const actId = localStorage.getItem('activeOrderId');
    if (actId) {
      return {
        orderId: actId,
        cleanId: actId.replace('#', '').trim(),
        status: 'Pending'
      };
    }
    return null;
  });

  useEffect(() => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) {
      setActiveOrderWarning(null);
      return;
    }

    const activeId = localStorage.getItem('activeOrderId');
    if (activeId) {
      const cleanId = activeId.replace('#', '').trim();
      fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${cleanId}.json`)
        .then(res => res.json())
        .then(data => {
          const currentPhone = (userPhone || formData.customerPhone || '').trim();
          // If the order in localStorage belongs to a different account/phone, clear it!
          if (data && currentPhone && data.CustomerPhone && data.CustomerPhone.trim() !== currentPhone) {
            localStorage.removeItem('activeOrderId');
            setActiveOrderWarning(null);
            return;
          }

          if (!data || data.Status === 'Completed' || data.Status === 'Cancelled') {
            localStorage.removeItem('activeOrderId');
            setActiveOrderWarning(null);
          } else {
            setActiveOrderWarning({
              orderId: activeId,
              cleanId: cleanId,
              status: data.Status || 'Pending'
            });
          }
        })
        .catch(() => {
          setActiveOrderWarning(null);
        });
    } else {
      setActiveOrderWarning(null);
    }
  }, [userPhone, formData.customerPhone]);
  const handleCancelEditing = () => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) {
      try {
        fetch(`${APP_CONFIG.firebaseDbUrl}ActiveHoldRequests/${editingId}.json`, { method: 'DELETE' });
        fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${editingId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            IsModifying: false, 
            ModificationExpired: true, 
            ModificationCount: 1 
          })
        });
      } catch(e) {}
    }
    localStorage.removeItem('editingOrderId');
    localStorage.removeItem('editingOrderDetails');
    localStorage.removeItem('modificationExpiresAt');
    clearCart();
    setShowPayment(false);
  };

  useEffect(() => {
    const editingId = localStorage.getItem('editingOrderId');
    const editingDetailsStr = localStorage.getItem('editingOrderDetails');
    if (editingId && editingDetailsStr) {
      // Validate with Firebase if the order is still active or cancelled!
      fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${editingId}.json`)
        .then(res => res.json())
        .then(data => {
          if (data && (data.Status === 'Cancelled' || data.Status === 'Completed')) {
            // Order was cancelled or completed! Auto-clear editing session immediately!
            localStorage.removeItem('editingOrderId');
            localStorage.removeItem('editingOrderDetails');
            setShowPayment(false);
          } else {
            try {
              const details = JSON.parse(editingDetailsStr);
              setFormData(prev => ({
                ...prev,
                customerName: details.customerName || prev.customerName,
                customerPhone: details.customerPhone || prev.customerPhone,
                orderType: details.orderType || prev.orderType,
                deliveryAddress: details.deliveryAddress || prev.deliveryAddress,
                tableNumber: details.tableNumber || prev.tableNumber,
                notes: details.notes || prev.notes
              }));
              setShowPayment(true);
            } catch(e) {}
          }
        })
        .catch(() => {
          try {
            const details = JSON.parse(editingDetailsStr);
            setFormData(prev => ({
              ...prev,
              customerName: details.customerName || prev.customerName,
              customerPhone: details.customerPhone || prev.customerPhone,
              orderType: details.orderType || prev.orderType,
              deliveryAddress: details.deliveryAddress || prev.deliveryAddress,
              tableNumber: details.tableNumber || prev.tableNumber,
              notes: details.notes || prev.notes
            }));
            setShowPayment(true);
          } catch(e) {}
        });
    }
  }, []);


  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'vgk0saib';
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

  const marketing = menuData?.marketing || {};
  const walletNumber = marketing.walletNumber;
  const whatsappNumber = marketing.orderWhatsAppNumber || '201000000000'; // Default fallback

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    if (formData.orderType === 'delivery' && !formData.deliveryAddress.trim()) { 
      setErrorMessage(lang === 'en' ? 'Please enter delivery address' : 'يرجى إدخال عنوان التوصيل'); 
      return; 
    }
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) { 
      setErrorMessage(lang === 'en' ? 'Please fill required fields' : 'يرجى ملء الحقول الإجبارية (الاسم ورقم الهاتف)'); 
      return; 
    }
    
    setErrorMessage('');
    setShowPayment(true);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(lang === 'en' ? 'Only image files are allowed.' : 'يسمح فقط برفع الصور.');
        return;
      }
      try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
        const compressed = await imageCompression(file, options);
        setReceiptFile(compressed);
      } catch (error) {
        console.error('Error compressing image:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Checkout Submit] Form submit button clicked!");

    if (activeOrderWarning && !localStorage.getItem("editingOrderId")) {
      const msg = lang === "en" 
        ? `You already have order #${activeOrderWarning.cleanId} in progress.`
        : `لديك طلب نشط حالياً برقم #${activeOrderWarning.cleanId} قيد التنفيذ، لا يمكنك إنشاء طلب جديد حتى استلامه.`;
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage(lang === "en" ? "The cart cannot be empty. Please add at least one item." : "لا يمكن أن تكون السلة فارغة. يرجى إضافة صنف واحد على الأقل أو إلغاء التعديل.");
      return;
    }

    if (formData.orderType === "delivery" && !formData.deliveryAddress.trim()) {
      setErrorMessage("يُرجى إدخال عنوان التوصيل بالتفصيل");
      return;
    }

    if (!receiptFile) {
      setErrorMessage(lang === "en" ? "Please upload the payment receipt before confirming." : "يرجى إرفاق صورة إيصال الدفع لتأكيد الطلب.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Prepare Order Data
      let displayOrderId = '#' + Math.floor(1000 + Math.random() * 9000);
      
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

      let paymentReceiptUrl = null;
      if (receiptFile) {
        const cloudData = new FormData();
        cloudData.append('file', receiptFile);
        cloudData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: cloudData,
        });
        if (res.ok) {
          const cloudResult = await res.json();
          paymentReceiptUrl = cloudResult.secure_url;
        }
      }

      const orderPayload = {
        orderDate: new Date().toISOString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        notes: formData.notes,
        orderType: formData.orderType,
        deliveryAddress: formData.orderType === 'delivery' ? formData.deliveryAddress : '',
        tableNumber: formData.orderType === 'DineIn' ? formData.tableNumber : '',
        totalAmount: cartTotal,
        paymentMethod: 'Cash',
        status: 'New',
        items: items,
        displayOrderId: displayOrderId,
        paymentReceiptUrl: paymentReceiptUrl
      };

      const editingOrderId = localStorage.getItem('editingOrderId');
      if (editingOrderId) {
        orderPayload.displayOrderId = editingOrderId;
        orderPayload.isModification = true;
        
        // Push modification request to Firebase Orders node! (To bypass security rules)
        const modResponse = await fetch(`${APP_CONFIG.firebaseDbUrl}OrderModificationRequests.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (!modResponse.ok) {
           const errText = await modResponse.text();
           console.error("Firebase Error:", errText);
           throw new Error(`فشل في إرسال طلب التعديل: ${errText}`);
        }
        
        localStorage.removeItem('editingOrderId');
        displayOrderId = editingOrderId;
      } else {
        // 2. Send to Firebase POST /Orders.json
        const response = await fetch(`${APP_CONFIG.firebaseDbUrl}Orders.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || 'فشل في إرسال الطلب، يرجى التأكد من اتصالك بالانترنت.');
        }

        if (!responseData || !responseData.name) {
          throw new Error('فشل غير متوقع من الخادم. لم يتم إنشاء الأوردر.');
        }
      }

      // 3. Success Handling (ONLY runs if fetch succeeded and threw no errors)
      setGeneratedOrderId(displayOrderId);
      setFinalTotal(cartTotal);

      // Save order items & details for future modifications
      const existingDetailsStr = localStorage.getItem(`order_${displayOrderId}_details`);
      const existingDetails = existingDetailsStr ? JSON.parse(existingDetailsStr) : {};
      const newModCount = editingOrderId ? (existingDetails.modificationCount || 0) + 1 : 0;

      localStorage.setItem(`order_${displayOrderId}_items`, JSON.stringify(cartItems));
      localStorage.setItem(`order_${displayOrderId}_details`, JSON.stringify({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        orderType: formData.orderType,
        deliveryAddress: formData.deliveryAddress,
        tableNumber: formData.tableNumber,
        notes: formData.notes,
        createdAt: existingDetails.createdAt || Date.now(),
        originalTotal: cartTotal,
        modificationCount: newModCount
      }));

      localStorage.removeItem('editingOrderId');
      localStorage.removeItem('editingOrderDetails');

      const cleanId = displayOrderId.replace(/#/g, '').trim();

      // Immediately initialize OrderTracking node in Firebase with Status: 'Pending'
      try {
        await fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${cleanId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Status: 'Pending',
            CustomerName: formData.customerName,
            CustomerPhone: formData.customerPhone,
            OrderType: formData.orderType,
            DeliveryAddress: formData.orderType === 'delivery' ? formData.deliveryAddress : '',
            TableNumber: formData.orderType === 'DineIn' ? formData.tableNumber : '',
            TotalAmount: cartTotal,
            CreatedAt: Date.now(),
            Items: items
          })
        });
      } catch(e) {}

      clearCart();
      const currentPhone = (formData.customerPhone || '').trim();
      if (currentPhone) {
        localStorage.setItem('activeOrder_' + currentPhone, cleanId);
      }
      localStorage.setItem('activeOrderId', cleanId);
      localStorage.setItem('activeOrderTotal', cartTotal);
      setIsSubmitting(false);
      sessionStorage.setItem('placed_order_' + cleanId, 'true');
      // Navigate cleanly without '#' symbol so HashRouter does not double-hash!
      navigate('/track/' + cleanId);
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

  if (activeOrderWarning && !localStorage.getItem("editingOrderId")) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
        <div className="max-w-md w-full bg-black-primary border border-brand-red/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6 border border-amber-500/30">
            <AlertCircle size={44} />
          </div>
          <h2 className="text-2xl font-display font-black text-text-light mb-3">
            {lang === "en" ? "Active Order in Progress" : "لديك طلب نشط قيد التنفيذ!"}
          </h2>
          <p className="text-text-muted leading-relaxed mb-6 text-sm">
            {lang === "en" 
              ? `You already have order #${activeOrderWarning.cleanId} in progress. You cannot place a new order until your current order is completed.`
              : `لديك طلب حالي برقم #${activeOrderWarning.cleanId} جاري مراجعته أو تجهيزه في المطعم. لضمان عدم تداخل الطلبات وسرعة وصولها، لا يمكنك إنشاء طلب جديد قبل استلام طلبك الحالي.`}
          </p>
          <button 
            type="button"
            onClick={() => navigate(`/track/${encodeURIComponent(activeOrderWarning.cleanId)}`)}
            className="w-full py-4 rounded-xl font-bold text-text-light bg-brand-red hover:bg-brand-red-dark transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <span>{lang === "en" ? "Track My Active Order" : `متابعة طلبي الحالي #${activeOrderWarning.cleanId}`}</span>
            <ArrowRight size={18} className={lang === "ar" ? "rotate-180" : ""} />
          </button>
          <button 
            type="button"
            onClick={() => navigate("/menu")}
            className="w-full py-3 rounded-xl font-bold text-text-muted hover:text-text-light transition-colors text-sm cursor-pointer"
          >
            {lang === "en" ? "Back to Menu" : "العودة للمنيو"}
          </button>
        </div>
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

              {!showPayment ? (
                  <>
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
                        <label className="block text-sm font-bold text-text-light mt-6 mb-2">{lang === 'en' ? 'Delivery Address' : 'عنوان التوصيل'} *</label>
                        
                        {/* Address Cards Selector */}
                        {customerData?.addresses?.length > 0 && (
                          <div className="mb-4 flex flex-col gap-2">
                             {customerData.addresses.map(addr => {
                               const isSelected = formData.deliveryAddress === addr.fullAddress;
                               return (
                               <label key={addr.id} className={`p-3 rounded-xl border cursor-pointer flex gap-3 items-start transition-all ${isSelected ? 'bg-brand-red/10 border-brand-red' : 'bg-black-surface border-brand-red-dark/30 hover:border-brand-red-dark'}`}>
                                  <input 
                                    type="radio" 
                                    name="deliveryAddressSelection"
                                    value={addr.fullAddress}
                                    checked={isSelected}
                                    onChange={(e) => setFormData(prev => ({...prev, deliveryAddress: e.target.value}))}
                                    className="mt-1 shrink-0 accent-brand-red"
                                  />
                                  <div>
                                    <span className="font-bold text-text-light block">{lang === 'en' ? (addr.label === 'المنزل' ? 'Home' : addr.label === 'العمل' ? 'Work' : 'Other') : addr.label}</span>
                                    <span className="text-text-muted text-sm">{addr.fullAddress}</span>
                                  </div>
                               </label>
                             )})}
                             <label className={`p-3 rounded-xl border cursor-pointer flex gap-3 items-center transition-all ${!customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress) && formData.deliveryAddress !== '' ? 'bg-brand-red/10 border-brand-red' : 'bg-black-surface border-brand-red-dark/30 hover:border-brand-red-dark'}`}>
                                  <input 
                                    type="radio" 
                                    name="deliveryAddressSelection"
                                    value="other"
                                    checked={!customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress)}
                                    onChange={() => setFormData(prev => ({...prev, deliveryAddress: ''}))}
                                    className="shrink-0 accent-brand-red"
                                  />
                                  <span className="font-bold text-text-light">{lang === 'en' ? 'Other Address (Manual)' : 'عنوان آخر (كتابة يدوية)'}</span>
                             </label>
                          </div>
                        )}

                        {/* Fallback/Manual Textarea */}
                        {(!customerData?.addresses?.length || !customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress)) && (
                          <textarea 
                            name="deliveryAddress"
                            required={formData.orderType === 'delivery'}
                            value={formData.deliveryAddress}
                            onChange={handleChange}
                            rows="2"
                            className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all resize-none"
                            placeholder={lang === 'en' ? 'Area, Street, Building, Floor, Apt...' : 'المنطقة، الشارع، رقم العمارة، الدور، شقة...'}
                          ></textarea>
                        )}
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

                <button 
                    type="button" 
                    onClick={handleContinueToPayment}
                    className="w-full mt-8 py-4 rounded-xl font-bold text-lg text-text-light transition-all shadow-lg bg-brand-red hover:bg-brand-red-dark shadow-brand-red/30"
                  >
                    {lang === 'en' ? 'Continue to Payment' : 'المتابعة للدفع'}
                  </button>
                  </>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* If editing, show a prominent modification summary banner */}
                    {localStorage.getItem('editingOrderId') && (() => {
                      const editingDetails = JSON.parse(localStorage.getItem('editingOrderDetails') || '{}');
                      const activeTotal = parseFloat(localStorage.getItem('activeOrderTotal') || '0');
                      const origTotal = editingDetails.originalTotal || (activeTotal > 0 ? activeTotal : 0);
                      const priceDiff = cartTotal - origTotal;
                      return (
                        <div className="mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
                              <span>✏️ ملخص تعديل الأوردر</span>
                              <span className="bg-amber-500/20 px-2 py-0.5 rounded-lg text-sm font-mono">#{localStorage.getItem('editingOrderId')}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={handleCancelEditing}
                              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>✕ إلغاء التعديل وبدء طلب جديد</span>
                            </button>
                          </div>
                          <div className="flex justify-between text-sm text-text-muted mb-1">
                            <span>الحساب الأصلي:</span>
                            <span className="font-bold text-text-light">{origTotal.toFixed(2)} ج.م</span>
                          </div>
                          <div className="flex justify-between text-sm text-text-muted mb-2">
                            <span>الحساب الجديد بعد التعديل:</span>
                            <span className="font-bold text-text-light">{cartTotal.toFixed(2)} ج.م</span>
                          </div>
                          <div className="pt-3 border-t border-amber-500/20 flex justify-between font-bold">
                            <span className="text-text-light text-base">
                              {priceDiff > 0 ? 'مبلغ الفرق الإضافي للدفع:' : priceDiff < 0 ? 'مبلغ الفرق المسترد:' : 'فرق الحساب:'}
                            </span>
                            <span className={`text-xl ${priceDiff > 0 ? 'text-amber-500' : priceDiff < 0 ? 'text-green-500' : 'text-text-light'}`}>
                              {priceDiff > 0 ? `+${priceDiff.toFixed(2)} ج.م` : `${priceDiff.toFixed(2)} ج.م`}
                            </span>
                          </div>
                          {priceDiff > 0 && (
                            <p className="text-xs text-amber-400 mt-3 font-semibold leading-relaxed">
                              * يرجى تحويل مبلغ الزيادة (${priceDiff.toFixed(2)} ج.م) ورفع صورة الإيصال بالأسفل لتأكيد التعديل.
                            </p>
                          )}
                          {priceDiff <= 0 && (
                            <p className="text-xs text-green-400 mt-3 font-semibold leading-relaxed">
                              * لا يوجد مبلغ إضافي مطلوب، سيتم تسوية الحساب عند الاستلام.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {!localStorage.getItem('editingOrderId') && (
                      <button 
                        type="button" 
                        onClick={() => setShowPayment(false)}
                        className="mb-6 flex items-center gap-2 text-text-muted hover:text-text-light transition-colors"
                      >
                        <ArrowRight className="rotate-180" size={20} />
                        <span className="font-bold">{lang === 'en' ? 'Back to Details' : 'الرجوع للبيانات'}</span>
                      </button>
                    )}

                    <PaymentSection marketing={marketing} onFileSelect={handleFileSelect} />

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`w-full mt-8 py-4 rounded-xl font-bold text-lg text-text-light transition-all shadow-lg ${isSubmitting ? 'bg-brand-red-dark/50 text-text-muted cursor-not-allowed' : 'bg-brand-red hover:bg-brand-red-dark shadow-brand-red/30'}`}
                    >
                      {isSubmitting ? 'جاري الإرسال...' : (lang === 'en' ? 'Confirm and Submit Order' : 'تأكيد وإرسال الطلب')}
                    </button>
                    </div>
                  )}
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

