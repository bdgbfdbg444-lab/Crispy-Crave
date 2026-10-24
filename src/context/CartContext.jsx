import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { ref, get, set, push, remove, onValue, off, update } from 'firebase/database';
import { getActiveTableSession, setTableSession, invalidateTableSession as purgeTableSession } from '../utils/dineInSecurity';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { userPhone } = useAuth();

  // Group Order State & Room Management
  const [groupOrderId, setGroupOrderIdState] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const groupFromUrl = urlParams.get('group');
      if (groupFromUrl) return groupFromUrl.toUpperCase();
      return localStorage.getItem('crispy_group_order_id') || null;
    } catch (e) {
      return null;
    }
  });

  const [groupData, setGroupData] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [currentGuestName, setCurrentGuestNameState] = useState(() => {
    try {
      return localStorage.getItem('crispy_group_guest_name') || '';
    } catch (e) {
      return '';
    }
  });

  const setCurrentGuestName = (name) => {
    setCurrentGuestNameState(name);
    try {
      if (name) localStorage.setItem('crispy_group_guest_name', name);
      else localStorage.removeItem('crispy_group_guest_name');
    } catch (e) {}
  };

  const setGroupOrderId = (id) => {
    setGroupOrderIdState(id);
    try {
      if (id) localStorage.setItem('crispy_group_order_id', id);
      else localStorage.removeItem('crispy_group_order_id');
    } catch (e) {}
  };

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

  const [tableNumber, setTableNumberState] = useState(() => {
    try {
      localStorage.removeItem('crispy_cart_table');
    } catch (e) {}
    const session = getActiveTableSession();
    return session ? session.table : null;
  });

  // Order Type State (delivery, takeaway, DineIn)
  const [orderType, setOrderTypeState] = useState(() => {
    try {
      const session = getActiveTableSession();
      if (session && session.table) return 'DineIn';
      const savedType = localStorage.getItem('crispy_order_type');
      if (savedType === 'DineIn') return 'takeaway'; // Dine-In cannot be restored without active table session
      return savedType || null;
    } catch (e) {
      return null;
    }
  });

  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false);

  const setOrderType = (type) => {
    setOrderTypeState(type);
    try {
      if (type && type !== 'DineIn') {
        localStorage.setItem('crispy_order_type', type);
      } else {
        localStorage.removeItem('crispy_order_type');
      }
    } catch (e) {}

    const cleanPhone = activeUserPhoneRef.current;
    if (cleanPhone && type && type !== 'DineIn') {
      update(ref(db, `UserCarts/${cleanPhone}`), {
        orderType: type,
        updatedAt: Date.now()
      }).catch(() => {});
    }
  };

  const initTableSession = (tbl) => {
    if (!tbl) return;
    setTableSession(tbl);
    setTableNumberState(String(tbl));
    setOrderTypeState('DineIn');
  };

  const invalidateTableSession = () => {
    purgeTableSession();
    setTableNumberState(null);
    setOrderTypeState('takeaway');
    try {
      localStorage.setItem('crispy_order_type', 'takeaway');
    } catch (e) {}
  };

  const setTableNumber = (tbl) => {
    if (tbl) {
      initTableSession(tbl);
    } else {
      invalidateTableSession();
    }
  };

  useEffect(() => {
    if (tableNumber) {
      setOrderTypeState('DineIn');
    } else if (orderType === 'DineIn') {
      setOrderTypeState('takeaway');
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

  // 2. Group Order Realtime Firebase Listener
  useEffect(() => {
    if (!groupOrderId) {
      setGroupData(null);
      return;
    }

    const groupRef = ref(db, `GroupOrders/${groupOrderId}`);
    const unsubscribe = onValue(groupRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGroupData(data);
      } else {
        setGroupData(null);
        setGroupOrderIdState(null);
        try { localStorage.removeItem('crispy_group_order_id'); } catch(e) {}
      }
    });

    return () => {
      off(groupRef);
    };
  }, [groupOrderId]);

  // Check URL query for ?group=GRP-XXXX on load
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const groupFromUrl = urlParams.get('group');
      if (groupFromUrl) {
        const upper = groupFromUrl.trim().toUpperCase();
        setGroupOrderId(upper);
        if (!currentGuestName) {
          setIsGroupModalOpen(true);
        }
      }
    } catch (e) {}
  }, []);

  const isGroupOrder = Boolean(groupOrderId && groupData && groupData.status === 'open');
  const isGroupHost = Boolean(
    isGroupOrder && (
      (userPhone && groupData?.hostPhone === userPhone) ||
      (groupData?.hostName && currentGuestName && groupData.hostName.trim().toLowerCase() === currentGuestName.trim().toLowerCase())
    )
  );

  const groupItemsList = useMemo(() => {
    if (!isGroupOrder || !groupData?.items) return [];
    return Object.entries(groupData.items).map(([key, val]) => ({
      ...val,
      groupItemKey: key,
      guestName: val.guestName || 'ضيف'
    }));
  }, [isGroupOrder, groupData?.items]);

  const effectiveCartItems = isGroupOrder ? groupItemsList : cartItems;

  // 3. Persist cart to localStorage on any local change
  useEffect(() => {
    localStorage.setItem('crispy_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);


  // 4. Cloud Cart Synchronization across browsers / devices
  // When a user logs in with their phone, fetch their cloud cart and sync
  useEffect(() => {
    const cleanPhone = getCleanPhone(userPhone);
    activeUserPhoneRef.current = cleanPhone;

    if (!cleanPhone) return;

    const cartRef = ref(db, `UserCarts/${cleanPhone}`);

    // Initial fetch on login
    get(cartRef).then(async (snap) => {
      let cloudGroupOrderId = null;
      let cloudGuestName = null;

      if (snap.exists()) {
        const cloudData = snap.val();
        const cloudItems = Array.isArray(cloudData?.items) ? cloudData.items : [];
        cloudGroupOrderId = cloudData?.activeGroupOrderId || null;
        cloudGuestName = cloudData?.groupGuestName || null;

        // Restore order type if saved in cloud (unless inside an active DineIn table QR session)
        if (cloudData?.orderType && !getActiveTableSession()?.table) {
          setOrderTypeState(cloudData.orderType);
          try { localStorage.setItem('crispy_order_type', cloudData.orderType); } catch(e) {}
        }

        setCartItems((localItems) => {
          // If local cart is empty (e.g. newly opened browser or cleared cache), load cloud cart!
          if (!localItems || localItems.length === 0) {
            return cloudItems;
          }

          // If local cart has items, merge intelligently without duplicate product configurations
          if (cloudItems.length === 0) {
            update(cartRef, { items: localItems, updatedAt: Date.now() }).catch(() => {});
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
          update(cartRef, { items: merged, updatedAt: Date.now() }).catch(() => {});
          return merged;
        });
      } else {
        // No cloud cart exists yet. If we have local items, upload them immediately
        setCartItems((localItems) => {
          if (localItems && localItems.length > 0) {
            update(cartRef, { items: localItems, updatedAt: Date.now() }).catch(() => {});
          }
          return localItems;
        });
      }

      // Fallback check: If no activeGroupOrderId was recorded in cloudData, check if user is host of an open GroupOrder
      if (!cloudGroupOrderId) {
        try {
          const allGroupsSnap = await get(ref(db, 'GroupOrders'));
          if (allGroupsSnap.exists()) {
            const allGroups = allGroupsSnap.val();
            const hostGroupEntry = Object.entries(allGroups).find(([id, g]) => 
              g?.status === 'open' && g?.hostPhone && getCleanPhone(g.hostPhone) === cleanPhone
            );
            if (hostGroupEntry) {
              cloudGroupOrderId = hostGroupEntry[0];
              cloudGuestName = hostGroupEntry[1]?.hostName || 'المنظم';
            }
          }
        } catch (e) {
          console.warn('[CartSync] Fallback group check error:', e);
        }
      }

      // If active group order was found, activate it on this device!
      if (cloudGroupOrderId) {
        try {
          const gSnap = await get(ref(db, `GroupOrders/${cloudGroupOrderId}`));
          if (gSnap.exists() && gSnap.val()?.status === 'open') {
            setGroupOrderIdState(cloudGroupOrderId);
            try { localStorage.setItem('crispy_group_order_id', cloudGroupOrderId); } catch(e) {}
            if (cloudGuestName) {
              setCurrentGuestNameState(cloudGuestName);
              try { localStorage.setItem('crispy_group_guest_name', cloudGuestName); } catch(e) {}
            }
            setGroupData(gSnap.val());

            // Ensure cloud has it saved
            update(cartRef, {
              activeGroupOrderId: cloudGroupOrderId,
              groupGuestName: cloudGuestName || 'ضيف',
              updatedAt: Date.now()
            }).catch(() => {});
          } else {
            // Group order is closed/expired
            update(cartRef, {
              activeGroupOrderId: null,
              groupGuestName: null
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('[CartSync] Group verify error:', e);
        }
      }
    }).catch((err) => {
      console.warn('[CartSync] Cloud cart fetch error:', err);
    });

    // Real-time listener for remote cart and group order changes (e.g. user acted on another device)
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

        // Sync orderType if changed on another device
        if (data.orderType && !getActiveTableSession()?.table) {
          setOrderTypeState(data.orderType);
          try { localStorage.setItem('crispy_order_type', data.orderType); } catch(e) {}
        }

        // Realtime sync for activeGroupOrderId across devices
        if (data.activeGroupOrderId) {
          const targetId = data.activeGroupOrderId;
          const gRef = ref(db, `GroupOrders/${targetId}`);
          get(gRef).then((gSnap) => {
            if (gSnap.exists() && gSnap.val()?.status === 'open') {
              setGroupOrderIdState(targetId);
              try { localStorage.setItem('crispy_group_order_id', targetId); } catch(e) {}
              if (data.groupGuestName) {
                setCurrentGuestNameState(data.groupGuestName);
                try { localStorage.setItem('crispy_group_guest_name', data.groupGuestName); } catch(e) {}
              }
              setGroupData(gSnap.val());
            }
          }).catch(() => {});
        } else if (data.activeGroupOrderId === null) {
          // Cleared remotely
          setGroupOrderIdState(null);
          setGroupData(null);
          try { localStorage.removeItem('crispy_group_order_id'); } catch(e) {}
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
      update(cartRef, {
        items: cartItems,
        updatedAt: Date.now()
      }).catch((err) => {
        console.warn('[CartSync] Cloud cart update error:', err);
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [cartItems]);

  // 6. Add to Cart Handler (Supports Individual & Group Order)
  const addToCart = (customProduct, quantity) => {
    const isSoldOut = Boolean(customProduct?.isSoldOut || customProduct?.IsSoldOut || customProduct?.isAvailable === false || customProduct?.IsAvailable === false);
    if (isSoldOut) {
      alert('عذراً، هذا الصنف نفدت كميته في المطعم حالياً ولا يمكن إضافته للطلب.');
      return;
    }
    const validQty = Math.max(1, Math.min(99, parseInt(quantity, 10) || 1));

    if (isGroupOrder) {
      let guestName = currentGuestName;
      if (!guestName) {
        guestName = prompt('يرجى كتابة اسمك ليُطبع على الساندوتش:') || 'صديق';
        setCurrentGuestName(guestName);
      }
      const itemRef = push(ref(db, `GroupOrders/${groupOrderId}/items`));
      set(itemRef, {
        product: customProduct,
        quantity: validQty,
        guestName: (guestName || 'ضيف').trim(),
        addedAt: Date.now()
      }).catch(err => {
        console.error("Failed to add to group order:", err);
      });

      setLastAddedItem({
        name: customProduct.name,
        quantity: validQty,
        time: Date.now()
      });
      if (!dontAutoOpenCart) setIsCartOpen(true);
      return;
    }

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

    // Auto-open logic
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
    if (isGroupOrder) {
      const item = groupItemsList[index];
      if (item?.groupItemKey) {
        remove(ref(db, `GroupOrders/${groupOrderId}/items/${item.groupItemKey}`)).catch(() => {});
      }
      return;
    }
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItem = (index, updatedProduct) => {
    if (isGroupOrder) {
      const item = groupItemsList[index];
      if (item?.groupItemKey) {
        update(ref(db, `GroupOrders/${groupOrderId}/items/${item.groupItemKey}`), {
          product: updatedProduct,
          updatedAt: Date.now()
        }).catch(() => {});
      }
      return;
    }
    setCartItems(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = {
          ...copy[index],
          product: updatedProduct
        };
      }
      return copy;
    });
  };

  const updateQuantity = (index, delta) => {
    if (isGroupOrder) {
      const item = groupItemsList[index];
      if (item?.groupItemKey) {
        const newQuantity = Math.max(1, Math.min(99, (parseInt(item.quantity, 10) || 1) + delta));
        set(ref(db, `GroupOrders/${groupOrderId}/items/${item.groupItemKey}/quantity`), newQuantity).catch(() => {});
      }
      return;
    }
    setCartItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQuantity = Math.max(1, Math.min(99, (parseInt(item.quantity, 10) || 1) + delta));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const cartTotal = effectiveCartItems.reduce((total, item) => {
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
    const rawPrice = item.product?.calculatedPrice || item.product?.sellingPrice || 0;
    const basePrice = Math.max(0, parseFloat(rawPrice) || 0);
    
    // Add modifiers price
    let modifiersPrice = 0;
    if (item.product?.selectedModifiers && item.product.selectedModifiers.length > 0) {
      modifiersPrice = item.product.selectedModifiers.reduce((sum, mod) => sum + (mod.chargedPrice || 0), 0);
    }
    
    return total + ((basePrice + modifiersPrice) * qty);
  }, 0);

  const clearCart = () => {
    if (isGroupOrder) {
      if (groupOrderId) {
        remove(ref(db, `GroupOrders/${groupOrderId}/items`)).catch(() => {});
      }
      return;
    }
    setCartItems([]);
    const cleanPhone = activeUserPhoneRef.current;
    if (cleanPhone) {
      update(ref(db, `UserCarts/${cleanPhone}`), {
        items: [],
        updatedAt: Date.now()
      }).catch(() => {});
    }
  };

  const startGroupOrder = async (hostName) => {
    const code = 'GRP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const groupRef = ref(db, `GroupOrders/${code}`);
    const cleanPhone = activeUserPhoneRef.current;
    const initialData = {
      id: code,
      hostName: hostName.trim(),
      hostPhone: cleanPhone || userPhone || '',
      createdAt: Date.now(),
      status: 'open',
      items: {}
    };
    await set(groupRef, initialData);
    setCurrentGuestName(hostName.trim());
    setGroupOrderId(code);
    setGroupData(initialData);
    setIsCartOpen(true);

    // Sync to user's cloud account so all devices immediately open this group order!
    if (cleanPhone) {
      update(ref(db, `UserCarts/${cleanPhone}`), {
        activeGroupOrderId: code,
        groupGuestName: hostName.trim(),
        updatedAt: Date.now()
      }).catch(() => {});
    }
    return code;
  };

  const joinGroupOrder = async (code, guestName) => {
    const cleanCode = code.trim().toUpperCase();
    const groupRef = ref(db, `GroupOrders/${cleanCode}`);
    const snap = await get(groupRef);
    if (snap.exists() && snap.val()?.status === 'open') {
      setCurrentGuestName(guestName.trim());
      setGroupOrderId(cleanCode);
      setGroupData(snap.val());
      setIsCartOpen(true);

      // Sync to user's cloud account
      const cleanPhone = activeUserPhoneRef.current;
      if (cleanPhone) {
        update(ref(db, `UserCarts/${cleanPhone}`), {
          activeGroupOrderId: cleanCode,
          groupGuestName: guestName.trim(),
          updatedAt: Date.now()
        }).catch(() => {});
      }
      return true;
    } else {
      alert('عذراً، كود الغرفة غير صحيح أو أن الطلب الجماعي غير متاح.');
      return false;
    }
  };

  const leaveGroupOrder = () => {
    setGroupOrderId(null);
    setGroupData(null);
    try {
      localStorage.removeItem('crispy_group_order_id');
      localStorage.removeItem('crispy_group_guest_name');
      const url = new URL(window.location.href);
      url.searchParams.delete('group');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}

    // Clear from cloud account so other devices also exit
    const cleanPhone = activeUserPhoneRef.current;
    if (cleanPhone) {
      update(ref(db, `UserCarts/${cleanPhone}`), {
        activeGroupOrderId: null,
        groupGuestName: null,
        updatedAt: Date.now()
      }).catch(() => {});
    }
  };

  // Full session reset on logout or clean start
  const resetSession = () => {
    // 1. Reset Cart Items
    setCartItems([]);
    try { localStorage.removeItem('crispy_cart_items'); } catch (e) {}

    // 2. Reset Group Order
    setGroupOrderIdState(null);
    setCurrentGuestNameState('');
    setGroupData(null);
    setIsGroupModalOpen(false);
    try {
      localStorage.removeItem('crispy_group_order_id');
      localStorage.removeItem('crispy_group_guest_name');
      const url = new URL(window.location.href);
      url.searchParams.delete('group');
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}

    // 3. Reset Order Type & Table Sessions
    setOrderTypeState(null);
    setTableNumberState(null);
    try {
      localStorage.removeItem('crispy_order_type');
      localStorage.removeItem('crispy_cart_table');
      purgeTableSession();
    } catch (e) {}

    // 4. Reset Editing & Tracking Orders
    try {
      localStorage.removeItem('editingOrderId');
      localStorage.removeItem('editingOrderDisplayId');
      localStorage.removeItem('editingOrderDetails');
      localStorage.removeItem('modificationExpiresAt');
      localStorage.removeItem('activeOrderId');
      localStorage.removeItem('activeOrderTotal');
      sessionStorage.removeItem('crispy_dont_auto_open_cart');
    } catch (e) {}

    // 5. Close cart sidebar if open
    setIsCartOpen(false);
  };

  // Automatic cleanup on logout (when userPhone changes from a phone number to null)
  const prevUserPhoneRef = useRef(userPhone);
  useEffect(() => {
    if (prevUserPhoneRef.current && !userPhone) {
      resetSession();
    }
    prevUserPhoneRef.current = userPhone;
  }, [userPhone]);

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
      cartItems: effectiveCartItems, 
      setCartItems, 
      addToCart, 
      removeFromCart, 
      updateCartItem,
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
      initTableSession,
      invalidateTableSession,
      isDineInAvailable: Boolean(tableNumber),
      orderType,
      setOrderType,
      isOrderTypeModalOpen,
      setIsOrderTypeModalOpen,
      // Group Order exports
      groupOrderId,
      groupData,
      isGroupOrder,
      isGroupHost,
      currentGuestName,
      setCurrentGuestName,
      isGroupModalOpen,
      setIsGroupModalOpen,
      startGroupOrder,
      joinGroupOrder,
      leaveGroupOrder,
      resetSession
    }}>
      {children}
    </CartContext.Provider>
  );
};
