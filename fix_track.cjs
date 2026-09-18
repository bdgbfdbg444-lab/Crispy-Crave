const fs = require('fs');
let content = fs.readFileSync('src/pages/TrackOrderPage.jsx', 'utf8');

const newEffect = `
  // Fallback listener for POS rejection (POS writes to displayOrderId when rejected before accepting)
  useEffect(() => {
    if (!orderDetails || !orderDetails.displayOrderId) return;
    const cleanDisp = orderDetails.displayOrderId.replace('#', '').trim();
    const dispRef = ref(db, \`PublicTracking/\${cleanDisp}\`);
    const unsub = onValue(dispRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.Status && data.Status === 'Cancelled') {
        setOrderData(prev => ({ ...prev, Status: 'Cancelled' }));
      }
    });
    return () => off(dispRef, 'value', unsub);
  }, [orderDetails]);
`;

// Insert it right after the first useEffect
content = content.replace("    }, [orderId]);", "    }, [orderId]);\n" + newEffect);

fs.writeFileSync('src/pages/TrackOrderPage.jsx', content, 'utf8');
console.log('Added fallback listener');
