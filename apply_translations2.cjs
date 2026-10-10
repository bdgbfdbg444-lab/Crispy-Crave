const fs = require('fs');

function fix(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    for (let r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

fix('src/components/Footer.jsx', [
    {
        search: "export default function Footer({ websiteData }) {\n  const [isReviewModalOpen",
        replace: "export default function Footer({ websiteData }) {\n  const { lang } = useLanguage();\n  const [isReviewModalOpen"
    },
    {
        search: "<Star size={16} className=\"fill-current\" />\n              شاركنا رأيك",
        replace: "<Star size={16} className=\"fill-current\" />\n              {lang === 'en' ? 'Share Your Opinion' : 'شاركنا رأيك'}"
    }
]);

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

fix('src/components/Menu/ProductModal.jsx', [
    {
        search: "اختر الوزن",
        replace: "{lang === 'en' ? 'Choose Weight' : 'اختر الوزن'}"
    }
]);

fix('src/pages/CheckoutPage.jsx', [
    {
        search: "الوزن: {item.product.selectedWeight} جرام",
        replace: "{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'g' : 'جرام'}"
    },
    {
        search: "{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'EGP' : 'ج'}رام",
        replace: "{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'g' : 'جرام'}"
    }
]);

console.log('Translations applied successfully via node script!');
