import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { ref, get, update, onValue } from 'firebase/database';
import { useLocation, useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Smartphone, Flame, Award, CheckCircle, AlertTriangle, Share2, Sparkles } from 'lucide-react';

// ==========================================
// 1. Web Audio Synthesizer (Realistic SFX)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Wax Seal Fracturing Sound
  playWaxCrack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Low Punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.14);
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.14);

    // 2. High Crisp Crackle (Brittle wax snap)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.Q.setValueAtTime(3.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
  }

  // Smooth Card Slide Sound
  playPaperSlide() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.18;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 0.22);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.45);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.18);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
  }

  // Fanfare Chime
  playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.01, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.95);
    });
  }
}

const sfx = new SoundFX();

// Device Fingerprinting
const getOrCreateDeviceId = () => {
  const STORAGE_KEY = 'bb_vip_device_id';
  let devId = localStorage.getItem(STORAGE_KEY);
  if (!devId) {
    devId = 'DEV-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, devId);
  }
  return devId;
};

export default function VipCampaign() {
  const location = useLocation();
  const navigate = useNavigate();

  // Campaign Settings
  const [campaignSettings, setCampaignSettings] = useState({
    enabled: true,
    postLaunchRedirect: false,
    openingMethod: 'shake', // 'shake', 'click', 'random'
    targetDate: '2026-11-01T18:00:00',
    heroBadge: '★ دعوة سرية VIP ★',
    heroBadgeColor: '#E2E8F0',
    mainTitle: 'وصلتك الدعوة السرية.. الظرف في انتظارك!',
    subtitle: 'اكسر ختم الشمع واكتشف هديتك ليوم الافتتاح',
    buttonText: 'اكسر الختم وافتح دعوتك ✉️',
    buttonColor: '#991B1B',
    prizes: [
      { name: 'ساندوتش سموك دبل برجر مجاناً 🍔', probability: 5, code: 'FREE-SMK', type: 'free_item' },
      { name: 'خصم 50% على كامل طلبك 🎟️', probability: 15, code: 'DISC-50', type: 'percent' },
      { name: 'بطاطس كومبو مميزة مجاناً 🍟', probability: 40, code: 'FREE-FRY', type: 'free_item' },
      { name: 'خصم 20% ترحيبي على الفاتورة 🏷️', probability: 40, code: 'DISC-20', type: 'percent' }
    ]
  });

  // State Management
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [urlToken, setUrlToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState('CHECKING');
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeOpeningMethod, setActiveOpeningMethod] = useState('shake');
  
  // Registration Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Interactive Animation States:
  // 'closed' -> 'cracking' -> 'flap_open' -> 'card_extracted'
  const [envelopeState, setEnvelopeState] = useState('closed');
  const [isOpeningProcess, setIsOpeningProcess] = useState(false);
  const [shakeProgress, setShakeProgress] = useState(0);

  // Won Reward
  const [wonPrize, setWonPrize] = useState(null);
  const [claimedSerial, setClaimedSerial] = useState('');
  const [hasPreviousClaim, setHasPreviousClaim] = useState(false);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 1. Initial Device & Token Extraction
  useEffect(() => {
    const devId = getOrCreateDeviceId();
    setDeviceFingerprint(devId);

    const params = new URLSearchParams(location.search);
    const isEditor = params.get('mode') === 'editor';
    const token = params.get('key') || params.get('token') || params.get('card');
    if (token) {
      setUrlToken(token);
      validateToken(token, devId);
    } else {
      setTokenStatus('VALID');
    }

    // Check if device already claimed (unless in editor test preview)
    const savedClaim = !isEditor && (localStorage.getItem('bb_vip_claimed_reward') || localStorage.getItem('bb_heist_claimed_reward'));
    if (savedClaim) {
      try {
        const parsed = JSON.parse(savedClaim);
        setWonPrize(parsed.prize);
        setClaimedSerial(parsed.serial);
        setCustomerName(parsed.name || '');
        setCustomerPhone(parsed.phone || '');
        setHasPreviousClaim(true);
        setEnvelopeState('card_extracted');
      } catch (e) {
        console.error(e);
      }
    }

    // Load Firebase Config
    const settingsRef = ref(db, 'WebsiteData/vipCampaignSettings');
    onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setCampaignSettings(prev => ({
          ...prev,
          ...val,
          prizes: val.prizes && val.prizes.length > 0 ? val.prizes : prev.prizes
        }));
      }
    });

    // Editor Live Preview Listener (from WebsiteControl.exe)
    const handleEditorMessage = (event) => {
      if (event.data && event.data.type === 'EDITOR_UPDATE') {
        if (event.data.section === 'VIP Cowboy Campaign' || event.data.field === 'vipCampaignSettings') {
          try {
            const val = typeof event.data.value === 'string' ? JSON.parse(event.data.value) : event.data.value;
            if (val) {
              setCampaignSettings(prev => ({
                ...prev,
                ...val,
                prizes: val.prizes && val.prizes.length > 0 ? val.prizes : prev.prizes
              }));
            }
          } catch (e) {
            console.error("Error parsing VIP settings from editor message", e);
          }
        }
      }
    };
    window.addEventListener('message', handleEditorMessage);

    return () => {
      window.removeEventListener('message', handleEditorMessage);
    };
  }, [location]);

  // Token Validation with Firebase
  const validateToken = async (token, devId) => {
    try {
      const tokenRef = ref(db, `VipCardsTokens/${token}`);
      const snap = await get(tokenRef);
      if (snap.exists()) {
        const data = snap.val();
        if (data.status === 'BOUND' && data.boundDevice && data.boundDevice !== devId) {
          setTokenStatus('BLOCKED');
          return;
        }
        setTokenStatus('VALID');
      } else {
        setTokenStatus('VALID');
      }
    } catch (err) {
      setTokenStatus('VALID');
    }
  };

  // Determine Opening Method
  useEffect(() => {
    const method = campaignSettings.openingMethod;
    if (method === 'random' || !method) {
      const methods = ['shake', 'click'];
      const chosen = methods[Math.floor(Math.random() * methods.length)];
      setActiveOpeningMethod(chosen);
    } else {
      setActiveOpeningMethod(method === 'shake' ? 'shake' : 'click');
    }
  }, [campaignSettings.openingMethod]);

  // Countdown Timer
  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(campaignSettings.targetDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [campaignSettings.targetDate]);

  // Shake Detection Engine
  useEffect(() => {
    if (!formSubmitted || envelopeState !== 'closed' || activeOpeningMethod !== 'shake') return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;

    const handleDeviceMotion = (e) => {
      const current = e.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = Date.now();
      if (currentTime - lastTime > 100) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        const speed = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > 420) {
          handleShakeTick();
        }

        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion, true);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion, true);
  }, [formSubmitted, envelopeState, activeOpeningMethod, shakeProgress]);

  const handleShakeTick = () => {
    if (envelopeState !== 'closed' || isOpeningProcess) return;

    setShakeProgress((prev) => {
      const next = prev + 25;
      sfx.playWaxCrack();
      if (navigator.vibrate) navigator.vibrate(60);
      if (next >= 100) {
        executeEnvelopeUnlock();
        return 100;
      }
      return next;
    });
  };

  // Form Submit Handler
  const handleStartBreak = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    setFormSubmitted(true);
    sfx.init();

    if (activeOpeningMethod === 'click') {
      executeEnvelopeUnlock();
    }
  };

  // Execution: Fracture Wax -> Fold Open 3D Flap -> Slide Up Card
  const executeEnvelopeUnlock = async () => {
    if (isOpeningProcess || envelopeState !== 'closed') return;
    setIsOpeningProcess(true);
    setEnvelopeState('cracking');

    // 1. Play wax crack sound & vibration
    sfx.playWaxCrack();
    if (navigator.vibrate) navigator.vibrate([120, 60, 200]);

    // Calculate Winning Prize
    const prizes = campaignSettings.prizes || [];
    const totalWeight = prizes.reduce((acc, p) => acc + (Number(p.probability) || 1), 0);
    let rand = Math.random() * totalWeight;
    let selectedPrize = prizes[prizes.length - 1];

    for (const p of prizes) {
      if (rand <= (Number(p.probability) || 1)) {
        selectedPrize = p;
        break;
      }
      rand -= (Number(p.probability) || 1);
    }

    const uniqueSerial = 'VIP-' + Math.floor(1000 + Math.random() * 9000);
    setWonPrize(selectedPrize);
    setClaimedSerial(uniqueSerial);

    // Save to Firebase for POS Sync
    const cleanPhone = customerPhone.trim();
    if (cleanPhone) {
      try {
        const custRef = ref(db, `PublicCustomers/${cleanPhone}`);
        await update(custRef, {
          Name: customerName.trim(),
          Phone: cleanPhone,
          isVipFounder: true,
          vipCode: uniqueSerial,
          vipPrize: selectedPrize.name,
          vipDiscountCode: selectedPrize.code,
          isVipRedeemed: false,
          vipDeviceId: deviceFingerprint,
          vipClaimedAt: new Date().toISOString()
        });

        if (urlToken) {
          const tokenRef = ref(db, `VipCardsTokens/${urlToken}`);
          await update(tokenRef, {
            status: 'BOUND',
            boundDevice: deviceFingerprint,
            boundPhone: cleanPhone,
            claimedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Firebase save error:', err);
      }
    }

    // Persist locally
    localStorage.setItem('bb_vip_claimed_reward', JSON.stringify({
      prize: selectedPrize,
      serial: uniqueSerial,
      name: customerName,
      phone: cleanPhone
    }));

    // Step 2: Wax breaks & flap folds open (after 0.4s)
    setTimeout(() => {
      setEnvelopeState('flap_open');
      sfx.playPaperSlide();
    }, 450);

    // Step 3: Titanium card glides out of envelope (after 1.0s)
    setTimeout(() => {
      setEnvelopeState('card_extracted');
      setIsOpeningProcess(false);
      sfx.playFanfare();
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.5 },
        colors: ['#E2E8F0', '#991B1B', '#F87171', '#475569', '#FFFFFF']
      });
    }, 1100);
  };

  // WhatsApp Share
  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `🎩🔥 لقد استلمت بطاقتي السرية الملكية (Black Card VIP) وحجزت هديتي الحصرية للافتتاح الكبير! كود عضويتي: #${claimedSerial}. انتظرونا!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Blocked Screen
  if (tokenStatus === 'BLOCKED') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0A0C] flex items-center justify-center p-6 text-center select-none" dir="rtl">
        <div className="max-w-md bg-[#121316] border border-red-900/50 rounded-3xl p-8 shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-white mb-3">هذه الدعوة مفعّلة مسبقاً!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            عذراً! هذا المفتاح السري تم مسحه وتدبيسه مسبقاً على هاتف آخر، ولا يمكن استخدامه من أكثر من جهاز لمنع الاحتيال.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-3.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            العودة للموقع الرئيسي
          </button>
        </div>
      </div>
    );
  }

  const isFlapOpen = envelopeState === 'flap_open' || envelopeState === 'card_extracted';
  const isCardExtracted = envelopeState === 'card_extracted';

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C] text-white flex flex-col justify-between overflow-hidden select-none font-sans" dir="rtl">
      
      {/* Top Left Bar: Sound Mute & Editor Mode Reset Button */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <button 
          onClick={() => {
            const next = !soundMuted;
            sfx.muted = next;
            setSoundMuted(next);
          }}
          className="p-3 rounded-full bg-black/60 border border-slate-700/60 hover:border-slate-400 backdrop-blur-md transition-all text-slate-300 shadow-xl"
          title="كتم / تفعيل الصوت"
        >
          {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-slate-200" />}
        </button>

        {new URLSearchParams(location.search).get('mode') === 'editor' && (
          <button
            onClick={() => {
              localStorage.removeItem('bb_vip_claimed_reward');
              setWonPrize(null);
              setClaimedSerial('');
              setCustomerName('');
              setCustomerPhone('');
              setFormSubmitted(false);
              setShakeProgress(0);
              setEnvelopeState('closed');
              setIsOpeningProcess(false);
            }}
            className="px-3 py-2 rounded-xl bg-red-950/80 border border-red-700/60 text-xs font-bold text-red-200 hover:bg-red-900 transition-all shadow-lg flex items-center gap-1.5"
            title="إعادة تجربة الفتح"
          >
            <span>🔄 إعادة التجربة</span>
          </button>
        )}
      </div>

      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-950/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-gradient-to-t from-red-950/20 to-transparent blur-[80px]" />
      </div>

      {/* 1. Header: Badge & Titles */}
      <div className="relative z-20 pt-4 sm:pt-6 px-4 text-center pointer-events-none">
        <div 
          className="inline-block px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase border shadow-lg mb-2 backdrop-blur-md"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.04)', 
            borderColor: campaignSettings.heroBadgeColor || '#E2E8F0', 
            color: campaignSettings.heroBadgeColor || '#E2E8F0' 
          }}
        >
          {campaignSettings.heroBadge}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-lg">
          {campaignSettings.mainTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto drop-shadow">
          {campaignSettings.subtitle}
        </p>
      </div>

      {/* 2. Centerpiece: The Royal Black Envelope & Sliding VIP Card System */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-4 my-auto w-full">
        <div 
          className="relative w-full max-w-[340px] sm:max-w-[375px] aspect-[834/778] select-none transition-transform duration-150 ease-out"
          style={{ 
            transform: shakeProgress > 0 && !isCardExtracted 
              ? `translate3d(${(Math.random() - 0.5) * (shakeProgress * 0.16)}px, ${(Math.random() - 0.5) * (shakeProgress * 0.16)}px, 0) rotate(${(Math.random() - 0.5) * (shakeProgress * 0.04)}deg)` 
              : 'none'
          }}
        >
          {/* Ambient Crimson & Obsidian Glow */}
          <div className="absolute inset-0 rounded-3xl bg-red-950/25 blur-3xl pointer-events-none" />

          {/* STATE 1 & 2: CLOSED / SHAKING ENVELOPE */}
          {!isFlapOpen && (
            <div 
              className="relative w-full h-full cursor-pointer"
              onClick={() => {
                if (formSubmitted) {
                  handleShakeTick();
                } else {
                  const input = document.querySelector('input[placeholder="اسمك الكامل"]');
                  if (input) input.focus();
                }
              }}
            >
              <img 
                src="./images/envelope_closed.png" 
                alt="Royal Sealed Envelope" 
                className="w-full h-full object-contain pointer-events-none drop-shadow-[0_22px_50px_rgba(0,0,0,0.95)]"
              />

              {/* Real-time Dynamic Fracture Cracks Overlaid on Crimson Wax Seal */}
              {shakeProgress > 0 && (
                <div 
                  className="absolute pointer-events-none z-30"
                  style={{
                    left: '49.0%',
                    top: '51.5%',
                    width: '88px',
                    height: '88px',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Stage 1: Initial Central Crack */}
                    <path 
                      d="M50,18 L48,42 L58,52 L43,72 L50,84" 
                      fill="none" 
                      stroke="#FFFFFF" 
                      strokeWidth="3.2" 
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse"
                    />
                    {/* Stage 2: Lateral Fractures */}
                    {shakeProgress >= 50 && (
                      <path 
                        d="M48,42 L32,36 M58,52 L74,46 L82,55" 
                        fill="none" 
                        stroke="#FFFFFF" 
                        strokeWidth="2.6" 
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      />
                    )}
                    {/* Stage 3: Shatter Spiderweb */}
                    {shakeProgress >= 75 && (
                      <path 
                        d="M43,72 L26,78 M58,52 L65,68 L78,74 M48,30 L62,24" 
                        fill="none" 
                        stroke="#FFD1D1" 
                        strokeWidth="2.2" 
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_12px_rgba(255,100,100,0.95)]"
                      />
                    )}
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: OPEN ENVELOPE + SMOOTHLY SLIDING TITANIUM BLACK CARD VIP */}
          {isFlapOpen && (
            <div className="relative w-full h-full">
              {/* Layer 1: Open Envelope Back & Lifted Flap */}
              <img 
                src="./images/envelope_open.png" 
                alt="Open Envelope" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-[0_22px_50px_rgba(0,0,0,0.95)]"
              />

              {/* Layer 2: The Titanium BLACK CARD VIP (Physically slides up from pocket) */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-[78%] h-[53%] rounded-2xl z-20 select-none cursor-pointer transition-all duration-1000 ease-out"
                style={{
                  top: isCardExtracted ? '2%' : '48%',
                  transform: `translateX(-50%) ${isCardExtracted ? 'scale(1.02)' : 'scale(0.92)'}`,
                  boxShadow: isCardExtracted 
                    ? '0 25px 60px rgba(0,0,0,0.98), 0 0 35px rgba(226,232,240,0.3)' 
                    : '0 8px 20px rgba(0,0,0,0.8)'
                }}
                onClick={() => {
                  if (isCardExtracted) {
                    sfx.playFanfare();
                    confetti({
                      particleCount: 80,
                      spread: 60,
                      origin: { y: 0.6 }
                    });
                  }
                }}
              >
                {/* Titanium Card Surface */}
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#1C1D24] via-[#101115] to-[#07070A] border-2 border-slate-300/85 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
                  {/* Brushed Silver Reflections */}
                  <div className="absolute inset-0 rounded-2xl border border-white/25 pointer-events-none" />
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Card Top Row */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-mono font-black text-slate-300 tracking-wider">
                      {claimedSerial ? `#${claimedSerial}` : '#BLACK-CARD'}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-slate-700/60 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      <span className="text-[8px] font-mono tracking-widest text-slate-300 font-bold uppercase">FOUNDING VIP PASS</span>
                    </div>
                  </div>

                  {/* Card Center: BLACK CARD VIP Brand & Prize */}
                  <div className="text-center my-auto z-10">
                    <span className="block text-[11px] font-black tracking-[0.3em] text-red-600 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      BLACK CARD
                    </span>
                    <span className="block text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-xl my-0.5">
                      VIP
                    </span>
                    {wonPrize && (
                      <div className="mt-1 px-3 py-1 rounded-lg bg-red-950/90 border border-red-700/70 inline-block shadow-lg">
                        <p className="text-[11px] sm:text-xs font-black text-red-100">
                          {wonPrize.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Row: Customer Name & Phone */}
                  <div className="flex items-center justify-between border-t border-slate-800/90 pt-1.5 text-[10px] text-slate-400 font-medium z-10">
                    <span className="font-bold text-slate-200 truncate max-w-[150px]">{customerName || 'عضوية الافتتاح الملكي'}</span>
                    <span className="font-mono text-slate-400">{customerPhone || 'SMOKE & SMASH'}</span>
                  </div>
                </div>
              </div>

              {/* Layer 3: Envelope Front Pocket (Masks lower card section in true 3D) */}
              <img 
                src="./images/envelope_pocket_front.png" 
                alt="Envelope Front Pocket" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-30 drop-shadow-[0_-5px_15px_rgba(0,0,0,0.6)]"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Container: Countdown & Interactive Form */}
      <div className="relative z-20 p-4 sm:p-6 w-full max-w-md mx-auto pointer-events-auto">
        
        {/* Minimalist Countdown Timer Boxes */}
        {!isCardExtracted && (
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="bg-[#121316]/90 border border-slate-700/60 rounded-xl py-2 shadow-lg backdrop-blur-md">
              <span className="block text-lg sm:text-xl font-black text-slate-100 font-mono">{timeLeft.days}</span>
              <span className="text-[10px] text-slate-400 font-bold">أيام</span>
            </div>
            <div className="bg-[#121316]/90 border border-slate-700/60 rounded-xl py-2 shadow-lg backdrop-blur-md">
              <span className="block text-lg sm:text-xl font-black text-slate-100 font-mono">{timeLeft.hours}</span>
              <span className="text-[10px] text-slate-400 font-bold">ساعات</span>
            </div>
            <div className="bg-[#121316]/90 border border-slate-700/60 rounded-xl py-2 shadow-lg backdrop-blur-md">
              <span className="block text-lg sm:text-xl font-black text-slate-100 font-mono">{timeLeft.minutes}</span>
              <span className="text-[10px] text-slate-400 font-bold">دقائق</span>
            </div>
            <div className="bg-[#121316]/90 border border-slate-700/60 rounded-xl py-2 shadow-lg backdrop-blur-md">
              <span className="block text-lg sm:text-xl font-black text-slate-100 font-mono">{timeLeft.seconds}</span>
              <span className="text-[10px] text-slate-400 font-bold">ثواني</span>
            </div>
          </div>
        )}

        {/* Step 1: Input Name & Phone (While envelope is closed) */}
        {!formSubmitted && !isCardExtracted && (
          <form onSubmit={handleStartBreak} className="bg-[#121316]/95 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl">
            <div className="space-y-3">
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسمك الكامل"
                className="w-full px-4 py-3 bg-[#0A0A0C]/80 border border-slate-800 focus:border-slate-500 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="رقم الواتساب"
                className="w-full px-4 py-3 bg-[#0A0A0C]/80 border border-slate-800 focus:border-slate-500 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
              <button
                type="submit"
                style={{ backgroundColor: campaignSettings.buttonColor || '#991B1B' }}
                className="w-full py-3.5 hover:brightness-110 active:scale-[0.99] text-white font-black text-sm rounded-xl transition-all shadow-[0_8px_25px_rgba(153,27,27,0.4)] flex items-center justify-center gap-2"
              >
                <span>{campaignSettings.buttonText || 'اكسر الختم وافتح دعوتك ✉️'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Interactive Opening (Shake Mechanic) */}
        {formSubmitted && !isCardExtracted && (
          <div className="bg-[#121316]/95 border border-red-900/40 rounded-2xl p-5 backdrop-blur-xl shadow-2xl text-center">
            {activeOpeningMethod === 'shake' ? (
              <div>
                <Smartphone className="w-12 h-12 text-red-500 mx-auto mb-2 animate-bounce" />
                <h3 className="text-base font-black text-white mb-1">هز موبايلك جامد لكسر ختم الشمع! 📱💥</h3>
                <p className="text-xs text-slate-400 mb-4">كل هزة تقطع جزءاً من ختم الشمع الملكي</p>

                {/* Shake Progress Bar */}
                <div className="w-full h-3 bg-black/60 rounded-full border border-slate-800 overflow-hidden mb-4 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-red-800 to-rose-600 rounded-full transition-all duration-300" 
                    style={{ width: `${shakeProgress}%` }}
                  />
                </div>

                {/* Manual Tap Fallback */}
                <button
                  type="button"
                  onClick={handleShakeTick}
                  className="w-full py-3 bg-red-900 hover:bg-red-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>اضغط هنا لكسر الختم يدوياً ({shakeProgress}%)</span>
                </button>
              </div>
            ) : (
              <div>
                <Flame className="w-12 h-12 text-red-500 mx-auto mb-2 animate-pulse" />
                <h3 className="text-base font-black text-white mb-3">اضغط على زر كسر الختم لفتح الظرف! ✉️</h3>
                <button
                  type="button"
                  onClick={executeEnvelopeUnlock}
                  className="w-full py-3.5 bg-red-900 hover:bg-red-800 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-xl"
                >
                  اكسر الختم وافتح كارت الـ VIP الآن 🔥
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Card Revealed Modal / Result */}
        {isCardExtracted && wonPrize && (
          <div className="bg-[#121316]/98 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-2xl text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-700/50 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Award className="w-6 h-6 text-red-400" />
            </div>

            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">تهانينا يا VIP! تم تأكيد عضويتك</span>
            <h2 className="text-xl font-black text-white mt-1 mb-2">{wonPrize.name}</h2>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              أهلاً بك <strong className="text-white">{customerName}</strong>! تم تسجيل جائزتك بنجاح برقم هاتفك. احتفظ بهذا الكود لإبرازه عند الدفع في يوم الافتتاح:
            </p>

            {/* Serial Code & Barcode Box */}
            <div className="p-3 bg-black/80 border border-slate-700 rounded-xl mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400 font-mono">كود الحجز المعتمد:</span>
                <span className="text-xs text-red-400 font-bold">صالح للاستخدام مرة واحدة</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-widest text-slate-100 py-1">
                {claimedSerial}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareOnWhatsApp}
                className="py-3 px-3 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة على واتساب</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>زيارة موقع المطعم</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
