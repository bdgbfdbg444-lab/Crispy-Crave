import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace orange colors with brand-red
    content = content.replace('text-orange-600', 'text-brand-red')
    content = content.replace('bg-orange-500', 'bg-brand-red')
    content = content.replace('border-orange-600', 'border-brand-red')
    
    content = content.replace('bg-orange-50', 'bg-brand-red/10')
    content = content.replace('border-orange-100', 'border-brand-red/20')
    content = content.replace('text-orange-800', 'text-brand-red')
    content = content.replace('text-orange-500', 'text-brand-red')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/pages/CheckoutPage.jsx')
process_file('src/pages/TrackOrderPage.jsx')

print("Fixed orange in pages!")
