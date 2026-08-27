import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function FaqSection({ websiteData }) {
  const { lang } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0); // First one open by default

  let faqsToDisplay = [];
  if (websiteData && websiteData.faqData) {
    try {
      const parsed = JSON.parse(websiteData.faqData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        faqsToDisplay = parsed.map(f => ({ question: lang === 'en' && (f.QuestionEn || f.questionEn) ? (f.QuestionEn || f.questionEn) : (f.Question || f.question), answer: lang === 'en' && (f.AnswerEn || f.answerEn) ? (f.AnswerEn || f.answerEn) : (f.Answer || f.answer) }));
      }
    } catch (e) {
      console.error("Error parsing FaqData", e);
    }
  }

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-black-surface relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-brand-red mb-4"
          >
            <HelpCircle size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">FAQ</span>
            <HelpCircle size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-text-light mb-4"
          >
            {lang === 'en' ? 'FAQ' : 'أسئلة شائعة'}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-brand-red mx-auto rounded-full mb-6"
          ></motion.div>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            {lang === 'en' ? 'Here are the answers to the most frequent questions from our special customers.' : 'إليك الإجابات على أكثر الأسئلة التي تصلنا من عملائنا المميزين.'}
          </p>
        </div>

        <div className="space-y-4">
          {faqsToDisplay.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${isOpen ? 'bg-black-surface border-brand-red/30 shadow-md' : 'bg-black-primary border-brand-red-dark/30 hover:border-brand-red-dark/50'}`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-right px-6 py-5 flex items-center justify-between focus:outline-none"
                >
                  <span className={`font-bold text-lg md:text-xl pe- ${isOpen ? 'text-brand-red' : 'text-text-light'}`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-brand-red/10 text-brand-red rotate-180' : 'bg-black-surface text-text-muted'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-2 text-text-muted leading-relaxed border-t border-brand-red-dark/30">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
