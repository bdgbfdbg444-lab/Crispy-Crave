import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Clock, CheckCircle2, Lock, Unlock, Volume2, VolumeX, 
  RotateCcw, AlertTriangle, Utensils, Bike, ShoppingBag, Eye, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { APP_CONFIG } from '../config/appConfig';

const KITCHEN_PIN = '9080'; // Default Secure Kitchen PIN

// Helper to format elapsed kitchen time cleanly
function formatElapsed(mins) {
  if (!mins || mins < 0) return '0 د';
  if (mins < 60) return `${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) return `${hours} س ${rem > 0 ? `${rem} د` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} يوم`;
}

// Web Audio API Synth Chime for Kitchen (Works with 0 external mp3 dependencies)
function playKitchenChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // Second tone (G#5 - 830.61Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.warn('Kitchen chime error:', e);
  }
}

export default function KdsPage() {
  // 1. PIN Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const pinParam = urlParams.get('pin') || hashParams.get('pin');
      if (pinParam === KITCHEN_PIN) {
        localStorage.setItem('kds_auth', 'true');
        return true;
      }
      return localStorage.getItem('kds_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // 2. KDS State
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'ready'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ordersMap, setOrdersMap] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Realtime Firebase Orders & OrderTracking Listener
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen to OrderTracking node
    const trackingRef = ref(db, 'OrderTracking');
    const unsubscribeTracking = onValue(trackingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setOrdersMap(prev => {
          const merged = { ...prev };
          Object.entries(data).forEach(([key, val]) => {
            if (val && typeof val === 'object') {
              merged[key] = { ...merged[key], ...val, trackingKey: key };
            }
          });
          return merged;
        });
      }
    });

    // Also listen to incoming Orders node
    const ordersRef = ref(db, 'Orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setOrdersMap(prev => {
          const merged = { ...prev };
          Object.entries(data).forEach(([key, val]) => {
            if (val && typeof val === 'object') {
              const displayId = val.displayOrderId || val.OrderNumber || key;
              const cleanId = String(displayId).replace(/#/g, '').trim();
              merged[cleanId] = { ...merged[cleanId], ...val, orderKey: key };
            }
          });
          return merged;
        });
      }
    });

    return () => {
      unsubscribeTracking();
      unsubscribeOrders();
    };
  }, [isAuthenticated]);

  // Handle PIN Submission
  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === KITCHEN_PIN) {
      localStorage.setItem('kds_auth', 'true');
      setIsAuthenticated(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handlePinDigit = (digit) => {
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next === KITCHEN_PIN) {
        localStorage.setItem('kds_auth', 'true');
        setIsAuthenticated(true);
        setPinError(false);
        setPinInput('');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kds_auth');
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Convert raw map to array of normalized orders
  const ordersList = useMemo(() => {
    return Object.entries(ordersMap).map(([key, val]) => {
      const id = val.OrderNumber || val.displayOrderId || key;
      const cleanId = String(id).replace(/#/g, '').trim();
      const status = val.Status || 'InKitchen';
      const orderType = (val.OrderType || val.orderType || 'takeaway').toLowerCase();
      
      // Parse OrderDate
      let orderDate = new Date();
      if (val.OrderDate) {
        orderDate = new Date(val.OrderDate);
      } else if (val.CreatedAt || val.createdAt) {
        orderDate = new Date(val.CreatedAt || val.createdAt);
      } else if (val.LastUpdate) {
        orderDate = new Date(val.LastUpdate);
      }

      // Elapsed Minutes
      const diffMs = currentTime - orderDate;
      const elapsedMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));

      // Normalize Items
      let items = [];
      if (Array.isArray(val.Items)) {
        items = val.Items;
      } else if (Array.isArray(val.items)) {
        items = val.items;
      } else if (val.Items && typeof val.Items === 'object') {
        items = Object.values(val.Items);
      } else if (val.items && typeof val.items === 'object') {
        items = Object.values(val.items);
      }

      return {
        id: cleanId,
        displayId: `#${cleanId}`,
        rawStatus: status,
        status: status.toLowerCase(),
        orderType,
        tableNumber: val.TableNumber || val.tableNumber || '',
        customerName: val.CustomerName || val.customerName || '',
        customerPhone: val.CustomerPhone || val.customerPhone || '',
        deliveryAddress: val.DeliveryAddress || val.deliveryAddress || '',
        notes: val.Notes || val.notes || '',
        items,
        elapsedMins,
        orderDate,
        orderKey: val.orderKey,
        trackingKey: val.trackingKey || cleanId
      };
    });
  }, [ordersMap, currentTime]);

  // Sound chime when a new active order arrives
  useEffect(() => {
    const currentActiveIds = new Set(
      ordersList
        .filter(o => ['inkitchen', 'new', 'pending', 'preparing'].includes(o.status))
        .map(o => o.id)
    );

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousOrderIdsRef.current = currentActiveIds;
      return;
    }

    // Check if new order arrived
    let hasNew = false;
    currentActiveIds.forEach(id => {
      if (!previousOrderIdsRef.current.has(id)) {
        hasNew = true;
      }
    });

    if (hasNew && soundEnabled) {
      playKitchenChime();
    }

    previousOrderIdsRef.current = currentActiveIds;
  }, [ordersList, soundEnabled]);

  // Separate Active and Ready orders
  const activeOrders = useMemo(() => {
    return ordersList
      .filter(o => ['inkitchen', 'new', 'pending', 'preparing'].includes(o.status))
      .sort((a, b) => a.orderDate - b.orderDate);
  }, [ordersList]);

  const readyOrders = useMemo(() => {
    return ordersList
      .filter(o => o.status === 'ready')
      .sort((a, b) => b.orderDate - a.orderDate);
  }, [ordersList]);

  // Calculate Batch Cooking Items
  const batchItems = useMemo(() => {
    const map = {};
    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const name = (item.productName || item.product?.name || item.name || 'صنف').trim();
        const qty = Number(item.quantity) || 1;
        if (!map[name]) {
          map[name] = { name, count: 0, ordersCount: 0 };
        }
        map[name].count += qty;
        map[name].ordersCount += 1;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [activeOrders]);

  // Action: Mark as Ready (triggers customer phone buzzer!)
  const handleMarkReady = async (order) => {
    try {
      const updates = {};
      updates[`OrderTracking/${order.id}/Status`] = 'Ready';
      updates[`PublicTracking/${order.id}/Status`] = 'Ready';
      updates[`PublicTracking/${order.id}/LastUpdate`] = new Date().toISOString();
      if (order.orderKey) {
        updates[`Orders/${order.orderKey}/Status`] = 'Ready';
      }

      await update(ref(db), updates);
      if (soundEnabled) playKitchenChime();
    } catch (e) {
      alert('خطأ في تحديث الطلب: ' + e.message);
    }
  };

  // Action: Mark as Served / Completed
  const handleMarkServed = async (order) => {
    try {
      const updates = {};
      updates[`OrderTracking/${order.id}/Status`] = 'Completed';
      updates[`PublicTracking/${order.id}/Status`] = 'Completed';
      updates[`PublicTracking/${order.id}/LastUpdate`] = new Date().toISOString();
      if (order.orderKey) {
        updates[`Orders/${order.orderKey}/Status`] = 'Completed';
      }

      await update(ref(db), updates);
    } catch (e) {
      alert('خطأ في إتمام الطلب: ' + e.message);
    }
  };

  // Render Lock Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center p-4" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#141418] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-red/15 border border-brand-red/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(230,57,70,0.25)]">
            <Lock className="w-8 h-8 text-brand-red animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black mb-1 tracking-wide">شاشة المطبخ الذكية (KDS)</h2>
          <p className="text-gray-400 text-xs sm:text-sm mb-6">يرجى إدخال رمز المرور السري الخاص بالمطبخ للوصول</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input 
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className={`w-full py-4 text-center text-3xl font-black tracking-[0.5em] bg-black border-2 rounded-2xl text-white focus:outline-none transition-all ${
                pinError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-gray-700 focus:border-brand-red'
              }`}
              autoFocus
            />

            {pinError && (
              <p className="text-red-400 text-xs font-bold animate-shake">
                ⚠️ رمز المرور غير صحيح، يرجى المحاولة مرة أخرى
              </p>
            )}

            {/* Touch Number Pad for Tablet */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num.toString())}
                  className="py-3.5 bg-[#1C1C22] hover:bg-[#282832] active:scale-95 text-xl font-bold rounded-xl transition-all border border-gray-800 text-gray-200"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold rounded-xl transition-all border border-red-900/40 text-sm"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="py-3.5 bg-[#1C1C22] hover:bg-[#282832] active:scale-95 text-xl font-bold rounded-xl transition-all border border-gray-800 text-gray-200"
              >
                0
              </button>
              <button
                type="submit"
                className="py-3.5 bg-brand-red hover:bg-brand-red-dark active:scale-95 text-white font-black rounded-xl transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center"
              >
                <Check size={20} />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/80 text-[11px] text-gray-500">
            The Black Box • Kitchen Operating System
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0D11] text-white flex flex-col font-sans select-none overflow-x-hidden" dir="rtl">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#14151B] border-b border-gray-800/80 px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
        
        {/* Left: Brand & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(230,57,70,0.4)]">
            <Flame size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
              <span>شاشة المطبخ الذكية (KDS)</span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                متصل لحظياً
              </span>
            </h1>
            <p className="text-gray-400 text-xs hidden md:block">The Black Box • Gourmet Kitchen</p>
          </div>
        </div>

        {/* Center: Tabs Switcher */}
        <div className="flex items-center bg-[#0C0D11] p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'active'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>قيد التحضير</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'active' ? 'bg-black/40 text-white' : 'bg-gray-800 text-gray-300'
            }`}>
              {activeOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ready')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'ready'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>جاهزة للتقديم</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'ready' ? 'bg-black/40 text-white' : 'bg-gray-800 text-gray-300'
            }`}>
              {readyOrders.length}
            </span>
          </button>
        </div>

        {/* Right: Sound toggle, Clock & Lock */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
            title={soundEnabled ? 'صوت التنبيه مفعل' : 'صوت التنبيه صامت'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <div className="hidden lg:flex flex-col text-left font-mono">
            <span className="text-sm font-black text-white">
              {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-gray-400">توقيت القاهرة</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
            title="قفل شاشة المطبخ"
          >
            <Lock size={18} />
          </button>
        </div>
      </header>

      {/* Main Kitchen Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row p-3 md:p-5 gap-5 overflow-hidden">
        
        {/* Left/Center: Orders Grid (Active or Ready) */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'active' ? (
            activeOrders.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[#14151B] border border-gray-800/80 rounded-3xl">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-black text-white mb-1">المطبخ هادئ تماماً! 👨‍🍳</h3>
                <p className="text-gray-400 text-sm">لا توجد أوردرات قيد التحضير حالياً. أي أوردر جديد سينزل هنا فوراً مع صوت تنبيه.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeOrders.map((order) => {
                  // Color coding by waiting time
                  const isUrgent = order.elapsedMins >= 20;
                  const isWarning = order.elapsedMins >= 10 && order.elapsedMins < 20;

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`bg-[#171821] rounded-2xl border-2 flex flex-col overflow-hidden shadow-xl transition-all ${
                        isUrgent
                          ? 'border-red-600 shadow-red-950/40'
                          : isWarning
                          ? 'border-amber-500 shadow-amber-950/30'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {/* Card Header */}
                      <div className={`p-3.5 flex items-center justify-between text-white ${
                        isUrgent ? 'bg-red-700' : isWarning ? 'bg-amber-600' : 'bg-gray-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg tracking-wider bg-black/30 px-2 py-0.5 rounded-md">
                            {order.displayId}
                          </span>
                          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                            {order.orderType === 'dinein' ? `🍽️ صالة ${order.tableNumber ? `(طاولة ${order.tableNumber})` : ''}` :
                             order.orderType === 'delivery' ? '🛵 دليفري' : '🛍️ تيك أواي'}
                          </span>
                        </div>

                        {/* Elapsed Timer & Quick Action */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 font-mono text-sm font-black bg-black/40 px-2.5 py-1 rounded-lg">
                            <Clock size={14} className={isUrgent ? 'animate-pulse text-yellow-300' : ''} />
                            <span>{formatElapsed(order.elapsedMins)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMarkServed(order)}
                            title="إتمام فوري / أرشفة"
                            className="p-1.5 bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white rounded-lg transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Customer / Table Notes */}
                      {(order.notes || order.deliveryAddress) && (
                        <div className="bg-[#111218] px-3.5 py-2 border-b border-gray-800 text-xs text-amber-300/90 font-medium flex items-start gap-1.5">
                          <AlertTriangle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                          <span>ملاحظة: {order.notes || order.deliveryAddress}</span>
                        </div>
                      )}

                      {/* Items List */}
                      <div className="p-3.5 flex-1 divide-y divide-gray-800/80 space-y-2.5 max-h-[380px] overflow-y-auto">
                        {order.items.map((item, idx) => {
                          const name = item.productName || item.product?.name || item.name || 'صنف';
                          const qty = Number(item.quantity) || 1;
                          const note = item.notes || item.Notes || '';
                          const addOns = item.addOns || item.selectedAddOns || item.SelectedAddOns || [];

                          return (
                            <div key={idx} className="pt-2.5 first:pt-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-base text-gray-100 leading-snug">
                                  {name}
                                </span>
                                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-sm font-black shrink-0">
                                  {qty}x
                                </span>
                              </div>

                              {/* Modifiers / Customizations */}
                              {(note || (Array.isArray(addOns) && addOns.length > 0)) && (
                                <div className="mt-1 bg-black/40 p-1.5 rounded-lg border border-gray-800 text-xs text-red-300 font-semibold space-y-0.5">
                                  {note && <div>⚠️ {note}</div>}
                                  {Array.isArray(addOns) && addOns.map((ad, aIdx) => (
                                    <div key={aIdx} className="text-amber-300 font-medium">
                                      + {typeof ad === 'string' ? ad : ad.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Button: Mark Ready (Triggers Pager Alert) */}
                      <div className="p-3 bg-[#111218] border-t border-gray-800">
                        <button
                          type="button"
                          onClick={() => handleMarkReady(order)}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-base rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 size={20} />
                          <span>تم التجهيز (Mark Ready) ✓</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          ) : (
            // Ready Orders Tab
            readyOrders.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[#14151B] border border-gray-800/80 rounded-3xl">
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-black text-white mb-1">لا توجد وجبات بالانتظار</h3>
                <p className="text-gray-400 text-sm">الوجبات الجاهزة للتسليم ستظهر هنا لتأكيد تسليمها للعميل أو الكاشير.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#171821] rounded-2xl border-2 border-emerald-500/50 flex flex-col overflow-hidden shadow-xl"
                  >
                    <div className="p-3.5 bg-emerald-700 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg bg-black/30 px-2 py-0.5 rounded-md">
                          {order.displayId}
                        </span>
                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                          {order.orderType === 'dinein' ? `🍽️ صالة ${order.tableNumber ? `(طاولة ${order.tableNumber})` : ''}` :
                           order.orderType === 'delivery' ? '🛵 دليفري' : '🛍️ تيك أواي'}
                        </span>
                      </div>
                      <span className="text-xs font-black bg-black/40 px-2.5 py-1 rounded-md">
                        جاهز الآن 🔔
                      </span>
                    </div>

                    <div className="p-3.5 flex-1 divide-y divide-gray-800 max-h-[300px] overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between text-sm">
                          <span className="text-gray-200 font-medium">{item.productName || item.product?.name || item.name}</span>
                          <span className="text-emerald-400 font-bold">{item.quantity}x</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-[#111218] border-t border-gray-800">
                      <button
                        type="button"
                        onClick={() => handleMarkServed(order)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check size={18} />
                        <span>تم تسليم الطلب (Served)</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right Sidebar: Batch Cooking (تجميع الأصناف المطلوبة) */}
        <div className="w-full lg:w-72 xl:w-80 bg-[#14151B] border border-gray-800/80 rounded-2xl p-4 flex flex-col h-auto lg:h-full max-h-[600px] lg:max-h-none overflow-hidden shrink-0">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-3">
            <Flame className="text-amber-500" size={20} />
            <div>
              <h2 className="text-sm font-black text-white">تجميع الأصناف المطلوبة</h2>
              <p className="text-[11px] text-gray-400">إجمالي المطلوب في المطبخ حالياً (Batch Cooking)</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-800/80 space-y-2">
            {batchItems.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                لا توجد أصناف مطلوبة حالياً
              </div>
            ) : (
              batchItems.map((bi, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-200">{bi.name}</h3>
                    <p className="text-[11px] text-gray-500">مطلوب في ({bi.ordersCount}) أوردرات</p>
                  </div>
                  <span className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    {bi.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
