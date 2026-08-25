import re

with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix layout class
content = content.replace(
    'className={${step === "dashboard" ? "max-w-2xl" : "max-w-md bg-white rounded-xl shadow-lg"} mx-auto mt-10 \np-6}',
    'className={${step === "dashboard" ? "max-w-2xl" : "max-w-md"} mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg}'
)
content = content.replace(
    'className={${step === "dashboard" ? "max-w-2xl" : "max-w-md bg-white rounded-xl shadow-lg"} mx-auto mt-10 p-6}',
    'className={${step === "dashboard" ? "max-w-2xl" : "max-w-md"} mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg}'
)
# Just to be safe with newlines:
content = re.sub(
    r'className=\\$\{step === "dashboard" \? "max-w-2xl" : "max-w-md bg-white rounded-xl shadow-lg"\} mx-auto mt-10\s*p-6\\}',
    r'className={${step === "dashboard" ? "max-w-2xl" : "max-w-md"} mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg}',
    content
)

# Fix duplicated email block
# We'll just find the first occurrence of '<div className="bg-gray-50 rounded-xl p-4 mb-6">\s*<h4 className="font-bold text-gray-700 mb-3 flex items-center justify-between">'
# and remove the second one.
email_block_regex = r'(\<div className="bg-gray-50 rounded-xl p-4 mb-6"\>\s*\<h4 className="font-bold text-gray-700 mb-3 flex items-center justify-between"\>.*?\<\/div\>)'

matches = list(re.finditer(email_block_regex, content, re.DOTALL))
if len(matches) > 1:
    # Remove the second match
    m2 = matches[1]
    content = content[:m2.start()] + content[m2.end():]
    print("Removed duplicated email block")

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

