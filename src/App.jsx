import { useLanguage } from './context/LanguageContext';
import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { fetchWebsiteData, fetchMenuData, fetchSystemState } from './services/firebaseService';
import Header from './components/Header';
import ModificationBanner from './components/ModificationBanner';
import CartSidebar from './components/Cart/CartSidebar';
import MobileBottomNav from './components/MobileBottomNav';
import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';
import MyAccountPage from './pages/MyAccountPage';
import TrackOrderPage from './pages/TrackOrderPage';
import ProtectionPage from './pages/ProtectionPage';
import ReviewModal from './components/ReviewModal';
import LoadingScreen from './components/LoadingScreen';
import PageTransition from './components/PageTransition';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from './context/CartContext';

function AnimatedRoutes({ websiteData, menuData }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home websiteData={websiteData} menuData={menuData} /></PageTransition>} />
        <Route path="/menu" element={<PageTransition><MenuPage menuData={menuData} /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><CheckoutPage menuData={menuData} /></PageTransition>} />
        <Route path="/account" element={<PageTransition><MyAccountPage menuData={menuData} /></PageTransition>} />
        <Route path="/track/:orderId" element={<PageTransition><TrackOrderPage menuData={menuData} /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { lang } = useLanguage();
  const [websiteData, setWebsiteData] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [systemState, setSystemState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { cartItems, setIsCartOpen, tableNumber, setTableNumber } = useCart();
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const query = hash.split('?')[1];
      const params = new URLSearchParams(query);
      const table = params.get('table');
      if (table) {
        setTableNumber(table);
      }
    }
  }, [setTableNumber]);

  useEffect(() => {
    async function loadData() {
      const [wData, mData, sState] = await Promise.all([
        fetchWebsiteData(),
        fetchMenuData(),
        fetchSystemState()
      ]);
      setWebsiteData(wData);
      setMenuData(mData);
      setSystemState(sState);
      
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
    loadData();

    // Poll system state every 30 seconds for protective mode
    const intervalId = setInterval(async () => {
      const sState = await fetchSystemState();
      setSystemState(sState);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'EDITOR_UPDATE') {
        const { section, field, value } = event.data;
        if (section) {
          let targetId = section.toLowerCase();
          if (section === 'Hero') targetId = 'hero';
          if (section === 'Our Story') targetId = 'our-story';
          if (section === 'Location & Hours') targetId = 'location';
          if (section === 'Catering') targetId = 'catering';
          if (section === 'Gallery') targetId = 'gallery';
          if (section === 'FAQ') targetId = 'faq';
          if (section === 'Testimonials') targetId = 'testimonials';
          if (section === 'Social Feed') targetId = 'social';
          
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        setWebsiteData(prev => {
          const newData = { ...prev };
          if (field) newData[field] = value;
          return newData;
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const { syncCartWithMenu } = useCart();
  useEffect(() => {
    if (menuData) {
      syncCartWithMenu(menuData);
    }
  }, [menuData]);

  if (!loading && systemState?.status === 'PROTECTED') {
    return <ProtectionPage reason={systemState.reason} />;
  }

  return (
    <HashRouter>
      <AnimatePresence>
        {loading && <LoadingScreen key="loading" />}
      </AnimatePresence>

      <div className="min-h-screen bg-black-surface text-text-light font-sans flex flex-col relative pb-16 md:pb-0 overflow-x-hidden">
        <ModificationBanner />
        <Header />
        
        {!loading && <AnimatedRoutes websiteData={websiteData} menuData={menuData} />}

        {cartItemsCount > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-24 md:bottom-6 right-6 z-30 bg-brand-red text-text-light p-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <div className="relative">
              <ShoppingBag size={24} />
              <span className="absolute -top-2 -right-2 bg-black-primary text-text-light text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-red">
                {cartItemsCount}
              </span>
            </div>
          </button>
        )}

        <button 
          onClick={() => setIsReviewModalOpen(true)}
          className="fixed bottom-24 md:bottom-6 left-6 z-30 bg-black-primary text-text-light px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform border border-gray-700 hover:border-brand-red hover:text-brand-red"
        >
          <Star size={20} className="fill-current" />
          <span className="font-bold text-sm hidden md:inline">{lang === 'en' ? 'Share Your Opinion' : '???? ????'}</span>
        </button>

        <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
        <CartSidebar />
        <MobileBottomNav />
      </div>
    </HashRouter>
  );
}

export default App;
