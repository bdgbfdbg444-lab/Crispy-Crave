import React from 'react';

export default function Logo({ className = '' }) {
  return (
    <div 
      className={`flex items-center select-none ${className}`} 
      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
    >
      {/* "THE" Rotated - using flex column to stack letters if that's what was meant, 
          or rotated 90deg. A -rotate-90 transforms the text to read from bottom to top. 
          Usually logos have it reading top to bottom, which is rotate-90 or stacked.
          I'll use -rotate-90 which is standard for left-aligned vertical text. */}
      <span className="text-white font-bold leading-none -rotate-90 origin-center inline-block mr-1" style={{ fontSize: '0.32em', letterSpacing: '0.1em' }}>
        THE
      </span>
      
      {/* "BLACK" */}
      <span className="text-white font-black leading-none tracking-wide" style={{ fontSize: '1em' }}>
        BLACK
      </span>
      
      {/* "BOX" */}
      <span className="text-[#E63946] border-[0.1em] border-[#E63946] px-[0.15em] py-[0.02em] font-black leading-none ml-[0.15em]" style={{ fontSize: '1em' }}>
        BOX
      </span>
    </div>
  );
}
