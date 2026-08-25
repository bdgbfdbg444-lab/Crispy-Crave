import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix className string
content = re.sub(r'className=\{w-12 h-12 rounded-full flex items-center justify-center \}', 'className={w-12 h-12 rounded-full flex items-center justify-center }', content)
content = re.sub(r'className=\{	ext-xs px-2 py-1 rounded-full mt-1 inline-block \}', 'className={	ext-xs px-2 py-1 rounded-full mt-1 inline-block }', content)
# Check for any other missing ones
with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
