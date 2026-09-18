const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

let openBraces = 0;
let earlyCloseIndex = -1;
for (let i = 0; i < content.length; i++) {
   if (content[i] === '{') openBraces++;
   if (content[i] === '}') openBraces--;
   
   if (openBraces === -1) {
       earlyCloseIndex = i;
       break;
   }
}
console.log('Early close at index:', earlyCloseIndex);
const contextStart = Math.max(0, earlyCloseIndex - 100);
console.log(content.substring(contextStart, earlyCloseIndex + 100));
