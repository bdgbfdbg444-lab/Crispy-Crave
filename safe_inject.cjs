const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const otpModalUI = `
      <AnimatePresence>
        {isOtpModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-black-surface border border-brand-red/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-text-light">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-light">تأكيد رقم الموبايل</h3>
                  <p className="text-sm text-text-muted">أدخل الكود المرسل إليك عبر واتساب</p>
                </div>
              </div>

              <form onSubmit={handleConfirmOtp}>
                <div className="mb-4">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="رقم كود الواتساب (6 أرقام)"
                    className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-4 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\\D/g, ''))}
                    disabled={loading}
                    autoFocus
                  />
                  {otpError && <p className="text-red-400 text-sm mt-2 text-center">{otpError}</p>}
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setIsOtpModalOpen(false)} className="flex-1 p-3 rounded-xl bg-black-primary text-text-muted hover:text-text-light transition-colors" disabled={loading}>
                    إلغاء
                  </button>
                  <button type="submit" className="flex-1 bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-3 rounded-xl transition-colors disabled:opacity-50" disabled={loading || otpInput.length !== 6}>
                    {loading ? 'جاري التحقق...' : 'تأكيد ومتابعة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

const targetUI = '  return (\n    <div className={`${step === "dashboard" ? "max-w-5xl md:max-w-6xl" : "max-w-md"} mx-auto mt-10 p-6 bg-black-surface rounded-xl shadow-lg`} dir="rtl">';

if (content.includes(targetUI)) {
    content = content.replace(targetUI, '  return (\n    <>\n' + otpModalUI + '\n    <div className={`${step === "dashboard" ? "max-w-5xl md:max-w-6xl" : "max-w-md"} mx-auto mt-10 p-6 bg-black-surface rounded-xl shadow-lg`} dir="rtl">');
    
    const lastReturnEnd = content.lastIndexOf(');');
    content = content.substring(0, lastReturnEnd) + '</>\n  );' + content.substring(lastReturnEnd + 2);
    
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Injected OTP Modal safely!");
} else {
    console.log("Could not find the target UI.");
}
