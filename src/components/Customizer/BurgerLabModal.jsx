import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Beef, Sparkles, Check, X, RefreshCw, Gift, Scale } from 'lucide-react';
import { useCart } from '../../context/CartContext';

// Default Fallback Elements if POS addons not configured
const DEFAULT_BURGER_BASES = [
  { id: 'bun_brioche', name: 'خبز بريوش محمص بالزبدة', nameEn: 'Buttered Brioche Bun', price: 0, color: '#C4883E', desc: 'طري وذهبي غني بنكهة الزبدة الطبيعية' },
  { id: 'base_tomato', name: 'طماطم طازجة', nameEn: 'Fresh Tomatoes', price: 0, color: '#E63946', desc: 'شرائح طماطم طازجة' },
  { id: 'base_lettuce', name: 'خس مقرمش', nameEn: 'Crispy Lettuce', price: 0, color: '#2D6A4F', desc: 'أوراق خس أمريكي مقرمشة' },
  { id: 'base_cheese', name: 'جبنة شيدر أمريكية', nameEn: 'American Cheddar Cheese', price: 0, color: '#F77F00', desc: 'شريحة شيدر ذائبة' }
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

export default function BurgerLabModal({ isOpen, onClose, baseProduct, menuData, initialCustomization = null, onSaveEdit = null }) {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const { addToCart } = useCart();

  // Helper to pick proper localized name
  const getItemName = (item) => {
    if (!item) return '';
    return isEn ? (item.nameEn || item.name) : (item.name || item.nameEn);
  };

  // 1. Sold by Weight & Limits defined from POS
  const isSoldByWeight = Boolean(baseProduct?.isSoldByWeight ?? baseProduct?.IsSoldByWeight);
  const minWeight = Number(baseProduct?.minWeightGrams || baseProduct?.MinWeightGrams || 150);
  const defaultWeight = Number(baseProduct?.defaultWeightGrams || baseProduct?.DefaultWeightGrams || 200);
  const weightStep = Number(baseProduct?.weightStepGrams || baseProduct?.WeightStepGrams || 50);

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight > 0 ? defaultWeight : 200);

  // Patty Configuration for Burgers / Sandwiches
  const maxPattiesCount = Number(baseProduct?.maxPattiesCount || baseProduct?.MaxPattiesCount || 3);
  const extraPattyPrice = Number(baseProduct?.extraPattyPrice || baseProduct?.ExtraPattyPrice || 60);
  const [pattiesCount, setPattiesCount] = useState(1);

  // Separate Free Limits for Sauces and Extras/Sides
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

  // 2. Extract real AddOns from POS linked specifically to this product
  const { burgerBases, burgerSauces, burgerCrunches, burgerToppings } = useMemo(() => {
    const pId = baseProduct?.id?.toString();
    const allAddons = menuData?.AddOns || menuData?.addOns || [];

    // Filter addons linked to this product (or general unconstrained)
    const posAddOns = allAddons.filter(a => {
      if (a.linkedProductIds && a.linkedProductIds.trim() !== '' && a.linkedProductIds !== '*') {
        const ids = a.linkedProductIds.split(',').map(s => s.trim());
        return ids.includes(pId);
      }
      // If unconstrained, do NOT allow drink ingredients into sandwiches/meals!
      const name = (a.name || '').toLowerCase();
      if (name.includes('شيك') || name.includes('فانيليا') || name.includes('شوكلاته') || name.includes('شوكولاته') || name.includes('فراولة') || name.includes('حليب') || name.includes('آيس كريم') || name.includes('ايس كريم')) {
        return false;
      }
      return true;
    });

    if (!posAddOns || posAddOns.length === 0) {
      return {
        burgerBases: DEFAULT_BURGER_BASES,
        burgerSauces: DEFAULT_BURGER_SAUCES,
        burgerCrunches: DEFAULT_BURGER_CRUNCH,
        burgerToppings: DEFAULT_BURGER_TOPPINGS
      };
    }

    const bases = [];
    const sauces = [];
    const crunches = [];
    const toppings = [];

    posAddOns.forEach(a => {
      const name = (a.name || '').toLowerCase();
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
      } else {
        if (name.includes('خبز') || name.includes('عيش') || name.includes('bun') || name.includes('بريوش')) {
          item.price = 0; // Base bun is free
          bases.push(item);
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
      burgerBases: bases.length > 0 ? bases : DEFAULT_BURGER_BASES,
      burgerSauces: sauces.length > 0 ? sauces : DEFAULT_BURGER_SAUCES,
      burgerCrunches: crunches.length > 0 ? crunches : DEFAULT_BURGER_CRUNCH,
      burgerToppings: toppings.length > 0 ? toppings : DEFAULT_BURGER_TOPPINGS
    };
  }, [baseProduct, menuData]);

  const rawType = (baseProduct?.customizerType || baseProduct?.CustomizerType || '').toLowerCase();
  const prodName = (baseProduct?.name || '').toLowerCase();
  const isMeal = rawType === 'meal' || rawType.includes('وجبة') || prodName.includes('وجبة');

  // Selected Customization State
  // RULE: ALL Base ingredients are automatically pre-selected / included by default!
  const [selectedBases, setSelectedBases] = useState([]);
  const [selectedSauces, setSelectedSauces] = useState([]);
  const [selectedCrunches, setSelectedCrunches] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [activeTab, setActiveTab] = useState('base'); // 'base' | 'sauces' | 'extras' | 'sides'
  const [isSuccessBurger, setIsSuccessBurger] = useState(false);

  // Reset ALL customization state or Hydrate from existing cart item when in Edit Mode
  useEffect(() => {
    if (isOpen) {
      if (initialCustomization) {
        // ========== EDIT MODE: RESTORE SAVED SELECTIONS ==========
        // 1. Patty Count
        if (typeof initialCustomization.pattiesCount === 'number' && initialCustomization.pattiesCount > 0) {
          setPattiesCount(initialCustomization.pattiesCount);
        } else {
          const pattyMod = initialCustomization.selectedModifiers?.find(m => m.isPatty || m.id === 'patty_count');
          if (pattyMod) {
            const match = String(pattyMod.name || '').match(/(\d+)/);
            setPattiesCount(match ? Number(match[1]) : 1);
          } else {
            setPattiesCount(1);
          }
        }

        // 2. Weight
        const savedWeight = Number(initialCustomization.weightInGrams || initialCustomization.selectedWeight);
        if (savedWeight > 0) {
          setSelectedWeight(savedWeight);
        } else if (isSoldByWeight) {
          setSelectedWeight(defaultWeight > 0 ? defaultWeight : 200);
        }

        // 3. Base Items
        const exclusionMod = initialCustomization.selectedModifiers?.find(m => m.isExclusion || m.id === 'base_exclusions');
        if (exclusionMod) {
          const exclRaw = String(exclusionMod.name || '').replace(/\[(?:بدون:|Without:)\s*/i, '').replace(']', '');
          const excludedNames = exclRaw.split(/[،,]/).map(s => s.trim().toLowerCase());
          const preserved = burgerBases.filter(b => 
            !excludedNames.includes((b.name || '').toLowerCase()) && 
            !excludedNames.includes((b.nameEn || '').toLowerCase())
          );
          setSelectedBases(preserved);
        } else {
          const explicitBaseMods = initialCustomization.selectedModifiers?.filter(m => m.isBase && !m.isExclusion && m.id !== 'weight_spec');
          if (explicitBaseMods && explicitBaseMods.length > 0) {
            const preserved = burgerBases.filter(b => 
              explicitBaseMods.some(m => m.id === `base_${b.id}` || m.id === b.id || m.name === b.name || m.name === getItemName(b))
            );
            setSelectedBases(preserved.length > 0 ? preserved : burgerBases);
          } else {
            setSelectedBases(burgerBases);
          }
        }

        // 4. Sauces
        const savedSauces = burgerSauces.filter(s => 
          initialCustomization.selectedModifiers?.some(m => !m.isBase && !m.isPatty && !m.isExclusion && (m.id === s.id || m.name === s.name || m.name === getItemName(s)))
        );
        setSelectedSauces(savedSauces);

        // 5. Crunches
        const savedCrunches = burgerCrunches.filter(c => 
          initialCustomization.selectedModifiers?.some(m => !m.isBase && !m.isPatty && !m.isExclusion && (m.id === c.id || m.name === c.name || m.name === getItemName(c)))
        );
        setSelectedCrunches(savedCrunches);

        // 6. Toppings
        const savedToppings = burgerToppings.filter(t => 
          initialCustomization.selectedModifiers?.some(m => !m.isBase && !m.isPatty && !m.isExclusion && (m.id === t.id || m.name === t.name || m.name === getItemName(t)))
        );
        setSelectedToppings(savedToppings);

        setActiveTab('base');
      } else {
        // ========== NORMAL NEW CUSTOMIZATION MODE ==========
        if (burgerBases.length > 0) {
          setSelectedBases(burgerBases);
        } else {
          setSelectedBases([]);
        }

        setSelectedSauces([]);
        setSelectedCrunches([]);
        setSelectedToppings([]);
        setPattiesCount(1);
        setActiveTab('base');

        if (isSoldByWeight) {
          setSelectedWeight(defaultWeight > 0 ? defaultWeight : 200);
        }
      }
    }
  }, [isOpen, baseProduct?.id, burgerBases, burgerSauces, burgerCrunches, burgerToppings, isSoldByWeight, defaultWeight, initialCustomization]);

  // Safe tab fallback: prevent blank screen if tab doesn't exist for current product type
  useEffect(() => {
    if (!isMeal && activeTab === 'sides') {
      setActiveTab('extras');
    } else if (isMeal && activeTab === 'extras') {
      setActiveTab('sides');
    }
  }, [isMeal, activeTab]);

  // Single-Toggle for Base components: Included vs Excluded (Without / بدون)
  // Cannot add duplicates!
  const toggleBase = (baseItem) => {
    setSelectedBases(prev => {
      const exists = prev.some(b => b.id === baseItem.id);
      if (exists) {
        // Exclude (Without / بدون)
        return prev.filter(b => b.id !== baseItem.id);
      } else {
        // Restore / Include (no duplicates)
        return [...prev, baseItem];
      }
    });
  };

  // Base price dynamically calculated from weight (if sold by weight, e.g. Brisket meal)
  const initialBasePrice = useMemo(() => {
    if (isSoldByWeight) {
      const pricePerGram = (Number(baseProduct?.sellingPrice) || 0) / 1000;
      return Math.round(pricePerGram * selectedWeight);
    }
    return Number(baseProduct?.sellingPrice) || 140;
  }, [isSoldByWeight, baseProduct?.sellingPrice, selectedWeight]);

  // Combined list of extra additions (Sauces, Crunches, Toppings)
  const allSelectedExtras = useMemo(() => [
    ...selectedSauces,
    ...selectedCrunches,
    ...selectedToppings
  ], [selectedSauces, selectedCrunches, selectedToppings]);

  // Smart Free-Allowance Distributor with separate pools for Sauces and Extras/Sides
  const processedExtrasMap = useMemo(() => {
    const map = {};

    // 1. Sauces Free Quota
    const sortedSauces = [...selectedSauces].sort((a, b) => (b.price || 0) - (a.price || 0));
    const freeSauceIds = new Set(sortedSauces.slice(0, freeSaucesLimit).map(item => item.id));
    selectedSauces.forEach(item => {
      const isFree = freeSauceIds.has(item.id);
      map[item.id] = {
        chargedPrice: isFree ? 0 : (item.price || 0),
        isFree
      };
    });

    // 2. Extras / Sides / Crunches / Toppings Free Quota
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

  // Extra patty cost for burgers: 1st patty is free/included, extra patties charged at extraPattyPrice
  const pattiesCost = (!isMeal && pattiesCount > 1) ? (pattiesCount - 1) * extraPattyPrice : 0;

  // Calculate live total price (Base ingredients are 0 EGP, plus patty cost if > 1)
  const totalPrice = useMemo(() => {
    let sum = initialBasePrice + pattiesCost;
    allSelectedExtras.forEach(item => {
      const info = processedExtrasMap[item.id];
      sum += info ? info.chargedPrice : (item.price || 0);
    });
    return sum;
  }, [initialBasePrice, pattiesCost, allSelectedExtras, processedExtrasMap]);

  // Unified Extras list (combines crunches & toppings into a single deduplicated list)
  const burgerAllExtras = useMemo(() => {
    const seen = new Set();
    const list = [];
    [...burgerCrunches, ...burgerToppings].forEach(item => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        list.push(item);
      }
    });
    return list;
  }, [burgerCrunches, burgerToppings]);

  const toggleExtra = (item) => {
    const isTopping = burgerToppings.some(t => t.id === item.id);
    if (isTopping) {
      toggleTopping(item);
    } else {
      toggleCrunch(item);
    }
  };

  if (!isOpen) return null;

  const curr = isEn ? 'EGP' : 'ج.م';

  // Pricing badge helper for extra additions respecting category quota
  const getAddonDisplayPrice = (item, isSelected, category = 'extra') => {
    if (isSelected) {
      const info = processedExtrasMap[item.id];
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

    // Not selected yet: check if this category has remaining free slots
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
    setSelectedBases(burgerBases);
    setSelectedSauces([]);
    setSelectedCrunches([]);
    setSelectedToppings([]);
    setPattiesCount(1);
    setActiveTab('base');
    if (isSoldByWeight) {
      setSelectedWeight(defaultWeight > 0 ? defaultWeight : 200);
    }
  };

  // Find which base ingredients were explicitly excluded by user
  const excludedBases = burgerBases.filter(b => !selectedBases.some(s => s.id === b.id));

  const handleAddToCart = () => {
    const baseModifiers = selectedBases.map(b => ({
      id: `base_${b.id}`,
      name: getItemName(b),
      nameEn: b.nameEn || b.name,
      price: 0,
      isBase: true
    }));

    const extraModifiers = allSelectedExtras.map(item => {
      const info = processedExtrasMap[item.id];
      const isFree = Boolean(info?.isFree);
      return {
        id: item.id,
        name: getItemName(item),
        nameEn: item.nameEn || item.name,
        price: isFree ? 0 : (item.price || 0),
        originalPrice: item.price || 0,
        isFree,
        group: isFree ? 'Free' : 'Paid'
      };
    });

    const modifiersList = [...baseModifiers, ...extraModifiers];

    if (!isMeal && pattiesCount > 1) {
      modifiersList.unshift({
        id: 'patty_count',
        name: isEn 
          ? `[${pattiesCount} Patties (+${(pattiesCount - 1) * extraPattyPrice} EGP)]`
          : `[عدد قطع اللحم: ${pattiesCount} (+${(pattiesCount - 1) * extraPattyPrice} ج.م)]`,
        nameEn: `[${pattiesCount} Patties (+${(pattiesCount - 1) * extraPattyPrice} EGP)]`,
        price: (pattiesCount - 1) * extraPattyPrice,
        isPatty: true
      });
    }

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

    if (isSoldByWeight) {
      modifiersList.unshift({
        id: 'weight_spec',
        name: isEn ? `[Weight: ${selectedWeight}g]` : `[الوزن: ${selectedWeight} جرام]`,
        nameEn: `[Weight: ${selectedWeight}g]`,
        price: 0,
        isBase: true
      });
    }

    const customizedProduct = {
      ...(baseProduct || {}),
      id: baseProduct?.id || 8888,
      name: isSoldByWeight
        ? `${isEn ? (baseProduct?.nameEn || 'Custom Meal') : (baseProduct?.name || 'وجبة مخصصة')} (${selectedWeight}g)`
        : (isEn ? (baseProduct?.nameEn || 'Artisanal Custom Sandwich') : (baseProduct?.name || 'تخصيص الساندوتش')),
      nameEn: isSoldByWeight
        ? `${baseProduct?.nameEn || 'Custom Meal'} (${selectedWeight}g)`
        : (baseProduct?.nameEn || 'Artisanal Custom Sandwich'),
      weightInGrams: isSoldByWeight ? selectedWeight : null,
      sellingPrice: totalPrice,
      calculatedPrice: totalPrice,
      selectedModifiers: modifiersList,
      finalModifiersPrice: totalPrice - initialBasePrice,
      isCustomBurger: true
    };

    if (onSaveEdit) {
      onSaveEdit(customizedProduct);
      setIsSuccessBurger(true);
      setTimeout(() => {
        setIsSuccessBurger(false);
        onClose();
      }, 500);
      return;
    }

    addToCart(customizedProduct, 1);
    setIsSuccessBurger(true);

    setTimeout(() => {
      setIsSuccessBurger(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir={isEn ? 'ltr' : 'rtl'}>
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-text-light">
                  {isEn ? (baseProduct?.nameEn || baseProduct?.name || 'Build Your Sandwich') : (baseProduct?.name || baseProduct?.nameEn || 'تخصيص الساندوتش')}
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
                  {selectedBases.length + allSelectedExtras.length} {isEn ? 'Items' : 'مكونات'}
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

              {/* Patty Count Summary Card (For Burgers) */}
              {!isMeal && maxPattiesCount > 1 && (
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍔</span>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {pattiesCount === 1 ? (isEn ? 'Single Patty (1)' : 'شريحة واحدة (سنجل)') : pattiesCount === 2 ? (isEn ? 'Double Patties (2)' : 'شريحتين (دبل)') : pattiesCount === 3 ? (isEn ? 'Triple Patties (3)' : '3 شرائح (تريبل)') : `${pattiesCount} ${isEn ? 'Patties' : 'شرائح لحم'}`}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {pattiesCount === 1 ? (isEn ? 'Standard Single' : 'شريحة اللحم الأساسية') : (isEn ? `+${pattiesCount - 1} extra patty` : `+${pattiesCount - 1} شريحة إضافية`)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${pattiesCost > 0 ? 'text-brand-red' : 'text-emerald-400'}`}>
                    {pattiesCost > 0 ? `+${pattiesCost} ${curr}` : (isEn ? 'Included' : 'مجاناً')}
                  </span>
                </div>
              )}

              {/* Base Components Showcase Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
                <div className="text-[11px] font-bold text-emerald-400 uppercase mb-2 flex items-center justify-between">
                  <span>{isEn ? 'Core Ingredients (Included Free):' : 'المكونات الأساسية (مشمولة مجاناً):'}</span>
                  <span className="text-[10px] text-text-muted">{selectedBases.length}/{burgerBases.length}</span>
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
                  <span>{isEn ? 'Extra Sauces & Toppings:' : 'الصوصات والإضافات الإضافية:'}</span>
                  <span className="text-brand-red">{allSelectedExtras.length}</span>
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
                  {allSelectedExtras.length === 0 && (
                    <div className="p-3 rounded-xl border border-dashed border-white/10 text-center text-xs text-text-muted">
                      {isEn ? 'No extra sauces or toppings added' : 'لم تختر صوصات أو إضافات إضافية'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Live Price Summary */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>{isSoldByWeight ? (isEn ? `Base Item (${selectedWeight}g):` : `الوجبة الأساسية (${selectedWeight} جرام):`) : (isEn ? 'Base Item (Includes Base):' : 'الصنف الأساسي (شامل المكونات):')}</span>
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
              {/* Weight Selector when product is sold by weight (e.g. Brisket Meal) */}
              {isSoldByWeight && (
                <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-red/10 to-black-card border border-amber-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Scale size={18} className="text-amber-400" />
                      <span className="text-xs sm:text-sm font-black text-amber-300">
                        {isEn ? 'Choose Portion Weight (Grams):' : 'حدد وزن الوجبة (بالجرام):'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                      <span className="text-amber-400 font-black text-sm">{selectedWeight}</span>
                      <span className="text-text-muted">{isEn ? 'g' : 'جرام'}</span>
                      <span className="text-white/20">|</span>
                      <span className="text-emerald-400 font-black text-sm">{initialBasePrice}</span>
                      <span className="text-emerald-400 text-[10px]">{curr}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[150, 200, 250, 300, 400, 500].filter(w => w >= minWeight).map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWeight(w)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          selectedWeight === w
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                            : 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/10'
                        }`}
                      >
                        {w} {isEn ? 'g' : 'جرام'}
                      </button>
                    ))}

                    <div className="flex items-center gap-1 ms-auto bg-black/60 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setSelectedWeight(prev => Math.max(minWeight, prev - weightStep))}
                        disabled={selectedWeight <= minWeight}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-white min-w-[50px] text-center">
                        {selectedWeight}g
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedWeight(prev => prev + weightStep)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Segmented Step Tabs (Responsive Flex - NO TRUNCATION!) */}
              <div className="flex items-stretch gap-1.5 sm:gap-2 mb-6 bg-black-primary/70 p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                {(isMeal ? [
                  { id: 'base', label: isEn ? '1. Base' : '1. الأساسي', count: selectedBases.length },
                  { id: 'sides', label: isEn ? '2. Sides' : '2. الأصناف الجانبية', count: selectedCrunches.length },
                  { id: 'sauces', label: isEn ? '3. Sauces' : '3. الصوصات', count: selectedSauces.length },
                ] : [
                  { id: 'base', label: isEn ? '1. Base' : '1. الأساسي', count: selectedBases.length },
                  { id: 'sauces', label: isEn ? '2. Sauces' : '2. الصوصات', count: selectedSauces.length },
                  { id: 'extras', label: isEn ? '3. Extras' : '3. الإضافات', count: selectedCrunches.length + selectedToppings.length },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[95px] sm:min-w-0 py-2.5 px-2 text-center rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
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
                  {/* Patty Count Selector for Burgers */}
                  {!isMeal && maxPattiesCount > 1 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-red/10 via-black-primary/60 to-amber-500/10 border border-brand-red/30 mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-brand-red/20 text-brand-red flex items-center justify-center border border-brand-red/30 shrink-0">
                            <Beef size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white block">
                              {isEn ? 'Number of Beef Patties:' : 'عدد قطع اللحم (Beef Patties):'}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              {isEn ? `1st patty is free. Each extra patty is +${extraPattyPrice} ${curr}` : `القطعة الأولى مشمولة مجاناً. كل قطعة إضافية بسعر +${extraPattyPrice} ${curr}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-brand-red px-2.5 py-1 rounded-lg bg-brand-red/15 border border-brand-red/30">
                          {pattiesCount === 1 ? (isEn ? 'Single' : 'سنجل') : pattiesCount === 2 ? (isEn ? 'Double' : 'دبل') : pattiesCount === 3 ? (isEn ? 'Triple' : 'تريبل') : `${pattiesCount}X`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Array.from({ length: maxPattiesCount }, (_, i) => i + 1).map(num => {
                          const isSelected = pattiesCount === num;
                          const extraCost = (num - 1) * extraPattyPrice;
                          let labelAr = num === 1 ? 'قطعة واحدة (Single)' : num === 2 ? 'قطعتين (Double)' : num === 3 ? '3 قطع (Triple)' : `${num} قطع لحم`;
                          let labelEn = num === 1 ? 'Single (1)' : num === 2 ? 'Double (2)' : num === 3 ? 'Triple (3)' : `${num} Patties`;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setPattiesCount(num)}
                              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-brand-red to-red-600 text-white border-brand-red shadow-lg shadow-brand-red/30 ring-2 ring-brand-red/40'
                                  : 'bg-black-primary/60 border-white/10 hover:border-white/25 text-text-light'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">🍔</span>
                                <span className="font-bold text-xs sm:text-sm">{isEn ? labelEn : labelAr}</span>
                              </div>
                              <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/95' : 'text-text-muted'}`}>
                                {num === 1 ? (isEn ? 'Included (Free)' : 'أساسي (مجاناً)') : `+${extraCost} ${curr}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 mb-2">
                    <span className="text-xs text-emerald-300 font-bold block">
                      {isEn 
                        ? '✨ Core ingredients are included free (0 EGP) — Tap any item to remove it (Without) if you prefer.'
                        : '✨ المكونات الأساسية مضافة تلقائياً ومجانية (0 ج.م) — اضغط على أي مكون لاستبعاده (بدون) إذا كنت لا ترغب به.'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {burgerBases.map((b) => {
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
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10" style={{ backgroundColor: b.color || '#C4883E' }}>
                                <Beef size={20} className="text-black/80" />
                              </div>
                            )}
                            <div>
                              <div className={`font-bold text-sm ${isIncluded ? 'text-text-light' : 'text-text-muted line-through'}`}>
                                {getItemName(b)}
                              </div>
                              <div className="text-[11px] text-text-muted">
                                {isIncluded 
                                  ? (isEn ? 'Included by default (Tap to remove)' : 'متضمن في الساندوتش (انقر للاستبعاد)')
                                  : (isEn ? 'Excluded / Without (Tap to re-add)' : 'مستبعد بدون (انقر للإعادة للساندوتش)')}
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
                          ? `Free Sauces Allowance: ${freeSaucesCountUsed} of ${freeSaucesLimit} selected (${freeSaucesRemaining} free remaining)`
                          : `الصوصات المجانية المتاحة: تم اختيار ${freeSaucesCountUsed} من ${freeSaucesLimit} (متبقي ${freeSaucesRemaining} مجاناً)`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose Gourmet Sauces (Optional):' : 'اختر صوصات البرجر الذائبة (اختياري):'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">{selectedSauces.length} {isEn ? 'Selected' : 'محددة'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {burgerSauces.map((s) => {
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
                            <div className="truncate">
                              <div className="font-bold text-sm text-text-light truncate">{getItemName(s)}</div>
                              {s.desc && <div className="text-[10px] text-text-muted truncate">{s.desc}</div>}
                            </div>
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
                </motion.div>
              )}

              {/* ================= TAB 2: SIDES (FOR MEALS ONLY) ================= */}
              {isMeal && activeTab === 'sides' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose Side Items:' : 'اختر الأصناف الجانبية للوجبة (بطاطس، كول سلو...):'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">{selectedCrunches.length} {isEn ? 'Selected' : 'محددة'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {burgerCrunches.map((c) => {
                      const isSelected = selectedCrunches.some(item => item.id === c.id);
                      const priceInfo = getAddonDisplayPrice(c, isSelected);
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
                </motion.div>
              )}

              {/* ================= TAB 3: EXTRAS (FOR SANDWICHES: UNIFIED SINGLE SECTION) ================= */}
              {!isMeal && activeTab === 'extras' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {freeExtrasLimit > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-3">
                      <Gift size={16} className="shrink-0 text-amber-400" />
                      <span>
                        {isEn 
                          ? `Free Extras Allowance: ${freeExtrasCountUsed} of ${freeExtrasLimit} selected (${freeExtrasRemaining} free remaining)`
                          : `الإضافات المجانية المتاحة: تم اختيار ${freeExtrasCountUsed} من ${freeExtrasLimit} (متبقي ${freeExtrasRemaining} مجاناً)`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted font-bold">
                      {isEn ? 'Choose Extras & Toppings (Optional):' : 'اختر الإضافات الإضافية (اختياري):'}
                    </span>
                    <span className="text-xs text-brand-red font-bold">
                      {selectedCrunches.length + selectedToppings.length} {isEn ? 'Selected' : 'محددة'}
                    </span>
                  </div>

                  {burgerAllExtras.length === 0 ? (
                    <div className="p-8 text-center text-text-muted text-sm border border-dashed border-white/10 rounded-2xl">
                      {isEn ? 'No extra items available for this product' : 'لا توجد إضافات متاحة لهذا الصنف'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {burgerAllExtras.map((item) => {
                        const isSelected = selectedCrunches.some(c => c.id === item.id) || selectedToppings.some(t => t.id === item.id);
                        const priceInfo = getAddonDisplayPrice(item, isSelected, 'extra');
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleExtra(item)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-brand-red/15 border-brand-red shadow-md'
                                : 'bg-black-primary/50 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {item.iconPath && <img src={item.iconPath} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                              <span className="font-bold text-sm text-text-light truncate">{getItemName(item)}</span>
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
                    <span>{onSaveEdit ? (isEn ? 'Saved changes!' : 'تم حفظ التعديلات!') : (isEn ? 'Added to order!' : 'تمت الإضافة للطلب بنجاح!')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>{onSaveEdit ? (isEn ? 'Save Changes' : 'حفظ التعديلات في السلة') : (isEn ? 'Add to order' : 'إضافة الساندوتش للطلب')}</span>
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
