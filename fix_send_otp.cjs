const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = `  const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    setGeneratedOtp(code);
    setOtpExpiry(expiry);
    
    const reqId = \\\`otp_\\\${Date.now()}_\\\${Math.random().toString(36).substring(2, 7)}\\\`;
    await set(ref(db, \\\`PendingOtpRequests/\\\${reqId}\\\`), {
      phone: cleanPhone,
      otp: code,
      createdAt: Date.now()
    });
    return code;
  };`;

// We'll use regex since exact string matching with backticks is annoying
const targetRegex = /const sendWhatsAppOtp = async \(targetPhone\) => \{[\s\S]*?return code;\n  \};/;

const newLogic = `const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    setGeneratedOtp(code);
    setOtpExpiry(expiry);
    
    if (!auth.currentUser) {
        await signInAnonymously(auth);
    }
    
    const reqId = \`otp_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
    await set(ref(db, \`PendingOtpRequests/\${reqId}\`), {
      phone: cleanPhone,
      uid: auth.currentUser.uid,
      otp: code,
      createdAt: Date.now()
    });
    return code;
  };`;

if (content.match(targetRegex)) {
    content = content.replace(targetRegex, newLogic);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Updated sendWhatsAppOtp successfully!");
} else {
    console.log("Could not find sendWhatsAppOtp.");
}
