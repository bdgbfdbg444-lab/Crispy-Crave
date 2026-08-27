import React, { useState } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { MessageCircle, Star } from 'lucide-react';
import ReviewModal from './ReviewModal';

export default function Footer({ websiteData }) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Use data from settings root level
  const facebookLink = websiteData?.facebookLink || "#";
  const instagramLink = websiteData?.instagramLink || "#";
  const tikTokLink = websiteData?.tikTokLink || "#";
  const whatsAppLink = websiteData?.whatsAppLink || "#";

  return (
    <footer className="bg-black-primary text-text-light pt-16 pb-24 md:pb-12 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start text-center md:text-right gap-2">
            <div className="text-3xl font-display font-black tracking-widest uppercase text-brand-red mb-2">
              {APP_CONFIG.restaurantName}
            </div>
            <p className="text-text-muted text-sm">
              &copy; {new Date().getFullYear()} جميع الحقوق محفوظة. مطعم جمر وحطب.
            </p>
            <p className="text-text-light/50 text-xs font-bold tracking-wider mt-1">
              CRAFTED BRISKET & SMASH BURGERS
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 hover:bg-[#1877F2] text-text-muted hover:text-text-light rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 hover:bg-[#E4405F] text-text-muted hover:text-text-light rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              
              <a href={tikTokLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 hover:bg-[#FE2C55] text-text-muted hover:text-text-light rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
              </a>
              
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 hover:bg-green-600 text-text-muted hover:text-text-light rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110">
                <MessageCircle size={20} />
              </a>
            </div>
            
            {/* Review Button */}
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-brand-red text-text-light py-2 px-6 rounded-full text-sm font-bold transition-colors border border-gray-700 hover:border-brand-red"
            >
              <Star size={16} className="fill-current" />
              شاركنا رأيك
            </button>
          </div>
          
        </div>
      </div>
      
      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
      />
    </footer>
  );
}
