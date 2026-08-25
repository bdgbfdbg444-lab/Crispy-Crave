import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

correct_dashboard_view = """const DashboardView = ({ customerData, onLogout }) => {
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
      setEditingEmail(false);
      alert('تم تحديث البريد الإلكتروني بنجاح!');
      window.location.reload();
    } catch (err) {
      alert('حدث خطأ');
    }
    setSavingEmail(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">مرحباً، {customerData.Name}</h3>
        <button onClick={onLogout} className="flex items-center gap-1 text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
          <LogOut size={16} />
          <span className="text-sm font-medium">خروج</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <p className="text-sm text-orange-600 font-medium mb-1">نقاطك الحالية</p>
          <p className="text-3xl font-bold text-orange-600">{customerData.Points || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600 font-medium mb-1">إجمالي طلباتك</p>
          <p className="text-3xl font-bold text-green-600">{customerData.TotalOrders || 0}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-gray-500"/>
          العنوان المسجل
        </h4>
        <p className="text-gray-600">{customerData.Address || 'لا يوجد عنوان مسجل'}</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
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
      </div>
    </div>
  );
};"""

# Replace from 'const DashboardView = ' to 'export default function MyAccountPage() {'
import re
new_content = re.sub(r'const DashboardView = \(\{ customerData, onLogout \}\) =\> \{.*?\};\s*export default function MyAccountPage\(\) \{', correct_dashboard_view + '\n\nexport default function MyAccountPage() {', content, flags=re.DOTALL)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("DashboardView fixed.")
