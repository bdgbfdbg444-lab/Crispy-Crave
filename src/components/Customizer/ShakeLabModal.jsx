import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, ShoppingBag, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

export default function ShakeLabModal({ isOpen, onClose, baseProduct, menuData }) {
  const { lang } = useLanguage();
  const { addToCart } = useCart();

  // Extract purely dynamic Add-Ons coming from POS / Firebase
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
        // Items with role 'none' or uncategorized are general food add-ons and will NOT appear here!
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

  // Calculate live total price
  const totalPrice = useMemo(() => {
    let sum = initialBasePrice;
    if (selectedBase) {
      sum += selectedBase.price || 0;
    }
    selectedSauces.forEach(s => sum += s.price || 0);
    selectedCrunches.forEach(c => sum += c.price || 0);
    selectedToppings.forEach(t => sum += t.price || 0);
    return sum;
  }, [initialBasePrice, selectedBase, selectedSauces, selectedCrunches, selectedToppings]);

  if (!isOpen) return null;

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
      ...(selectedBase ? [{ id: `base_${selectedBase.id}`, name: `قاعدة: ${selectedBase.name}`, nameEn: `Base: ${selectedBase.nameEn || selectedBase.name}`, price: selectedBase.price || 0 }] : []),
      ...selectedSauces.map(s => ({ id: s.id, name: s.name, nameEn: s.nameEn || s.name, price: s.price || 0 })),
      ...selectedCrunches.map(c => ({ id: c.id, name: c.name, nameEn: c.nameEn || c.name, price: c.price || 0 })),
      ...selectedToppings.map(t => ({ id: t.id, name: t.name, nameEn: t.nameEn || t.name, price: t.price || 0 }))
    ];

    const customizedProduct = {
      ...(baseProduct || {}),
      id: baseProduct?.id || 9999,
      name: lang === 'en' ? (baseProduct?.nameEn || 'Artisanal Custom Shake') : (baseProduct?.name || 'اصنع مشروبك بنفسك'),
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

  const allSelectedAddons = [
    ...selectedSauces,
    ...selectedCrunches,
    ...selectedToppings
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
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
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-2 py-0.5 rounded">
                  THE BLACK BOX
                </span>
                <span className="text-xs text-text-muted">| استوديو التخصيص الحصري</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-text-light">
                {baseProduct?.name || (lang === 'en' ? 'Build Your Milkshake' : 'اصنع مشروبك بنفسك')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors text-xs flex items-center gap-1.5"
              title="إعادة ضبط"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">إعادة ضبط</span>
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
          <div className="w-full md:w-5/12 bg-[#0B0B0E] p-4 sm:p-6 border-b md:border-b-0 md:border-l border-white/10 flex flex-col justify-between shrink-0">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-red"></span>
                  بطاقة وصفتك المخصصة
                </span>
                <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                  {(selectedBase ? 1 : 0) + allSelectedAddons.length} مكونات
                </span>
              </div>

              {/* Selected Base Showcase Card */}
              {selectedBase ? (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 flex items-center gap-3">
                  {selectedBase.iconPath ? (
                    <img 
                      src={selectedBase.iconPath} 
                      alt={selectedBase.name} 
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
                    <div className="text-[11px] font-bold text-brand-red uppercase">القاعدة المختارة</div>
                    <div className="font-bold text-sm text-white truncate">{selectedBase.name}</div>
                    <div className="text-xs text-text-muted">{selectedBase.price > 0 ? `+${selectedBase.price} ج.م` : 'مشمولة في السعر الأساسي'}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted mb-4">
                  لم يتم اختيار قاعدة آيس كريم بعد
                </div>
              )}

              {/* Selected Additions List */}
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-bold text-text-muted uppercase mb-1">الإضافات والصوصات النشطة:</div>
                {allSelectedAddons.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted">
                    لم تختر إضافات بعد، اختر الصوصات أو المقرمشات التي تريدها
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {allSelectedAddons.map((item) => (
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
                          <span className="text-white font-medium truncate">{item.name}</span>
                        </div>
                        <span className="text-brand-red font-bold shrink-0">+{item.price} ج.م</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Barista Tasting Note */}
            <div className="p-3 rounded-xl bg-brand-red/5 border border-brand-red/20 text-[11px] text-text-muted leading-relaxed">
              <span className="text-brand-red font-bold block mb-0.5">ملاحظة باريستا THE BLACK BOX:</span>
              يتم تحضير المشروب طازجاً من الآيس كريم الفاخر مع الصوصات الأصلية والتتويج فور استلام طلبك.
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN LUXURY STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            
            <div>
              {/* SEGMENTED NAVIGATION TABS */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-6 bg-black-primary/70 p-1.5 rounded-2xl border border-white/10">
                {[
                  { id: 'base', label: 'القاعدة', count: selectedBase ? 1 : 0 },
                  { id: 'sauces', label: 'الصوصات', count: selectedSauces.length },
                  { id: 'crunch', label: 'المقرمشات', count: selectedCrunches.length },
                  { id: 'toppings', label: 'التوبينج', count: selectedToppings.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-brand-red to-red-600 text-white shadow-lg shadow-brand-red/30'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
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

              {/* ================= TAB 1: BASE ICE CREAM FLAVORS ================= */}
              {activeTab === 'base' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">اختر طعم وقاعدة الآيسكريم المفضلة (إجباري):</span>
                  </div>
                  {shakeBases.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">لم يتم إضافة قواعد آيس كريم بعد</p>
                      <p className="text-xs text-text-muted">أضف قاعدة من شاشة "إدارة الإضافات" في POS واختر قسم "1. القاعدة (Base)"</p>
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
                                <div className="font-bold text-sm text-text-light truncate">{b.name}</div>
                                {b.nameEn && <div className="text-[11px] text-text-muted line-clamp-1">{b.nameEn}</div>}
                              </div>
                            </div>
                            <div className="text-right shrink-0 mr-2">
                              <span className="text-xs font-bold text-brand-red">{b.price > 0 ? `+${b.price} ج.م` : 'مشمول'}</span>
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
                    <span className="text-xs text-text-muted font-bold">اختر الصوصات السائلة الفاخرة (اختياري):</span>
                    <span className="text-xs text-brand-red font-bold">{selectedSauces.length} محددة</span>
                  </div>
                  {shakeSauces.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">لم يتم إضافة صوصات بعد</p>
                      <p className="text-xs text-text-muted">أضف صوصاً من شاشة "إدارة الإضافات" في POS واختر قسم "2. الصوصات (Sauce)"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shakeSauces.map((s) => {
                        const isSelected = selectedSauces.some(item => item.id === s.id);
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
                              <span className="font-bold text-sm text-text-light truncate">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mr-2">
                              <span className="text-xs font-bold text-brand-red">{s.price > 0 ? `+${s.price} ج.م` : 'مجاناً'}</span>
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
                    <span className="text-xs text-text-muted font-bold">أضف القرمشة والحشوات اللذيذة داخل المشروب:</span>
                    <span className="text-xs text-brand-red font-bold">{selectedCrunches.length} محددة</span>
                  </div>
                  {shakeCrunches.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">لم يتم إضافة مقرمشات بعد</p>
                      <p className="text-xs text-text-muted">أضف مقرمشات من شاشة "إدارة الإضافات" في POS واختر قسم "3. المقرمشات (Crunch)"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shakeCrunches.map((c) => {
                        const isSelected = selectedCrunches.some(item => item.id === c.id);
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
                              <span className="font-bold text-sm text-text-light truncate">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mr-2">
                              <span className="text-xs font-bold text-brand-red">{c.price > 0 ? `+${c.price} ج.م` : 'مجاناً'}</span>
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
                    <span className="text-xs text-text-muted font-bold">تتويج المشروب: الكريمة والبسكويت والكرز على القمة:</span>
                    <span className="text-xs text-brand-red font-bold">{selectedToppings.length} محددة</span>
                  </div>
                  {shakeToppings.length === 0 ? (
                    <div className="py-12 text-center text-text-muted bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-6">
                      <Sparkles size={24} className="text-brand-red opacity-60 mx-auto mb-2" />
                      <p className="font-bold text-sm text-text-light mb-1">لم يتم إضافة عناصر توبينج بعد</p>
                      <p className="text-xs text-text-muted">أضف توبينج من شاشة "إدارة الإضافات" في POS واختر قسم "4. التوبينج (Topping)"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shakeToppings.map((t) => {
                        const isSelected = selectedToppings.some(item => item.id === t.id);
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
                              <span className="font-bold text-sm text-text-light truncate">{t.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mr-2">
                              <span className="text-xs font-bold text-brand-red">{t.price > 0 ? `+${t.price} ج.م` : 'مجاناً'}</span>
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
                <span className="text-[11px] text-text-muted block">السعر الإجمالي المخصص:</span>
                <span className="text-2xl font-black text-white">
                  {totalPrice} <span className="text-sm font-bold text-brand-red">ج.م</span>
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
                    <span>تمت الإضافة للسلة!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>إضافة المشروب للطلب</span>
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
