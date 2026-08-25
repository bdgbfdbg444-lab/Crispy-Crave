import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add isValidEgyptianPhone helper
c = c.replace('export default function MyAccountPage() {', """const isValidEgyptianPhone = (p) => /^01[0125][0-9]{8}$/.test(p);

export default function MyAccountPage() {""")

# 2. Add handleForgotPassword
forgot_pass_func = """  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);
    try {
      const custSnap = await get(ref(db, `PublicCustomers/${phone}`));
      if (custSnap.exists()) {
        const data = custSnap.val();
        if (data.Email && !data.Email.includes('@internal.smokeandsmash.com')) {
          await sendPasswordResetEmail(auth, data.Email);
          alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني: ' + data.Email);
        } else {
          setError('عذراً، لا يوجد بريد إلكتروني حقيقي مرتبط بهذا الحساب. يرجى التواصل مع المطعم لاستعادة كلمة المرور.');
        }
      } else {
        setError('رقم الهاتف غير مسجل لدينا.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء محاولة استعادة كلمة المرور.');
    }
    setLoading(false);
  };"""

# Insert it before handleLogout
c = c.replace('  const handleLogout = () => {', forgot_pass_func + '\n\n  const handleLogout = () => {')

# 3. Modify phone validation in handlers
c = c.replace("if (phone.length < 10) return setError('رقم الهاتف غير صحيح');", "if (!isValidEgyptianPhone(phone)) return setError('يجب أن يكون رقم الهاتف 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015');")
c = c.replace("if (phone.length < 10) return setError('رقم الهاتف يجب أن يكون 10 أرقام على الأقل');", "if (!isValidEgyptianPhone(phone)) return setError('يجب أن يكون رقم الهاتف 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015');")

# Because of terminal utf-8 corruption from previous cat I can't rely on the exact Arabic text.
# Let's just use regex for the phone.length < 10 checks.
c = re.sub(r"if \(phone\.length < 10\) return setError\('[^']*'\);", "if (!isValidEgyptianPhone(phone)) return setError('يجب أن يكون رقم الهاتف 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015');", c)

# 4. Modify all phone input fields to enforce max length and only numbers
c = re.sub(
    r'<input type="tel"([^>]+)onChange=\{e => setPhone\(e\.target\.value\)\}([^>]*)>',
    r'<input type="tel"\1onChange={e => setPhone(e.target.value.replace(/\\D/g, "").slice(0, 11))}\2>',
    c
)

# 5. Add Forgot Password button in the login step
login_buttons = """          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 disabled:opacity-50 mb-3">
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
          <div className="flex justify-between items-center mt-2">
            <button type="button" onClick={() => {setStep('phone'); setPassword('');}} className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
              تغيير رقم الموبايل
            </button>
            <button type="button" onClick={handleForgotPassword} className="text-sm text-orange-600 hover:text-orange-800 transition-colors font-medium">
              نسيت كلمة المرور؟
            </button>
          </div>"""

# Find the login step buttons using regex to avoid arabic text mismatch
c = re.sub(
    r'<button type="submit" disabled=\{loading\}[^>]+>\s*\{loading \? [^:]+ : [^}]+\}\s*</button>\s*<button type="button" onClick=\{[^}]+\} className="w-full text-center[^>]+>\s*[^<]+\s*</button>',
    login_buttons,
    c
)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)