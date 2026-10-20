import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, RefreshCw, Layers, Droplet, Cookie, Crown, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';

// ============================================================================
// GOURMET RECIPE PRESETS (Directly matching restaurant kitchen recipes)
// 1. Base Recipe: Vanilla Ice Cream + Fresh Milk + Whipped Cream
// 2. Customizer Inclusions: Chocolate, Caramel, Lotus, Pistachio, Peanut Butter,
//    Strawberry, Cherry Filling, Banana, Oreo, Coffee.
// ============================================================================

export const DEFAULT_SHAKE_BASES = [
  { 
    id: 'vanilla', 
    name: 'قاعدة فانيليا كلاسيك', 
    nameEn: 'Classic Vanilla Base', 
    desc: 'الوصفة الأصلية: آيس كريم فانيليا فاخر مع حليب طازج نقي', 
    color: '#FBF6E9', 
    waveColor: '#F3E8CD',
    shadowColor: '#E2D4B5',
    price: 0 
  },
  { 
    id: 'coffee', 
    name: 'إسبريسو كولد كوفي', 
    nameEn: 'Cold Espresso Coffee', 
    desc: 'قهوة إسبريسو مركزة ممتزجة مع آيس كريم الفانيليا والحليب', 
    color: '#4A2C1D', 
    waveColor: '#3A2013', 
    shadowColor: '#28140B',
    price: 15 
  },
  { 
    id: 'strawberry_base', 
    name: 'فراولة طبيعية طازجة', 
    nameEn: 'Fresh Strawberry Shake', 
    desc: 'بيوريه فراولة مزارع طبيعي ممزوج مع الحليب والآيس كريم', 
    color: '#EB6B8B', 
    waveColor: '#D44D71', 
    shadowColor: '#AA2B4D',
    price: 15 
  },
  { 
    id: 'banana_base', 
    name: 'موز بيوريه طبيعي', 
    nameEn: 'Fresh Banana Shake', 
    desc: 'موز طازج طبيعي مضروب مع الحليب والآيس كريم الغني', 
    color: '#F5E3A9', 
    waveColor: '#E4CF85', 
    shadowColor: '#C4AE60',
    price: 15 
  },
];

export const DEFAULT_SHAKE_SAUCES = [
  { id: 'sauce_chocolate', name: 'صوص شوكولاتة داكنة', nameEn: 'Dark Chocolate Fudge', color: '#26130B', price: 20 },
  { id: 'sauce_caramel', name: 'صوص كراميل دافئ', nameEn: 'Warm Salted Caramel', color: '#B86B1E', price: 20 },
  { id: 'sauce_lotus', name: 'زبدة لوتس أصلية سائلة', nameEn: 'Lotus Biscoff Spread', color: '#C67828', price: 25 },
  { id: 'sauce_pistachio', name: 'زبدة بستاشيو إيطالية', nameEn: 'Sicilian Pistachio Spread', color: '#7A9A5B', price: 30 },
  { id: 'sauce_peanut', name: 'زبدة فول سوداني كريمية', nameEn: 'Creamy Peanut Butter', color: '#C07E38', price: 20 },
];

export const DEFAULT_SHAKE_CRUNCH = [
  { id: 'crunch_oreo', name: 'قطع أوريو مقرمشة', nameEn: 'Crushed Oreo Bits', color: '#1A1A1A', price: 15 },
  { id: 'fill_cherry', name: 'حشوة كرز ياقوتية فاخرة', nameEn: 'Ruby Cherry Filling', color: '#7E0B1E', price: 25 },
  { id: 'chunk_banana', name: 'قطع موز طازج', nameEn: 'Fresh Banana Chunks', color: '#F7DC78', price: 15 },
  { id: 'puree_strawberry', name: 'قطع فراولة فريش', nameEn: 'Fresh Strawberry Chunks', color: '#D92546', price: 15 },
];

export const DEFAULT_SHAKE_TOPPINGS = [
  { id: 'top_cream', name: 'جبل كريمة مخفوقة فاخرة', nameEn: 'Whipped Cream Mountain', price: 15 },
  { id: 'top_whole_oreo', name: 'بسكويتة أوريو كاملة بالقمة', nameEn: 'Whole Oreo Crown', price: 10 },
  { id: 'top_cherry', name: 'تتويج كرزة ياقوتية ملكية', nameEn: 'Royal Glazed Cherry', price: 10 },
  { id: 'top_whole_lotus', name: 'بسكويتة لوتس أصلية كاملة', nameEn: 'Whole Biscoff Biscuit', price: 10 },
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
        item.waveColor = a.visualColor || '#F3E8CD';
        bases.push(item);
      } else if (role === 'sauce') {
        sauces.push(item);
      } else if (role === 'crunch') {
        crunches.push(item);
      } else if (role === 'topping') {
        toppings.push(item);
      } else {
        // Fallback by name keywords if not explicitly categorized
        if (name.includes('صوص') || name.includes('شلال') || name.includes('sauce') || name.includes('كراميل') || name.includes('فادج') || name.includes('زبدة')) {
          sauces.push(item);
        } else if (name.includes('أوريو') || name.includes('كرانش') || name.includes('كرز') || name.includes('موز') || name.includes('فراولة') || name.includes('بسكويت')) {
          crunches.push(item);
        } else if (name.includes('كريمة') || name.includes('توبينج') || name.includes('قمة') || name.includes('تتويج')) {
          toppings.push(item);
        } else if (name.includes('قاعدة') || name.includes('آيس') || name.includes('فانيليا') || name.includes('قهوة') || name.includes('إسبريسو')) {
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

  // Feature flags for visual toppings
  const hasWhippedCream = selectedToppings.some(t => t.id.includes('cream') || t.name.includes('كريمة'));
  const hasWholeOreo = selectedToppings.some(t => t.id.includes('oreo') || t.name.includes('أوريو'));
  const hasWholeLotus = selectedToppings.some(t => t.id.includes('lotus') || t.name.includes('لوتس'));
  const hasCherryCrown = selectedToppings.some(t => t.id.includes('cherry') || t.name.includes('كرز'));

  // Crunches flags
  const hasOreoBits = selectedCrunches.some(c => c.id.includes('oreo') || c.name.includes('أوريو'));
  const hasCherryFilling = selectedCrunches.some(c => c.id.includes('cherry') || c.name.includes('كرز'));
  const hasBananaChunks = selectedCrunches.some(c => c.id.includes('banana') || c.name.includes('موز'));
  const hasStrawberryChunks = selectedCrunches.some(c => c.id.includes('strawberry') || c.name.includes('فراولة'));

  // Primary sauce color for drizzle over cream
  const topSauceColor = selectedSauces.length > 0 ? selectedSauces[0].color : null;

  // Cup asset path (works in dev and in GitHub Pages subpath)
  const cupAssetUrl = `${import.meta.env.BASE_URL}images/the_black_box_cup_overlay.webp`;

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
          
          {/* ===================== LEFT: REAL BRANDED CUP SIMULATOR ===================== */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-[#0A0A0D] via-[#101015] to-[#0A0A0D] p-3 sm:p-5 md:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-white/10 relative overflow-hidden select-none shrink-0">
            
            {/* Ambient Gastronomic Spotlight Glow */}
            <div 
              className="absolute w-72 h-72 rounded-full blur-[90px] opacity-25 pointer-events-none transition-colors duration-700"
              style={{ backgroundColor: selectedBase.color }}
            />

            {/* THE VISUAL CUP STAGE (Uses exact coordinates of the user's branded cup) */}
            <div className="relative w-44 sm:w-56 md:w-64 h-[270px] sm:h-[350px] md:h-[430px] flex items-center justify-center">
              
              <svg 
                viewBox="0 0 460 1024" 
                className="w-full h-full drop-shadow-2xl overflow-visible select-none"
              >
                <defs>
                  {/* Exact Conical Taper of The Black Box Cup */}
                  <clipPath id="innerCupClip">
                    <polygon points="56,335 404,335 344,825 116,825" />
                  </clipPath>

                  {/* Liquid Rich Radial Gradient */}
                  <radialGradient id="liquidDairyGrad" cx="50%" cy="35%" r="65%">
                    <stop offset="0%" stopColor={selectedBase.color} />
                    <stop offset="60%" stopColor={selectedBase.waveColor || selectedBase.color} />
                    <stop offset="100%" stopColor={selectedBase.shadowColor || '#2B150A'} />
                  </radialGradient>

                  {/* Sauce Highlight Gradient */}
                  <linearGradient id="sauceGlossHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                  </linearGradient>

                  {/* Whipped Cream Gradient */}
                  <linearGradient id="realCreamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="55%" stopColor="#F9F6F0" />
                    <stop offset="85%" stopColor="#EFE8DB" />
                    <stop offset="100%" stopColor="#D8CDBA" />
                  </linearGradient>
                </defs>

                {/* 1. LIQUID CORE (INSIDE CUP) */}
                <g clipPath="url(#innerCupClip)">
                  {/* Solid Creamy Liquid Base */}
                  <rect 
                    x="40" 
                    y="335" 
                    width="380" 
                    height="500" 
                    fill="url(#liquidDairyGrad)" 
                  />

                  {/* Soft Internal Meniscus / Froth Wave at top */}
                  <path 
                    d="M 50 338 Q 230 355, 410 338 L 410 352 Q 230 368, 50 352 Z" 
                    fill={selectedBase.waveColor || '#F3E8CD'} 
                    opacity="0.8" 
                  />

                  {/* Secondary Froth Highlight Ring */}
                  <ellipse cx="230" cy="344" rx="160" ry="8" fill="#FFFFFF" opacity="0.35" />

                  {/* VISCOUS SAUCE DRIZZLES RUNNING DOWN THE INNER GLASS WALLS */}
                  {selectedSauces.map((sauce, sIdx) => {
                    // Drip coordinates across cup width
                    const xPositions = [
                      { x: 95, length: 320, width: 22 },
                      { x: 165, length: 260, width: 18 },
                      { x: 255, length: 340, width: 24 },
                      { x: 330, length: 280, width: 20 },
                      { x: 210, length: 380, width: 26 }
                    ];
                    const pos = xPositions[sIdx % xPositions.length];
                    const dripEnd = 335 + pos.length;

                    return (
                      <g key={sauce.id} className="transition-all duration-500">
                        {/* Main Thick Drip River */}
                        <path 
                          d={`M ${pos.x - pos.width/2} 335 
                              Q ${pos.x - pos.width/2 - 2} ${dripEnd - 30}, ${pos.x - pos.width/2 - 4} ${dripEnd - 15}
                              A ${pos.width/2 + 4} ${pos.width/2 + 4} 0 0 0 ${pos.x + pos.width/2 + 4} ${dripEnd - 15}
                              Q ${pos.x + pos.width/2 + 2} ${dripEnd - 30}, ${pos.x + pos.width/2} 335 Z`}
                          fill={sauce.color}
                          opacity="0.95"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))"
                        />
                        {/* 3D Gloss Highlight Line down center of drip */}
                        <path 
                          d={`M ${pos.x - 2} 340 Q ${pos.x - 2} ${dripEnd - 25}, ${pos.x - 1} ${dripEnd - 16}`}
                          stroke="url(#sauceGlossHighlight)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                        />
                        {/* Bulbous tip droplet specular sheen */}
                        <circle cx={pos.x} cy={dripEnd - 12} r={pos.width/4} fill="#FFFFFF" opacity="0.4" />
                      </g>
                    );
                  })}

                  {/* SUSPENDED INCLUSIONS & CRUNCHES */}
                  {/* A: Oreo Cookie Crumble Bits */}
                  {hasOreoBits && (
                    <g className="transition-all duration-300">
                      {[
                        { cx: 120, cy: 430, r: 5, rot: 15 },
                        { cx: 180, cy: 510, r: 7, rot: 45 },
                        { cx: 290, cy: 460, r: 6, rot: 30 },
                        { cx: 330, cy: 590, r: 8, rot: 60 },
                        { cx: 140, cy: 660, r: 6, rot: 75 },
                        { cx: 270, cy: 720, r: 7, rot: 20 },
                        { cx: 210, cy: 760, r: 5, rot: 80 },
                        { cx: 170, cy: 400, r: 4, rot: 10 },
                        { cx: 310, cy: 680, r: 5, rot: 50 },
                        { cx: 240, cy: 420, r: 6, rot: 90 },
                      ].map((crumb, idx) => (
                        <g key={idx} transform={`rotate(${crumb.rot} ${crumb.cx} ${crumb.cy})`}>
                          {/* Dark crunchy cookie morsel */}
                          <rect 
                            x={crumb.cx - crumb.r} 
                            y={crumb.cy - crumb.r} 
                            width={crumb.r * 2} 
                            height={crumb.r * 2} 
                            rx={2} 
                            fill="#1B1718" 
                            stroke="#0D0B0C" 
                            strokeWidth="1" 
                          />
                          {/* White creme speckle */}
                          <circle cx={crumb.cx - 1} cy={crumb.cy - 1} r={crumb.r * 0.35} fill="#FFFFFF" opacity="0.85" />
                        </g>
                      ))}
                    </g>
                  )}

                  {/* B: Ruby Cherry Filling Pieces */}
                  {hasCherryFilling && (
                    <g className="transition-all duration-300">
                      {[
                        { cx: 150, cy: 480, r: 13 },
                        { cx: 300, cy: 530, r: 14 },
                        { cx: 190, cy: 690, r: 12 },
                        { cx: 260, cy: 620, r: 13 },
                      ].map((cherry, idx) => (
                        <g key={idx}>
                          {/* Cherry berry body */}
                          <circle cx={cherry.cx} cy={cherry.cy} r={cherry.r} fill="#7A081B" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))" />
                          <circle cx={cherry.cx} cy={cherry.cy} r={cherry.r - 2} fill="#9E0E27" />
                          {/* Glossy fruit highlight */}
                          <ellipse cx={cherry.cx - 4} cy={cherry.cy - 4} rx={3} ry={2} fill="#FFFFFF" opacity="0.75" />
                        </g>
                      ))}
                    </g>
                  )}

                  {/* C: Fresh Banana Chunks */}
                  {hasBananaChunks && (
                    <g className="transition-all duration-300">
                      {[
                        { cx: 160, cy: 450, r: 12, rot: 25 },
                        { cx: 280, cy: 490, r: 13, rot: -15 },
                        { cx: 160, cy: 620, r: 12, rot: 40 },
                        { cx: 290, cy: 690, r: 13, rot: -30 },
                      ].map((banana, idx) => (
                        <g key={idx} transform={`rotate(${banana.rot} ${banana.cx} ${banana.cy})`}>
                          {/* Banana disc cut */}
                          <circle cx={banana.cx} cy={banana.cy} r={banana.r} fill="#FAF0CA" stroke="#E6D38E" strokeWidth="1.5" />
                          <circle cx={banana.cx} cy={banana.cy} r={banana.r * 0.45} fill="#F2E09B" />
                          {/* Central star seeds */}
                          <circle cx={banana.cx - 1} cy={banana.cy - 1} r="0.8" fill="#5A4723" />
                          <circle cx={banana.cx + 1} cy={banana.cy + 1} r="0.8" fill="#5A4723" />
                          <circle cx={banana.cx - 1} cy={banana.cy + 1} r="0.8" fill="#5A4723" />
                        </g>
                      ))}
                    </g>
                  )}

                  {/* D: Fresh Strawberry Chunks */}
                  {hasStrawberryChunks && (
                    <g className="transition-all duration-300">
                      {[
                        { cx: 140, cy: 540, r: 11 },
                        { cx: 290, cy: 430, r: 12 },
                        { cx: 240, cy: 670, r: 11 },
                      ].map((berry, idx) => (
                        <g key={idx}>
                          <path 
                            d={`M ${berry.cx} ${berry.cy - berry.r} Q ${berry.cx + berry.r} ${berry.cy}, ${berry.cx} ${berry.cy + berry.r} Q ${berry.cx - berry.r} ${berry.cy}, ${berry.cx} ${berry.cy - berry.r} Z`} 
                            fill="#D92546" 
                          />
                          <circle cx={berry.cx - 2} cy={berry.cy - 3} r="2" fill="#FFFFFF" opacity="0.6" />
                        </g>
                      ))}
                    </g>
                  )}

                  {/* Submerged Black Straw Depth & Shadow inside liquid */}
                  <path 
                    d="M 235 340 L 175 790 L 195 790 L 255 340 Z" 
                    fill="#151515" 
                    opacity="0.3" 
                  />
                </g>

                {/* 2. THE OFFICIAL BRANDED CUP OVERLAY (Straw, printed logo, rim, glass gloss) */}
                <image 
                  href={cupAssetUrl} 
                  x="0" 
                  y="0" 
                  width="460" 
                  height="1024" 
                  preserveAspectRatio="xMidYMid meet"
                  className="pointer-events-none"
                />

                {/* 3. WHIPPED CREAM MOUNTAIN ON TOP OF RIM */}
                <AnimatePresence>
                  {hasWhippedCream && (
                    <motion.g
                      initial={{ scale: 0.7, y: -20, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.7, y: -20, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 15 }}
                    >
                      {/* Cream Base Foundation Mound */}
                      <path 
                        d="M 68 338 Q 90 270, 140 280 Q 180 230, 230 250 Q 280 220, 330 270 Q 370 260, 392 338 Z" 
                        fill="url(#realCreamGrad)" 
                        stroke="#D5CCC0" 
                        strokeWidth="1.5"
                        filter="drop-shadow(0 4px 8px rgba(0,0,0,0.35))"
                      />

                      {/* Volumetric Cream Swirl Crests */}
                      <path 
                        d="M 110 320 Q 150 250, 210 275 Q 270 240, 330 300" 
                        fill="none" 
                        stroke="#E8DECF" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                      />
                      <path 
                        d="M 150 290 Q 200 240, 260 260 Q 300 245, 340 310" 
                        fill="none" 
                        stroke="#FFFFFF" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                      />

                      {/* Top Swirl Peak Tip */}
                      <path 
                        d="M 215 250 Q 230 215, 242 225 Q 238 245, 245 255" 
                        fill="#FFFFFF" 
                        stroke="#E2D7C5" 
                        strokeWidth="1.5" 
                      />

                      {/* Luscious Sauce Drizzle Pooling Over Cream if any sauce is selected */}
                      {topSauceColor && (
                        <g className="transition-all duration-300">
                          <path 
                            d="M 125 310 Q 165 260, 215 285 Q 265 250, 315 295 Q 355 285, 370 330" 
                            fill="none" 
                            stroke={topSauceColor} 
                            strokeWidth="5" 
                            strokeLinecap="round" 
                            opacity="0.9"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                          />
                          {/* Secondary drip ribbon */}
                          <path 
                            d="M 180 270 Q 225 240, 260 255" 
                            fill="none" 
                            stroke={topSauceColor} 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            opacity="0.85" 
                          />
                        </g>
                      )}
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* 4. CROWN TOPPINGS: Whole Biscuit / Glazed Cherry */}
                {/* A: Whole Oreo Cookie Crown */}
                <AnimatePresence>
                  {hasWholeOreo && (
                    <motion.g
                      initial={{ y: -30, opacity: 0, rotate: -25 }}
                      animate={{ y: 0, opacity: 1, rotate: -15 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 14 }}
                      transform="translate(260, 190)"
                    >
                      {/* Oreo Body */}
                      <circle cx="35" cy="35" r="32" fill="#1B1718" stroke="#0D0B0C" strokeWidth="2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" />
                      <circle cx="35" cy="35" r="28" fill="none" stroke="#2B2728" strokeWidth="2.5" strokeDasharray="3 3" />
                      <circle cx="35" cy="35" r="20" fill="#252122" />
                      {/* Oreo Embossed Center */}
                      <text x="35" y="38" textAnchor="middle" fill="#FFFFFF" opacity="0.6" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
                        OREO
                      </text>
                      {/* White Creme layer visible on rim */}
                      <path d="M 10 48 Q 35 62, 60 48" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* B: Whole Biscoff Lotus Biscuit Crown */}
                <AnimatePresence>
                  {hasWholeLotus && (
                    <motion.g
                      initial={{ y: -30, opacity: 0, rotate: -20 }}
                      animate={{ y: 0, opacity: 1, rotate: -12 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 14 }}
                      transform="translate(250, 175)"
                    >
                      {/* Biscoff Biscuit Body */}
                      <rect x="0" y="0" width="36" height="58" rx="4" fill="#6B371B" stroke="#874723" strokeWidth="2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" />
                      <rect x="4" y="4" width="28" height="50" rx="2" fill="#753C1E" stroke="#5C2E16" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="18" y="32" textAnchor="middle" fill="#FFDA88" fontSize="6.5" fontWeight="black" fontFamily="serif">
                        LOTUS
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* C: Royal Glazed Cherry Crown */}
                <AnimatePresence>
                  {hasCherryCrown && (
                    <motion.g
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 16 }}
                      transform="translate(205, 185)"
                    >
                      {/* Cherry Stem */}
                      <path d="M 20 22 Q 35 5, 45 0" fill="none" stroke="#4A6B22" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Cherry Body */}
                      <circle cx="20" cy="32" r="16" fill="#800014" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))" />
                      <circle cx="20" cy="32" r="14" fill="#A3001A" />
                      {/* High-gloss shine */}
                      <ellipse cx="15" cy="26" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.85" />
                    </motion.g>
                  )}
                </AnimatePresence>
              </svg>

            </div>

            {/* Current Shake Summary */}
            <div className="mt-4 text-center">
              <div className="text-xs font-bold text-white mb-1 flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-amber-200">{selectedBase.name}</span>
                {selectedSauces.length > 0 && <span className="text-brand-red font-bold">+ {selectedSauces.length} صوص</span>}
                {selectedCrunches.length > 0 && <span className="text-brand-red font-bold">+ {selectedCrunches.length} إضافات</span>}
                {hasWhippedCream && <span className="text-white/80 font-bold">+ كريمة</span>}
              </div>
              <p className="text-[11px] text-text-muted">المحرك البصري الحي يعرض كوب THE BLACK BOX الحقيقي مع إضافاتك</p>
            </div>
          </div>

          {/* ===================== RIGHT: CLEAN LUXURY STEP SELECTOR ===================== */}
          <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between">
            
            <div>
              {/* FIXED CLEAN SEGMENTED NAVIGATION TABS (Responsive, no text wrap) */}
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

              {/* ================= TAB 4: TOPPINGS & CROWN ================= */}
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
