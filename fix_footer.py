import os
import re

with open('src/components/Footer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hover colors for social media
content = content.replace('hover:bg-brand-red', 'hover:bg-[#1877F2]', 1) # Facebook
content = content.replace('hover:bg-brand-red', 'hover:bg-[#E4405F]', 1) # Instagram
content = content.replace('hover:bg-brand-red', 'hover:bg-[#FE2C55]', 1) # TikTok

# Translate Footer review button and fix colors
# Currently: ?????? ????
# Let's replace it with {lang === 'en' ? 'Share Your Opinion' : '?????? ????'}
content = content.replace('?????? ????', "{lang === 'en' ? 'Share Your Opinion' : '?????? ????'}")

with open('src/components/Footer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Footer!")
