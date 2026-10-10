import os
import re

path = 'src/components/Header.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'<Link to="/" className="flex items-center gap-2 group">.*?<Logo className="text-xl md:text-3xl" />\s*</Link>',
              r'<a href="/" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} className="flex items-center gap-2 group cursor-pointer"><Logo className="text-xl md:text-3xl" /></a>',
              text, flags=re.DOTALL)

new_nav = '''  const navLinks = [
    { name: t('home'), path: '/' },
    { name: lang === 'en' ? 'Our Story' : 'قصتنا', path: '/our-story' },
    { name: lang === 'en' ? 'Location' : 'فروعنا', path: '/#location' },
    { name: t('myAccount'), path: '/my-account' },
  ];'''
text = re.sub(r'const navLinks = \[.*?\];', new_nav, text, flags=re.DOTALL)

text = text.replace("const sections = ['our-story', 'location'];", "const sections = ['location'];")

# Also fix MobileBottomNav.jsx to go to /our-story
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

path2 = 'src/components/MobileBottomNav.jsx'
if os.path.exists(path2):
    with open(path2, 'r', encoding='utf-8') as f:
        text2 = f.read()
    text2 = re.sub(r'path: \'/#our-story\'', "path: '/our-story'", text2)
    with open(path2, 'w', encoding='utf-8') as f:
        f.write(text2)
