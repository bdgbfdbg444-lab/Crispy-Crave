import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function Newsletter({ websiteData }) {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!websiteData) return null;

  const title = lang === 'en' ? websiteData.newsletterTitleEn : websiteData.newsletterTitle;
  const text = lang === 'en' ? websiteData.newsletterTextEn : websiteData.newsletterText;

  if (!title) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section id="newsletter" className="py-20 bg-black-surface border-t border-gray-800">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-gradient-to-r from-gray-900 to-black-primary rounded-3xl p-8 md:p-12 border border-gray-800 shadow-2xl flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-start">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-black mb-4 uppercase"
            >
              {title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              {text}
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-full md:w-auto flex-1"
          >
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'en' ? 'Enter your email address' : 'أدخل بريدك الإلكتروني'}
                className="w-full bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-full focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-colors"
                required
              />
              <button 
                type="submit" 
                className={`absolute ${lang === 'en' ? 'right-2' : 'left-2'} bg-brand-red text-white p-3 rounded-full hover:bg-red-700 transition-colors`}
              >
                <Send size={20} className={lang === 'ar' ? 'transform rotate-180' : ''} />
              </button>
            </form>
            {subscribed && (
              <p className="text-green-500 mt-3 text-sm font-medium text-center md:text-start">
                {lang === 'en' ? 'Thanks for subscribing!' : 'شكراً لاشتراكك!'}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
