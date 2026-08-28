import { useLanguage } from '../context/LanguageContext';
import PaymentSection from '../components/PaymentSection';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Star, MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import ReviewModal from '../components/ReviewModal';

const FIREBASE_URL = 'https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app';

export default function TrackOrderPage({ menuData }) {
  const { lang } = useLanguage();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const safeOrderId = orderId.replace('#', '').trim();
        const res = await fetch(`${FIREBASE_URL}/OrderTracking/${safeOrderId}.json`);
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        
        if (data) {
          setOrderData(data);
        }
      } catch (err) {
        console.error('Error fetching tracking data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center">
        <p className="font-bold text-lg">{lang === 'en' ? 'Loading order status...' : 'جاري تحميل حالة الطلب...'}</p>
      </div>
    );
  }

  const orderStatus = orderData?.Status || 'Pending';
  const orderType = orderData?.OrderType || '';
  
  const statusList = [
    { id: 'Pending', label: (lang === 'en' ? 'Pending Acceptance' : 'جاري مراجعة الطلب') },
    { id: 'New', label: (lang === 'en' ? 'Accepted' : 'تم القبول') },
    { id: 'InKitchen', label: (lang === 'en' ? 'Preparing' : 'قيد التحضير') },
    { id: 'Ready', label: (lang === 'en' ? 'Ready for Pickup/Delivery' : 'جاهز للاستلام/التوصيل') },
    { id: 'Completed', label: (lang === 'en' ? 'Delivered' : 'تم التسليم') },
    { id: 'Cancelled', label: (lang === 'en' ? 'Cancelled' : 'تم الإلغاء') }
  ];

  // Map 'Accepted' from POS to 'New' for the UI matching
  const mappedStatus = orderStatus === 'Accepted' ? 'New' : orderStatus;

  let statusIndex = ['Pending', 'New', 'InKitchen', 'Ready', 'Completed', 'Cancelled'].indexOf(mappedStatus);
  if (statusIndex === -1) statusIndex = 0;

  const isCancelled = mappedStatus === 'Cancelled';

  return (
    <div className="pt-24 pb-12 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-black-surface p-10 rounded-3xl shadow-xl max-w-md w-full border border-green-100">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-display font-black text-text-light mb-2">{lang === 'en' ? 'Order Received!' : 'تم استلام طلبك!'}</h2>
        <p className="text-text-muted mb-6">{lang === 'en' ? 'Your order number is' : 'رقم الطلب الخاص بك هو'} <strong className="text-text-light text-lg">{orderId}</strong></p>
        
        <div className="bg-black-primary p-6 rounded-2xl text-right relative overflow-hidden mb-8">
          <h3 className="font-bold text-lg mb-4 text-text-light relative z-10">{lang === 'en' ? 'Track Order Status:' : 'تتبع حالة الطلب:'}</h3>
          
          {isCancelled ? (
            <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-center">
              <p className="text-brand-red font-bold text-lg">{lang === 'en' ? 'Your order has been cancelled.' : 'عذراً، تم إلغاء هذا الطلب.'}</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute right-3.5 top-2 bottom-4 w-1 bg-black-surface rounded-full" />
              <div 
                className="absolute right-3.5 top-2 w-1 bg-brand-red rounded-full transition-all duration-1000" 
                style={{ height: `${(statusIndex / (statusList.length - 2)) * 100}%` }}
              />
              <div className="flex flex-col gap-4">
                {statusList.filter(s => s.id !== 'Cancelled').map((step, index) => {
                  let isCompleted = index <= statusIndex;
                  let isCurrent = index === statusIndex;
                  
                  return (
                    <div key={step.id} className="relative flex items-center gap-4 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${isCompleted ? 'bg-brand-red' : 'bg-black-surface'}`}>
                        {isCompleted && <CheckCircle size={14} className="text-text-light" />}
                      </div>
                      <span className={`font-bold ${isCurrent ? 'text-brand-red' : isCompleted ? 'text-text-light' : 'text-text-muted'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-4">
          {orderType === 'DineIn' ? (
            <div className="bg-brand-red/10 p-4 rounded-xl border border-brand-red/20">
              <p className="text-brand-red font-bold leading-relaxed">
                {lang === 'en' ? 'Please head to the cashier with your order number' : 'برجاء التوجه للكاشير مع رقم طلبك'} {orderId} {lang === 'en' ? 'to complete payment' : 'لإتمام الدفع'}
              </p>
            </div>
          ) : (
            <>
              <PaymentSection marketing={menuData?.marketing} />
              <a 
              href={`https://wa.me/${menuData?.marketing?.orderWhatsAppNumber || '201000000000'}?text=${encodeURIComponent(` ${orderId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-text-light p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle size={20} />
              <span>{lang === 'en' ? 'Contact via WhatsApp' : 'تواصل عبر واتساب'} 💬</span>
            </a>
            </>
          )}

          <button 
            onClick={() => setIsReviewModalOpen(true)}
            className="w-full bg-black-surface text-brand-red border-2 border-brand-red p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-red/10 transition-colors"
          >
            <Star size={20} />
            <span>{lang === 'en' ? 'Share your feedback' : 'شاركنا رأيك في الطلب'} ⭐</span>
          </button>
        </div>

        <button 
          onClick={() => navigate('/menu')}
          className="mt-8 flex items-center justify-center gap-2 text-text-muted font-bold hover:text-text-light transition-colors mx-auto"
        >
          <span>{lang === 'en' ? 'Back to Menu' : 'العودة للمنيو'}</span>
          <ArrowRight size={20} className="rotate-180" />
        </button>
      </div>

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
}
