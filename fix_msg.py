import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_str = "يجب أن يكون رقم الهاتف 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015"
new_str = "يرجى إدخال رقم موبايل مصري صحيح"

c = c.replace(old_str, new_str)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)