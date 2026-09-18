const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetBlock = `const handleLogout = () => {
    signOut(auth);
    setStep('phone'); setIsForgotPasswordFlow(false);
    setPhone('');
    setPassword('');
    setOtpInput('');
  };`;

// Try an easier string replace
content = content.replace("setOtpInput('');\n    };", "setOtpInput('');\n      localStorage.removeItem('activeOrderId');\n      localStorage.removeItem('activeOrderNumber');\n      localStorage.removeItem('editingOrderId');\n    };");

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed handleLogout');
