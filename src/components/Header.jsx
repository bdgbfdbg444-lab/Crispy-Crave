import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Flame } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { APP_CONFIG } from '../config/appConfig';

export default function Header() {
  const { cartItems, setIsCartOpen } = useCart();
  const { lang, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Handle Hash Navigation properly when on different pages
  const handleNavClick = (e, path) => {
    if (path.startsWith('/#')) {
      e.preventDefault();
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
            <Link to="/" className="flex items-center gap-2 group">
              
              <Logo className="text-xl md:text-3xl" />
            </Link>
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
                    className={`font-bold text-sm lg:text-base uppercase transition-colors hover:text-brand-red ${
                      isActive ? 'text-brand-red' : 'text-text-light'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="h-6 w-px bg-brand-red-dark/50"></div>

            <button onClick={toggleLanguage} className="font-bold text-sm border-2 border-transparent hover:border-brand-red px-3 py-1 rounded-md transition-colors text-text-light mx-2">
{lang === 'ar' ? 'EN' : 'عربي'}
</button>
<button onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 border-2 border-brand-red hover:bg-brand-red px-6 py-2 rounded-lg transition-colors relative group"
            >
              <ShoppingBag size={18} className="text-brand-red group-hover:text-text-light transition-colors" />
              <span className="font-bold text-brand-red group-hover:text-text-light transition-colors">{t('cart')}</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-black-primary text-xs font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Language Toggle + Cart */}
          <div className="md:hidden flex items-center gap-3">
            <button onClick={toggleLanguage} className="font-bold text-sm border-2 border-brand-red hover:bg-brand-red px-3 py-1.5 rounded-md transition-colors text-text-light">
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
      </header>

    </>
  );
}


