const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = `    const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError('رقم الهاتف غير صحيح');`;

const replacement = `    const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    let cleanPhone = phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
       return setError('يجب إدخال رقم هاتف مصري صحيح مكون من 11 رقم (مثال: 01012345678)');
    }`;

content = content.replace(target, replacement);

// Wait, the file might not have the exact arabic text because it might be garbled in PowerShell output, or it's English.
// Let's use a regex replace instead.
