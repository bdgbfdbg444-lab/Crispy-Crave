import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CateringSection({ websiteData }) {
  const { lang } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    guests: '',
    date: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Cloudflare Worker URL (سيتم استبدال هذا الرابط بالرابط الحقيقي بعد إنشاء الـ Worker)
      const WORKER_URL = "https://smoke-catering-bot.abusaudgaming.workers.dev"; 
      
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      setIsSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setIsSuccess(false);
        setFormData({ name: '', phone: '', guests: '', date: '', notes: '' });
      }, 5000);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24 bg-black-primary text-text-light relative overflow-hidden" id="catering">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Image Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square md:aspect-[4/3] border border-gray-800">
              <img 
                src={websiteData?.cateringImageUrl || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000"} 
                alt="عروض التجمعات والحفلات" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black-primary/80 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-6 right-6 bg-wood text-text-light p-4 rounded-2xl shadow-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black-surface/20 rounded-full flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-light/80">{lang === 'en' ? (websiteData?.cateringBadgeLine1En || 'Discounts up to') : (websiteData?.cateringBadgeLine1 || 'خصومات تصل إلى')}</p>
                    <p className="text-2xl font-black">{lang === 'en' ? (websiteData?.cateringBadgeLine2En || '15% for groups') : (websiteData?.cateringBadgeLine2 || '15% للتجمعات')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-wood/20 rounded-full blur-3xl -z-10"></div>
          </motion.div>

          {/* Text/Form Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 text-center lg:text-right"
          >
            <div className="inline-flex items-center gap-2 bg-black-surface/5 border border-white/10 rounded-full px-4 py-2 mb-6 text-neon-amber">
              <Users size={18} />
              <span className="text-sm font-bold tracking-wide">{lang === 'en' ? 'Events & Gatherings' : 'عزومات وحفلات'}</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-text-light mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: (lang === 'en' && websiteData?.cateringTitleEn ? websiteData?.cateringTitleEn : websiteData?.cateringTitle) || 'اجعل تجمعاتك <span class="text-neon-amber">أكثر متعة</span>' }} />
            
            <AnimatePresence mode="wait">
              {!showForm ? (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-lg text-gray-300 leading-relaxed mb-8 whitespace-pre-line">
                    {(lang === 'en' && websiteData?.cateringDescriptionEn ? websiteData?.cateringDescriptionEn : websiteData?.cateringDescription) || (lang === 'en' ? 'Whether it is a family gathering, friends meetup, or a special occasion, we prepared Saver Boxes to suit all group sizes.' : 'سواء كانت عزومة عائلية، تجمع مع الأصدقاء، أو مناسبة خاصة، قمنا بتجهيز "بوكسات التوفير" الخاصة بنا لتناسب جميع الأعداد.')}
                  </p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-wood hover:bg-wood-dark text-text-light font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-neon-amber/30 flex items-center justify-center gap-2 w-full sm:w-auto outline-none group mx-auto lg:mx-0"
                  >
                    <span>{lang === 'en' ? (websiteData?.cateringButtonTextEn || 'Book Now For Events') : (websiteData?.cateringButtonText || 'احجز الآن للحفلات')}</span>
                    <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-900/30 border border-green-500/50 rounded-2xl p-8 text-center"
                >
                  <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">شكراً لطلبك!</h3>
                  <p className="text-green-200">
                    تم استلام طلبك بنجاح. سيقوم فريق الحفلات بالتواصل معك قريباً لتأكيد التفاصيل.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 text-right"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Name' : 'الاسم'}</label>
                      <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-wood outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Phone Number' : 'رقم الهاتف'}</label>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-wood outline-none transition-colors" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Number of People' : 'عدد الأشخاص'}</label>
                      <input required type="number" name="guests" value={formData.guests} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-wood outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Event Date' : 'تاريخ المناسبة'}</label>
                      <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-wood outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{lang === 'en' ? 'Additional Details (Optional)' : 'تفاصيل إضافية (اختياري)'}</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="w-full bg-black-surface border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-wood outline-none transition-colors resize-none"></textarea>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 bg-wood hover:bg-wood-dark disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> <span>{lang === 'en' ? 'Submit Request' : 'إرسال الطلب'}</span></>}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      disabled={isSubmitting}
                      className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                    >
                      {lang === 'en' ? 'Cancel' : 'إلغاء'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
