const fs = require('fs');

function fixSyntax(fp) {
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(
        "import React\nimport { useLanguage } from '../context/LanguageContext';, { useState } from 'react';",
        "import React, { useState } from 'react';\nimport { useLanguage } from '../context/LanguageContext';"
    );
    content = content.replace(
        "import React\nimport { useLanguage } from '../context/LanguageContext';, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport { useLanguage } from '../context/LanguageContext';"
    );
    // ProductCard has just import React from 'react';
    content = content.replace(
        "import React\nimport { useLanguage } from '../context/LanguageContext'; from 'react';",
        "import React from 'react';\nimport { useLanguage } from '../context/LanguageContext';"
    );
    fs.writeFileSync(fp, content, 'utf8');
}

fixSyntax('src/components/Menu/MenuSection.jsx');
fixSyntax('src/components/Menu/ProductModal.jsx');
fixSyntax('src/components/Menu/ProductCard.jsx');

console.log('Syntax fixed');
