const fs = require('fs');
let content = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8');

const target = /const isSessionOwner = Boolean\(/;
const newCode = `const [, setForceRender] = useState(0);
  useEffect(() => {
    const handleStorageChange = () => setForceRender(prev => prev + 1);
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const isSessionOwner = Boolean(`;

if (content.match(target)) {
    content = content.replace(target, newCode);
    fs.writeFileSync('src/pages/TrackOrderPage.jsx', content, 'utf8');
    console.log('Added storage listener');
} else {
    console.log('Target not found');
}
