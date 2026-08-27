import os
import re

REPLACEMENTS = {
    'wood-dark': 'brand-red-dark',
    '#7A4620': '#9A1F28',
    '#7A4526': '#9A1F28'
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in REPLACEMENTS.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.cjs')):
            process_file(os.path.join(root, file))

process_file('tailwind.config.js')
print("Done!")
