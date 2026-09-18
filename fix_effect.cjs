const fs = require('fs');
let content = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8');

content = content.replace("  }, [orderDetails]);", "  }, [orderDetails?.displayOrderId]);");

fs.writeFileSync('src/pages/TrackOrderPage.jsx', content, 'utf8');
console.log('Fixed useEffect dependency');
