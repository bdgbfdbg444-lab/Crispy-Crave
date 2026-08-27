import re

header_path = 'src/components/Header.jsx'
with open(header_path, 'r', encoding='utf-8') as f:
    header = f.read()

header = header.replace("import { ShoppingBag, Flame } from 'lucide-react';", "import { ShoppingBag, Flame } from 'lucide-react';\nimport Logo from './Logo';")

logo_old = """<span className=\"font-display font-black text-xl md:text-2xl tracking-widest uppercase nav-logo-hover\">
                {APP_CONFIG.restaurantName}
              </span>"""
logo_new = """<Logo className=\"text-xl md:text-3xl\" />"""

header = header.replace(logo_old, logo_new)
header = header.replace('<Flame size={24} className=\"icon-nav-hover group-hover:scale-110 transition-transform\" />', '')

with open(header_path, 'w', encoding='utf-8') as f:
    f.write(header)

hero_path = 'src/components/Hero.jsx'
with open(hero_path, 'r', encoding='utf-8') as f:
    hero = f.read()

if 'import Logo from' not in hero:
    hero = hero.replace("import { ChevronDown, Utensils } from 'lucide-react';", "import { ChevronDown, Utensils } from 'lucide-react';\nimport Logo from './Logo';")

hero = re.sub(
    r'<h1 className="[^"]+">[\s\S]*?</h1>',
    '<div className="mb-6 flex justify-center w-full z-10 scale-90 md:scale-100"><Logo className="text-[12vw] sm:text-7xl md:text-8xl lg:text-[9rem] drop-shadow-[0_0_20px_rgba(230,57,70,0.4)]" /></div>',
    hero
)
with open(hero_path, 'w', encoding='utf-8') as f:
    f.write(hero)

print('Patched Logo successfully')
