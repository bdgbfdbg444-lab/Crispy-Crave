import { useLanguage } from '../context/LanguageContext';
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/appConfig';
import { ChevronDown, Utensils } from 'lucide-react';
import Logo from './Logo';
import { getHeroImageUrl, optimizeCloudinaryUrl } from '../utils/imageOptimizer';
import { useCart } from '../context/CartContext';

export default function Hero({ websiteData }) {
  const { lang } = useLanguage();
  const { orderType, setIsOrderTypeModalOpen } = useCart();
  const navigate = useNavigate();
  const ref = useRef(null);
  const videoRef = useRef(null);

  const bgMedia = websiteData?.heroMediaUrl;
  const isVideo = Boolean(bgMedia && (bgMedia.toLowerCase().endsWith('.mp4') || bgMedia.toLowerCase().endsWith('.webm') || bgMedia.toLowerCase().endsWith('.mov') || bgMedia.toLowerCase().endsWith('.avi')));
  const headline = (lang === 'en' && websiteData?.heroHeadlineEn ? websiteData?.heroHeadlineEn : websiteData?.heroHeadline) ?? 'THE BLACK BOX';
  const subtitle = (lang === 'en' && websiteData?.heroSubtitleEn ? websiteData?.heroSubtitleEn : websiteData?.heroSubtitle) ?? "SMOKED BRISKET & GOURMET BURGERS • ELITE STREET FOOD\nبرجر ولحم بريسكيت مدخن • مأكولات الشارع الراقية";

  // Video plays immediately on mobile and desktop
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict Mobile Autoplay Guarantee (iOS Safari & Android Chrome)
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const startPlay = () => {
      video.play().catch(() => {});
    };

    startPlay();

    // Fallback: resume on first user touch/scroll if browser low-power policy blocked autoplay
    const handleFirstTouch = () => {
      startPlay();
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('scroll', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };

    window.addEventListener('touchstart', handleFirstTouch, { passive: true, once: true });
    window.addEventListener('scroll', handleFirstTouch, { passive: true, once: true });
    window.addEventListener('click', handleFirstTouch, { passive: true, once: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('scroll', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, [bgMedia]);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <section ref={ref} id="hero" className="relative w-full h-[100vh] overflow-hidden bg-black-primary text-text-light flex flex-col justify-center items-center">
      {/* Background Media with Parallax */}
      <motion.div style={{ y, x: '-50%', left: '50%', minWidth: '100%', height: '120%', top: '-10%' }} className="absolute z-0">
        {bgMedia && isVideo ? (
            <video 
              ref={videoRef}
              key={bgMedia}
              autoPlay 
              loop 
              muted 
              defaultMuted
              playsInline 
              webkit-playsinline="true"
              preload="metadata"
              poster={optimizeCloudinaryUrl(bgMedia.replace(/\.mp4$/i, '.jpg'), { width: isMobile ? 480 : 800, quality: 'auto' })}
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            >
              <source 
                src={optimizeCloudinaryUrl(bgMedia, { width: isMobile ? 480 : 720, quality: isMobile ? 'auto:eco' : 'auto' })} 
                type="video/mp4" 
              />
            </video>
        ) : bgMedia ? (
          <img 
            src={getHeroImageUrl(bgMedia)} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            fetchPriority="high"
            decoding="async"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black-primary" />
        )}
      </motion.div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black-primary/90 via-black-primary/50 to-black-primary/90 pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-black-primary/30 pointer-events-none" />

      {/* Content Container - Fully Centered */}
      <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center mt-10 md:mt-20">
        <div className="max-w-4xl flex flex-col items-center">
          
          {/* Subtle top badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="mb-8 hidden md:block"
          >
            <span className="bg-brand-red/20 text-brand-red border border-brand-red/30 px-6 py-2 rounded-full text-sm font-bold tracking-[0.2em] uppercase">
              {lang === 'en' ? 'Premium Quality' : 'جودة استثنائية'}
            </span>
          </motion.div>

          {/* Main Neon Title - Crisp outline glow like the original */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 flex justify-center w-full z-10 scale-90 md:scale-100"
          >
            <Logo className="text-[12vw] sm:text-7xl md:text-8xl lg:text-[9rem] drop-shadow-[0_0_20px_rgba(230,57,70,0.4)]" />
          </motion.div>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm md:text-xl lg:text-2xl text-text-light/90 mb-10 font-bold tracking-wide drop-shadow-lg whitespace-pre-line leading-relaxed"
          >
            {subtitle}
          </motion.p>
          
          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-5 justify-center w-full"
          >
            <button 
              type="button"
              onClick={() => {
                if (!orderType) {
                  setIsOrderTypeModalOpen(true);
                } else {
                  navigate('/menu');
                }
              }} 
              className="bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-4 px-12 rounded-lg shadow-lg hover:shadow-brand-red/40 transition-all duration-300 flex items-center justify-center gap-3 text-lg md:text-xl border border-brand-red-light/20 cursor-pointer"
            >
              <Utensils size={20} />
              <span>{lang === 'en' ? 'Order Now' : 'اطلب الآن'}</span>
            </button>
            
            <a 
              href="#our-story" 
              className="px-10 py-4 bg-transparent border-2 border-white/30 hover:border-white text-white text-lg font-bold tracking-widest uppercase transition-colors duration-300 rounded-lg flex items-center justify-center"
            >
              {lang === 'en' ? 'Our Story' : 'قصتنا'}
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 z-20 flex flex-col items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        onClick={() => {
          document.getElementById('signature-dishes')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span className="text-xs tracking-[0.3em] uppercase text-gray-400 font-semibold">{lang === 'en' ? 'Scroll' : 'انزل'}</span>
        <motion.div 
          animate={{ y: [0, 8, 0] }} 
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown size={28} className="text-brand-red" />
        </motion.div>
      </motion.div>
    </section>
  );
}
