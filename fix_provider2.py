import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix the duplicate providers
c = re.sub(r"Provider: 'google',\s*Provider: 'password',", "Provider: 'password',", c)

# For handleLinkPhone, we want it to be 'google'
# Let's find handleLinkPhone block
import ast

def fix_link_phone(text):
    idx = text.find('const handleLinkPhone')
    if idx == -1: return text
    
    # replace password with google in the handleLinkPhone function only
    part1 = text[:idx]
    part2 = text[idx:]
    part2 = part2.replace("Provider: 'password',", "Provider: 'google',")
    return part1 + part2

c = fix_link_phone(c)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)