import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PromoPopup({ websiteData }) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Extract promo popup configuration from websiteData
  let popupConfig = websiteData?.promoPopup;
  if (typeof popupConfig === 'string') {
    try {
      popupConfig = JSON.parse(popupConfig);
    } catch {
      popupConfig = null;
    }
  }

  const isEditor = typeof window !== 'undefined' && 
    (window.location.search.includes('mode=editor') || window.location.hash.includes('mode=editor'));

  const isEnabled = popupConfig?.enabled !== false && popupConfig?.enabled !== 'false' && (popupConfig?.enabled === true || popupConfig?.enabled === 'true');

  // Handle preview event from Website Control desktop app simulator
  useEffect(() => {
    const handlePreviewTrigger = () => {
      setIsOpen(true);
    };
    window.addEventListener('OPEN_PROMO_POPUP_PREVIEW', handlePreviewTrigger);
    return () => window.removeEventListener('OPEN_PROMO_POPUP_PREVIEW', handlePreviewTrigger);
  }, []);

  // Display lifecycle logic for real visitors
  useEffect(() => {
    if (!popupConfig || !isEnabled) {
      if (!isEditor) setIsOpen(false);
      return;
    }

    // Unique key to distinguish different campaigns
    const campaignId = popupConfig.id || popupConfig.titleEn || popupConfig.titleAr || 'default_campaign';
    const storageKey = `seen_promo_popup_${campaignId}`;
    const frequency = popupConfig.frequency || 'once_per_session';

    if (!isEditor) {
      if (frequency === 'once_per_session' && sessionStorage.getItem(storageKey)) {
        return;
      }
      if (frequency === 'once_ever' && localStorage.getItem(storageKey)) {
        return;
      }
    }

    const delay = (parseInt(popupConfig.delaySeconds) || 1) * 1000;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [popupConfig, isEnabled, isEditor]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (!isEditor && popupConfig) {
      const campaignId = popupConfig.id || popupConfig.titleEn || popupConfig.titleAr || 'default_campaign';
      const storageKey = `seen_promo_popup_${campaignId}`;
      const frequency = popupConfig.frequency || 'once_per_session';
      if (frequency === 'once_per_session') {
        sessionStorage.setItem(storageKey, 'true');
      } else if (frequency === 'once_ever') {
        localStorage.setItem(storageKey, 'true');
      }
    }
  };

  const handleActionClick = () => {
    handleDismiss();
    const link = popupConfig?.buttonLink;
    if (!link) return;

    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else if (link.startsWith('#')) {
      window.location.hash = link;
    } else {
      window.location.hash = `#${link.startsWith('/') ? link : '/' + link}`;
    }
  };

  if (!isOpen || !popupConfig) return null;

  // Defaults and configurations
  const layout = popupConfig.layout || 'split'; // 'split' | 'centered' | 'poster'
  const maxWidth = popupConfig.maxWidth || 'lg'; // 'sm' (480), 'md' (620), 'lg' (820), 'xl' (980)
  const borderRadius = popupConfig.borderRadius !== undefined ? `${popupConfig.borderRadius}px` : '24px';
  const bgColor = popupConfig.bgColor || '#121212';
  const borderColor = popupConfig.borderColor || '#DC2626';
  const borderWidth = popupConfig.borderWidth !== undefined ? `${popupConfig.borderWidth}px` : '1px';
  const overlayColor = popupConfig.overlayColor || '#000000';
  const overlayOpacity = popupConfig.overlayOpacity !== undefined ? popupConfig.overlayOpacity : 0.8;
  const closeColor = popupConfig.closeButtonColor || '#FFFFFF';

  // Typography
  const title = lang === 'en' ? (popupConfig.titleEn || popupConfig.titleAr || '') : (popupConfig.titleAr || popupConfig.titleEn || '');
  const subtitle = lang === 'en' ? (popupConfig.subtitleEn || popupConfig.subtitleAr || '') : (popupConfig.subtitleAr || popupConfig.subtitleEn || '');
  const description = lang === 'en' ? (popupConfig.descriptionEn || popupConfig.descriptionAr || '') : (popupConfig.descriptionAr || popupConfig.descriptionEn || '');
  const secondaryText = lang === 'en' ? (popupConfig.secondaryTextEn || popupConfig.secondaryTextAr || '') : (popupConfig.secondaryTextAr || popupConfig.secondaryTextEn || '');
  const buttonText = lang === 'en' ? (popupConfig.buttonTextEn || popupConfig.buttonTextAr || 'Order Now') : (popupConfig.buttonTextAr || popupConfig.buttonTextEn || 'اطلب الآن');

  const titleColor = popupConfig.titleColor || '#FFFFFF';
  const subtitleColor = popupConfig.subtitleColor || '#E5A93C';
  const descriptionColor = popupConfig.descriptionColor || '#D1D5DB';
  const secondaryTextColor = popupConfig.secondaryTextColor || '#9CA3AF';
  const buttonBgColor = popupConfig.buttonBgColor || '#C99436';
  const buttonTextColor = popupConfig.buttonTextColor || '#000000';
  const showButton = popupConfig.showButton !== false && popupConfig.showButton !== 'false';

  const imageUrl = popupConfig.imageUrl || '';
  const imageFit = popupConfig.imageFit || 'cover';

  // Max width mapper
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-md'; // 448px
      case 'md': return 'max-w-xl'; // 576px
      case 'lg': return 'max-w-3xl'; // 768px
      case 'xl': return 'max-w-5xl'; // 1024px
      default: return 'max-w-3xl';
    }
  };

  // Font size mapper
  const getTitleSizeClass = () => {
    switch (popupConfig.titleFontSize) {
      case 'sm': return 'text-xl md:text-2xl';
      case 'md': return 'text-2xl md:text-3xl';
      case 'lg': return 'text-3xl md:text-4xl';
      case 'xl': return 'text-4xl md:text-5xl';
      case 'hero': return 'text-4xl md:text-6xl font-black uppercase tracking-tight';
      default: return 'text-3xl md:text-5xl font-black';
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
      >
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 backdrop-blur-sm transition-opacity"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity
          }}
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full ${getMaxWidthClass()} shadow-2xl overflow-hidden z-10 my-auto`}
          style={{
            backgroundColor: bgColor,
            borderRadius: borderRadius,
            border: `${borderWidth} solid ${borderColor}`,
            boxShadow: `0 25px 50px -12px ${borderColor}33`
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/90 text-white transition-all transform hover:scale-110 shadow-lg border border-white/10"
            style={{ color: closeColor }}
          >
            <X size={22} />
          </button>

          {/* ======================= LAYOUT 1: POSTER ONLY ======================= */}
          {layout === 'poster' && (
            <div 
              className="relative w-full cursor-pointer group"
              onClick={popupConfig.buttonLink ? handleActionClick : undefined}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={title || 'Announcement'} 
                  className="w-full h-auto max-h-[85vh] object-contain mx-auto"
                />
              ) : (
                <div className="p-16 text-center text-text-muted">
                  <Sparkles size={48} className="mx-auto mb-4 text-brand-red animate-pulse" />
                  <p>{lang === 'en' ? 'No poster image selected.' : 'لم يتم اختيار صورة للبوستر بعد.'}</p>
                </div>
              )}
              {showButton && popupConfig.buttonLink && (
                <div className="p-4 bg-black/80 flex items-center justify-between border-t border-white/10">
                  <span className="font-bold text-sm text-white">{title || buttonText}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleActionClick(); }}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                  >
                    <span>{buttonText}</span>
                    {lang === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================= LAYOUT 2: SPLIT (KG BBQ STYLE) ======================= */}
          {layout === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              {/* Media Column */}
              <div className="md:col-span-6 relative bg-black/40 overflow-hidden min-h-[260px] md:min-h-full flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title || 'Promotion'}
                    className={`w-full h-full object-${imageFit}`}
                    style={{ minHeight: '260px', maxHeight: '520px' }}
                  />
                ) : (
                  <div className="p-12 text-center text-text-muted flex flex-col items-center justify-center">
                    <Sparkles size={44} className="text-amber-500 mb-3 animate-bounce" />
                    <span className="text-sm">{lang === 'en' ? 'Special Announcement' : 'إعلان خاص'}</span>
                  </div>
                )}
              </div>

              {/* Text & Content Column */}
              <div className="md:col-span-6 p-6 md:p-10 flex flex-col justify-center items-start text-start">
                {subtitle && (
                  <span 
                    className="font-bold text-xs md:text-sm uppercase tracking-wider mb-2"
                    style={{ color: subtitleColor }}
                  >
                    {subtitle}
                  </span>
                )}

                {title && (
                  <h2 
                    className={`${getTitleSizeClass()} font-display font-black leading-tight mb-4`}
                    style={{ color: titleColor }}
                  >
                    {title}
                  </h2>
                )}

                {description && (
                  <p 
                    className="text-sm md:text-base leading-relaxed mb-6 font-normal"
                    style={{ color: descriptionColor }}
                  >
                    {description}
                  </p>
                )}

                {showButton && (
                  <button
                    onClick={handleActionClick}
                    className="w-full md:w-auto px-8 py-3.5 rounded-xl font-display font-bold text-base shadow-xl flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95"
                    style={{
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor
                    }}
                  >
                    <span>{buttonText}</span>
                    {lang === 'ar' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                  </button>
                )}

                {secondaryText && (
                  <p 
                    className="mt-4 text-xs font-medium"
                    style={{ color: secondaryTextColor }}
                  >
                    {secondaryText}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ======================= LAYOUT 3: CENTERED (MCDONALD'S STYLE) ======================= */}
          {layout === 'centered' && (
            <div className="p-6 md:p-10 flex flex-col items-center text-center">
              {subtitle && (
                <span 
                  className="font-bold text-xs md:text-sm uppercase tracking-wider mb-1"
                  style={{ color: subtitleColor }}
                >
                  {subtitle}
                </span>
              )}

              {title && (
                <h2 
                  className={`${getTitleSizeClass()} font-display font-black leading-tight mb-4 max-w-lg`}
                  style={{ color: titleColor }}
                >
                  {title}
                </h2>
              )}

              {imageUrl && (
                <div className="my-4 max-h-[320px] w-full flex items-center justify-center overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={title || 'Promotion'}
                    className="max-h-[300px] w-auto object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {description && (
                <p 
                  className="text-sm md:text-base leading-relaxed mb-6 max-w-md font-normal"
                  style={{ color: descriptionColor }}
                >
                  {description}
                </p>
              )}

              {showButton && (
                <button
                  onClick={handleActionClick}
                  className="w-full max-w-xs px-8 py-3.5 rounded-xl font-display font-bold text-base shadow-xl flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95"
                  style={{
                    backgroundColor: buttonBgColor,
                    color: buttonTextColor
                  }}
                >
                  <span>{buttonText}</span>
                  {lang === 'ar' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                </button>
              )}

              {secondaryText && (
                <p 
                  className="mt-4 text-xs font-medium"
                  style={{ color: secondaryTextColor }}
                >
                  {secondaryText}
                </p>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
