import os

path = 'src/pages/OurStoryPage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import Navigation from '../components/Navigation';", "import Header from '../components/Header';")
text = text.replace("<Navigation ", "<Header ")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
