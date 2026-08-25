import re
with open('src/context/AuthContext.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# find refreshCustomerData up to loading
pattern = r"const refreshCustomerData = async.*?};\n"
replacement = """const refreshCustomerData = async (phoneToFetch = null) => {
    const targetPhone = phoneToFetch || userPhone;
    if (targetPhone) {
      setUserPhone(targetPhone);
      const custRef = ref(db, `PublicCustomers/${targetPhone}`);
      const custSnap = await get(custRef);
      if (custSnap.exists()) {
        setCustomerData(custSnap.val());
      }
    }
  };\n"""

c = re.sub(pattern, replacement, c, flags=re.DOTALL)

with open('src/context/AuthContext.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
