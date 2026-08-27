import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquareQuote } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function Testimonials() {
  const { lang } = useLanguage();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Fetch approved reviews from Firebase
    async function loadReviews() {
      try {
        const res = await fetch(`${APP_CONFIG.firebaseDbUrl}ApprovedReviews.json`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const reviewsArray = Object.values(data).filter(Boolean);
            setReviews(reviewsArray);
          }
        }
      } catch (error) {
        console.error("Failed to load reviews:", error);
      }
    }
    
    loadReviews();
  }, []);

  // Use dummy reviews if none are found, duplicated to ensure enough content for smooth scrolling
  const displayReviews = reviews.length > 0 ? reviews : [
    { customerName: "أحمد مجدي", rating: 5, comment: "أفضل بريسكت دُقته في حياتي، اللحمة دايبة والتتبيلة ممتازة!", imageUrl: "https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png" },
    { customerName: "محمد طارق", rating: 5, comment: "السماش برجر خيالي، الجبنة والعيش واللحمة مكس رهيب، وخدمة ممتازة." },
    { customerName: "كريم حسن", rating: 4, comment: "ناشفيل ستريبس حارة جداً زي ما بحبها، التغليفة مقرمشة وطعمها خطير." },
    { customerName: "طارق سليم", rating: 5, comment: "جودة اللحم خرافية والسعر مناسب جداً للطعم ده.", imageUrl: "https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png" },
    { customerName: "محمود فوزي", rating: 5, comment: "البريسكت بياخد العقل، وتتبيلة الناشفيل مختلفة عن أي مكان تاني." },
  ];

  return (
    <section className="py-24 bg-black-primary text-text-light relative overflow-hidden">
      <div className="container mx-auto px-6 mb-16">
        <div className="text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-brand-red mb-4"
          >
            <MessageSquareQuote size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">Customer Reviews</span>
            <MessageSquareQuote size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-text-light mb-4"
          >
            {lang === 'en' ? 'Foodies\' Opinions' : 'رأي الأكيلة'}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-brand-red mx-auto rounded-full"
          ></motion.div>
        </div>
      </div>

      {/* Auto-scrolling Marquee */}
      <div className="relative w-full overflow-hidden flex">
        {/* Left/Right fading gradients to blend the marquee */}
        <div className="absolute top-0 left-0 w-16 md:w-64 h-full bg-gradient-to-r from-black-primary to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 md:w-64 h-full bg-gradient-to-l from-black-primary to-transparent z-10 pointer-events-none"></div>

        <motion.div 
          className="flex gap-6 w-max py-4 px-4"
          animate={{ x: ["0%", "50%"] }} 
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 30
          }}
        >
          {[...displayReviews, ...displayReviews].map((review, index) => (
            <div 
              key={index}
              className="bg-black-surface rounded-3xl border border-brand-red-dark/30 shadow-2xl hover:shadow-brand-red/10 relative w-[300px] md:w-[400px] flex-shrink-0 flex flex-col overflow-hidden group transition-all duration-500"
            >
              {review.imageUrl && (
                <div className="w-full h-48 md:h-56 shrink-0 bg-black-primary relative overflow-hidden">
                  {/* Subtle gradient overlay to blend harsh image edges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black-surface via-transparent to-transparent z-10"></div>
                  <img 
                    src={review.imageUrl} 
                    alt="Customer Order" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" 
                    loading="lazy" 
                  />
                </div>
              )}
              
              <div className="p-6 md:p-8 flex-grow flex flex-col relative z-20">
                {/* Large faint watermark quote icon in the background, shifted left for RTL */}
                <MessageSquareQuote className="absolute -top-4 -left-6 text-brand-red-dark/10 w-40 h-40 -z-10 transform -rotate-6" />
                
                <div className="flex gap-1 text-brand-red mb-6 drop-shadow-md">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={20} 
                      fill={i < (review.rating || 5) ? "currentColor" : "none"} 
                      className={i >= (review.rating || 5) ? "text-brand-red-dark/40" : ""}
                    />
                  ))}
                </div>
                
                <p className="text-text-light text-lg md:text-xl leading-relaxed mb-8 whitespace-normal font-medium flex-grow">
                  "{review.comment}"
                </p>
                
                <div className="mt-auto border-t border-brand-red-dark/20 pt-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-brand-red truncate text-base md:text-lg">{review.customerName || "{lang === 'en' ? 'Special Customer' : 'عميل مميز'}"}</h4>
                    <span className="text-xs md:text-sm text-text-muted">Verified Buyer</span>
                  </div>
                  {/* Small clean quote icon at the bottom for aesthetic */}
                  <MessageSquareQuote size={20} className="text-brand-red-dark/50" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
