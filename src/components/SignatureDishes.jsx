import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Beef, ArrowLeft } from 'lucide-react';
import ProductModal from './Menu/ProductModal';

export default function SignatureDishes({ menuData }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Try to find the 3 signature dishes or fallback to first 3 items
  let signatureItems = [];
  
  if (menuData && menuData.categories) {
    const allItems = [];
    Object.values(menuData.categories).forEach(cat => {
      if (cat.products) {
        Object.values(cat.products).forEach(prod => allItems.push(prod));
      }
    });

    // Try to find specific keywords
    const brisket = allItems.find(item => item.name.includes('بريسكت') || item.name.includes('Brisket'));
    const smash = allItems.find(item => item.name.includes('سماش') || item.name.includes('Smash'));
    const nashville = allItems.find(item => item.name.includes('ناشفيل') || item.name.includes('ستريبس') || item.name.includes('Nashville'));

    if (brisket) signatureItems.push(brisket);
    if (smash) signatureItems.push(smash);
    if (nashville) signatureItems.push(nashville);

    // If we don't have 3, fill with random/first items
    for (let i = 0; signatureItems.length < 3 && i < allItems.length; i++) {
      if (!signatureItems.includes(allItems[i])) {
        signatureItems.push(allItems[i]);
      }
    }
  }

  // Fallback static data if menu isn't loaded or empty
  if (signatureItems.length === 0) {
    signatureItems = [
      { name: 'بريسكت مدخن', description: 'مدخن على حطب البلوط لمدة 16 ساعة', sellingPrice: 800, imagePath: null },
      { name: 'سماش برجر دبل', description: 'لحم بقري صافي مع الجبن الذائب', sellingPrice: 350, imagePath: null },
      { name: 'ناشفيل ستريبس', description: 'دجاج مقرمش بصوص الناشفيل الحار', sellingPrice: 280, imagePath: null },
    ];
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="py-24 bg-light relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-2 text-primary mb-4"
          >
            <Flame size={24} />
            <span className="font-bold tracking-wider text-sm uppercase">Signature Selection</span>
            <Flame size={24} />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-dark mb-4"
          >
            أطباقنا المميزة
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "80px" }}
            viewport={{ once: true }}
            className="h-1 bg-primary mx-auto rounded-full"
          ></motion.div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
        >
          {signatureItems.slice(0, 3).map((item, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group cursor-pointer border border-gray-100 flex flex-col"
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden bg-dark">
                {item.imagePath ? (
                  <img 
                    src={item.imagePath} 
                    alt={item.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800">
                    <Beef size={48} className="mb-2 opacity-50" />
                    <span>بدون صورة</span>
                  </div>
                )}
                
                {/* Price Badge */}
                <div className="absolute top-4 right-4 bg-primary text-white font-bold py-1 px-3 rounded-full shadow-lg">
                  {item.sellingPrice} ج.م
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-2xl font-display font-bold text-dark mb-2 group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  {item.description || "أفضل وأجود أنواع اللحوم المحضرة بعناية خاصة وشغف."}
                </p>
                
                <button 
                  onClick={() => setSelectedProduct(item)}
                  className="flex items-center text-primary font-bold mt-auto group-hover:gap-2 transition-all w-full text-right outline-none"
                >
                  <span>اطلب الآن</span>
                  <ArrowLeft size={18} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Product Modal for Signature Dishes */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          category={null} 
          menuData={menuData}
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </section>
  );
}
