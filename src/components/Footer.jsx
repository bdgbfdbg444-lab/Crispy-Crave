import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { MessageCircle, Star, Smartphone } from 'lucide-react';
import ReviewModal from './ReviewModal';
import AppDownloadModal from './AppDownloadModal';

export default function Footer({ websiteData }) {
  const { lang } = useLanguage();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAppDownloadModalOpen, setIsAppDownloadModalOpen] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running inside Android APK WebView or Standalone PWA
    const ua = navigator.userAgent || '';
    const isNative = /TheBlackBoxApp/i.test(ua) || window.isNativeApp === true || window.TheBlackBoxNative === true;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isNative || isStandalone) {
      setIsAppInstalled(true);
      return;
    }

    setIsAppInstalled(false);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Use data from settings root level
  const facebookLink = websiteData?.facebookLink || "#";
  const instagramLink = websiteData?.instagramLink || "#";
  const tikTokLink = websiteData?.tikTokLink || "#";
  
  let rawWhatsApp = websiteData?.whatsAppLink || "";
  let whatsAppLink = "#";
  if (rawWhatsApp) {
    if (rawWhatsApp.startsWith('http://') || rawWhatsApp.startsWith('https://')) {
      whatsAppLink = rawWhatsApp;
    } else {
      const cleanNumber = rawWhatsApp.replace(/[^0-9]/g, '');
      if (cleanNumber) {
        whatsAppLink = cleanNumber.startsWith('20') 
          ? `https://wa.me/${cleanNumber}` 
          : `https://wa.me/2${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;
      }
    }
  }

  const copyrightText = lang === 'en'
    ? (websiteData?.footerCopyrightEn || `© ${new Date().getFullYear()} All Rights Reserved. ${APP_CONFIG.restaurantName}`)
    : (websiteData?.footerCopyright || `© ${new Date().getFullYear()} جميع الحقوق محفوظة. ${APP_CONFIG.restaurantName}`);

  const taglineText = lang === 'en'
    ? (websiteData?.footerTaglineEn || 'CRAFTED BRISKET & SMASH BURGERS')
    : (websiteData?.footerTagline || 'أشهى بريسكت وبرجر مدخن على الحطب');

  return (
    <footer id="footer" className="bg-black-primary text-text-light pt-16 pb-24 md:pb-12 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start text-center md:text-right gap-2">
            <div className="text-3xl font-display font-black tracking-widest uppercase text-brand-red mb-2">
              {APP_CONFIG.restaurantName}
            </div>
            <p className="text-text-muted text-sm">
              {copyrightText}
            </p>
            <p className="text-text-light/50 text-xs font-bold tracking-wider mt-1">
              {taglineText}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              {/* WhatsApp */}
              <a 
                href={whatsAppLink} 
                target={whatsAppLink !== '#' ? '_blank' : undefined} 
                rel="noopener noreferrer" 
                title="WhatsApp"
                className="w-12 h-12 bg-gray-800 hover:bg-[#25D366] text-text-muted hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
              >
                <MessageCircle size={22} />
              </a>

              {/* TikTok */}
              <a 
                href={tikTokLink} 
                target={tikTokLink !== '#' ? '_blank' : undefined} 
                rel="noopener noreferrer" 
                title="TikTok"
                className="w-12 h-12 bg-gray-800 hover:bg-[#FE2C55] text-text-muted hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href={instagramLink} 
                target={instagramLink !== '#' ? '_blank' : undefined} 
                rel="noopener noreferrer" 
                title="Instagram"
                className="w-12 h-12 bg-gray-800 hover:bg-[#E4405F] text-text-muted hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* Facebook */}
              <a 
                href={facebookLink} 
                target={facebookLink !== '#' ? '_blank' : undefined} 
                rel="noopener noreferrer" 
                title="Facebook"
                className="w-12 h-12 bg-gray-800 hover:bg-[#1877F2] text-text-muted hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
            
            {/* Action Buttons: Review & Download App */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
              {/* Review Button */}
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-brand-red text-text-light py-2 px-6 rounded-full text-sm font-bold transition-colors border border-gray-700 hover:border-brand-red"
              >
                <Star size={16} className="fill-current" />
                {lang === 'en' ? 'Share Your Opinion' : 'شاركنا رأيك'}
              </button>

              {/* Install / Download App (Only shown if NOT in APK and NOT standalone) */}
              {!isAppInstalled && (
                <button
                  onClick={() => setIsAppDownloadModalOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-brand-red to-red-700 hover:from-red-600 hover:to-red-800 text-white py-2 px-5 rounded-full text-sm font-bold transition-all shadow-lg shadow-brand-red/20 hover:scale-105 border border-red-500/30"
                  title={lang === 'en' ? 'Download Mobile App' : 'تحميل تطبيق الهاتف'}
                >
                  <Smartphone size={16} />
                  <span>{lang === 'en' ? 'Get Mobile App' : 'حمّل التطبيق (APK)'}</span>
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
      />

      <AppDownloadModal
        isOpen={isAppDownloadModalOpen}
        onClose={() => setIsAppDownloadModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onPwaInstalled={() => setIsAppInstalled(true)}
      />
    </footer>
  );
}
