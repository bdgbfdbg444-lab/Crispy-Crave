import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion, useInView } from 'framer-motion';
import { Flame, Clock, Award } from 'lucide-react';
import { optimizeCloudinaryUrl } from '../utils/imageOptimizer';

const AnimatedCounter = ({ targetValue, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let startTime;
      let animationFrame;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Easing function (easeOutQuart)
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        setCount(Math.floor(easeProgress * targetValue));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, targetValue, duration]);

  return <span ref={ref}>{count}</span>;
};

export default function OurStory({ websiteData }) {
  const { lang } = useLanguage();
  
  // Use data from Firebase or fallback to empty strings
  const storyText = (lang === 'en' && websiteData?.ourStoryTextEn ? websiteData?.ourStoryTextEn : websiteData?.ourStoryText) ?? "بدأت رحلتنا من شغف تقديم اللحوم المدخنة بالطرق التقليدية الأصيلة. نحن نؤمن بأن التفاصيل الصغيرة تصنع فرقاً كبيراً ولذلك نأخذ وقتنا في كل خطوة. من اختيار أجود أنواع اللحوم وحتى تقديمها لك.";
  const bRollUrl = websiteData?.bRollVideoUrl;
  const signatureImage = websiteData?.signatureDishImageUrl;

  return (
    <section id="our-story" className="py-24 bg-black-surface relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <div className="mb-6 flex items-center gap-3">
              <Flame className="text-brand-red" size={32} />
              <h2 className="text-4xl md:text-5xl font-display font-black text-text-light uppercase tracking-wider">
                {lang === 'en' ? (websiteData?.ourStoryTitleEn || 'Our Story & Passion') : (websiteData?.ourStoryTitle || 'قصتنا وشغفنا')}
              </h2>
            </div>
            
            <div className="w-20 h-1.5 bg-brand-red mb-8 rounded-full"></div>
            
            <p className="text-lg text-text-light/80 leading-relaxed mb-8 whitespace-pre-line border-l-4 border-brand-red/30 pl-6 rtl:pl-0 rtl:border-l-0 rtl:border-r-4 rtl:pr-6">
              {storyText}
            </p>
            
            {/* Animated Counters / Stats */}
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="flex flex-col items-center p-6 bg-black-primary rounded-2xl border border-gray-800 shadow-xl">
                <Clock className="text-brand-red mb-4" size={40} strokeWidth={1.5} />
                <h3 className="text-4xl font-black text-white mb-2">
                  +<AnimatedCounter targetValue={16} />
                </h3>
                <p className="text-text-muted font-bold">{lang === 'en' ? 'Hours Slow Smoking' : 'ساعة تدخين بطيء'}</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-black-primary rounded-2xl border border-gray-800 shadow-xl">
                <Award className="text-brand-red mb-4" size={40} strokeWidth={1.5} />
                <h3 className="text-4xl font-black text-white mb-2">
                  <AnimatedCounter targetValue={100} />%
                </h3>
                <p className="text-text-muted font-bold">{lang === 'en' ? 'Natural Oak Wood' : 'حطب طبيعي'}</p>
              </div>
            </div>
          </motion.div>
          
          {/* Right Media Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800 aspect-square lg:aspect-[4/5] bg-black-primary">
              
              {/* Optional Video Background behind image or standalone */}
              {bRollUrl && isInView ? (
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  preload="none"
                  poster={optimizeCloudinaryUrl(bRollUrl.replace(/\.mp4$/i, '.jpg'), { width: 720, quality: 'auto' })}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
                >
                  <source src={optimizeCloudinaryUrl(bRollUrl, { width: 720, quality: 'auto' })} type="video/mp4" />
                </video>
              ) : null}

              {/* Main Signature Dish Image */}
              {signatureImage ? (
                <img 
                  src={optimizeCloudinaryUrl(signatureImage, { width: 800, quality: 'auto' })} 
                  alt="Signature Dish" 
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out z-10"
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-brand-red-dark/20 to-black-primary flex items-center justify-center z-10">
                   <span className="text-gray-500 font-display text-2xl uppercase tracking-widest opacity-50">Smoke & Smash</span>
                </div>
              )}
              
              {/* Gradient Overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black-primary via-transparent to-transparent z-20"></div>
              
              {/* Floating Badge */}
              <div className="absolute bottom-8 right-8 z-30 bg-black-primary/90 backdrop-blur-md p-4 rounded-xl border border-brand-red-dark shadow-2xl flex items-center gap-4 transform translate-y-4 hover:-translate-y-0 transition-transform">
                <div className="bg-brand-red text-white p-3 rounded-full">
                  <Flame size={24} />
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight tracking-wider">{lang === 'en' ? 'Authentic' : 'أصلي'}</p>
                  <p className="text-brand-red font-bold text-sm tracking-widest">{lang === 'en' ? 'BBQ' : 'باربيكيو'}</p>
                </div>
              </div>
            </div>
            
            {/* Decorative background accent */}
            <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-red/5 rounded-full blur-[100px]"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
