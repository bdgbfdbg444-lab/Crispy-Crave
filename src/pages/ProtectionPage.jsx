import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ProtectionPage({ reason }) {
  const { lang } = useLanguage();
  
  return (
    <div className="min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-black-primary border border-brand-red p-8 rounded-xl max-w-lg w-full shadow-2xl flex flex-col items-center">
        <ShieldAlert size={64} className="text-brand-red mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold text-text-light mb-4">
          {lang === 'en' ? 'System Maintenance' : '????? ??????'}
        </h1>
        <p className="text-gray-400 mb-8">
          {lang === 'en' 
            ? 'The website is currently undergoing temporary maintenance to ensure optimal performance and security. We will be back shortly.' 
            : '?????? ???? ?????? ?????? ????? ????? ???? ???? ?????. ????? ????? ??????.'}
        </p>
        <p className="text-sm text-gray-500">
          {lang === 'en' ? 'Error Code: PRT-503' : '??? ?????: PRT-503'}
        </p>
      </div>
    </div>
  );
}
