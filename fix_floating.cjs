const fs = require('fs');

function fix(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    for (let r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

fix('src/App.jsx', [
    {
        search: "{lang === 'en' ? 'Share Your Opinion' : '???? ????'}</span>",
        replace: "{lang === 'en' ? 'Share Your Opinion' : 'شاركنا رأيك'}</span>"
    }
]);

fix('src/components/ReviewModal.jsx', [
    {
        search: "import { db } from '../firebase';",
        replace: "import { db, auth } from '../firebase';\nimport { signInAnonymously } from 'firebase/auth';"
    },
    {
        search: "        // 3. Save to Firebase using SDK (includes auth token automatically)\n        const newReviewRef = push(ref(db, 'PendingReviews'));",
        replace: "        // Ensure user is signed in anonymously before writing to DB\n        if (!auth.currentUser) {\n          await signInAnonymously(auth);\n        }\n\n        // 3. Save to Firebase using SDK (includes auth token automatically)\n        const newReviewRef = push(ref(db, 'PendingReviews'));"
    }
]);

console.log('Fixed App.jsx and ReviewModal.jsx!');
