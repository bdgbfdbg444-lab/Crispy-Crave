import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, ShoppingBag, Gift } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

// Default Fallback Elements if POS addons not configured
const DEFAULT_SHAKE_BASES = [
  { id: 'base_icecream', name: 'آيس كريم فانيليا كريمي', nameEn: 'Creamy Vanilla Ice Cream', price: 0, color: '#FDF0D5', desc: 'قاعدة الآيسكريم الغنية' },
  { id: 'base_milk', name: 'حليب طبيعي طازج', nameEn: 'Fresh Pure Milk', price: 0, color: '#FFFFFF', desc: 'حليب كامل الدسم مبستر' }
];

export default function ShakeLabModal({ isOpen, onClose, baseProduct, menuData, initialCustomization = null, onSaveEdit = null }) {
  const { lang } = useLanguage();
  const { addToCart } = useCart();
  const isEn = lang === 'en';

  // Helper to pick the proper localized name
  const getItemName = (item) => {
    if (!item) return '';
    return isEn ? (item.nameEn || item.name) : (item.name || item.nameEn);
  };

  // 1. Base Selection Mode & Separate Free Limits defined from POS
  const baseSelectionMode = baseProduct?.baseSelectionMode || baseProduct?.BaseSelectionMode || 'SingleChoice';
  const freeSaucesLimit = Number(
    baseProduct?.freeSaucesLimit ?? 
    baseProduct?.FreeSaucesLimit ?? 
    (baseProduct?.freeModifiersLimit ? 1 : 0)
  );
  const freeExtrasLimit = Number(
    baseProduct?.freeExtrasLimit ?? 
    baseProduct?.FreeExtrasLimit ?? 
    (baseProduct?.freeModifiersLimit ? Math.max(0, Number(baseProduct.freeModifiersLimit) - 1) : 0)
  );

  // 2. Extract purely dynamic Add-Ons coming from POS / Firebase linked to this product
  const { shakeBases, shakeSauces, shakeCrunches, shakeToppings } = useMemo(() => {
    const pId = baseProduct?.id?.toString();
    const allAddons = menuData?.AddOns || menuData?.addOns || [];
    
    // Filter addons linked to this product (or general unconstrained)
    const posAddOns = allAddons.filter(a => {
      if (a.linkedProductIds && a.linkedProductIds.trim() !== '' && a.linkedProductIds !== '*') {
        const ids = a.linkedProductIds.split(',').map(s => s.trim());
        return ids.includes(pId);
      }
      // If unconstrained, do NOT allow burger/meat/bun ingredients into milkshakes!
      const name = (a.name || '').toLowerCase();
      if (name.includes('خبز') || name.includes('عيش') || name.includes('بريوش') || name.includes('لحم') || name.includes('بيكون') || name.includes('بصل') || name.includes('مخلل') || name.includes('بريسكت') || name.includes('موزاريلا') || name.includes('هالبينو')) {
        return false;
      }
      return true;
    });

    const sauces = [];
    const crunches = [];
    const toppings = [];
    const bases = [];

    if (posAddOns && posAddOns.length > 0) {
      posAddOns.forEach(a => {
        const role = (a.customizerRole || '').toLowerCase();
        const item = {
          id: `pos_${a.id}`,
          name: a.name,
          nameEn: a.nameEn || a.name,
          // Base components are ALWAYS 0 EGP (free)
          price: role === 'base' ? 0 : (Number(a.price) || 0),
          group: a.group || (role === 'base' ? 'Free' : 'Paid'),
          color: a.visualColor || '#E63946',
          iconPath: a.iconPath || null
        };

        if (role === 'base') {
          bases.push(item);
        } else if (role === 'sauce') {
          sauces.push(item);
        } else if (role === 'crunch') {
          crunches.push(item);
        } else if (role === 'topping') {
          toppings.push(item);
        }
      });
    }

    return {
      shakeBases: bases.length > 0 ? bases : DEFAULT_SHAKE_BASES,
      shakeSauces: sauces,
      shakeCrunches: crunches,
      shakeToppings: toppings
    };
  }, [baseProduct, menuData]);

  // Selected Customization State
  // RULE: ALL Base ingredients are automatically pre-selected / included by default!
  const [selectedBases, setSelectedBases] = useState([]);
  const [selectedSauces, setSelectedSauces] = useState([]);
  const [selectedCrunches, setSelectedCrunches] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [activeTab, setActiveTab] = useState('base'); // 'base' | 'sauces' | 'crunch' | 'toppings'
  const [isSuccessShake, setIsSuccessShake] = useState(false);

  // Reset ALL customization state whenever a new product is selected or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialCustomization) {
        // ========== EDIT MODE: RESTORE SAVED SELECTIONS ==========
        // 1. Base items / flavor
        const savedBaseMods = initialCustomization.selectedModifiers?.filter(m => m.isBase && !m.isExclusion);
        if (savedBaseMods && savedBaseMods.length > 0) {
          const preserved = shakeBases.filter(b => 
            savedBaseMods.some(m => m.id === `base_${b.id}` || m.id === b.id || m.name === b.name || m.name === getItemName(b))
          );
          if (preserved.length > 0) {
            setSelectedBases(preserved);
          } else if (shakeBases.length > 0) {
            setSelectedBases(baseSelectionMode === 'SingleChoice' ? [shakeBases[0]] : shakeBases);
          }
        } else if (shakeBases.length > 0) {
          setSelectedBases(baseSelectionMode === 'SingleChoice' ? [shakeBases[0]] : shakeBases);
        }

        // 2. Sauces (Flavors)
        const savedSauces = shakeSauces.filter(s => 
          initialCustomization.selectedModifiers?.some(m => !m.isBase && !m.isExclusion && (m.id === s.id || m.name === s.name || m.name === getItemName(s)))
        );
        setSelectedSauces(savedSauces);

        // 3. Crunches (Mix-ins)
        const savedCrunches = shakeCrunches.filter(c => 
          initialCustomization.selectedModifiers?.some(m => !m.isBase && !m.isExclusion && (m.id === c.id || m.name === c.name || m.name === getItemName(c)))
        );
        setSelectedCrunches(savedCrunches);

        // 4. Toppings
        const savedToppings = shakeToppings.filter(t => 
          initialCustomization.selectedModifiers?.some(m => !m.isBase && !m.isExclusion && (m.id === t.id || m.name === t.name || m.name === getItemName(t)))
        );
        setSelectedToppings(savedToppings);

        setActiveTab('base');
      } else {
        // ========== NORMAL NEW CUSTOMIZATION MODE ==========
        if (shakeBases.length > 0) {
          if (baseSelectionMode === 'SingleChoice') {
            setSelectedBases([shakeBases[0]]);
          } else {
            setSelectedBases(shakeBases);
          }
        } else {
          setSelectedBases([]);
        }

        setSelectedSauces([]);
        setSelectedCrunches([]);
        setSelectedToppings([]);
        setActiveTab('base');
      }
    }
  }, [isOpen, baseProduct?.id, shakeBases, shakeSauces, shakeCrunches, shakeToppings, baseSelectionMode, initialCustomization]);

  // Toggle or Radio select for Base components
  const toggleBase = (baseItem) => {
    if (baseSelectionMode === 'SingleChoice') {
      setSelectedBases([baseItem]);
      return;
    }
    setSelectedBases(prev => {
      const exists = prev.some(b => b.id === baseItem.id);
      if (exists) {
        return prev.filter(b => b.id !== baseItem.id);
      } else {
        return [...prev, baseItem];
      }
    });
  };

  // Base price from product in POS or fallback to standard 120 EGP
  const initialBasePrice = Number(baseProduct?.sellingPrice) || 120;

  // 3. Combined list of selected additions across Sauces, Crunches, and Toppings
  // Base items are NEVER in extras, so they are always 0 EGP and NEVER consume freeLimit
  const allSelectedAddons = useMemo(() => [
    ...selectedSauces,
    ...selectedCrunches,
    ...selectedToppings
  ], [selectedSauces, selectedCrunches, selectedToppings]);

  // 4. Smart Free-Allowance Distributor with separate quotas for Sauces/Flavors and Extras (Mix-ins + Toppings)
  const processedAddonsMap = useMemo(() => {
    const map = {};

    // 1. Sauces & Flavors Quota
    const sortedSauces = [...selectedSauces].sort((a, b) => (b.price || 0) - (a.price || 0));
    const freeSauceIds = new Set(sortedSauces.slice(0, freeSaucesLimit).map(item => item.id));
    selectedSauces.forEach(item => {
      const isFree = freeSauceIds.has(item.id);
      map[item.id] = {
        chargedPrice: isFree ? 0 : (item.price || 0),
        isFree
      };
    });

    // 2. Extras (Crunches + Toppings) Quota
    const nonSauceList = [...selectedCrunches, ...selectedToppings];
    const sortedExtras = [...nonSauceList].sort((a, b) => (b.price || 0) - (a.price || 0));
    const freeExtraIds = new Set(sortedExtras.slice(0, freeExtrasLimit).map(item => item.id));
    nonSauceList.forEach(item => {
      const isFree = freeExtraIds.has(item.id);
      map[item.id] = {
        chargedPrice: isFree ? 0 : (item.price || 0),
        isFree
      };
    });

    return map;
  }, [selectedSauces, selectedCrunches, selectedToppings, freeSaucesLimit, freeExtrasLimit]);

  const freeSaucesCountUsed = Math.min(selectedSauces.length, freeSaucesLimit);
  const freeSaucesRemaining = Math.max(0, freeSaucesLimit - selectedSauces.length);

  const totalExtrasCount = selectedCrunches.length + selectedToppings.length;
  const freeExtrasCountUsed = Math.min(totalExtrasCount, freeExtrasLimit);
  const freeExtrasRemaining = Math.max(0, freeExtrasLimit - totalExtrasCount);

  const freeLimit = freeSaucesLimit + freeExtrasLimit;
  const freeAddonsCountUsed = freeSaucesCountUsed + freeExtrasCountUsed;
  const freeAddonsRemaining = freeSaucesRemaining + freeExtrasRemaining;

  // Calculate live total price (Base components are 0 EGP)
  const totalPrice = useMemo(() => {
    let sum = initialBasePrice;
    allSelectedAddons.forEach(item => {
      const info = processedAddonsMap[item.id];
      sum += info ? info.chargedPrice : (item.price || 0);
    });
    return sum;
  }, [initialBasePrice, allSelectedAddons, processedAddonsMap]);

  if (!isOpen) return null;

  const curr = isEn ? 'EGP' : 'ج.م';

  // Pricing badge helper for addition cards respecting category quota
  const getAddonDisplayPrice = (item, isSelected, category = 'extra') => {
    if (isSelected) {
      const info = processedAddonsMap[item.id];
      if (info?.isFree) {
        return { 
          text: isEn ? 'Free' : 'مجاناً', 
          isFree: true, 
          className: 'text-amber-400 font-bold' 
        };
      }
      return { 
        text: `+${item.price} ${curr}`, 
        isFree: false, 
        className: 'text-brand-red font-bold' 
      };
    }

    // Not selected yet: check if this category has remaining free quota
    const hasQuotaRemaining = category === 'sauce' ? freeSaucesRemaining > 0 : freeExtrasRemaining > 0;
    if (hasQuotaRemaining) {
      return { 
        text: isEn ? 'Free' : 'مجاناً', 
        isFree: true, 
        className: 'text-amber-400 font-bold' 
      };
    }
    return { 
      text: item.price > 0 ? `+${item.price} ${curr}` : (isEn ? 'Free' : 'مجاناً'), 
      isFree: item.price === 0, 
      className: item.price > 0 ? 'text-brand-red font-bold' : 'text-amber-400 font-bold' 
    };
  };

  // Toggle Sauce
  const toggleSauce = (sauce) => {
    setSelectedSauces(prev => 
      prev.some(s => s.id === sauce.id) 
        ? prev.filter(s => s.id !== sauce.id)
        : [...prev, sauce]
    );
  };

  // Toggle Crunch
  const toggleCrunch = (crunch) => {
    setSelectedCrunches(prev => 
      prev.some(c => c.id === crunch.id) 
        ? prev.filter(c => c.id !== crunch.id)
        : [...prev, crunch]
    );
  };

  // Toggle Topping
  const toggleTopping = (topping) => {
    setSelectedToppings(prev => 
      prev.some(t => t.id === topping.id) 
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  // Reset to default
  const handleReset = () => {
    if (baseSelectionMode === 'SingleChoice' && shakeBases.length > 0) {
      setSelectedBases([shakeBases[0]]);
    } else {
      setSelectedBases(shakeBases);
    }
    setSelectedSauces([]);
    setSelectedCrunches([]);
    setSelectedToppings([]);
    setActiveTab('base');
  };

  // Find which base ingredients were explicitly excluded by user
  const excludedBases = shakeBases.filter(b => !selectedBases.some(s => s.id === b.id));

  // Add customized item to cart
  const handleAddToCart = () => {
    const baseModifiers = selectedBases.map(b => ({
      id: `base_${b.id}`,
      name: getItemName(b),
      nameEn: b.nameEn || b.name,
      price: 0,
      isBase: true
    }));

    const extraModifiers = allSelectedAddons.map(mod => {
      const info = processedAddonsMap[mod.id];
      const isFree = Boolean(info?.isFree);
      return {
        id: mod.id,
        name: getItemName(mod),
        nameEn: mod.nameEn || mod.name,
        price: isFree ? 0 : (mod.price || 0),
        originalPrice: mod.price || 0,
        isFree,
        group: isFree ? 'Free' : 'Paid'
      };
    });

    const modifiersList = [...baseModifiers, ...extraModifiers];

    if (excludedBases.length > 0) {
      const exclusionNote = isEn
        ? `[Without: ${excludedBases.map(b => b.nameEn || b.name).join(', ')}]`
        : `[بدون: ${excludedBases.map(b => b.name).join('، ')}]`;
      modifiersList.push({
        id: 'base_exclusions',
        name: exclusionNote,
        nameEn: exclusionNote,
        price: 0,
        isExclusion: true
      });
    }

    const customizedProduct = {
      ...(baseProduct || {}),
      id: baseProduct?.id || 9999,
      name: isEn ? (baseProduct?.nameEn || 'Artisanal Custom Shake') : (baseProduct?.name || 'اصنع مشروبك بنفسك'),
      nameEn: baseProduct?.nameEn || 'Artisanal Custom Shake',
      sellingPrice: totalPrice,
      calculatedPrice: totalPrice,
      selectedModifiers: modifiersList,
      finalModifiersPrice: totalPrice - initialBasePrice,
      isCustomShake: true
    };

    if (onSaveEdit) {
      onSaveEdit(customizedProduct);
      setIsSuccessShake(true);
      setTimeout(() => {
        setIsSuccessShake(false);
        onClose();
      }, 500);
      return;
    }

    addToCart(customizedProduct, 1);
    setIsSuccessShake(true);
    setTimeout(() => {
      setIsSuccessShake(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn" dir={isEn ? 'ltr' : 'rtl'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#0f0f13] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black-primary/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center border border-brand-red/30 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-text-light">
                  {isEn ? (baseProduct?.nameEn || baseProduct?.name || 'Artisanal Shake Studio') : (baseProduct?.name || baseProduct?.nameEn || 'مختبر الميلك شيك المخصص')}
                </h2>
                {initialCustomization && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ✏️ {isEn ? 'Edit Mode' : 'تعديل الصنف'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors text-xs flex items-center gap-1.5"
              title={isEn ? 'Reset to default' : 'إعادة ضبط للافتراضي'}
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">{isEn ? 'Reset' : 'إعادة ضبط'}</span>
            </button>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 text-text-muted hover:text-text-light hover:bg-brand-red flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Column Clean Layout */}
        <div className="flex flex-col md:flex-row flex-grow overflow-y-auto">
          
          {/* ===================== LEFT: ARTISANAL RECIPE BOARD ===================== */}
          <div className="w-full md:w-5/12 bg-[#0B0B0E] p-4 sm:p-6 border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-white/10 flex flex-col justify-between shrink-0">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-red"></span>
                  {isEn ? 'Your Custom Recipe' : 'بطاقة وصفتك المخصصة'}
                </span>
                <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                  {selectedBases.length + allSelectedAddons.length} {isEn ? 'Items' : 'مكونات'}
                </span>
              </div>

              {/* Free Modifiers Notification Ribbon */}
              {freeLimit > 0 && (
                <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-black-primary border border-emerald-500/30 flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Gift size={15} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-emerald-400">
                        {isEn ? `Free Extras: ${freeAddonsCountUsed}/${freeLimit} used` : `إضافات مجانية: ${freeAddonsCountUsed} من ${freeLimit} مستهلكة`}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {freeAddonsRemaining > 0 
                          ? (isEn ? `${freeAddonsRemaining} free addition(s) left` : `متبقي لك ${freeAddonsRemaining} إضافة مجانية`)
                          : (isEn ? 'Limit reached - extra additions charged' : 'تم استهلاك الحد المجاني - الإضافات القادمة بسعرها')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Base Components Showcase Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
                <div className="text-[11px] font-bold text-emerald-400 uppercase mb-2 flex items-center justify-between">
                  <span>{isEn ? 'Core Ingredients (Included Free):' : 'المكونات الأساسية (مشمولة مجاناً):'}</span>
                  <span className="text-[10px] text-text-muted">{selectedBases.length}/{shakeBases.length}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedBases.map(b => (
                    <span key={b.id} className="text-[11px] font-semibold bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Check size={11} className="text-emerald-400" />
                      {getItemName(b)}
                    </span>
                  ))}
                  {selectedBases.length === 0 && (
                    <span className="text-xs text-text-muted italic">{isEn ? 'All base ingredients excluded' : 'تم استبعاد جميع المكونات الأساسية'}</span>
                  )}
                </div>

                {/* Excluded Base Items */}
                {excludedBases.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[10px] font-bold text-red-400 mb-1">
                      {isEn ? 'Excluded Ingredients:' : 'مكونات تم استبعادها (بدون):'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {excludedBases.map(b => (
                        <span key={b.id} className="text-[10px] font-semibold bg-red-950/40 border border-red-500/30 text-red-300 px-2 py-0.5 rounded-lg flex items-center gap-1 line-through">
                          <X size={10} />
                          {getItemName(b)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Additions List */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase mb-1">
                  <span>{isEn ? 'Extra Sauces & Toppings:' : 'الصوصات والتوبينج المختار:'}</span>
                  <span className="text-brand-red">{allSelectedAddons.length}</span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedSauces.map(s => {
                    const priceInfo = getAddonDisplayPrice(s, true);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color || '#E63946' }}></span>
                          <span className="text-white truncate">{getItemName(s)}</span>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${priceInfo.className}`}>{priceInfo.text}</span>
                      </div>
                    );
                  })}
                  {selectedCrunches.map(c => {
                    const priceInfo = getAddonDisplayPrice(c, true);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                          <span className="text-white truncate">{getItemName(c)}</span>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${priceInfo.className}`}>{priceInfo.text}</span>
                      </div>
                    );
                  })}
                  {selectedToppings.map(t => {
                    const priceInfo = getAddonDisplayPrice(t, true);
                    return (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                          <span className="text-white truncate">{getItemName(t)}</span>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${priceInfo.className}`}>{priceInfo.text}</span>
                      </div>
                    );
                  })}
                  {allSelectedAddons.length === 0 && (
                    <div className="p-3 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted">
                      {isEn ? 'No extra sauces or toppings added' : 'لم تختر صوصات أو توبينج إضافي'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Live Price Summary */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>{isEn ? 'Base Item (Includes Base):' : 'المشروب الأساسي (شامل المكونات الأساسية):'}</span>
                <span className="font-bold text-white">{initialBasePrice} {curr}</span>
              </div>
              {totalPrice > initialBasePrice && (
                <div className="flex items-center justify-between text-xs text-brand-red mb-2">
                  <span>{isEn ? 'Extra Additions:' : 'الإضافات الإضافية:'}</span>
                  <span className="font-bold">+{totalPrice - initialBasePrice} {curr}</span>
                </div>
              )}
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Segmented Step Tabs (Responsive Flex - NO TRUNCATION!) */}
              <div className="flex items-stretch gap-1 sm:gap-2 mb-6 bg-black-primary/70 p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                {[
                  { id: 'base', label: isEn ? '1. Base' : '1. الأساسي', count: selectedBases.length },
                  { id: 'sauces', label: isEn ? '2. Flavors' : '2. النكهات', count: selectedSauces.length },
                  { id: 'crunch', label: isEn ? '3. Mix-ins' : '3. المقرمشات', count: selectedCrunches.length },
                  { id: 'toppings', label: isEn ? '4. Topping' : '4. التوبينج', count: selectedToppings.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[85px] sm:min-w-0 py-2.5 px-1.5 text-center rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-brand-red to-red-600 text-white shadow-lg shadow-brand-red/30'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="whitespace-nowrap">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${
                        activeTab === tab.id ? 'bg-black/35 text-white' : 'bg-brand-red/20 text-brand-red'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ================= TAB 1: BASE INGREDIENTS (Included Free by default - Toggle On/Off) ================= */}
              {activeTab === 'base' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 mb-2">
                    <span className="text-xs text-emerald-300 font-bold block">
                      {baseSelectionMode === 'SingleChoice'
                        ? (isEn ? '🍦 Choose your primary ice cream base flavor (Single Choice - 0 EGP):' : '🍦 اختر نكهة الآيس كريم الأساسية للميلك شيك (اختيار أساسي واحد مجاناً):')
                        : (isEn ? '✨ Core ingredients are included free (0 EGP) — Tap any item to remove it (Without) if you prefer.' : '✨ المكونات الأساسية مضافة تلقائياً ومجانية (0 ج.م) — اضغط على أي مكون لاستبعاده (بدون) إذا كنت لا ترغب به.')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {shakeBases.map((b) => {
                      const isIncluded = selectedBases.some(item => item.id === b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => toggleBase(b)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isIncluded
                              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-red-950/15 border-red-500/30 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {b.iconPath ? (
                              <img src={b.iconPath} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: b.color || '#E63946' }}>
                                <Sparkles size={18} className="text-white" />
                              </div>
                            )}
                            <div>
                              <div className={`font-bold text-sm ${isIncluded ? 'text-text-light' : 'text-text-muted line-through'}`}>
                                {getItemName(b)}
                              </div>
                              <div className="text-[11px] text-text-muted">
                                {isIncluded 
                                  ? (isEn ? 'Included (Tap to remove)' : 'متضمن (انقر للاستبعاد)')
                                  : (isEn ? 'Excluded (Tap to re-add)' : 'مستبعد بدون (انقر للإعادة)')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-bold ${isIncluded ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isIncluded ? (isEn ? 'Included Free' : 'أساسي مجاني') : (isEn ? 'Excluded' : 'بدون')}
                            </span>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isIncluded 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                                : 'border-red-500/40 bg-red-950/30 text-red-400'
                            }`}>
                              {isIncluded ? <Check size={14} /> : <X size={14} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ================= TAB 2: SAUCES ================= */}
              {activeTab === 'sauces' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {freeSaucesLimit > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-3">
                      <Gift size={16} className="shrink-0 text-amber-400" />
                      <span>
                        {isEn 
                          ? `Free Flavors Allowance: ${freeSaucesCountUsed} of ${freeSaucesLimit} selected (${freeSaucesRemaining} free remaining)`
                          : `النكهات والصوصات المجانية: تم اختيار ${freeSaucesCountUsed} من ${freeSaucesLimit} (متبقي ${freeSaucesRemaining} مجاناً)`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose gourmet liquid sauces (Optional):' : 'اختر الصوصات السائلة الفاخرة (اختياري):'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">
                      {selectedSauces.length} {isEn ? 'selected' : 'محددة'}
                    </span>
                  </div>
                  {shakeSauces.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">
                        {isEn ? 'No sauces added yet' : 'لم يتم إضافة صوصات بعد'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {isEn ? 'Add sauces from POS Add-ons and set role to "2. Sauce"' : 'أضف صوصاً من شاشة "إدارة الإضافات" في POS واختر قسم "2. الصوصات (Sauce)"'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shakeSauces.map((s) => {
                        const isSelected = selectedSauces.some(item => item.id === s.id);
                        const priceInfo = getAddonDisplayPrice(s, isSelected, 'sauce');
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleSauce(s)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              {s.iconPath ? (
                                <img src={s.iconPath} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full shadow-md shrink-0" style={{ backgroundColor: s.color || '#E63946' }} />
                              )}
                              <span className="font-bold text-sm text-text-light truncate">{getItemName(s)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs ${priceInfo.className}`}>{priceInfo.text}</span>
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-white/20'}`}>
                                {isSelected && <Check size={13} />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ================= TAB 3: CRUNCH & FILLINGS ================= */}
              {activeTab === 'crunch' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {freeExtrasLimit > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-3">
                      <Gift size={16} className="shrink-0 text-amber-400" />
                      <span>
                        {isEn 
                          ? `Free Extras Allowance: ${freeExtrasCountUsed} of ${freeExtrasLimit} selected (${freeExtrasRemaining} free remaining)`
                          : `الإضافات المجانية (مقرمشات وتوبينج): تم اختيار ${freeExtrasCountUsed} من ${freeExtrasLimit} (متبقي ${freeExtrasRemaining} مجاناً)`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Add delicious crunches and mix-ins inside the shake:' : 'أضف القرمشة والحشوات اللذيذة داخل المشروب:'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">
                      {selectedCrunches.length} {isEn ? 'selected' : 'محددة'}
                    </span>
                  </div>
                  {shakeCrunches.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">
                        {isEn ? 'No crunches added yet' : 'لم يتم إضافة مقرمشات بعد'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {isEn ? 'Add crunches from POS Add-ons and set role to "3. Crunch"' : 'أضف مقرمشات من شاشة "إدارة الإضافات" في POS واختر قسم "3. المقرمشات (Crunch)"'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shakeCrunches.map((c) => {
                        const isSelected = selectedCrunches.some(item => item.id === c.id);
                        const priceInfo = getAddonDisplayPrice(c, isSelected, 'extra');
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCrunch(c)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {c.iconPath && <img src={c.iconPath} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                            <span className="font-bold text-sm text-text-light truncate">{getItemName(c)}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs ${priceInfo.className}`}>{priceInfo.text}</span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-white/20'}`}>
                              {isSelected && <Check size={13} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </motion.div>
              )}

              {/* ================= TAB 4: TOPPINGS & CROWN ================= */}
              {activeTab === 'toppings' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {freeExtrasLimit > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-3">
                      <Gift size={16} className="shrink-0 text-amber-400" />
                      <span>
                        {isEn 
                          ? `Free Extras Allowance: ${freeExtrasCountUsed} of ${freeExtrasLimit} selected (${freeExtrasRemaining} free remaining)`
                          : `الإضافات المجانية (مقرمشات وتوبينج): تم اختيار ${freeExtrasCountUsed} من ${freeExtrasLimit} (متبقي ${freeExtrasRemaining} مجاناً)`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Crown your shake: Whipped cream, cookies and cherries on top:' : 'تتويج المشروب: الكريمة والبسكويت والكرز على القمة:'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">
                      {selectedToppings.length} {isEn ? 'selected' : 'محددة'}
                    </span>
                  </div>
                  {shakeToppings.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">
                        {isEn ? 'No toppings added yet' : 'لم يتم إضافة عناصر توبينج بعد'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {isEn ? 'Add toppings from POS Add-ons and set role to "4. Topping"' : 'أضف توبينج من شاشة "إدارة الإضافات" في POS واختر قسم "4. التوبينج (Topping)"'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shakeToppings.map((t) => {
                        const isSelected = selectedToppings.some(item => item.id === t.id);
                        const priceInfo = getAddonDisplayPrice(t, isSelected, 'extra');
                        return (
                          <div
                            key={t.id}
                            onClick={() => toggleTopping(t)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {t.iconPath && <img src={t.iconPath} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                            <span className="font-bold text-sm text-text-light truncate">{getItemName(t)}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs ${priceInfo.className}`}>{priceInfo.text}</span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-white/20'}`}>
                              {isSelected && <Check size={13} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </motion.div>
              )}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-text-muted block">
                  {isEn ? 'Total Customized Price:' : 'السعر الإجمالي المخصص:'}
                </span>
                <span className="text-2xl font-black text-white">
                  {totalPrice} <span className="text-sm font-bold text-brand-red">{curr}</span>
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 max-w-[260px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-red to-red-600 hover:from-red-600 hover:to-brand-red text-white font-black text-sm shadow-xl shadow-brand-red/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                {isSuccessShake ? (
                  <>
                    <Check size={18} className="text-green-300" />
                    <span>{onSaveEdit ? (isEn ? 'Saved Changes!' : 'تم حفظ التعديلات!') : (isEn ? 'Added to Cart!' : 'تمت الإضافة للسلة!')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>{onSaveEdit ? (isEn ? 'Save Changes' : 'حفظ التعديلات في السلة') : (isEn ? 'Add Drink to Order' : 'إضافة المشروب للطلب')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
