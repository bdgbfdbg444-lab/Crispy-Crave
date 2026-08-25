const fs = require('fs');
let lines = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* Wallet Info */}'));
let endIdx = -1;

if (startIdx !== -1) {
    for (let i = startIdx + 1; i < lines.length; i++) {
        if (lines[i].includes(')}')) {
            endIdx = i;
            break;
        }
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx + 1, '                <PaymentSection marketing={marketing} />');
    
    // Add import
    if (!lines.some(l => l.includes('import PaymentSection'))) {
        lines.unshift("import PaymentSection from '../components/PaymentSection';");
    }
    
    fs.writeFileSync('src/pages/CheckoutPage.jsx', lines.join('\n'));
    console.log('Replaced by line indices in CheckoutPage.jsx');
} else {
    console.log('Failed to find indices');
}
