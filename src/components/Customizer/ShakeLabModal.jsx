import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, Layers, Droplet, Cookie, Crown, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

// Default Gourmet Presets with realistic gastronomic styling
export const DEFAULT_SHAKE_BASES = [
  { id: 'vanilla', name: 'فانيليا مدغشقر كلاسيك', nameEn: 'Madagascar Vanilla', color: '#FBF5E8', waveColor: '#EFE5CE', price: 0, desc: 'آيس كريم فانيليا غني وفائق النعومة' },
  { id: 'chocolate', name: 'شوكولاتة بلجيكية فاخرة', nameEn: 'Belgian Chocolate Fudge', color: '#3A1E11', waveColor: '#251209', price: 10, desc: 'كاكاو بلجيكي مركز مع حليب طازج' },
  { id: 'strawberry', name: 'فراولة طبيعية طازجة', nameEn: 'Fresh Strawberry Puree', color: '#E84D74', waveColor: '#C4264F', price: 10, desc: 'بيوريه فراولة مزارع طبيعي منعش' },
  { id: 'lotus_base', name: 'زبدة بسكويت اللوتس', nameEn: 'Lotus Biscoff Cream', color: '#D68A36', waveColor: '#A85E14', price: 20, desc: 'كريمة لوتس أصلية بالكراميل المكرمل' },
  { id: 'pistachio', name: 'فستق حلبي إيطالي', nameEn: 'Sicilian Pistachio', color: '#8FB87A', waveColor: '#6B9456', price: 30, desc: 'بيوريه فستق إيطالي محمص غني' },
];

export const DEFAULT_SHAKE_SAUCES = [
  { id: 'sauce_lotus', name: 'شلال صوص اللوتس الدافئ', nameEn: 'Warm Lotus Drizzle', color: '#C87A24', price: 20 },
  { id: 'sauce_nutella', name: 'فادج شوكولاتة نوتيلا', nameEn: 'Nutella Fudge Drizzle', color: '#2B150A', price: 25 },
  { id: 'sauce_strawberry', name: 'جليز فراولة طبيعية', nameEn: 'Strawberry Glaze', color: '#C01E42', price: 15 },
  { id: 'sauce_caramel', name: 'كراميل مملح غني', nameEn: 'Salted Caramel Drip', color: '#B86B1E', price: 20 },
  { id: 'sauce_white_choco', name: 'شوكولاتة بيضاء ناعمة', nameEn: 'Silky White Chocolate', color: '#F4ECE1', price: 20 },
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
  { id: 'top_wafer', name: 'رول ويفر شوكولاتة مذهب', nameEn: 'Chocolate Wafer Roll', price: 10 },
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
      const role = (a.customizerRole || '').toLowerCase();
      const item = {
        id: `pos_${a.id}`,
        name: a.name,
        nameEn: a.nameEn || a.name,
        price: Number(a.price) || 0,
        color: a.visualColor || '#E63946',
        iconPath: a.iconPath || null
      };

      // 1. Explicit Role Check from POS
      if (role === 'base') {
        item.waveColor = a.visualColor || '#E63946';
        bases.push(item);
      } else if (role === 'sauce') {
        sauces.push(item);
      } else if (role === 'crunch') {
        crunches.push(item);
      } else if (role === 'topping') {
        toppings.push(item);
      } else {
        // Fallback by name keywords if not explicitly categorized
        if (name.includes('صوص') || name.includes('شلال') || name.includes('sauce') || name.includes('كاسترد') || name.includes('نوتيلا') || name.includes('كراميل')) {
          sauces.push(item);
        } else if (name.includes('بسكويت') || name.includes('أوريو') || name.includes('لوتس') || name.includes('كرانش') || name.includes('براونيز') || name.includes('مكسرات') || name.includes('crunch')) {
          crunches.push(item);
        } else if (name.includes('كريمة') || name.includes('توبينج') || name.includes('ويفر') || name.includes('مارشميلو') || name.includes('topping')) {
          toppings.push(item);
        } else if (name.includes('قاعدة') || name.includes('طعم') || name.includes('نكهة') || name.includes('آيس') || name.includes('فانيليا') || name.includes('شوكولاتة')) {
          bases.push(item);
        } else {
          crunches.push(item);
        }
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
  const hasWholeBiscuit = selectedToppings.some(t => t.id.includes('whole') || t.name.includes('بسكويتة') || t.name.includes('لوتس') || t.name.includes('أوريو') || t.name.includes('ويفر'));

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
          
          {/* ===================== LEFT: ARTISANAL GLASS CUP SIMULATOR ===================== */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-[#0B0B0E] via-[#111116] to-[#0B0B0E] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-white/10 relative overflow-hidden select-none min-h-[380px]">
            
            {/* Ambient Gastronomic Spotlight Glow */}
            <div 
              className="absolute w-64 h-64 rounded-full blur-[80px] opacity-25 pointer-events-none transition-colors duration-700"
              style={{ backgroundColor: selectedBase.color }}
            />

            {/* The Visual Cup Stage */}
            <div className="relative w-48 h-80 flex flex-col items-center justify-end">
              
              {/* TOPPING 1: Whole Biscoff / Biscuit Peeking Out */}
              <AnimatePresence>
                {hasWholeBiscuit && (
                  <motion.div
                    initial={{ y: -30, opacity: 0, rotate: -25 }}
                    animate={{ y: 0, opacity: 1, rotate: -18 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="absolute -top-7 right-3 z-30 drop-shadow-2xl"
                  >
                    <div className="w-13 h-16 bg-[#5A2D14] rounded-lg border-2 border-[#82441F] shadow-2xl flex flex-col items-center justify-center text-[9px] font-black text-amber-200 tracking-wider p-1">
                      <div className="w-full border-t border-b border-[#733A18] py-0.5 text-center font-serif">
                        BISCOFF
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* TOPPING 2: Luxurious 3D Shaded Whipped Cream Crown */}
              <AnimatePresence>
                {hasWhippedCream && (
                  <motion.div 
                    initial={{ scale: 0.6, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 190, damping: 13 }}
                    className="absolute -top-8 w-40 h-16 z-20 pointer-events-none drop-shadow-xl"
                  >
                    <svg viewBox="0 0 160 65" className="w-full h-full">
                      <defs>
                        <linearGradient id="creamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="70%" stopColor="#F7F3EB" />
                          <stop offset="100%" stopColor="#E2DAD0" />
                        </linearGradient>
                        <radialGradient id="creamHighlight" cx="50%" cy="25%" r="50%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#EFECE6" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      {/* Cream Base Mound */}
                      <path 
                        d="M 12 58 Q 25 25, 50 35 Q 70 8, 90 22 Q 110 5, 130 30 Q 148 20, 150 58 Z" 
                        fill="url(#creamGrad)" 
                        stroke="#D5CCC0" 
                        strokeWidth="1.2"
                      />
                      {/* Cream Volumetric Swirl Ridges */}
                      <path 
                        d="M 35 48 Q 55 20, 80 32 Q 105 16, 130 42" 
                        fill="none" 
                        stroke="#D0C6B8" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                      />
                      <path 
                        d="M 55 36 Q 78 12, 100 24" 
                        fill="none" 
                        stroke="#FFFFFF" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                      />
                      {/* Sauce Drizzle over Cream if selected */}
                      {selectedSauces.length > 0 && (
                        <path 
                          d="M 45 42 Q 65 24, 85 36 Q 105 20, 125 45" 
                          fill="none" 
                          stroke={selectedSauces[0].color} 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                          opacity="0.88"
                        />
                      )}
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Artisan Striped Straw */}
              <div className="absolute -top-14 left-8 w-3.5 h-44 rounded-full rotate-12 z-10 shadow-2xl overflow-hidden border border-black/30">
                <div className="w-full h-full bg-gradient-to-b from-white via-red-600 to-white" style={{ backgroundSize: '100% 18px' }} />
              </div>

              {/* ================= THE ARTISANAL GLASS MILKSHAKE TUMBLER ================= */}
              <div className="relative w-42 h-68 overflow-hidden rounded-b-[42px] border-x-2 border-b-4 border-white/25 backdrop-blur-[3px] bg-gradient-to-r from-white/10 via-transparent to-white/15 shadow-2xl flex flex-col justify-end">
                
                {/* Specular Curved Rim Gloss & Reflections */}
                <div className="absolute inset-y-0 left-2 w-3.5 bg-gradient-to-r from-white/40 via-white/20 to-transparent rounded-full z-30 pointer-events-none" />
                <div className="absolute inset-y-0 right-2 w-2 bg-gradient-to-l from-white/35 to-transparent rounded-full z-30 pointer-events-none" />
                <div className="absolute top-2 inset-x-4 h-1 bg-white/20 rounded-full z-30 pointer-events-none" />

                {/* Subtle Etched Brand Monogram */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none opacity-20 text-[10px] font-black tracking-widest text-white border border-white/40 px-2 py-0.5 rounded uppercase">
                  BLACK BOX
                </div>

                {/* THE LIQUID CORE (Animated Meniscus Height & Multi-Stop Radial Gradient) */}
                <motion.div
                  initial={false}
                  animate={{ 
                    height: '86%'
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative w-full overflow-hidden"
                  style={{
                    background: `radial-gradient(ellipse at 50% 20%, ${selectedBase.color}FF 0%, ${selectedBase.waveColor || selectedBase.color}EE 65%, #180D0E 100%)`
                  }}
                >
                  {/* Liquid Curved Meniscus Wave Top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-5 opacity-60 shadow-inner"
                    style={{ backgroundColor: selectedBase.waveColor || '#EFE5CE' }}
                  />

                  {/* VISCOUS SAUCE DRIZZLES: Cascading with Organic Curves Down the Glass Walls */}
                  {selectedSauces.map((sauce, idx) => (
                    <motion.div
                      key={sauce.id}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 0.95 }}
                      exit={{ scaleY: 0 }}
                      transition={{ duration: 0.65, delay: idx * 0.12, ease: "easeOut" }}
                      className="absolute top-0 origin-top shadow-lg z-10 rounded-full"
                      style={{
                        backgroundColor: sauce.color,
                        width: `${10 + (idx % 2) * 3}px`,
                        height: `${68 + (idx * 9)}%`,
                        left: `${16 + (idx * 24)}%`,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
                      }}
                    >
                      {/* Sauce Droplet Bulge at the tip */}
                      <div 
                        className="absolute bottom-0 -left-1 -right-1 h-3.5 rounded-full"
                        style={{ backgroundColor: sauce.color }}
                      />
                    </motion.div>
                  ))}

                  {/* CRUNCH PARTICLES: Realistic Floating PNGs or Textured Morsels */}
                  {selectedCrunches.map((crunch, cIdx) => (
                    <motion.div
                      key={crunch.id}
                      initial={{ y: -30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.45, delay: cIdx * 0.08 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {[18, 38, 58, 76, 44, 64, 28, 72].map((topPos, pIdx) => (
                        <div
                          key={pIdx}
                          className="absolute shadow-md flex items-center justify-center overflow-hidden"
                          style={{
                            top: `${topPos}%`,
                            left: `${(pIdx * 12 + 12) % 78}%`,
                            transform: `rotate(${pIdx * 45}deg)`,
                            opacity: 0.9
                          }}
                        >
                          {crunch.iconPath ? (
                            <img src={crunch.iconPath} alt="" className="w-4 h-4 object-contain drop-shadow" />
                          ) : (
                            <div 
                              className="w-2.5 h-2.5 rounded-sm shadow-inner"
                              style={{ 
                                backgroundColor: crunch.color,
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 2px 3px rgba(0,0,0,0.5)'
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Thick Crystal Pedestal Base */}
                <div className="h-6 w-full bg-gradient-to-t from-white/35 via-white/10 to-transparent border-t border-white/20 z-20 pointer-events-none" />
              </div>

              {/* Cup Shadow on Bar Surface */}
              <div className="w-36 h-4 bg-black/80 rounded-full blur-md mt-1.5" />
            </div>

            {/* Current Shake Summary */}
            <div className="mt-5 text-center">
              <div className="text-xs font-bold text-white mb-1 flex items-center justify-center gap-1.5">
                <span>{selectedBase.name}</span>
                {selectedSauces.length > 0 && <span className="text-brand-red font-medium">+ {selectedSauces.length} صوص</span>}
                {selectedCrunches.length > 0 && <span className="text-brand-red font-medium">+ {selectedCrunches.length} كرانش</span>}
              </div>
              <p className="text-[11px] text-text-muted">المحرك البصري يتفاعل فوراً مع إضافاتك</p>
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN LUXURY STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            
            <div>
              {/* FIXED CLEAN SEGMENTED NAVIGATION TABS (No Overflow, Perfectly Responsive) */}
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

              {/* ================= TAB 1: BASE FLAVOR ================= */}
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
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-brand-red/15 border-brand-red shadow-md'
                              : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {b.iconPath ? (
                              <img src={b.iconPath} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20" />
                            ) : (
                              <div className="w-8 h-8 rounded-full shadow-inner border border-white/20 shrink-0" style={{ backgroundColor: b.color }} />
                            )}
                            <div>
                              <div className="font-bold text-sm text-text-light">{b.name}</div>
                              {b.desc && <div className="text-[11px] text-text-muted line-clamp-1">{b.desc}</div>}
                            </div>
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

              {/* ================= TAB 2: SAUCES ================= */}
              {activeTab === 'sauces' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
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
                            {s.iconPath ? (
                              <img src={s.iconPath} alt="" className="w-7 h-7 rounded-full object-cover border border-white/20" />
                            ) : (
                              <div className="w-7 h-7 rounded-full shadow-md shrink-0" style={{ backgroundColor: s.color }} />
                            )}
                            <span className="font-bold text-sm text-text-light">{s.name}</span>
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

              {/* ================= TAB 3: CRUNCH ================= */}
              {activeTab === 'crunch' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
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
                            {c.iconPath ? (
                              <img src={c.iconPath} alt="" className="w-7 h-7 object-contain drop-shadow" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg shadow-md flex items-center justify-center bg-white/10 border border-white/10 shrink-0">
                                <Cookie size={14} className="text-amber-400" />
                              </div>
                            )}
                            <span className="font-bold text-sm text-text-light">{c.name}</span>
                          </div>
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

              {/* ================= TAB 4: TOPPINGS ================= */}
              {activeTab === 'toppings' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
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
                            {t.iconPath ? (
                              <img src={t.iconPath} alt="" className="w-7 h-7 object-contain drop-shadow" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                <Crown size={14} className="text-amber-400" />
                              </div>
                            )}
                            <span className="font-bold text-sm text-text-light">{t.name}</span>
                          </div>
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
