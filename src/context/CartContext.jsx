import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (customProduct, quantity) => {
    setCartItems(prev => {
      // Check if identical item (same ID, weight, and same modifiers) exists
      const existingItemIndex = prev.findIndex(item => {
        if (item.product.id !== customProduct.id) return false;
        if (item.product.selectedWeight !== customProduct.selectedWeight) return false;
        
        // Deep compare modifiers
        const existingMods = item.product.selectedModifiers || [];
        const newMods = customProduct.selectedModifiers || [];
        if (existingMods.length !== newMods.length) return false;
        
        // Sort and compare IDs
        const existingModIds = existingMods.map(m => m.id).sort().join(',');
        const newModIds = newMods.map(m => m.id).sort().join(',');
        return existingModIds === newModIds;
      });

      if (existingItemIndex >= 0) {
        // Update quantity
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      // Add new item
      return [...prev, { product: customProduct, quantity }];
    });
    
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    setCartItems(prev => {
      const newCart = [...prev];
      const newQuantity = newCart[index].quantity + delta;
      if (newQuantity > 0) {
        newCart[index].quantity = newQuantity;
      }
      return newCart;
    });
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const basePrice = item.product.calculatedPrice || item.product.sellingPrice;
    
    // Add modifiers price
    let modifiersPrice = 0;
    if (item.product.selectedModifiers && item.product.selectedModifiers.length > 0) {
      modifiersPrice = item.product.selectedModifiers.reduce((sum, mod) => sum + (mod.chargedPrice || 0), 0);
    }
    
    return total + ((basePrice + modifiersPrice) * item.quantity);
  }, 0);

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartTotal,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
