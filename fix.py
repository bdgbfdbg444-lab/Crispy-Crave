import re
with open('src/context/AuthContext.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'PublicCustomers/\$\{?.*\}?', r'PublicCustomers/${targetPhone}', c)

with open('src/context/AuthContext.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
