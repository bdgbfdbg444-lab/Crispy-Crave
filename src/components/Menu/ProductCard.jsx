import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { Plus, Flame, Beef } from 'lucide-react';


export default function ProductCard({ product, onClick }) {
  const { lang, t } = useLanguage();
  if (!product) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-black-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-wood-dark/30 cursor-pointer flex flex-col group h-full"
    >
      {/* Image Container */}
      <div className="relative h-48 w-full bg-black-primary overflow-hidden flex-shrink-0">
        {product.imagePath ? (
          <img 
            src={product.imagePath} 
            alt={lang === 'en' && product.nameEn ? product.nameEn : product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted bg-black-primary">
            <Beef size={40} className="mb-2 opacity-30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.isHotItem && (
            <div className="bg-wood text-text-light text-xs font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1">
              <Flame size={12} fill="currentColor" />
              {lang === 'en' ? 'Best Seller' : 'الأكثر مبيعاً'}
            </div>
          )}
          {product.isSoldOut && (
            <div className="bg-black-primary text-text-light text-xs font-bold px-2 py-1 rounded-md shadow-md">
              {lang === 'en' ? 'Out of Stock' : 'نفدت الكمية'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-xl text-text-light line-clamp-2 leading-tight">
            {lang === 'en' && product.nameEn ? product.nameEn : product.name}
          </h3>
          <span className="font-bold text-neon-amber whitespace-nowrap text-lg">
            {product.sellingPrice} <span className="text-sm">{lang === 'en' ? 'EGP' : 'ج.م'}</span>
            {product.isSoldByWeight && <span className="text-xs text-text-muted block">{lang === 'en' ? '/ 1 kg' : '/ 1 كجم'}</span>}
          </span>
        </div>
        
        {product.description && (
          <p className="text-text-muted text-sm line-clamp-2 mb-4 flex-grow">
            {lang === 'en' && product.descriptionEn ? product.descriptionEn : product.description}
          </p>
        )}

        {/* Add Button */}
        <div className="mt-auto pt-4 border-t border-wood-dark/30">
          <button 
            disabled={product.isSoldOut}
            className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
              product.isSoldOut 
                ? 'bg-black-primary text-text-muted cursor-not-allowed' 
                : 'bg-black-surface text-neon-amber hover:bg-wood hover:text-text-light'
            }`}
          >
            {product.isSoldOut ? (
              lang === 'en' ? 'Currently Unavailable' : 'غير متوفر حالياً'
            ) : (
              <>
                <Plus size={18} />
                {lang === 'en' ? 'Add to order' : 'إضافة للطلب'}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
