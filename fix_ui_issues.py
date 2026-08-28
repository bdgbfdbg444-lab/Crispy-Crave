import re

# 1. Fix Logo RTL issue
with open('src/components/Logo.jsx', 'r', encoding='utf-8') as f:
    logo_content = f.read()

# Add dir="ltr" to the main div
if 'dir="ltr"' not in logo_content:
    logo_content = logo_content.replace('<div \n      className={`flex', '<div \n      dir="ltr"\n      className={`flex')
with open('src/components/Logo.jsx', 'w', encoding='utf-8') as f:
    f.write(logo_content)

# 2. Fix ProductModal string interpolation
with open('src/components/Menu/ProductModal.jsx', 'r', encoding='utf-8') as f:
    modal_content = f.read()

# Replace the broken template literal
modal_content = re.sub(r"`\+\$\{addOn\.price\}\s*\{lang === 'en' \? 'EGP' : [^`]+`", r"`+${addOn.price} ${lang === 'en' ? 'EGP' : 'ج.م'}`", modal_content)

with open('src/components/Menu/ProductModal.jsx', 'w', encoding='utf-8') as f:
    f.write(modal_content)
