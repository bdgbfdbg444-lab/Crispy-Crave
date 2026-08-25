import os
import re

def fix(fp, orig_sig):
    with open(fp, "r", encoding="utf-8") as f:
        content = f.read()
    # It currently looks like:
    # "  const { lang, t } = useLanguage();\n menuData, onProductClick }) {"
    # We will just replace that exact mess with the proper signature.
    
    if "MenuSection" in fp:
        content = content.replace("  const { lang, t } = useLanguage();\n menuData, onProductClick }) {", 
            "export default function MenuSection({ menuData, onProductClick }) {\n  const { lang, t } = useLanguage();")
            
    elif "ProductModal" in fp:
        content = content.replace("  const { lang, t } = useLanguage();\n product, category, menuData, isOpen, onClose }) {",
            "export default function ProductModal({ product, category, menuData, isOpen, onClose }) {\n  const { lang, t } = useLanguage();")
            
    elif "ProductCard" in fp:
        content = content.replace("  const { lang, t } = useLanguage();\n product, onClick }) {",
            "export default function ProductCard({ product, onClick }) {\n  const { lang, t } = useLanguage();")
            
    with open(fp, "w", encoding="utf-8") as f:
        f.write(content)

fix("src/components/Menu/MenuSection.jsx", "")
fix("src/components/Menu/ProductModal.jsx", "")
fix("src/components/Menu/ProductCard.jsx", "")
print("Syntax restored")

