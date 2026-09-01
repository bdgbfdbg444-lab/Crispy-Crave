import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Star, MessageCircle, Edit3 } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import ReviewModal from '../components/ReviewModal';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

const FIREBASE_URL = 'https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app';

export default function TrackOrderPage({ menuData }) {
  const { lang } = useLanguage();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
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
  }, [orderData?.Status, hasAutoOpenedReview]);

  useEffect(() => {
    const safeOrderId = orderId.replace('#', '').trim();
    const trackingRef = ref(db, `OrderTracking/${safeOrderId}`);
    
    const unsubscribe = onValue(trackingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOrderData(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tracking data', error);
      setLoading(false);
    });

    return () => {
      off(trackingRef, 'value', unsubscribe);
    };
  }, [orderId]);

  const handleEditOrder = async () => {
    const currentStatus = orderData?.Status || 'Pending';
    if (currentStatus !== 'Pending' && currentStatus !== 'New') {
       alert(lang === 'en' ? 'Order is already being prepared and cannot be edited.' : 'عذراً، الأوردر قيد التحضير ولا يمكن تعديله الآن.');
       return;
    }
    
    try {
      const safeOrderId = orderId.replace('#', '').trim();
      const orderRef = ref(db, `Orders/${safeOrderId}`);
      // Wait, get is not imported, let's just fetch from REST API for one-off read
      const res = await fetch(`${APP_CONFIG.firebaseDbUrl}Orders/${safeOrderId}.json`);
      const originalOrder = await res.json();
      
      if (originalOrder) {
         clearCart();
         if (originalOrder.Items) {
            originalOrder.Items.forEach(item => {
               addToCart(item);
            });
         }
         localStorage.setItem('editingOrderId', safeOrderId);
         navigate('/menu');
      } else {
         alert(lang === 'en' ? 'Order items could not be loaded.' : 'حدث خطأ أثناء تحميل عناصر الأوردر.');
      }
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center">
        <p className="font-bold text-lg">{lang === 'en' ? 'Loading order status...' : 'جاري تحميل حالة الطلب...'}</p>
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

  return (
    <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center pb-20" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <CheckCircle size={50} />
      </div>

      <h2 className="text-4xl font-display font-black text-text-light mb-2">
        {lang === 'en' ? 'Order Submitted!' : 'تم تسليم الطلب!'}
      </h2>
      <p className="text-text-muted text-lg mb-8">
        {lang === 'en' ? 'Your order number is' : 'رقم الطلب الخاص بك هو'} <span className="font-bold text-text-light">#{orderId?.replace('#', '')}</span>
      </p>

      <div className="bg-black-surface/50 w-full max-w-md p-8 rounded-3xl border-2 border-white/5 shadow-2xl mb-8">
        <h3 className="text-xl font-bold text-text-light mb-8 text-center">{lang === 'en' ? 'Track Order Status:' : 'تتبع حالة الطلب:'}</h3>

          {mappedStatus === 'OutForDelivery' && orderData?.DriverName && (
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

        {(orderStatus === 'Pending' || orderStatus === 'New') && (
          <button 
            onClick={handleEditOrder}
            className="w-full bg-brand-red text-text-light p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-red/90 transition-colors mb-2"
          >
            <Edit3 size={20} />
            <span>{lang === 'en' ? 'Edit Order' : 'تعديل الطلب'}</span>
          </button>
        )}

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
