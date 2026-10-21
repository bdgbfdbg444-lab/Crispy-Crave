import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Beef, Sparkles, Check, X, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';

// Default Fallback Elements if POS addons not configured
const DEFAULT_BURGER_BUNS = [
  { id: 'bun_brioche', name: 'خبز بريوش محمص بالزبدة', nameEn: 'Buttered Brioche Bun', price: 0, color: '#C4883E', desc: 'طري وذهبي غني بنكهة الزبدة الطبيعية' },
  { id: 'bun_sesame', name: 'خبز كلاسيكي بالسمسم', nameEn: 'Classic Sesame Bun', price: 0, color: '#D4A373', desc: 'الخبز الكلاسيكي الهش بحبات السمسم المحمصة' },
  { id: 'bun_potato', name: 'خبز البطاطس الفاخر', nameEn: 'Golden Potato Roll', price: 15, color: '#E09F3E', desc: 'قوام فائق الطراوة يمتص العصارة بمثالية' }
];

const DEFAULT_BURGER_SAUCES = [
  { id: 'sauce_blackbox', name: 'صوص بلاك بوكس الخاص', nameEn: 'Signature Black Box Sauce', price: 15, color: '#9B2226', desc: 'مزيج مدخن حار قليلاً مع نكهة المستردة والتوابل' },
  { id: 'sauce_cheddar', name: 'شيدر صوص ذائب', nameEn: 'Melted Cheddar Sauce', price: 20, color: '#E9D8A6', desc: 'جبنة شيدر إنجليزية دافئة وكريمية' },
  { id: 'sauce_smoky_bbq', name: 'باربيكيو تكساس المدخن', nameEn: 'Texas Smoked BBQ', price: 15, color: '#582F0E', desc: 'صوص خشب الحطب العتيق مع حلاوة السكر البني' },
  { id: 'sauce_truffle_mayo', name: 'مايونيز الكمأة (Truffle)', nameEn: 'Truffle Mayo', price: 25, color: '#DDA15E', desc: 'نكهة أرستقراطية فاخرة بزيت الكمأة الأصلي' },
  { id: 'sauce_ranch', name: 'رانش الأعشاب الريفية', nameEn: 'Herb Ranch Sauce', price: 15, color: '#F4F1DE', desc: 'منعش وغني بأعشاب الشبت والثوم المعمر' }
];

const DEFAULT_BURGER_CRUNCH = [
  { id: 'crunch_bacon', name: 'شرائح بيكون بقري مقرمش', nameEn: 'Crispy Beef Bacon', price: 30, color: '#800F2F' },
  { id: 'crunch_onion', name: 'بصل مكرمل بالبلسمك', nameEn: 'Caramelized Balsamic Onions', price: 15, color: '#4A0E17' },
  { id: 'crunch_pickles', name: 'خيار مخلل مقرمش شيبس', nameEn: 'Crispy Dill Pickles', price: 10, color: '#2D6A4F' },
  { id: 'crunch_jalapeno', name: 'هالبينو مدخن مشوي', nameEn: 'Smoked Grilled Jalapeños', price: 15, color: '#1B4332' }
];

const DEFAULT_BURGER_TOPPINGS = [
  { id: 'top_extra_patty', name: 'شريحة سماش أنجوس إضافية (150g)', nameEn: 'Extra Angus Smash Patty (150g)', price: 65, color: '#3E1F17' },
  { id: 'top_smoked_brisket', name: 'بريسكت مدخن 12 ساعة (100g)', nameEn: '12-hr Smoked Brisket (100g)', price: 85, color: '#4A1F18' },
  { id: 'top_extra_cheddar', name: 'شريحة جبنة شيدر حمراء مزدوجة', nameEn: 'Double Red Cheddar Slice', price: 20, color: '#F77F00' },
  { id: 'top_mozzarella_patty', name: 'قرص موتزاريلا مقلي مقرمش', nameEn: 'Deep-fried Mozzarella Patty', price: 45, color: '#FDF0D5' }
];

export default function BurgerLabModal({ isOpen, onClose, baseProduct, menuData }) {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const { addToCart } = useCart();

  // Extract real AddOns from POS if available
  const { burgerBuns, burgerSauces, burgerCrunches, burgerToppings } = useMemo(() => {
    const posAddOns = menuData?.addOns || [];

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
  }, [menuData]);

  // Selected Customization State
  const [selectedBun, setSelectedBun] = useState(burgerBuns[0] || DEFAULT_BURGER_BUNS[0]);
  const [selectedSauces, setSelectedSauces] = useState([burgerSauces[0] || DEFAULT_BURGER_SAUCES[0]]);
  const [selectedCrunches, setSelectedCrunches] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [activeTab, setActiveTab] = useState('bun'); // 'bun' | 'sauces' | 'crunch' | 'toppings'
  const [isSuccessBurger, setIsSuccessBurger] = useState(false);

  // Base price from product or standard 140 EGP
  const initialBasePrice = Number(baseProduct?.sellingPrice) || 140;

  // Calculate live total price
  const totalPrice = useMemo(() => {
    let sum = initialBasePrice;
    sum += selectedBun?.price || 0;
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
      { id: `bun_${selectedBun.id}`, name: isEn ? `Bun: ${selectedBun.nameEn || selectedBun.name}` : `الخبز: ${selectedBun.name}`, nameEn: `Bun: ${selectedBun.nameEn || selectedBun.name}`, price: selectedBun.price },
      ...selectedSauces.map(s => ({ id: s.id, name: isEn ? (s.nameEn || s.name) : s.name, nameEn: s.nameEn || s.name, price: s.price })),
      ...selectedCrunches.map(c => ({ id: c.id, name: isEn ? (c.nameEn || c.name) : c.name, nameEn: c.nameEn || c.name, price: c.price })),
      ...selectedToppings.map(t => ({ id: t.id, name: isEn ? (t.nameEn || t.name) : t.name, nameEn: t.nameEn || t.name, price: t.price }))
    ];

    const customizedProduct = {
      ...(baseProduct || {}),
      id: baseProduct?.id || 8888,
      name: isEn ? (baseProduct?.nameEn || 'Artisanal Custom Sandwich') : (baseProduct?.name || 'تخصيص الساندوتش'),
      nameEn: baseProduct?.nameEn || 'Artisanal Custom Sandwich',
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

  const curr = isEn ? 'EGP' : 'ج.م';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir={isEn ? 'ltr' : 'rtl'}>
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
              <Beef size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-text-light">
                {isEn ? (baseProduct?.nameEn || baseProduct?.name || 'Build Your Sandwich') : (baseProduct?.name || baseProduct?.nameEn || 'تخصيص الساندوتش')}
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

        {/* Modal Body: Two Column Clean Layout (No Cartoon Simulator) */}
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
                  {(selectedBun ? 1 : 0) + selectedSauces.length + selectedCrunches.length + selectedToppings.length} {isEn ? 'Items' : 'مكونات'}
                </span>
              </div>

              {/* Selected Bun Showcase Card */}
              {selectedBun && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4 flex items-center gap-3">
                  {selectedBun.iconPath ? (
                    <img 
                      src={selectedBun.iconPath} 
                      alt={selectedBun.name} 
                      className="w-14 h-14 rounded-xl object-cover border border-white/15 shadow-md shrink-0" 
                    />
                  ) : (
                    <div 
                      className="w-14 h-14 rounded-xl shadow-inner border border-white/15 flex items-center justify-center shrink-0 bg-amber-900/30"
                    >
                      <Beef size={22} className="text-amber-400 opacity-90" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-brand-red uppercase">
                      {isEn ? 'SELECTED BUN' : 'نوع الخبز'}
                    </div>
                    <div className="font-bold text-sm text-white truncate">
                      {isEn && selectedBun.nameEn ? selectedBun.nameEn : selectedBun.name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {selectedBun.price > 0 ? `+${selectedBun.price} ${curr}` : (isEn ? 'Included in base price' : 'مشمول في السعر')}
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Additions List */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase mb-1">
                  <span>{isEn ? 'Active Sauces & Toppings:' : 'الصوصات والإضافات المختارة:'}</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {selectedSauces.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color || '#E63946' }}></span>
                        <span className="text-white truncate">{isEn && s.nameEn ? s.nameEn : s.name}</span>
                      </div>
                      <span className="text-brand-red font-bold shrink-0">{s.price > 0 ? `+${s.price}` : (isEn ? 'Free' : 'مجاناً')}</span>
                    </div>
                  ))}
                  {selectedCrunches.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                        <span className="text-white truncate">{isEn && c.nameEn ? c.nameEn : c.name}</span>
                      </div>
                      <span className="text-brand-red font-bold shrink-0">{c.price > 0 ? `+${c.price}` : (isEn ? 'Free' : 'مجاناً')}</span>
                    </div>
                  ))}
                  {selectedToppings.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                        <span className="text-white truncate">{isEn && t.nameEn ? t.nameEn : t.name}</span>
                      </div>
                      <span className="text-brand-red font-bold shrink-0">+{t.price}</span>
                    </div>
                  ))}
                  {selectedSauces.length === 0 && selectedCrunches.length === 0 && selectedToppings.length === 0 && (
                    <div className="p-3 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted">
                      {isEn ? 'No extra additions selected' : 'لم تختر إضافات إضافية'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Live Price Summary */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>{isEn ? 'Base Item:' : 'الصنف الأساسي:'}</span>
                <span className="font-bold text-white">{initialBasePrice} {curr}</span>
              </div>
              {totalPrice > initialBasePrice && (
                <div className="flex items-center justify-between text-xs text-brand-red mb-2">
                  <span>{isEn ? 'Custom Additions:' : 'إضافات التخصيص:'}</span>
                  <span className="font-bold">+{totalPrice - initialBasePrice} {curr}</span>
                </div>
              )}
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Segmented Step Tabs */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-6 bg-black-primary/70 p-1.5 rounded-2xl border border-white/10">
                {[
                  { id: 'bun', label: isEn ? '1. Bun' : '1. الخبز', count: 1 },
                  { id: 'sauces', label: isEn ? '2. Sauces' : '2. الصوصات', count: selectedSauces.length },
                  { id: 'crunch', label: isEn ? '3. Veggies' : '3. الإضافات', count: selectedCrunches.length },
                  { id: 'toppings', label: isEn ? '4. Premium' : '4. لحوم وأجبان', count: selectedToppings.length },
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
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose Bun Type (Required):' : 'اختر نوع الخبز المفضل:'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {burgerBuns.map((bun) => {
                      const isSelected = selectedBun?.id === bun.id;
                      return (
                        <div
                          key={bun.id}
                          onClick={() => setSelectedBun(bun)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-brand-red/15 border-brand-red shadow-md'
                              : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: bun.color || '#C4883E' }}>
                              <Beef size={20} className="text-black/80" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-text-light">{isEn && bun.nameEn ? bun.nameEn : bun.name}</div>
                              {bun.desc && <div className="text-[11px] text-text-muted">{bun.desc}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-brand-red">
                              {bun.price > 0 ? `+${bun.price} ${curr}` : (isEn ? 'Included' : 'مشمول')}
                            </span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'border-white/20'}`}>
                              {isSelected && <Check size={12} />}
                            </div>
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
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose Gourmet Sauces (Optional):' : 'اختر صوصات البرجر الذائبة (اختياري):'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">{selectedSauces.length} {isEn ? 'Selected' : 'محددة'}</span>
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
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-4 h-4 rounded-full shadow-md shrink-0" style={{ backgroundColor: s.color || '#E63946' }} />
                            <div className="truncate">
                              <div className="font-bold text-sm text-text-light truncate">{isEn && s.nameEn ? s.nameEn : s.name}</div>
                              {s.desc && <div className="text-[10px] text-text-muted truncate">{s.desc}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-brand-red">+{s.price} {curr}</span>
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
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Add Veggies & Crunches:' : 'أضف الخضار والمقرمشات المشوية داخل الساندوتش:'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">{selectedCrunches.length} {isEn ? 'Selected' : 'محددة'}</span>
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
                          <span className="font-bold text-sm text-text-light truncate">{isEn && c.nameEn ? c.nameEn : c.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-brand-red">+{c.price} {curr}</span>
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
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Double Up Meats & Artisan Cheeses:' : 'مضاعفة اللحوم والأجبان الفاخرة:'}
                    </span>
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
                          <span className="font-bold text-sm text-text-light truncate">{isEn && t.nameEn ? t.nameEn : t.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-brand-red">+{t.price} {curr}</span>
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
                <span className="text-xs text-text-muted block font-medium">
                  {isEn ? 'Total Customized Price:' : 'سعر الساندوتش المخصص:'}
                </span>
                <div className="text-2xl font-black text-white flex items-baseline gap-1">
                  <span>{totalPrice}</span>
                  <span className="text-sm text-brand-red font-bold">{curr}</span>
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
                    <span>{isEn ? 'Added to order!' : 'تمت الإضافة للطلب بنجاح!'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>{isEn ? 'Add to order' : 'إضافة الساندوتش للطلب'}</span>
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
