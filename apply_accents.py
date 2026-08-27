import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the section divider lines
    new_content = content.replace('h-1 bg-wood', 'h-1 bg-brand-red')
    
    # Replace other known badges / elements that shouldn't be wood
    new_content = new_content.replace('bg-wood text-text-light font-bold py-1 px-3', 'bg-brand-red text-text-light font-bold py-1 px-3')
    
    # Product card badge
    new_content = new_content.replace('bg-wood text-text-light text-xs font-bold px-2 py-1', 'bg-brand-red text-text-light text-xs font-bold px-2 py-1')

    # Product card add to cart hover
    new_content = new_content.replace('hover:bg-wood hover:text-text-light', 'hover:bg-brand-red hover:text-text-light')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css', '.cjs')):
            process_file(os.path.join(root, file))

print("Done!")
