import React from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CateringSection({ websiteData }) {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-dark text-white relative overflow-hidden">
      {/* Background Decor */}
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
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent"></div>
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 right-6 bg-primary text-white p-4 rounded-2xl shadow-xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/80">خصومات تصل إلى</p>
                    <p className="text-2xl font-black">15% للتجمعات</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative element */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          </motion.div>

          {/* Text Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 text-center lg:text-right"
          >
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6 text-primary">
              <Users size={18} />
              <span className="text-sm font-bold tracking-wide">عزومات وحفلات</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-6 leading-tight">
              اجعل تجمعاتك <span className="text-primary">أكثر متعة</span>
            </h2>
            
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              سواء كانت عزومة عائلية، تجمع مع الأصدقاء، أو مناسبة خاصة، قمنا بتجهيز "بوكسات التوفير" الخاصة بنا لتناسب جميع الأعداد. استمتع بأفضل لحوم البريسكت المدخنة، والسماش برجر مع الأطباق الجانبية بأسعار أوفر بكثير.
            </p>

            <ul className="space-y-4 mb-10 text-right">
              {[
                "بوكسات متنوعة تكفي من 4 إلى 10 أشخاص",
                "تغليف حراري خاص يحافظ على سخونة الأكل",
                "أطباق جانبية وصوصات إضافية مجانية"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center justify-start gap-3 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                  <span className="font-bold">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => navigate('/menu')}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 w-full sm:w-auto outline-none group mx-auto lg:mx-0"
            >
              <span>تصفح عروض التجمعات</span>
              <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
