import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Currently they have: className="w-full border p-3 rounded"
# Or: className="border p-2 rounded"
content = content.replace(
    'className="w-full border p-3 rounded"',
    'className="w-full bg-black-primary border border-brand-red-dark/30 text-text-light p-3 rounded-xl focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"'
)
content = content.replace(
    'className="border p-2 rounded"',
    'className="bg-black-primary border border-brand-red-dark/30 text-text-light p-2 rounded-xl focus:outline-none focus:border-brand-red"'
)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed inputs!")
