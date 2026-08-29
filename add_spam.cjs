const fs = require('fs');
let myAccount = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// Add lastAddTimestamp state
myAccount = myAccount.replace(
    /const \[isSavingAddress, setIsSavingAddress\] = React\.useState\(false\);/,
    const [isSavingAddress, setIsSavingAddress] = React.useState(false);\n  const [lastAddTimestamp, setLastAddTimestamp] = React.useState(0);
);

// Add rate limit check
myAccount = myAccount.replace(
    /if \(addresses\.length >= 5\) \{/,
    const now = Date.now();\n      if (now - lastAddTimestamp < 3000) {\n        alert(lang === 'en' ? 'Please wait a moment before adding another address' : 'الرجاء الانتظار قليلاً قبل إضافة عنوان آخر');\n        return;\n      }\n      setLastAddTimestamp(now);\n\n      if (addresses.length >= 5) {
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', myAccount, 'utf8');
