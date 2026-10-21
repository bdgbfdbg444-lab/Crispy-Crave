import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { Plus, Flame, Beef, Sparkles } from 'lucide-react';
import { getProductThumbnailUrl } from '../../utils/imageOptimizer';

export const getCustomizerType = (prod) => {
  if (!prod) return 'drink';
  const rawType = (prod.customizerType || prod.CustomizerType || '').toLowerCase();
  if (rawType === 'sandwich' || rawType.includes('ساندوتش') || rawType.includes('برجر') || rawType.includes('burger')) return 'sandwich';
  if (rawType === 'meal' || rawType.includes('وجبة') || rawType.includes('وجبه')) return 'meal';
  if (rawType === 'drink' || rawType.includes('مشروب') || rawType.includes('شيك') || rawType.includes('shake')) return 'drink';

  // Heuristic fallback if not specified in POS
  const name = ((prod.name || '') + ' ' + (prod.nameEn || '')).toLowerCase();
  if (name.includes('برجر') || name.includes('ساندوتش') || name.includes('burger') || name.includes('sandwich')) return 'sandwich';
  if (name.includes('وجب') || name.includes('meal') || name.includes('كومبو') || name.includes('combo')) return 'meal';
  return 'drink';
};

export default function ProductCard({ product, onClick }) {
  const { lang, t } = useLanguage();
  if (!product) return null;

  const isSoldOut = Boolean(product?.isSoldOut || product?.IsSoldOut || product?.isAvailable === false || product?.IsAvailable === false);
  const isCustomizable = !isSoldOut && Boolean(product?.isCustomizable || product?.IsCustomizable);
  const customizerType = getCustomizerType(product);

  const getCustomizerButtonText = () => {
    if (customizerType === 'sandwich') {
      return lang === 'en' ? 'Customize Sandwich' : 'تخصيص الساندوتش';
    }
    if (customizerType === 'meal') {
      return lang === 'en' ? 'Customize Meal' : 'تخصيص الوجبة';
    }
    return lang === 'en' ? 'Customize Drink' : 'تخصيص المشروب';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group h-full ${
        isCustomizable 
          ? 'bg-gradient-to-b from-black-surface to-red-950/20 border-2 border-brand-red/50 hover:border-brand-red'
          : 'bg-black-surface border border-brand-red-dark/30'
      }`}
    >
      {/* Image Container */}
      <div className="relative h-48 w-full bg-black-primary overflow-hidden flex-shrink-0">
        {product.imagePath ? (
          <img 
            src={getProductThumbnailUrl(product.imagePath)} 
            alt={lang === 'en' && product.nameEn ? product.nameEn : product.name} 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSoldOut ? "grayscale opacity-50" : ""}`}
            loading="lazy"
            decoding="async"
            width={400}
            height={200}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted bg-black-primary">
            <Beef size={40} className="mb-2 opacity-30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isCustomizable && (
            <div className="bg-brand-red text-text-light text-xs font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>{lang === 'en' ? 'Craft Studio' : 'صنف قابل للتخصيص'}</span>
            </div>
          )}
          {product.isHotItem && !isCustomizable && (
            <div className="bg-brand-red text-text-light text-xs font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1">
              <Flame size={12} fill="currentColor" />
              {lang === 'en' ? 'Best Seller' : 'الأكثر مبيعاً'}
            </div>
          )}
          {isSoldOut && (
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
          <span className="font-bold text-brand-red whitespace-nowrap text-lg">
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
        <div className="mt-auto pt-4 border-t border-brand-red-dark/30">
          <button 
            disabled={isSoldOut}
            className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isSoldOut 
                ? 'bg-black-primary text-text-muted cursor-not-allowed' 
                : isCustomizable
                  ? 'bg-gradient-to-r from-brand-red to-red-600 text-white shadow-lg shadow-brand-red/30 hover:brightness-110'
                  : 'bg-black-surface text-brand-red hover:bg-brand-red hover:text-text-light'
            }`}
          >
            {isSoldOut ? (
              lang === 'en' ? 'Currently Unavailable' : 'غير متوفر حالياً'
            ) : isCustomizable ? (
              <>
                <Sparkles size={16} />
                <span>{getCustomizerButtonText()}</span>
              </>
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
