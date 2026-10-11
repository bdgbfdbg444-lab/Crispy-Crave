import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';

export default function OrderCta({ websiteData }) {
  const { lang } = useLanguage();
  const { orderType, setIsOrderTypeModalOpen } = useCart();
  const navigate = useNavigate();

  if (!websiteData) return null;

  const title = lang === 'en' ? websiteData.orderCtaTitleEn : websiteData.orderCtaTitle;
  const text = lang === 'en' ? websiteData.orderCtaTextEn : websiteData.orderCtaText;
  const button = lang === 'en' ? websiteData.orderCtaButtonEn : websiteData.orderCtaButton;

  if (!title) return null;

  return (
    <section className="py-20 bg-brand-red text-white relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png')] bg-cover bg-center mix-blend-multiply"></div>
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase drop-shadow-md">
            {title || (lang === 'en' ? 'Craving the Best?' : 'اطلب الآن واستمتع')}
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-white/90 font-medium">
            {text || (lang === 'en' ? 'Get your smoked brisket delivered to your door' : 'بالطعم الأصلي للبريسكيت')}
          </p>
          <button 
            type="button"
            onClick={() => {
              if (!orderType) {
                setIsOrderTypeModalOpen(true);
              } else {
                navigate('/menu');
              }
            }}
            className="inline-flex items-center gap-3 bg-black-primary text-white hover:bg-gray-900 font-bold text-xl py-5 px-12 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-300 cursor-pointer"
          >
            <Utensils size={24} />
            {button || (lang === 'en' ? 'Order Now' : 'اطلب الآن')}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
