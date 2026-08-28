import re

with open('src/components/Menu/ProductModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_ingredient = """{product.ingredients.map((ingredient, idx) => (
                    <span key={idx} className="bg-black-primary text-text-light px-3 py-1 rounded-full text-xs font-semibold border border-brand-red-dark/30">
                      {ingredient}
                    </span>
                  ))}"""

new_ingredient = """{product.ingredients.map((ingredient, idx) => (
                    <span key={idx} className="bg-black-primary text-text-light px-3 py-1 rounded-full text-xs font-semibold border border-brand-red-dark/30">
                      {typeof ingredient === 'object' ? (lang === 'en' && ingredient.nameEn ? ingredient.nameEn : ingredient.name) : ingredient}
                    </span>
                  ))}"""

content = content.replace(old_ingredient, new_ingredient)

with open('src/components/Menu/ProductModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
