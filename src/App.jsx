import { useLanguage } from './context/LanguageContext';
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { fetchWebsiteData, fetchMenuData, fetchSystemState } from './services/firebaseService';
import Header from './components/Header';
import ModificationBanner from './components/ModificationBanner';
import CartSidebar from './components/Cart/CartSidebar';
import MobileBottomNav from './components/MobileBottomNav';
import LoadingScreen from './components/LoadingScreen';
import PageTransition from './components/PageTransition';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from './context/CartContext';
import PromoPopup from './components/PromoPopup';

// Code Splitting for Pages
const Home = React.lazy(() => import('./pages/Home'));
const MenuPage = React.lazy(() => import('./pages/MenuPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const MyAccountPage = React.lazy(() => import('./pages/MyAccountPage'));
const TrackOrderPage = React.lazy(() => import('./pages/TrackOrderPage'));
const ProtectionPage = React.lazy(() => import('./pages/ProtectionPage'));
const OurStoryPage = React.lazy(() => import('./pages/OurStoryPage'));
const DriverPortal = React.lazy(() => import('./pages/DriverPortal'));
const ReviewModal = React.lazy(() => import('./components/ReviewModal'));

function AnimatedRoutes({ websiteData, menuData }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Suspense fallback={<LoadingScreen />}><Home websiteData={websiteData} menuData={menuData} /></Suspense></PageTransition>} />
        <Route path="/menu" element={<PageTransition><Suspense fallback={<LoadingScreen />}><MenuPage menuData={menuData} /></Suspense></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Suspense fallback={<LoadingScreen />}><CheckoutPage menuData={menuData} /></Suspense></PageTransition>} />
        <Route path="/our-story" element={<PageTransition><Suspense fallback={<LoadingScreen />}><OurStoryPage websiteData={websiteData} /></Suspense></PageTransition>} />
        <Route path="/account" element={<PageTransition><Suspense fallback={<LoadingScreen />}><MyAccountPage menuData={menuData} /></Suspense></PageTransition>} />
        <Route path="/track/:orderId" element={<PageTransition><Suspense fallback={<LoadingScreen />}><TrackOrderPage menuData={menuData} /></Suspense></PageTransition>} />
        <Route path="/driver" element={<PageTransition><Suspense fallback={<LoadingScreen />}><DriverPortal /></Suspense></PageTransition>} />
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
      // Security Check: Verify origin to prevent cross-site scripting
      const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', window.location.origin];
      if (!allowedOrigins.includes(event.origin) && !event.origin.startsWith('file://')) {
        return;
      }
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
          if (section === 'Press Quote') targetId = 'pressquote';
          if (section === 'Order CTA') targetId = 'ordercta';
          if (section === 'Newsletter') targetId = 'newsletter';
          
          if (section === 'Announcement Popup' || section === 'Promo Popup' || field === 'promoPopup') {
            window.dispatchEvent(new CustomEvent('OPEN_PROMO_POPUP_PREVIEW'));
          } else {
            const el = document.getElementById(targetId);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
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
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ProtectionPage reason={systemState.reason} />
      </Suspense>
    );
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
          <span className="font-bold text-sm hidden md:inline">{lang === 'en' ? 'Share Your Opinion' : 'شاركنا رأيك'}</span>
        </button>

        <Suspense fallback={null}>
          <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />
        </Suspense>
        
        <PromoPopup websiteData={websiteData} />
        
        <CartSidebar />
        <MobileBottomNav />
      </div>
    </HashRouter>
  );
}

export default App;

