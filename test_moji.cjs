const fs = require('fs');
const content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');
console.log(content.indexOf('O') !== -1);
