import os

filepath = 'src/components/Menu/ProductModal.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the template literal interpolation
content = content.replace("let displayPrice = + {lang === 'en' ? 'EGP' : '?.?'};", "let displayPrice = + ;")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed displayPrice!")
