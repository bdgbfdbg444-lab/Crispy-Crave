import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

functions = """  const handleForgotPassword = () => {
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
      const custRef = ref(db, PublicCustomers/);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        const data = custSnap.val();
        if (data.RegistrationCode && data.RegistrationCode === resetCode.trim()) {
          const newAuthEmail = ${phone}_@internal.smokeandsmash.com;
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
      const custSnap = await get(ref(db, PublicCustomers/));
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

  const handleLogout"""

content = content.replace("  const handleLogout", functions)

ui = """      {step === 'reset_options' && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">اختر طريقة استعادة كلمة المرور:</p>
          <button onClick={() => setStep('reset_via_code')} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition-colors mb-3">
            لدي كود تفعيل من الكاشير
          </button>
          <button onClick={handleSendResetLink} disabled={loading} className="w-full bg-orange-600 text-white font-bold p-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors mb-3">
            إرسال رابط عبر البريد الإلكتروني (إن وجد)
          </button>
          <button onClick={() => setStep('login')} className="w-full text-gray-500 font-medium p-3 rounded-lg hover:bg-gray-100 transition-colors">
            رجوع
          </button>
        </div>
      )}

      {step === 'reset_via_code' && (
        <form onSubmit={handleResetViaCode}>
          <div className="mb-4 text-center">
            <p className="text-gray-600">إعادة تعيين باستخدام الكود</p>
            <p className="text-sm text-gray-500 mt-2">إذا لم يكن لديك بريد إلكتروني، اطلب من الكاشير إعادة تعيين كلمة المرور، ثم أدخل الكود هنا.</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">كود التفعيل (من الكاشير)</label>
            <input type="text" className="w-full border p-3 rounded" value={resetCode} onChange={e => setResetCode(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">كلمة المرور الجديدة</label>
            <input type="password" className="w-full border p-3 rounded" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-bold p-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors mt-2">
            {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
          </button>
          <button type="button" onClick={() => setStep('reset_options')} className="w-full text-gray-500 font-medium p-3 rounded-lg hover:bg-gray-100 transition-colors mt-2">
            رجوع
          </button>
        </form>
      )}

      {step === 'register' && ("""

content = content.replace("{step === 'register' && (", ui)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

