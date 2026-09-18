const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

// The return looks like:
// return (
//
//       <AnimatePresence>
// ...
//       </AnimatePresence>
//       <div className="\${step === "dashboard"
// ...
//     </div>
//   );

// Let's add <> after return ( and </> before );
const returnIdx = content.indexOf('return (', content.indexOf('export default function MyAccountPage'));
const endReturnIdx = content.lastIndexOf('  );\n}');

if (returnIdx !== -1 && endReturnIdx !== -1) {
    const beforeReturn = content.substring(0, returnIdx + 'return ('.length);
    const middle = content.substring(returnIdx + 'return ('.length, endReturnIdx);
    const after = content.substring(endReturnIdx);
    
    // Check if we already wrapped it (to prevent double wrap)
    if (!middle.trim().startsWith('<>')) {
        const newMiddle = '\n    <>\n' + middle + '\n    </>\n';
        fs.writeFileSync('src/pages/MyAccountPage.jsx', beforeReturn + newMiddle + after, 'utf8');
        console.log('Wrapped JSX in fragment');
    } else {
        console.log('Already wrapped');
    }
} else {
    console.log('Could not find bounds');
}
