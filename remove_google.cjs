const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = /<div className="mt-6 flex items-center justify-center gap-2">[\s\S]*?O"O O3OOrO_O U. Google\s*<\/button>/m;

if (content.match(target)) {
    content = content.replace(target, '');
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log('Removed Google Login UI');
} else {
    // Let's try matching the english text just in case encoding is weird
    const fallbackTarget = /<div className="mt-6 flex items-center justify-center gap-2">[\s\S]*?Google\s*<\/button>/m;
    if (content.match(fallbackTarget)) {
        content = content.replace(fallbackTarget, '');
        fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
        console.log('Removed Google Login UI via fallback');
    } else {
        console.log('Could not find Google Login block');
    }
}
