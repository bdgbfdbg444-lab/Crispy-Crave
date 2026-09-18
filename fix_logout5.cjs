const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = /const handleLogout = \(\) => \{\s*signOut\(auth\);\s*setStep\('phone'\); setIsForgotPasswordFlow\(false\);\s*setPhone\(''\);\s*setPassword\(''\);\s*\};/m;
const replacement = `const handleLogout = () => {
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
  };`;

if (content.match(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Fixed handleLogout');
} else {
    console.log('Could not find handleLogout');
}
