import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

email_block = """      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-700 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📧</span>
            البريد الإلكتروني
          </div>
          {!editingEmail && (
            <button onClick={() => setEditingEmail(true)} className="text-sm text-blue-600 flex items-center gap-1">
              <Edit3 size={14} /> تعديل
            </button>
          )}
        </h4>
        
        {editingEmail ? (
          <div className="flex flex-col gap-2">
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="border p-2 rounded" placeholder="أدخل البريد الإلكتروني" />
            <div className="flex gap-2">
              <button onClick={handleSaveEmail} disabled={savingEmail} className="bg-orange-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
                {savingEmail ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button onClick={() => {setEditingEmail(false); setNewEmail(customerData.Email || '');}} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">{customerData.Email || 'لا يوجد بريد مسجل'}</p>
        )}
      </div>"""

# inject before <div className="mt-8"> if it exists, or just before last </div> in DashboardView
# Let's just find the exact block for address
address_regex = r'(\<div className="bg-gray-50 rounded-xl p-4 mb-6"\>.*?MapPin.*?<\/div\>)'
if re.search(address_regex, content, re.DOTALL):
    content = re.sub(address_regex, r'\1\n' + email_block, content, count=1, flags=re.DOTALL)
    print("Injected email block")

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
