import React, { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimizer';

export default function SmartUpsellBar({ menuData, currentProduct = null, title = null }) {
  const { lang } = useLanguage();
  const { cartItems, addToCart } = useCart();
  const [addedIds, setAddedIds] = React.useState({});

  // 1. Flatten all available products from menuData
  const allProducts = useMemo(() => {
    if (!menuData?.categories) return [];
    const list = [];
    Object.values(menuData.categories).forEach(cat => {
      const catName = (cat.name || '').toLowerCase();
      const isSideCat = catName.includes('مقبلات') || catName.includes('جانبي') || catName.includes('بطاطس') || catName.includes('side') || catName.includes('fries') || catName.includes('sauce') || catName.includes('صوص');
      const isDrinkCat = catName.includes('مشروب') || catName.includes('عصير') || catName.includes('drink') || catName.includes('beverage');

      if (cat.products) {
        Object.values(cat.products).forEach(prod => {
          if (!prod.isSoldOut && prod.isAvailable !== false) {
            list.push({
              ...prod,
              categoryName: cat.name,
              categoryNameEn: cat.nameEn,
              isSideCat,
              isDrinkCat
            });
          }
        });
      }
    });
    return list;
  }, [menuData]);

  // 2. Identify missing complementary items in current cart or current product context
  const suggestions = useMemo(() => {
    if (!allProducts.length) return [];

    const existingNames = cartItems.map(i => (i.product?.name || '').toLowerCase()).join(' ');
    const existingCatNames = cartItems.map(i => (i.product?.categoryName || '').toLowerCase()).join(' ');

    // Check if drinks already exist in cart
    const hasDrink = existingNames.includes('بيبسي') || existingNames.includes('كولا') || 
                     existingNames.includes('سفن') || existingNames.includes('مياه') || 
                     existingNames.includes('عصير') || existingNames.includes('شويبس') ||
                     existingCatNames.includes('مشروب') || existingCatNames.includes('drink');

    // Check if fries/sides already exist in cart
    const hasFries = existingNames.includes('بطاطس') || existingNames.includes('فرايز') || 
                     existingNames.includes('fries') || existingCatNames.includes('جانبي') ||
                     existingCatNames.includes('sides');

    const existingProductIds = new Set(cartItems.map(i => i.product?.id || i.product?.Id));
    if (currentProduct?.id) existingProductIds.add(currentProduct.id);

    const matchedSuggestions = [];

    // 0. Priority: Custom Linked Upsell Products set by the manager
    const customLinkedIds = [];
    const checkProducts = currentProduct ? [currentProduct, ...cartItems.map(i => i.product)] : cartItems.map(i => i.product);
    checkProducts.forEach(prod => {
      if (prod?.linkedUpsellProductIds) {
        const parts = String(prod.linkedUpsellProductIds).split(',');
        parts.forEach(part => {
          const numId = parseInt(part.trim(), 10);
          if (!isNaN(numId) && !existingProductIds.has(numId) && !customLinkedIds.includes(numId)) {
            customLinkedIds.push(numId);
          }
        });
      }
    });

    // إذا تم تحديد أصناف مربوطة يدوياً بواسطة المدير، نكتفي بها فقط ولا نفرض أصناف تلقائية كبدائل عشوائية
    if (customLinkedIds.length > 0) {
      customLinkedIds.forEach(id => {
        const match = allProducts.find(p => p.id === id);
        if (match && !matchedSuggestions.some(m => m.id === match.id)) {
          matchedSuggestions.push(match);
        }
      });
      return matchedSuggestions;
    }

    // Prioritize drinks if cart has sandwiches but NO drink
    if (!hasDrink) {
      const drinkCandidates = allProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        return (p.isDrinkCat || name.includes('بيبسي') || name.includes('كولا') || name.includes('سفن') || name.includes('شويبس')) &&
               !matchedSuggestions.some(m => m.id === p.id) && !existingProductIds.has(p.id);
      });
      if (drinkCandidates.length > 0) {
        matchedSuggestions.push(drinkCandidates[0]);
      }
    }

    // Prioritize fries if cart has sandwiches but NO fries
    if (!hasFries) {
      const friesCandidates = allProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        return (p.isSideCat || name.includes('بطاطس') || name.includes('فرايز') || name.includes('fries')) &&
               !matchedSuggestions.some(m => m.id === p.id) && !existingProductIds.has(p.id);
      });
      if (friesCandidates.length > 0) {
        matchedSuggestions.push(friesCandidates[0]);
      }
    }

    // Add Signature Sauces or Top Sides
    const sauceCandidates = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      return (name.includes('صوص') || name.includes('sauce') || name.includes('جبنة') || name.includes('رانش') || name.includes('باربيكيو')) &&
             !matchedSuggestions.some(m => m.id === p.id) && !existingProductIds.has(p.id);
    });

    sauceCandidates.slice(0, 2).forEach(s => {
      if (!matchedSuggestions.some(m => m.id === s.id)) {
        matchedSuggestions.push(s);
      }
    });

    // Fallback 1: sides or drinks
    if (matchedSuggestions.length < 3) {
      const fillerCandidates = allProducts.filter(p => 
        (p.isSideCat || p.isDrinkCat || (p.sellingPrice && p.sellingPrice < 80)) &&
        !matchedSuggestions.some(m => m.id === p.id) &&
        !existingProductIds.has(p.id)
      );
      fillerCandidates.slice(0, 3 - matchedSuggestions.length).forEach(f => {
        matchedSuggestions.push(f);
      });
    }

    // Fallback 2: if still less than 3 suggestions, recommend other appetizing products from the menu
    if (matchedSuggestions.length < 3) {
      const remainingProducts = allProducts.filter(p => 
        !matchedSuggestions.some(m => m.id === p.id) &&
        !existingProductIds.has(p.id)
      );
      remainingProducts.slice(0, 3 - matchedSuggestions.length).forEach(p => {
        matchedSuggestions.push(p);
      });
    }

    return matchedSuggestions.slice(0, 4);
  }, [allProducts, cartItems, currentProduct]);

  if (suggestions.length === 0) return null;

  const handleQuickAdd = (product, e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <div className="w-full my-3 p-3.5 bg-black-surface rounded-2xl border border-brand-red-dark/30 shadow-md">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs sm:text-sm font-bold text-text-light">
          {title || (lang === 'en' ? 'Complete your meal with:' : 'يكتمل طعم وجبتك مع:')}
        </span>
        <span className="text-[10px] text-brand-red font-bold bg-brand-red/10 px-2 py-0.5 rounded-full border border-brand-red/20">
          {lang === 'en' ? '1-Tap Add' : 'إضافة بضغطة واحدة'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {suggestions.map(item => {
          const isAdded = Boolean(addedIds[item.id]);
          const displayName = lang === 'en' && item.nameEn ? item.nameEn : item.name;
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-black-primary/80 border border-white/5 hover:border-brand-red/50 p-2 rounded-xl flex flex-col justify-between transition-all group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {item.imagePath ? (
                  <img
                    src={optimizeCloudinaryUrl(item.imagePath, { width: 120, quality: 'auto' })}
                    alt={displayName}
                    className="w-10 h-10 rounded-lg object-cover bg-black-surface shrink-0"
                    loading="lazy"
                    decoding="async"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-black-surface border border-brand-red-dark/30 flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
                    BB
                  </div>
                )}
                <div className="overflow-hidden min-w-0">
                  <h4 className="text-xs font-bold text-text-light truncate group-hover:text-brand-red transition-colors">
                    {displayName}
                  </h4>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/5">
                <span className="text-[11px] font-extrabold text-brand-red">
                  {item.sellingPrice} {lang === 'en' ? 'EGP' : 'ج.م'}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(item, e)}
                  disabled={isAdded}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm ${
                    isAdded
                      ? 'bg-emerald-500 text-white'
                      : 'bg-brand-red/90 hover:bg-brand-red text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check size={11} strokeWidth={3} />
                      <span>{lang === 'en' ? 'Added' : 'تم'}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={11} strokeWidth={3} />
                      <span>{lang === 'en' ? 'Add' : 'أضف'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
