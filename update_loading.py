import re

new_content = """import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-black-primary flex flex-col items-center justify-center overflow-hidden">
      
      {/* Dynamic Background Glow */}
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-64 h-64 bg-brand-red/20 rounded-full blur-[100px]"
      />

      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 mb-8"
      >
        <Logo className="text-5xl md:text-7xl drop-shadow-[0_0_15px_rgba(230,57,70,0.6)]" />
      </motion.div>
      
      {/* Loading Progress Bar */}
      <div className="w-48 md:w-64 h-1 bg-black-surface rounded-full overflow-hidden relative z-10">
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-brand-red to-transparent rounded-full"
        />
      </div>
    </div>
  );
}
"""

with open('src/components/LoadingScreen.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated LoadingScreen.jsx!")
