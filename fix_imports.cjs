const fs = require('fs');

function fixImport(fp) {
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(
        "import { useLanguage } from '../context/LanguageContext';",
        "import { useLanguage } from '../../context/LanguageContext';"
    );
    fs.writeFileSync(fp, content, 'utf8');
}

fixImport('src/components/Menu/MenuSection.jsx');
fixImport('src/components/Menu/ProductModal.jsx');
fixImport('src/components/Menu/ProductCard.jsx');

console.log('Imports fixed');
