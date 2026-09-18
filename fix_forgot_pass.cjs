const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

if (!content.includes('const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);')) {
    content = content.replace(
        "const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');",
        "const [verifiedOtpPhone, setVerifiedOtpPhone] = useState('');\n    const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);"
    );
}

const targetBlock1 = /const handleForgotPassword = async \(\) => \{[\s\S]*?setIsExistingCustomer\(true\);/m;
const replaceBlock1 = `const handleForgotPassword = async () => {
      setError('');
      setLoading(true);
      try {
        const cleanPhone = normalizePhone(phone);
        await sendWhatsAppOtp(cleanPhone);
        setIsExistingCustomer(true);
        setIsForgotPasswordFlow(true);`;

content = content.replace(targetBlock1, replaceBlock1);

const targetBlock2 = /get\(ref\(db, \`PublicCustomers\/\$\{cleanPhone\}\`\)\)\.then\(async custSnap => \{[\s\S]*?setLoading\(false\);\n            \}\);/m;
const replaceBlock2 = `get(ref(db, \`PublicCustomers/\${cleanPhone}\`)).then(async custSnap => {
              if (custSnap.exists()) {
                setIsExistingCustomer(true);
                if (isForgotPasswordFlow) {
                    setStep('set_password');
                } else {
                    await refreshCustomerData(cleanPhone);
                    setStep('dashboard');
                }
              } else {
                setIsExistingCustomer(false);
                setStep('complete_profile');
              }
              setLoading(false);
            });`;

content = content.replace(targetBlock2, replaceBlock2);

// Ensure isForgotPasswordFlow is reset when going to phone step
content = content.replace(
    /setStep\('phone'\);/g,
    "setStep('phone'); setIsForgotPasswordFlow(false);"
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed Forgot Password logic');
