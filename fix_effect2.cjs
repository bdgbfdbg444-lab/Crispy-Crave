const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = /useEffect\(\(\) => \{\n\s*\/\/ If auth state resolved[\s\S]*?if \(!authLoading && currentUser && customerData\) \{\n\s*setStep\('dashboard'\);\n\s*\}\n\s*\}, \[currentUser, customerData, authLoading\]\);/m;
const replacement = `useEffect(() => {
    if (!authLoading) {
      if (currentUser && customerData) {
        setStep('dashboard');
      } else if (!currentUser && step === 'dashboard') {
        setStep('phone');
        setIsForgotPasswordFlow(false);
      }
    }
  }, [currentUser, customerData, authLoading, step]);`;

if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Fixed useEffect');
} else {
    console.log('Could not find useEffect');
}
