const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const fnStartIdx = content.indexOf('export default function MyAccountPage');
const returnIdx = content.indexOf('return (', fnStartIdx);

if (returnIdx !== -1) {
    content = content.substring(0, returnIdx) + 'return ( <>' + content.substring(returnIdx + 'return ('.length);
    
    // Find the last ); in the file (which should be the return of MyAccountPage)
    const lastReturnEnd = content.lastIndexOf(');');
    if (lastReturnEnd !== -1) {
        content = content.substring(0, lastReturnEnd) + '</>\n  );' + content.substring(lastReturnEnd + 2);
        fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
        console.log('Wrapped in fragment correctly!');
    }
}
