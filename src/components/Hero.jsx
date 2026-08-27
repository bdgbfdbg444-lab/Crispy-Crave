import { useLanguage } from '../context/LanguageContext';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/appConfig';
import { ChevronDown, Utensils } from 'lucide-react';
import Logo from './Logo';

export default function Hero({ websiteData }) {
  const { lang } = useLanguage();
  // Use data from Firebase or fallback to empty strings
  const headline = (lang === 'en' && websiteData?.heroHeadlineEn ? websiteData?.heroHeadlineEn : websiteData?.heroHeadline) || `THE BLACK BOX`;
  const subtitle = (lang === 'en' && websiteData?.heroSubtitleEn ? websiteData?.heroSubtitleEn : websiteData?.heroSubtitle) || "SMOKED BRISKET & GOURMET BURGERS • ELITE STREET FOOD\nبرجر ولحم بريسكيت مدخن • مأكولات الشارع الراقية";
  const bgVideo = websiteData?.heroMediaUrl;

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black-primary text-text-light flex flex-col justify-center items-center">
      {/* Background Media */}
      {bgVideo && (
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
      )}
      
      {/* Dark Overlay - Centered gradient to focus on the middle */}
      <div className="absolute inset-0 bg-gradient-to-b from-black-primary/90 via-black-primary/50 to-black-primary/90"></div>
      <div className="absolute inset-0 bg-black-primary/30"></div>

      {/* Content Container - Fully Centered */}
      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
        
        <div className="max-w-4xl flex flex-col items-center">
          
          {/* Main Neon Title - Crisp outline glow like the image */}
          <div className="mb-6 flex justify-center w-full z-10 scale-90 md:scale-100"><Logo className="text-[12vw] sm:text-7xl md:text-8xl lg:text-[9rem] drop-shadow-[0_0_20px_rgba(230,57,70,0.4)]" /></div>

          {/* Subtitle - Clean, readable, non-glowing text with white space pre-line for the line break */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-sm md:text-xl lg:text-2xl text-text-light/90 mb-10 font-bold tracking-wide drop-shadow-lg whitespace-pre-line leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* Single Action Button - Centered */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex justify-center w-full"
          >
            <Link to="/menu" className="bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-4 px-12 rounded-lg shadow-lg hover:shadow-brand-red/40 transition-all duration-300 flex items-center justify-center gap-3 text-lg md:text-xl border border-brand-red-light/20">
              {lang === 'en' ? 'Order Now' : 'اطلب الآن'}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Decorative Bottom Elements */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold">{lang === 'en' ? 'SCROLL DOWN' : 'انزل للأسفل'}</span>
        <motion.div
           animate={{ y: [0, 8, 0] }}
           transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown size={24} className="text-text-muted" />
        </motion.div>
      </motion.div>
    </section>
  );
}
