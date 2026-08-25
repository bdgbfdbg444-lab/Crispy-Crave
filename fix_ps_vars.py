import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("PublicCustomers/)", "PublicCustomers/)");
content = content.replace("PublicCustomers/, {", "PublicCustomers/), {");

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
