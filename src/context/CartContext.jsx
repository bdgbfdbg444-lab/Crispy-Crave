import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('crispy_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('crispy_cart_table') || null;
  });

  useEffect(() => {
    localStorage.setItem('crispy_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem('crispy_cart_table', tableNumber);
    } else {
      localStorage.removeItem('crispy_cart_table');
    }
  }, [tableNumber]);

  const addToCart = (customProduct, quantity) => {
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
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      setCartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      tableNumber,
      setTableNumber
    }}>
      {children}
    </CartContext.Provider>
  );
};
