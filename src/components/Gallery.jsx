import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeCloudinaryUrl } from '../utils/imageOptimizer';
import { Camera, X } from 'lucide-react';

export default function Gallery({ websiteData }) {
  const { lang } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);
  
  let images = [];
  
  if (websiteData?.galleryImages) {
    if (typeof websiteData.galleryImages === 'string') {
      images = websiteData.galleryImages.split(',').map(url => url.trim()).filter(Boolean);
    } else if (Array.isArray(websiteData.galleryImages)) {
      images = websiteData.galleryImages;
    }
  }

  // Fallbacks for empty gallery
  if (images.length === 0) {
    images = [
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png',
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png',
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png',
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png',
    ];
  }

  const displayImages = images.slice(0, 4);

  return (
    <section id="gallery" className="py-24 bg-black-surface relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-brand-red mb-4"
          >
            <Camera size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">Behind The Smoke</span>
            <Camera size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-text-light mb-4"
          >
            {lang === 'en' ? 'From the Heart of the Restaurant' : 'من قلب المطعم'}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-brand-red mx-auto rounded-full"
          ></motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayImages.map((src, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="aspect-square relative group overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-brand-red/20 transition-all border border-gray-800"
              onClick={() => setSelectedImage(src)}
            >
              <img 
                src={optimizeCloudinaryUrl(src, { width: 600, quality: 'auto' })} 
                alt={`Gallery ${idx + 1}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
                decoding="async"
                width={400}
                height={400}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Camera size={32} className="text-white drop-shadow-lg scale-50 group-hover:scale-100 transition-transform duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-white hover:text-brand-red transition-colors bg-black/50 p-2 rounded-full"
            >
              <X size={28} />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={selectedImage}
              alt="Lightbox"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
