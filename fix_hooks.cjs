const fs = require('fs');
let content = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8');

const earlyReturn = `  // If orderData is not found in database at all:
  if (!orderData) {`;

const hooksCode = `  const [, setForceRender] = useState(0);
  useEffect(() => {
    const handleStorageChange = () => setForceRender(prev => prev + 1);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);`;

// Remove the hooks from their current location
if (content.includes(hooksCode)) {
    content = content.replace(hooksCode, '');
    
    // Insert them before the early return
    content = content.replace(earlyReturn, hooksCode + '\n\n' + earlyReturn);
    
    fs.writeFileSync('src/pages/TrackOrderPage.jsx', content, 'utf8');
    console.log("Moved hooks above early return!");
} else {
    console.log("Could not find hooks code.");
}
