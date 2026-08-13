import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Flame, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { APP_CONFIG } from '../config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { cartItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Prevent background scrolling when nav overlay is open
  useEffect(() => {
    if (isNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isNavOpen]);

  const navLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المنيو والطلب', path: '/menu' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 bg-dark/95 backdrop-blur-md border-b border-gray-800 text-white">
        <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Hamburger (Desktop Only) & Logo Wrapper */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsNavOpen(true)}
              className="hidden md:flex hover:text-primary transition-colors focus:outline-none"
            >
              <MenuIcon size={32} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Flame size={24} md:size={28} className="text-primary group-hover:scale-110 transition-transform" />
              <span className="font-display font-black text-xl md:text-2xl tracking-widest uppercase">
                {APP_CONFIG.restaurantName}
              </span>
            </Link>
          </div>

          {/* Cart Button (Desktop Only) */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors relative"
            >
              <ShoppingBag size={20} />
              <span className="font-bold">السلة</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Compact Popover Navigation (Desktop Only) */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-24 right-6 md:right-12 z-[100] bg-dark border border-gray-700 rounded-3xl shadow-2xl p-8 flex flex-col w-72 md:w-80"
          >
            {/* Navigation Links */}
            <nav className="flex flex-col gap-6 mb-8">
              {navLinks.map((link, i) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.name}
                    to={link.path} 
                    onClick={() => setIsNavOpen(false)}
                    className={`inline-block font-display font-black text-3xl uppercase transition-all hover:text-primary hover:translate-x-[-8px] ${
                      isActive ? 'text-primary' : 'text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <button 
                onClick={() => {
                  setIsNavOpen(false);
                  setTimeout(() => setIsCartOpen(true), 150);
                }}
                className="inline-block font-display font-black text-3xl uppercase transition-all hover:text-primary hover:translate-x-[-8px] text-gray-400 text-right flex items-center justify-between"
              >
                السلة
                {cartItemsCount > 0 && (
                  <span className="bg-primary text-white text-lg px-3 py-1 rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Close Button */}
            <button 
              onClick={() => setIsNavOpen(false)}
              className="mt-auto pt-6 border-t border-gray-800 text-gray-400 hover:text-white font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-colors w-full"
            >
              <span>CLOSE</span>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
