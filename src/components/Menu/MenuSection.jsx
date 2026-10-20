import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Bike, ShoppingBag, UtensilsCrossed, Sparkles } from 'lucide-react';
import ShakeLabModal from '../Customizer/ShakeLabModal';
import { useCart } from '../../context/CartContext';
import ProductCard from './ProductCard';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';

const SkeletonLoader = () => (
  <div className="py-24 min-h-screen bg-black-surface">
    <div className="container mx-auto px-6">
      <div className="flex gap-4 overflow-hidden mb-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-32 bg-gray-800 rounded-full animate-pulse shrink-0"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-black-primary rounded-3xl overflow-hidden animate-pulse border border-gray-800 h-80">
            <div className="h-48 bg-gray-800 w-full"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-700 w-3/4 mb-2 rounded"></div>
              <div className="h-4 bg-gray-800 w-1/2 mb-4 rounded"></div>
              <div className="flex justify-between mt-4">
                <div className="h-6 bg-gray-700 w-16 rounded"></div>
                <div className="h-8 bg-brand-red/30 w-8 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);


export default function MenuSection({ menuData, onProductClick }) {
  const { lang, t } = useLanguage();
  const { orderType, setIsOrderTypeModalOpen, tableNumber } = useCart();
  if (!menuData || !menuData.categories) {
    return <SkeletonLoader />;
  }

  const categories = Object.values(menuData.categories).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'products'
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShakeLabOpen, setIsShakeLabOpen] = useState(false);
  const [selectedCustomizableProduct, setSelectedCustomizableProduct] = useState(null);

  // Extract products for the active category, or all products if searching
  let productsToDisplay = [];
  let activeCatData = null;

  if (searchQuery.trim() !== '') {
    categories.forEach(cat => {
      if (cat.products) {
        Object.values(cat.products).forEach(prod => {
          const searchLower = searchQuery.toLowerCase();
          const matchesName = prod.name.toLowerCase().includes(searchLower) || (prod.nameEn && prod.nameEn.toLowerCase().includes(searchLower));
          const matchesDesc = (prod.description && prod.description.toLowerCase().includes(searchLower)) || (prod.descriptionEn && prod.descriptionEn.toLowerCase().includes(searchLower));
          if (matchesName || matchesDesc) {
            productsToDisplay.push(prod);
          }
        });
      }
    });
  } else if (viewMode === 'products') {
    activeCatData = categories.find(c => c.id === activeCategory);
    if (activeCatData && activeCatData.products) {
      productsToDisplay = Object.values(activeCatData.products).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    // Guarantee a dedicated standalone 'Build Your Shake' item in Shake category if not yet configured in POS
    if (activeCatData && (activeCatData.name?.includes('شيك') || activeCatData.nameEn?.toLowerCase().includes('shake'))) {
      const hasCustomShake = productsToDisplay.some(p => p.isCustomizable || p.IsCustomizable || p.name?.includes('اصنع مشروبك'));
      if (!hasCustomShake) {
        productsToDisplay = [
          {
            id: 'custom_shake_studio',
            name: 'اصنع مشروبك بنفسك',
            nameEn: 'Build Your Own Shake',
            description: 'استوديو التخصيص التفاعلي: اختر النكهة، طبقات الصوصات، المقرمشات، والكريمة وشاهد مشروبك لايف.',
            descriptionEn: 'Interactive Craft Studio: Choose your base ice cream, cascading sauce drizzles, crunches, and toppings live.',
            sellingPrice: 120,
            isCustomizable: true,
            imagePath: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80'
          },
          ...productsToDisplay
        ];
      }
    }
  }

  return (
    <section id="menu" className="py-24 bg-black-surface relative min-h-screen">
      <div className="container mx-auto px-6">
        
        {/* Active Order Type Bar */}
        <div className="mb-8 flex items-center justify-between gap-4 p-3.5 px-5 rounded-2xl bg-black-primary/90 border border-brand-red-dark/30 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center shrink-0">
              {orderType === 'delivery' ? <Bike size={20} /> : orderType === 'DineIn' ? <UtensilsCrossed size={20} /> : <ShoppingBag size={20} />}
            </div>
            <div>
              <span className="text-[11px] text-text-muted font-bold block">{lang === 'en' ? 'Order Method' : 'طريقة الاستلام:'}</span>
              <span className="font-black text-sm md:text-base text-text-light">
                {orderType === 'delivery' 
                  ? (lang === 'en' ? 'Home Delivery 🛵' : 'توصيل للمنزل 🛵') 
                  : orderType === 'DineIn' 
                    ? (lang === 'en' ? `Dine-In ${tableNumber ? `(Table ${tableNumber})` : ''} 🍽️` : `تناول بالصالة ${tableNumber ? `(طاولة ${tableNumber})` : ''} 🍽️`) 
                    : (lang === 'en' ? 'Takeaway / Pickup 🛍️' : 'استلام من الفرع 🛍️')}
              </span>
            </div>
          </div>

          {!tableNumber && (
            <button 
              type="button"
              onClick={() => setIsOrderTypeModalOpen(true)}
              className="text-xs font-bold text-brand-red hover:text-white px-3.5 py-1.5 rounded-xl border border-brand-red/30 hover:bg-brand-red transition-all cursor-pointer shadow-sm"
            >
              {lang === 'en' ? 'Change' : 'تغيير'}
            </button>
          )}
        </div>

        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
            {viewMode === 'products' && searchQuery.trim() === '' && (
              <button 
                onClick={() => setViewMode('categories')}
                className="bg-black-surface p-3 rounded-full text-text-light hover:bg-black-surface transition-colors"
                title="العودة للأقسام"
              >
                <ChevronRight size={24} />
              </button>
            )}
            <h2 className="text-4xl font-display font-black text-text-light uppercase">
              {lang === 'en' ? 'Menu' : 'المنيو'}
            </h2>
          </div>
          
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="ابحث عن وجبتك المفضلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black-surface border border-brand-red-dark/30 rounded-full py-3 px-12 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all text-text-light placeholder-gray-400"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
          </div>
        </div>

        {/* Categories Grid (Stage 3) */}
        {searchQuery.trim() === '' && viewMode === 'categories' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {categories.map(category => (
              <div 
                key={category.id} 
                onClick={() => { setActiveCategory(category.id); setViewMode('products'); }}
                className="bg-black-surface rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-brand-red-dark/30 cursor-pointer flex flex-col group h-48 relative"
              >
                {category.imagePath ? (
                   <img src={optimizeCloudinaryUrl(category.imagePath, { width: 500, quality: 'auto' })} alt={lang === 'en' && category.nameEn ? category.nameEn : category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" width={500} height={200} />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-black-primary text-text-muted">{lang === 'en' ? 'No Image' : 'بدون صورة'}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black-primary/90 via-black-primary/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
                   <h3 className="text-2xl md:text-3xl font-display font-black text-text-light uppercase drop-shadow-md transform transition-transform duration-300 group-hover:translate-x-2">
                     {lang === 'en' && category.nameEn ? category.nameEn : category.name}
                   </h3>
                   <p className="text-brand-red font-bold mt-1 bg-black-surface/10 w-max px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                     {category.products ? Object.keys(category.products).length : 0} منتجات
                   </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Category Tabs - Sticky on Mobile (Stage 1) - Only visible in products view */}
        {searchQuery.trim() === '' && viewMode === 'products' && (
          <div className="sticky top-0 z-30 bg-black-surface/95 backdrop-blur-md pt-4 pb-4 mb-8 -mx-6 px-6 md:mx-0 md:px-0 border-b border-brand-red-dark/30 flex overflow-x-auto hide-scrollbar gap-4 items-center">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center whitespace-nowrap px-5 py-2.5 rounded-full font-bold transition-all duration-300 ${
                  activeCategory === category.id 
                    ? 'bg-black-primary text-text-light shadow-lg' 
                    : 'bg-black-surface text-text-muted hover:bg-black-surface'
                }`}
              >
                {category.imagePath && (
                  <img 
                    src={optimizeCloudinaryUrl(category.imagePath, { width: 100, quality: 'auto' })} 
                    alt={lang === 'en' && category.nameEn ? category.nameEn : category.name} 
                    className="w-7 h-7 rounded-full object-cover ms- border border-white/20"
                    loading="lazy"
                    decoding="async"
                    width={28}
                    height={28}
                  />
                )}
                {lang === 'en' && category.nameEn ? category.nameEn : category.name}
              </button>
            ))}
          </div>
        )}

        {/* Category Banner (Stage 2) - Only visible in products view */}
        {searchQuery.trim() === '' && viewMode === 'products' && activeCatData && activeCatData.imagePath && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeCatData.id + "_banner"}
            className="w-full h-48 md:h-64 rounded-2xl overflow-hidden relative mb-8 shadow-sm"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${activeCatData.imagePath})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black-primary/90 via-black-primary/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
              <h3 className="text-3xl md:text-5xl font-display font-black text-text-light uppercase drop-shadow-md">
                {lang === 'en' && activeCatData.nameEn ? activeCatData.nameEn : activeCatData.name}
              </h3>
              {activeCatData.description && (
                <p className="text-text-light/80 font-medium mt-2 text-sm md:text-base max-w-2xl drop-shadow">
                  {lang === 'en' && activeCatData.descriptionEn ? activeCatData.descriptionEn : activeCatData.description}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Search Results Title */}
        {searchQuery.trim() !== '' && (
          <div className="mb-8 font-bold text-text-muted">
            نتائج البحث عن: <span className="text-brand-red">{searchQuery}</span>
          </div>
        )}

        {/* Products Grid (Only when searching or in products view) */}
        {(searchQuery.trim() !== '' || viewMode === 'products') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {productsToDisplay.length > 0 ? (
                productsToDisplay.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => {
                      const isCustom = Boolean(
                        product?.isCustomizable || 
                        product?.IsCustomizable ||
                        product?.name?.includes('اصنع مشروبك') ||
                        product?.nameEn?.toLowerCase().includes('build your') ||
                        product?.name?.includes('صمم مشروبك')
                      );
                      if (isCustom) {
                        setSelectedCustomizableProduct(product);
                        setIsShakeLabOpen(true);
                      } else {
                        onProductClick(product, categories.find(c => c.products && c.products[product.id]));
                      }
                    }} 
                  />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-12 text-center text-text-muted text-lg"
                >
                  لم نجد منتجات مطابقة.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Shake Lab Modal */}
      <ShakeLabModal 
        isOpen={isShakeLabOpen} 
        onClose={() => setIsShakeLabOpen(false)} 
        baseProduct={selectedCustomizableProduct || (activeCatData?.products ? Object.values(activeCatData.products)[0] : null)}
        menuData={menuData}
      />
    </section>
  );
}
