import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { Wallet, Smartphone, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentSection({ marketing }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const walletNumber = marketing?.walletNumber;
  const instaPayLink = marketing?.instaPayLink;

  if (!walletNumber && !instaPayLink) {
    return null;
  }

  const handleCopy = () => {
    if (walletNumber) {
      navigator.clipboard.writeText(walletNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <h3 className="font-bold text-text-light mb-4 border-b pb-2">{lang === 'en' ? 'Electronic Payment' : 'الدفع الإلكتروني'}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* InstaPay */}
        {instaPayLink && (
          <a
            href={instaPayLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200 rounded-xl"
          >
            <div className="w-10 h-10 rounded-full bg-black-surface flex items-center justify-center shrink-0 shadow-sm border border-purple-100">
              <Smartphone size={20} className="text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-purple-900 text-sm">{lang === 'en' ? 'Pay via InstaPay' : 'الدفع عبر InstaPay'}</h4>
              <p className="text-xs text-purple-700 mt-0.5">{lang === 'en' ? 'Click here to open app and transfer' : 'اضغط هنا لفتح التطبيق والتحويل مباشرة'}</p>
            </div>
          </a>
        )}

        {/* Wallet */}
        {walletNumber && (
          <div className="flex items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black-surface flex items-center justify-center shrink-0 shadow-sm border border-green-100">
                <Wallet size={20} className="text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-green-900 text-sm">{lang === 'en' ? 'E-Wallet' : 'محفظة إلكترونية'}</h4>
                <p className="text-xs font-mono font-bold text-green-700 mt-0.5" dir="ltr">{walletNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                copied 
                  ? 'bg-green-600 text-text-light' 
                  : 'bg-black-surface text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle size={14} />
                  <span>{lang === 'en' ? 'Copied ✓' : 'تم النسخ ✓'}</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>{lang === 'en' ? 'Copy Number' : 'نسخ الرقم'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Warning Banner */}
      <div className="mt-4 flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-xl text-yellow-800">
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
        <p className="text-sm font-semibold leading-relaxed">
          ⚠️ {lang === 'en' ? 'After transfer, please send a screenshot via WhatsApp to confirm your order quickly.' : 'بعد التحويل، برجاء إرسال صورة (سكرين شوت) لإثبات الدفع عبر الواتساب لتأكيد طلبك بسرعة.'}
        </p>
      </div>
    </div>
  );
}
