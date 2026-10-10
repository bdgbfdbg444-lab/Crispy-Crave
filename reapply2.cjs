const fs = require('fs');
let code = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

// Inject AI Verification logic
const injection = `
          if (res.ok) {
            const cloudResult = await res.json();
            paymentReceiptUrl = cloudResult.secure_url;
            
            // --- AI RECEIPT VERIFICATION ---
            try {
                const reqId = 'vrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                await set(ref(db, \`ReceiptVerificationRequests/\${reqId}\`), {
                    imageUrl: paymentReceiptUrl,
                    expectedAmount: finalTotal,
                    walletNumber: walletNumber,
                    orderId: displayOrderId,
                    phone: formData.customerPhone || userPhone || 'unknown',
                    timestamp: new Date().toISOString()
                });
                
                // Wait for verdict
                const verdict = await new Promise((resolve) => {
                    const verdictRef = ref(db, \`ReceiptVerdicts/\${reqId}\`);
                    let timeout = setTimeout(() => {
                        resolve({ scoreText: '⚪ لم يتم الفحص', verdict: 'orange' });
                    }, 15000); // 15 seconds max wait
                    
                    const unsubscribe = onValue(verdictRef, (snap) => {
                        if (snap.exists()) {
                            clearTimeout(timeout);
                            unsubscribe();
                            resolve(snap.val());
                        }
                    });
                });
                
                aiVerdict = verdict;
                
            } catch(aiErr) {
                console.warn('AI Verification skipped/failed:', aiErr);
                aiVerdict = { scoreText: '⚪ لم يتم الفحص', verdict: 'orange', error: aiErr.message };
            }
          }
`;

const targetRegex = /if \(res\.ok\) \{\s*const cloudResult = await res\.json\(\);\s*paymentReceiptUrl = cloudResult\.secure_url;\s*\}/;

if (code.match(targetRegex)) {
    code = code.replace(targetRegex, injection);
    if (!code.includes('onValue')) {
        code = code.replace('ref, set, push, update, remove, get, serverTimestamp', 'ref, set, push, update, remove, get, serverTimestamp, onValue');
    }
}

// Ensure aiVerdict is added to orderPayload
if (!code.includes('let aiVerdict = null;')) {
    code = code.replace('let paymentReceiptUrl = null;', 'let paymentReceiptUrl = null;\n      let aiVerdict = null;');
}
if (!code.includes('aiVerdict: aiVerdict')) {
    code = code.replace('paymentReceiptUrl: paymentReceiptUrl', 'paymentReceiptUrl: paymentReceiptUrl,\n        aiVerdict: aiVerdict');
}

fs.writeFileSync('src/pages/CheckoutPage.jsx', code, 'utf8');
console.log('Successfully re-applied AI Verification to CheckoutPage!');
