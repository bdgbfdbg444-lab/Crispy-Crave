import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-black-primary flex flex-col items-center justify-center">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-neon-amber mb-6"
      >
        <Flame size={64} className="fill-primary" />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-display font-black text-text-light tracking-widest uppercase mb-4 text-center px-4"
      >
        {APP_CONFIG.restaurantName}
      </motion.h1>
      
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
      />
    </div>
  );
}
