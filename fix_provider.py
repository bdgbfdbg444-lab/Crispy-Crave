import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Update handlePhoneSubmit
old_phone = """      try {
        const custRef = ref(db, `PublicCustomers/${phone}`);
        const custSnap = await get(custRef);
        if (custSnap.exists()) {
          setStep('login');
        } else {
          setStep('register');
        }
      }"""

new_phone = """      try {
        const custRef = ref(db, `PublicCustomers/${phone}`);
        const custSnap = await get(custRef);
        if (custSnap.exists()) {
          const data = custSnap.val();
          if (data.Provider === 'google') {
            setError('هذا الرقم مسجل عبر Google. يرجى الدخول باستخدام زر Google بالأسفل.');
          } else {
            setStep('login');
          }
        } else {
          setStep('register');
        }
      }"""
c = c.replace(old_phone, new_phone)

# Update handleRegister
c = c.replace('RegisteredDate: new Date().toISOString(),', "RegisteredDate: new Date().toISOString(),\n        Provider: 'password',")

# Update handleLinkPhone
c = c.replace('RegisteredDate: new Date().toISOString(),', "RegisteredDate: new Date().toISOString(),\n          Provider: 'google',")

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)