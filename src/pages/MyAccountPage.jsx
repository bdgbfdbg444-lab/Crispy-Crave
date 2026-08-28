import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { Package, MapPin, Edit3, LogOut, ChevronLeft, Navigation, ChevronDown, ChevronUp, Home, Briefcase, Plus, Trash2, Settings, User, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import { fetchMenuData } from '../services/firebaseService';

const DashboardView = ({ customerData, onLogout }) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState(customerData.Email || '');
  const [savingEmail, setSavingEmail] = React.useState(false);
  const [expandedOrder, setExpandedOrder] = React.useState(null);

  const [addresses, setAddresses] = React.useState(customerData.addresses || []);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newAddress, setNewAddress] = React.useState({ label: 'المنزل', fullAddress: '' });
  const [isSavingAddress, setIsSavingAddress] = React.useState(false);

  React.useEffect(() => {
    if (customerData.addresses) {
      setAddresses(customerData.addresses);
    }
  }, [customerData.addresses]);

  const history = customerData.History || [];
  let activeOrders = history.filter(o => !['Completed', 'Cancelled', 'Voided', 'Refunded'].includes(o.Status));
  
  const savedOrderId = localStorage.getItem('activeOrderId');
  const savedOrderTotal = localStorage.getItem('activeOrderTotal') || '---';
  if (savedOrderId) {
    const isInHistory = history.some(o => o.OrderNumber === savedOrderId || o.OrderNumber === savedOrderId.replace('#', '') || (o.WebOrderId && (o.WebOrderId === savedOrderId || o.WebOrderId === savedOrderId.replace('#', ''))));
    if (!isInHistory) {
      activeOrders = [{ OrderNumber: savedOrderId, Status: 'Pending', TotalAmount: savedOrderTotal, OrderDate: new Date().toISOString() }, ...activeOrders];
    }
  }

  const pastOrders = history.filter(o => ['Completed', 'Cancelled', 'Voided', 'Refunded'].includes(o.Status));

  const translateStatus = (status) => {
    switch(status) {
      case 'Pending': return lang === 'en' ? 'Pending' : 'قيد الانتظار';
      case 'Accepted': return lang === 'en' ? 'Preparing' : 'يتم التجهيز';
      case 'InKitchen': return lang === 'en' ? 'In Kitchen' : 'في المطبخ';
      case 'Ready': return lang === 'en' ? 'Ready/Out for Delivery' : 'جاهز/في الطريق للاستلام';
      case 'Completed': return lang === 'en' ? 'Delivered' : 'مكتمل (تم التوصيل)';
      case 'Cancelled': return lang === 'en' ? 'Cancelled' : 'ملغي';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'bg-green-900/40 text-green-400';
    if (['Cancelled', 'Voided'].includes(status)) return 'bg-red-900/40 text-red-400';
    return 'bg-blue-900/40 text-blue-400';
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    try {
      const { db, update, ref } = await import('../firebase');
      await update(ref(db, `PublicCustomers/${customerData.Phone}`), { Email: newEmail.trim() || null });
      setEditingEmail(false);
      alert(lang === 'en' ? 'Email updated successfully!' : 'تم تحديث البريد الإلكتروني بنجاح!');
      window.location.reload();
    } catch (err) {
      alert('حدث خطأ');
    }
    setSavingEmail(false);
  };

  const saveAddressesToFirebase = async (updatedAddresses) => {
    try {
      const { db, update, ref } = await import('../firebase');
      await update(ref(db, `PublicCustomers/${customerData.Phone}`), { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
    } catch (err) {
      console.error(err);
      alert(lang === 'en' ? 'Failed to save address' : 'فشل حفظ العنوان');
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.fullAddress.trim()) return;
    if (newAddress.fullAddress.length > 200) {
      alert(lang === 'en' ? 'Address is too long (max 200 characters)' : 'العنوان طويل جداً (الحد الأقصى 200 حرف)');
      return;
    }
    if (addresses.length >= 5) {
      alert(lang === 'en' ? 'You have reached the maximum limit of 5 addresses' : 'لقد وصلت للحد الأقصى (5 عناوين)');
      return;
    }

    setIsSavingAddress(true);
    const addressToSave = {
      id: Date.now().toString(),
      label: newAddress.label,
      fullAddress: newAddress.fullAddress.trim(),
      isDefault: addresses.length === 0
    };

    const updatedAddresses = [...addresses, addressToSave];
    await saveAddressesToFirebase(updatedAddresses);
    
    setNewAddress({ label: 'المنزل', fullAddress: '' });
    setShowAddForm(false);
    setIsSavingAddress(false);
  };

  const handleDeleteAddress = async (id) => {
    if (addresses.length === 1) {
      alert(lang === 'en' ? 'You cannot delete your only address' : 'لا يمكنك حذف عنوانك الوحيد المتبقي');
      return;
    }
    const confirmDelete = window.confirm(lang === 'en' ? 'Are you sure you want to delete this address?' : 'هل أنت متأكد أنك تريد حذف هذا العنوان؟');
    if (!confirmDelete) return;

    let updatedAddresses = addresses.filter(a => a.id !== id);
    if (!updatedAddresses.some(a => a.isDefault) && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    await saveAddressesToFirebase(updatedAddresses);
  };

  const handleSetDefault = async (id) => {
    const updatedAddresses = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    await saveAddressesToFirebase(updatedAddresses);
  };

  const getAddressIcon = (label) => {
    if (label === 'المنزل' || label === 'Home') return <Home size={18} />;
    if (label === 'العمل' || label === 'Work') return <Briefcase size={18} />;
    return <MapPin size={18} />;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
        <button onClick={() => setActiveTab('overview')} className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'overview' ? 'bg-brand-red text-text-light font-bold' : 'bg-black-surface text-text-muted hover:bg-black-primary'}`}>
          <User size={20} />
          <span>{lang === 'en' ? 'Overview' : 'نظرة عامة'}</span>
        </button>
        <button onClick={() => setActiveTab('orders')} className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'orders' ? 'bg-brand-red text-text-light font-bold' : 'bg-black-surface text-text-muted hover:bg-black-primary'}`}>
          <Package size={20} />
          <span>{lang === 'en' ? 'My Orders' : 'طلباتي'}</span>
        </button>
        <button onClick={() => setActiveTab('addresses')} className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'addresses' ? 'bg-brand-red text-text-light font-bold' : 'bg-black-surface text-text-muted hover:bg-black-primary'}`}>
          <MapPin size={20} />
          <span>{lang === 'en' ? 'My Addresses' : 'عناويني'}</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-brand-red text-text-light font-bold' : 'bg-black-surface text-text-muted hover:bg-black-primary'}`}>
          <Settings size={20} />
          <span>{lang === 'en' ? 'Settings' : 'الإعدادات'}</span>
        </button>
      </div>

      <div className="flex-1 bg-black-surface p-6 rounded-xl border border-brand-red/10 min-h-[400px]">
        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-text-light">{lang === 'en' ? 'Welcome,' : 'أهلاً بك،'} <span className="text-brand-red">{customerData.Name}</span></h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black-primary border border-brand-red/30 rounded-xl p-6 text-center">
                <p className="text-sm text-brand-red font-medium mb-2">{lang === 'en' ? 'Current Points' : 'نقاط الولاء'}</p>
                <p className="text-4xl font-bold text-brand-red">{customerData.Points || 0}</p>
              </div>
              <div className="bg-black-primary border border-brand-red-dark/30 rounded-xl p-6 text-center">
                <p className="text-sm text-text-light font-medium mb-2">{lang === 'en' ? 'Total Orders' : 'إجمالي الطلبات'}</p>
                <p className="text-4xl font-bold text-text-light">{customerData.TotalOrders || 0}</p>
              </div>
            </div>
            
            {activeOrders.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-4 text-text-light">{lang === 'en' ? 'Active Orders' : 'طلباتك الحالية'}</h4>
                <div className="border border-brand-red/50 bg-black-primary p-4 rounded-xl flex justify-between items-center">
                   <div>
                      <p className="font-bold text-text-light">{lang === 'en' ? 'Order' : 'طلب'} {activeOrders[0].OrderNumber}</p>
                      <p className="text-brand-red text-sm mt-1">{translateStatus(activeOrders[0].Status)}</p>
                   </div>
                   <button onClick={() => { setActiveTab('orders'); setExpandedOrder(activeOrders[0].OrderNumber); }} className="text-sm bg-brand-red px-4 py-2 rounded-lg text-white font-bold">{lang === 'en' ? 'View' : 'عرض التفاصيل'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h3 className="text-2xl font-bold mb-6 text-text-light">{lang === 'en' ? 'Order History' : 'سجل الطلبات'}</h3>
            {history.length === 0 ? (
               <p className="text-text-muted text-center py-10">{lang === 'en' ? 'No orders yet.' : 'لم تقم بأي طلبات بعد.'}</p>
            ) : (
              <div className="space-y-4">
                {[...activeOrders, ...pastOrders].map((order, i) => {
                  const isExpanded = expandedOrder === order.OrderNumber;
                  const isActive = !['Completed', 'Cancelled', 'Voided', 'Refunded'].includes(order.Status);
                  return (
                    <div key={i} className={`border ${isActive ? 'border-brand-red/50' : 'border-brand-red-dark/30'} bg-black-primary rounded-xl overflow-hidden transition-all duration-200`}>
                      <div 
                        className="p-4 cursor-pointer hover:bg-black-surface/50 flex justify-between items-center"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.OrderNumber)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(order.Status)}`}>
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-text-light text-lg">{lang === 'en' ? 'Order' : 'طلب'} {order.OrderNumber}</p>
                            <p className="text-sm text-text-muted">{new Date(order.OrderDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="font-bold text-lg text-text-light">{order.TotalAmount} {lang === 'en' ? 'EGP' : 'ج.م'}</p>
                          <p className={`text-sm font-semibold ${isActive ? 'text-brand-red' : 'text-text-muted'}`}>{translateStatus(order.Status)}</p>
                        </div>
                      </div>
                      
                      {isExpanded && isActive && (
                        <div className="p-4 border-t border-brand-red/20 bg-black-surface">
                           <button onClick={() => navigate('/track/' + encodeURIComponent(order.OrderNumber))} className="w-full bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                              <Navigation size={18} />
                              {lang === 'en' ? 'Track Order' : 'تتبع الطلب مباشرة'}
                           </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-bold text-text-light">{lang === 'en' ? 'My Addresses' : 'عناويني المحفوظة'}</h3>
               {!showAddForm && addresses.length < 5 && (
                 <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1 bg-brand-red hover:bg-brand-red-dark text-white px-3 py-2 rounded-lg text-sm transition-colors">
                   <Plus size={16} />
                   <span>{lang === 'en' ? 'Add New' : 'إضافة عنوان'}</span>
                 </button>
               )}
            </div>

            {showAddForm && (
              <div className="bg-black-primary border border-brand-red/30 p-4 rounded-xl mb-6">
                <h4 className="font-bold text-text-light mb-4">{lang === 'en' ? 'New Address' : 'عنوان جديد'}</h4>
                <div className="flex gap-2 mb-4">
                  {['المنزل', 'العمل', 'أخرى'].map((lbl) => (
                    <button 
                      key={lbl}
                      onClick={() => setNewAddress({...newAddress, label: lbl})}
                      className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${newAddress.label === lbl ? 'bg-brand-red text-white' : 'bg-black-surface text-text-muted border border-brand-red-dark/30'}`}
                    >
                      {getAddressIcon(lbl)}
                      {lang === 'en' ? (lbl === 'المنزل' ? 'Home' : lbl === 'العمل' ? 'Work' : 'Other') : lbl}
                    </button>
                  ))}
                </div>
                <textarea 
                  value={newAddress.fullAddress}
                  onChange={(e) => setNewAddress({...newAddress, fullAddress: e.target.value})}
                  maxLength={200}
                  className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red min-h-[100px] mb-4"
                  placeholder={lang === 'en' ? 'Enter full address details...' : 'اكتب تفاصيل العنوان بالكامل...'}
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-text-muted hover:text-text-light">
                    {lang === 'en' ? 'Cancel' : 'إلغاء'}
                  </button>
                  <button onClick={handleAddAddress} disabled={isSavingAddress || !newAddress.fullAddress.trim()} className="bg-brand-red text-white px-6 py-2 rounded-lg disabled:opacity-50 font-bold">
                    {isSavingAddress ? '...' : (lang === 'en' ? 'Save' : 'حفظ العنوان')}
                  </button>
                </div>
              </div>
            )}

            {addresses.length === 0 ? (
               <div className="text-center py-10 bg-black-primary rounded-xl border border-brand-red-dark/20">
                  <MapPin size={40} className="mx-auto text-text-muted mb-3" />
                  <p className="text-text-light mb-4">{lang === 'en' ? 'You have no saved addresses.' : 'ليس لديك أي عناوين محفوظة.'}</p>
                  <button onClick={() => setShowAddForm(true)} className="bg-brand-red text-white px-6 py-2 rounded-lg">{lang === 'en' ? 'Add Your First Address' : 'أضف أول عنوان الآن'}</button>
               </div>
            ) : (
              <div className="grid gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className={`p-4 rounded-xl border ${addr.isDefault ? 'border-brand-red bg-brand-red/5' : 'border-brand-red-dark/30 bg-black-primary'} flex justify-between items-start`}>
                     <div className="flex gap-4 items-start">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${addr.isDefault ? 'bg-brand-red text-white' : 'bg-black-surface text-text-muted'}`}>
                           {getAddressIcon(addr.label)}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-bold text-text-light">{lang === 'en' ? (addr.label === 'المنزل' ? 'Home' : addr.label === 'العمل' ? 'Work' : 'Other') : addr.label}</h5>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-brand-red text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{lang === 'en' ? 'Default' : 'الافتراضي'}</span>
                              )}
                           </div>
                           <p className="text-text-muted text-sm whitespace-pre-wrap">{addr.fullAddress}</p>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 items-end shrink-0">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <CheckCircle2 size={14} /> {lang === 'en' ? 'Set Default' : 'تعيين كافتراضي'}
                          </button>
                        )}
                        <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1">
                          <Trash2 size={14} /> {lang === 'en' ? 'Delete' : 'حذف'}
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-text-light">{lang === 'en' ? 'Account Settings' : 'إعدادات الحساب'}</h3>
            
            <div className="bg-black-primary rounded-xl p-5 mb-6 border border-brand-red-dark/30">
              <h4 className="font-bold text-text-light mb-3">{lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}</h4>
              {editingEmail ? (
                <div className="flex flex-col gap-3">
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="bg-black-surface border border-brand-red/50 text-text-light p-3 rounded-lg focus:outline-none" placeholder={lang === 'en' ? 'Enter Email' : 'أدخل البريد الإلكتروني'} />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEmail} disabled={savingEmail} className="bg-brand-red text-text-light px-4 py-2 rounded-lg text-sm font-bold flex-1">
                      {savingEmail ? '...' : (lang === 'en' ? 'Save' : 'حفظ التعديل')}
                    </button>
                    <button onClick={() => {setEditingEmail(false); setNewEmail(customerData.Email || '');}} className="bg-black-surface text-text-light border border-text-muted px-4 py-2 rounded-lg text-sm">
                      {lang === 'en' ? 'Cancel' : 'إلغاء'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-text-muted">{customerData.Email || (lang === 'en' ? 'No email linked' : 'لا يوجد بريد إلكتروني مرتبط')}</p>
                  <button onClick={() => setEditingEmail(true)} className="text-sm text-blue-400 flex items-center gap-1 hover:text-blue-300">
                    <Edit3 size={14} /> {lang === 'en' ? 'Edit' : 'تعديل'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-brand-red-dark/30">
               <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 py-3 rounded-xl transition-colors font-bold">
                 <LogOut size={18} />
                 <span>{lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}</span>
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


export default function MyAccountPage() {
  const { lang } = useLanguage();
  const { currentUser, userPhone, customerData, loading: authLoading, refreshCustomerData } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [step, setStep] = useState('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If auth state resolved and we have both user and data, go to dashboard
    if (!authLoading && currentUser && customerData) {
      setStep('dashboard');
    }
  }, [currentUser, customerData, authLoading]);

  if (authLoading) return <div className="text-center mt-20">جاري التحميل...</div>;

  const getInternalEmail = (p) => `${p}@internal.smokeandsmash.com`;

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');
    setError('');
    setLoading(true);

    try {
      const custRef = ref(db, `PublicCustomers/${phone}`);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        setStep('login');
      } else {
        setStep('register');
      }
    } catch (err) {
      setError('حدث خطأ أثناء فحص الرقم');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return setError('يرجى إدخال كلمة المرور');
    setError('');
    setLoading(true);

    try {
      const custRef = ref(db, `PublicCustomers/${phone}`);
      const custSnap = await get(custRef);
      
      const internalEmail = getInternalEmail(phone);
      const dbEmail = custSnap.exists() && custSnap.val().Email ? custSnap.val().Email.trim() : null;
      const authEmail = custSnap.exists() && custSnap.val().AuthEmail ? custSnap.val().AuthEmail.trim() : null;
      
      const emailToTry1 = authEmail || internalEmail;
      
      try {
        // Try internal/auth email first (for accounts created with phone only or updated via reset)
        await signInWithEmailAndPassword(auth, emailToTry1, password);
      } catch (firstErr) {
        // If it fails, and they have a real email, try that (for accounts created with real email)
        if (dbEmail && dbEmail !== emailToTry1 && dbEmail.includes('@')) {
          try {
            await signInWithEmailAndPassword(auth, dbEmail, password);
          } catch (secondErr) {
            throw secondErr; // Both failed
          }
        } else {
          throw firstErr; // Only had first email, and it failed
        }
      }
      
      await refreshCustomerData(phone);
      setStep('dashboard');
    } catch (err) {
      setError('رقم الهاتف أو كلمة المرور غير صحيحة');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name) return setError('يرجى إدخال اسمك');
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);

    try {
      const emailToUse = email.trim() ? email.trim() : getInternalEmail(phone);
      const res = await createUserWithEmailAndPassword(auth, emailToUse, password);
      
      await set(ref(db, `UidToPhone/${res.user.uid}`), phone);
      await set(ref(db, `PublicCustomers/${phone}`), {
        Name: name,
        Phone: phone,
        Email: email.trim() || null,
        Address: address.trim() || null,
        uid: res.user.uid,
        RegisteredDate: new Date().toISOString(),
        Points: 0,
        TotalOrders: 0
      });

      await refreshCustomerData(phone);
      setStep('dashboard');
    } catch (err) {
      setError('حدث خطأ أثناء التسجيل: ' + err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await signInWithPopup(auth, googleProvider);
      
      const mapSnap = await get(ref(db, `UidToPhone/${res.user.uid}`));
      if (!mapSnap.exists()) {
        setStep('link_phone');
      } else {
        await refreshCustomerData(mapSnap.val());
        setStep('dashboard');
      }
    } catch (err) {
      setError('فشل تسجيل الدخول بجوجل');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPhone = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');
    setError('');
    setLoading(true);
    try {
      const custSnap = await get(ref(db, `PublicCustomers/${phone}`));
      if (custSnap.exists() && custSnap.val().uid && custSnap.val().uid !== auth.currentUser.uid) {
        throw new Error('هذا الرقم مسجل مسبقاً لحساب آخر');
      }

      await set(ref(db, `UidToPhone/${auth.currentUser.uid}`), phone);
      
      if (!custSnap.exists()) {
        await set(ref(db, `PublicCustomers/${phone}`), {
          Name: auth.currentUser.displayName || 'عميل جوجل',
          Phone: phone,
          Email: auth.currentUser.email,
          Address: address.trim() || null,
          uid: auth.currentUser.uid,
          RegisteredDate: new Date().toISOString(),
          Points: 0,
          TotalOrders: 0
        });
      } else {
        await update(ref(db, `PublicCustomers/${phone}`), {
          Email: auth.currentUser.email,
          uid: auth.currentUser.uid
        });
      }
      
      await refreshCustomerData(phone);
      setStep('dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = () => {
    setError('');
    setStep('reset_options');
  };

  const handleResetViaCode = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword) return setError('يرجى إدخال الكود وكلمة المرور الجديدة');
    if (newPassword.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);
    try {
      const custRef = ref(db, `PublicCustomers/${phone}`);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        const data = custSnap.val();
        if (data.RegistrationCode && data.RegistrationCode === resetCode.trim()) {
          const newAuthEmail = `${phone}_${Date.now()}@internal.smokeandsmash.com`;
          await createUserWithEmailAndPassword(auth, newAuthEmail, newPassword);
          await update(custRef, {
            AuthEmail: newAuthEmail,
            RegistrationCode: null
          });
          await refreshCustomerData(phone);
          setStep("dashboard");
        } else {
          setError("كود التفعيل غير صحيح أو تم استخدامه.");
        }
      } else {
        setError("حساب غير موجود.");
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء التحديث.");
    }
    setLoading(false);
  };

  const handleSendResetLink = async () => {
    setError('');
    setLoading(true);
    try {
      const custSnap = await get(ref(db, `PublicCustomers/${phone}`));
      if (custSnap.exists()) {
        const data = custSnap.val();
        if (data.Email && !data.Email.includes('@internal')) {
          await sendPasswordResetEmail(auth, data.Email);
          alert('تم إرسال رابط استعادة كلمة المرور إلى: ' + data.Email);
        } else {
          setError('لا يوجد بريد إلكتروني مسجل. يرجى اختيار طريقة الكود.');
        }
      }
    } catch (err) {
      setError('حدث خطأ.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    signOut(auth);
    setStep('phone');
    setPhone('');
    setPassword('');
  };

  return (
    <div className={`${step === "dashboard" ? "max-w-5xl md:max-w-6xl" : "max-w-md"} mx-auto mt-10 p-6 bg-black-surface rounded-xl shadow-lg`} dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-center text-text-light">{lang === 'en' ? 'My Account' : 'حسابي'}</h2>
      
      {error && <div className="bg-red-900/40 text-red-400 border border-red-900/50 p-3 rounded mb-4 text-sm">{error}</div>}

      {step === 'phone' && (
        <div>
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-4">
              <label className="block text-text-light mb-2">رقم الموبايل</label>
              <input type="tel" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light p-3 rounded hover:bg-brand-red-dark disabled:opacity-50">
              {loading ? 'جاري التحقق...' : 'متابعة'}
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-px bg-black-surface flex-1"></div>
            <span className="text-text-muted text-sm">أو</span>
            <div className="h-px bg-black-surface flex-1"></div>
          </div>
          
          <button onClick={handleGoogleLogin} type="button" className="mt-6 w-full flex items-center justify-center gap-3 bg-black-surface border border-brand-red-dark/50 text-text-light p-3 rounded hover:bg-black-primary transition-colors">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            تسجيل الدخول باستخدام Google
          </button>
        </div>
      )}

      {step === 'login' && (
        <form onSubmit={handleLogin}>
          <div className="mb-4 text-center">
            <p className="text-text-muted">أهلاً بك مجدداً</p>
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">كلمة المرور</label>
            <input type="password" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light p-3 rounded hover:bg-brand-red-dark disabled:opacity-50 mb-3">
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
          <button type="button" onClick={handleForgotPassword} className="w-full text-center text-sm text-blue-400 hover:text-blue-800 transition-colors mb-3">
            هل نسيت كلمة المرور؟
          </button>
          <button type="button" onClick={() => {setStep('phone'); setPassword('');}} className="w-full text-center text-sm text-text-muted hover:text-brand-red transition-colors">
            تغيير رقم الموبايل
          </button>
        </form>
      )}

            {step === 'reset_options' && (
        <div className="text-center">
          <p className="text-text-muted mb-4">اختر طريقة استعادة كلمة المرور:</p>
          <button onClick={() => setStep('reset_via_code')} className="w-full bg-brand-red text-text-light font-bold p-3 rounded-lg hover:bg-brand-red-dark transition-colors mb-3">
            لدي كود تفعيل من الكاشير
          </button>
          <button onClick={handleSendResetLink} disabled={loading} className="w-full bg-brand-red text-text-light font-bold p-3 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 transition-colors mb-3">
            إرسال رابط عبر {lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'} (إن وجد)
          </button>
          <button onClick={() => setStep('login')} className="w-full text-text-muted font-medium p-3 rounded-lg hover:bg-black-primary transition-colors">
            رجوع
          </button>
        </div>
      )}

      {step === 'reset_via_code' && (
        <form onSubmit={handleResetViaCode}>
          <div className="mb-4 text-center">
            <p className="text-text-muted">إعادة تعيين باستخدام الكود</p>
            <p className="text-sm text-text-muted mt-2">إذا لم يكن لديك بريد إلكتروني، ا{lang === 'en' ? 'Order' : 'طلب'} من الكاشير إعادة تعيين كلمة المرور، ثم أدخل الكود هنا.</p>
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">كود التفعيل (من الكاشير)</label>
            <input type="text" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={resetCode} onChange={e => setResetCode(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">كلمة المرور الجديدة</label>
            <input type="password" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light font-bold p-3 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 transition-colors mt-2">
            {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
          <button type="button" onClick={() => setStep('reset_options')} className="w-full text-text-muted font-medium p-3 rounded-lg hover:bg-black-primary transition-colors mt-2">
            رجوع
          </button>
        </form>
      )}

      {step === 'register' && (
        <form onSubmit={handleRegister}>
          <div className="mb-4 text-center">
            <p className="text-text-muted">تسجيل حساب جديد</p>
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">الاسم</label>
            <input type="text" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">العنوان (اختياري لتسهيل ال{lang === 'en' ? 'Order' : 'طلب'})</label>
            <input type="text" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">{lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'} (اختياري)</label>
            <input type="email" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">كلمة المرور (6 أحرف على الأقل)</label>
            <input type="password" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light p-3 rounded hover:bg-brand-red-dark disabled:opacity-50 mb-3">
            {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
          </button>
          <button type="button" onClick={() => {setStep('phone'); setPassword(''); setName('');}} className="w-full text-center text-sm text-text-muted hover:text-brand-red transition-colors">
            رجوع
          </button>
        </form>
      )}

      {step === 'link_phone' && (
        <form onSubmit={handleLinkPhone}>
          <div className="mb-4 text-center">
            <p className="text-text-muted">خطوة أخيرة لإكمال تسجيل جوجل</p>
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">رقم الموبايل</label>
            <input type="tel" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" />
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">العنوان (اختياري لتسهيل ال{lang === 'en' ? 'Order' : 'طلب'})</label>
            <input type="text" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light p-3 rounded hover:bg-brand-red-dark disabled:opacity-50 mb-3">
            {loading ? 'جاري الربط...' : 'ربط وإكمال'}
          </button>
        </form>
      )}

      {step === 'dashboard' && customerData && (
        <DashboardView 
          customerData={customerData} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}
