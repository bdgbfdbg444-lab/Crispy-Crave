const fs = require('fs');

let c = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8');

const search1 = ') : (\r\n            <a';
const replace1 = ') : (\r\n            <>\r\n              <PaymentSection marketing={menuData?.marketing} />\r\n              <a';

const search2 = '</a>\r\n          )}';
const replace2 = '</a>\r\n            </>\r\n          )}';

if (c.includes(search1) && c.includes(search2)) {
    c = c.replace(search1, replace1);
    c = c.replace(search2, replace2);
    
    if (!c.includes('import PaymentSection')) {
        c = "import PaymentSection from '../components/PaymentSection';\n" + c;
    }
    
    fs.writeFileSync('src/pages/TrackOrderPage.jsx', c);
    console.log('Successfully updated TrackOrderPage.jsx');
} else {
    // try with \n only
    const search1_n = ') : (\n            <a';
    const replace1_n = ') : (\n            <>\n              <PaymentSection marketing={menuData?.marketing} />\n              <a';
    const search2_n = '</a>\n          )}';
    const replace2_n = '</a>\n            </>\n          )}';
    
    if (c.includes(search1_n) && c.includes(search2_n)) {
        c = c.replace(search1_n, replace1_n);
        c = c.replace(search2_n, replace2_n);
        
        if (!c.includes('import PaymentSection')) {
            c = "import PaymentSection from '../components/PaymentSection';\n" + c;
        }
        
        fs.writeFileSync('src/pages/TrackOrderPage.jsx', c);
        console.log('Successfully updated TrackOrderPage.jsx (LF)');
    } else {
        console.log('Could not match in TrackOrderPage.jsx');
    }
}
