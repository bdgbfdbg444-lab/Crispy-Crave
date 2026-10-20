import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, Flame, Beef, Layers, Droplet } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

// Default Gourmet Burger Presets
export const DEFAULT_BURGER_BUNS = [
  { id: 'bun_brioche', name: 'خبز بريوش محمص بالزبدة', nameEn: 'Buttered Brioche Bun', price: 0, desc: 'خبز بريوش فرنسي خفيف ومحمص بلمعة ذهبية' },
  { id: 'bun_potato', name: 'خبز بطاطس أمريكي فاخر', nameEn: 'Potato Roll Bun', price: 10, desc: 'طري جداً ويمتص عصارة اللحم بامتياز' },
  { id: 'bun_sesame', name: 'خبز بريوش بالسمسم المكرمل', nameEn: 'Sesame Brioche Bun', price: 10, desc: 'حبيبات سمسم محمصة بنكهة غنية' },
  { id: 'bun_lettuce', name: 'خس ملفوف بروتين (بدون خبز)', nameEn: 'Lettuce Wrap (Low Carb)', price: 0, desc: 'أوراق خس آيسبيرج كريسبي طازجة مناسب للكيتو' },
];

export const DEFAULT_BURGER_SAUCES = [
  { id: 'sauce_secret', name: 'صوص بلاك بوكس السري', nameEn: 'Black Box Secret Sauce', color: '#E05A1F', price: 15, desc: 'مزيج كريمي مدخن بنكهة تكساس الخاصة' },
  { id: 'sauce_cheddar', name: 'شلال شيدر سائلة ذائبة', nameEn: 'Warm Melted Cheddar', color: '#FFB703', price: 20, desc: 'جبنة شيدر أمريكية أصلية دافئة' },
  { id: 'sauce_bbq', name: 'صوص باربيكيو مدخن بالعسل', nameEn: 'Smoked Honey BBQ', color: '#3A140B', price: 15, desc: 'حلاوة عسل مع دخان خشب الأوك الحقيقي' },
  { id: 'sauce_spicy_mayo', name: 'مايونيز هالبينو سبايسي', nameEn: 'Spicy Jalapeño Mayo', color: '#C83218', price: 15, desc: 'حرارة متوازنة مع قرمشة الهالبينو' },
  { id: 'sauce_ranch', name: 'رانش كريمي بالأعشاب', nameEn: 'Herbed Garlic Ranch', color: '#F1EEDB', price: 15, desc: 'ثوم خفيف مع أعشاب ريفية منعشة' },
];

export const DEFAULT_BURGER_CRUNCH = [
  { id: 'crunch_onion', name: 'بصل مكرمل دافئ على الجريل', nameEn: 'Caramelized Grilled Onion', color: '#6A381F', price: 15 },
  { id: 'crunch_bacon', name: 'بيكون بقري مدخن مقرمش', nameEn: 'Crispy Beef Bacon Strips', color: '#5C1D18', price: 25 },
  { id: 'crunch_jalapeno', name: 'شرائح هالبينو مشوية حارة', nameEn: 'Grilled Jalapeño Slices', color: '#2D5A27', price: 10 },
  { id: 'crunch_pickles', name: 'خيار مخلل كريسبي أمريكي', nameEn: 'Dill Pickles Chips', color: '#4E6E32', price: 10 },
  { id: 'crunch_onion_rings', name: 'حلقات بصل مقلية ذهبية', nameEn: 'Golden Onion Rings', color: '#C98528', price: 15 },
];

export const DEFAULT_BURGER_TOPPINGS = [
  { id: 'top_extra_patty', name: 'شريحة برجر سماش إضافية 150 جم', nameEn: 'Double Smash Patty (150g)', color: '#3D1C12', price: 45 },
  { id: 'top_smoked_brisket', name: 'شرائح بريسكت مدخن 100 جم', nameEn: 'Smoked Brisket Topping', color: '#4A1F18', price: 55 },
  { id: 'top_extra_cheddar', name: 'شريحة جبنة شيدر حمراء إضافية', nameEn: 'Extra Red Cheddar Slice', color: '#FFA200', price: 15 },
  { id: 'top_mozzarella_stick', name: 'أصابع موتزاريلا مقلية مقرمشة', nameEn: 'Fried Mozzarella Sticks', color: '#D49B35', price: 25 },
];

export default function BurgerLabModal({ isOpen, onClose, baseProduct, menuData }) {
  const { lang } = useLanguage();
  const { addToCart } = useCart();

  // Dynamic Options Resolution from POS Add-Ons
  const { burgerBuns, burgerSauces, burgerCrunches, burgerToppings } = useMemo(() => {
    const pId = String(baseProduct?.id || '');
    const posAddOns = (menuData?.addOns || []).filter(a => {
      if (!a.linkedProductIds) return false;
      const ids = a.linkedProductIds.split(',').map(s => s.trim());
      return ids.includes(pId);
    });

    if (!posAddOns || posAddOns.length === 0) {
      return {
        burgerBuns: DEFAULT_BURGER_BUNS,
        burgerSauces: DEFAULT_BURGER_SAUCES,
        burgerCrunches: DEFAULT_BURGER_CRUNCH,
        burgerToppings: DEFAULT_BURGER_TOPPINGS
      };
    }

    const buns = [];
    const sauces = [];
    const crunches = [];
    const toppings = [];

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
        buns.push(item);
      } else if (role === 'sauce') {
        sauces.push(item);
      } else if (role === 'crunch') {
        crunches.push(item);
      } else if (role === 'topping') {
        toppings.push(item);
      } else {
        if (name.includes('خبز') || name.includes('عيش') || name.includes('bun') || name.includes('بريوش')) {
          buns.push(item);
        } else if (name.includes('صوص') || name.includes('sauce') || name.includes('شيدر') || name.includes('باربيكيو') || name.includes('مايو')) {
          sauces.push(item);
        } else if (name.includes('بصل') || name.includes('بيكون') || name.includes('هالبينو') || name.includes('مخلل') || name.includes('crunch')) {
          crunches.push(item);
        } else if (name.includes('شريحة') || name.includes('لحم') || name.includes('بريسكت') || name.includes('موتزاريلا') || name.includes('patty')) {
          toppings.push(item);
        } else {
          crunches.push(item);
        }
      }
    });

    return {
      burgerBuns: buns.length > 0 ? buns : DEFAULT_BURGER_BUNS,
      burgerSauces: sauces.length > 0 ? sauces : DEFAULT_BURGER_SAUCES,
      burgerCrunches: crunches.length > 0 ? crunches : DEFAULT_BURGER_CRUNCH,
      burgerToppings: toppings.length > 0 ? toppings : DEFAULT_BURGER_TOPPINGS
    };
  }, [baseProduct, menuData]);

  // Selected Customization State
  const [selectedBun, setSelectedBun] = useState(DEFAULT_BURGER_BUNS[0]);
  const [selectedSauces, setSelectedSauces] = useState([DEFAULT_BURGER_SAUCES[0]]);
  const [selectedCrunches, setSelectedCrunches] = useState([DEFAULT_BURGER_CRUNCH[0]]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [activeTab, setActiveTab] = useState('bun'); // 'bun' | 'sauces' | 'crunch' | 'toppings'
  const [isSuccessBurger, setIsSuccessBurger] = useState(false);

  // Base price from POS or standard 140 EGP
  const initialBasePrice = Number(baseProduct?.sellingPrice) || 140;

  // Calculate live total price
  const totalPrice = useMemo(() => {
    let sum = initialBasePrice;
    sum += selectedBun.price || 0;
    selectedSauces.forEach(s => sum += s.price || 0);
    selectedCrunches.forEach(c => sum += c.price || 0);
    selectedToppings.forEach(t => sum += t.price || 0);
    return sum;
  }, [initialBasePrice, selectedBun, selectedSauces, selectedCrunches, selectedToppings]);

  if (!isOpen) return null;

  const toggleSauce = (sauce) => {
    setSelectedSauces(prev => 
      prev.some(s => s.id === sauce.id) 
        ? prev.filter(s => s.id !== sauce.id)
        : [...prev, sauce]
    );
  };

  const toggleCrunch = (crunch) => {
    setSelectedCrunches(prev => 
      prev.some(c => c.id === crunch.id) 
        ? prev.filter(c => c.id !== crunch.id)
        : [...prev, crunch]
    );
  };

  const toggleTopping = (topping) => {
    setSelectedToppings(prev => 
      prev.some(t => t.id === topping.id) 
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const handleReset = () => {
    setSelectedBun(burgerBuns[0] || DEFAULT_BURGER_BUNS[0]);
    setSelectedSauces([burgerSauces[0] || DEFAULT_BURGER_SAUCES[0]]);
    setSelectedCrunches([]);
    setSelectedToppings([]);
  };

  const handleAddToCart = () => {
    const modifiersList = [
      { id: `bun_${selectedBun.id}`, name: `الخبز: ${selectedBun.name}`, nameEn: `Bun: ${selectedBun.nameEn || selectedBun.name}`, price: selectedBun.price },
      ...selectedSauces.map(s => ({ id: s.id, name: s.name, nameEn: s.nameEn || s.name, price: s.price })),
      ...selectedCrunches.map(c => ({ id: c.id, name: c.name, nameEn: c.nameEn || c.name, price: c.price })),
      ...selectedToppings.map(t => ({ id: t.id, name: t.name, nameEn: t.nameEn || t.name, price: t.price }))
    ];

    const customizedProduct = {
      ...(baseProduct || {}),
      id: baseProduct?.id || 8888,
      name: lang === 'en' ? (baseProduct?.nameEn || 'Artisanal Custom Burger') : (baseProduct?.name || 'كوّن ساندوتشك بنفسك'),
      nameEn: baseProduct?.nameEn || 'Artisanal Custom Burger',
      sellingPrice: totalPrice,
      calculatedPrice: totalPrice,
      selectedModifiers: modifiersList,
      finalModifiersPrice: totalPrice - initialBasePrice,
      isCustomBurger: true
    };

    addToCart(customizedProduct, 1);
    setIsSuccessBurger(true);

    setTimeout(() => {
      setIsSuccessBurger(false);
      onClose();
    }, 600);
  };

  const hasDoublePatty = selectedToppings.some(t => t.id.includes('patty') || t.name.includes('شريحة'));
  const hasSmokedBrisket = selectedToppings.some(t => t.id.includes('brisket') || t.name.includes('بريسكت'));
  const hasBacon = selectedCrunches.some(c => c.id.includes('bacon') || c.name.includes('بيكون'));
  const hasCaramelizedOnion = selectedCrunches.some(c => c.id.includes('onion') || c.name.includes('بصل'));
  const hasPickles = selectedCrunches.some(c => c.id.includes('pickles') || c.name.includes('مخلل'));
  const hasJalapeno = selectedCrunches.some(c => c.id.includes('jalapeno') || c.name.includes('هالبينو'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
        className="relative w-full max-w-4xl bg-black-surface border border-brand-red-dark/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black-primary/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center border border-brand-red/30">
              <Beef size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-2 py-0.5 rounded">
                  THE BLACK BOX SMASH LAB
                </span>
                <span className="text-xs text-text-muted">| استوديو البرجر التفاعلي</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-text-light">
                {baseProduct?.name || (lang === 'en' ? 'Build Your Custom Burger' : 'كوّن ساندوتش البرجر بنفسك')}
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

        {/* Modal Body: Two Column Layout */}
        <div className="flex flex-col md:flex-row flex-grow overflow-y-auto">
          
          {/* ===================== LEFT: 2D/3D BURGER STACKING SIMULATOR ===================== */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-[#0A0A0D] via-[#121217] to-[#0A0A0D] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-white/10 relative overflow-hidden select-none min-h-[380px]">
            
            {/* Grill Fire Ambient Glow */}
            <div className="absolute w-60 h-60 rounded-full blur-[70px] opacity-20 pointer-events-none bg-amber-600" />

            {/* The Stacking Burger Container */}
            <div className="relative w-56 flex flex-col items-center justify-center py-4">
              
              {/* 1. TOP BRIOCHE BUN (With Sesame & Golden Sheen) */}
              <motion.div
                layout
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16 }}
                className="relative w-44 h-18 rounded-t-[50px] rounded-b-[10px] bg-gradient-to-b from-[#C4883E] via-[#A66D29] to-[#87551D] border-t border-amber-200/40 shadow-2xl flex items-center justify-center z-40 overflow-hidden"
              >
                {/* Sesame Seeds */}
                <div className="absolute inset-0 opacity-80 pointer-events-none">
                  {[
                    { t: '25%', l: '30%' }, { t: '20%', l: '50%' }, { t: '30%', l: '70%' },
                    { t: '45%', l: '20%' }, { t: '50%', l: '45%' }, { t: '40%', l: '65%' },
                    { t: '60%', l: '35%' }, { t: '55%', l: '80%' }
                  ].map((pos, i) => (
                    <div key={i} className="absolute w-2 h-1 bg-amber-100/90 rounded-full rotate-45 shadow-sm" style={{ top: pos.t, left: pos.l }} />
                  ))}
                </div>
                {/* Bun Specular Light Reflection */}
                <div className="absolute top-1 left-4 right-4 h-3 rounded-full bg-white/20 blur-[1px]" />
              </motion.div>

              {/* 2. TOP SAUCE SPREAD / DRIP */}
              {selectedSauces.length > 0 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="w-42 h-3.5 -mt-1.5 rounded-full z-35 shadow-md origin-center"
                  style={{ backgroundColor: selectedSauces[0].color, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}
                />
              )}

              {/* 3. SMOKED BRISKET TOPPING LAYER (If selected) */}
              <AnimatePresence>
                {hasSmokedBrisket && (
                  <motion.div
                    initial={{ scale: 0.8, y: -15, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-42 h-6 -mt-1.5 rounded-lg bg-gradient-to-r from-[#4A1F18] via-[#632E24] to-[#4A1F18] border-y border-[#8E4438] flex items-center justify-center text-[10px] font-black text-rose-200 tracking-wider shadow-lg z-32"
                  >
                    SMOKED BRISKET (100g)
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 4. CRISPY BEEF BACON (If selected) */}
              <AnimatePresence>
                {hasBacon && (
                  <motion.div
                    initial={{ rotate: -10, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-44 h-4 -mt-1 rounded-sm bg-gradient-to-r from-[#5C1D18] via-[#852C25] to-[#5C1D18] border-b-2 border-[#360F0C] shadow-md z-30"
                  />
                )}
              </AnimatePresence>

              {/* 5. CARAMELIZED ONIONS & JALAPENOS / PICKLES */}
              <div className="w-40 -mt-1 flex items-center justify-center gap-1.5 z-28">
                {hasCaramelizedOnion && (
                  <div className="h-3 flex-1 bg-[#5A311A] rounded-full border border-amber-900/60 shadow-sm" title="بصل مكرمل" />
                )}
                {hasJalapeno && (
                  <div className="w-5 h-3 bg-[#24521E] rounded-full border border-emerald-400/40 shadow-sm" title="هالبينو مشوي" />
                )}
                {hasPickles && (
                  <div className="w-6 h-3 bg-[#3F5B25] rounded-full border border-lime-400/30 shadow-sm" title="خيار مخلل" />
                )}
              </div>

              {/* 6. MELTED CHEDDAR CHEESE LAYER */}
              <div className="relative w-44 h-5 -mt-1.5 z-25 flex items-center justify-center">
                <div className="w-full h-3.5 bg-gradient-to-r from-[#FFB703] via-[#FCA311] to-[#FFB703] rounded-sm shadow-md" />
                {/* Dripping Cheese Corners */}
                <div className="absolute -bottom-2.5 left-5 w-3.5 h-3.5 bg-[#FFB703] rounded-b-md shadow-sm" />
                <div className="absolute -bottom-2 right-8 w-3 h-3 bg-[#FCA311] rounded-b-md shadow-sm" />
              </div>

              {/* 7. FIRST SEAPED BEEF PATTY (150g Smash Patty) */}
              <motion.div
                layout
                className="w-45 h-8 -mt-1 rounded-xl bg-gradient-to-b from-[#3D2016] via-[#2A140E] to-[#1E0D08] border-y border-[#522D20] shadow-2xl flex items-center justify-center text-[10px] font-bold text-amber-100/70 tracking-wider z-20"
              >
                100% ANGUS SMASH PATTY
              </motion.div>

              {/* 8. OPTIONAL SECOND PATTY (Double Smash) */}
              <AnimatePresence>
                {hasDoublePatty && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 32, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-45 h-8 -mt-1 rounded-xl bg-gradient-to-b from-[#3D2016] via-[#2A140E] to-[#1E0D08] border-y border-[#522D20] shadow-2xl flex items-center justify-center text-[10px] font-bold text-amber-100/70 tracking-wider z-15"
                  >
                    EXTRA SMASH PATTY (+150g)
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 9. BOTTOM BRIOCHE BUN (Heel) */}
              <div className="w-43 h-7 -mt-1 rounded-b-[20px] rounded-t-[4px] bg-gradient-to-b from-[#A66D29] to-[#734515] border-b border-amber-950 shadow-2xl z-10" />

              {/* Shadow under Burger on Dark Table */}
              <div className="w-44 h-4 bg-black/90 rounded-full blur-md mt-1" />
            </div>

            {/* Burger Summary Badge */}
            <div className="mt-4 text-center">
              <div className="text-xs font-bold text-white mb-1 flex items-center justify-center gap-1.5">
                <span>{selectedBun.name}</span>
                {selectedSauces.length > 0 && <span className="text-brand-red font-medium">+ {selectedSauces.length} صوص</span>}
                {selectedCrunches.length > 0 && <span className="text-brand-red font-medium">+ {selectedCrunches.length} إضافات</span>}
              </div>
              <p className="text-[11px] text-text-muted">طبقات الساندوتش تهبط حية مع كل إضافة تختارها</p>
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Segmented Step Tabs */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-6 bg-black-primary/70 p-1.5 rounded-2xl border border-white/10">
                {[
                  { id: 'bun', label: '1. الخبز', count: 1 },
                  { id: 'sauces', label: '2. الصوصات', count: selectedSauces.length },
                  { id: 'crunch', label: '3. الإضافات', count: selectedCrunches.length },
                  { id: 'toppings', label: '4. اللحوم والأجبان', count: selectedToppings.length },
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

              {/* TAB 1: BUN SELECTION */}
              {activeTab === 'bun' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">اختر نوع الخبز المفضل (إجباري):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {burgerBuns.map((b) => {
                      const isSelected = selectedBun.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBun(b)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-brand-red/15 border-brand-red shadow-md'
                              : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-text-light">{b.name}</div>
                            {b.desc && <div className="text-[11px] text-text-muted line-clamp-1">{b.desc}</div>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-brand-red">{b.price > 0 ? `+${b.price} ج.م` : 'مشمول'}</span>
                            {isSelected && <Check size={16} className="text-brand-red ml-auto mt-1" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: SAUCES */}
              {activeTab === 'sauces' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">اختر صوصات البرجر الذائبة (اختياري):</span>
                    <span className="text-xs text-brand-red font-bold">{selectedSauces.length} محددة</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {burgerSauces.map((s) => {
                      const isSelected = selectedSauces.some(item => item.id === s.id);
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
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-md shrink-0" style={{ backgroundColor: s.color }} />
                            <div>
                              <div className="font-bold text-sm text-text-light">{s.name}</div>
                              {s.desc && <div className="text-[10px] text-text-muted">{s.desc}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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

              {/* TAB 3: CRUNCH & VEGGIES */}
              {activeTab === 'crunch' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">أضف الخضار والمقرمشات المشوية داخل الساندوتش:</span>
                    <span className="text-xs text-brand-red font-bold">{selectedCrunches.length} محددة</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {burgerCrunches.map((c) => {
                      const isSelected = selectedCrunches.some(item => item.id === c.id);
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
                          <span className="font-bold text-sm text-text-light">{c.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
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

              {/* TAB 4: MEATS & CHEESE TOPPING */}
              {activeTab === 'toppings' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">مضاعفة اللحوم والأجبان الفاخرة (Double Up):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {burgerToppings.map((t) => {
                      const isSelected = selectedToppings.some(item => item.id === t.id);
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
                          <span className="font-bold text-sm text-text-light">{t.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
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

            {/* Bottom Footer Bar */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-text-muted block font-medium">سعر الساندوتش المخصص:</span>
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
                  isSuccessBurger
                    ? 'bg-emerald-600 text-white shadow-emerald-600/40'
                    : 'bg-brand-red hover:bg-red-700 text-white shadow-brand-red/40'
                }`}
              >
                {isSuccessBurger ? (
                  <>
                    <Check size={20} className="animate-bounce" />
                    <span>تمت الإضافة للطلب بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>إضافة الساندوتش للطلب</span>
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
