const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = "if (custSnap.exists()) {\n                setIsExistingCustomer(true);\n                // Bypass password reset and just log them in using the verified OTP session\n                await refreshCustomerData(cleanPhone);\n                setStep('dashboard');\n              } else {";
const replacement = `if (custSnap.exists()) {
                setIsExistingCustomer(true);
                if (isForgotPasswordFlow) {
                  setStep('set_password');
                } else {
                  await refreshCustomerData(cleanPhone);
                  setStep('dashboard');
                }
              } else {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Replaced by exact match');
} else {
    // try regex with wildcards for spaces
    const r = /if\s*\(custSnap\.exists\(\)\)\s*\{\s*setIsExistingCustomer\(true\);\s*\/\/[^\n]*\s*await refreshCustomerData\(cleanPhone\);\s*setStep\('dashboard'\);\s*\}\s*else\s*\{/;
    if (content.match(r)) {
        content = content.replace(r, replacement);
        fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
        console.log('Replaced by regex');
    } else {
        console.log('Still not found');
    }
}
