const fs = require('fs');
const filepath = 'src/components/Header.jsx';
let content = fs.readFileSync(filepath, 'utf8');

if (!content.includes('useLanguage')) {
    content = content.replace(
        "import { useCart } from '../context/CartContext';",
        "import { useCart } from '../context/CartContext';\nimport { useLanguage } from '../context/LanguageContext';"
    );
}

if (!content.includes('const { lang, toggleLanguage, t }')) {
    content = content.replace(
        "const { cartItems, setIsCartOpen } = useCart();",
        "const { cartItems, setIsCartOpen } = useCart();\n  const { lang, toggleLanguage, t } = useLanguage();"
    );
}

content = content.replace(
    /const navLinks = \[[\s\S]*?\];/,
    "const navLinks = [\n    { name: t('home'), path: '/' },\n    { name: lang === 'en' ? 'Our Story' : 'قصتنا', path: '/#our-story' },\n    { name: lang === 'en' ? 'Location' : 'فروعنا', path: '/#location' },\n    { name: t('myAccount'), path: '/account' },\n  ];"
);

content = content.replace(
    /<button \s*onClick=\{\(\) => setIsCartOpen\(true\)\}/,
    "<button onClick={toggleLanguage} className=\"font-bold text-sm border-2 border-transparent hover:border-wood px-3 py-1 rounded-md transition-colors text-text-light mx-2\">\n{lang === 'ar' ? 'EN' : 'عربي'}\n</button>\n<button onClick={() => setIsCartOpen(true)}"
);

content = content.replace(
    /<span className="font-bold text-neon-amber group-hover:text-text-light transition-colors">[^<]+<\/span>/,
    "<span className=\"font-bold text-neon-amber group-hover:text-text-light transition-colors\">{t('cart')}</span>"
);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Header patched');
