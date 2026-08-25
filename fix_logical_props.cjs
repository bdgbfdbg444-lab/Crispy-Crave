const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // basic regex for classes like mr-4, ml-2, pr-3, pl-5
            // but carefully not matching other words
            content = content.replace(/\bmr-(\d+|auto|px|0\.5|1\.5|2\.5|3\.5)\b/g, 'me-');
            content = content.replace(/\bml-(\d+|auto|px|0\.5|1\.5|2\.5|3\.5)\b/g, 'ms-');
            content = content.replace(/\bpr-(\d+|auto|px|0\.5|1\.5|2\.5|3\.5)\b/g, 'pe-');
            content = content.replace(/\bpl-(\d+|auto|px|0\.5|1\.5|2\.5|3\.5)\b/g, 'ps-');
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Patched logical properties in: ' + fullPath);
            }
        }
    }
}

processDir('src');
