import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function LocationSection({ websiteData }) {
  const address = websiteData?.locationAddress || "شارع الملك فهد، الرياض، المملكة العربية السعودية";
  const hours = websiteData?.workingHours || "يومياً من ١ ظهراً إلى ٢ صباحاً";
  const mapIframe = websiteData?.googleMapsIframe || '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115852.19323145963!2d46.738586!3d24.846561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2efd3319808d75%3A0xc3f3484f4f46af3!2sRiyadh%20Saudi%20Arabia!5e0!3m2!1sen!2seg!4v1714522924151!5m2!1sen!2seg" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';

  return (
    <section className="py-24 bg-light relative" id="location">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-primary mb-4"
          >
            <MapPin size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">Visit Us</span>
            <MapPin size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-dark mb-4"
          >
            فروعنا وموقعنا
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-primary mx-auto rounded-full"
          ></motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 lg:gap-12 items-center bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Info Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/3 p-8 md:p-12 flex flex-col gap-8"
          >
            <div className="text-center lg:text-right">
              <h3 className="text-3xl font-black font-display text-dark mb-8">{APP_CONFIG.restaurantName}</h3>
              
              <div className="flex items-start justify-center lg:justify-start gap-4 mb-6 text-right">
                <div className="bg-primary/10 text-primary p-3 rounded-full shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-dark mb-1">العنوان</h4>
                  <p className="text-gray-600 leading-relaxed">{address}</p>
                </div>
              </div>

              <div className="flex items-start justify-center lg:justify-start gap-4 mb-8 text-right">
                <div className="bg-primary/10 text-primary p-3 rounded-full shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-dark mb-1">مواعيد العمل</h4>
                  <p className="text-gray-600 leading-relaxed">{hours}</p>
                </div>
              </div>
              
              <a href="#location" className="inline-flex items-center justify-center gap-2 w-full bg-dark hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-colors duration-300">
                <Navigation size={20} />
                احصل على الاتجاهات
              </a>
            </div>
          </motion.div>

          {/* Map Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/3 h-[400px] lg:h-[600px] bg-gray-200 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {mapIframe.includes('<iframe') ? (
              <div className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" dangerouslySetInnerHTML={{ __html: mapIframe }} />
            ) : mapIframe.includes('google.com/maps/embed') ? (
              <iframe src={mapIframe} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-center p-6 border-4 border-dashed border-gray-300">
                <MapPin size={48} className="text-gray-400 mb-4" />
                <h4 className="text-xl font-bold text-dark mb-2">تعذر تضمين الخريطة</h4>
                <p className="text-gray-500 mb-6 max-w-md">
                  الرابط الحالي هو رابط مشاركة عادي ولا يمكن تضمينه داخل الموقع. يرجى الدخول للوحة التحكم واستبداله برابط "تضمين الخريطة" (Embed a map) من جوجل.
                </p>
                <a href={mapIframe} target="_blank" rel="noopener noreferrer" className="bg-dark hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-colors">
                  افتح الرابط الحالي في خرائط جوجل
                </a>
              </div>
            )}
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
