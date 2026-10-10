import os
import base64

def write_b64(filepath, b64_str):
    content = base64.b64decode(b64_str).decode('utf-8')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# We will just fetch the files, fix the '?' manually using python string replacements.
def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix OrderCta.jsx
replace_in_file('src/components/OrderCta.jsx', {
    "'???? ????'": "'اطلب الآن'",
    "???? ???? ???????": "اطلب الآن واستمتع",
    "?????? ?? ???????": "بالطعم الأصلي للبريسكيت"
})

# Fix PressQuote.jsx
replace_in_file('src/components/PressQuote.jsx', {
    "'?????'": "'مذهل'",
    "'????? ??? ????'": "'أفضل برجر في المدينة'",
    "'?????? ??????'": "'المذاق الأصلي'"
})

# Fix OurStory.jsx
replace_in_file('src/components/OurStory.jsx', {
    "'????? ??????'": "'قصتنا وشغفنا'",
    "'???? ????? ????'": "'ساعة تدخين بطيء'",
    "'??? ?????'": "'حطب طبيعي'"
})

# Fix Newsletter.jsx
replace_in_file('src/components/Newsletter.jsx', {
    "'???? ????? ?????????'": "'أدخل بريدك الإلكتروني'",
    "'???? ???????!'": "'شكراً لاشتراكك!'"
})
