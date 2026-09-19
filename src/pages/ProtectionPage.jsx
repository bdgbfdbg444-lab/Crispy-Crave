import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert } from 'lucide-react';

const ProtectionPage = () => {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-black-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black-primary border border-brand-red/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-brand-red/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={32} className="text-brand-red" />
          </div>

          <h1 className="text-3xl font-display font-black text-text-light mb-4">
            {lang === 'en' ? 'System Maintenance' : 'صيانة النظام'}
          </h1>
          
          <p className="text-text-muted text-base mb-8 leading-relaxed">
            {lang === 'en' 
            ? 'The website is currently undergoing temporary maintenance to ensure optimal performance and security. We will be back shortly.' 
            : 'الموقع يخضع حالياً لعملية صيانة مؤاقتة لضمان اداء أفضل وأأمان أعلى. سنعود للعمل قريقا.'}
          </p>

          <div className="text-sm font-mono text-text-muted/50">
            {lang === 'en' ? 'Error Code: PRT-503' : 'رلز الخطة: PRT-503'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectionPage;