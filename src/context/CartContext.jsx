import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { ref, get, set, onValue, off } from 'firebase/database';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { userPhone } = useAuth();

  // 1. Local cart items state initialized from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('crispy_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Flag to avoid repeatedly auto-opening the cart once the user has dismissed it or chosen to continue shopping
  const [dontAutoOpenCart, setDontAutoOpenCart] = useState(() => {
    try {
      return sessionStorage.getItem('crispy_dont_auto_open_cart') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Track last added item for toast feedback
  const [lastAddedItem, setLastAddedItem] = useState(null);

  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('crispy_cart_table') || null;
  });

  // Order Type State (delivery, takeaway, DineIn)
  const [orderType, setOrderTypeState] = useState(() => {
    try {
      const savedTable = localStorage.getItem('crispy_cart_table');
      if (savedTable) return 'DineIn';
      return localStorage.getItem('crispy_order_type') || null;
    } catch (e) {
      return null;
    }
  });

  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false);

  const setOrderType = (type) => {
    setOrderTypeState(type);
    try {
      if (type) {
        localStorage.setItem('crispy_order_type', type);
      } else {
        localStorage.removeItem('crispy_order_type');
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (tableNumber) {
      setOrderTypeState('DineIn');
      try {
        localStorage.setItem('crispy_order_type', 'DineIn');
      } catch (e) {}
    }
  }, [tableNumber]);

  // Refs for tracking sync source to prevent echo loops
  const isSyncingFromCloudRef = useRef(false);
  const activeUserPhoneRef = useRef(null);

  // Helper to normalize Egyptian / International phone format for Firebase key
  const getCleanPhone = (p) => {
    if (!p) return null;
    let clean = p.toString().replace(/\D/g, '');
    if (clean.startsWith('20') && clean.length === 12) clean = '0' + clean.substring(2);
    else if (clean.startsWith('0020') && clean.length === 14) clean = '0' + clean.substring(4);
    else if (clean.startsWith('+20') && clean.length === 13) clean = '0' + clean.substring(3);
    else if (clean.length === 10 && !clean.startsWith('0')) clean = '0' + clean;
    return clean;
  };

  // 2. Persist cart to localStorage on any local change
  useEffect(() => {
    localStorage.setItem('crispy_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  // 3. Persist table number
  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem('crispy_cart_table', tableNumber);
    } else {
      localStorage.removeItem('crispy_cart_table');
    }
  }, [tableNumber]);

  // 4. Cloud Cart Synchronization across browsers / devices
  // When a user logs in with their phone, fetch their cloud cart and sync
  useEffect(() => {
    const cleanPhone = getCleanPhone(userPhone);
    activeUserPhoneRef.current = cleanPhone;

    if (!cleanPhone) return;

    const cartRef = ref(db, `UserCarts/${cleanPhone}`);

    // Initial fetch on login
    get(cartRef).then((snap) => {
      if (snap.exists()) {
        const cloudData = snap.val();
        const cloudItems = Array.isArray(cloudData?.items) ? cloudData.items : [];

        setCartItems((localItems) => {
          // If local cart is empty (e.g. newly opened browser or cleared cache), load cloud cart!
          if (!localItems || localItems.length === 0) {
            return cloudItems;
          }

          // If local cart has items, merge intelligently without duplicate product configurations
          if (cloudItems.length === 0) {
            set(cartRef, { items: localItems, updatedAt: Date.now() }).catch(() => {});
            return localItems;
          }

          const merged = [...localItems];
          cloudItems.forEach((cItem) => {
            const exists = merged.find((lItem) => 
              lItem.product.id === cItem.product.id &&
              lItem.product.selectedWeight === cItem.product.selectedWeight &&
              JSON.stringify(lItem.product.selectedModifiers || []) === JSON.stringify(cItem.product.selectedModifiers || [])
            );
            if (!exists) {
              merged.push(cItem);
            }
          });

          // Update cloud with merged cart
          set(cartRef, { items: merged, updatedAt: Date.now() }).catch(() => {});
          return merged;
        });
      } else {
        // No cloud cart exists yet. If we have local items, upload them immediately
        setCartItems((localItems) => {
          if (localItems && localItems.length > 0) {
            set(cartRef, { items: localItems, updatedAt: Date.now() }).catch(() => {});
          }
          return localItems;
        });
      }
    }).catch((err) => {
      console.warn('[CartSync] Cloud cart fetch error:', err);
    });

    // Real-time listener for remote cart changes (e.g. user modified cart in another tab/browser)
    const listener = onValue(cartRef, (snap) => {
      if (isSyncingFromCloudRef.current) return;
      if (snap.exists()) {
        const data = snap.val();
        if (Array.isArray(data?.items)) {
          isSyncingFromCloudRef.current = true;
          setCartItems(data.items);
          setTimeout(() => {
            isSyncingFromCloudRef.current = false;
          }, 300);
        }
      }
    });

    return () => {
      off(cartRef);
    };
  }, [userPhone]);

  // 5. Upload local cart changes to Cloud when user is logged in
  useEffect(() => {
    const cleanPhone = activeUserPhoneRef.current;
    if (!cleanPhone || isSyncingFromCloudRef.current) return;

    const cartRef = ref(db, `UserCarts/${cleanPhone}`);
    const timeout = setTimeout(() => {
      set(cartRef, {
        items: cartItems,
        updatedAt: Date.now()
      }).catch((err) => {
        console.warn('[CartSync] Cloud cart update error:', err);
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [cartItems]);

  // 6. Add to Cart Handler
  const addToCart = (customProduct, quantity) => {
    const isSoldOut = Boolean(customProduct?.isSoldOut || customProduct?.IsSoldOut || customProduct?.isAvailable === false || customProduct?.IsAvailable === false);
    if (isSoldOut) {
      alert('عذراً، هذا الصنف نفدت كميته في المطعم حالياً ولا يمكن إضافته للطلب.');
      return;
    }
    const validQty = Math.max(1, Math.min(99, parseInt(quantity, 10) || 1));
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => {
        if (item.product.id !== customProduct.id) return false;
        if (item.product.selectedWeight !== customProduct.selectedWeight) return false;
        
        const existingMods = item.product.selectedModifiers || [];
        const newMods = customProduct.selectedModifiers || [];
        if (existingMods.length !== newMods.length) return false;
        
        const existingModIds = existingMods.map(m => m.id).sort().join(',');
        const newModIds = newMods.map(m => m.id).sort().join(',');
        return existingModIds === newModIds;
      });

      if (existingItemIndex >= 0) {
        return prev.map((item, i) => 
          i === existingItemIndex 
            ? { ...item, quantity: Math.min(99, item.quantity + validQty) }
            : item
        );
      }

      return [...prev, { product: customProduct, quantity: validQty }];
    });
    
    // Provide toast notification
    setLastAddedItem({
      name: customProduct.name,
      quantity: validQty,
      time: Date.now()
    });

    // Auto-open logic:
    // Only auto-open if the user hasn't explicitly clicked "أضف منتج آخر" or closed the cart
    if (!dontAutoOpenCart) {
      setIsCartOpen(true);
    }
  };

  // 7. Continue Shopping / Dismiss Cart
  const continueShopping = () => {
    setDontAutoOpenCart(true);
    try {
      sessionStorage.setItem('crispy_dont_auto_open_cart', 'true');
    } catch (e) {}
    setIsCartOpen(false);
  };

  // Close Cart helper
  const closeCart = () => {
    setDontAutoOpenCart(true);
    try {
      sessionStorage.setItem('crispy_dont_auto_open_cart', 'true');
    } catch (e) {}
    setIsCartOpen(false);
  };

  // Open Cart helper
  const openCart = () => {
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    setCartItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(1, Math.min(99, (parseInt(item.quantity, 10) || 1) + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
    const rawPrice = item.product.calculatedPrice || item.product.sellingPrice || 0;
    const basePrice = Math.max(0, parseFloat(rawPrice) || 0);
    
    // Add modifiers price
    let modifiersPrice = 0;
    if (item.product.selectedModifiers && item.product.selectedModifiers.length > 0) {
      modifiersPrice = item.product.selectedModifiers.reduce((sum, mod) => sum + (mod.chargedPrice || 0), 0);
    }
    
    return total + ((basePrice + modifiersPrice) * qty);
  }, 0);

  const clearCart = () => {
    setCartItems([]);
    const cleanPhone = activeUserPhoneRef.current;
    if (cleanPhone) {
      set(ref(db, `UserCarts/${cleanPhone}`), {
        items: [],
        updatedAt: Date.now()
      }).catch(() => {});
    }
  };

  const syncCartWithMenu = (menuData) => {
    if (!menuData || !menuData.categories) return;
    
    const liveProducts = {};
    menuData.categories.forEach(cat => {
      if (cat.products) {
        cat.products.forEach(p => {
          liveProducts[p.id || p.Id] = p;
        });
      }
    });

    setCartItems(prev => {
      let hasChanges = false;
      const updated = prev.map(item => {
        const liveP = liveProducts[item.product.id || item.product.Id];
        if (liveP) {
          let itemChanged = false;
          let newProduct = { ...item.product };

          if (newProduct.sellingPrice !== liveP.sellingPrice) {
            newProduct.sellingPrice = liveP.sellingPrice;
            itemChanged = true;
          }
          
          if (newProduct.selectedWeight) {
             if (liveP.isSoldByWeight) {
                const newCalcPrice = (liveP.sellingPrice / 1000) * newProduct.selectedWeight;
                if (newProduct.calculatedPrice !== newCalcPrice) {
                  newProduct.calculatedPrice = newCalcPrice;
                  itemChanged = true;
                }
             } else if (liveP.weightOptions) {
                const weightObj = liveP.weightOptions.find(w => w.name === newProduct.selectedWeight);
                if (weightObj && newProduct.calculatedPrice !== weightObj.price) {
                  newProduct.calculatedPrice = weightObj.price;
                  itemChanged = true;
                }
             }
          } else {
             if (newProduct.calculatedPrice !== liveP.sellingPrice) {
                 newProduct.calculatedPrice = liveP.sellingPrice;
                 itemChanged = true;
             }
          }
          
          if (newProduct.selectedModifiers && newProduct.selectedModifiers.length > 0) {
            const liveMods = liveP.modifierGroups?.flatMap(g => g.modifiers) || [];
            let modsChanged = false;
            const updatedMods = newProduct.selectedModifiers.map(mod => {
               const liveMod = liveMods.find(m => m.name === mod.name || m.id === mod.id);
               if (liveMod && liveMod.price !== mod.price) {
                 modsChanged = true;
                 return { ...mod, price: liveMod.price, chargedPrice: liveMod.price * (mod.quantity || 1) };
               }
               return mod;
            });
            if (modsChanged) {
               newProduct.selectedModifiers = updatedMods;
               newProduct.finalModifiersPrice = updatedMods.reduce((sum, m) => sum + (m.chargedPrice || 0), 0);
               itemChanged = true;
            }
          }

          if (itemChanged) {
            hasChanges = true;
            return { ...item, product: newProduct };
          }
        }
        return item;
      });
      return hasChanges ? updated : prev;
    });
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      setCartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      syncCartWithMenu,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      openCart,
      closeCart,
      continueShopping,
      dontAutoOpenCart,
      lastAddedItem,
      tableNumber,
      setTableNumber,
      orderType,
      setOrderType,
      isOrderTypeModalOpen,
      setIsOrderTypeModalOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
