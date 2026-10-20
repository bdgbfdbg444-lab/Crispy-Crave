import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, Layers, Droplet, Cookie, Crown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

// Standard Curated Gourmet Presets
export const DEFAULT_SHAKE_BASES = [
  { id: 'vanilla', name: 'فانيليا كلاسيك', nameEn: 'Classic Vanilla', color: '#FBF5E8', waveColor: '#EFE5CE', price: 0, desc: 'آيس كريم فانيليا غني وفائق النعومة' },
  { id: 'chocolate', name: 'شوكولاتة بلجيكية', nameEn: 'Belgian Chocolate', color: '#4A2C1D', waveColor: '#361D11', price: 10, desc: 'كاكاو بلجيكي أصلي فاخر' },
  { id: 'strawberry', name: 'فراولة طبيعية', nameEn: 'Fresh Strawberry', color: '#E84D74', waveColor: '#CE355C', price: 10, desc: 'بيوريه فراولة طازج ومنعش' },
  { id: 'lotus_base', name: 'قاعدة زبدة اللوتس', nameEn: 'Lotus Biscoff Base', color: '#D68A36', waveColor: '#B86F20', price: 20, desc: 'طعم بسكويت اللوتس المكرمل الأصلي' },
  { id: 'pistachio', name: 'بستاشيو إيطالي', nameEn: 'Italian Pistachio', color: '#8FB87A', waveColor: '#759D60', price: 30, desc: 'فستق إيطالي محمص غني' },
];

export const DEFAULT_SHAKE_SAUCES = [
  { id: 'sauce_lotus', name: 'شلال صوص اللوتس', nameEn: 'Lotus Drizzle', color: '#C87A24', price: 20 },
  { id: 'sauce_nutella', name: 'شلال شوكولاتة نوتيلا', nameEn: 'Nutella Fudge Drizzle', color: '#2B150A', price: 25 },
  { id: 'sauce_strawberry', name: 'صوص فراولة فريش', nameEn: 'Strawberry Glaze', color: '#C01E42', price: 15 },
  { id: 'sauce_caramel', name: 'كراميل مملح سائل', nameEn: 'Salted Caramel Drip', color: '#B86B1E', price: 20 },
  { id: 'sauce_white_choco', name: 'شوكولاتة بيضاء ناعمة', nameEn: 'White Chocolate', color: '#F4ECE1', price: 20 },
];

export const DEFAULT_SHAKE_CRUNCH = [
  { id: 'crunch_oreo', name: 'أوريو مكسر مقرمش', nameEn: 'Crushed Oreo Bits', color: '#1B1718', price: 15 },
  { id: 'crunch_lotus', name: 'بسكويت لوتس مطحون', nameEn: 'Biscoff Crumbles', color: '#CE8430', price: 15 },
  { id: 'crunch_brownies', name: 'مكعبات براونيز فادج', nameEn: 'Fudge Brownie Chunks', color: '#3A1E11', price: 25 },
  { id: 'crunch_nuts', name: 'مكسرات محمصة مقرمشة', nameEn: 'Roasted Nuts Mix', color: '#9B6B38', price: 20 },
];

export const DEFAULT_SHAKE_TOPPINGS = [
  { id: 'top_cream', name: 'قمة كريمة مخفوقة فاخرة', nameEn: 'Whipped Cream Mountain', price: 15 },
  { id: 'top_whole_oreo', name: 'بسكويتة أوريو كاملة بالقمة', nameEn: 'Whole Oreo Crown', price: 10 },
  { id: 'top_whole_lotus', name: 'بسكويتة لوتس كاملة', nameEn: 'Whole Biscoff Biscuit', price: 10 },
  { id: 'top_wafer', name: 'رول ويفر شوكولاتة', nameEn: 'Chocolate Wafer Roll', price: 10 },
];

export default function ShakeLabModal({ isOpen, onClose, baseProduct, menuData }) {
  const { lang } = useLanguage();
  const { addToCart } = useCart();

  // Dynamic Options Resolution: Blend POS Add-Ons with Gourmet Presets
  const { shakeBases, shakeSauces, shakeCrunches, shakeToppings } = useMemo(() => {
    const pId = String(baseProduct?.id || '');
    const posAddOns = (menuData?.addOns || []).filter(a => {
      if (!a.linkedProductIds) return false;
      const ids = a.linkedProductIds.split(',').map(s => s.trim());
      return ids.includes(pId);
    });

    if (!posAddOns || posAddOns.length === 0) {
      return {
        shakeBases: DEFAULT_SHAKE_BASES,
        shakeSauces: DEFAULT_SHAKE_SAUCES,
        shakeCrunches: DEFAULT_SHAKE_CRUNCH,
        shakeToppings: DEFAULT_SHAKE_TOPPINGS
      };
    }

    const sauces = [];
    const crunches = [];
    const toppings = [];
    const bases = [];

    posAddOns.forEach(a => {
      const name = a.name.toLowerCase();
      const item = {
        id: `pos_${a.id}`,
        name: a.name,
        nameEn: a.nameEn || a.name,
        price: Number(a.price) || 0,
        color: '#E63946'
      };

      if (name.includes('صوص') || name.includes('شلال') || name.includes('sauce') || name.includes('كاسترد') || name.includes('نوتيلا') || name.includes('كراميل')) {
        item.color = name.includes('فراولة') ? '#C01E42' : name.includes('لوتس') ? '#C87A24' : name.includes('أبيض') ? '#F4ECE1' : '#2B150A';
        sauces.push(item);
      } else if (name.includes('بسكويت') || name.includes('أوريو') || name.includes('لوتس') || name.includes('كرانش') || name.includes('براونيز') || name.includes('مكسرات') || name.includes('crunch')) {
        item.color = name.includes('أوريو') ? '#1B1718' : name.includes('براونيز') ? '#3A1E11' : '#CE8430';
        crunches.push(item);
      } else if (name.includes('كريمة') || name.includes('توبينج') || name.includes('ويفر') || name.includes('مارشميلو') || name.includes('topping')) {
        toppings.push(item);
      } else if (name.includes('قاعدة') || name.includes('طعم') || name.includes('نكهة') || name.includes('آيس') || name.includes('فانيليا') || name.includes('شوكولاتة')) {
        item.waveColor = '#E63946';
        bases.push(item);
      } else {
        crunches.push(item);
      }
    });

    return {
      shakeBases: bases.length > 0 ? bases : DEFAULT_SHAKE_BASES,
      shakeSauces: sauces.length > 0 ? sauces : DEFAULT_SHAKE_SAUCES,
      shakeCrunches: crunches.length > 0 ? crunches : DEFAULT_SHAKE_CRUNCH,
      shakeToppings: toppings.length > 0 ? toppings : DEFAULT_SHAKE_TOPPINGS
    };
  }, [baseProduct, menuData]);

  // Selected Customization State
  const [selectedBase, setSelectedBase] = useState(DEFAULT_SHAKE_BASES[0]);
  const [selectedSauces, setSelectedSauces] = useState([DEFAULT_SHAKE_SAUCES[0]]);
  const [selectedCrunches, setSelectedCrunches] = useState([DEFAULT_SHAKE_CRUNCH[0]]);
  const [selectedToppings, setSelectedToppings] = useState([DEFAULT_SHAKE_TOPPINGS[0]]);
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
    setSelectedToppings([]);
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

  const hasWhippedCream = selectedToppings.some(t => t.id.includes('cream') || t.name.includes('كريمة'));
  const hasWholeBiscuit = selectedToppings.some(t => t.id.includes('whole') || t.name.includes('بسكويتة') || t.name.includes('ويفر'));

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

        {/* Modal Body: Two Column Layout */}
        <div className="flex flex-col md:flex-row flex-grow overflow-y-auto">
          
          {/* ===================== LEFT: VISUAL 2D GLASS CUP SIMULATOR ===================== */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-black-primary to-[#0f0e13] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-white/10 relative overflow-hidden select-none min-h-[360px]">
            
            {/* Ambient Backlight Glow */}
            <div 
              className="absolute w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
              style={{ backgroundColor: selectedBase.color }}
            />

            {/* The Visual Cup Container */}
            <div className="relative w-44 h-72 flex flex-col items-center justify-end">
              
              {/* TOPPING 1: Whole Biscuit / Wafer Peeking Out */}
              <AnimatePresence>
                {hasWholeBiscuit && (
                  <motion.div
                    initial={{ y: -30, opacity: 0, rotate: -20 }}
                    animate={{ y: 0, opacity: 1, rotate: -15 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="absolute -top-7 right-4 z-30"
                  >
                    <div className="w-12 h-14 bg-[#4A2511] rounded-lg border-2 border-[#6E3C1F] shadow-xl flex items-center justify-center text-[10px] font-black text-amber-200 tracking-wider">
                      BISCOFF
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* TOPPING 2: Whipped Cream Crown */}
              <AnimatePresence>
                {hasWhippedCream && (
                  <motion.div 
                    initial={{ scale: 0.5, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 12 }}
                    className="absolute -top-6 w-36 h-12 z-20"
                  >
                    <svg viewBox="0 0 140 50" className="w-full h-full drop-shadow-md">
                      <path 
                        d="M 10 45 Q 20 20, 40 30 Q 55 10, 70 20 Q 85 5, 100 25 Q 120 15, 130 45 Z" 
                        fill="#FFFFFF" 
                        stroke="#F0ECE1" 
                        strokeWidth="1.5"
                      />
                      <path 
                        d="M 30 35 Q 50 15, 70 24 Q 90 12, 110 32" 
                        fill="none" 
                        stroke="#E2DCD2" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Straw */}
              <div className="absolute -top-12 left-9 w-3 h-36 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-full rotate-12 z-10 shadow-lg border border-black/20" />

              {/* The Glass Cup Body */}
              <div className="relative w-40 h-64 border-4 border-t-0 border-white/30 rounded-b-[36px] backdrop-blur-[2px] bg-white/5 overflow-hidden shadow-2xl flex flex-col justify-end">
                
                {/* Glass Reflection Highlight */}
                <div className="absolute inset-y-0 left-2 w-3 bg-gradient-to-r from-white/30 to-transparent rounded-full z-20 pointer-events-none" />
                <div className="absolute inset-y-0 right-2 w-1.5 bg-gradient-to-l from-white/20 to-transparent rounded-full z-20 pointer-events-none" />

                {/* LIQUID BASE: Animated Wave Height */}
                <motion.div
                  initial={false}
                  animate={{ 
                    backgroundColor: selectedBase.color,
                    height: '84%'
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative w-full overflow-hidden"
                >
                  {/* Subtle Liquid Wave Top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-4 opacity-40"
                    style={{ backgroundColor: selectedBase.waveColor || '#EFE5CE' }}
                  />

                  {/* SAUCE DRIZZLE: Cascading Down the Glass Walls */}
                  {selectedSauces.map((sauce, idx) => (
                    <motion.div
                      key={sauce.id}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 0.9 }}
                      exit={{ scaleY: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="absolute top-0 w-2.5 rounded-full origin-top shadow-md z-10"
                      style={{
                        backgroundColor: sauce.color,
                        height: `${70 + (idx * 7)}%`,
                        left: `${18 + (idx * 26)}%`,
                      }}
                    />
                  ))}

                  {/* CRUNCH BITS: Suspended inside the Shake Liquid */}
                  {selectedCrunches.map((crunch, cIdx) => (
                    <motion.div
                      key={crunch.id}
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: cIdx * 0.08 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {[15, 35, 55, 75, 40, 60, 25, 70].map((topPos, pIdx) => (
                        <div
                          key={pIdx}
                          className="absolute w-2 h-2 rounded-sm shadow-sm"
                          style={{
                            backgroundColor: crunch.color,
                            top: `${topPos}%`,
                            left: `${(pIdx * 12 + 10) % 80}%`,
                            transform: `rotate(${pIdx * 45}deg)`,
                            opacity: 0.85
                          }}
                        />
                      ))}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Cup Base Stand Shadow */}
              <div className="w-32 h-3.5 bg-black/60 rounded-full blur-sm mt-1" />
            </div>

            {/* Current Shake Summary Badges */}
            <div className="mt-5 text-center">
              <div className="text-xs font-bold text-white mb-1.5 flex items-center justify-center gap-1.5">
                <span>{selectedBase.name}</span>
                {selectedSauces.length > 0 && <span className="text-text-muted">+ {selectedSauces.length} صوص</span>}
                {selectedCrunches.length > 0 && <span className="text-text-muted">+ {selectedCrunches.length} كرانش</span>}
              </div>
              <p className="text-[11px] text-text-muted">المحرك البصري يتفاعل فوراً مع اختياراتك</p>
            </div>
          </div>

          {/* ===================== RIGHT/BOTTOM: STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-5 sm:p-7 flex flex-col justify-between">
            
            <div>
              {/* Category Step Navigation Tabs */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-6 bg-black-primary/60 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'base', label: '1. القاعدة', count: 1, icon: Layers },
                  { id: 'sauces', label: '2. الصوصات', count: selectedSauces.length, icon: Droplet },
                  { id: 'crunch', label: '3. المقرمشات', count: selectedCrunches.length, icon: Cookie },
                  { id: 'toppings', label: '4. التوبينج', count: selectedToppings.length, icon: Crown },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        activeTab === tab.id
                          ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
                          : 'text-text-muted hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Icon size={13} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-black/30 text-white' : 'bg-brand-red/20 text-brand-red'}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ================= TAB 1: BASE FLAVOR ================= */}
              {activeTab === 'base' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
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
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-brand-red/15 border-brand-red shadow-md'
                              : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: b.color }} />
                            <div>
                              <div className="font-bold text-sm text-text-light">{b.name}</div>
                              {b.desc && <div className="text-[11px] text-text-muted">{b.desc}</div>}
                            </div>
                          </div>
                          <div className="text-right">
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">اختر الصوصات السائلة لتغمر جدران الكوب (اختياري):</span>
                    <span className="text-xs text-brand-red font-bold">{selectedSauces.length} محددة</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {shakeSauces.map((s) => {
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
                            <div className="w-7 h-7 rounded-full shadow-md" style={{ backgroundColor: s.color }} />
                            <span className="font-bold text-sm text-text-light">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
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

              {/* ================= TAB 3: CRUNCH ================= */}
              {activeTab === 'crunch' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">أضف القرمشة ومكعبات الحلويات داخل المشروب:</span>
                    <span className="text-xs text-brand-red font-bold">{selectedCrunches.length} محددة</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {shakeCrunches.map((c) => {
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
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg shadow-md flex items-center justify-center bg-white/10 border border-white/10">
                              <Cookie size={14} className="text-amber-400" />
                            </div>
                            <span className="font-bold text-sm text-text-light">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
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

              {/* ================= TAB 4: TOPPINGS ================= */}
              {activeTab === 'toppings' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">تتويج المشروب: الكريمة والبسكويت على القمة:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {shakeToppings.map((t) => {
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
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                              <Crown size={14} className="text-amber-400" />
                            </div>
                            <span className="font-bold text-sm text-text-light">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
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
                    <Sparkles size={18} />
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
