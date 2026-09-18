const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = `{step === 'phone' && (
        <div>
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-4">
              <label className="block text-text-light mb-2">رقم الموبايل</label>
              <input type="tel" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light p-3 rounded hover:bg-brand-red-dark disabled:opacity-50">
              {loading ? 'جاري التحقق...' : 'متابعة'}
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-px bg-black-surface flex-1"></div>
            <span className="text-text-muted text-sm">أو</span>
            <div className="h-px bg-black-surface flex-1"></div>
          </div>
          
          <button onClick={handleGoogleLogin} type="button" className="mt-6 w-full flex items-center justify-center gap-3 bg-black-surface border border-brand-red-dark/50 text-text-light p-3 rounded hover:bg-black-primary transition-colors">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            تسجيل الدخول باستخدام Google
          </button>
        </div>
      )}`;

const replacement = `{step === 'phone' && (
        <div>
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-4">
              <label className="block text-text-light mb-2">رقم الموبايل</label>
              <input type="tel" className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" />
            </div>
            <p className="text-xs text-text-muted mb-2 text-center">سيوصلك رمز تأكيد فوري عبر واتساب للتحقق من أمان حسابك.</p>
            <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light font-bold p-3 rounded-xl hover:bg-brand-red-dark disabled:opacity-50 shadow-lg shadow-brand-red/20 mb-3">
              {loading ? 'جاري التحقق...' : 'متابعة عبر كود واتساب (سريع وآمن)'}
            </button>
            <button type="button" onClick={() => setStep('login')} className="w-full text-center text-sm text-blue-400 hover:text-blue-800 transition-colors font-medium">
              أو تسجيل الدخول بكلمة المرور مباشرة 🔑
            </button>
          </form>
        </div>
      )}`;

// We'll use string index replacement since exact whitespace matching in regex can fail easily.
const startIndex = content.indexOf("{step === 'phone'");
const endIndex = content.indexOf("{step === 'login'");

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    const finalStr = before + replacement + "\n\n      " + after;
    fs.writeFileSync('src/pages/MyAccountPage.jsx', finalStr, 'utf8');
    console.log('Fixed phone step UI!');
} else {
    console.log('Could not find boundaries');
}
