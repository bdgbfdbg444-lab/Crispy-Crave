import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple replaces
    new_content = content.replace('bg-wood', 'bg-brand-red')
    new_content = new_content.replace('border-wood', 'border-brand-red')
    new_content = new_content.replace('text-wood', 'text-brand-red')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.cjs')):
            process_file(os.path.join(root, file))

print("Done!")
