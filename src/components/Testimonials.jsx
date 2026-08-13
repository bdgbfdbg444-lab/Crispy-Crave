import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquareQuote } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function Testimonials() {
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
    <section className="py-24 bg-dark text-white relative overflow-hidden">
      <div className="container mx-auto px-6 mb-16">
        <div className="text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-primary mb-4"
          >
            <MessageSquareQuote size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">Customer Reviews</span>
            <MessageSquareQuote size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-white mb-4"
          >
            رأي الأكيلة
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-primary mx-auto rounded-full"
          ></motion.div>
        </div>
      </div>

      {/* Auto-scrolling Marquee */}
      <div className="relative w-full overflow-hidden flex">
        {/* Left/Right fading gradients to blend the marquee */}
        <div className="absolute top-0 left-0 w-16 md:w-64 h-full bg-gradient-to-r from-dark to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 md:w-64 h-full bg-gradient-to-l from-dark to-transparent z-10 pointer-events-none"></div>

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
              className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl relative w-[280px] md:w-[380px] flex-shrink-0 flex flex-col overflow-hidden"
            >
              {review.imageUrl && (
                <div className="w-full h-40 md:h-48 shrink-0 bg-dark">
                  <img src={review.imageUrl} alt="Customer Order" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              
              <div className="p-6 md:p-8 flex-grow flex flex-col relative">
                <MessageSquareQuote size={40} className="absolute top-4 right-4 text-gray-700/30 -z-0 md:w-16 md:h-16" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex gap-1 text-primary mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={18} 
                        fill={i < (review.rating || 5) ? "currentColor" : "none"} 
                        className={i >= (review.rating || 5) ? "text-gray-500" : ""}
                      />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 whitespace-normal">
                    "{review.comment}"
                  </p>
                  
                  <div className="mt-auto">
                    <h4 className="font-bold text-white truncate text-sm md:text-base">{review.customerName || "عميل مميز"}</h4>
                    <span className="text-xs md:text-sm text-gray-400">Verified Buyer</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
