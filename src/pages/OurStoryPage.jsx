import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { Flame, Clock, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function OurStoryPage({ websiteData }) {
  const { lang } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const heroTitle = (lang === 'en' ? websiteData?.storyPageHeroTitleEn : websiteData?.storyPageHeroTitle) || (lang === 'en' ? 'The Black Box Story' : 'قصة الصندوق الأسود');
  const heroSub = (lang === 'en' ? websiteData?.storyPageHeroSubtitleEn : websiteData?.storyPageHeroSubtitle) || (lang === 'en' ? 'Passion. Fire. Perfection.' : 'شغف. نار. إتقان.');

  const smokeTitle = (lang === 'en' ? websiteData?.storyPageSmokeTitleEn : websiteData?.storyPageSmokeTitle) || (lang === 'en' ? 'The Art of Smoke' : 'فن التدخين الأصيل');
  const smokeText = (lang === 'en' ? websiteData?.storyPageSmokeTextEn : websiteData?.storyPageSmokeText) || (lang === 'en' ? 'Time is our main ingredient. We respect the meat, allowing natural oak wood to impart deep flavors over long hours, creating the signature bark and tender core.' : 'الوقت هو أهم مكوناتنا. نحن لا نستعجل النكهة، بل نحترم اللحم ونتركه لساعات طويلة على حرارة حطب البلوط الطبيعي الهادئة، لتتخلل النكهة المدخنة كل ألياف اللحم وينتج عنها أطرى بريسكيت.');
  const bRollUrl = websiteData?.bRollVideoUrl;
  const smokeImg = websiteData?.storyPageSmokeImage || websiteData?.signatureDishImageUrl || 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

  const smashTitle = (lang === 'en' ? websiteData?.storyPageSmashTitleEn : websiteData?.storyPageSmashTitle) || (lang === 'en' ? 'The Smash Technique' : 'سحر السماش');
  const smashText = (lang === 'en' ? websiteData?.storyPageSmashTextEn : websiteData?.storyPageSmashText) || (lang === 'en' ? 'The perfect crust. We smash our premium Black Angus beef onto a searing griddle to create the Maillard reaction—locking in juices while forming an irresistible, caramelized crust.' : 'سر القشرة المقرمشة. نصدم لحم البلاك أنجوس الصافي بصاج شديد الحرارة لنخلق (تفاعل مايار) - قشرة مكرملة غنية بالنكهة من الخارج، وتحبس كل العصارة اللذيذة من الداخل في كل قضمة.');
  const smashImg = websiteData?.storyPageSmashImage || 'https://images.unsplash.com/photo-1586816001966-79b736744398?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

  const qualityTitle = (lang === 'en' ? websiteData?.storyPageQualityTitleEn : websiteData?.storyPageQualityTitle) || (lang === 'en' ? 'Uncompromising Quality' : 'جودة لا تقبل المساومة');

  return (
    <div className="bg-black-surface min-h-screen font-sans text-text-light flex flex-col pt-24">
      <Header cartItemsCount={0} toggleCart={() => {}} />

      {/* Hero Header */}
      <section className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black-primary/80 z-10" />
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30" style={{ backgroundImage: `url(${websiteData?.storyPageHeroImage || 'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png'})` }} />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 text-center px-6"
        >
          <Flame size={48} className="text-brand-red mx-auto mb-6" />
          <h1 className="text-5xl md:text-7xl font-black uppercase mb-4 tracking-wider text-white drop-shadow-lg">{heroTitle}</h1>
          <p className="text-xl md:text-2xl text-gray-300 tracking-widest">{heroSub}</p>
        </motion.div>
      </section>

      {/* Section 1: Smoke */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: lang === 'ar' ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6">{smokeTitle}</h2>
              <div className="w-20 h-1.5 bg-brand-red mb-8 rounded-full"></div>
              <p className="text-xl leading-relaxed text-gray-300 font-medium">
                {smokeText}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative h-[500px]">
                {bRollUrl ? (
                  <video 
                    src={bRollUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <img src={smokeImg} alt={smokeTitle} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: Smash */}
      <section className="py-24 bg-black-primary relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row-reverse gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: lang === 'ar' ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6">{smashTitle}</h2>
              <div className="w-20 h-1.5 bg-brand-red mb-8 rounded-full"></div>
              <p className="text-xl leading-relaxed text-gray-300 font-medium">
                {smashText}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <img src={smashImg} alt={smashTitle} className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 3: Quality */}
      <section className="py-24 bg-brand-red text-white">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-16 uppercase"
          >
            {qualityTitle}
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
              <CheckCircle size={48} className="mb-4 text-black-primary" />
              <h3 className="text-2xl font-bold mb-3">{lang === 'en' ? 'Black Angus Beef' : 'لحوم بلاك أنجوس'}</h3>
              <p className="text-white/80">{lang === 'en' ? '100% fresh, never frozen. Quality you can taste.' : 'لحوم طازجة ١٠٠٪ غير مجمدة إطلاقاً.'}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
              <CheckCircle size={48} className="mb-4 text-black-primary" />
              <h3 className="text-2xl font-bold mb-3">{lang === 'en' ? 'Artisan Brioche' : 'خبز البريوش'}</h3>
              <p className="text-white/80">{lang === 'en' ? 'Freshly baked and lightly toasted with butter.' : 'مخبوز طازجاً ومحمص بخفة بالزبدة.'}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
              <CheckCircle size={48} className="mb-4 text-black-primary" />
              <h3 className="text-2xl font-bold mb-3">{lang === 'en' ? 'Signature Rubs' : 'بهاراتنا الخاصة'}</h3>
              <p className="text-white/80">{lang === 'en' ? 'Handcrafted spices that create the perfect bark.' : 'خلطات بهارات محضرة يدوياً لتغلف اللحم.'}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-black-surface text-center">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-black mb-8 text-white">
              {lang === 'en' ? 'Ready to Taste the Difference?' : 'هل أنت مستعد للتجربة؟'}
            </h2>
            <Link 
              to="/menu" 
              className="inline-flex items-center gap-3 bg-brand-red text-white hover:bg-brand-red-dark font-bold text-xl py-5 px-12 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-300"
            >
              {lang === 'en' ? 'Order Now' : 'اطلب الآن'}
              <ArrowRight size={24} className={lang === 'ar' ? 'transform rotate-180' : ''} />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer websiteData={websiteData} />
    </div>
  );
}
