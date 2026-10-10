const fs = require('fs');

function fix(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    for (let r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

fix('src/components/Menu/ProductModal.jsx', [
    {
        search: "{lang === 'en' ? 'Choose' : 'اختر'} الوزن",
        replace: "{lang === 'en' ? 'Choose Weight' : 'اختر الوزن'}"
    }
]);

console.log('ProductModal fixed!');
