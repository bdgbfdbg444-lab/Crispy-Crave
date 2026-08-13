import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame, Beef } from 'lucide-react';

export default function ProductCard({ product, onClick }) {
  if (!product) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer flex flex-col group h-full"
    >
      {/* Image Container */}
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden flex-shrink-0">
        {product.imagePath ? (
          <img 
            src={product.imagePath} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <Beef size={40} className="mb-2 opacity-30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.isHotItem && (
            <div className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1">
              <Flame size={12} fill="currentColor" />
              الأكثر مبيعاً
            </div>
          )}
          {product.isSoldOut && (
            <div className="bg-dark text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
              نفدت الكمية
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-xl text-dark line-clamp-2 leading-tight">
            {product.name}
          </h3>
          <span className="font-bold text-primary whitespace-nowrap text-lg">
            {product.sellingPrice} <span className="text-sm">ج.م</span>
            {product.isSoldByWeight && <span className="text-xs text-gray-500 block">/ 1 كجم</span>}
          </span>
        </div>
        
        {product.description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">
            {product.description}
          </p>
        )}

        {/* Add Button */}
        <div className="mt-auto pt-4 border-t border-gray-50">
          <button 
            disabled={product.isSoldOut}
            className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
              product.isSoldOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-light text-primary hover:bg-primary hover:text-white'
            }`}
          >
            {product.isSoldOut ? (
              'غير متوفر حالياً'
            ) : (
              <>
                <Plus size={18} />
                إضافة للطلب
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
