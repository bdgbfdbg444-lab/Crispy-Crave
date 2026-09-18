const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

content = content.replace(
    "setError('حدث خطأ أثناء إرسال كود واتساب');",
    "console.error('OTP Send Error:', err);\n        setError('حدث خطأ أثناء إرسال كود واتساب');"
);
content = content.replace(
    "setError('O-O_O OrOO OOU+O O OOO3O U, UU^O_ U^O OO3O O\"');",
    "console.error('OTP Send Error:', err);\n        setError('حدث خطأ أثناء إرسال كود واتساب');"
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log("Added console.error");
