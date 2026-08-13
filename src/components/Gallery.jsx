import React from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

export default function Gallery({ websiteData }) {
  // Parse gallery images or use placeholders
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
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png', // Temporary placeholder 1
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png', // Temporary placeholder 2
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png', // Temporary placeholder 3
      'https://res.cloudinary.com/vgk0saib/image/upload/v1786579629/maq1oncsu8t5u4bpjlnw.png', // Temporary placeholder 4
    ];
  }

  // We only display the first 4-6 images in the home page grid to keep it clean
  const displayImages = images.slice(0, 4);

  return (
    <section className="py-24 bg-light relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-primary mb-4"
          >
            <Camera size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">Behind The Smoke</span>
            <Camera size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-dark mb-4"
          >
            من قلب المطعم
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-primary mx-auto rounded-full"
          ></motion.div>
        </div>

        {/* Gallery Bento Grid - Guarantees 100% full width */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
          {images.map((img, index) => {
            // Bento layout logic for 4 images
            let spanClass = 'md:col-span-1 md:row-span-1';
            if (index === 0) spanClass = 'md:col-span-2 md:row-span-2';
            else if (index === 1) spanClass = 'md:col-span-2 md:row-span-1';
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className={`relative rounded-2xl overflow-hidden group bg-dark w-full h-full ${spanClass}`}
              >
                <img 
                  src={img} 
                  alt={`Gallery image ${index + 1}`} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-in-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}
