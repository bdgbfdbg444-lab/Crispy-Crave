const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.jsx', 'utf8');
content = content.replace(/label: '[^']+'/, "label: '??????'");
fs.writeFileSync('src/context/AuthContext.jsx', content, 'utf8');
