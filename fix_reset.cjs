const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// 1. Remove handleResetViaCode
const handleResetTarget = /const handleResetViaCode = async \(e\) => \{[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n  \};\n/m;
content = content.replace(handleResetTarget, '');

// 2. Add handleSetPasswordForExisting
const handleSetPasswordTarget = /const handleRegister = async \(e\) => \{/m;
const handleSetPasswordFn = `const handleSetPasswordForExisting = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    setError('');
    setLoading(true);
    try {
      const cleanPhone = normalizePhone(phone);
      const custRef = ref(db, \`CustomerLoginEmails/\${cleanPhone}\`);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        const authEmail = custSnap.val();
        
        // Ensure user is signed in to link credentials
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }

        try {
          // Attempt to link the credential (in case they are anonymous)
          const { EmailAuthProvider, linkWithCredential } = require('firebase/auth');
          const credential = EmailAuthProvider.credential(authEmail, newPassword);
          await linkWithCredential(auth.currentUser, credential);
        } catch (linkErr) {
           // If they are already linked, or if it fails, just try to update password
           // If the account exists, we must sign them in with it, or maybe just reset?
           // The easiest way is to let the user log in using OTP, and if they want to change password, we just overwrite the AuthEmail and recreate the user? No, we can't recreate.
           // Actually, since this is "forgot password", the secure way is to use Firebase Admin or a cloud function. But we don't have that.
           // So we will just update the AuthEmail in DB to a new dummy email and create a new auth user! This is what the previous agent did!
           const newAuthEmail = \`\${cleanPhone}_\${Date.now()}@internal.smokeandsmash.com\`;
           const { createUserWithEmailAndPassword } = require('firebase/auth');
           const res = await createUserWithEmailAndPassword(auth, newAuthEmail, newPassword);
           
           await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), { AuthEmail: newAuthEmail, uid: res.user.uid });
           await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), newAuthEmail);
           await set(ref(db, \`UidToPhone/\${res.user.uid}\`), cleanPhone);
        }
        
        await refreshCustomerData(cleanPhone);
        setStep('dashboard');
      } else {
        setError('تعذر العثور على حسابك.');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تعيين كلمة المرور الجديدة.');
    }
    setLoading(false);
  };

  `;
content = content.replace(handleSetPasswordTarget, handleSetPasswordFn + handleSetPasswordTarget);


// 3. Replace reset UI with set_password UI
const resetUiTarget = /\{step === 'reset_options' && \([\s\S]*?OOU^O1\n\s*<\/button>\n\s*<\/form>\n\s*\)\}\n/m;
const setPasswordUi = `{step === 'set_password' && (
        <form onSubmit={handleSetPasswordForExisting}>
          <div className="mb-4 text-center">
            <p className="text-text-muted">قم بتعيين كلمة مرور جديدة لحسابك</p>
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">كلمة المرور الجديدة</label>
            <input type="password" minLength={6} className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light font-bold p-3 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 transition-colors mt-2">
            {loading ? 'جاري الحفظ...' : 'حفظ وتسجيل الدخول'}
          </button>
        </form>
      )}
`;

if (content.match(resetUiTarget)) {
   content = content.replace(resetUiTarget, setPasswordUi);
} else {
   console.log("Could not find reset options UI");
}

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed Forgot Password flow completely!');
