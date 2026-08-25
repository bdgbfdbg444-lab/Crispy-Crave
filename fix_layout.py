import re
with open('src/pages/MyAccountPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Current div:
# <div className={`${(step === "dashboard" || step === "register") ? "max-w-2xl" : "max-w-md"} bg-white rounded-xl shadow-lg mx-auto mt-10 p-6`} dir="rtl">

old_div = r'<div className=\{`\$\{\(step === "dashboard" \|\| step === "register"\) \? "max-w-2xl" : "max-w-md"\} bg-white rounded-xl shadow-lg mx-auto mt-10 p-6`\} dir="rtl">'
new_div = """<div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className={`${(step === "dashboard" || step === "register") ? "max-w-2xl" : "max-w-md"} w-full bg-white rounded-2xl shadow-xl p-8`} dir="rtl">"""

c = re.sub(old_div, new_div, c)

# We need to add a closing </div> before the final );
# The file ends with:
#       )}
#     </div>
#   );
# }

c = re.sub(r'      \)}\n    </div>\n  \);\n}', '      )}\n      </div>\n    </div>\n  );\n}', c)

with open('src/pages/MyAccountPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)