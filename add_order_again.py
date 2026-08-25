import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

imports = """import { Package, MapPin, Edit3, LogOut, ChevronLeft, Clock, ShoppingBag, RotateCcw } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';
import { fetchMenuData } from '../services/firebaseService';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';"""

c = re.sub(
    r"import \{ Package, MapPin, Edit3, LogOut, ChevronLeft \} from 'lucide-react';\s*import \{ APP_CONFIG \} from '\.\./config/appConfig';\s*import \{ fetchMenuData \} from '\.\./services/firebaseService';",
    imports,
    c
)

old_dashboard = """const DashboardView = ({ customerData, onLogout }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">"""

new_dashboard = """const DashboardView = ({ customerData, onLogout }) => {
  const [pastOrders, setPastOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch(`${APP_CONFIG.firebaseDbUrl}Orders.json`);
        const data = await res.json();
        if (data) {
          const userOrders = Object.entries(data)
            .filter(([id, order]) => order.customerPhone === customerData.Phone)
            .map(([id, order]) => ({ id, ...order }))
            .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
          setPastOrders(userOrders.slice(0, 5)); // Last 5 orders
        }
      } catch (err) {
        console.error("Error loading orders", err);
      }
      setLoadingOrders(false);
    };
    loadOrders();
  }, [customerData.Phone]);

  const handleOrderAgain = (order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        addToCart(item.product, item.quantity);
      });
      // Optionally navigate to cart or menu
      navigate('/cart');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">"""

c = c.replace(old_dashboard, new_dashboard)

# Now, add the Orders section below the Address section
old_address = """      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-gray-500"/>
          العنوان المسجل
        </h4>
        <p className="text-gray-600">{customerData.Address || 'لا يوجد عنوان مسجل'}</p>
      </div>
    </div>
  );
};"""

new_address = """      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-gray-500"/>
          العنوان المسجل
        </h4>
        <p className="text-gray-600">{customerData.Address || 'لا يوجد عنوان مسجل'}</p>
      </div>

      <div>
        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingBag size={20} className="text-orange-600"/>
          طلباتي السابقة
        </h4>
        
        {loadingOrders ? (
          <div className="text-center py-6 text-gray-500">جاري تحميل الطلبات...</div>
        ) : pastOrders.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
            لا توجد طلبات سابقة حتى الآن.
          </div>
        ) : (
          <div className="space-y-4">
            {pastOrders.map(order => (
              <div key={order.id} className="border border-gray-100 bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Clock size={14} />
                      {new Date(order.orderDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="font-bold text-gray-800">
                      الإجمالي: {order.finalTotal || order.totalAmount} ج.م
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOrderAgain(order)}
                    className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors text-sm font-bold"
                  >
                    <RotateCcw size={14} />
                    <span>اطلب مجدداً</span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  {order.items?.map(i => `${i.quantity}x ${i.product.name}`).join(' ، ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};"""

c = c.replace(old_address, new_address)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)