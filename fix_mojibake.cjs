const fs = require('fs');
const path = require('path');

function fixMojibake(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regular expression to match suspected Mojibake. 
    // Mojibake of Arabic typically contains characters like Ø, Ù, etc. (which are C2, C3 followed by something in Latin1)
    // We can try to find all strings inside quotes or just decode the whole file? 
    // No, decoding the whole file will mess up valid ASCII like 'import React'.
    // Wait, valid ASCII (0-127) encodes the same in both!
    // If we convert the ENTIRE file from utf8 string -> Buffer (latin1) -> string (utf8),
    // valid ASCII remains exactly the same!
    // Let's test this!
    
    let buf = Buffer.from(content, 'latin1'); // Convert string characters into raw bytes
    let recovered = buf.toString('utf8');
    
    // Check if the recovered string has valid Arabic characters
    if (/[\u0600-\u06FF]/.test(recovered)) {
        console.log('Fixed mojibake in: ' + filePath);
        fs.writeFileSync(filePath, recovered, 'utf8');
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                traverse(fullPath);
            }
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            try {
                fixMojibake(fullPath);
            } catch (e) { }
        }
    }
}

traverse('./src');
