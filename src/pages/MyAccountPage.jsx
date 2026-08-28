import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { Package, MapPin, Edit3, LogOut, ChevronLeft , Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import { fetchMenuData } from '../services/firebaseService';

const DashboardView = ({ customerData, onLogout }) => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState(customerData.Email || '');
  const [savingEmail, setSavingEmail] = React.useState(false);
  const [expandedOrder, setExpandedOrder] = React.useState(null);

  const history = customerData.History || [];
  
  // Find active orders (Not Completed/Cancelled/Voided/Refunded)
  let activeOrders = history.filter(o => 
    !['Completed', 'Cancelled', 'Voided', 'Refunded'].includes(o.Status)
  );
  
  // Inject pending order if not synced from POS yet
  const savedOrderId = localStorage.getItem('activeOrderId');
  if (savedOrderId) {
    const isInHistory = history.some(o => o.OrderNumber === savedOrderId || `#${o.OrderNumber}` === savedOrderId || o.OrderNumber === savedOrderId.replace('#', ''));
    if (!isInHistory) {
      activeOrders = [{
        OrderNumber: savedOrderId,
        Status: 'Pending',
        TotalAmount: '---',
        OrderDate: new Date().toISOString()
      }, ...activeOrders];
    }
  }

  const pastOrders = history.filter(o => 
    ['Completed', 'Cancelled', 'Voided', 'Refunded'].includes(o.Status)
  );

  const translateStatus = (status) => {
    switch(status) {
      case 'Pending': return lang === 'en' ? 'Pending Acceptance' : 'جاري المراجعة...';
      case 'New': return 'تم القبول';
      case 'InKitchen': return 'قيد التحضير';
      case 'Ready': return 'جاهز للاستلام/التوصيل';
      case 'Completed': return lang === 'en' ? 'Delivered' : 'تم التسليم';
      case 'Cancelled': return 'ملغي';
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
      const { db, update, ref } = await import('firebase/database');
      await update(ref(db, `PublicCustomers/${customerData.Phone}`), {
        Email: newEmail.trim() || null
      });
      setEditingEmail(false);
      alert(lang === 'en' ? 'Email updated successfully!' : 'تم تحديث البريد الإلكتروني بنجاح!');
      window.location.reload();
    } catch (err) {
      alert('حدث خطأ');
    }
    setSavingEmail(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-text-light">{lang === 'en' ? 'Welcome,' : 'مرحباً،'} {customerData.Name}</h3>
        <button onClick={onLogout} className="flex items-center gap-1 text-red-500 hover:text-red-400 bg-black-surface border border-red-900 px-3 py-1.5 rounded-lg transition-colors">
          <LogOut size={16} />
          <span className="text-sm font-medium">{lang === 'en' ? 'Logout' : 'خروج'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-black-primary border border-brand-red/30 rounded-xl p-4 text-center">
          <p className="text-sm text-brand-red font-medium mb-1">{lang === 'en' ? 'Current Points' : 'نقاطك الحالية'}</p>
          <p className="text-3xl font-bold text-brand-red">{customerData.Points || 0}</p>
        </div>
        <div className="bg-black-primary border border-brand-red-dark/30 rounded-xl p-4 text-center">
          <p className="text-sm text-text-light font-medium mb-1">{lang === 'en' ? 'Total Orders' : 'إجمالي طلباتك'}</p>
          <p className="text-3xl font-bold text-text-light">{customerData.TotalOrders || 0}</p>
        </div>
      </div>

      <div className="bg-black-primary rounded-xl p-4 mb-6">
        <h4 className="font-bold text-text-light mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-text-muted"/>
          {lang === 'en' ? 'Registered Address' : 'العنوان المسجل'}
        </h4>
        <p className="text-text-muted">{customerData.Address || 'لا يوجد عنوان مسجل'}</p>
      </div>

      <div className="bg-black-primary rounded-xl p-4 mb-6">
        <h4 className="font-bold text-text-light mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">📧</span>
            {lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}
          </div>
          {!editingEmail && (
            <button onClick={() => setEditingEmail(true)} className="text-sm text-blue-400 flex items-center gap-1">
              <Edit3 size={14} /> {lang === 'en' ? 'Edit' : 'تعديل'}
            </button>
          )}
        </h4>
        
        {editingEmail ? (
          <div className="flex flex-col gap-2">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="bg-black-primary border border-brand-red-dark/30 text-text-light p-2 rounded-xl focus:outline-none focus:border-brand-red" placeholder="أدخل {lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}" />
            <div className="flex gap-2">
              <button onClick={handleSaveEmail} disabled={savingEmail} className="bg-brand-red text-text-light px-4 py-2 rounded text-sm disabled:opacity-50">
                {savingEmail ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button onClick={() => {setEditingEmail(false); setNewEmail(customerData.Email || '');}} className="bg-black-surface text-text-light px-4 py-2 rounded text-sm">
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <p className="text-text-muted">{customerData.Email || 'لا يوجد بريد مسجل'}</p>
        )}
      </div>

      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-4 text-text-light flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-black-primary0 animate-pulse"></div>
            {lang === 'en' ? 'Order' : 'طلب'}اتك الحالية
          </h3>
          <div className="space-y-4">
            {activeOrders.map((order, i) => (
              <div key={i} className="border-2 border-brand-red/50 bg-black-primary p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-lg text-text-light">{lang === 'en' ? 'Order' : 'طلب'} {order.OrderNumber}</p>
                    <p className="text-sm text-brand-red font-semibold mt-1">
                      الحالة: {translateStatus(order.Status)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xl text-text-light">{order.TotalAmount} ج.م</p>
                    <p className="text-xs text-text-muted mt-1">{new Date(order.OrderDate).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/track/' + encodeURIComponent(order.OrderNumber))}
                  className="w-full bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Navigation size={18} />
                  تتبع ال{lang === 'en' ? 'Order' : 'طلب'} لايف
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-xl mb-4 text-text-light">{lang === 'en' ? 'Order History' : 'سجل الطلبات السابقة'}</h3>
        {pastOrders.length > 0 ? (
          <div className="space-y-4">
            {pastOrders.map((order, i) => {
              const isExpanded = expandedOrder === order.OrderNumber;
              return (
                <div key={i} className="border border-brand-red-dark/30 bg-black-surface rounded-xl shadow-sm overflow-hidden transition-all duration-200">
                  <div 
                    className="p-4 cursor-pointer hover:bg-black-primary flex justify-between items-center"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.OrderNumber)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(order.Status)}`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-text-light text-lg">{lang === 'en' ? 'Order' : 'طلب'} {order.OrderNumber}</p>
                        <p className="text-sm text-text-muted">{new Date(order.OrderDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-left">
                      <div>
                        <p className="font-bold text-text-light">{order.TotalAmount} ج.م</p>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${getStatusColor(order.Status)}`}>
                          {translateStatus(order.Status)}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-text-muted"/> : <ChevronDown size={20} className="text-text-muted"/>}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-brand-red-dark/30 bg-black-primary p-4">
                      <h5 className="font-bold text-text-light mb-2">التفاصيل:</h5>
                      {order.Items && order.Items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 text-sm border-b border-brand-red-dark/30 last:border-0">
                          <span className="text-text-muted">{item.Quantity}x {item.Name}</span>
                          <span className="font-medium text-text-light">{item.Price * item.Quantity} ج.م</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-black-primary rounded-xl p-8 text-center text-text-muted">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p>لا توجد {lang === 'en' ? 'Order' : 'طلب'}ات سابقة</p>
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
