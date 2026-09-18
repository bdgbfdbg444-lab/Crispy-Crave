const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const s1 = content.split('    // If auth state resolved and we have both user and data, go to dashboard');
const s2 = s1[1].split('    // Countdown timer for OTP resend');

const replacement = `
      if (!authLoading) {
        if (currentUser && customerData) {
          setStep('dashboard');
        } else if (!currentUser) {
          setStep('phone');
          setIsForgotPasswordFlow(false);
        }
      }
    }, [currentUser, customerData, authLoading]);

`;

const finalStr = s1[0] + '    // If auth state resolved and we have both user and data, go to dashboard' + replacement + '    // Countdown timer for OTP resend' + s2[1];
fs.writeFileSync('src/pages/MyAccountPage.jsx', finalStr, 'utf8');
console.log('Fixed using split');
