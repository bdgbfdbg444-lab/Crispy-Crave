const fs = require('fs');

function fix(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (let r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// 1. Footer.jsx
fix('src/components/Footer.jsx', [
    {
        search: "import React",
        replace: "import { useLanguage } from '../context/LanguageContext';\nimport React"
    },
    {
        search: "export default function Footer({ websiteData }) {\n  const [isReviewModalOpen",
        replace: "export default function Footer({ websiteData }) {\n  const { lang } = useLanguage();\n  const [isReviewModalOpen"
    },
    {
        search: "<Star size={16} className=\"fill-current\" />\n              شاركنا رأيك",
        replace: "<Star size={16} className=\"fill-current\" />\n              {lang === 'en' ? 'Share Your Opinion' : 'شاركنا رأيك'}"
    }
]);

// 2. CartSidebar.jsx
fix('src/components/Cart/CartSidebar.jsx', [
    {
        search: "الوزن: {item.product.selectedWeight} جرام",
        replace: "{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'g' : 'جرام'}"
    },
    {
        search: "<span className=\"font-bold text-text-muted\">الإجمالي:</span>",
        replace: "<span className=\"font-bold text-text-muted\">{lang === 'en' ? 'Total:' : 'الإجمالي:'}</span>"
    }
]);

// 3. ProductModal.jsx
fix('src/components/Menu/ProductModal.jsx', [
    {
        search: "اختر الوزن",
        replace: "{lang === 'en' ? 'Choose Weight' : 'اختر الوزن'}"
    }
]);

// 4. CheckoutPage.jsx
fix('src/pages/CheckoutPage.jsx', [
    {
        search: "الوزن: {item.product.selectedWeight} جرام",
        replace: "{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'g' : 'جرام'}"
    }
]);

console.log('Translations applied successfully!');
