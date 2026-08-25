const fs = require('fs');
let code = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

// The one inside the Order Summary div (which is not inside the isSuccess block)
// Let's find it. The summary is near "Order Summary" or "ملخص الطلب"

code = code.replace(/<span className="font-black text-primary">\{finalTotal\} /g, '<span className="font-black text-primary">{cartTotal} ');

fs.writeFileSync('src/pages/CheckoutPage.jsx', code, 'utf8');
