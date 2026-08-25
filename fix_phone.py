import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = r"if \(custSnap\.exists\(\)\) {\s*setStep\('login'\);\s*}"
replacement = """if (custSnap.exists()) {
        const data = custSnap.val();
        if (data.Provider === 'google') {
          setError('هذا الرقم مسجل عبر Google. يرجى الدخول باستخدام زر Google بالأسفل.');
        } else {
          setStep('login');
        }
      }"""

c = re.sub(pattern, replacement, c)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)