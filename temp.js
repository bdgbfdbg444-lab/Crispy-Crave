const fs = require('fs');
let lines = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8').split('\n');

const whatsappLineIdx = lines.findIndex(l => l.includes('<a') && lines[l+1] && lines[l+1].includes('wa.me'));
// actually it's easier to replace:
//           ) : (
//             <a 

let c = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8');

c = c.replace(
    ') : (\r\n            <a ',
    `) : (\r\n            <>\r\n              <PaymentSection marketing={menuData?.marketing} />\r\n              <a `
);

// We need to also close the fragment
c = c.replace(
    '</button>\r\n          )}',
    '</button>\r\n            </>\r\n          )}'
);

// Wait, let's look at the structure closely.
