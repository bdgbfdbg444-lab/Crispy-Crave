const fs = require('fs');

function patchMyAccount() {
    let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

    // 1. Imports
    content = content.replace(
        "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup } from 'firebase/auth';",
        "import { signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword, updateEmail, signInWithPopup, linkWithCredential, EmailAuthProvider } from 'firebase/auth';"
    );

    // 2. State
    content = content.replace(
        "const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');",
        "const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');\n    const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);"
    );

    // 3. Forgot Password click
    const forgotTarget = /const handleForgotPassword = async \(\) => \{[\s\S]*?setIsExistingCustomer\(true\);/m;
    const forgotReplace = `const handleForgotPassword = async () => {
      setError('');
      setLoading(true);
      try {
        const cleanPhone = normalizePhone(phone);
        await sendWhatsAppOtp(cleanPhone);
        setIsExistingCustomer(true);
        setIsForgotPasswordFlow(true);`;
    content = content.replace(forgotTarget, forgotReplace);

    // 4. OTP Success Redirect
    const otpSuccessTarget = /if \(custSnap\.exists\(\)\) \{\s*setIsExistingCustomer\(true\);\s*setStep\('set_password'\);\s*\} else \{/m;
    const otpSuccessReplace = `if (custSnap.exists()) {
                setIsExistingCustomer(true);
                if (isForgotPasswordFlow) {
                  setStep('set_password');
                } else {
                  await refreshCustomerData(cleanPhone);
                  setStep('dashboard');
                }
              } else {`;
    content = content.replace(otpSuccessTarget, otpSuccessReplace);

    // 5. handleSetPasswordForExisting
    const handleSetOld = /const handleSetPasswordForExisting = async \(e\) => \{[\s\S]*?setLoading\(false\);\n    \};/;
    const handleSetNew = `const handleSetPasswordForExisting = async (e) => {
      e.preventDefault();
      if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setError('');
      setLoading(true);
  
      const cleanPhone = normalizePhone(phone);
      try {
        const emailToUse = getInternalEmail(cleanPhone);
        try { 
          const credential = EmailAuthProvider.credential(emailToUse, password);
          await linkWithCredential(auth.currentUser, credential);
        } catch(authErr) {
          if (authErr.code === 'auth/email-already-in-use' || authErr.message.includes('email-already-in-use') || authErr.code === 'auth/credential-already-in-use') {
            const altEmail = \`\${cleanPhone}_\${Date.now()}@internal.theblackbox.com\`;
            const altCredential = EmailAuthProvider.credential(altEmail, password);
            await linkWithCredential(auth.currentUser, altCredential);
          } else {
            throw authErr;
          }
        }
        
        await update(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          AuthEmail: auth.currentUser.email || emailToUse
        });
        await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), auth.currentUser.email || emailToUse);
        
        await refreshCustomerData(cleanPhone);
        setStep('dashboard');
      } catch (err) {
        setError('Error: ' + err.message);
      }
      setLoading(false);
    };`;
    content = content.replace(handleSetOld, handleSetNew);

    // 6. handleCompleteRegistration
    const handleCompOld = /const handleCompleteRegistration = async \(e\) => \{[\s\S]*?setLoading\(false\);\n    \};/;
    const handleCompNew = `const handleCompleteRegistration = async (e) => {
      e.preventDefault();
      if (!name.trim()) return setError('يرجى إدخال الاسم');
      if (!selectedZone) return setError('يرجى اختيار المنطقة');
      if (password.length < 6) return setError('كلمة المرور 6 أحرف على الأقل');
      setError('');
      setLoading(true);
  
      const cleanPhone = normalizePhone(phone);
      try {
        const emailToUse = email.trim() ? email.trim() : getInternalEmail(cleanPhone);
        try { 
          const credential = EmailAuthProvider.credential(emailToUse, password);
          await linkWithCredential(auth.currentUser, credential);
        } catch(authErr) {
          if (authErr.code === 'auth/email-already-in-use' || authErr.message.includes('email-already-in-use') || authErr.code === 'auth/credential-already-in-use') {
            const altEmail = \`\${cleanPhone}_\${Date.now()}@internal.theblackbox.com\`;
            const altCredential = EmailAuthProvider.credential(altEmail, password);
            await linkWithCredential(auth.currentUser, altCredential);
          } else {
            throw authErr;
          }
        }
        
        await set(ref(db, \`PublicCustomers/\${cleanPhone}\`), {
          uid: auth.currentUser.uid,
          Name: name.trim(),
          Phone: cleanPhone,
          Address: address.trim(),
          Zone: selectedZone,
          Email: emailToUse,
          AuthEmail: auth.currentUser.email || emailToUse
        });
        await set(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`), auth.currentUser.email || emailToUse);
        
        await refreshCustomerData(cleanPhone);
        setStep('dashboard');
      } catch (err) {
        setError('Error: ' + err.message);
      }
      setLoading(false);
    };`;
    content = content.replace(handleCompOld, handleCompNew);

    // 7. handleLogin
    const handleLoginTarget = /const dbEmailSnap = await get\(ref\(db, \`PublicCustomers\/\$\{cleanPhone\}\/Email\`\)\);[\s\S]*?if \(authEmailSnap\.exists\(\)\) authEmail = authEmailSnap\.val\(\)\.trim\(\);/m;
    const handleLoginReplace = `const dbEmailSnap = await get(ref(db, \`CustomerLoginEmails/\${cleanPhone}\`));
          if (dbEmailSnap.exists()) authEmail = dbEmailSnap.val().trim();`;
    content = content.replace(handleLoginTarget, handleLoginReplace);

    // 8. handleLogout
    const handleLogoutOld = /const handleLogout = \(\) => \{[\s\S]*?setOtpInput\(''\);\n    \};/;
    const handleLogoutNew = `const handleLogout = () => {
      signOut(auth);
      setStep('phone'); 
      setIsForgotPasswordFlow(false);
      setPhone('');
      setPassword('');
      setOtpInput('');
      
      localStorage.removeItem('activeOrderId');
      localStorage.removeItem('activeOrderNumber');
      localStorage.removeItem('editingOrderId');
      
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('order_') || key.startsWith('placed_order_') || key === 'crispy_cart_items')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('placed_order_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
    };`;
    content = content.replace(handleLogoutOld, handleLogoutNew);

    // 9. Tab Sync (useEffect)
    const tabSyncOld = /useEffect\(\(\) => \{\n\s*\/\/ If auth state resolved[\s\S]*?\}, \[currentUser, customerData, authLoading\]\);/;
    const tabSyncNew = `useEffect(() => {
      if (!authLoading) {
        if (currentUser && customerData) {
          setStep('dashboard');
        } else if (!currentUser) {
          setStep('phone');
          setIsForgotPasswordFlow(false);
        }
      }
    }, [currentUser, customerData, authLoading]);`;
    content = content.replace(tabSyncOld, tabSyncNew);

    // 10. Ensure setStep('phone') clears forgot flow everywhere
    content = content.replace(/setStep\('phone'\);/g, "setStep('phone'); setIsForgotPasswordFlow(false);");
    // because some were replaced already, remove duplicates
    content = content.replace(/setIsForgotPasswordFlow\(false\);\s*setIsForgotPasswordFlow\(false\);/g, "setIsForgotPasswordFlow(false);");

    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
}

function patchTrackOrder() {
    let content = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8');
    const target = "const isSessionOwner = Boolean(";
    const newCode = `const [, setForceRender] = useState(0);
  useEffect(() => {
    const handleStorageChange = () => setForceRender(prev => prev + 1);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const isSessionOwner = Boolean(`;
    
    // Make sure we only add it once
    if (!content.includes('setForceRender')) {
      content = content.replace(target, newCode);
      fs.writeFileSync('src/pages/TrackOrderPage.jsx', content, 'utf8');
    }
}

try {
  patchMyAccount();
  patchTrackOrder();
  console.log("All fixes applied successfully!");
} catch (e) {
  console.log("Error:", e);
}
