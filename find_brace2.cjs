const fs = require('fs');
const content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const fnStart = content.indexOf('export default function MyAccountPage');
let openBraces = 0;
let started = false;
for (let i = fnStart; i < content.length; i++) {
   if (content[i] === '{') {
       openBraces++;
       started = true;
   }
   if (content[i] === '}') {
       openBraces--;
   }
   
   if (started && openBraces === 0) {
       console.log('Function closed at index:', i);
       console.log(content.substring(i - 100, i + 100));
       break;
   }
}
