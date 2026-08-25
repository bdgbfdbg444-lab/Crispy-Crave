import os

filepath = r'src\context\LanguageContext.jsx'
with open(filepath, 'w', encoding='utf-8') as f:
    f.write('''import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ar: {
    home: 'الرئيسية',
    menu: 'المنيو',
    myAccount: 'حسابي',
    cart: 'السلة',
    trackOrder: 'تتبع الطلب',
    checkout: 'إتمام الطلب',
    emptyCart: 'السلة فارغة',
    total: 'الإجمالي',
    addToCart: 'إضافة للسلة',
    ourStory: 'قصتنا',
    location: 'فروعنا'
  },
  en: {
    home: 'Home',
    menu: 'Menu',
    myAccount: 'My Account',
    cart: 'Cart',
    trackOrder: 'Track Order',
    checkout: 'Checkout',
    emptyCart: 'Cart is empty',
    total: 'Total',
    addToCart: 'Add to Cart',
    ourStory: 'Our Story',
    location: 'Location'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'ar');

  useEffect(() => {
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
''')

print('Rewritten LanguageContext.jsx')
