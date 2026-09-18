const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const lastBraceIndex = content.lastIndexOf('}');
if (lastBraceIndex !== -1) {
    content = content.substring(0, lastBraceIndex) + content.substring(lastBraceIndex + 1);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Removed last brace");
}
