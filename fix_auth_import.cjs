const fs = require('fs');
let content = fs.readFileSync('src/pages/MyAccountPage.jsx', 'utf8');

const target = "import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut } from 'firebase/auth';";
const replacement = "import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut, signInAnonymously } from 'firebase/auth';";

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/MyAccountPage.jsx', content, 'utf8');
console.log("Added signInAnonymously import!");
