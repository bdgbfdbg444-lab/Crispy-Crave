const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStart = '  const handleLogin = async (e) => {';
const targetEnd = '  const handleCompleteRegistration = async (e) => {';

const idxStart = content.indexOf(targetStart);
let idxEnd = content.indexOf(targetEnd);

// If handleCompleteRegistration doesn't exist, search for handleRegister
if (idxEnd === -1) {
    idxEnd = content.indexOf('  const handleRegister = async (e) => {');
}

if (idxStart !== -1 && idxEnd !== -1) {
    const toReplace = content.substring(idxStart, idxEnd);
    const newLogic = `  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return setError('يرجى إدخال كلمة المرور');
    setError('');
    setLoading(true);

    try {
      const cleanPhone = normalizePhone(phone);
      const custRef = ref(db, \`CustomerLoginEmails/\${cleanPhone}\`);
      const custSnap = await get(custRef);
      const authEmail = custSnap.exists() ? custSnap.val().trim() : null;
      const internalEmail = getInternalEmail(cleanPhone);
      
      const emailToTry1 = authEmail || internalEmail;
      
      try {
        await signInWithEmailAndPassword(auth, emailToTry1, password);
      } catch (firstErr) {
        throw firstErr;
      }
      
      await refreshCustomerData(cleanPhone);
      setStep('dashboard');
    } catch (err) {
      setError('كلمة المرور غير صحيحة أو الحساب غير موجود');
    }
    setLoading(false);
  };

`;
    content = content.replace(toReplace, newLogic);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Replaced handleLogin completely!");
} else {
    console.log("Could not find bounds for handleLogin");
}
