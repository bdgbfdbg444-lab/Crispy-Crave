import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { Wallet, Smartphone, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentSection({ marketing, onFileSelect, isCompressing = false }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  // Security Guard: Validate and sanitize E-Wallet and InstaPay links (Thoghra 32)
  const rawWallet = marketing?.walletNumber;
  const cleanWalletNumber = typeof rawWallet === 'string'
    ? rawWallet.replace(/[^0-9+]/g, '').trim()
    : (rawWallet ? String(rawWallet) : '');

  const rawInstaPay = marketing?.instaPayLink;
  const isSafeInstaPayLink = typeof rawInstaPay === 'string' && (
    /^https:\/\/(ipn\.eg|instapay\.eg|www\.instapay\.eg|app\.instapay\.eg)\//i.test(rawInstaPay.trim()) ||
    /^instapay:\/\//i.test(rawInstaPay.trim()) ||
    (rawInstaPay.trim().startsWith('https://') && !rawInstaPay.toLowerCase().includes('javascript:'))
  );
  const safeInstaPayLink = isSafeInstaPayLink ? rawInstaPay.trim() : null;

  if (!cleanWalletNumber && !safeInstaPayLink) {
    return null;
  }

  const handleCopy = () => {
    if (cleanWalletNumber) {
      navigator.clipboard.writeText(cleanWalletNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center border-b border-brand-red-dark/30 pb-2">
        <h3 className="font-bold text-text-light">{lang === 'en' ? 'Electronic Payment' : 'الدفع الإلكتروني'}</h3>
        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          🔒 {lang === 'en' ? 'Verified Channels' : 'قنوات دفع رسمية معتمدة'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* InstaPay */}
        {safeInstaPayLink && (
          <a
            href={safeInstaPayLink}
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
        {cleanWalletNumber && (
          <div className="flex items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black-surface flex items-center justify-center shrink-0 shadow-sm border border-green-100">
                <Wallet size={20} className="text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-green-900 text-sm">{lang === 'en' ? 'E-Wallet' : 'محفظة إلكترونية'}</h4>
                <p className="text-xs font-mono font-bold text-green-700 mt-0.5" dir="ltr">{cleanWalletNumber}</p>
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
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileSelect}
          disabled={isCompressing}
          className="block w-full text-sm text-text-muted
            file:mr-4 file:py-2.5 file:px-5
            file:rounded-xl file:border-0
            file:text-sm file:font-bold
            file:bg-brand-red file:text-text-light
            hover:file:bg-brand-red-dark transition-colors cursor-pointer bg-black-surface p-2 rounded-xl border border-brand-red-dark/30 disabled:opacity-50"
        />
        {isCompressing && (
          <p className="mt-2 text-xs text-amber-400 font-semibold flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
            <span>{lang === 'en' ? 'Optimizing & compressing receipt image...' : 'جاري ضغط وتجهيز صورة الإيصال تلقائياً...'}</span>
          </p>
        )}
      </div>
    </div>
  );
}
