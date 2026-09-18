const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

content = content.replace(
    "if (otpInput.trim() !== generatedOtp) return setOtpError('الكود غير صحيح.');",
    "console.log('Comparing:', { otpInput: otpInput.trim(), generatedOtp, type1: typeof otpInput, type2: typeof generatedOtp });\n    if (otpInput.trim() !== String(generatedOtp)) return setOtpError('الكود غير صحيح.');"
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log("Added debugging for OTP!");
