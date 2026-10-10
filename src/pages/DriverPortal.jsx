import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, AlertTriangle, Truck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DriverPortal() {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id'); // Get ID from query params
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleDeliver = async () => {
    if (!orderId) {
      setError(lang === 'en' ? 'Invalid Order ID' : 'Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± ØµØ­ÙŠØ­');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const dbUrl = 'https://smokeandsmash-a419f-default-rtdb.firebaseio.com';
      
      await fetch(`${dbUrl}/PublicTracking/.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Status: 'Delivered',
          LastUpdate: new Date().toISOString()
        })
      });

      await fetch(`${dbUrl}/DriverUpdates/.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Status: 'Delivered',
          Timestamp: new Date().toISOString()
        })
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black-surface">
        <div className="bg-black-primary p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border-2 border-brand-red">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">{lang === 'en' ? 'Delivery Confirmed!' : 'ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØªÙˆØµÙŠÙ„!'}</h2>
          <p className="text-gray-400">{lang === 'en' ? 'Thank you. The system has been updated.' : 'Ø´ÙƒØ±Ø§Ù‹ Ù„Ùƒ. ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù†Ø¸Ø§Ù….'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black-surface">
      <div className="bg-black-primary p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border-2 border-white/10">
        <Truck className="mx-auto text-brand-red mb-4" size={64} />
        <h2 className="text-2xl font-bold text-white mb-6">
          {lang === 'en' ? 'Order: ' : 'رقم الطلب: '}
        </h2>
        
        {error && (
          <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <button 
          onClick={handleDeliver}
          disabled={loading || !orderId}
          className="w-full bg-brand-red hover:bg-red-600 text-white font-bold text-xl py-6 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? (lang === 'en' ? 'Confirming...' : 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ£ÙƒÙŠØ¯...') : (lang === 'en' ? 'Mark as Delivered' : 'ØªØ£ÙƒÙŠØ¯ ØªÙˆØµÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨')}
        </button>
      </div>
    </div>
  );
}
