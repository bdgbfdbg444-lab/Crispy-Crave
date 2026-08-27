import os

with open('src/components/Footer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'useLanguage' not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useLanguage } from '../context/LanguageContext';")
    content = content.replace("const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);", "const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);\n  const { lang } = useLanguage();")

with open('src/components/Footer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
