const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// I will add a window.onerror or unhandledrejection listener to see the full trace if needed, but I can also just wrap ALL gets in MyAccountPage.jsx
content = content.replace(
    "catch (err) {\n        console.error(err);\n        setOtpError('حدث خطأ أثناء فحص الحساب.');\n      }",
    "catch (err) {\n        console.error('HANDLE CONFIRM OTP ERROR:', err);\n        setOtpError('حدث خطأ أثناء فحص الحساب.');\n      }"
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log("Updated MyAccountPage to trace the error!");
