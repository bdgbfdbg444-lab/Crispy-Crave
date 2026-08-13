import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function SocialFeed({ websiteData }) {
  const instagramLink = websiteData?.marketing?.instagramLink || "#";

  // Dummy social feed items (in a real app, these might come from an API or Firebase)
  const feedItems = [
    {
      id: 1,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1544025162-811114cd69cc?auto=format&fit=crop&q=80&w=800',
      likes: '1.2k',
      comments: '143'
    },
    {
      id: 2,
      type: 'video',
      url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=800',
      likes: '856',
      comments: '54'
    },
    {
      id: 3,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800',
      likes: '2.4k',
      comments: '312'
    },
    {
      id: 4,
      type: 'video',
      url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=800',
      likes: '3.1k',
      comments: '402'
    }
  ];

  return (
    <section className="py-24 bg-dark relative overflow-hidden border-t border-gray-800">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-right">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-display font-black text-white mb-2"
            >
              عيش التجربة معنا
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              تابعنا على انستجرام وتيك توك لأحدث الفيديوهات والعروض
            </motion.p>
          </div>

          <motion.a 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[2px] rounded-full group hover:scale-105 transition-transform"
          >
            <div className="bg-dark px-6 py-3 rounded-full flex items-center gap-2 group-hover:bg-transparent transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              <span className="font-bold text-white">@SmokeAndSmash</span>
            </div>
          </motion.a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {feedItems.map((item, index) => (
            <motion.a
              key={item.id}
              href={instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer bg-gray-900 block"
            >
              <img 
                src={item.url} 
                alt="Social Feed Post" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
              />
              
              {/* Video Icon overlay for video types */}
              {item.type === 'video' && (
                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-sm z-10">
                  <Play size={16} className="text-white fill-white" />
                </div>
              )}

              {/* Hover Overlay with Likes/Comments */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 z-20">
                <div className="flex flex-col items-center text-white">
                  <Heart size={28} className="mb-2 fill-current" />
                  <span className="font-bold">{item.likes}</span>
                </div>
                <div className="flex flex-col items-center text-white">
                  <MessageCircle size={28} className="mb-2 fill-current" />
                  <span className="font-bold">{item.comments}</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
