import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_login = False
new_lines = []
for i, line in enumerate(lines):
    if "{step === 'login' && (" in line:
        in_login = True
    if in_login and '<button type="submit" disabled={loading}' in line:
        # replace from here until </form>
        pass
    
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's just find step === 'login' block and replace the whole form
import ast
idx = content.find("{step === 'login' && (")
if idx != -1:
    end_idx = content.find("</form>", idx)
    login_block = content[idx:end_idx]
    
    # Just replace everything inside the form after the password input
    # Find password input end
    pwd_end = login_block.find('onChange={e => setPassword(e.target.value)} />')
    if pwd_end != -1:
        pwd_end_full = login_block.find('</div>', pwd_end) + 6
        
        new_buttons = """
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-bold p-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md mt-4">
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
          <div className="flex justify-between items-center mt-4 px-1">
            <button type="button" onClick={() => {setStep('phone'); setPassword('');}} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              الرجوع وتغيير الرقم
            </button>
            <button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-orange-600 hover:text-orange-800 transition-colors">
              نسيت كلمة المرور؟
            </button>
          </div>
"""
        new_login = login_block[:pwd_end_full] + new_buttons
        content = content[:idx] + new_login + content[end_idx:]

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)