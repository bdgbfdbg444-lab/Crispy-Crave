import React, { useState, useEffect } from 'react';
import MenuSection from '../components/Menu/MenuSection';
import ProductModal from '../components/Menu/ProductModal';
import { APP_CONFIG } from '../config/appConfig';
import { useCart } from '../context/CartContext';
import { getActiveTableSession, verifyDineInGpsProximity } from '../utils/dineInSecurity';

export default function MenuPage({ menuData, websiteData }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { orderType, setIsOrderTypeModalOpen, tableNumber, invalidateTableSession, isGroupOrder, isGroupHost, groupOrderId } = useCart();

  useEffect(() => {
    // 1. If table session is active, verify it has not expired
    if (tableNumber) {
      const activeSession = getActiveTableSession(websiteData?.dineInSessionDurationMinutes || 45);
      if (!activeSession) {
        alert('⏰ انتهت صلاحية جلسة الطاولة المؤقتة. تم تحويل الطلب للاستلام أو التوصيل.');
        invalidateTableSession();
        return;
      }

      // 2. If GPS geofence is enabled, check proximity
      if (websiteData?.dineInRequireGps) {
        verifyDineInGpsProximity(websiteData).then(res => {
          if (!res.verified) {
            alert(res.message || 'أنت خارج نطاق الصالة حالياً.');
            invalidateTableSession();
          }
        });
      }
    }

    // 3. If visitor enters menu directly without picking order type yet, prompt them (unless in a group order or invited to a group)
    const urlParams = new URLSearchParams(window.location.search);
    const hasGroupParam = Boolean(urlParams.get('group')) || window.location.hash.includes('group=');
    const isGuestInGroup = Boolean((isGroupOrder || groupOrderId || hasGroupParam) && !isGroupHost);

    if (!orderType && !tableNumber && !isGuestInGroup) {
      setIsOrderTypeModalOpen(true);
    }
  }, [orderType, tableNumber, websiteData, invalidateTableSession, isGroupOrder, groupOrderId, isGroupHost]);

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
