const fs = require('fs');

function fix(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    for (let r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

fix('src/components/ReviewModal.jsx', [
    {
        search: "        // 3. Save to Firebase\n        // 3. Save to Firebase using SDK (includes auth token automatically)\n        const newReviewRef = push(ref(db, 'PendingReviews'));",
        replace: "        // Ensure user is signed in anonymously before writing to DB\n        if (!auth.currentUser) {\n          await signInAnonymously(auth);\n        }\n\n        // 3. Save to Firebase\n        const newReviewRef = push(ref(db, 'PendingReviews'));"
    }
]);

console.log('Fixed ReviewModal DB auth!');
