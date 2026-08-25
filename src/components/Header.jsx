import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Flame, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { APP_CONFIG } from '../config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { cartItems, setIsCartOpen } = useCart();
  const { lang, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
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

  // Handle Hash Navigation properly when on different pages
  const handleNavClick = (e, path) => {
    if (path.startsWith('/#')) {
      e.preventDefault();
      setIsNavOpen(false);
      const targetId = path.substring(2); // extract 'our-story'
      
      if (location.pathname !== '/') {
        navigate('/');
        // Wait for page transition then scroll
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      } else {
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setIsNavOpen(false);
      if (path === '/' && location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname !== '/') {
        setActiveSection('');
        return;
      }
      
      const sections = ['our-story', 'location'];
      let current = '';
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            current = section;
          }
        }
      }
      
      // If we are at the very top, make sure current is empty so Home is active
      if (window.scrollY < 100) {
        current = '';
      }
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: lang === 'en' ? 'Our Story' : 'قصتنا', path: '/#our-story' },
    { name: lang === 'en' ? 'Location' : 'فروعنا', path: '/#location' },
    { name: t('myAccount'), path: '/account' },
  ];

  const isLinkActive = (link) => {
    if (link.path.startsWith('/#')) {
      return activeSection === link.path.substring(2);
    }
    if (link.path === '/') {
      return location.pathname === '/' && activeSection === '';
    }
    return location.pathname === link.path;
  };


  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 bg-black-primary/95 backdrop-blur-md border-b border-black-surface text-text-light">
        <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2 group">
              <Flame size={24} className="icon-nav-hover group-hover:scale-110 transition-transform" />
              <span className="font-display font-black text-xl md:text-2xl tracking-widest uppercase nav-logo-hover">
                {APP_CONFIG.restaurantName}
              </span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                return (
                  <Link 
                    key={link.name}
                    to={link.path.startsWith('/#') ? link.path : link.path}
                    onClick={(e) => handleNavClick(e, link.path)}
                    className={`font-bold text-sm lg:text-base uppercase transition-colors hover:text-neon-amber ${
                      isActive ? 'text-neon-amber' : 'text-text-light'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="h-6 w-px bg-wood-dark/50"></div>

            <button onClick={toggleLanguage} className="font-bold text-sm border-2 border-transparent hover:border-wood px-3 py-1 rounded-md transition-colors text-text-light mx-2">
{lang === 'ar' ? 'EN' : 'عربي'}
</button>
<button onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 border-2 border-wood hover:bg-wood px-6 py-2 rounded-lg transition-colors relative group"
            >
              <ShoppingBag size={18} className="text-neon-amber group-hover:text-text-light transition-colors" />
              <span className="font-bold text-neon-amber group-hover:text-text-light transition-colors">{t('cart')}</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-neon-amber text-black-primary text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setIsNavOpen(true)}
            className="md:hidden flex hover:text-neon-amber transition-colors focus:outline-none"
          >
            <MenuIcon size={28} />
          </button>
        </div>
      </header>

      {/* Mobile Popover Navigation */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-80 z-[100] bg-black-primary border-l border-black-surface shadow-2xl p-8 flex flex-col"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsNavOpen(false)}
              className="absolute top-6 right-6 text-text-muted hover:text-text-light p-2"
            >
              <X size={24} />
            </button>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-8 mt-12 flex-grow">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                return (
                  <Link 
                    key={link.name}
                    to={link.path} 
                    onClick={(e) => handleNavClick(e, link.path)}
                    className={`inline-block font-display font-black text-3xl uppercase transition-all hover:text-neon-amber hover:translate-x-[-8px] ${
                      isActive ? 'text-neon-amber' : 'text-text-light'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


