import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update imports
c = c.replace(
    "import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut } from 'firebase/auth';",
    "import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut, updatePassword } from 'firebase/auth';"
)

# 2. Revert handlePhoneSubmit
old_phone = """if (custSnap.exists()) {
        const data = custSnap.val();
        if (data.Provider === 'google') {
          setError('هذا الرقم مسجل عبر Google. يرجى الدخول باستخدام زر Google بالأسفل.');
        } else {
          setStep('login');
        }
      }"""
new_phone = """if (custSnap.exists()) {
        setStep('login');
      }"""
c = c.replace(old_phone, new_phone)

# 3. Fix handleLinkPhone logic
old_link = """  const handleLinkPhone = async (e) => {
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
          Provider: 'google',
          Points: 0,
          TotalOrders: 0
        });
      } else {
        await update(ref(db, `PublicCustomers/${phone}`), {
          Email: auth.currentUser.email,
          uid: auth.currentUser.uid
        });
      }
      
      await refreshCustomerData(phone);"""

new_link = """  const handleLinkPhone = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);
    try {
      await updatePassword(auth.currentUser, password);
      
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
          Provider: 'password',
          Points: 0,
          TotalOrders: 0
        });
      } else {
        await update(ref(db, `PublicCustomers/${phone}`), {
          Email: auth.currentUser.email,
          uid: auth.currentUser.uid,
          Provider: 'password'
        });
      }
      
      await refreshCustomerData(phone);"""
c = c.replace(old_link, new_link)

# 4. Update the link_phone form to include password
old_form = """      {step === 'link_phone' && (
        <form onSubmit={handleLinkPhone}>
          <div className="mb-4 text-center">
            <p className="text-gray-600">خطوة أخيرة لإكمال تسجيل جوجل</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">رقم الموبايل</label>
            <input type="tel" className="w-full border p-3 rounded" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">العنوان (اختياري لتسهيل الطلب)</label>
            <input type="text" className="w-full border p-3 rounded" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 disabled:opacity-50 mb-3">
            {loading ? 'جاري الربط...' : 'ربط وإكمال'}
          </button>
        </form>
      )}"""

new_form = """      {step === 'link_phone' && (
        <form onSubmit={handleLinkPhone}>
          <div className="mb-6 text-center">
            <p className="text-gray-500 font-medium">خطوة أخيرة لإكمال تسجيل جوجل</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الموبايل</label>
              <input type="tel" className="w-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 p-3 rounded-lg outline-none transition-all" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنوان <span className="text-gray-400 text-xs font-normal">(اختياري)</span></label>
              <input type="text" className="w-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 p-3 rounded-lg outline-none transition-all" value={address} onChange={e => setAddress(e.target.value)} placeholder="شارع، عمارة..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تعيين كلمة مرور <span className="text-gray-400 text-xs font-normal">(مطلوب)</span></label>
              <input type="password" className="w-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 p-3 rounded-lg outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-bold p-3 rounded-lg mt-6 hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md">
            {loading ? 'جاري الحفظ...' : 'حفظ وإكمال'}
          </button>
        </form>
      )}"""
c = c.replace(old_form, new_form)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)