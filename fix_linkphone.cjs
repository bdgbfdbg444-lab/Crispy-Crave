const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const regex = /const handleLinkPhone = async \(e\) => \{\s*e\.preventDefault\(\);\s*if \(phone\.length < 10\) return setError\('.*?'\);/;

const replacement = `const handleLinkPhone = async (e) => {
    e.preventDefault();
    let cleanPhone = phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
       return setError('يجب إدخال رقم هاتف مصري صحيح مكون من 11 رقم (مثال: 01012345678)');
    }`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Validation injected for handleLinkPhone!');
