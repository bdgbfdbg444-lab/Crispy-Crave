import re
with open('src/context/AuthContext.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("const custRef = ref(db, `PublicCustomers/${targetPhone}\n            const custSnap", "const custRef = ref(db, `PublicCustomers/${phone}`);\n            const custSnap")

with open('src/context/AuthContext.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
