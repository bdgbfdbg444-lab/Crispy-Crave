import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 disabled:opacity-50 mb-3">
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>"""

replacement = """          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 disabled:opacity-50 mb-3">
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
          <button type="button" onClick={handleForgotPassword} className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-3">
            هل نسيت كلمة المرور؟
          </button>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added forgot password button")
else:
    print("Target not found. Doing regex instead.")
    content = re.sub(r'(\<button type="submit"[^>]+\>.*?\<\/button\>)', r'\1\n          <button type="button" onClick={handleForgotPassword} className="w-full text-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-3">هل نسيت كلمة المرور؟</button>', content, count=1, flags=re.DOTALL)
    with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
