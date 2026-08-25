import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

replacement = """      {step === 'register' && (
        <form onSubmit={handleRegister}>
          <div className="mb-6 text-center">
            <p className="text-gray-500 font-medium">أكمل بياناتك لإنشاء الحساب</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالكامل</label>
              <input type="text" className="w-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 p-3 rounded-lg outline-none transition-all" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أحمد محمد" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنوان <span className="text-gray-400 text-xs font-normal">(اختياري)</span></label>
              <input type="text" className="w-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 p-3 rounded-lg outline-none transition-all" value={address} onChange={e => setAddress(e.target.value)} placeholder="مثال: شارع النيل، عمارة 5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني <span className="text-gray-400 text-xs font-normal">(اختياري)</span></label>
              <input type="email" className="w-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 p-3 rounded-lg outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input type="password" className="w-full border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 p-3 rounded-lg outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-bold p-3 rounded-lg mt-6 hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md">
            {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
          </button>
          <button type="button" onClick={() => {setStep('phone'); setPassword(''); setName('');}} className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mt-4">
            الرجوع وتغيير الرقم
          </button>
        </form>
      )}"""

c = re.sub(r'\{step === \'register\' && \(.*?</form>\s*\)}', replacement, c, flags=re.DOTALL)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)