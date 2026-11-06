import { useLanguage } from '../context/LanguageContext';
import React from 'react';
import { motion } from 'framer-motion';
import { optimizeCloudinaryUrl } from '../utils/imageOptimizer';
import { Play, Heart, MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function SocialFeed({ websiteData }) {
  const { lang } = useLanguage();
  const instagramLink = websiteData?.instagramLink || "#";

  const defaultArTitle = 'عيش التجربة معنا';
  const defaultEnTitle = 'Live the Experience With Us';
  const defaultArSubtitle = 'شاركونا أجمل اللحظات وعيشوا معنا متعة المأكولات المدخنة';
  const defaultEnSubtitle = 'Follow us on Instagram and TikTok for the latest videos and offers';

  let socialData = {
    title: lang === 'en' ? defaultEnTitle : defaultArTitle,
    subtitle: lang === 'en' ? defaultEnSubtitle : defaultArSubtitle,
    items: []
  };

  if (websiteData && websiteData.socialFeedData) {
    try {
      const parsed = typeof websiteData.socialFeedData === 'string'
        ? JSON.parse(websiteData.socialFeedData)
        : websiteData.socialFeedData;
      if (parsed) {
        if (lang === 'en') {
          socialData.title = parsed.titleEn || parsed.TitleEn || parsed.title_en || defaultEnTitle;
          socialData.subtitle = parsed.subtitleEn || parsed.SubtitleEn || parsed.subtitle_en || defaultEnSubtitle;
        } else {
          const rawArTitle = parsed.titleAr || parsed.TitleAr || parsed.title_ar || parsed.title || parsed.Title;
          if (!rawArTitle || rawArTitle.trim().toLowerCase() === 'live the experience with us' || /^[\w\s.,!'-]+$/.test(rawArTitle.trim())) {
            socialData.title = defaultArTitle;
          } else {
            socialData.title = rawArTitle;
          }

          const rawArSubtitle = parsed.subtitleAr || parsed.SubtitleAr || parsed.subtitle_ar || parsed.subtitle || parsed.Subtitle;
          if (!rawArSubtitle || /^[\w\s.,!'-]+$/.test(rawArSubtitle.trim())) {
            socialData.subtitle = defaultArSubtitle;
          } else {
            socialData.subtitle = rawArSubtitle;
          }
        }
        
        if (parsed.items || parsed.Items) {
          const rawItems = parsed.items || parsed.Items;
          const validItems = rawItems.filter(i => {
            const imgUrl = i.imageUrl || i.ImageUrl;
            return imgUrl && imgUrl.trim() !== '';
          });

          if (validItems.length > 0) {
            socialData.items = validItems.map(i => ({
              id: i.id || i.Id,
              type: (i.isVideo || i.IsVideo) ? 'video' : 'image',
              url: i.imageUrl || i.ImageUrl,
              link: (i.url || i.Url || instagramLink),
              likes: i.likes || i.Likes,
              comments: i.comments || i.Comments
            }));
          }
        }
      }
    } catch (e) {
      console.error("Error parsing socialFeedData", e);
    }
  }

  // Fallback items if none are provided
  const feedItems = socialData.items.length > 0 ? socialData.items : [
    {
      id: 1,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1544025162-811114cd69cc?auto=format&fit=crop&q=80&w=800',
      link: instagramLink,
      likes: '1.2k',
      comments: '143'
    },
    {
      id: 2,
      type: 'video',
      url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=800',
      link: instagramLink,
      likes: '856',
      comments: '54'
    },
    {
      id: 3,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800',
      link: instagramLink,
      likes: '2.4k',
      comments: '312'
    },
    {
      id: 4,
      type: 'video',
      url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=800',
      link: instagramLink,
      likes: '3.1k',
      comments: '402'
    }
  ];

  return (
    <section id="social" className="py-24 bg-black-primary relative overflow-hidden border-t border-gray-800">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        <div className="mb-12 text-center md:text-start">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-black text-text-light mb-2"
          >
            {socialData.title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-text-muted"
          >
            {socialData.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {feedItems.map((item, index) => (
            <motion.a
              key={item.id}
              href={item.link || instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer bg-gray-900 block"
            >
              <img 
                src={optimizeCloudinaryUrl(item.url, { width: 450, quality: 'auto' })} 
                alt="Social Feed Post" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                loading="lazy"
                decoding="async"
                width={400}
                height={500}
              />
              
              {/* Video Icon overlay for video types */}
              {item.type === 'video' && (
                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-sm z-10">
                  <Play size={16} className="text-text-light fill-white" />
                </div>
              )}

              {/* Hover Overlay with Likes/Comments */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 z-20">
                <div className="flex flex-col items-center text-text-light">
                  <Heart size={28} className="mb-2 fill-current" />
                  <span className="font-bold">{item.likes}</span>
                </div>
                <div className="flex flex-col items-center text-text-light">
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
