import { useLanguage } from '../context/LanguageContext';
import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function OurStory({ websiteData }) {
  const { lang } = useLanguage();
  const storyText = (lang === 'en' && websiteData?.ourStoryTextEn ? websiteData?.ourStoryTextEn : websiteData?.ourStoryText) || "بدأت رحلتنا من شغف حقيقي باللحوم المدخنة بطيئة الطهي على حطب البلوط الطبيعي. نحن نؤمن بأن البريسكت الحقيقي يحتاج إلى وقت، صبر، وحب، وهذا ما نقدمه في كل قطعة. أضفنا لمستنا الخاصة لسماش برجر لنقدم تجربة لا تُنسى لعشاق اللحوم الحقيقية.";
  
  // If there's a bRoll video, we use it, otherwise a placeholder image
  const bRollUrl = websiteData?.bRollVideoUrl;
  
  return (
    <section className="py-24 bg-black-primary text-text-light relative overflow-hidden" id="our-story">
      {/* Decorative Texture/Gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 text-center lg:text-right"
          >
            <h2 className="text-4xl md:text-5xl font-display font-black text-text-light mb-6">
              {lang === 'en' ? (websiteData?.ourStoryTitleEn || 'Our Story & Passion') : (websiteData?.ourStoryTitle || 'قصتنا وشغفنا')}
            </h2>
            <div className="h-1 bg-brand-red w-16 mx-auto lg:mx-0 mb-8 rounded-full"></div>
            
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
              {storyText}
            </p>
            
            {/* Highlights/Features */}
            <div className="grid grid-cols-2 gap-6 text-center lg:text-right border-t border-gray-700 pt-8 mt-8">
              <div>
                <h4 className="text-3xl font-display font-black text-brand-red mb-2">16</h4>
                <p className="text-text-muted font-bold">{lang === 'en' ? 'Hours Slow Smoking' : 'ساعة تدخين بطيء'}</p>
              </div>
              <div>
                <h4 className="text-3xl font-display font-black text-brand-red mb-2">100%</h4>
                <p className="text-text-muted font-bold">{lang === 'en' ? 'Natural Oak Wood' : 'حطب طبيعي'}</p>
              </div>
            </div>
          </motion.div>

          {/* Media / Video */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video border border-gray-800 group">
              {bRollUrl ? (
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                >
                  <source src={bRollUrl} type="video/mp4" />
                </video>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-text-muted">لا يوجد فيديو</span>
                </div>
              )}
              
              {/* Overlay Play Button (decorative) */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-brand-red-dark rounded-full flex items-center justify-center text-text-light shadow-lg backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
                  <Play size={24} className="ms-" fill="currentColor" />
                </div>
              </div>
            </div>
            
            {/* Floating Element Decor */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-red/20 rounded-full blur-2xl -z-10"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
