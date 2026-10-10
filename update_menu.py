import re

with open('src/components/Menu/MenuSection.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'return \(\s*<div className="py-24 text-center text-text-muted">\s*.*?\s*</div>\s*\);', 'return <SkeletonLoader />;', text, flags=re.DOTALL)

skeleton = """import ProductCard from './ProductCard';

const SkeletonLoader = () => (
  <div className="py-24 min-h-screen bg-black-surface">
    <div className="container mx-auto px-6">
      <div className="flex gap-4 overflow-hidden mb-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-32 bg-gray-800 rounded-full animate-pulse shrink-0"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-black-primary rounded-3xl overflow-hidden animate-pulse border border-gray-800 h-80">
            <div className="h-48 bg-gray-800 w-full"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-700 w-3/4 mb-2 rounded"></div>
              <div className="h-4 bg-gray-800 w-1/2 mb-4 rounded"></div>
              <div className="flex justify-between mt-4">
                <div className="h-6 bg-gray-700 w-16 rounded"></div>
                <div className="h-8 bg-brand-red/30 w-8 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);"""

text = text.replace("import ProductCard from './ProductCard';", skeleton)

with open('src/components/Menu/MenuSection.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
