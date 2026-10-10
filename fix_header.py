import os

path = 'src/components/Header.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("path: '/my-account'", "path: '/account'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
