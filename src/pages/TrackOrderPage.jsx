import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, Star, MessageCircle, Edit3, ShieldCheck, Lock, MapPin, Phone, User } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import ReviewModal from '../components/ReviewModal';
import { ref, onValue, off, set, update } from 'firebase/database';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const FIREBASE_URL = 'https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app';

export default function TrackOrderPage({ menuData }) {
  const { lang } = useLanguage();
  const { orderId } = useParams();
  const safeOrderId = (orderId || '').replace(/#/g, '').trim();
  const navigate = useNavigate();
  const { addToCart, clearCart, setCartItems, setIsCartOpen } = useCart();
  const { currentUser, userPhone } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasAutoOpenedReview, setHasAutoOpenedReview] = useState(false);
  const [hasFinishedReview, setHasFinishedReview] = useState(false);

  useEffect(() => {
    if (orderData?.Status === 'Completed' && !hasAutoOpenedReview) {
      setIsReviewModalOpen(true);
      setHasAutoOpenedReview(true);
    }
    
    if (orderData?.Status === 'Completed' || orderData?.Status === 'Cancelled') {
      localStorage.removeItem('activeOrderId');
    }

    // If order was cancelled, immediately clear any pending modification session!
    if (orderData?.Status === 'Cancelled') {
      const safeOrderId = (orderId || '').replace('#', '').trim();
      if (localStorage.getItem('editingOrderId') === safeOrderId) {
        localStorage.removeItem('editingOrderId');
        localStorage.removeItem('editingOrderDetails');
      }
    }
  }, [orderData?.Status, hasAutoOpenedReview, orderId]);

  useEffect(() => {
    const safeOrderId = (orderId || '').replace(/#/g, '').trim();
    if (!safeOrderId) {
      setLoading(false);
      return;
    }

    const trackingRef = ref(db, `PublicTracking/${safeOrderId}`);
    
    const unsubscribe = onValue(trackingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOrderData(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching public tracking data', error);
      setLoading(false);
    });

    return () => {
      off(trackingRef, 'value', unsubscribe);
    };
  }, [orderId]);

  // Fallback listener: POS writes rejection to PublicTracking/{displayOrderId} (short number like "8053")
  // but the primary listener above watches PublicTracking/{trackingToken} (long random string).
  // When POS rejects BEFORE accepting, it doesn't know the trackingToken, so we must also listen on the short ID.
  useEffect(() => {
    // Get the short display order number from localStorage (saved by CheckoutPage on submit)
    const activeOrderNumber = localStorage.getItem('activeOrderNumber');
    const safeId = (orderId || '').replace(/#/g, '').trim();
    
    // Only set up fallback if orderId is a trackingToken (not already a short number)
    // and we have the short number stored
    if (!activeOrderNumber || safeId === activeOrderNumber) return;
    
    const dispRef = ref(db, `PublicTracking/${activeOrderNumber}`);
    const unsub = onValue(dispRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.Status) {
        // Merge POS updates from the short-ID path into our state
        setOrderData(prev => {
          // Only update if the POS path has a more advanced status
          if (!prev || prev.Status === 'Pending' || data.Status === 'Cancelled') {
            return { ...prev, ...data };
          }
          return prev;
        });
      }
    });
    return () => off(dispRef, 'value', unsub);
  }, [orderId]);

  const handleEditOrder = async () => {
    // 1. Guest & Ownership Lock: Only authenticated owner can self-edit
    if (!currentUser) {
       alert(lang === 'en' ? 'To edit an order as a guest, please contact the restaurant via WhatsApp.' : 'لتعديل الطلب كضيف، يرجى التواصل مباشرة مع الفرع عبر الواتساب.');
       return;
    }

    const orderPhone = (orderData?.CustomerPhone || '').trim();
    const userPhoneClean = (userPhone || '').trim();
    if (orderPhone && userPhoneClean && orderPhone !== userPhoneClean) {
       alert(lang === 'en' ? 'Security Alert: You can only edit your own orders.' : '⚠️ تنبيه أمني: لا يمكنك تعديل طلب لا يخص حسابك.');
       return;
    }

    const safeOrderId = (orderId || '').replace('#', '').trim();

    // Pre-flight Check: Live status check to prevent race condition if status changed while viewing page
    try {
      const liveRes = await fetch(`${APP_CONFIG.firebaseDbUrl}PublicTracking/${safeOrderId}.json?t=${Date.now()}`);
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData && ['InKitchen', 'Preparing', 'Ready', 'OutForDelivery', 'Completed', 'Cancelled'].includes(liveData.Status)) {
          alert(lang === 'en' 
            ? '👨‍🍳 Your order is already being prepared in the kitchen or on its way and cannot be modified or cancelled.' 
            : '👨‍🍳 عذراً، بدأ الشيف في تجهيز وجباتك بالمطبخ بالفعل (أو خرجت للتوصيل)، ولا يمكن تعديل أو إلغاء الطلب الآن لضمان جودة وسرعة التسليم.');
          return;
        }
      }
    } catch(e) {}

    const currentStatus = orderData?.Status || 'Pending';
    if (['InKitchen', 'Preparing', 'Ready', 'OutForDelivery', 'Completed', 'Cancelled'].includes(currentStatus)) {
       alert(lang === 'en' 
         ? '👨‍🍳 Your order is already being prepared in the kitchen or on its way and cannot be modified.' 
         : '👨‍🍳 عذراً، بدأ الشيف في تجهيز وجباتك بالمطبخ بالفعل (أو خرجت للتوصيل)، ولا يمكن تعديل أو إلغاء الطلب الآن لضمان جودة وسرعة التسليم.');
       return;
    }

    const rawDetails = localStorage.getItem(`order_${safeOrderId}_details`) 
                    || localStorage.getItem(`order_#${safeOrderId}_details`) 
                    || localStorage.getItem(`order_${orderId}_details`);
    const details = JSON.parse(rawDetails || '{}');

    // Rule 1: Single modification only (مرة واحدة فقط)
    const modCount = details.modificationCount || orderData?.ModificationCount || 0;
    if (modCount >= 1) {
       alert(lang === 'en' ? 'This order has already been modified once. Modifications are allowed only once.' : 'عذراً، تم تعديل هذا الطلب مسبقاً (التعديل مسموح لمرة واحدة فقط).');
       return;
    }

    try {
      // 2. Restore original cart items (Triple-Safety Net: LocalStorage -> orderData -> Firebase REST API)
      let savedItems = [];
      const localSaved = localStorage.getItem(`order_${safeOrderId}_items`) 
                      || localStorage.getItem(`order_#${safeOrderId}_items`) 
                      || localStorage.getItem(`order_${orderId}_items`);
      if (localSaved) {
         try { savedItems = JSON.parse(localSaved); } catch(e) {}
      }

      const allProducts = menuData?.categories?.flatMap(c => c.products || []) || [];

      // Layer 2: orderData from Realtime Listener
      if ((!savedItems || savedItems.length === 0) && orderData?.Items) {
         const itemsList = Array.isArray(orderData.Items) ? orderData.Items : Object.values(orderData.Items);
         savedItems = itemsList.map(item => {
            if (item.product) return item;
            const matched = allProducts.find(p => p.id === item.productId || p.name === item.productName);
            return {
               product: matched || {
                  id: item.productId || Date.now(),
                  name: item.productName || 'صنف',
                  price: item.unitPrice || 0,
                  sellingPrice: item.unitPrice || 0,
                  calculatedPrice: item.unitPrice || 0
               },
               quantity: item.quantity || 1
            };
         });
      }

      // Layer 3: Direct fetch from Firebase REST API fallback
      if (!savedItems || savedItems.length === 0) {
        try {
          const res = await fetch(`${APP_CONFIG.firebaseDbUrl}OrderTracking/${safeOrderId}.json`);
          const trackingNode = await res.json();
          if (trackingNode && trackingNode.Items) {
            const itemsList = Array.isArray(trackingNode.Items) ? trackingNode.Items : Object.values(trackingNode.Items);
            savedItems = itemsList.map(item => {
              if (item.product) return item;
              const matched = allProducts.find(p => p.id === item.productId || p.name === item.productName);
              return {
                product: matched || {
                  id: item.productId || Date.now(),
                  name: item.productName || 'صنف',
                  price: item.unitPrice || 0,
                  sellingPrice: item.unitPrice || 0,
                  calculatedPrice: item.unitPrice || 0
                },
                quantity: item.quantity || 1
              };
            });
          }
        } catch(e) {}
      }

      if (!savedItems || savedItems.length === 0) {
         alert(lang === 'en' ? 'Could not load original items for this order.' : 'تعذر تحميل أصناف الطلب الأصلية للتعديل.');
         return;
      }

      // 3. Start 3-minute modification window
      const expiresAt = Date.now() + 3 * 60 * 1000;
      localStorage.setItem('modificationExpiresAt', expiresAt.toString());
      localStorage.setItem('editingOrderId', safeOrderId);

      // Reliable original total
      const origTotal = details.originalTotal || orderData?.TotalAmount || parseFloat(localStorage.getItem('activeOrderTotal') || '0') || 0;

      localStorage.setItem('editingOrderDetails', JSON.stringify({
         ...details,
         orderId: safeOrderId,
         originalTotal: origTotal,
         expiresAt: expiresAt,
         customerName: details.customerName || orderData?.CustomerName || currentUser?.displayName || '',
         customerPhone: details.customerPhone || orderData?.CustomerPhone || currentUser?.phoneNumber || '',
         orderType: details.orderType || orderData?.OrderType || 'takeaway',
         deliveryAddress: details.deliveryAddress || orderData?.DeliveryAddress || '',
         tableNumber: details.tableNumber || orderData?.TableNumber || '',
         notes: details.notes || orderData?.Notes || ''
      }));

      // 4. Immediately consume the single modification chance!
      details.modificationCount = 1;
      localStorage.setItem(`order_${safeOrderId}_details`, JSON.stringify(details));
      localStorage.setItem(`order_#${safeOrderId}_details`, JSON.stringify(details));

      // 5. Hydrate Cart firmly
      localStorage.setItem('crispy_cart_items', JSON.stringify(savedItems));
      if (setCartItems) {
         setCartItems(savedItems);
      }

      // 5. Update Firebase that modification has started (hold kitchen & cashier)
      try {
        await set(ref(db, `ActiveHoldRequests/${safeOrderId}`), {
          OrderId: safeOrderId,
          CustomerName: details.customerName || orderData?.CustomerName || currentUser?.displayName || '',
          CustomerPhone: details.customerPhone || orderData?.CustomerPhone || currentUser?.phoneNumber || '',
          StartedAt: Date.now(),
          uid: currentUser.uid,
          ExpiresAt: expiresAt
        });

        update(ref(db, `PublicTracking/${safeOrderId}`), {
          IsModifying: true,
          ModificationExpiresAt: expiresAt
        }).catch(() => {});
      } catch(e) {}

      // 6. Open cart and navigate to menu
      if (setIsCartOpen) {
         setIsCartOpen(true);
      }
      navigate('/menu');
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center">
        <p className="font-bold text-lg">{lang === "en" ? "Loading order status..." : "جاري تحميل حالة الطلب..."}</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // IDOR & Privacy Protection Guard (Thoghra 22)
  // -------------------------------------------------------------
  // If orderData is not found in database at all:
  if (!orderData) {
    localStorage.removeItem("activeOrderId");
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
        <div className="max-w-md w-full bg-black-primary border border-brand-red/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 text-brand-red rounded-full flex items-center justify-center mb-6 border border-brand-red/30">
            <AlertCircle size={44} />
          </div>
          <h2 className="text-2xl font-display font-black text-text-light mb-3">
            {lang === "en" ? "Order Not Found" : "الطلب غير موجود"}
          </h2>
          <p className="text-text-muted leading-relaxed mb-6 text-sm">
            {lang === "en" 
              ? `Order was not found. Please verify the tracking link or order number.`
              : `عفواً، لم يتم العثور على أي بيانات لهذا الطلب. يرجى التأكد من كتابة الرقم الصحيح أو استخدام رابط التتبع.`}
          </p>
          <button 
            type="button"
            onClick={() => navigate("/menu")}
            className="w-full py-4 rounded-xl font-bold text-text-light bg-brand-red hover:bg-brand-red-dark transition-all shadow-lg shadow-brand-red/30 cursor-pointer"
          >
            {lang === "en" ? "Back to Menu" : "العودة للمنيو"}
          </button>
        </div>
      </div>
    );
  }

  const displayId = orderData?.DisplayOrderId || (orderId?.startsWith('trk_') ? '' : orderId);
  const displayNum = (displayId || '').replace(/#/g, '').trim();

  // Retrieve saved local details for owner verification & local rendering
  const rawDetails = localStorage.getItem(`order_${safeOrderId}_details`) 
                  || (displayNum && localStorage.getItem(`order_${displayNum}_details`))
                  || (displayNum && localStorage.getItem(`order_#${displayNum}_details`))
                  || localStorage.getItem(`order_${orderId}_details`);
  let orderDetails = {};
  try { if (rawDetails) orderDetails = JSON.parse(rawDetails); } catch(e) {}


  
  const isSessionOwner = Boolean(
    sessionStorage.getItem("placed_order_" + safeOrderId) ||
    (displayNum && sessionStorage.getItem("placed_order_" + displayNum)) ||
    (rawDetails && Object.keys(orderDetails).length > 0)
  );

  const orderOwnerPhone = (orderDetails?.customerPhone || "").trim();
  const currentLoggedInPhone = (userPhone || currentUser?.phoneNumber || "").trim();

  const isOwner = isSessionOwner || (currentLoggedInPhone && orderOwnerPhone && currentLoggedInPhone === orderOwnerPhone);

  if (currentUser && currentLoggedInPhone && orderOwnerPhone && currentLoggedInPhone !== orderOwnerPhone && !isSessionOwner) {
    // Logged-in user trying to snoop on an order belonging to another customer
    localStorage.removeItem("activeOrderId");
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
        <div className="max-w-md w-full bg-black-primary border border-brand-red/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 text-brand-red rounded-full flex items-center justify-center mb-6 border border-brand-red/30">
            <AlertCircle size={44} />
          </div>
          <h2 className="text-2xl font-display font-black text-text-light mb-3">
            {lang === "en" ? "Unauthorized Order Access" : "طلب غير مصرح بعرضه"}
          </h2>
          <p className="text-text-muted leading-relaxed mb-6 text-sm">
            {lang === "en" 
              ? `This order does not belong to your account (${currentLoggedInPhone}).`
              : `هذا الطلب لا ينتمي لرقم الهاتف المسجل بحسابك الحالي (${currentLoggedInPhone}). لحماية خصوصية وسرية بيانات العملاء، لا يمكن عرض تفاصيل طلبات تخص حسابات أخرى.`}
          </p>
          <button 
            type="button"
            onClick={() => navigate("/account")}
            className="w-full py-4 rounded-xl font-bold text-text-light bg-brand-red hover:bg-brand-red-dark transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <span>{lang === "en" ? "Go to My Account" : "الانتقال إلى حسابي"}</span>
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

  if (hasFinishedReview) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-black-surface p-10 rounded-3xl shadow-xl max-w-md w-full border border-green-100">
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={50} />
          </div>
          <h2 className="text-3xl font-display font-black text-text-light mb-4">{lang === 'en' ? 'Thank You!' : 'شكراً لك!'}</h2>
          <p className="text-text-muted text-lg mb-8">{lang === 'en' ? 'Your review has been successfully submitted.' : 'تم إرسال تقييمك بنجاح، شكراً لتعاملك معنا.'}</p>
          <button 
            onClick={() => navigate('/menu')}
            className="w-full bg-brand-red text-text-light p-4 rounded-xl font-bold hover:bg-brand-red/90 transition-colors"
          >
            {lang === 'en' ? 'Back to Menu' : 'العودة للمنيو'}
          </button>
        </div>
      </div>
    );
  }

  const orderStatus = orderData?.Status || 'Pending';
  const orderType = orderData?.OrderType || '';
  
  let statusList = [
    { id: 'Pending', label: (lang === 'en' ? 'Pending Acceptance' : 'جاري مراجعة الطلب') },
    { id: 'New', label: (lang === 'en' ? 'Accepted' : 'تم القبول') },
    { id: 'InKitchen', label: (lang === 'en' ? 'Preparing' : 'قيد التحضير') },
    { id: 'Ready', label: (lang === 'en' ? 'Ready' : 'جاهز') }
  ];
  
  if ((orderType || '').toLowerCase() === 'delivery') {
      statusList.push({ id: 'OutForDelivery', label: (lang === 'en' ? 'Out For Delivery' : 'مع الطيار / في الطريق') });
      statusList.push({ id: 'Completed', label: (lang === 'en' ? 'Delivered' : 'تم التسليم') });
  } else {
      statusList.push({ id: 'Completed', label: (lang === 'en' ? 'Completed' : 'مكتمل') });
  }
  statusList.push({ id: 'Cancelled', label: (lang === 'en' ? 'Cancelled' : 'تم الإلغاء') });

  const mappedStatus = orderStatus === 'Accepted' ? 'New' : orderStatus;
  const statusArray = (orderType || '').toLowerCase() === 'delivery' 
      ? ['Pending', 'New', 'InKitchen', 'Ready', 'OutForDelivery', 'Completed', 'Cancelled']
      : ['Pending', 'New', 'InKitchen', 'Ready', 'Completed', 'Cancelled'];
      
  let statusIndex = statusArray.indexOf(mappedStatus);
  if (statusIndex === -1) statusIndex = 0;

  let displayList = [...statusList];
  if (mappedStatus === 'Cancelled') {
    displayList = [
      { id: 'Pending', label: (lang === 'en' ? 'Pending Acceptance' : 'جاري مراجعة الطلب') },
      { id: 'Cancelled', label: (lang === 'en' ? 'Cancelled' : 'تم الإلغاء') }
    ];
    statusIndex = 1;
  } else {
    displayList = displayList.filter(s => s.id !== 'Cancelled');
  }

  const isHandoverEnabled = menuData?.storeStatus?.requireDeliveryHandoverCode !== false;
  // Fallback to orderDetails.handoverCode ONLY if orderData.DeliveryPIN isn't present yet, but prioritize Firebase payload!
  const handoverCode = isHandoverEnabled && isOwner ? (orderData?.DeliveryPIN || orderDetails.handoverCode || '') : '';
  const customerDisplayName = isOwner ? (orderDetails.customerName || '') : '';
  const customerDisplayPhone = isOwner ? (orderDetails.customerPhone || '') : '';
  const customerDisplayAddress = isOwner ? (orderDetails.deliveryAddress || '') : '';
  const customerDisplayTotal = isOwner ? (orderDetails.originalTotal || 0) : null;

  return (
    <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center pb-20" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <CheckCircle size={50} />
      </div>

      {mappedStatus === 'Completed' ? (
        <h2 className="text-4xl font-display font-black text-brand-red mb-2 text-center">
          {lang === 'en' ? 'Thank You!' : 'شكراً لك!'}
        </h2>
      ) : (
        <h2 className="text-4xl font-display font-black text-text-light mb-2 text-center">
          {lang === 'en' ? 'Order Received!' : 'تم استلام طلبك!'}
        </h2>
      )}
      <p className="text-text-muted text-lg mb-8">
        {displayNum ? (
          <>
            {lang === 'en' ? 'Your order number is' : 'رقم الطلب الخاص بك هو'} <span className="font-bold text-text-light">#{displayNum}</span>
          </>
        ) : (
          <span className="font-bold text-text-light">{lang === 'en' ? 'Order Tracking' : 'متابعة الطلب'}</span>
        )}
      </p>

      {/* Handover Code (OTP) for Delivery (Thoghra 25 - Toggleable via Settings) */}
      {isHandoverEnabled && handoverCode && (orderType || '').toLowerCase() === 'delivery' && mappedStatus !== 'Completed' && mappedStatus !== 'Cancelled' && (
        <div className="w-full max-w-md bg-gradient-to-br from-black-primary via-black-surface to-brand-red/10 border-2 border-brand-red/40 rounded-3xl p-6 shadow-2xl mb-8 text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 text-brand-red mb-2 font-bold text-sm">
            <ShieldCheck size={20} className="text-brand-red" />
            <span>{lang === 'en' ? 'Delivery Handover Code (OTP)' : 'كود تسليم الوجبة للطيار (أمان)'}</span>
          </div>
          <div className="flex items-center justify-center gap-3 my-4">
            {handoverCode.split('').map((digit, idx) => (
              <span key={idx} className="w-12 h-14 bg-black-surface border-2 border-brand-red/60 text-text-light font-mono font-black text-2xl flex items-center justify-center rounded-2xl shadow-inner shadow-brand-red/20">
                {digit}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {lang === 'en' 
              ? '🔒 Please give this 4-digit code to the courier upon delivery to verify handoff.'
              : '🔒 يرجى إعطاء هذا الكود المكون من 4 أرقام للطيار عند وصوله لتأكيد استلامك للوجبة بأمان.'}
          </p>
        </div>
      )}

      {mappedStatus === 'Completed' ? (
        <div className="bg-black-surface/50 w-full max-w-md p-10 rounded-3xl border-2 border-brand-red/30 shadow-2xl mb-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-brand-red/20 text-brand-red rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-text-light mb-4">
            {lang === 'en' ? 'We hope you enjoyed your meal!' : 'نتمنى أن تكون قد استمتعت بوجبتك!'}
          </h3>
          <p className="text-text-muted mb-8">
            {lang === 'en' ? 'Your feedback helps us improve and provide the best experience.' : 'رأيك يهمنا جداً ويساعدنا على تقديم أفضل جودة دائماً.'}
          </p>
          <button 
             onClick={() => window.location.href = '#/menu'}
             className="w-full py-4 bg-brand-red text-text-light font-bold rounded-xl text-lg hover:bg-brand-red-dark transition-colors shadow-lg shadow-brand-red/30"
          >
             {lang === 'en' ? 'Order Again' : 'اطلب مرة أخرى'}
          </button>
        </div>
      ) : (
      <div className="bg-black-surface/50 w-full max-w-md p-8 rounded-3xl border-2 border-white/5 shadow-2xl mb-8">
        <h3 className="text-xl font-bold text-text-light mb-8 text-center">{lang === 'en' ? 'Track Order Status:' : 'تتبع حالة الطلب:'}</h3>

          {mappedStatus === 'OutForDelivery' && isOwner && orderData?.DriverName && (
              <div className="bg-[#DBEAFE] border border-[#3B82F6] rounded-xl p-4 mb-6 mt-4 mx-auto w-[90%] max-w-sm flex flex-col items-center justify-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1D4ED8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-[#1D4ED8] font-bold text-center text-lg leading-relaxed">
                      {lang === 'en' ? `On the way to you with: ${orderData.DriverName}` : `في الطريق إليك مع: ${orderData.DriverName}`}
                  </p>
                  {orderData?.DriverPhone ? (
                      <a 
                          href={`tel:${orderData.DriverPhone}`}
                          className="bg-[#1D4ED8] hover:bg-[#1e3a8a] text-white px-5 py-2 rounded-full font-bold shadow-md flex items-center gap-2 transition-colors w-full justify-center"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <span>{lang === 'en' ? 'Call Driver' : 'اتصال بالطيار'}</span>
                          <span className="text-sm opacity-90 mx-1">({orderData.DriverPhone})</span>
                      </a>
                  ) : (
                      <p className="text-[#1D4ED8] text-sm text-center mt-1">
                          {lang === 'en' ? 'For inquiries, please contact the restaurant.' : 'للتواصل والاستفسارات، يرجى الاتصال برقم المطعم.'}
                      </p>
                  )}
              </div>
          )}
        
        <div className="relative">
          <div className="absolute left-6 top-6 bottom-6 w-1 bg-white/5 rounded-full" style={{ left: lang === 'ar' ? 'auto' : '1.5rem', right: lang === 'ar' ? '1.5rem' : 'auto' }}></div>
          <div className="absolute left-6 top-6 w-1 bg-brand-red rounded-full transition-all duration-1000" 
               style={{ height: `${(statusIndex / (displayList.length - 1)) * 100}%`, left: lang === 'ar' ? 'auto' : '1.5rem', right: lang === 'ar' ? '1.5rem' : 'auto' }}></div>

          <div className="flex flex-col gap-8">
            {displayList.map((step, index) => {
              const isCompleted = index <= statusIndex;
              const isCurrent = index === statusIndex;
              
              return (
                <div key={step.id} className="relative flex items-center gap-6 z-10" style={{ opacity: isCompleted ? 1 : 0.4 }}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 ${isCompleted ? 'bg-brand-red text-text-light' : 'bg-black-surface border-2 border-white/10 text-white/20'}`}>
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-bold ${isCurrent ? 'text-brand-red' : 'text-text-light'}`}>{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Privacy Masked / Owner Order Details Card (Thoghra 22) */}
      <div className="bg-black-surface/50 w-full max-w-md p-6 rounded-3xl border-2 border-white/5 shadow-2xl mb-6 flex flex-col gap-3.5 text-sm">
        <h4 className="text-base font-bold text-text-light pb-2 border-b border-white/10 flex items-center justify-between">
          <span>{lang === 'en' ? 'Order Summary' : 'بيانات وملخص الطلب'}</span>
          {!isOwner ? (
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-400/20">
              <Lock size={12} />
              {lang === 'en' ? 'Privacy Protected' : 'بيانات مشفرة ومحمية'}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-green-400/20">
              <ShieldCheck size={12} />
              {lang === 'en' ? 'Verified Owner' : 'صاحب الطلب'}
            </span>
          )}
        </h4>

        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <span className="text-text-muted flex items-center gap-2">
            <User size={15} className="text-brand-red" />
            {lang === 'en' ? 'Customer' : 'اسم العميل'}
          </span>
          <span className="font-bold text-text-light">
            {isOwner && customerDisplayName ? customerDisplayName : (lang === 'en' ? 'Protected 🔒' : 'محمي للخصوصية 🔒')}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <span className="text-text-muted flex items-center gap-2">
            <Phone size={15} className="text-brand-red" />
            {lang === 'en' ? 'Phone' : 'رقم الهاتف'}
          </span>
          <span className="font-mono font-bold text-text-light" style={{ direction: 'ltr' }}>
            {isOwner && customerDisplayPhone ? customerDisplayPhone : (lang === 'en' ? 'Protected 🔒' : 'محمي للخصوصية 🔒')}
          </span>
        </div>

        {(orderType || '').toLowerCase() === 'delivery' && (
          <div className="flex flex-col gap-1 pb-2 border-b border-white/5">
            <span className="text-text-muted flex items-center gap-2">
              <MapPin size={15} className="text-brand-red" />
              {lang === 'en' ? 'Delivery Address' : 'عنوان التوصيل'}
            </span>
            <span className="font-semibold text-text-light text-xs leading-relaxed">
              {isOwner && customerDisplayAddress ? customerDisplayAddress : (lang === 'en' ? 'Protected 🔒' : 'العنوان الدقيق محمي للخصوصية 🔒')}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-text-muted font-bold">
            {lang === 'en' ? 'Total Amount' : 'إجمالي الطلب'}
          </span>
          <span className="text-lg font-black text-brand-red font-mono">
            {isOwner && customerDisplayTotal !== null 
              ? `${Number(customerDisplayTotal).toLocaleString()} ج.م` 
              : (lang === 'en' ? 'Protected 🔒' : 'محمي للخصوصية 🔒')}
          </span>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 px-4">
        {(orderType || '').toLowerCase() === 'delivery' && (
          <>
          <a 
            href={APP_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
          >
            <MessageCircle size={20} />
            <span>{lang === 'en' ? 'Contact via WhatsApp' : 'تواصل عبر واتساب'}</span>
          </a>
          </>
        )}

        {(orderStatus === 'InKitchen' || orderStatus === 'Preparing') && (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-2xl text-center mb-2 shadow-sm flex items-center justify-center gap-3">
            <span className="text-xl">👨‍🍳</span>
            <p className="text-xs md:text-sm font-bold leading-relaxed">
              {lang === 'en'
                ? 'Your meal is currently being prepared fresh in the kitchen! Orders cannot be modified after cooking starts.'
                : 'وجبتك قيد التحضير الآن في المطبخ بأعلى جودة! تم قفل تعديل الطلب لبدء طهي الوجبات.'}
            </p>
          </div>
        )}

        {(orderStatus === 'Pending' || orderStatus === 'New') && (() => {
          // If Guest user: do not show edit button, show contact branch info
          if (!currentUser) {
            return (
              <div className="w-full bg-black-surface border border-brand-red-dark/30 p-4 rounded-xl text-center mb-2 shadow-sm">
                <p className="text-text-muted text-sm mb-2">
                  {lang === 'en' 
                    ? 'To modify or cancel your order as a guest, please contact the restaurant directly:' 
                    : 'لتعديل أو إلغاء طلبك كضيف، يُرجى التواصل مباشرة مع الفرع:'}
                </p>
                <a 
                  href={APP_CONFIG.whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-green-500 font-bold hover:underline"
                >
                  <MessageCircle size={18} />
                  <span>{lang === 'en' ? 'Contact via WhatsApp' : 'تواصل عبر واتساب'}</span>
                </a>
              </div>
            );
          }

          // If Logged in user: check single modification rule
          const safeId = (orderId || '').replace('#', '').trim();
          const rawD = localStorage.getItem(`order_${safeId}_details`) || localStorage.getItem(`order_#${safeId}_details`) || '{}';
          let savedDetails = {};
          try { savedDetails = JSON.parse(rawD); } catch(e) {}
          
          const isExpiredOrModified = (savedDetails.modificationCount >= 1) 
                                   || (orderData?.ModificationCount >= 1) 
                                   || savedDetails.modificationExpired 
                                   || orderData?.ModificationExpired;

          if (isExpiredOrModified) {
            return (
              <div className="w-full bg-white/5 border border-white/10 text-text-muted p-3.5 rounded-xl text-center text-sm font-semibold mb-2">
                {lang === 'en' ? 'Modification chance for this order has ended.' : 'تم استنفاد فرصة تعديل هذا الطلب (متاح لمرة واحدة فقط)'}
              </div>
            );
          }

          return (
            <button 
              onClick={handleEditOrder}
              className="w-full bg-brand-red text-text-light p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-red/90 transition-colors mb-2 cursor-pointer shadow-lg shadow-brand-red/20"
            >
              <Edit3 size={20} />
              <span>{lang === 'en' ? 'Edit Order (Once only - 3 min)' : 'تعديل الطلب (متاح لمرة واحدة - مهلة 3 دقائق)'}</span>
            </button>
          );
        })()}

        <button 
          onClick={() => setIsReviewModalOpen(true)}
          className="w-full bg-black-surface text-brand-red border-2 border-brand-red p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-red/10 transition-colors"
        >
          <Star size={20} />
          <span>{lang === 'en' ? 'Share your feedback' : 'شاركنا رأيك في الطلب'}</span>
        </button>

        <button 
          onClick={() => navigate('/menu')}
          className="text-text-muted hover:text-text-light font-bold flex items-center justify-center gap-2 mt-4 transition-colors"
        >
          <ArrowRight size={20} className={lang === 'ar' ? '' : 'rotate-180'} />
          <span>{lang === 'en' ? 'Back to Menu' : 'العودة للمنيو'}</span>
        </button>
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={() => setHasFinishedReview(true)}
      />
    </div>
  );
}
