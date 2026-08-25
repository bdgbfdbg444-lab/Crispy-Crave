const fs = require('fs');
let code = fs.readFileSync('src/components/Menu/ProductModal.jsx', 'utf8');

// Replace pricing calculation
const oldPricingRegex = /\/\/ 4\. Calculate Final Price.*?(?=\s*const totalPrice =)/s;
const newPricing = `// 4. Calculate Final Price (including free modifiers logic)
  let finalModifiersPrice = 0;
  const freeLimit = product.freeModifiersLimit || 0;
  
  let freeModifiersUsed = 0;
  const processedModifiers = selectedModifiers.map((mod) => {
    let isFree = false;
    let chargedPrice = mod.price || 0;

    if (mod.group === 'Free') {
      if (freeModifiersUsed < freeLimit) {
        isFree = true;
        chargedPrice = 0;
        freeModifiersUsed++;
      }
    }
    
    return { ...mod, chargedPrice, isFree };
  });

  finalModifiersPrice = processedModifiers.reduce((sum, mod) => sum + mod.chargedPrice, 0);
`;

code = code.replace(oldPricingRegex, newPricing);

// Replace UI display text
const oldUIRegex = /\/\/\s*Determine display price\s*let displayPrice = `\+\$\{addOn\.price\}\s*[^`]+`;\s*if \(isSelected\) \{\s*const modIndex = selectedModifiers\.findIndex\(m => m\.id === addOn\.id\);\s*if \(modIndex < freeLimit\) displayPrice = "[^"]+";\s*\} else if \(selectedModifiers\.length < freeLimit\) \{\s*displayPrice = "[^"]+";\s*\}/s;

const newUI = `// Determine display price
                        let displayPrice = \`+\${addOn.price} ج.م\`;
                        if (addOn.group === 'Free') {
                          if (isSelected) {
                            const freeMods = selectedModifiers.filter(m => m.group === 'Free');
                            const modIndex = freeMods.findIndex(m => m.id === addOn.id);
                            if (modIndex !== -1 && modIndex < freeLimit) {
                              displayPrice = "مجاناً";
                            }
                          } else {
                            const freeSelectedCount = selectedModifiers.filter(m => m.group === 'Free').length;
                            if (freeSelectedCount < freeLimit) {
                              displayPrice = "مجاناً (ضمن الحد)";
                            }
                          }
                        }`;

code = code.replace(oldUIRegex, newUI);

fs.writeFileSync('src/components/Menu/ProductModal.jsx', code, 'utf8');
console.log("Replaced");
