const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = `import { ref, get, set, update } from 'firebase/database';`;
const newStr = `import { ref, get, set, update, onValue, off } from 'firebase/database';`;
if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
}

const target2 = `  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);`;

const newStr2 = `  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);

  useEffect(() => {
    let unsubscribe;
    if (isOtpModalOpen && phone) {
      const cleanPhone = normalizePhone(phone);
      const verifyRef = ref(db, \`OtpVerifications/\${cleanPhone}\`);
      unsubscribe = onValue(verifyRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.code) {
            setGeneratedOtp(data.code);
            setOtpExpiry(data.expiresAt);
            console.log('Received OTP from POS:', data.code);
          }
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOtpModalOpen, phone]);
`;

if (content.includes(target2)) {
    content = content.replace(target2, newStr2);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Injected OTP polling!");
} else {
    console.log("Could not find target2.");
}
