const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = "const [isExistingCustomer, setIsExistingCustomer] = useState(false);";

if (content.includes(targetStr)) {
    content = content.replace(targetStr, targetStr + "\n  const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);");
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Added isForgotPasswordFlow state!");
} else {
    console.log("Could not find state injection point.");
}
