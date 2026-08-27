import { useLanguage } from '../context/LanguageContext';
﻿import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MenuSquare, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav() {
  const { lang } = useLanguage();
  const { cartItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black-primary border-t border-gray-800 z-40 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        
        {/* Home Tab */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/' ? 'text-brand-red' : 'text-text-muted hover:text-gray-300'}`}
        >
          <Home size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </Link>

        {/* Account Tab */}
        <Link 
          to="/account" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/account' ? 'text-brand-red' : 'text-text-muted hover:text-gray-300'}`}
        >
          <User size={22} strokeWidth={location.pathname === '/account' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">حسابي</span>
        </Link>

        {/* Menu Tab */}
        <Link 
          to="/menu" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${location.pathname === '/menu' ? 'text-brand-red' : 'text-text-muted hover:text-gray-300'}`}
        >
          <MenuSquare size={22} strokeWidth={location.pathname === '/menu' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">{lang === 'en' ? 'Menu' : 'المنيو'}</span>
        </Link>

        {/* Cart Tab */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-text-muted hover:text-gray-300 transition-colors relative"
        >
          <div className="relative">
            <ShoppingBag size={22} strokeWidth={2} />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-text-light text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-dark">
                {cartItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">السلة</span>
        </button>

      </div>
    </nav>
  );
}
