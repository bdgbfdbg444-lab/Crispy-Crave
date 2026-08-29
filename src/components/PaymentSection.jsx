import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { Wallet, Smartphone, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentSection({ marketing, onFileSelect }) {
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

      {/* Upload Receipt Banner */}
      <div className="mt-6 border-t border-brand-red-dark/30 pt-4">
        <div className="flex items-start gap-3 p-4 bg-black-surface/50 border border-brand-red-dark/30 rounded-xl mb-4">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-brand-red" />
          <p className="text-sm font-semibold leading-relaxed text-text-light">
            {lang === 'en' ? 'To process your order instantly, please upload a screenshot of your transfer receipt below.' : 'لتسريع تجهيز طلبك، يرجى إرفاق صورة (سكرين شوت) لإيصال التحويل هنا مباشرة.'}
          </p>
        </div>
        
        <label className="block text-sm font-bold text-text-light mb-2">
           {lang === 'en' ? 'Upload Transfer Receipt' : 'إرفاق إيصال الدفع'} <span className="text-brand-red">*</span>
        </label>
        <input 
          type="file" 
          accept="image/*"
          onChange={onFileSelect}
          className="block w-full text-sm text-text-muted
            file:mr-4 file:py-2.5 file:px-5
            file:rounded-xl file:border-0
            file:text-sm file:font-bold
            file:bg-brand-red file:text-text-light
            hover:file:bg-brand-red-dark transition-colors cursor-pointer bg-black-surface p-2 rounded-xl border border-brand-red-dark/30"
        />
      </div>
    </div>
  );
}
