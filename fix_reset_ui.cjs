const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const targetStr = content.substring(
    content.indexOf("{step === 'reset_options' && ("),
    content.indexOf("{step === 'register' && (")
);

const setPasswordUi = `{step === 'set_password' && (
        <form onSubmit={handleSetPasswordForExisting}>
          <div className="mb-4 text-center">
            <p className="text-text-muted">قم بتعيين كلمة مرور جديدة لحسابك</p>
          </div>
          <div className="mb-4">
            <label className="block text-text-light mb-2">كلمة المرور الجديدة</label>
            <input type="password" minLength={6} className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-text-light font-bold p-3 rounded-lg hover:bg-brand-red-dark disabled:opacity-50 transition-colors mt-2">
            {loading ? 'جاري الحفظ...' : 'حفظ وتسجيل الدخول'}
          </button>
        </form>
      )}

      `;

content = content.replace(targetStr, setPasswordUi);
fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log('Replaced reset options UI with set_password');
