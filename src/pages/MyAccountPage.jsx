import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut, signInAnonymously, deleteUser } from 'firebase/auth';
import { ref, get, set, update, onValue, off } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Package, MapPin, Edit3, LogOut, ChevronLeft, Navigation, ChevronDown, ChevronUp, Home, Briefcase, Plus, Trash2, Settings, User, CheckCircle2, RotateCcw, Star, Flame, PlusCircle } from 'lucide-react';
import AddressMapPicker, { formatAddressDetails, checkZoneMismatch } from '../components/AddressMapPicker';
import { APP_CONFIG } from '../config/appConfig';
import { fetchMenuData } from '../services/firebaseService';

const DashboardView = ({ customerData, onLogout, onDeleteAccount, menuData }) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [activeView, setActiveView] = useState('dashboard');
  const [debugError, setDebugError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  const [activeOrders, setActiveOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [zoneUpdateInput, setZoneUpdateInput] = useState('');
  
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
    const [addressDraft, setAddressDraft] = useState({ zone: '', street: '', building: '', floor: '', apartment: '', landmark: '', lat: null, lng: null, fullAddress: '' });
  
  const [emailEditMode, setEmailEditMode] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [passwordForEmailChange, setPasswordForEmailChange] = useState('');

  const [phoneEditMode, setPhoneEditMode] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState('');
  const [otpError, setOtpError] = useState('');


  // Unified Orders Logic: Combine POS History and Web Orders
  useEffect(() => {
      if (!customerData?.Phone) return;
      
      try {
        let historyArray = customerData?.History || {};
        if (!Array.isArray(historyArray)) {
           historyArray = Object.values(historyArray);
        }
        
        const posOrders = historyArray.map(o => ({
            OrderNumber: o.OrderNumber,
            Status: o.Status,
            OrderDate: o.OrderDate,
            TotalAmount: o.TotalAmount || 0,
            Source: 'POS',
            Items: o.Items || []
        }));
        
        // Use POS orders directly, since POS syncs immediately and we can't read Orders node due to security rules
        const allOrders = [...posOrders].sort((a, b) => { 
            const da = new Date(a.OrderDate || 0).getTime(); 
            const db = new Date(b.OrderDate || 0).getTime(); 
            return db - da; 
        });
        
        setHistory(allOrders);
        
        const terminalStatuses = ['Completed', 'Cancelled', 'Voided', 'Refunded', 'مكتملة', 'ملغاة'];
        setActiveOrders(allOrders.filter(o => !terminalStatuses.includes(o.Status)));
        setPastOrders(allOrders.filter(o => terminalStatuses.includes(o.Status)));
        setDebugError(null);
      } catch(err) {
        setDebugError(err.message + " | " + err.stack);
      }
    }, [customerData]);

  const translateStatus = (status) => {
    if (lang === 'en') return status;
    const map = {
      'Pending': 'قيد الانتظار',
      'Accepted': 'مقبول',
      'Preparing': 'جاري التجهيز',
      'Ready': 'جاهز للتسليم',
      'OutForDelivery': 'في الطريق إليك',
      'Completed': 'مكتمل (تم التوصيل)',
      'Cancelled': 'ملغي',
      'Voided': 'ملغي (Voided)',
      'Refunded': 'مسترجع'
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    if (['Completed'].includes(status)) return 'bg-green-500/20 text-green-500';
    if (['Cancelled', 'Voided', 'Refunded'].includes(status)) return 'bg-brand-red/20 text-brand-red';
    return 'bg-amber-500/20 text-amber-500';
  };

  const handleOrderAgain = (order) => {
    if (order.Items && Array.isArray(order.Items)) {
      order.Items.forEach(item => addToCart(item));
      setIsCartOpen(true);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailEditMode) {
      setNewEmail(customerData.Email || '');
      setEmailEditMode(true);
      return;
    }
    // Simple mock save for now, usually would update Firebase Auth & DB
    try {
        const updates = {};
        updates[`PublicCustomers/${customerData.Phone}/Email`] = newEmail;
        await update(ref(db), updates);
        setEmailEditMode(false);
    } catch(e) {
        alert(e.message);
    }
  };

  const handleSaveAddress = (addressObj) => {
      const currentAddresses = customerData.addresses || [];
      let newAddresses;
      if (editingAddressIndex !== null) {
          newAddresses = [...currentAddresses];
          newAddresses[editingAddressIndex] = addressObj;
      } else {
          newAddresses = [...currentAddresses, addressObj];
      }
      saveAddressesToFirebase(newAddresses);
      setIsAddingAddress(false);
      setEditingAddressIndex(null);
  };

  const saveAddressesToFirebase = async (addressesArray) => {
      try {
          const updates = {};
          updates[`PublicCustomers/${customerData.Phone}/addresses`] = addressesArray;
          if (addressesArray.length === 1 && !customerData.Zone) {
              updates[`PublicCustomers/${customerData.Phone}/Zone`] = addressesArray[0].zone;
              updates[`PublicCustomers/${customerData.Phone}/zone`] = addressesArray[0].zone;
          }
          await update(ref(db), updates);
      } catch (err) {
          console.error('Error saving address:', err);
      }
  };

  const deleteAddress = (index) => {
      const current = customerData.addresses || [];
      const newAddresses = current.filter((_, i) => i !== index);
      saveAddressesToFirebase(newAddresses);
  };


  const normalizePhone = (p) => {
    if (!p) return '';
    let cp = p.replace(/\D/g, '');
    if (cp.startsWith('20') && cp.length === 12) cp = '0' + cp.substring(2);
    else if (cp.startsWith('0020') && cp.length === 14) cp = '0' + cp.substring(4);
    else if (cp.startsWith('+20') && cp.length === 13) cp = '0' + cp.substring(3);
    else if (cp.length === 10 && !cp.startsWith('0')) cp = '0' + cp;
    return cp;
  };

  const handleSendPhoneOtp = async () => {
    const clean = normalizePhone(newPhone);
    if (!clean || clean.length !== 11) {
      alert(lang === 'en' ? 'Please enter a valid 11-digit phone number' : 'يرجى إدخال رقم هاتف صحيح');
      return;
    }
    
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPhoneOtp(code);
    
    // Push to WhatsAppQueue
    const { push, set: firebaseSet } = await import('firebase/database');
    const newReqRef = push(ref(db, 'WhatsAppQueue'));
    await firebaseSet(newReqRef, {
      phone: clean,
      message: `كود التحقق لتغيير رقم الهاتف هو: ${code}`,
      type: 'otp',
      code: code,
      timestamp: Date.now()
    });
    
    setPhoneOtpStep(true);
    setOtpError('');
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp !== generatedPhoneOtp) {
      setOtpError(lang === 'en' ? 'Invalid OTP code' : 'كود غير صحيح');
      return;
    }
    
    const clean = normalizePhone(newPhone);
    const { push, set: firebaseSet, update: firebaseUpdate, remove: firebaseRemove } = await import('firebase/database');
    
    try {
      // 1. Send update to POS
      const updateRef = push(ref(db, 'CustomerUpdates'));
      await firebaseSet(updateRef, {
        OldPhone: customerData.Phone,
        NewPhone: clean,
        Timestamp: new Date().toISOString()
      });
      
      // 2. Update UidToPhone mapping
      const { auth } = await import('../firebase');
      const user = auth.currentUser;
      if (user) {
        await firebaseSet(ref(db, `UidToPhone/${user.uid}`), clean);
      }
      
      // 3. Clone PublicCustomer data to new phone key (POS will eventually push it, but this makes it instant)
      const newData = { ...customerData, Phone: clean };
      await firebaseSet(ref(db, `PublicCustomers/${clean}`), newData);
      
      // We don't delete the old one immediately to avoid race conditions, but we can update our local context
      alert(lang === 'en' ? 'Phone number updated successfully!' : 'تم تحديث رقم الهاتف بنجاح!');
      setPhoneEditMode(false);
      setPhoneOtpStep(false);
      setPhoneOtp('');
      
      // Refresh AuthContext
      if (window.location) {
         window.location.reload();
      }
    } catch(e) {
      alert(e.message);
    }
  };

  const BackButton = () => (
    <button onClick={() => setActiveView('dashboard')} className="mb-6 px-4 py-2 rounded-lg bg-black-surface border border-brand-red-dark text-text-light font-bold flex items-center gap-2 hover:bg-brand-red/20 transition-all">
      <ChevronLeft size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
      {lang === 'en' ? 'Back to Dashboard' : 'العودة للوحة التحكم'}
    </button>
  );

  return (
    <div className="w-full bg-black min-h-screen text-text-light font-sans pb-20" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-7xl mx-auto">
        
        {activeView === 'dashboard' && (
          <div className="flex flex-col gap-6 lg:gap-8">
            
            {/* Header Profile */}
            <div className="bg-black-surface border border-brand-red/10 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-amber-500 opacity-50"></div>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#0D0D0D] border-2 border-brand-red flex items-center justify-center shadow-[0_0_15px_rgba(230,57,70,0.3)]">
                    <span className="font-display text-4xl text-brand-red font-black">{customerData.Name ? customerData.Name.charAt(0).toUpperCase() : 'M'}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-red text-white flex items-center justify-center border-2 border-black-surface">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <h1 className="font-display text-2xl lg:text-3xl font-black">{lang === 'en' ? 'Welcome,' : 'أهلاً بك،'} {customerData.Name}</h1>
                    <span className="px-3 py-1 rounded-full bg-brand-red/20 text-brand-red text-xs font-bold hidden sm:block">
                      {lang === 'en' ? 'VIP Member' : 'عضوية النخبة (VIP)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-text-muted text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-500">tag</span> 
                      {lang === 'en' ? 'ID: ' : 'رقم العضوية '}BB-{customerData.Phone?.substring(customerData.Phone.length - 4) || '0000'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
                    <span className="flex items-center gap-1 text-brand-red">
                      <Flame size={14} />
                      {lang === 'en' ? 'Active Account' : 'عضو فعال'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Link to="/menu" className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-brand-red/10 border border-brand-red text-text-light hover:bg-brand-red font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(230,57,70,0.15)] hover:shadow-[0_0_25px_rgba(230,57,70,0.4)]">
                <PlusCircle size={20} />
                {lang === 'en' ? 'New Order' : 'طلب جديد'}
              </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black-surface border border-brand-red/10 rounded-2xl p-6 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-text-muted">{lang === 'en' ? 'TOTAL ORDERS' : 'إجمالي الطلبات'}</span>
                  <Package size={20} className="text-brand-red" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{customerData.TotalOrders || 0}</span>
                  <span className="text-sm text-text-muted">{lang === 'en' ? 'Orders' : 'طلب مكتمل'}</span>
                </div>
              </div>
              <div className="bg-black-surface border border-brand-red/10 rounded-2xl p-6 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-text-muted">{lang === 'en' ? 'SMOKE POINTS' : 'نقاط الدخان'}</span>
                  <Flame size={20} className="text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-amber-500">{customerData.Points || 0}</span>
                  <span className="text-sm text-text-muted">{lang === 'en' ? 'Pts' : 'نقطة'}</span>
                </div>
              </div>
              <div className="bg-black-surface border border-brand-red/10 rounded-2xl p-6 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-text-muted">{lang === 'en' ? 'TIER LEVEL' : 'مستوى العضوية'}</span>
                  <ShieldCheck size={20} className="text-text-light" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black">{customerData.Tier || (lang === 'en' ? ((customerData.Points || 0) > 1000 ? 'Golden Pitmaster' : 'Silver Pitmaster') : ((customerData.Points || 0) > 1000 ? 'الشيف الذهبي' : 'الشيف الفضي'))}</span>
                </div>
              </div>
            </div>

            {/* Active Order Tracker */}
            {activeOrders.length > 0 && (
              <div className="bg-black-surface border border-brand-red/40 rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-amber-500 opacity-50"></div>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-red"></span>
                  </div>
                  <div>
                    <h4 className="font-bold text-text-light text-lg flex flex-wrap items-center gap-3">
                      {lang === 'en' ? `Active Order #${activeOrders[0].OrderNumber}` : `الطلب الحالي #${activeOrders[0].OrderNumber}`}
                      <span className="px-3 py-1 rounded-full bg-brand-red/20 text-brand-red text-xs whitespace-nowrap">{translateStatus(activeOrders[0].Status)}</span>
                    </h4>
                  </div>
                </div>
                <button onClick={() => { if (activeOrders[0].TrackingToken) navigate('/track/' + activeOrders[0].TrackingToken); else { setActiveView('orders'); setExpandedOrder(activeOrders[0].OrderNumber); } }} className="w-full sm:w-auto px-6 py-3 bg-[#0D0D0D] border border-brand-red/50 hover:bg-brand-red text-text-light rounded-xl transition-all text-sm font-bold flex items-center justify-center gap-2">
                  <Navigation size={18} />
                  {lang === 'en' ? 'Track Order' : 'تتبع مسار الطلب'}
                </button>
              </div>
            )}

            {/* Layout Grid for Recent Orders & Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-10">
              
              {/* Recent Orders */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold font-display">{lang === 'en' ? 'Recent Orders' : 'الطلبات الأخيرة'}</h2>
                  <button onClick={() => setActiveView('orders')} className="text-sm text-text-muted hover:text-text-light transition-colors">{lang === 'en' ? 'View Full History' : 'عرض السجل الكامل'}</button>
                </div>
                
                {pastOrders.slice(0, 3).map((order, idx) => (
                  <div key={idx} className="bg-[#0D0D0D] border border-brand-red/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-red/30 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-lg">{lang === 'en' ? 'Order' : 'طلب'} #{order.OrderNumber}</span>
                      <span className="text-text-muted text-sm">{order.TotalAmount} {lang === 'en' ? 'EGP' : 'ج.م'} • {translateStatus(order.Status)}</span>
                    </div>
                    <button onClick={() => { setActiveView('orders'); setExpandedOrder(order.OrderNumber); }} className="px-6 py-2.5 bg-black-surface hover:bg-brand-red/20 border border-brand-red/20 rounded-xl text-sm font-bold transition-colors">
                      {lang === 'en' ? 'Details' : 'التفاصيل'}
                    </button>
                  </div>
                ))}
                {pastOrders.length === 0 && (
                  <div className="bg-[#0D0D0D] border border-brand-red/10 rounded-2xl p-8 text-center text-text-muted">
                    {lang === 'en' ? 'No past orders yet.' : 'لا يوجد طلبات سابقة.'}
                  </div>
                )}
              </div>

              {/* Side Panels */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                
                  
                  <div className="bg-black-surface border border-brand-red/10 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-red">
                      <MapPin size={20} />
                      <h2 className="text-lg font-bold text-text-light">{lang === 'en' ? 'Delivery Address' : 'عنوان التوصيل الرئيسي'}</h2>
                    </div>
                  </div>
                  {customerData.addresses && customerData.addresses.length > 0 ? (
                    <div className="bg-[#0D0D0D] rounded-xl p-4 border border-brand-red/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{customerData.addresses[0].label || (lang === 'en' ? 'Home' : 'المنزل')}</span>
                        <span className="text-xs text-brand-red px-2 py-1 bg-brand-red/10 rounded">{customerData.addresses[0].zone || ''}</span>
                      </div>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {formatAddressDetails(customerData.addresses[0])}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">{lang === 'en' ? 'No saved addresses.' : 'لا يوجد عنوان محفوظ.'}</p>
                  )}
                  <button onClick={() => setActiveView('addresses')} className="w-full py-3 bg-[#0D0D0D] hover:bg-brand-red/10 border border-brand-red/20 rounded-xl text-sm font-bold transition-colors">
                    {lang === 'en' ? 'Manage Addresses' : 'إدارة العناوين'}
                  </button>
                </div>

                
                  
                  <div className="bg-black-surface border border-brand-red/10 rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-red">
                      <User size={20} />
                      <h2 className="text-lg font-bold text-text-light">{lang === 'en' ? 'Account Info' : 'بيانات الحساب'}</h2>
                    </div>
                    <button onClick={() => setActiveView('settings')} className="text-sm text-brand-red hover:underline">{lang === 'en' ? 'Edit' : 'تعديل البيانات'}</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="bg-[#0D0D0D] rounded-xl p-4 border border-brand-red/10 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-text-muted">{lang === 'en' ? 'Phone' : 'رقم الجوال'}</span>
                        <span className="font-bold text-sm" dir="ltr">{customerData.Phone}</span>
                      </div>
                      <CheckCircle2 size={16} className="text-amber-500" />
                    </div>
                    <div className="bg-[#0D0D0D] rounded-xl p-4 border border-brand-red/10 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-text-muted">{lang === 'en' ? 'Email' : 'البريد الإلكتروني'}</span>
                        <span className="font-bold text-sm" dir="ltr">{customerData.Email || '---'}</span>
                      </div>
                      {customerData.Email && <CheckCircle2 size={16} className="text-amber-500" />}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeView === 'orders' && (
          <div className="w-full max-w-4xl mx-auto">
            <BackButton />
            <h3 className="text-3xl font-display font-bold mb-8 text-text-light">{lang === 'en' ? 'Order History' : 'سجل الطلبات'}</h3>
              
              {debugError && <div className="p-4 bg-brand-red text-white">{debugError}</div>}
            {history.length === 0 ? (
               <div className="bg-black-surface rounded-2xl p-10 text-center border border-brand-red/10">
                 <p className="text-text-muted">{lang === 'en' ? 'No orders yet.' : 'لم تقم بأي طلبات بعد.'}</p>
               </div>
            ) : (
              <div className="space-y-4">
                {history.map((order, i) => {
                  const isExpanded = expandedOrder === order.OrderNumber;
                  const isActive = !['Completed', 'Cancelled', 'Voided', 'Refunded'].includes(order.Status);
                  return (
                    <div key={i} className={`bg-black-surface border ${isActive ? 'border-brand-red' : 'border-brand-red/20'} rounded-2xl overflow-hidden transition-all duration-300`}>
                      <div className="p-5 cursor-pointer hover:bg-black-primary flex flex-col md:flex-row justify-between items-start md:items-center gap-4" onClick={() => setExpandedOrder(isExpanded ? null : order.OrderNumber)}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${getStatusColor(order.Status)}`}>
                            <Package size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-xl">{lang === 'en' ? 'Order' : 'طلب'} #{order.OrderNumber}</p>
                            <p className="text-sm text-text-muted mt-1">{new Date(order.OrderDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end">
                          <p className="font-bold text-2xl">{order.TotalAmount} {lang === 'en' ? 'EGP' : 'ج.م'}</p>
                          <p className={`text-sm font-bold ${isActive ? 'text-brand-red' : 'text-text-muted'} mt-1`}>{translateStatus(order.Status)}</p>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-5 border-t border-brand-red/10 bg-[#0D0D0D] flex flex-col md:flex-row gap-4">
                           <button onClick={() => handleOrderAgain(order)} className={`w-full md:w-auto px-8 py-3 bg-brand-red/10 hover:bg-brand-red border border-brand-red text-text-light font-bold rounded-xl flex items-center justify-center gap-2 transition-colors`}>
                              <RotateCcw size={18} />
                              {lang === 'en' ? 'Reorder' : 'اطلب مجدداً'}
                           </button>
                           {isActive && (
                             <button onClick={() => navigate('/track/' + order.TrackingToken)} className="w-full md:w-auto px-8 py-3 bg-black-surface border border-text-muted hover:border-brand-red hover:text-brand-red text-text-light font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <Navigation size={18} />
                                {lang === 'en' ? 'Track Order' : 'تتبع الطلب'}
                             </button>
                           )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeView === 'addresses' && (
          <div className="w-full max-w-4xl mx-auto">
            <BackButton />
            <div className="bg-black-surface rounded-3xl border border-brand-red/10 overflow-hidden shadow-2xl p-6 lg:p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-display font-bold">{lang === 'en' ? 'Saved Addresses' : 'عناويني المحفوظة'}</h3>
                {!isAddingAddress && (
                  <button onClick={() => { setEditingAddressIndex(null); setIsAddingAddress(true); }} className="bg-brand-red text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-brand-red-dark transition-colors">
                    <Plus size={18} />
                    <span className="hidden sm:inline">{lang === 'en' ? 'Add Address' : 'إضافة عنوان'}</span>
                  </button>
                )}
              </div>
              
              {isAddingAddress ? (
                <div className="bg-[#0D0D0D] rounded-2xl p-6 border border-brand-red/20 relative">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-xl">{editingAddressIndex !== null ? (lang === 'en' ? 'Edit Address' : 'تعديل العنوان') : (lang === 'en' ? 'Add New Address' : 'إضافة عنوان جديد')}</h4>
                    <button onClick={() => { setIsAddingAddress(false); setEditingAddressIndex(null); }} className="text-text-muted hover:text-brand-red">
                      {lang === 'en' ? 'Cancel' : 'إلغاء'}
                    </button>
                  </div>
                  <AddressMapPicker 
                      value={addressDraft}
                      onChange={setAddressDraft}
                      zonesList={menuData?.deliveryZones || []} 
                      lang={lang}
                    />
                    <div className="mt-4 pt-4 border-t border-brand-red/10 flex justify-end">
                      <button 
                        onClick={() => {
                          const formatted = formatAddressDetails(addressDraft);
                          addressDraft.fullAddress = formatted;
                          addressDraft.label = addressDraft.label || (lang === 'en' ? 'Address' : 'عنوان');
                          handleSaveAddress(addressDraft);
                        }}
                        disabled={!addressDraft.street || !addressDraft.building || !addressDraft.floor || !addressDraft.apartment || !addressDraft.zone}
                        className="px-8 py-3 bg-brand-red hover:bg-brand-red-light text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {lang === 'en' ? 'Save Address' : 'حفظ العنوان'}
                      </button>
                    </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customerData.addresses?.map((addr, i) => (
                    <div key={i} className="bg-[#0D0D0D] border border-brand-red/20 rounded-2xl p-6 relative group hover:border-brand-red transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-lg">{addr.label || (lang === 'en' ? 'Address' : 'عنوان')}</span>
                            {i === 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-brand-red text-white rounded">{lang === 'en' ? 'Default' : 'الافتراضي'}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingAddressIndex(i); setIsAddingAddress(true); }} className="text-amber-500 hover:text-amber-400 p-2"><Edit3 size={16} /></button>
                          <button onClick={() => deleteAddress(i)} className="text-brand-red hover:text-brand-red-dark p-2"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <p className="text-text-muted text-sm leading-relaxed mb-4">{formatAddressDetails(addr)}</p>
                      <div className="inline-block px-3 py-1 bg-brand-red/10 text-brand-red text-sm rounded-lg font-bold border border-brand-red/20">
                        {addr.zone}
                      </div>
                    </div>
                  ))}
                  {(!customerData.addresses || customerData.addresses.length === 0) && (
                    <div className="col-span-full py-12 text-center text-text-muted bg-[#0D0D0D] rounded-2xl border border-dashed border-text-muted/30">
                      {lang === 'en' ? 'You have no saved addresses.' : 'ليس لديك عناوين محفوظة.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="w-full max-w-2xl mx-auto">
            <BackButton />
            <div className="bg-black-surface rounded-3xl border border-brand-red/10 p-6 lg:p-10 shadow-2xl">
              <h3 className="text-3xl font-display font-bold mb-8 text-center">{lang === 'en' ? 'Account Settings' : 'إعدادات الحساب'}</h3>
              
              <div className="bg-[#0D0D0D] p-6 rounded-2xl border border-brand-red/20 space-y-6">

                 {/* Phone Number Section */}
                 <div className="space-y-3 pb-6 border-b border-brand-red/10">
                   <div className="flex justify-between items-center">
                     <p className="text-sm font-bold text-text-muted">{lang === 'en' ? 'Phone Number' : 'رقم الجوال'}</p>
                     {!phoneEditMode && (
                       <button onClick={() => { setNewPhone(customerData.Phone || ''); setPhoneEditMode(true); }} className="text-brand-red text-sm font-bold flex items-center gap-1 hover:underline">
                         <Edit3 size={14}/> {lang === 'en' ? 'Edit' : 'تعديل'}
                       </button>
                     )}
                   </div>
                   
                   {!phoneEditMode ? (
                     <p className="font-bold text-xl" dir="ltr">{customerData.Phone || '---'}</p>
                   ) : !phoneOtpStep ? (
                     <div className="flex flex-col gap-3">
                       <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="01X XXXX XXXX" className="w-full bg-black-surface border border-brand-red/50 text-white rounded-lg p-3 outline-none" dir="ltr" />
                       <div className="flex gap-3">
                         <button onClick={handleSendPhoneOtp} className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 rounded-lg transition-colors">
                           {lang === 'en' ? 'Send OTP' : 'إرسال كود التحقق'}
                         </button>
                         <button onClick={() => setPhoneEditMode(false)} className="px-4 bg-black-surface text-text-muted hover:text-white py-2 rounded-lg border border-brand-red/20">
                           {lang === 'en' ? 'Cancel' : 'إلغاء'}
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-3 bg-brand-red/5 p-4 rounded-xl border border-brand-red/20">
                       <p className="text-sm text-text-muted">{lang === 'en' ? 'Enter the 4-digit code sent to your WhatsApp' : 'أدخل الكود المكون من 4 أرقام المرسل إلى واتساب'}</p>
                       <input type="text" maxLength={4} value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} placeholder="----" className="w-full bg-black-surface border border-brand-red/50 text-brand-red text-center font-bold tracking-[1em] rounded-lg p-3 outline-none" dir="ltr" />
                       {otpError && <p className="text-brand-red text-xs">{otpError}</p>}
                       <div className="flex gap-3">
                         <button onClick={handleVerifyPhoneOtp} className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 rounded-lg transition-colors">
                           {lang === 'en' ? 'Verify & Save' : 'تحقق وحفظ'}
                         </button>
                         <button onClick={() => { setPhoneOtpStep(false); setPhoneOtp(''); }} className="px-4 bg-black-surface text-text-muted hover:text-white py-2 rounded-lg border border-brand-red/20">
                           {lang === 'en' ? 'Cancel' : 'إلغاء'}
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Email Address Section */}
                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <p className="text-sm font-bold text-text-muted">{lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}</p>
                     <button onClick={handleSaveEmail} className="text-brand-red text-sm font-bold flex items-center gap-1 hover:underline">
                       <Edit3 size={14}/> {emailEditMode ? (lang === 'en' ? 'Save' : 'حفظ') : (lang === 'en' ? 'Edit' : 'تعديل')}
                     </button>
                   </div>
                   {emailEditMode ? (
                     <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black-surface border border-brand-red/50 text-white rounded-lg p-3 outline-none" />
                   ) : (
                     <p className="font-bold text-xl" dir="ltr">{customerData.Email || '---'}</p>
                   )}
                 </div>

                 <div className="pt-6 border-t border-brand-red/10 space-y-4">
                   <button onClick={onLogout} className="w-full bg-[#1A1815] border border-brand-red-dark hover:bg-brand-red text-text-light py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                     <LogOut size={20} />
                     {lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}
                   </button>
                   
                   <button onClick={onDeleteAccount} className="w-full bg-transparent border border-brand-red hover:bg-brand-red text-brand-red hover:text-text-light py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                     <Trash2 size={20} />
                     {lang === 'en' ? 'Permanently Delete Account' : 'حذف الحساب نهائي من كل الأماكن'}
                   </button>
                 </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};




export default function MyAccountPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { customerData, refreshCustomerData, userPhone, loading: authLoading } = useAuth();
  const { resetSession } = useCart();
  const [menuData, setMenuData] = useState(null);

  useEffect(() => {
    fetchMenuData().then(data => setMenuData(data));
  }, []);

  const handleLogout = async () => {
    try {
      if (resetSession) resetSession();
      await signOut(auth);
      await signInAnonymously(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(lang === 'en' ? 'Are you sure you want to permanently delete your account?' : 'هل أنت متأكد من حذف الحساب نهائياً؟')) {
      try {
        if (resetSession) resetSession();
        if (userPhone) {
          const updates = {};
          updates[`PublicCustomers/${userPhone}/Deleted`] = true;
          updates[`PublicCustomers/${userPhone}/DeletedAt`] = new Date().toISOString();
          await update(ref(db), updates);
        }
        const user = auth.currentUser;
        if (user && !user.isAnonymous) {
          await deleteUser(user);
        }
        await signInAnonymously(auth);
        navigate('/');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert(lang === 'en' ? 'Error deleting account. Please contact support.' : 'حدث خطأ. يرجى التواصل مع الدعم.');
      }
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-black"><p className="text-white">Loading...</p></div>;

  return (
    <>
      {!customerData ? (
        <AuthModal
          zonesList={menuData?.deliveryZones || []}
          isOpen={true}
          onClose={() => navigate('/')}
          onSuccess={(cleanPhone) => {
            refreshCustomerData(cleanPhone);
          }}
        />
      ) : (
        <div className="w-full bg-black min-h-screen pt-28 pb-12" dir="rtl">
          <DashboardView 
            customerData={customerData} 
            onLogout={handleLogout} 
            onDeleteAccount={handleDeleteAccount} 
            menuData={menuData}
          />
        </div>
      )}
    </>
  );
}
