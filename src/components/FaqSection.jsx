import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

const FAQS = [
  {
    question: "هل يتوفر لديكم خدمة التوصيل (دليفري)؟",
    answer: `نعم! نوفر خدمة التوصيل السريع إلى معظم المناطق المحيطة. يمكنك التأكد من تغطية منطقتك عند إدخال عنوانك في صفحة إتمام الطلب.`
  },
  {
    question: "لماذا قد ينفد البريسكت في بعض الأيام؟",
    answer: "البريسكت الأصلي الخاص بنا يحتاج إلى 16 ساعة من التدخين البطيء على حطب البلوط الطبيعي. لأننا لا نساوم أبداً على الجودة ولا نستخدم أي طرق تسريع، فنحن نقوم بتحضير كمية محددة يومياً لضمان أعلى مستوى من الطعم. لذلك ننصح دائماً بالطلب مبكراً!"
  },
  {
    question: "هل اللحوم لديكم طازجة أم مجمدة؟",
    answer: "جميع اللحوم التي نستخدمها في البريسكت أو السماش برجر هي لحوم بلدي طازجة 100% غير مجمدة، ونعتمد على أفضل الموردين لضمان الجودة."
  },
  {
    question: "هل تقدمون وجبات مخصصة أو بوكسات للحفلات؟",
    answer: "بالتأكيد! لدينا قسم خاص بـ 'بوكسات التجمعات' في المنيو يكفي من 4 إلى 10 أشخاص، ويكون أوفر بكثير من طلب الوجبات بشكل فردي، وهو مثالي للعزومات."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0); // First one open by default

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-light relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-primary mb-4"
          >
            <HelpCircle size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">FAQ</span>
            <HelpCircle size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-dark mb-4"
          >
            أسئلة شائعة
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-primary mx-auto rounded-full mb-6"
          ></motion.div>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            إليك الإجابات على أكثر الأسئلة التي تصلنا من عملائنا المميزين.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${isOpen ? 'bg-white border-primary/30 shadow-md' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-right px-6 py-5 flex items-center justify-between focus:outline-none"
                >
                  <span className={`font-bold text-lg md:text-xl pr-2 ${isOpen ? 'text-primary' : 'text-dark'}`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-primary/10 text-primary rotate-180' : 'bg-gray-200 text-gray-500'}`}>
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
                      <div className="px-6 pb-6 pt-2 text-gray-600 leading-relaxed border-t border-gray-100">
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
