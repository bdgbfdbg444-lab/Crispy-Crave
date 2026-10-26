import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Share2, Copy, Check, MessageCircle, LogOut, X, Sparkles, UserPlus, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../config/appConfig';

export default function GroupOrderModal() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { currentUser, customerData } = useAuth();
  const {
    isGroupModalOpen,
    setIsGroupModalOpen,
    groupOrderId,
    groupData,
    isGroupOrder,
    isGroupHost,
    currentGuestName,
    setCurrentGuestName,
    startGroupOrder,
    joinGroupOrder,
    leaveGroupOrder
  } = useCart();

  const defaultHostName = customerData?.Name || currentUser?.displayName || currentGuestName || '';
  const [hostNameInput, setHostNameInput] = useState(() => defaultHostName);
  const [joinCodeInput, setJoinCodeInput] = useState(() => groupOrderId || '');
  const [joinNameInput, setJoinNameInput] = useState(() => defaultHostName);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(() => (groupOrderId || !currentUser) ? 'join' : 'create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (groupOrderId) {
      setJoinCodeInput(groupOrderId);
      if (!isGroupOrder) {
        setActiveTab('join');
      }
    }
  }, [groupOrderId, isGroupOrder]);

  useEffect(() => {
    if (!hostNameInput && (customerData?.Name || currentUser?.displayName)) {
      setHostNameInput(customerData?.Name || currentUser?.displayName || '');
    }
    if (!joinNameInput && (customerData?.Name || currentUser?.displayName)) {
      setJoinNameInput(customerData?.Name || currentUser?.displayName || '');
    }
  }, [customerData, currentUser]);

  if (!isGroupModalOpen) return null;

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.')
  );

  // Production URL for GitHub Pages
  const PROD_BASE_URL = 'https://bdgbfdbg444-lab.github.io/Crispy-Crave/';

  const baseWebUrl = isLocalhost 
    ? PROD_BASE_URL 
    : `${window.location.origin}${window.location.pathname}`;

  const cleanBase = baseWebUrl.endsWith('/') ? baseWebUrl : `${baseWebUrl}/`;
  const inviteUrl = groupOrderId ? `${cleanBase}?group=${groupOrderId}` : '';

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!hostNameInput.trim()) return;
    setIsSubmitting(true);
    try {
      await startGroupOrder(hostNameInput.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || !joinNameInput.trim()) return;
    setIsSubmitting(true);
    try {
      const success = await joinGroupOrder(joinCodeInput.trim().toUpperCase(), joinNameInput.trim());
      if (success) {
        setIsGroupModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!inviteUrl) return;
    const brandName = APP_CONFIG.restaurantName || 'The Black Box';
    const msg = lang === 'en'
      ? `Hey everyone! Open the link and pick your meals to order together from ${brandName}.. and each person's burger will have their name written on it by the chef! 👥🍔🔥\n${inviteUrl}`
      : `يا شباب! افتحوا الرابط واختاروا وجباتكم عشان نطلب سوا من ${brandName}.. وكل واحد ساندوتشه هينزل باسمه ومكتوب عليه من الشيف! 👥🍔🔥\n${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-black-surface border border-brand-red/30 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-text-light overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsGroupModalOpen(false)}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black-primary hover:bg-black-surface border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-red/15 border border-brand-red/30 text-brand-red flex items-center justify-center text-white shadow-lg shadow-brand-red/20">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-text-light">
                {lang === 'en' ? 'Group Ordering' : 'الطلب الجماعي'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {lang === 'en'
                  ? 'Order together, label each burger by name!'
                  : 'اطلبوا سوا مع أصحابك وكل ساندوتش يطبع باسم صاحبه'}
              </p>
            </div>
          </div>

          {/* If already in an active group */}
          {isGroupOrder ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-red-dark/30 to-black-primary border border-brand-red/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-bold">
                    {lang === 'en' ? 'Room Code' : 'كود الغرفة'}
                  </span>
                  <span className="text-sm font-mono font-black text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20 font-bold">
                    {groupOrderId}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{lang === 'en' ? 'Host:' : 'المنظم:'}</span>
                  <span className="font-bold text-white">
                    {groupData?.hostName} {isGroupHost ? '(أنت)' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{lang === 'en' ? 'Your Name:' : 'اسمك على الساندوتش:'}</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    👤 {currentGuestName || (lang === 'en' ? 'Guest' : 'ضيف')}
                  </span>
                </div>
              </div>

              {/* Share & Invite Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all text-sm"
                >
                  <MessageCircle size={18} />
                  <span>{lang === 'en' ? 'Invite Friends on WhatsApp' : 'إرسال الرابط للأصدقاء على واتساب'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 bg-black-primary hover:bg-white/5 border border-white/10 text-text-light font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copied ? (lang === 'en' ? 'Link Copied!' : 'تم نسخ الرابط بنجاح!') : (lang === 'en' ? 'Copy Room Link' : 'نسخ رابط الغرفة')}</span>
                </button>
              </div>

              {/* Leave Room Button */}
              <button
                type="button"
                onClick={async () => {
                  const confirmMsg = isGroupHost
                    ? (lang === 'en' ? 'Are you sure you want to cancel and close this group order for all members?' : 'هل أنت متأكد من إلغاء وإغلاق هذا الطلب الجماعي للجميع؟')
                    : (lang === 'en' ? 'Are you sure you want to leave this group order?' : 'هل أنت متأكد من مغادرة الطلب الجماعي؟');
                  if (confirm(confirmMsg)) {
                    await leaveGroupOrder();
                    setIsGroupModalOpen(false);
                  }
                }}
                className="w-full py-2 text-center text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 pt-2"
              >
                <LogOut size={14} />
                <span>{isGroupHost ? (lang === 'en' ? 'Cancel & Close Group' : 'إلغاء وإغلاق الطلب الجماعي') : (lang === 'en' ? 'Leave Group' : 'مغادرة الطلب الجماعي')}</span>
              </button>
            </div>
          ) : (
            /* No active group: Create or Join */
            <div>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-black-primary p-1 mb-5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'create'
                      ? 'bg-brand-red text-white shadow-md'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Start New Group' : 'بدء طلب جديد'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'join'
                      ? 'bg-brand-red text-white shadow-md'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Join Existing' : 'انضمام بكود'}
                </button>
              </div>

              {activeTab === 'create' ? (
                !currentUser ? (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                      <Lock size={22} />
                    </div>
                    <h3 className="font-bold text-base text-white">
                      {lang === 'en' ? 'Exclusive for Registered Accounts' : 'ميزة خاصة بحسابات العملاء المسجلين'}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {lang === 'en'
                        ? 'To create and manage a group order, please sign in or create an account.'
                        : 'بدء وإنشاء غرفة طلب جماعي متاح فقط للعملاء المسجلين بحساب. سجل دخولك الآن أو أنشئ حساباً للاستمتاع بالميزة!'}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsGroupModalOpen(false);
                          navigate('/my-account');
                        }}
                        className="flex-1 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl text-xs transition-colors shadow-md"
                      >
                        {lang === 'en' ? 'Sign In / Register' : 'تسجيل الدخول / إنشاء حساب'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('join')}
                        className="px-4 py-2.5 bg-black-primary hover:bg-white/5 border border-white/10 text-text-muted hover:text-white font-bold rounded-xl text-xs transition-colors"
                      >
                        {lang === 'en' ? 'Join by Code' : 'معي كود'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1.5">
                        {lang === 'en' ? 'Your Name (The Host):' : 'اسمك (أنت المنظم للطلب):'}
                      </label>
                      <input
                        type="text"
                        required
                        value={hostNameInput}
                        onChange={(e) => setHostNameInput(e.target.value)}
                        placeholder={lang === 'en' ? 'e.g. Ahmed' : 'مثال: أحمد'}
                        className="w-full bg-black-primary border border-brand-red/30 rounded-xl px-4 py-2.5 text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-brand-red"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-text-muted space-y-1">
                      <p className="font-bold text-text-light flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-400" />
                        {lang === 'en' ? 'How it works:' : 'كيف يعمل الطلب الجماعي؟'}
                      </p>
                      <p>1. {lang === 'en' ? 'You get a private room link to share with friends.' : 'هتاخد رابط خاص بالغرفة تبعته لصحابك على واتساب.'}</p>
                      <p>2. {lang === 'en' ? 'Each friend enters their name and picks their sandwich.' : 'كل واحد يفتح ويدخل اسمه ويختار أكله براحته.'}</p>
                      <p>3. {lang === 'en' ? 'The kitchen prints each person’s name on their wrapper!' : 'الطلب بينزل للمطبخ ومكتوب على كل ساندوتش اسم صاحبه بالظبط!'}</p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !hostNameInput.trim()}
                      className="w-full py-3 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl shadow-lg shadow-brand-red/30 transition-all text-sm disabled:opacity-50"
                    >
                      {isSubmitting
                        ? (lang === 'en' ? 'Creating...' : 'جاري إنشاء الغرفة...')
                        : (lang === 'en' ? 'Create Group Room 🚀' : 'إنشاء غرفة الطلب الجماعي')}
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  {Boolean(groupOrderId) && (
                    <div className="p-3 rounded-xl bg-brand-red/10 border border-brand-red/30 text-xs text-brand-red font-bold flex items-center justify-between">
                      <span>{lang === 'en' ? 'Invited to Room:' : 'تمت دعوتك للغرفة:'}</span>
                      <span className="font-mono text-white bg-black-surface px-2.5 py-0.5 rounded-lg border border-brand-red/20">{groupOrderId}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">
                      {lang === 'en' ? 'Room Code:' : 'كود الغرفة (Room Code):'}
                    </label>
                    <input
                      type="text"
                      required
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="GRP-XXXX"
                      className="w-full bg-black-primary border border-brand-red/30 rounded-xl px-4 py-2.5 text-sm font-mono text-text-light placeholder-text-muted/40 focus:outline-none focus:border-brand-red uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">
                      {lang === 'en' ? 'Your Name (to write on sandwich):' : 'اسمك (ليُكتب على ساندوتشك):'}
                    </label>
                    <input
                      type="text"
                      required
                      value={joinNameInput}
                      onChange={(e) => setJoinNameInput(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. Mahmoud' : 'مثال: محمود'}
                      className="w-full bg-black-primary border border-brand-red/30 rounded-xl px-4 py-2.5 text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !joinCodeInput.trim() || !joinNameInput.trim()}
                    className="w-full py-3 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl shadow-lg shadow-brand-red/30 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} />
                    <span>{isSubmitting ? (lang === 'en' ? 'Joining...' : 'جاري الانضمام...') : (lang === 'en' ? 'Join Group Order 👥' : 'انضمام للطلب الجماعي')}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
