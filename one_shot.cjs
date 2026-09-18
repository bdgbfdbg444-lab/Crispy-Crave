const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// 1. apply_fixes.cjs logic (OTP Logic)
content = content.replace(
    "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup } from 'firebase/auth';",
    "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup, linkWithCredential, EmailAuthProvider } from 'firebase/auth';"
);

content = content.replace(
    "const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');",
    "const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');\n  const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);"
);

content = content.replace(
    /const handleForgotPassword = async \(\) => \{[\s\S]*?setIsExistingCustomer\(true\);/m,
    `const handleForgotPassword = async () => {
    setError('');
    setLoading(true);
    try {
      const cleanPhone = normalizePhone(phone);
      await sendWhatsAppOtp(cleanPhone);
      setIsExistingCustomer(true);
      setIsForgotPasswordFlow(true);`
);

content = content.replace(
    /if \(custSnap\.exists\(\)\) \{\s*setIsExistingCustomer\(true\);\s*setStep\('set_password'\);\s*\} else \{/m,
    `if (custSnap.exists()) {
              setIsExistingCustomer(true);
              if (isForgotPasswordFlow) {
                setStep('set_password');
              } else {
                await refreshCustomerData(cleanPhone);
                setStep('dashboard');
              }
            } else {`
);

const handleSetOld = /const handleSetPasswordForExisting = async \(e\) => \{[\s\S]*?setLoading\(false\);\n  \};/;
const handleSetNew = `const handleSetPasswordForExisting = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);

    const cleanPhone = normalizePhone(phone);
    
    // We update AuthEmail for old users resetting password
    const newAuthEmail = \`\${cleanPhone}_\${Date.now()}@internal.smokeandsmash.com\`;

    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const res = await createUserWithEmailAndPassword(auth, newAuthEmail, password);
      
      await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), { AuthEmail: newAuthEmail, uid: res.user.uid });
      await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), newAuthEmail);
      await set(ref(db, \`UidToPhone/\${res.user.uid}\`), cleanPhone);
      
      await refreshCustomerData(cleanPhone);
      setStep('dashboard');
    } catch (err) {
      setError('حدث خطأ أثناء تعيين كلمة المرور');
    }
    setLoading(false);
  };`;
content = content.replace(handleSetOld, handleSetNew);

// 2. fix_ui3.cjs logic (WhatsApp UI)
const uiStart = content.indexOf("{step === 'phone'");
const uiEnd = content.indexOf("{step === 'login'");
if (uiStart !== -1 && uiEnd !== -1) {
    const beforeUI = content.substring(0, uiStart);
    const afterUI = content.substring(uiEnd);
    const replacementUI = `{step === 'phone' && (
        <div>
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-4">
              <label className="block text-text-light mb-2">رقم الموبايل</label>
              <input type="tel" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" />
            </div>
            <p className="text-xs text-text-muted mb-2 text-center">سيوصلك رمز تأكيد فوري عبر واتساب للتحقق من أمان حسابك.</p>
            <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light font-bold p-3 rounded-xl hover:bg-brand-red-dark disabled:opacity-50 shadow-lg shadow-brand-red/20 mb-3">
              {loading ? 'جاري التحقق...' : 'متابعة عبر كود واتساب (سريع وآمن)'}
            </button>
            <button type="button" onClick={() => setStep('login')} className="w-full text-center text-sm text-blue-400 hover:text-blue-800 transition-colors font-medium">
              أو تسجيل الدخول بكلمة المرور مباشرة 🔑
            </button>
          </form>
        </div>
      )}`;
    content = beforeUI + replacementUI + "\n\n      " + afterUI;
}

// 3. fix_logout5.cjs logic (Logout Clear LS)
content = content.replace(
    /const handleLogout = \(\) => \{\s*signOut\(auth\);\s*setStep\('phone'\);\s*setPhone\(''\);\s*setPassword\(''\);\s*\};/m,
    `const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem('activeOrderId');
    localStorage.removeItem('activeOrderNumber');
    localStorage.removeItem('editingOrderId');
    for (let key in localStorage) {
      if (key.startsWith('order_') && key.endsWith('_details')) {
        localStorage.removeItem(key);
      }
      if (key.startsWith('activeOrder_')) {
        localStorage.removeItem(key);
      }
    }
    setStep('phone');
    setIsForgotPasswordFlow(false);
    setPhone('');
    setPassword('');
  };`
);

// 4. fix_effect3.cjs logic (Auth Tab Sync)
content = content.replace(
    `  useEffect(() => {
    // If auth state resolved and we have both user and data, go to dashboard
    if (!authLoading && currentUser && customerData) {
      setStep('dashboard');
    }
  }, [currentUser, customerData, authLoading]);`,
    `  useEffect(() => {
    if (!authLoading) {
      if (currentUser && customerData) {
        setStep('dashboard');
      } else if (!currentUser && step === 'dashboard') {
        setStep('phone');
        setIsForgotPasswordFlow(false);
      }
    }
  }, [currentUser, customerData, authLoading, step]);`
);

// 5. fix_all_sets2.cjs logic (PublicCustomers set to update)
content = content.replace(
    /await set\(ref\(db, \`PublicCustomers\/\$\{cleanPhone\}\`\), \{/g,
    "await update(ref(db, `PublicCustomers/${cleanPhone}`), {"
);
content = content.replace(
    /await set\(ref\(db, \`PublicCustomers\/\$\{phone\}\`\), \{/g,
    "await update(ref(db, `PublicCustomers/${phone}`), {"
);


fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Applied EVERYTHING in one clean shot!');
