const fs = require('fs');

let content = fs.readFileSync('src/components/ReviewModal.jsx', 'utf8');

// Replace the line pushing to PendingReviews with the auth check + push
content = content.replace(
    /const newReviewRef = push\(ref\(db, 'PendingReviews'\)\);/,
    "if (!auth.currentUser) {\n          await signInAnonymously(auth);\n        }\n\n        const newReviewRef = push(ref(db, 'PendingReviews'));"
);

fs.writeFileSync('src/components/ReviewModal.jsx', content, 'utf8');
console.log('Done');
