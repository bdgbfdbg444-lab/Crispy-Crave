const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

content = content.replace(
    "setGeneratedOtp(code);",
    "setGeneratedOtp(code);\n    console.log('OTP GENERATED:', code);"
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log("Added OTP console log!");
