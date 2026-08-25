import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

dashboard_old = "const DashboardView = ({ customerData, onLogout }) => {\n  return (\n    <div>"

dashboard_new = """const DashboardView = ({ customerData, onLogout }) => {
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState(customerData.Email || '');
  const [savingEmail, setSavingEmail] = React.useState(false);

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    try {
      const { db, update, ref } = await import('firebase/database');
      await update(ref(db, PublicCustomers/), {
        Email: newEmail.trim() || null
      });
      // Optionally update auth email if we had admin SDK, but we don't.
      // At least RTDB is updated.
      setEditingEmail(false);
      alert('تم تحديث البريد الإلكتروني بنجاح!');
      window.location.reload();
    } catch (err) {
      alert('حدث خطأ');
    }
    setSavingEmail(false);
  };

  return (
    <div>"""

content = content.replace(dashboard_old, dashboard_new)

address_block = """      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-gray-500"/>
          العنوان المسجل
        </h4>
        <p className="text-gray-600">{customerData.Address || 'لا يوجد عنوان مسجل'}</p>
      </div>"""

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

# Replace arabic text which might be garbled in the script, better use regex for the address block
# We will just inject it after the address block using regex

content = re.sub(r'(\<div className="bg-gray-50 rounded-xl p-4 mb-6"\>\s*\<h4.*?\<\/h4\>\s*\<p.*?\<\/p\>\s*\<\/div\>)', r'\1\n' + email_block, content, count=1, flags=re.DOTALL)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

