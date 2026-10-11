import React, { useState, useEffect } from 'react';
import MenuSection from '../components/Menu/MenuSection';
import ProductModal from '../components/Menu/ProductModal';
import { APP_CONFIG } from '../config/appConfig';
import { useCart } from '../context/CartContext';

export default function MenuPage({ menuData }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { orderType, setIsOrderTypeModalOpen, tableNumber } = useCart();

  useEffect(() => {
    // If visitor enters menu directly without picking order type yet, prompt them
    if (!orderType && !tableNumber) {
      setIsOrderTypeModalOpen(true);
    }
  }, [orderType, tableNumber]);

  const handleProductClick = (product, category) => {
    setSelectedProduct(product);
    setSelectedCategory(category);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setSelectedCategory(null);
  };

  return (
    <div className="pt-20 min-h-screen bg-black-surface">
      <MenuSection menuData={menuData} onProductClick={handleProductClick} />
      
      <ProductModal 
        product={selectedProduct} 
        category={selectedCategory} 
        menuData={menuData}
        isOpen={!!selectedProduct} 
        onClose={closeProductModal} 
      />

      <footer className="bg-black-primary text-text-light p-8 text-center text-sm border-t border-gray-800 flex flex-col items-center gap-4 pb-24 md:pb-8">
        <div className="text-3xl font-display font-black tracking-widest uppercase mb-4">{APP_CONFIG.restaurantName}</div>
        <p className="text-text-muted">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
