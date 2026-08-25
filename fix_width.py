import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'className={`${step === "dashboard" ? "max-w-2xl" : "max-w-md bg-white rounded-xl shadow-lg"} mx-auto mt-10 p-6`}',
    'className={`${(step === "dashboard" || step === "register") ? "max-w-2xl" : "max-w-md"} bg-white rounded-xl shadow-lg mx-auto mt-10 p-6`}'
)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)