const fs = require('fs');
let myAccount = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');
myAccount = myAccount.replace(/Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø·ÙˆÙŠÙ„ Ø¬Ø¯Ø§Ù‹ \(Ø§Ù„ØØ¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 200 ØØ±Ù \)/g, 'العنوان طويل جداً (الحد الأقصى 200 حرف)');
myAccount = myAccount.replace(/Ù„Ù‚Ø¯ ÙˆØµÙ„Øª Ù„Ù„ØØ¯ Ø§Ù„Ø£Ù‚ØµÙ‰ \(5 Ø¹Ù†Ø§ÙˆÙŠÙ†\)/g, 'لقد وصلت للحد الأقصى (5 عناوين)');
myAccount = myAccount.replace(/Ø§Ù„Ù…Ù†Ø²Ù„/g, 'المنزل');
myAccount = myAccount.replace(/Ø§ÙƒØªØ¨ ØªÙ Ø§ØµÙŠÙ„ Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø¨Ø§Ù„ÙƒØ§Ù…Ù„\.\.\./g, 'اكتب تفاصيل العنوان بالكامل...');
myAccount = myAccount.replace(/Ø¥Ù„ØºØ§Ø¡/g, 'إلغاء');
myAccount = myAccount.replace(/Ø­Ù Ø¸ Ø§Ù„Ø¹Ù†ÙˆØ§Ù†/g, 'حفظ العنوان');
myAccount = myAccount.replace(/Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­Ù Ø¸\.\.\./g, 'جاري الحفظ...');
fs.writeFileSync('src/pages/MyAccountPage.jsx', myAccount, 'utf8');

let checkout = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');
checkout = checkout.replace(/ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ØªÙˆØµÙŠÙ„ Ø¨Ø§Ù„ØªÙ ØµÙŠÙ„/g, 'يرجى إدخال عنوان التوصيل بالتفصيل');
checkout = checkout.replace(/Ø¬Ø±Ø§Ù…/g, 'جرام');
fs.writeFileSync('src/pages/CheckoutPage.jsx', checkout, 'utf8');
