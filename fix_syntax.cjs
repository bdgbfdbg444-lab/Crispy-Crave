const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

content = content.replace(
  /\/const handleRegister = async \\\(e\\\) => \\{\/m/g,
  "const handleRegister = async (e) => {"
);

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Fixed syntax error!');
