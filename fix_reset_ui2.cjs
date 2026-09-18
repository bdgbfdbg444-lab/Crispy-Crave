const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const resetUiTarget = /\{step === 'reset_options' && \([\s\S]*?OOU^O1\n\s*<\/button>\n\s*<\/form>\n\s*\)\}\n/m;
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

// use precise string matching
const startStr = "{step === 'reset_options' && (";
const endStr = "{step === 'register' && (";
const idx1 = content.indexOf(startStr);
const idx2 = content.indexOf(endStr);
if (idx1 !== -1 && idx2 !== -1) {
    const toReplace = content.substring(idx1, idx2);
    content = content.replace(toReplace, setPasswordUi);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Replaced reset options UI with set_password UI");
} else {
    console.log("Could not find reset options UI");
}
