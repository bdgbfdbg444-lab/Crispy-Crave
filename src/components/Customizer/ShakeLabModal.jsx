import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, ShoppingBag, Gift } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

export default function ShakeLabModal({ isOpen, onClose, baseProduct, menuData }) {
  const { lang } = useLanguage();
  const { addToCart } = useCart();
  const isEn = lang === 'en';

  // Helper to pick the proper localized name
  const getItemName = (item) => {
    if (!item) return '';
    return isEn ? (item.nameEn || item.name) : (item.name || item.nameEn);
  };

  // 1. Free Modifiers Limit defined from POS for this product (e.g. 3 free additions)
  const freeLimit = Number(baseProduct?.freeModifiersLimit ?? baseProduct?.FreeModifiersLimit ?? 0);

  // 2. Extract purely dynamic Add-Ons coming from POS / Firebase
  const { shakeBases, shakeSauces, shakeCrunches, shakeToppings } = useMemo(() => {
    const pId = baseProduct?.id?.toString();
    const allAddons = menuData?.AddOns || menuData?.addOns || [];
    
    // Filter addons linked to this product (or all if not restricted)
    const posAddOns = allAddons.filter(a => {
      if (!a.linkedProductIds || a.linkedProductIds.trim() === '') return true;
      const ids = a.linkedProductIds.split(',').map(s => s.trim());
      return ids.includes(pId);
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
          price: Number(a.price) || 0,
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
      shakeBases: bases,
      shakeSauces: sauces,
      shakeCrunches: crunches,
      shakeToppings: toppings
    };
  }, [baseProduct, menuData]);

  // Selected Customization State
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedSauces, setSelectedSauces] = useState([]);
  const [selectedCrunches, setSelectedCrunches] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [activeTab, setActiveTab] = useState('base'); // 'base' | 'sauces' | 'crunch' | 'toppings'
  const [isSuccessShake, setIsSuccessShake] = useState(false);

  // Automatically select the first available base if none selected
  useEffect(() => {
    if (shakeBases.length > 0) {
      if (!selectedBase || !shakeBases.some(b => b.id === selectedBase.id)) {
        setSelectedBase(shakeBases[0]);
      }
    } else {
      setSelectedBase(null);
    }
  }, [shakeBases]);

  // Base price from product in POS or fallback to standard 120 EGP
  const initialBasePrice = Number(baseProduct?.sellingPrice) || 120;

  // 3. Combined list of selected additions across Sauces, Crunches, and Toppings
  const allSelectedAddons = useMemo(() => [
    ...selectedSauces,
    ...selectedCrunches,
    ...selectedToppings
  ], [selectedSauces, selectedCrunches, selectedToppings]);

  // 4. Smart Free-Allowance Distributor:
  // If freeLimit > 0, the top `freeLimit` items (by value) are 100% FREE (0 EGP)
  // Any extra items beyond `freeLimit` are charged at regular price
  const processedAddonsMap = useMemo(() => {
    const map = {};
    if (freeLimit <= 0) {
      allSelectedAddons.forEach(item => {
        map[item.id] = { chargedPrice: item.price || 0, isFree: false };
      });
      return map;
    }

    // Sort a copy descending by price so the customer gets maximum savings
    const sorted = [...allSelectedAddons].sort((a, b) => (b.price || 0) - (a.price || 0));
    const freeItemIds = new Set(sorted.slice(0, freeLimit).map(item => item.id));

    allSelectedAddons.forEach(item => {
      const isFree = freeItemIds.has(item.id);
      map[item.id] = {
        chargedPrice: isFree ? 0 : (item.price || 0),
        isFree
      };
    });

    return map;
  }, [allSelectedAddons, freeLimit]);

  const freeAddonsCountUsed = Math.min(allSelectedAddons.length, freeLimit);
  const freeAddonsRemaining = Math.max(0, freeLimit - allSelectedAddons.length);

  // Calculate live total price
  const totalPrice = useMemo(() => {
    let sum = initialBasePrice;
    if (selectedBase) {
      sum += selectedBase.price || 0;
    }
    allSelectedAddons.forEach(item => {
      const info = processedAddonsMap[item.id];
      sum += info ? info.chargedPrice : (item.price || 0);
    });
    return sum;
  }, [initialBasePrice, selectedBase, allSelectedAddons, processedAddonsMap]);

  if (!isOpen) return null;

  const curr = isEn ? 'EGP' : 'ج.م';

  // Pricing badge helper for addition cards
  const getAddonDisplayPrice = (item, isSelected) => {
    if (isSelected) {
      const info = processedAddonsMap[item.id];
      if (info?.isFree) {
        return { 
          text: isEn ? 'Free (Gift)' : 'مجاناً (هدية)', 
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

    // Not selected yet
    if (freeLimit > 0 && allSelectedAddons.length < freeLimit) {
      return { 
        text: isEn ? 'Included Free' : 'مشمول مجاناً', 
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
    setSelectedBase(shakeBases[0] || null);
    setSelectedSauces([]);
    setSelectedCrunches([]);
    setSelectedToppings([]);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    const modifiersList = [
      ...(selectedBase ? [{ 
        id: `base_${selectedBase.id}`, 
        name: isEn ? `Base: ${selectedBase.nameEn || selectedBase.name}` : `قاعدة: ${selectedBase.name || selectedBase.nameEn}`, 
        nameEn: `Base: ${selectedBase.nameEn || selectedBase.name}`, 
        price: selectedBase.price || 0,
        isFree: false
      }] : []),
      ...allSelectedAddons.map(mod => {
        const info = processedAddonsMap[mod.id];
        const isFree = Boolean(info?.isFree);
        return {
          id: mod.id,
          name: isEn ? (mod.nameEn || mod.name) : (mod.name || mod.nameEn),
          nameEn: mod.nameEn || mod.name,
          price: isFree ? 0 : (mod.price || 0),
          originalPrice: mod.price || 0,
          isFree,
          group: isFree ? 'Free' : 'Paid'
        };
      })
    ];

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

    addToCart(customizedProduct, 1);
    setIsSuccessShake(true);
    setTimeout(() => {
      setIsSuccessShake(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn" dir={isEn ? 'ltr' : 'rtl'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-4xl bg-[#101014] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black-primary/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center border border-brand-red/30 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-text-light">
                {isEn ? (baseProduct?.nameEn || baseProduct?.name || 'Build Your Milkshake') : (baseProduct?.name || baseProduct?.nameEn || 'اصنع مشروبك بنفسك')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors text-xs flex items-center gap-1.5"
              title={isEn ? 'Reset' : 'إعادة ضبط'}
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
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-red"></span>
                  {isEn ? 'Your Custom Recipe' : 'بطاقة وصفتك المخصصة'}
                </span>
                <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                  {(selectedBase ? 1 : 0) + allSelectedAddons.length} {isEn ? 'Items' : 'مكونات'}
                </span>
              </div>

              {/* Selected Base Showcase Card */}
              {selectedBase ? (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 flex items-center gap-3">
                  {selectedBase.iconPath ? (
                    <img 
                      src={selectedBase.iconPath} 
                      alt={getItemName(selectedBase)} 
                      className="w-14 h-14 rounded-xl object-cover border border-white/15 shadow-md shrink-0" 
                    />
                  ) : (
                    <div 
                      className="w-14 h-14 rounded-xl shadow-inner border border-white/15 flex items-center justify-center shrink-0" 
                      style={{ backgroundColor: selectedBase.color || '#E63946' }}
                    >
                      <Sparkles size={20} className="text-white opacity-80" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-brand-red uppercase">
                      {isEn ? 'SELECTED BASE' : 'القاعدة المختارة'}
                    </div>
                    <div className="font-bold text-sm text-white truncate">
                      {getItemName(selectedBase)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {selectedBase.price > 0 ? `+${selectedBase.price} ${curr}` : (isEn ? 'Included in base price' : 'مشمولة في السعر الأساسي')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted mb-4">
                  {isEn ? 'No ice cream base selected yet' : 'لم يتم اختيار قاعدة آيس كريم بعد'}
                </div>
              )}

              {/* Selected Additions List */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase mb-1">
                  <span>{isEn ? 'Active Additions & Syrups:' : 'الإضافات والصوصات النشطة:'}</span>
                  {freeLimit > 0 && (
                    <span className="text-amber-400 font-bold">
                      {freeAddonsCountUsed} / {freeLimit} {isEn ? 'Free' : 'مجاني'}
                    </span>
                  )}
                </div>
                {allSelectedAddons.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted">
                    {isEn ? 'No additions selected yet. Choose your favorite sauces or mix-ins.' : 'لم تختر إضافات بعد، اختر الصوصات أو المقرمشات التي تريدها'}
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {allSelectedAddons.map((item) => {
                      const info = processedAddonsMap[item.id];
                      const isFree = info?.isFree;
                      return (
                        <div 
                          key={item.id} 
                          className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.iconPath ? (
                              <img src={item.iconPath} alt="" className="w-6 h-6 rounded-lg object-cover border border-white/10 shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: item.color || '#E63946' }} />
                            )}
                            <span className="text-white font-medium truncate">{getItemName(item)}</span>
                          </div>
                          {isFree ? (
                            <span className="text-amber-400 font-bold shrink-0 text-[11px] bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/25">
                              {isEn ? 'Free (Gift)' : 'مجاناً (هدية)'}
                            </span>
                          ) : (
                            <span className="text-brand-red font-bold shrink-0">+{item.price} {curr}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN LUXURY STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            
            <div>
              {/* Dynamic Free Modifiers Banner (When Product has FreeModifiersLimit > 0) */}
              {freeLimit > 0 && (
                <div className="mb-4 p-2.5 sm:p-3 rounded-2xl bg-brand-red/10 border border-brand-red/25 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-brand-red/20 text-brand-red flex items-center justify-center shrink-0 border border-brand-red/30">
                      <Gift size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{isEn ? `${freeLimit} Free Add-ons Included` : `لك ${freeLimit} إضافات مجانية`}</span>
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {freeAddonsRemaining > 0 
                          ? (isEn ? `Choose ${freeAddonsRemaining} more for free` : `اختر ${freeAddonsRemaining} أخرى مجاناً`)
                          : (isEn ? 'All free additions selected ✓' : 'تم اختيار كل المجاني ✓')}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-xl font-bold border transition-all ${
                      freeAddonsRemaining > 0 
                        ? 'bg-brand-red text-white border-brand-red shadow-sm shadow-brand-red/30' 
                        : 'bg-white/10 text-text-light border-white/20'
                    }`}>
                      {freeAddonsRemaining > 0 
                        ? (isEn ? `${freeAddonsRemaining} left` : `متبقي ${freeAddonsRemaining}`) 
                        : (isEn ? 'Done ✓' : 'اكتمل ✓')}
                    </span>
                  </div>
                </div>
              )}

              {/* SEGMENTED NAVIGATION TABS */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-6 bg-black-primary/70 p-1 sm:p-1.5 rounded-2xl border border-white/10">
                {[
                  { id: 'base', label: isEn ? 'Base' : 'القاعدة', count: selectedBase ? 1 : 0 },
                  { id: 'sauces', label: isEn ? 'Sauce' : 'صوصات', count: selectedSauces.length },
                  { id: 'crunch', label: isEn ? 'Crunch' : 'مقرمشات', count: selectedCrunches.length },
                  { id: 'toppings', label: isEn ? 'Topping' : 'توبينج', count: selectedToppings.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-brand-red to-red-600 text-white shadow-lg shadow-brand-red/30'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="whitespace-nowrap leading-none">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`text-[9px] sm:text-[10px] min-w-[15px] h-[15px] sm:w-4 sm:h-4 px-0.5 rounded-full flex items-center justify-center font-black shrink-0 ${
                        activeTab === tab.id ? 'bg-black/40 text-white' : 'bg-brand-red/20 text-brand-red'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ================= TAB 1: BASE ICE CREAM FLAVORS ================= */}
              {activeTab === 'base' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose your favorite ice cream base (Required):' : 'اختر طعم وقاعدة الآيسكريم المفضلة (إجباري):'}
                    </span>
                  </div>
                  {shakeBases.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">
                        {isEn ? 'No ice cream bases added yet' : 'لم يتم إضافة قواعد آيس كريم بعد'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {isEn ? 'Add a base from POS Add-ons and set role to "1. Base"' : 'أضف قاعدة من شاشة "إدارة الإضافات" في POS واختر قسم "1. القاعدة (Base)"'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shakeBases.map((b) => {
                        const isSelected = selectedBase?.id === b.id;
                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBase(b)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md ring-1 ring-brand-red/50'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {b.iconPath ? (
                                <img src={b.iconPath} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow shrink-0" />
                              ) : (
                                <div className="w-11 h-11 rounded-xl shadow-inner border border-white/20 flex items-center justify-center shrink-0" style={{ backgroundColor: b.color || '#E63946' }}>
                                  <Sparkles size={16} className="text-white opacity-80" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-text-light truncate">{getItemName(b)}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 mx-2">
                              <span className="text-xs font-bold text-brand-red">
                                {b.price > 0 ? `+${b.price} ${curr}` : (isEn ? 'Included' : 'مشمول')}
                              </span>
                              {isSelected && <Check size={16} className="text-brand-red ml-auto mt-1" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ================= TAB 2: SAUCES ================= */}
              {activeTab === 'sauces' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose gourmet liquid sauces (Optional):' : 'اختر الصصوصات السائلة الفاخرة (اختياري):'}
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
                        const priceInfo = getAddonDisplayPrice(s, isSelected);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleSauce(s)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md ring-1 ring-brand-red/50'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {s.iconPath ? (
                                <img src={s.iconPath} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow shrink-0" />
                              ) : (
                                <div className="w-11 h-11 rounded-xl shadow-md shrink-0" style={{ backgroundColor: s.color || '#E63946' }} />
                              )}
                              <span className="font-bold text-sm text-text-light truncate">{getItemName(s)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mx-2">
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
                        const priceInfo = getAddonDisplayPrice(c, isSelected);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCrunch(c)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md ring-1 ring-brand-red/50'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {c.iconPath ? (
                                <img src={c.iconPath} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow shrink-0" />
                              ) : (
                                <div className="w-11 h-11 rounded-xl shadow-md flex items-center justify-center bg-white/10 border border-white/10 shrink-0">
                                  <span className="text-amber-400 font-black">✦</span>
                                </div>
                              )}
                              <span className="font-bold text-sm text-text-light truncate">{getItemName(c)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mx-2">
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
                        const priceInfo = getAddonDisplayPrice(t, isSelected);
                        return (
                          <div
                            key={t.id}
                            onClick={() => toggleTopping(t)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md ring-1 ring-brand-red/50'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {t.iconPath ? (
                                <img src={t.iconPath} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow shrink-0" />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                  <span className="text-amber-400 font-black">★</span>
                                </div>
                              )}
                              <span className="font-bold text-sm text-text-light truncate">{getItemName(t)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mx-2">
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
                disabled={shakeBases.length > 0 && !selectedBase}
                className="flex-1 max-w-[260px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-red to-red-600 hover:from-red-600 hover:to-brand-red text-white font-black text-sm shadow-xl shadow-brand-red/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSuccessShake ? (
                  <>
                    <Check size={18} className="text-green-300" />
                    <span>{isEn ? 'Added to Cart!' : 'تمت الإضافة للسلة!'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>{isEn ? 'Add Drink to Order' : 'إضافة المشروب للطلب'}</span>
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
