import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/appConfig';
import { ChevronDown, Utensils } from 'lucide-react';

export default function Hero({ websiteData }) {
  // Use data from Firebase or fallback to empty strings
  const headline = websiteData?.heroHeadline || `أهلاً بك في ${APP_CONFIG.restaurantName}`;
  const subtitle = websiteData?.heroSubtitle || "استمتع بأفضل بريسكت وسماش برجر وناشفيل تشيكن";
  const bgVideo = websiteData?.heroMediaUrl;

  return (
    <section className="relative w-full h-screen overflow-hidden bg-dark text-white flex flex-col justify-center items-center">
      {/* Background Media */}
      {bgVideo && (
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
      )}
      
      {/* Dark Overlay - Adjusted to be darker behind the text (right side in RTL) and lighter on the left */}
      <div className="absolute inset-0 bg-gradient-to-l from-dark/95 via-dark/60 to-transparent"></div>

      {/* Content Container - Responsive (Desktop vs Mobile) */}
      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center md:items-start text-center md:text-right">
        
        {/* Desktop Layout gets wider, Mobile is centered */}
        <div className="max-w-xl md:max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-white mb-6 leading-tight drop-shadow-2xl uppercase"
            style={{ letterSpacing: '2px' }}
          >
            {headline}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-3xl text-light/95 mb-10 font-bold drop-shadow-md"
          >
            {subtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
          >
            <Link to="/menu" className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-primary/50 transition-all duration-300 flex items-center justify-center gap-2 text-lg">
              <Utensils size={20} />
              المنيو والطلب
            </Link>
            <a href="#our-story" className="bg-transparent border-2 border-white hover:bg-primary hover:border-primary text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-primary/50 transition-all duration-300 text-lg flex items-center justify-center">
              اعرف قصتنا
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll Down Indicator - Enhanced Bounce */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 20, 0] }}
        transition={{ delay: 1.5, duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <ChevronDown size={48} className="text-white drop-shadow-md" />
      </motion.div>
    </section>
  );
}
