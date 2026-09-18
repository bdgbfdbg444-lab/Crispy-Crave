const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetBlock = /get\(ref\(db, \`PublicCustomers\/\$\{cleanPhone\}\`\)\)\.then\(custSnap => \{[\s\S]*?setLoading\(false\);\n          \}\);/m;

const replacementBlock = `get(ref(db, \`PublicCustomers/\${cleanPhone}\`)).then(async custSnap => {
            if (custSnap.exists()) {
              setIsExistingCustomer(true);
              // Bypass password reset and just log them in using the verified OTP session
              await refreshCustomerData(cleanPhone);
              setStep('dashboard');
            } else {
              setIsExistingCustomer(false);
              setStep('complete_profile');
            }
            setLoading(false);
          });`;

if (content.match(targetBlock)) {
    content = content.replace(targetBlock, replacementBlock);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Successfully replaced OTP success block.');
} else {
    console.log('Could not find the target block to replace.');
}
