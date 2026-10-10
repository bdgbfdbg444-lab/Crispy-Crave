import os

path = 'src/components/Header.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the nav links
old_nav_links = """  const navLinks = [
    { name: t('home'), path: '/' },
    { name: lang === 'en' ? 'Our Story' : 'U,OOU+O ', path: '/#our-story' },
    { name: lang === 'en' ? 'Location' : 'U?OU^O1U+O ', path: '/#location' },
    { name: t('myAccount'), path: '/account' },
  ];"""

new_nav_links = """  const navLinks = [
    { name: t('home'), path: '/' },
    { name: lang === 'en' ? 'Our Story' : 'قصتنا', path: '/our-story' },
    { name: lang === 'en' ? 'Location' : 'فروعنا', path: '/#location' },
    { name: t('myAccount'), path: '/my-account' },
  ];"""

text = text.replace(old_nav_links, new_nav_links)

# Fix the logo
old_logo = """            <Link to="/" className="flex items-center gap-2 group">
              
              <Logo className="text-xl md:text-3xl" />
            </Link>"""

new_logo = """            <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }} className="flex items-center gap-2 group cursor-pointer">
              <Logo className="text-xl md:text-3xl" />
            </a>"""

text = text.replace(old_logo, new_logo)

# Also fix the sections array in handleScroll to not include our-story anymore
text = text.replace("const sections = ['our-story', 'location'];", "const sections = ['location'];")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
