import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('bg-wood hover:bg-brand-red-dark', 'bg-brand-red hover:bg-brand-red-dark')
    new_content = new_content.replace('bg-wood text-text-light font-bold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-brand-red-dark', 'bg-brand-red text-text-light font-bold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-brand-red-dark')
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.cjs')):
            process_file(os.path.join(root, file))

print("Done!")
