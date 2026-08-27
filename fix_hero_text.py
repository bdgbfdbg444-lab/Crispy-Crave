import re

with open('src/components/Hero.jsx', 'r', encoding='utf-8') as f:
    hero = f.read()

# Replace the title motion.h1 block
hero = re.sub(
    r'<motion\.h1[^>]*>[\s\S]*?</motion\.h1>',
    '<div className="mb-6 flex justify-center w-full z-10 scale-90 md:scale-100"><Logo className="text-[12vw] sm:text-7xl md:text-8xl lg:text-[9rem] drop-shadow-[0_0_20px_rgba(230,57,70,0.4)]" /></div>',
    hero
)

# Fix the button text by replacing ORDER NOW when it appears after the ternary
hero = re.sub(r"\}\s*ORDER NOW", "}", hero)

with open('src/components/Hero.jsx', 'w', encoding='utf-8') as f:
    f.write(hero)
print("Hero fixed!")
