const fs = require('fs');
const content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');
console.log('Has Google button in phone step:', content.includes('google.svg'));
console.log('Has old flat rounded:', (content.match(/rounded hover/g) || []).length);
console.log('Has modern rounded-xl:', (content.match(/rounded-xl/g) || []).length);
console.log('Total lines:', content.split('\n').length);
