import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Plus, RefreshCw, ShoppingBag, Flame } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

// Pre-defined Flavor & Ingredient Definitions with realistic CSS/SVG visualization presets
export const SHAKE_BASES = [
  { id: 'vanilla', name: 'فانيليا كلاسيك', nameEn: 'Classic Vanilla', color: '#FBF5E8', waveColor: '#EFE5CE', price: 0, desc: 'آيس كريم فانيليا غني وفائق النعومة' },
  { id: 'chocolate', name: 'شوكولاتة بلجيكية', nameEn: 'Belgian Chocolate', color: '#4A2C1D', waveColor: '#361D11', price: 10, desc: 'كاكاو بلجيكي أصلي فاخر' },
  { id: 'strawberry', name: 'فراولة طبيعية', nameEn: 'Fresh Strawberry', color: '#E84D74', waveColor: '#CE355C', price: 10, desc: 'بيوريه فراولة طازج ومنعش' },
  { id: 'lotus_base', name: 'قاعدة زبدة اللوتس', nameEn: 'Lotus Biscoff Base', color: '#D68A36', waveColor: '#B86F20', price: 20, desc: 'طعم بسكويت اللوتس المكرمل الأصلي' },
  { id: 'pistachio', name: 'بستاشيو إيطالي', nameEn: 'Italian Pistachio', color: '#8FB87A', waveColor: '#759D60', price: 30, desc: 'فستق إيطالي محمص غني' },
];

export const SHAKE_SAUCES = [
  { id: 'sauce_lotus', name: 'شلال صوص اللوتس', nameEn: 'Lotus Drizzle', color: '#C87A24', price: 20 },
  { id: 'sauce_nutella', name: 'شلال شوكولاتة نوتيلا', nameEn: 'Nutella Fudge Drizzle', color: '#2B150A', price: 25 },
  { id: 'sauce_strawberry', name: 'صوص فراولة فريش', nameEn: 'Strawberry Glaze', color: '#C01E42', price: 15 },
  { id: 'sauce_caramel', name: 'كراميل مملح سائل', nameEn: 'Salted Caramel Drip', color: '#B86B1E', price: 20 },
  { id: 'sauce_white_choco', name: 'شوكولاتة بيضاء ناعمة', nameEn: 'White Chocolate', color: '#F4ECE1', price: 20 },
];

export const SHAKE_CRUNCH = [
  { id: 'crunch_oreo', name: 'أوريو مكسر مقرمش', nameEn: 'Crushed Oreo Bits', color: '#1B1718', price: 15 },
  { id: 'crunch_lotus', name: 'بسكويت لوتس مطحون', nameEn: 'Biscoff Crumbles', color: '#CE8430', price: 15 },
  { id: 'crunch_brownies', name: 'مكعبات براونيز فادج', nameEn: 'Fudge Brownie Chunks', color: '#3A1E11', price: 25 },
  { id: 'crunch_nuts', name: 'مكسرات محمصة مقرمشة', nameEn: 'Roasted Nuts Mix', color: '#9B6B38', price: 20 },
];

export const SHAKE_TOPPINGS = [
  { id: 'top_cream', name: 'قمة كريمة مخفوقة فاخرة', nameEn: 'Whipped Cream Mountain', price: 15 },
  { id: 'top_whole_oreo', name: 'بسكويتة أوريو كاملة بالقمة', nameEn: 'Whole Oreo Crown', price: 10 },
  { id: 'top_whole_lotus', name: 'بسكويتة لوتس كاملة', nameEn: 'Whole Biscoff Biscuit', price: 10 },
  { id: 'top_wafer', name: 'رول ويفر شوكولاتة', nameEn: 'Chocolate Wafer Roll', price: 10 },
];

export default function ShakeLabModal({ isOpen, onClose, baseProduct, menuData }) {
  const { lang } = useLanguage();
  const { addToCart } = useCart();

  // Selected Customization State
  const [selectedBase, setSelectedBase] = useState(SHAKE_BASES[0]);
  const [selectedSauces, setSelectedSauces] = useState([SHAKE_SAUCES[0]]);
  const [selectedCrunches, setSelectedCrunches] = useState([SHAKE_CRUNCH[0]]);
  const [selectedToppings, setSelectedToppings] = useState([SHAKE_TOPPINGS[0]]);
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
    setSelectedBase(SHAKE_BASES[0]);
    setSelectedSauces([]);
    setSelectedCrunches([]);
    setSelectedToppings([]);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    // Build human-readable modifier list
    const modifiersList = [
      { id: `base_${selectedBase.id}`, name: `قاعدة: ${selectedBase.name}`, nameEn: `Base: ${selectedBase.nameEn}`, price: selectedBase.price },
      ...selectedSauces.map(s => ({ id: s.id, name: s.name, nameEn: s.nameEn, price: s.price })),
      ...selectedCrunches.map(c => ({ id: c.id, name: c.name, nameEn: c.nameEn, price: c.price })),
      ...selectedToppings.map(t => ({ id: t.id, name: t.name, nameEn: t.nameEn, price: t.price }))
    ];

    const customizedProduct = {
      ...(baseProduct || {}),
      id: baseProduct?.id || 9999,
      name: lang === 'en' ? 'Custom Shake (The Shake Lab)' : 'ميلك شيك مخصص (مختبر بلاك بوكس)',
      nameEn: 'Custom Shake (The Shake Lab)',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black-primary/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-black-surface border border-brand-red-dark/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black-primary/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-red/15 text-brand-red flex items-center justify-center border border-brand-red/30">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-2 py-0.5 rounded">
                  THE BLACK BOX LAB
                </span>
                <span className="text-xs text-text-muted">| تفاعلي لايف</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-text-light">
                {lang === 'en' ? 'Build Your Milkshake' : 'مختبر الميلك شيك: اصنع مشروبك بنفسك'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors text-xs flex items-center gap-1"
              title="إعادة ضبط"
            >
              <RefreshCw size={15} />
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

        {/* Main Content: Split Desktop / Stacked Mobile */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          
          {/* ===================== LEFT/TOP: LIVE CUP PREVIEW ===================== */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-black-primary via-[#111115] to-black-primary p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-l md:border-white/10">
            
            {/* Ambient Back Glow */}
            <div 
              className="absolute w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-700 pointer-events-none"
              style={{ backgroundColor: selectedBase.color }}
            />

            {/* THE VISUAL GLASS CUP */}
            <div className="relative w-52 h-72 flex items-end justify-center">
              
              {/* Cup Exterior Outline & Glass Highlights */}
              <div className="absolute inset-x-4 bottom-0 top-12 rounded-b-[40px] border-2 border-white/25 bg-white/5 backdrop-blur-xs overflow-hidden shadow-2xl z-20 pointer-events-none">
                {/* Glass Reflection Stripes */}
                <div className="absolute top-0 right-4 bottom-0 w-3 bg-gradient-to-b from-white/30 via-white/10 to-transparent transform -skew-x-6" />
                <div className="absolute top-0 left-6 bottom-0 w-1.5 bg-gradient-to-b from-white/20 to-transparent" />
                
                {/* Brand Logo Stamp on Cup Glass */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 flex flex-col items-center select-none pointer-events-none">
                  <span className="text-[10px] font-black tracking-widest text-white">THE BLACK BOX</span>
                  <div className="w-12 h-0.5 bg-brand-red my-0.5" />
                  <span className="text-[8px] tracking-wider text-gray-300">SHAKE LAB</span>
                </div>
              </div>

              {/* Cup Rim Top Oval */}
              <div className="absolute top-10 inset-x-4 h-6 rounded-full border-2 border-white/40 bg-white/10 z-30 pointer-events-none shadow-inner" />

              {/* Straw */}
              <motion.div 
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="absolute -top-4 right-10 w-3 h-48 bg-gradient-to-r from-brand-red via-red-400 to-brand-red rounded-full transform rotate-12 shadow-md z-15 pointer-events-none border border-red-900"
              />

              {/* ================= LAYER 1: BASE LIQUID ================= */}
              <div className="absolute inset-x-5 bottom-1 top-14 rounded-b-[38px] overflow-hidden z-10">
                <motion.div 
                  key={selectedBase.id}
                  initial={{ height: '0%' }}
                  animate={{ height: '88%' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute bottom-0 inset-x-0 transition-colors duration-500"
                  style={{ backgroundColor: selectedBase.color }}
                >
                  {/* Liquid Wave Ripple effect */}
                  <div 
                    className="absolute -top-3 inset-x-0 h-6 rounded-full opacity-60"
                    style={{ backgroundColor: selectedBase.waveColor }}
                  />

                  {/* ================= LAYER 2: DRIZZLED SAUCES ================= */}
                  <AnimatePresence>
                    {selectedSauces.map((sauce) => (
                      <motion.div
                        key={sauce.id}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 pointer-events-none origin-top"
                      >
                        {/* Drip Streams on walls */}
                        <div 
                          className="absolute top-0 left-2 w-3.5 h-36 rounded-b-full shadow-inner opacity-90"
                          style={{ backgroundColor: sauce.color }}
                        />
                        <div 
                          className="absolute top-0 right-3 w-4 h-44 rounded-b-full shadow-inner opacity-90"
                          style={{ backgroundColor: sauce.color }}
                        />
                        <div 
                          className="absolute top-0 left-12 w-2.5 h-24 rounded-b-full shadow-inner opacity-85"
                          style={{ backgroundColor: sauce.color }}
                        />
                        <div 
                          className="absolute top-0 right-14 w-3 h-32 rounded-b-full shadow-inner opacity-85"
                          style={{ backgroundColor: sauce.color }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* ================= LAYER 3: CRUMBLES & MIX-INS ================= */}
                  <AnimatePresence>
                    {selectedCrunches.map((crunch) => (
                      <motion.div
                        key={crunch.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        {/* Dispersed Cookie Chunks */}
                        <div className="absolute top-10 left-6 w-3 h-3 rounded-full opacity-80" style={{ backgroundColor: crunch.color }} />
                        <div className="absolute top-16 right-8 w-4 h-3 rounded-sm opacity-90" style={{ backgroundColor: crunch.color }} />
                        <div className="absolute top-24 left-10 w-2.5 h-2.5 rounded-full opacity-75" style={{ backgroundColor: crunch.color }} />
                        <div className="absolute top-32 right-12 w-3.5 h-3.5 rounded-sm opacity-85" style={{ backgroundColor: crunch.color }} />
                        <div className="absolute top-36 left-4 w-3 h-2 rounded-full opacity-80" style={{ backgroundColor: crunch.color }} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* ================= LAYER 4: WHIPPED CREAM & CROWN ================= */}
              {selectedToppings.some(t => t.id === 'top_cream') && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  className="absolute top-3 inset-x-6 h-16 z-25 pointer-events-none"
                >
                  {/* Fluffy Whipped Cream Swirl */}
                  <div className="w-full h-full relative flex justify-center">
                    <div className="w-32 h-14 bg-gradient-to-t from-gray-200 via-white to-gray-100 rounded-full shadow-lg border border-white/60" />
                    <div className="absolute -top-3 w-20 h-10 bg-white rounded-full shadow-sm" />
                    <div className="absolute -top-5 w-10 h-7 bg-white rounded-full shadow-xs" />
                  </div>
                </motion.div>
              )}

              {/* Whole Oreo / Lotus Biscuit sticking out */}
              {selectedToppings.some(t => t.id === 'top_whole_oreo') && (
                <motion.div 
                  initial={{ rotate: -45, y: -30, opacity: 0 }}
                  animate={{ rotate: -25, y: 0, opacity: 1 }}
                  className="absolute -top-6 left-6 w-12 h-12 rounded-full bg-[#1A1A1A] border-4 border-[#111111] shadow-2xl flex items-center justify-center z-35"
                >
                  <span className="text-[7px] font-black text-gray-400">OREO</span>
                </motion.div>
              )}

              {selectedToppings.some(t => t.id === 'top_whole_lotus') && (
                <motion.div 
                  initial={{ rotate: 30, y: -30, opacity: 0 }}
                  animate={{ rotate: 18, y: 0, opacity: 1 }}
                  className="absolute -top-7 right-8 w-8 h-14 rounded-md bg-[#B4671D] border-2 border-[#8E4D0C] shadow-2xl flex items-center justify-center z-35"
                >
                  <span className="text-[7px] font-bold text-amber-200 rotate-90">LOTUS</span>
                </motion.div>
              )}

              {selectedToppings.some(t => t.id === 'top_wafer') && (
                <motion.div 
                  initial={{ rotate: -35, y: -20, opacity: 0 }}
                  animate={{ rotate: -15, y: 0, opacity: 1 }}
                  className="absolute -top-8 right-16 w-3 h-20 rounded-full bg-[#5C3218] border border-[#3E1D0A] shadow-xl z-34"
                />
              )}
            </div>

            {/* Live Status Pill */}
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red font-bold text-xs">
                <Flame size={13} />
                <span>{selectedBase.name}</span>
                {selectedSauces.length > 0 && <span>+ {selectedSauces.length} صوص</span>}
                {selectedCrunches.length > 0 && <span>+ {selectedCrunches.length} كرانش</span>}
              </span>
            </div>
          </div>

          {/* ===================== RIGHT/BOTTOM: STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-5 sm:p-7 flex flex-col justify-between">
            
            <div>
              {/* Category Step Navigation Tabs */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-6 bg-black-primary/60 p-1.5 rounded-2xl border border-white/5">
                {[
                  { id: 'base', label: '1. القاعدة', count: 1 },
                  { id: 'sauces', label: '2. الصوصات', count: selectedSauces.length },
                  { id: 'crunch', label: '3. المقرمشات', count: selectedCrunches.length },
                  { id: 'toppings', label: '4. التوبينج', count: selectedToppings.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                      activeTab === tab.id
                        ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-black/30 text-white' : 'bg-brand-red/20 text-brand-red'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ================= TAB 1: BASE FLAVOR ================= */}
              {activeTab === 'base' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">اختر طعم وقاعدة الآيسكريم المفضلة (إجباري):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SHAKE_BASES.map((b) => {
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
                              <div className="text-[11px] text-text-muted">{b.desc}</div>
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
                    {SHAKE_SAUCES.map((s) => {
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
                    <span className="text-xs text-text-muted font-bold">أضف القرمشة ومكعبات الحلويات المفضلة داخل المشروب:</span>
                    <span className="text-xs text-brand-red font-bold">{selectedCrunches.length} محددة</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SHAKE_CRUNCH.map((c) => {
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
                            <div className="w-7 h-7 rounded-lg shadow-md flex items-center justify-center text-[10px]" style={{ backgroundColor: c.color }}>
                              🍪
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
                    <span className="text-xs text-text-muted font-bold">تتويج المشروب: الكريمة المخفوقة والبسكويت الكامل على القمة:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SHAKE_TOPPINGS.map((t) => {
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
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
                              👑
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
                    <span>تمت الإضافة للسلة بنجاح!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    <span>أضف مشروبي للسلة</span>
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
