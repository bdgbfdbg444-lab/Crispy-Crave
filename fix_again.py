import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("PublicCustomers/)", "`PublicCustomers/${customerData.Phone}`)");
content = content.replace("PublicCustomers/, {", "`PublicCustomers/${customerData.Phone}`), {");
# Wait, let's just write a plain python script without any string variables from PS

