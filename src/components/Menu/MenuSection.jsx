import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import ProductCard from './ProductCard';

export default function MenuSection({ menuData, onProductClick }) {
  if (!menuData || !menuData.categories) {
    return (
      <div className="py-24 text-center text-gray-500">
        جاري تحميل المنيو...
      </div>
    );
  }

  const categories = Object.values(menuData.categories).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract products for the active category, or all products if searching
  let productsToDisplay = [];
  if (searchQuery.trim() !== '') {
    categories.forEach(cat => {
      if (cat.products) {
        Object.values(cat.products).forEach(prod => {
          if (prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
            productsToDisplay.push(prod);
          }
        });
      }
    });
  } else {
    const activeCatData = categories.find(c => c.id === activeCategory);
    if (activeCatData && activeCatData.products) {
      productsToDisplay = Object.values(activeCatData.products).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
  }

  return (
    <section id="menu" className="py-24 bg-white relative min-h-screen">
      <div className="container mx-auto px-6">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h2 className="text-4xl font-display font-black text-dark uppercase">
            المنيو
          </h2>
          
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="ابحث عن وجبتك المفضلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-light border border-gray-200 rounded-full py-3 px-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-dark placeholder-gray-400"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        {/* Category Tabs - Sticky on Mobile */}
        {searchQuery.trim() === '' && (
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-4 pb-4 mb-8 -mx-6 px-6 md:mx-0 md:px-0 border-b border-gray-100 flex overflow-x-auto hide-scrollbar gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                  activeCategory === category.id 
                    ? 'bg-dark text-white shadow-lg' 
                    : 'bg-light text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Search Results Title */}
        {searchQuery.trim() !== '' && (
          <div className="mb-8 font-bold text-gray-600">
            نتائج البحث عن: <span className="text-primary">{searchQuery}</span>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {productsToDisplay.length > 0 ? (
              productsToDisplay.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => onProductClick(product, categories.find(c => c.products && c.products[product.id]))} 
                />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-12 text-center text-gray-500 text-lg"
              >
                لا توجد منتجات متطابقة.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
