import re
with open('src/pages/CheckoutPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'const { cartItems, cartTotal, clearCart, tableNumber } = useCart();\n  const navigate = useNavigate();',
    'const { cartItems, cartTotal, clearCart, tableNumber } = useCart();\n  const { customerData, userPhone } = useAuth();\n  const navigate = useNavigate();'
)

with open('src/pages/CheckoutPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)