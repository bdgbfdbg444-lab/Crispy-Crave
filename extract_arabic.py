import re

with open('src/components/ReviewModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

arabic_chars = re.compile(r'[\u0600-\u06FF]+')
for i, line in enumerate(content.splitlines()):
    if arabic_chars.search(line):
        print(f"Line {i+1}: {line.strip()}")
