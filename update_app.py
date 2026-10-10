import os

path = 'src/App.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "const ProtectionPage = React.lazy(() => import('./pages/ProtectionPage'));",
    "const ProtectionPage = React.lazy(() => import('./pages/ProtectionPage'));\nconst OurStoryPage = React.lazy(() => import('./pages/OurStoryPage'));"
)

text = text.replace(
    '<Route path="/account"',
    '<Route path="/our-story" element={<PageTransition><Suspense fallback={<LoadingScreen />}><OurStoryPage websiteData={websiteData} /></Suspense></PageTransition>} />\n        <Route path="/account"'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
