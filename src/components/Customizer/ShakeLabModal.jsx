import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, Plus, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

// ============================================================================
// GOURMET RECIPE PRESETS (Directly matching restaurant kitchen recipes)
// 1. Base Recipe: Vanilla, Chocolate, Lotus, Pistachio, Strawberry Ice Creams
// 2. Add-ons & Toppings: Chocolate Sauce, Caramel Sauce, Lotus Spread, 
//    Pistachio Spread, Peanut Butter, Strawberry, Cherry Filling, Banana, Oreo, Coffee.
// 3. Crown: Whipped Cream (الوصفة الأساسية), Whole Oreo, Whole Lotus, Royal Cherry.
// ============================================================================

export const DEFAULT_SHAKE_BASES = [
  { 
    id: 'base_vanilla', 
    name: 'آيس كريم فانيليا كلاسيك', 
    nameEn: 'Classic Vanilla Ice Cream', 
    desc: 'الوصفة الأصلية: آيس كريم فانيليا فاخر مع حليب طازج نقي', 
    color: '#FBF6E9', 
    price: 0,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/base_vanilla.webp`
  },
  { 
    id: 'base_chocolate', 
    name: 'آيس كريم شوكولاتة بلجيكية', 
    nameEn: 'Belgian Chocolate Ice Cream', 
    desc: 'كاكاو بلجيكي مركز مع آيس كريم غني وحليب طازج', 
    color: '#3A1E11', 
    price: 15,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/base_chocolate.webp`
  },
  { 
    id: 'base_lotus', 
    name: 'آيس كريم بسكويت اللوتس', 
    nameEn: 'Lotus Biscoff Ice Cream', 
    desc: 'كريمة لوتس أصلية بالكراميل المكرمل مع حليب طازج', 
    color: '#D68A36', 
    price: 20,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/base_lotus.webp`
  },
  { 
    id: 'base_pistachio', 
    name: 'آيس كريم فستق حلبي / بستاشيو', 
    nameEn: 'Sicilian Pistachio Ice Cream', 
    desc: 'بيوريه فستق إيطالي محمص غني بنكهة أصلية فاخرة', 
    color: '#8FB87A', 
    price: 25,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/base_pistachio.webp`
  },
  { 
    id: 'base_strawberry', 
    name: 'آيس كريم فراولة مزارع طبيعية', 
    nameEn: 'Fresh Strawberry Ice Cream', 
    desc: 'بيوريه فراولة مزارع طبيعي ممزوج مع الآيس كريم المنعش', 
    color: '#EB6B8B', 
    price: 15,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/base_strawberry.webp`
  },
];

export const DEFAULT_SHAKE_SAUCES = [
  { 
    id: 'sauce_chocolate', 
    name: 'صوص شوكولاتة داكنة', 
    nameEn: 'Dark Chocolate Sauce', 
    color: '#26130B', 
    price: 20,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/sauce_chocolate.webp`
  },
  { 
    id: 'sauce_caramel', 
    name: 'صوص كراميل دافئ', 
    nameEn: 'Warm Salted Caramel', 
    color: '#B86B1E', 
    price: 20,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/sauce_caramel.webp`
  },
  { 
    id: 'sauce_lotus', 
    name: 'زبدة لوتس أصلية سائلة', 
    nameEn: 'Lotus Biscoff Spread', 
    color: '#C67828', 
    price: 25,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/sauce_lotus.webp`
  },
  { 
    id: 'sauce_pistachio', 
    name: 'زبدة بستاشيو إيطالية', 
    nameEn: 'Sicilian Pistachio Spread', 
    color: '#7A9A5B', 
    price: 30,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/sauce_pistachio.webp`
  },
  { 
    id: 'sauce_peanut', 
    name: 'زبدة فول سوداني كريمية', 
    nameEn: 'Creamy Peanut Butter', 
    color: '#C07E38', 
    price: 20,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/sauce_peanut.webp`
  },
];

export const DEFAULT_SHAKE_CRUNCH = [
  { 
    id: 'crunch_oreo', 
    name: 'بسكويت أوريو مكسر مقرمش', 
    nameEn: 'Crushed Oreo Bits', 
    color: '#1A1A1A', 
    price: 15,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/crunch_oreo.webp`
  },
  { 
    id: 'fill_cherry', 
    name: 'حشوة كرز ياقوتية فاخرة', 
    nameEn: 'Ruby Cherry Filling', 
    color: '#7E0B1E', 
    price: 25,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/fill_cherry.webp`
  },
  { 
    id: 'fill_banana', 
    name: 'قطع موز طازج', 
    nameEn: 'Fresh Banana Chunks', 
    color: '#F7DC78', 
    price: 15,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/fill_banana.webp`
  },
  { 
    id: 'fill_strawberry', 
    name: 'قطع فراولة طبيعية فريش', 
    nameEn: 'Fresh Strawberry Chunks', 
    color: '#D92546', 
    price: 15,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/fill_strawberry.webp`
  },
  { 
    id: 'flavor_coffee', 
    name: 'قهوة / إسبريسو مركزة', 
    nameEn: 'Rich Espresso Coffee', 
    color: '#3A2013', 
    price: 15,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/flavor_coffee.webp`
  },
];

export const DEFAULT_SHAKE_TOPPINGS = [
  { 
    id: 'top_cream', 
    name: 'جبل كريمة مخفوقة فاخرة', 
    nameEn: 'Whipped Cream Mountain', 
    price: 15,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/top_cream.webp`
  },
  { 
    id: 'top_whole_oreo', 
    name: 'بسكويتة أوريو كاملة بالقمة', 
    nameEn: 'Whole Oreo Crown', 
    price: 10,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/top_whole_oreo.webp`
  },
  { 
    id: 'top_royal_cherry', 
    name: 'تتويج كرزة ياقوتية ملكية', 
    nameEn: 'Royal Glazed Cherry', 
    price: 10,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/top_royal_cherry.webp`
  },
  { 
    id: 'top_whole_lotus', 
    name: 'بسكويتة لوتس أصلية كاملة', 
    nameEn: 'Whole Biscoff Biscuit', 
    price: 10,
    iconPath: `${import.meta.env.BASE_URL}images/customizer/top_whole_lotus.webp`
  },
];

export default function ShakeLabModal({ isOpen, onClose, baseProduct, menuData }) {
  const { lang } = useLanguage();
  const { addToCart } = useCart();

  // Dynamic Options Resolution: Matches explicit CustomizerRole set in POS!
  const { shakeBases, shakeSauces, shakeCrunches, shakeToppings } = useMemo(() => {
    const pId = String(baseProduct?.id || '');
    const posAddOns = (menuData?.addOns || []).filter(a => {
      if (!a.linkedProductIds) return false;
      const ids = a.linkedProductIds.split(',').map(s => s.trim());
      return ids.includes(pId);
    });

    const sauces = [];
    const crunches = [];
    const toppings = [];
    const bases = [];

    if (posAddOns && posAddOns.length > 0) {
      posAddOns.forEach(a => {
        const name = a.name.toLowerCase();
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
        } else {
          if (name.includes('صوص') || name.includes('sauce') || name.includes('كراميل') || name.includes('فادج') || name.includes('زبدة')) {
            sauces.push(item);
          } else if (name.includes('أوريو') || name.includes('كرانش') || name.includes('كرز') || name.includes('موز') || name.includes('فراولة') || name.includes('قهوة') || name.includes('إسبريسو')) {
            crunches.push(item);
          } else if (name.includes('كريمة') || name.includes('توبينج') || name.includes('قمة') || name.includes('تتويج')) {
            toppings.push(item);
          } else if (name.includes('قاعدة') || name.includes('آيس كريم')) {
            bases.push(item);
          } else {
            crunches.push(item);
          }
        }
      });
    }

    // Start with the full 19 gourmet items from restaurant recipe sheets
    const finalBases = [...DEFAULT_SHAKE_BASES];
    const finalSauces = [...DEFAULT_SHAKE_SAUCES];
    const finalCrunches = [...DEFAULT_SHAKE_CRUNCH];
    const finalToppings = [...DEFAULT_SHAKE_TOPPINGS];

    // Merge any additional custom POS add-ons (avoiding duplicates)
    bases.forEach(b => {
      if (!finalBases.some(fb => fb.name.toLowerCase() === b.name.toLowerCase())) {
        finalBases.push(b);
      }
    });
    sauces.forEach(s => {
      if (!finalSauces.some(fs => fs.name.toLowerCase() === s.name.toLowerCase())) {
        finalSauces.push(s);
      }
    });
    crunches.forEach(c => {
      if (!finalCrunches.some(fc => fc.name.toLowerCase() === c.name.toLowerCase())) {
        finalCrunches.push(c);
      }
    });
    toppings.forEach(t => {
      if (!finalToppings.some(ft => ft.name.toLowerCase() === t.name.toLowerCase())) {
        finalToppings.push(t);
      }
    });

    return {
      shakeBases: finalBases,
      shakeSauces: finalSauces,
      shakeCrunches: finalCrunches,
      shakeToppings: finalToppings
    };
  }, [baseProduct, menuData]);

  // Selected Customization State
  const [selectedBase, setSelectedBase] = useState(DEFAULT_SHAKE_BASES[0]);
  const [selectedSauces, setSelectedSauces] = useState([DEFAULT_SHAKE_SAUCES[0]]);
  const [selectedCrunches, setSelectedCrunches] = useState([DEFAULT_SHAKE_CRUNCH[0]]);
  const [selectedToppings, setSelectedToppings] = useState([DEFAULT_SHAKE_TOPPINGS[0]]); // Default includes Whipped Cream!
  const [activeTab, setActiveTab] = useState('base'); // 'base' | 'sauces' | 'crunch' | 'toppings'
  const [isSuccessShake, setIsSuccessShake] = useState(false);

  // Base price from product in POS or fallback to standard 120 EGP
  const initialBasePrice = Number(baseProduct?.sellingPrice) || 120;

  // Calculate live total price
  const totalPrice = useMemo(() => {
    let sum = initialBasePrice;
    sum += selectedBase.price || 0;
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
    setSelectedBase(shakeBases[0] || DEFAULT_SHAKE_BASES[0]);
    setSelectedSauces([]);
    setSelectedCrunches([]);
    setSelectedToppings([DEFAULT_SHAKE_TOPPINGS[0]]);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    const modifiersList = [
      { id: `base_${selectedBase.id}`, name: `قاعدة: ${selectedBase.name}`, nameEn: `Base: ${selectedBase.nameEn || selectedBase.name}`, price: selectedBase.price },
      ...selectedSauces.map(s => ({ id: s.id, name: s.name, nameEn: s.nameEn || s.name, price: s.price })),
      ...selectedCrunches.map(c => ({ id: c.id, name: c.name, nameEn: c.nameEn || c.name, price: c.price })),
      ...selectedToppings.map(t => ({ id: t.id, name: t.name, nameEn: t.nameEn || t.name, price: t.price }))
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

  // All selected items for recipe board
  const allSelectedAddons = [
    ...selectedSauces.map(s => ({ ...s, category: 'صوص' })),
    ...selectedCrunches.map(c => ({ ...c, category: 'إضافة' })),
    ...selectedToppings.map(t => ({ ...t, category: 'تتويج' }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black-primary/90 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
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
          
          {/* ===================== LEFT: ARTISANAL RECIPE BOARD (Clean luxury ticket) ===================== */}
          <div className="w-full md:w-5/12 bg-[#0B0B0E] p-4 sm:p-6 border-b md:border-b-0 md:border-l border-white/10 flex flex-col justify-between shrink-0">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-red"></span>
                  بطاقة وصفتك المخصصة
                </span>
                <span className="text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full">
                  {allSelectedAddons.length + 1} مكونات
                </span>
              </div>

              {/* Selected Base Showcase Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 flex items-center gap-3">
                {selectedBase.iconPath ? (
                  <img 
                    src={selectedBase.iconPath} 
                    alt={selectedBase.name} 
                    className="w-14 h-14 rounded-xl object-cover border border-white/15 shadow-md shrink-0" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl shadow-inner border border-white/15 shrink-0" style={{ backgroundColor: selectedBase.color }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-brand-red uppercase">القاعدة المختارة</div>
                  <div className="font-bold text-sm text-white truncate">{selectedBase.name}</div>
                  <div className="text-xs text-text-muted">{selectedBase.price > 0 ? `+${selectedBase.price} ج.م` : 'مشمولة في السعر الأساسي'}</div>
                </div>
              </div>

              {/* Selected Additions List */}
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-bold text-text-muted uppercase mb-1">الإضافات والصوصات النشطة:</div>
                {allSelectedAddons.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted">
                    لم تختر إضافات بعد، اضغط على أي صوص أو كرانش لإضافته
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

            {/* Chef Tasting Note */}
            <div className="p-3 rounded-xl bg-brand-red/5 border border-brand-red/20 text-[11px] text-text-muted leading-relaxed">
              <span className="text-brand-red font-bold block mb-0.5">ملاحظة باريستا THE BLACK BOX:</span>
              يتم تحضير المشروب طازجاً من الآيس كريم الفاخر مع الصوصات الأصلية والتتويج بالكريمة فور استلام طلبك.
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN LUXURY STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            
            <div>
              {/* FIXED CLEAN SEGMENTED NAVIGATION TABS */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-6 bg-black-primary/70 p-1.5 rounded-2xl border border-white/10">
                {[
                  { id: 'base', label: 'القاعدة', count: 1 },
                  { id: 'sauces', label: 'الصوصات', count: selectedSauces.length },
                  { id: 'crunch', label: 'المقرمشات', count: selectedCrunches.length },
                  { id: 'toppings', label: 'التوبينج', count: selectedToppings.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2.5 px-1 text-center rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {shakeBases.map((b) => {
                      const isSelected = selectedBase.id === b.id;
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
                              <div className="w-11 h-11 rounded-xl shadow-inner border border-white/20 shrink-0" style={{ backgroundColor: b.color }} />
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-text-light truncate">{b.name}</div>
                              {b.desc && <div className="text-[11px] text-text-muted line-clamp-1">{b.desc}</div>}
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
                </motion.div>
              )}

              {/* ================= TAB 2: SAUCES ================= */}
              {activeTab === 'sauces' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">اختر الصوصات السائلة الفاخرة (اختياري):</span>
                    <span className="text-xs text-brand-red font-bold">{selectedSauces.length} محددة</span>
                  </div>
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
                              <div className="w-11 h-11 rounded-xl shadow-md shrink-0" style={{ backgroundColor: s.color }} />
                            )}
                            <span className="font-bold text-sm text-text-light truncate">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mr-2">
                            <span className="text-xs font-bold text-brand-red">+{s.price} ج.م</span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-white/20'}`}>
                              {isSelected && <Check size={13} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ================= TAB 3: CRUNCH & FILLINGS ================= */}
              {activeTab === 'crunch' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">أضف القرمشة والحشوات اللذيذة داخل المشروب:</span>
                    <span className="text-xs text-brand-red font-bold">{selectedCrunches.length} محددة</span>
                  </div>
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
                            <span className="text-xs font-bold text-brand-red">+{c.price} ج.م</span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-white/20'}`}>
                              {isSelected && <Check size={13} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ================= TAB 4: TOPPINGS & CROWN ================= */}
              {activeTab === 'toppings' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">تتويج المشروب: الكريمة والبسكويت والكرز على القمة:</span>
                  </div>
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
                            <span className="text-xs font-bold text-brand-red">+{t.price} ج.م</span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-white/20'}`}>
                              {isSelected && <Check size={13} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Footer Bar: Total Price + Add to Cart Button */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-text-muted block font-medium">السعر الإجمالي المخصص:</span>
                <div className="text-2xl font-black text-white flex items-baseline gap-1">
                  <span>{totalPrice}</span>
                  <span className="text-sm text-brand-red font-bold">ج.م</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className={`flex-1 max-w-xs py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                  isSuccessShake
                    ? 'bg-emerald-600 text-white shadow-emerald-600/40'
                    : 'bg-brand-red hover:bg-red-700 text-white shadow-brand-red/40'
                }`}
              >
                {isSuccessShake ? (
                  <>
                    <Check size={20} className="animate-bounce" />
                    <span>تمت الإضافة للطلب بنجاح!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>إضافة المشروب للطلب</span>
                  </>
                )}
              </motion.button>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
