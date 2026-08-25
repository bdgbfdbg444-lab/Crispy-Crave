import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# We need to replace these two lines:
# <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 disabled:opacity-50 mb-3">
#   {loading ? '...' : '...'}
# </button>
# <button type="button" onClick={() => {setStep('phone'); setPassword('');}} className="w-full text-center text-sm text-gray-500 hover:text-orange-600 transition-colors">
#   ...
# </button>

# Let's find the step === 'login' block
idx = c.find("{step === 'login' && (")
if idx != -1:
    end_idx = c.find("</form>", idx)
    login_block = c[idx:end_idx]
    
    new_login_block = re.sub(
        r'<button type="submit" disabled=\{loading\}[^>]+>.*?</button>\s*<button type="button" onClick=\{[^}]+\} className="w-full text-center[^>]+>.*?</button>',
        """<button type="submit" disabled={loading} className="w-full bg-orange-600 text-white p-3 rounded hover:bg-orange-700 disabled:opacity-50 mb-3">
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
          <div className="flex justify-between items-center mt-4">
            <button type="button" onClick={() => {setStep('phone'); setPassword('');}} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              تغيير الرقم
            </button>
            <button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-orange-600 hover:text-orange-800 transition-colors">
              نسيت كلمة المرور؟
            </button>
          </div>""",
        login_block,
        flags=re.DOTALL
    )
    
    c = c[:idx] + new_login_block + c[end_idx:]

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)