const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// Ensure useCart and ShoppingBag are imported
if (!content.includes('useCart')) {
    content = content.replace(
        /import \{ useAuth \} from '\.\.\/context\/AuthContext';/,
        import { useAuth } from '../context/AuthContext';\nimport { useCart } from '../context/CartContext';
    );
}
if (!content.includes('RotateCcw')) {
    content = content.replace(
        /import \{ Package, MapPin, Edit3, LogOut, ChevronLeft, Navigation, ChevronDown, ChevronUp, Home, Briefcase, Plus, Trash2, Settings, User, CheckCircle2 \} from 'lucide-react';/,
        import { Package, MapPin, Edit3, LogOut, ChevronLeft, Navigation, ChevronDown, ChevronUp, Home, Briefcase, Plus, Trash2, Settings, User, CheckCircle2, RotateCcw } from 'lucide-react';
    );
}

// Add addToCart to DashboardView
if (!content.includes('const { addToCart } = useCart();')) {
    content = content.replace(
        /const DashboardView = \(\{ customerData, onLogout \}\) => \{/,
        const DashboardView = ({ customerData, onLogout }) => {\n  const { addToCart } = useCart();\n\n  const handleOrderAgain = (order) => {\n    if (order.Items && Array.isArray(order.Items)) {\n      order.Items.forEach(item => {\n        // Re-construct product matching CartContext expectations if needed, or just pass as is\n        // The old script used item.product\n        const product = item.Product || item.product || item;\n        const qty = item.Quantity || item.quantity || 1;\n        addToCart(product, qty);\n      });\n      navigate('/cart');\n    }\n  };
    );
}

// Add the Reorder button to the order history card
if (!content.includes('handleOrderAgain')) {
    content = content.replace(
        /<div className="p-4 border-t border-brand-red\/20 bg-black-surface">/,
        <div className="p-4 border-t border-brand-red/20 bg-black-surface flex gap-2">\n                           <button onClick={() => handleOrderAgain(order)} className="w-1/3 bg-black-primary border border-brand-red/50 hover:bg-black-surface text-brand-red font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">\n                              <RotateCcw size={18} />\n                              {lang === 'en' ? 'Reorder' : 'اطلب مجدداً'}\n                           </button>\n                           <button onClick={() => navigate('/track/' + encodeURIComponent(order.OrderNumber))} className="w-2/3 bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
    );
    // Replace the closing tag of the original button to not swallow it
    content = content.replace(
        /\{lang === 'en' \? 'Track Order' : 'ØªØªØ¨Ø¹ Ø§Ù„Ø·Ù„Ø¨ Ù…Ø¨Ø§Ø´Ø±Ø©'\}\n                           <\/button>\n                        <\/div>/,
        {lang === 'en' ? 'Track Order' : 'تتبع الطلب مباشرة'}\n                           </button>\n                        </div>
    );
}

fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
