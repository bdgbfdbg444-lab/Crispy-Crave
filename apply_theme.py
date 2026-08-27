import os
import re

# We will replace these values globally
REPLACEMENTS = {
    'neon-amber': 'brand-red',
    '#F5A94E': '#E63946',
    '#fce6c5': '#f8d7da', # Very light tint for hover states etc.
    'bg-neon-amber': 'bg-brand-red',
    'text-neon-amber': 'text-brand-red',
    'border-neon-amber': 'border-brand-red',
    'shadow-neon-amber': 'shadow-brand-red',
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

# Walk through src directory
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.cjs')):
            process_file(os.path.join(root, file))

# Also update tailwind.config.js
process_file('tailwind.config.js')
print("Done!")
