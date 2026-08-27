import os

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the faulty manual classes
import re
new_content = re.sub(r'\.bg-brand-red\s*\{[^}]*\}', '', content)
new_content = re.sub(r'\.bg-brand-red:hover\s*\{[^}]*\}', '', new_content)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed CSS!")
