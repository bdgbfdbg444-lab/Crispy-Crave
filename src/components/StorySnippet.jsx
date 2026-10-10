import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';

export default function StorySnippet({ websiteData }) {
  const { lang } = useLanguage();

  const titleEn = websiteData?.ourStoryTitleEn || 'The Black Box Story';
  const titleAr = websiteData?.ourStoryTitle || 'قصة الصندوق الأسود';
  
  const textEn = websiteData?.ourStoryTextEn || 'Discover our passion for authentic slow-smoked BBQ and the art of the perfect smash burger. We don\'t compromise on quality.';
  const textAr = websiteData?.ourStoryText || 'اكتشف شغفنا باللحوم المدخنة بالطرق الأصيلة، وفلسفتنا في صناعة أفضل برجر سماش. نحن لا نساوم على الجودة.';

  return (
    <section id="our-story" className="py-20 bg-black-surface border-t border-b border-gray-800">
      <div className="container mx-auto px-6 text-center max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Flame className="mx-auto text-brand-red mb-6" size={40} />
          <h2 className="text-3xl md:text-5xl font-black mb-6 text-white uppercase tracking-wider">
            {lang === 'en' ? titleEn : titleAr}
          </h2>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed font-medium">
            {lang === 'en' ? textEn : textAr}
          </p>
          <Link 
            to="/our-story" 
            className="inline-flex items-center gap-2 border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white font-bold py-3 px-8 rounded-full transition-all duration-300"
          >
            <span>{lang === 'en' ? 'Discover Our Philosophy' : 'اكتشف فلسفتنا'}</span>
            <ArrowRight size={20} className={lang === 'ar' ? 'transform rotate-180' : ''} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
