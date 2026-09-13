const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = "import { ref, get, set, update } from 'firebase/database';";
const imports = `import { ref, get, set, update } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';`;

if (content.includes(target)) {
    content = content.replace(target, imports);
    fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
    console.log("Added missing imports!");
} else {
    console.log("Could not find import target.");
}
