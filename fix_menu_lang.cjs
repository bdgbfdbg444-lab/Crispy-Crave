const fs = require('fs');

function addUseLanguage(content) {
    if (!content.includes("import { useLanguage }")) {
        content = content.replace("import React", "import React\nimport { useLanguage } from '../context/LanguageContext';");
    }
    return content;
}

function injectLangHook(content, compName) {
    const hook = "  const { lang, t } = useLanguage();\n";
    if (!content.includes(hook)) {
        const regex = new RegExp('(export default function ' + compName + '[^{]*{)');
        content = content.replace(regex, "\n" + hook);
    }
    return content;
}

function fixProductCard() {
    let fp = 'src/components/Menu/ProductCard.jsx';
    let c = fs.readFileSync(fp, 'utf8');
    c = addUseLanguage(c);
    c = injectLangHook(c, 'ProductCard');
    c = c.replaceAll('{product.name}', "{lang === 'en' && product.nameEn ? product.nameEn : product.name}");
    c = c.replaceAll('{product.description}', "{lang === 'en' && product.descriptionEn ? product.descriptionEn : product.description}");
    fs.writeFileSync(fp, c, 'utf8');
    console.log('ProductCard patched');
}

function fixProductModal() {
    let fp = 'src/components/Menu/ProductModal.jsx';
    let c = fs.readFileSync(fp, 'utf8');
    c = addUseLanguage(c);
    c = injectLangHook(c, 'ProductModal');
    c = c.replaceAll('{product.name}', "{lang === 'en' && product.nameEn ? product.nameEn : product.name}");
    c = c.replaceAll('{product.description}', "{lang === 'en' && product.descriptionEn ? product.descriptionEn : product.description}");
    c = c.replaceAll('{category.name}', "{lang === 'en' && category.nameEn ? category.nameEn : category.name}");
    fs.writeFileSync(fp, c, 'utf8');
    console.log('ProductModal patched');
}

function fixMenuSection() {
    let fp = 'src/components/Menu/MenuSection.jsx';
    let c = fs.readFileSync(fp, 'utf8');
    c = addUseLanguage(c);
    c = injectLangHook(c, 'MenuSection');
    c = c.replaceAll('{category.name}', "{lang === 'en' && category.nameEn ? category.nameEn : category.name}");
    fs.writeFileSync(fp, c, 'utf8');
    console.log('MenuSection patched');
}

fixProductCard();
fixProductModal();
fixMenuSection();
