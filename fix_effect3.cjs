const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const strStart = "  useEffect(() => {\n    // If auth state resolved and we have both user and data, go to dashboard\n    if (!authLoading && currentUser && customerData) {\n      setStep('dashboard');\n    }\n  }, [currentUser, customerData, authLoading]);";

const replacement = `  useEffect(() => {
    if (!authLoading) {
      if (currentUser && customerData) {
        setStep('dashboard');
      } else if (!currentUser && step === 'dashboard') {
        setStep('phone');
        setIsForgotPasswordFlow(false);
      }
    }
  }, [currentUser, customerData, authLoading, step]);`;

if (content.includes(strStart)) {
    content = content.replace(strStart, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Fixed useEffect explicitly');
} else {
    // try removing the comment
    const altTarget = content.substring(content.indexOf("useEffect(() => {\n    // If auth"), content.indexOf("  }, [currentUser, customerData, authLoading]);") + "  }, [currentUser, customerData, authLoading]);".length);
    if (altTarget.length > 0 && altTarget.includes("useEffect")) {
        content = content.replace(altTarget, replacement);
        fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
        console.log('Fixed useEffect with fallback');
    } else {
        console.log('Failed completely');
    }
}
