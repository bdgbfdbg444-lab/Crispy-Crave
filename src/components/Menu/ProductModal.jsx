import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductModal({ product, category, menuData, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(100);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  
  // Reset state when a new product is opened
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setSelectedWeight(100);
      
      // Auto-select modifiers if autoShowModifiers is true (Optional enhancement)
      // For now, we start empty
      setSelectedModifiers([]);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // 1. Calculate Base Price based on weight if applicable
  let basePrice = product.sellingPrice;
  if (product.isSoldByWeight) {
    basePrice = (product.sellingPrice / 1000) * selectedWeight;
  }

  // 2. Find Applicable Add-ons
  const applicableAddOns = [];
  if (menuData && menuData.addOns) {
    Object.values(menuData.addOns).forEach(addOn => {
      if (addOn.linkedProductIds) {
        const linkedIds = addOn.linkedProductIds.split(',').map(id => id.trim());
        if (linkedIds.includes(product.id.toString())) {
          applicableAddOns.push(addOn);
        }
      }
    });
  }

  // Group add-ons by their 'group' property
  const addOnsByGroup = applicableAddOns.reduce((acc, addOn) => {
    const groupName = addOn.group || 'إضافات أخرى';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(addOn);
    return acc;
  }, {});

  // 3. Handle Modifier Selection
  const handleModifierToggle = (addOn) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.id === addOn.id);
      if (exists) {
        return prev.filter(m => m.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  // 4. Calculate Final Price (including free modifiers logic)
  let finalModifiersPrice = 0;
  const freeLimit = product.freeModifiersLimit || 0;
  
  // Create a copy of selected modifiers with calculated charged price
  const processedModifiers = selectedModifiers.map((mod, index) => {
    // If within free limit, charged price is 0
    const isFree = index < freeLimit;
    const chargedPrice = isFree ? 0 : (mod.price || 0);
    return { ...mod, chargedPrice, isFree };
  });

  finalModifiersPrice = processedModifiers.reduce((sum, mod) => sum + mod.chargedPrice, 0);
  
  const totalPrice = (basePrice + finalModifiersPrice) * quantity;

  // 5. Add to Cart Handler
  const handleAddToCart = () => {
    const customProduct = {
      ...product,
      calculatedPrice: basePrice,
      selectedWeight: product.isSoldByWeight ? selectedWeight : null,
      selectedModifiers: processedModifiers,
      finalModifiersPrice
    };
    
    addToCart(customProduct, quantity);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md text-dark hover:bg-white hover:text-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header Image */}
          {product.imagePath && (
            <div className="w-full h-64 sm:h-72 bg-gray-100 shrink-0 relative">
              <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 right-6 text-white">
                <h2 className="text-3xl font-display font-black mb-1">{product.name}</h2>
                {category && <span className="text-primary font-bold text-sm bg-dark/50 px-3 py-1 rounded-full backdrop-blur-sm">{category.name}</span>}
              </div>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
            {!product.imagePath && (
              <div className="mb-6">
                <h2 className="text-3xl font-display font-black text-dark mb-1">{product.name}</h2>
                {category && <span className="text-primary font-bold text-sm bg-light px-3 py-1 rounded-full">{category.name}</span>}
              </div>
            )}

            {product.description && (
              <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
            )}

            {/* Weight Selection */}
            {product.isSoldByWeight && (
              <div className="mb-8 bg-light p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">اختر الوزن</h3>
                  <span className="text-primary font-bold">{basePrice} ج.م</span>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm w-max mx-auto">
                  <button 
                    onClick={() => setSelectedWeight(Math.max(100, selectedWeight - 50))}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-light text-dark hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="w-24 text-center font-bold text-xl">
                    {selectedWeight} جرام
                  </div>
                  <button 
                    onClick={() => setSelectedWeight(selectedWeight + 50)}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-light text-dark hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <p className="text-center text-sm text-gray-400 mt-3">الحد الأدنى 100 جرام، ويزيد بمقدار 50 جرام</p>
              </div>
            )}

            {/* Modifiers / Add-ons */}
            {Object.keys(addOnsByGroup).length > 0 && (
              <div className="mb-8 space-y-8">
                {freeLimit > 0 && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-100">
                    🎉 يحق لك اختيار عدد ({freeLimit}) إضافات مجاناً!
                  </div>
                )}
                
                {Object.entries(addOnsByGroup).map(([groupName, addOns]) => (
                  <div key={groupName}>
                    <h3 className="font-bold text-lg mb-4 text-dark border-b border-gray-100 pb-2">{groupName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addOns.map(addOn => {
                        const isSelected = selectedModifiers.some(m => m.id === addOn.id);
                        
                        // Determine display price
                        let displayPrice = `+${addOn.price} ج.م`;
                        if (isSelected) {
                          const modIndex = selectedModifiers.findIndex(m => m.id === addOn.id);
                          if (modIndex < freeLimit) displayPrice = "مجاناً";
                        } else if (selectedModifiers.length < freeLimit) {
                          displayPrice = "مجاناً (ضمن العرض)";
                        }

                        return (
                          <div 
                            key={addOn.id}
                            onClick={() => handleModifierToggle(addOn)}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                                {isSelected && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 8L6 11L11 3.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"></path></svg>}
                              </div>
                              <span className={`font-bold ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{addOn.name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-500">{displayPrice}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Add to Cart */}
          <div className="p-6 bg-white border-t border-gray-100 shrink-0">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {/* Quantity */}
              <div className="flex items-center gap-4 bg-light p-2 rounded-xl">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-dark shadow-sm hover:bg-gray-50"
                >
                  <Minus size={18} />
                </button>
                <span className="font-bold text-lg w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-dark shadow-sm hover:bg-gray-50"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add Button */}
              <button 
                onClick={handleAddToCart}
                className="flex-grow w-full bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-between transition-all shadow-lg shadow-primary/30"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} />
                  <span>إضافة للطلب</span>
                </div>
                <span className="text-lg">{totalPrice} ج.م</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
