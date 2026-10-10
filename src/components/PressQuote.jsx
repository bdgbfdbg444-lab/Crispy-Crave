import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export default function PressQuote({ websiteData }) {
  const { lang } = useLanguage();

  if (!websiteData) return null;

  const text = lang === 'en' ? websiteData.pressQuoteTextEn : websiteData.pressQuoteText;
  const author = lang === 'en' ? websiteData.pressQuoteAuthorEn : websiteData.pressQuoteAuthor;

  if (!text) return null;

  return (
    <section className="py-16 bg-black-primary border-t border-b border-gray-800">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <Quote className="mx-auto text-brand-red opacity-50 mb-6" size={48} />
          <h3 className="text-2xl md:text-4xl font-black text-white italic leading-tight mb-8">
            "{text || (lang === 'en' ? 'The best brisket in town' : 'أفضل بريسكيت في المدينة')}"
          </h3>
          <p className="text-brand-red font-bold text-lg tracking-widest uppercase">
            — {author || (lang === 'en' ? 'Food Critic' : 'ناقد طعام')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
