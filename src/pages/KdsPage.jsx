import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Clock, CheckCircle2, X, Lock, Unlock, Volume2, VolumeX, 
  RotateCcw, AlertTriangle, Utensils, Bike, ShoppingBag, Eye, RefreshCw, ChevronRight, Check,
  ShieldCheck, ShieldAlert, Ban, QrCode, Key, Cpu, MonitorSmartphone, Laptop, Smartphone, HelpCircle, Loader2
} from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { APP_CONFIG } from '../config/appConfig';
import {
  getLocalKdsCredentials,
  saveLocalKdsCredentials,
  clearLocalKdsCredentials,
  generateHardwareProfile,
  validatePairingToken,
  registerKdsDevice,
  listenToKdsDeviceAuth,
  startKdsDeviceHeartbeat
} from '../utils/kdsDeviceSecurity';

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
  // -------------------------------------------------------------
  // 1. Zero-Trust Hardware Device Security States
  // -------------------------------------------------------------
  // 'loading' | 'unregistered' | 'pairing' | 'pending' | 'blocked' | 'approved'
  const [deviceAuthState, setDeviceAuthState] = useState('loading');
  const [kdsDevice, setKdsDevice] = useState(null);
  const [authError, setAuthError] = useState('');
  const [pairingTokenInput, setPairingTokenInput] = useState('');
  const [stationNameInput, setStationNameInput] = useState('');
  const [isSubmittingPairing, setIsSubmittingPairing] = useState(false);
  const [hardwareProfile, setHardwareProfile] = useState(() => generateHardwareProfile());

  // -------------------------------------------------------------
  // 2. KDS Workspace States
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'ready'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ordersMap, setOrdersMap] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);
  const [assemblyGuides, setAssemblyGuides] = useState({});
  const [timingConfig, setTimingConfig] = useState({
    standardKitchenPrepMinutes: 15,
    isRushHourMode: false,
    rushHourAdditionalMinutes: 15,
    effectiveKitchenPrepMinutes: 15
  });
  const [activeRecipeModal, setActiveRecipeModal] = useState(null); // { item, guide, order }

  // Find Sandwich Build Guide by Product ID or Name
  const findAssemblyGuide = (item) => {
    if (!item || !assemblyGuides) return null;
    const id = item.productId || item.ProductId || item.id || item.Id;
    if (id && assemblyGuides[id]) return assemblyGuides[id];

    const rawName = (item.productName || item.product?.name || item.name || '').trim().toLowerCase();
    if (!rawName) return null;

    return Object.values(assemblyGuides).find(g => {
      if (!g || !g.productName) return false;
      const gName = g.productName.trim().toLowerCase();
      return gName === rawName || rawName.includes(gName) || gName.includes(rawName);
    }) || null;
  };

  // Check if a layer is excluded or modified by customer request
  const checkLayerModification = (layer, itemNotes) => {
    if (!layer || !layer.name) return { isRemoved: false, isExtra: false, alertText: '' };
    const notesLower = String(itemNotes || '').toLowerCase();
    const layerNameLower = layer.name.toLowerCase();

    // Check removal patterns: "بدون", "من غير", "لا تحط", "شيل", "no ", "without "
    const removalKeywords = ['بدون', 'من غير', 'لا تحط', 'شيل', 'بلاش', 'no ', 'without '];
    for (const kw of removalKeywords) {
      if (notesLower.includes(kw)) {
        const afterKw = notesLower.split(kw)[1]?.slice(0, 30) || '';
        const tokens = layerNameLower.split(/[\s,،-]+/);
        for (const token of tokens) {
          if (token.length > 2 && afterKw.includes(token)) {
            return { isRemoved: true, isExtra: false, alertText: '❌ ملغي بطلب العميل!' };
          }
        }
      }
    }

    // Check extra/add patterns: "اكسترا", "إكسترا", "زيادة", "دبل", "extra", "double"
    const extraKeywords = ['اكسترا', 'إكسترا', 'زيادة', 'دبل', 'extra', 'double'];
    for (const kw of extraKeywords) {
      if (notesLower.includes(kw)) {
        const afterKw = notesLower.split(kw)[1]?.slice(0, 30) || '';
        const tokens = layerNameLower.split(/[\s,،-]+/);
        for (const token of tokens) {
          if (token.length > 2 && afterKw.includes(token)) {
            return { isRemoved: false, isExtra: true, alertText: '🔥 كمية إضافية (Extra) بطلب العميل!' };
          }
        }
      }
    }

    return { isRemoved: false, isExtra: false, alertText: '' };
  };

  const getLayerVisuals = (type) => {
    switch (String(type || '').toLowerCase()) {
      case 'bun':
        return {
          icon: '🍞',
          label: 'خبز',
          badgeBg: 'bg-amber-900/40 text-amber-300 border-amber-600/50',
          cardBg: 'bg-gradient-to-r from-amber-950/30 to-gray-900/50 border-amber-900/40'
        };
      case 'patty':
        return {
          icon: '🥩',
          label: 'لحم / دجاج',
          badgeBg: 'bg-rose-900/40 text-rose-300 border-rose-600/50',
          cardBg: 'bg-gradient-to-r from-rose-950/30 to-gray-900/50 border-rose-900/40'
        };
      case 'cheese':
        return {
          icon: '🧀',
          label: 'جبنة',
          badgeBg: 'bg-yellow-900/40 text-yellow-300 border-yellow-600/50',
          cardBg: 'bg-gradient-to-r from-yellow-950/30 to-gray-900/50 border-yellow-900/40'
        };
      case 'sauce':
        return {
          icon: '🥫',
          label: 'صوص',
          badgeBg: 'bg-orange-900/40 text-orange-300 border-orange-600/50',
          cardBg: 'bg-gradient-to-r from-orange-950/30 to-gray-900/50 border-orange-900/40'
        };
      case 'veggie':
        return {
          icon: '🥬',
          label: 'خضار طازج',
          badgeBg: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/50',
          cardBg: 'bg-gradient-to-r from-emerald-950/30 to-gray-900/50 border-emerald-900/40'
        };
      case 'topping':
        return {
          icon: '🥒',
          label: 'توبينج / مخلل',
          badgeBg: 'bg-teal-900/40 text-teal-300 border-teal-600/50',
          cardBg: 'bg-gradient-to-r from-teal-950/30 to-gray-900/50 border-teal-900/40'
        };
      default:
        return {
          icon: '✨',
          label: 'مكون',
          badgeBg: 'bg-gray-800 text-gray-300 border-gray-700',
          cardBg: 'bg-gray-900/50 border-gray-800'
        };
    }
  };

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // 3. Device Initialization & Realtime Firebase Auth Listener
  // -------------------------------------------------------------
  useEffect(() => {
    const profile = generateHardwareProfile();
    setHardwareProfile(profile);

    // Check if pairing token exists in URL or hash query
    let tokenFromUrl = '';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashSplit = window.location.hash.split('?')[1] || '';
      const hashParams = new URLSearchParams(hashSplit);
      tokenFromUrl = urlParams.get('pair') || hashParams.get('pair') || urlParams.get('token') || hashParams.get('token') || '';
    } catch { }

    const creds = getLocalKdsCredentials();

    if (creds && creds.deviceId) {
      setDeviceAuthState('loading');
      // Device already has local credentials -> listen in real-time to Firebase
      const unsubscribeAuth = listenToKdsDeviceAuth(creds.deviceId, (result) => {
        if (result.status === 'approved') {
          setDeviceAuthState('approved');
          setKdsDevice(result.device);
          setAuthError('');
        } else if (result.status === 'pending') {
          setDeviceAuthState('pending');
          setKdsDevice(result.device);
          setAuthError('');
        } else if (result.status === 'blocked') {
          setDeviceAuthState('blocked');
          setKdsDevice(result.device);
          setAuthError(result.error || '');
        } else if (result.status === 'unregistered') {
          setDeviceAuthState('unregistered');
          setKdsDevice(null);
          setAuthError(result.error || '');
        } else {
          setDeviceAuthState(result.status || 'unregistered');
          setAuthError(result.error || '');
        }
      });

      const stopHeartbeat = startKdsDeviceHeartbeat(creds.deviceId);

      return () => {
        unsubscribeAuth();
        stopHeartbeat();
      };
    } else if (tokenFromUrl) {
      setPairingTokenInput(tokenFromUrl.trim().toUpperCase());
      setDeviceAuthState('pairing');
    } else {
      setDeviceAuthState('unregistered');
    }
  }, []);

  // Immediate blocker check on mount
  useEffect(() => {
    try {
      if (localStorage.getItem('bb_kds_is_blocked') === 'true') {
        window.location.replace('https://www.google.com');
      }
    } catch { }
  }, []);

  // Auto redirect to Google if blocked
  useEffect(() => {
    if (deviceAuthState === 'blocked') {
      try {
        localStorage.setItem('bb_kds_is_blocked', 'true');
      } catch { }
      const timer = setTimeout(() => {
        window.location.replace('https://www.google.com');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [deviceAuthState]);

  // Submit Pairing & Register Device
  const handleRegisterDevice = async (e) => {
    if (e) e.preventDefault();
    const cleanToken = pairingTokenInput.trim().toUpperCase();
    if (!cleanToken) {
      setAuthError('يرجى إدخال كود التفعيل أو مسح رابط الاقتران.');
      return;
    }

    setIsSubmittingPairing(true);
    setAuthError('');

    try {
      const registered = await registerKdsDevice(cleanToken, stationNameInput.trim());
      setKdsDevice({
        deviceId: registered.deviceId,
        deviceName: registered.deviceName,
        status: 'pending'
      });
      setDeviceAuthState('pending');

      // Start real-time listener for the new device
      listenToKdsDeviceAuth(registered.deviceId, (result) => {
        if (result.status === 'approved') {
          setDeviceAuthState('approved');
          setKdsDevice(result.device);
          setAuthError('');
        } else if (result.status === 'blocked') {
          setDeviceAuthState('blocked');
          setKdsDevice(result.device);
          setAuthError(result.error || '');
        } else if (result.status === 'pending') {
          setDeviceAuthState('pending');
          setKdsDevice(result.device);
        }
      });

      startKdsDeviceHeartbeat(registered.deviceId);
    } catch (err) {
      setAuthError(err?.message || 'فشل تسجيل واقتران الجهاز.');
    } finally {
      setIsSubmittingPairing(false);
    }
  };

  // Disconnect / Unlink Device
  const handleUnlinkDevice = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إلغاء ربط هذه الشاشة؟ سيتطلب الأمر كود تفعيل جديد من الكاشير لإعادة تشغيلها.')) {
      clearLocalKdsCredentials();
      setDeviceAuthState('unregistered');
      setKdsDevice(null);
      setPairingTokenInput('');
      setStationNameInput('');
      setAuthError('');
    }
  };

  // -------------------------------------------------------------
  // 4. Realtime Firebase Orders Listener (Runs ONLY When Approved!)
  // -------------------------------------------------------------
  useEffect(() => {
    if (deviceAuthState !== 'approved') return;

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
    }, (err) => {
      console.warn('Firebase OrderTracking listener error:', err?.message || err);
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
    }, (err) => {
      console.warn('Firebase Orders listener error:', err?.message || err);
    });

    // Listen to SandwichAssemblyGuides node for chef recipes
    const guidesRef = ref(db, 'SandwichAssemblyGuides');
    const unsubscribeGuides = onValue(guidesRef, (snapshot) => {
      if (snapshot.exists()) {
        setAssemblyGuides(snapshot.val() || {});
      }
    }, (err) => {
      console.warn('Firebase SandwichAssemblyGuides listener error:', err?.message || err);
    });

    // Listen to live TimingConfig for Rush Hour and Target prep minutes
    const timingRef = ref(db, 'TimingConfig');
    const unsubscribeTiming = onValue(timingRef, (snapshot) => {
      if (snapshot.exists()) {
        setTimingConfig(snapshot.val() || {});
      }
    }, (err) => {
      console.warn('Firebase TimingConfig error:', err?.message || err);
    });

    return () => {
      unsubscribeTracking();
      unsubscribeOrders();
      unsubscribeGuides();
      unsubscribeTiming();
    };
  }, [deviceAuthState]);

  // Convert raw map to array of normalized orders
  const ordersList = useMemo(() => {
    return Object.entries(ordersMap).map(([key, val]) => {
      const id = val.OrderNumber || val.displayOrderId || key;
      const cleanId = String(id).replace(/#/g, '').trim();
      const status = val.Status || 'InKitchen';
      const orderType = (val.OrderType || val.orderType || 'takeaway').toLowerCase();
      
      // Parse OrderDate
      let orderDate = new Date();
      const rawDate = val.OrderDate || val.CreatedAt || val.createdAt || val.LastUpdate;
      if (rawDate) {
        const iso = String(rawDate).includes(' ') && !String(rawDate).includes('T')
          ? String(rawDate).replace(' ', 'T')
          : String(rawDate);
        const parsed = new Date(iso);
        if (!isNaN(parsed.getTime())) orderDate = parsed;
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
    if (deviceAuthState !== 'approved') return;

    const currentActiveIds = new Set(
      ordersList
        .filter(o => ['inkitchen', 'new', 'pending', 'preparing'].includes(o.status) && o.items?.length > 0 && o.elapsedMins <= 1440)
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
  }, [ordersList, soundEnabled, deviceAuthState]);

  // Separate Active and Ready orders
  const activeOrders = useMemo(() => {
    return ordersList
      .filter(o => 
        ['inkitchen', 'new', 'pending', 'preparing'].includes(o.status) &&
        o.items && o.items.length > 0 &&
        o.elapsedMins <= 1440
      )
      .sort((a, b) => a.orderDate - b.orderDate);
  }, [ordersList]);

  const readyOrders = useMemo(() => {
    return ordersList
      .filter(o => 
        o.status === 'ready' &&
        o.items && o.items.length > 0 &&
        o.elapsedMins <= 1440
      )
      .sort((a, b) => b.orderDate - a.orderDate);
  }, [ordersList]);

  // Calculate Batch Cooking Items (Active Cooking vs Held Waiting)
  const { batchItems, heldBatchItems } = useMemo(() => {
    const firedMap = {};
    const heldMap = {};
    activeOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const isHeld = item.isHeld === true || String(item.fireStatus || '').toLowerCase() === 'hold';
        const name = (item.productName || item.product?.name || item.name || 'صنف').trim();
        const qty = Number(item.quantity) || 1;
        const targetMap = isHeld ? heldMap : firedMap;
        if (!targetMap[name]) {
          targetMap[name] = { name, count: 0, ordersCount: 0 };
        }
        targetMap[name].count += qty;
        targetMap[name].ordersCount += 1;
      });
    });
    return {
      batchItems: Object.values(firedMap).sort((a, b) => b.count - a.count),
      heldBatchItems: Object.values(heldMap).sort((a, b) => b.count - a.count)
    };
  }, [activeOrders]);

  // Action: Fire all held items in an order (إطلاق الوجبات للطهي الفوري)
  const handleFireOrder = async (order) => {
    try {
      const updatedItems = (order.items || []).map(item => ({
        ...item,
        isHeld: false,
        fireStatus: 'Fired'
      }));

      const updates = {};
      updates[`OrderTracking/${order.id}/Items`] = updatedItems;
      if (order.orderKey) {
        updates[`Orders/${order.orderKey}/items`] = updatedItems;
      }
      // Instant push notification for Desktop POS
      updates[`KitchenUpdates/${order.id}`] = {
        OrderNumber: order.id,
        Action: 'FireMains',
        FireStatus: 'Fired',
        Timestamp: new Date().toISOString()
      };

      await update(ref(db), updates);
      if (soundEnabled) playKitchenChime();
    } catch (e) {
      alert('خطأ أثناء إطلاق الوجبات: ' + e.message);
    }
  };

  // Action: Toggle a single item hold/fire status
  const handleToggleItemHold = async (order, itemIdx) => {
    try {
      const updatedItems = (order.items || []).map((item, i) => {
        if (i !== itemIdx) return item;
        const currentHeld = item.isHeld === true || String(item.fireStatus || '').toLowerCase() === 'hold';
        return {
          ...item,
          isHeld: !currentHeld,
          fireStatus: !currentHeld ? 'Hold' : 'Fired'
        };
      });

      const toggledItem = updatedItems[itemIdx];

      const updates = {};
      updates[`OrderTracking/${order.id}/Items`] = updatedItems;
      if (order.orderKey) {
        updates[`Orders/${order.orderKey}/items`] = updatedItems;
      }
      updates[`KitchenUpdates/${order.id}`] = {
        OrderNumber: order.id,
        Action: 'ToggleItemHold',
        ItemIndex: itemIdx,
        ItemName: order.items[itemIdx]?.productName || '',
        FireStatus: toggledItem?.fireStatus || 'Fired',
        Timestamp: new Date().toISOString()
      };

      await update(ref(db), updates);
      if (soundEnabled && toggledItem?.fireStatus === 'Fired') playKitchenChime();
    } catch (e) {
      alert('خطأ أثناء تعديل حالة الصنف: ' + e.message);
    }
  };

  // Action: Mark as Ready (triggers customer phone buzzer & instant POS sync!)
  const handleMarkReady = async (order) => {
    try {
      const updates = {};
      updates[`OrderTracking/${order.id}/Status`] = 'Ready';
      updates[`PublicTracking/${order.id}/Status`] = 'Ready';
      updates[`PublicTracking/${order.id}/LastUpdate`] = new Date().toISOString();
      // Sync aliases (e.g. 18, 0018, 0018-ORD) for customer digital pager
      const digitMatch = String(order.id).match(/\d+/);
      if (digitMatch) {
        const num = parseInt(digitMatch[0], 10);
        if (!isNaN(num)) {
          const p4 = String(num).padStart(4, '0');
          const plain = String(num);
          const aliases = [p4, plain, `${p4}-ORD`, `${plain}-ORD`, `ORD-${p4}`, `ORD-${plain}`];
          aliases.forEach(a => {
            updates[`PublicTracking/${a}/Status`] = 'Ready';
            updates[`PublicTracking/${a}/LastUpdate`] = new Date().toISOString();
          });
        }
      }
      if (order.orderKey) {
        updates[`Orders/${order.orderKey}/Status`] = 'Ready';
      }
      // Instant push notification queue for Desktop POS
      updates[`KitchenUpdates/${order.id}`] = {
        OrderNumber: order.id,
        Status: 'Ready',
        Timestamp: new Date().toISOString()
      };

      await update(ref(db), updates);
      if (soundEnabled) playKitchenChime();
    } catch (e) {
      alert('خطأ في تحديث الطلب: ' + e.message);
    }
  };

  // Action: Mark as Served / Completed (instantly updates Desktop POS & completes order)
  const handleMarkServed = async (order) => {
    try {
      const updates = {};
      updates[`OrderTracking/${order.id}/Status`] = 'Completed';
      updates[`PublicTracking/${order.id}/Status`] = 'Completed';
      updates[`PublicTracking/${order.id}/LastUpdate`] = new Date().toISOString();
      // Sync aliases (e.g. 18, 0018, 0018-ORD)
      const digitMatchServed = String(order.id).match(/\d+/);
      if (digitMatchServed) {
        const num = parseInt(digitMatchServed[0], 10);
        if (!isNaN(num)) {
          const p4 = String(num).padStart(4, '0');
          const plain = String(num);
          const aliases = [p4, plain, `${p4}-ORD`, `${plain}-ORD`, `ORD-${p4}`, `ORD-${plain}`];
          aliases.forEach(a => {
            updates[`PublicTracking/${a}/Status`] = 'Completed';
            updates[`PublicTracking/${a}/LastUpdate`] = new Date().toISOString();
          });
        }
      }
      if (order.orderKey) {
        updates[`Orders/${order.orderKey}/Status`] = 'Completed';
      }
      // Instant push notification queue for Desktop POS
      updates[`KitchenUpdates/${order.id}`] = {
        OrderNumber: order.id,
        Status: 'Completed',
        Timestamp: new Date().toISOString()
      };

      await update(ref(db), updates);
    } catch (e) {
      alert('خطأ في إتمام الطلب: ' + e.message);
    }
  };

  // -------------------------------------------------------------
  // 5. SECURITY VIEWS (Zero-Trust Lock / Pairing / Pending / Blocked)
  // -------------------------------------------------------------

  // View A: Loading Spinner
  if (deviceAuthState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(230,57,70,0.2)]">
          <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
        </div>
        <h2 className="text-xl font-black mb-1">التحقق من الأمان وتشفير الجهاز...</h2>
        <p className="text-gray-400 text-xs">The Black Box • Secure Kitchen Display System</p>
      </div>
    );
  }

  // View B: Blocked Device (Permanent Deny -> Immediate Redirect to Google)
  if (deviceAuthState === 'blocked') {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#121216] border-2 border-red-600/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(239,68,68,0.35)]">
            <Ban className="w-8 h-8 text-red-500 animate-pulse" />
          </div>

          <h2 className="text-xl font-black text-white mb-2">تم حظر هذا الجهاز</h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-5">
            تم رفض اعتماد هذا الجهاز وحظره نهائياً من قبل الإدارة. لا تملك صلاحية الوصول.
          </p>

          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3 text-center mb-5 animate-pulse">
            <p className="text-xs text-red-300 font-bold mb-0.5">⚠️ تم إنهاء الجلسة</p>
            <p className="text-[11px] text-gray-400">جاري تحويلك إلى Google...</p>
          </div>

          <button
            type="button"
            onClick={() => window.location.replace('https://www.google.com')}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            الخروج الآن (Google)
          </button>
        </motion.div>
      </div>
    );
  }

  // View C: Pending Approval (Waiting for POS Admin Approval)
  if (deviceAuthState === 'pending') {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#13141B] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            <Clock className="w-8 h-8 text-amber-400 animate-spin" />
          </div>

          <span className="inline-block px-3 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black mb-2">
            في انتظار اعتماد المدير (Pending)
          </span>

          <h2 className="text-xl font-black text-white mb-2">طلب الاقتران قيد المراجعة</h2>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-5">
            تم إرسال طلب اقتران الشاشة. يرجى من مسؤول الكاشير (POS) الضغط على زر <strong className="text-emerald-400">«موافقة / Approve»</strong> في قائمة أجهزة المطبخ لتفعيل البث المباشر.
          </p>

          <div className="bg-black/50 rounded-2xl p-4 border border-amber-500/20 text-right space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">معرف الجهاز (Device ID):</span>
              <span className="font-mono text-base font-black text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                {kdsDevice?.deviceId || 'KDS-INIT'}
              </span>
            </div>
            {kdsDevice?.deviceName && (
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-800/80 pt-2">
                <span>اسم الشاشة:</span>
                <span className="text-gray-200 font-bold">{kdsDevice.deviceName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 mb-5 bg-emerald-950/30 border border-emerald-500/30 py-2 px-3 rounded-xl animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>متصل لحظياً: ستفتح الشاشة تلقائياً فور موافقة الكاشير</span>
          </div>

          <button
            type="button"
            onClick={handleUnlinkDevice}
            className="text-xs text-gray-400 hover:text-red-400 underline transition-colors"
          >
            إلغاء الطلب والربط بكود آخر
          </button>
        </motion.div>
      </div>
    );
  }

  // View D: Pairing Setup (URL has token or user clicked pair)
  if (deviceAuthState === 'pairing') {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#13141B] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-red/20 border border-brand-red/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(230,57,70,0.3)]">
            <Key className="w-8 h-8 text-brand-red" />
          </div>

          <h2 className="text-xl font-black mb-1">اقتران شاشة المطبخ</h2>
          <p className="text-gray-400 text-xs sm:text-sm mb-5">تأكيد تسجيل الجهاز وربطه بـ The Black Box KDS</p>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs font-bold text-red-300 text-right flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterDevice} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">كود الاقتران والتفعيل (Pairing Token):</label>
              <input
                type="text"
                value={pairingTokenInput}
                onChange={(e) => setPairingTokenInput(e.target.value.toUpperCase())}
                placeholder="KDS-PAIR-XXXX-XXXX"
                className="w-full py-3 px-4 bg-black border border-gray-700 rounded-xl font-mono text-center text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">اسم الشاشة أو المحطة بالمطبخ:</label>
              <input
                type="text"
                value={stationNameInput}
                onChange={(e) => setStationNameInput(e.target.value)}
                placeholder="مثال: شاشة المطبخ 1 (البرجر واللحوم)"
                className="w-full py-3 px-4 bg-black border border-gray-700 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingPairing}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-dark disabled:bg-gray-700 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmittingPairing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>جاري تسجيل الجهاز...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>إرسال طلب الاعتماد للكاشير</span>
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setDeviceAuthState('unregistered')}
            className="mt-4 text-xs text-gray-400 hover:text-white"
          >
            الرجوع إلى شاشة القفل الرئيسية
          </button>
        </motion.div>
      </div>
    );
  }

  // View E: Unregistered (Zero-Trust Lock Screen)
  if (deviceAuthState === 'unregistered') {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#13141B] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-red/15 border border-brand-red/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(230,57,70,0.25)]">
            <Lock className="w-8 h-8 text-brand-red animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black mb-1 tracking-wide">شاشة المطبخ (KDS)</h2>
          <p className="text-gray-400 text-xs sm:text-sm mb-6 leading-relaxed">
            هذه الشاشة مخصصة لطاقم المطبخ فقط وتتطلب تفعيل مسبق.
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs font-bold text-red-300 text-right flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setDeviceAuthState('pairing')}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-dark active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key size={18} />
              <span>إدخال كود التفعيل</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. APPROVED KDS WORKSPACE (Live Interactive Kitchen System)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0C0D11] text-white flex flex-col font-sans select-none overflow-x-hidden" dir="rtl">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#14151B] border-b border-gray-800/80 px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
        
        {/* Left: Brand, Device Badge & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(230,57,70,0.4)]">
            <Flame size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2 flex-wrap">
              <span>شاشة المطبخ الذكية (KDS)</span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                متصل لحظياً
              </span>
              {timingConfig.isRushHourMode && (
                <span className="bg-orange-500/20 border border-orange-500/50 text-orange-400 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  🔥 ضغط طلبات (+{timingConfig.rushHourAdditionalMinutes || 15} دقيقة)
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>{kdsDevice?.deviceName || 'شاشة المطبخ'}</span>
              </span>
              <span className="text-gray-600">•</span>
              <span className="font-mono text-[11px] text-gray-500">{kdsDevice?.deviceId}</span>
            </div>
          </div>
        </div>

        {/* Center: Tabs Switcher */}
        <div className="flex items-center bg-[#0C0D11] p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
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
            className={`px-4 sm:px-6 py-2 rounded-lg font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
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

        {/* Right: Sound toggle, Clock & Security Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
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
            onClick={handleUnlinkDevice}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-red-950/60 hover:text-red-400 text-gray-300 border border-gray-700 hover:border-red-500/40 transition-colors cursor-pointer"
            title="إلغاء ربط هذا الجهاز / قفل الشاشة"
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
                  // Target Kitchen Prep Time calculation
                  const targetPrepMins = Number(order.estimatedKitchenMinutes || timingConfig.effectiveKitchenPrepMinutes || 15);
                  const remainingToTarget = targetPrepMins - order.elapsedMins;
                  const isDelayed = remainingToTarget < 0;
                  const isNearTarget = remainingToTarget >= 0 && remainingToTarget <= 4;
                  const isUrgent = isDelayed || order.elapsedMins >= 25;
                  const isWarning = !isDelayed && (isNearTarget || (order.elapsedMins >= 12 && order.elapsedMins < 25));

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
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 font-mono text-sm font-black bg-black/40 px-2.5 py-0.5 rounded-lg">
                              <Clock size={13} className={isUrgent ? 'animate-pulse text-yellow-300' : ''} />
                              <span>{formatElapsed(order.elapsedMins)}</span>
                            </div>
                            <div className="text-[10px] font-black px-1.5 py-0.5 rounded">
                              {isDelayed ? (
                                <span className="bg-red-500/30 text-red-200 border border-red-500/50 px-1.5 py-0.5 rounded font-black animate-pulse">
                                  🚨 تأخير: +{Math.abs(remainingToTarget)} د
                                </span>
                              ) : isNearTarget ? (
                                <span className="bg-amber-500/30 text-amber-200 border border-amber-500/50 px-1.5 py-0.5 rounded font-black">
                                  ⚠️ متبقي: {remainingToTarget} د
                                </span>
                              ) : (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                                  ⏱️ هدف: {remainingToTarget} د
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMarkServed(order)}
                            title="إتمام فوري / أرشفة"
                            className="p-1.5 bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
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
                          const isHeld = item.isHeld || String(item.fireStatus || '').toLowerCase() === 'hold';
                          const guide = findAssemblyGuide(item);

                          return (
                            <div key={idx} className="pt-2.5 first:pt-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-base text-gray-100 leading-snug">
                                    {name}
                                  </span>
                                  {guide && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveRecipeModal({ item, guide, order })}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold hover:bg-amber-500/30 active:scale-95 transition-all cursor-pointer shadow-sm"
                                      title="عرض طريقة وتكوين الساندوتش للشيف"
                                    >
                                      <span>🍔 تكوين</span>
                                    </button>
                                  )}
                                </div>
                                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-sm font-black shrink-0">
                                  {qty}x
                                </span>
                              </div>
                              {/* Hold (معلق) Interactive Badge */}
                              <div className="mt-1">
                                {isHeld ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleItemHold(order, idx)}
                                    title="انقر لإطلاق هذا الصنف للطهي الفوري"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
                                  >
                                    <Clock size={12} className="text-amber-400" />
                                    <span>⏳ معلق (Hold) - انقر للطهي 🚀</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleItemHold(order, idx)}
                                    title="انقر لتعليق هذا الصنف مؤقتاً"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-gray-500 hover:text-amber-400 hover:bg-gray-800/60 transition-all cursor-pointer"
                                  >
                                    <span>🔥 جارٍ التحضير (انقر للتعليق)</span>
                                  </button>
                                )}
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

                      {/* Action Button: Mark Ready (Triggers Pager Alert) & Fire Mains */}
                      <div className="p-3 bg-[#111218] border-t border-gray-800">
                        {order.items && order.items.some(i => i.isHeld === true || String(i.fireStatus || '').toLowerCase() === 'hold') && (
                          <button
                            type="button"
                            onClick={() => handleFireOrder(order)}
                            className="w-full mb-2.5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-gray-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-orange-950/60 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Flame size={18} className="text-gray-950 animate-pulse" />
                            <span>إطلاق الوجبات ({order.items.filter(i => i.isHeld === true || String(i.fireStatus || '').toLowerCase() === 'hold').length}) للطهي الفوري 🚀</span>
                          </button>
                        )}
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

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Active Items to Cook */}
            <div>
              <div className="text-[11px] font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>أصناف جارية للطهي الآن ({batchItems.reduce((s, x) => s + x.count, 0)})</span>
              </div>
              {batchItems.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-xs bg-gray-900/40 rounded-xl border border-gray-800/50">
                  لا توجد أصناف قيد الطهي حالياً
                </div>
              ) : (
                <div className="divide-y divide-gray-800/80 space-y-2">
                  {batchItems.map((bi, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm text-gray-200">{bi.name}</h3>
                        <p className="text-[11px] text-gray-500">مطلوب في ({bi.ordersCount}) أوردرات</p>
                      </div>
                      <span className="w-9 h-9 rounded-xl bg-amber-500 text-gray-950 font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                        {bi.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Held Items Waiting for Fire */}
            {heldBatchItems.length > 0 && (
              <div className="pt-3 border-t border-gray-800/80">
                <div className="text-[11px] font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-400" />
                  <span>أصناف معلقة بانتظار الإطلاق ({heldBatchItems.reduce((s, x) => s + x.count, 0)})</span>
                </div>
                <div className="divide-y divide-gray-800/80 space-y-2">
                  {heldBatchItems.map((bi, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between gap-3 opacity-80">
                      <div>
                        <h3 className="font-bold text-sm text-amber-200/90">{bi.name}</h3>
                        <p className="text-[11px] text-gray-500">معلق في ({bi.ordersCount}) أوردرات</p>
                      </div>
                      <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-sm flex items-center justify-center shrink-0">
                        {bi.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. Chef Recipe & Sandwich Build Modal                         */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {activeRecipeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
            onClick={() => setActiveRecipeModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#12131A] border border-gray-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 md:p-5 bg-gradient-to-r from-gray-900 via-[#181924] to-gray-900 border-b border-gray-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
                    🍔
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                        {activeRecipeModal.guide?.productName || activeRecipeModal.item?.productName || activeRecipeModal.item?.name}
                      </h2>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md text-xs font-black">
                        طلب #{activeRecipeModal.order?.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      دليل رص المكونات ومواصفات الطهي المعتمدة للشيف 👨‍🍳
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveRecipeModal(null)}
                  className="w-10 h-10 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
                {/* Customer Special Notes & Customizations Warning */}
                {(activeRecipeModal.item?.notes || activeRecipeModal.item?.Notes || (Array.isArray(activeRecipeModal.item?.addOns) && activeRecipeModal.item.addOns.length > 0)) && (
                  <div className="bg-red-950/40 border-2 border-red-500/60 rounded-xl p-3.5 space-y-1.5 shadow-lg">
                    <div className="flex items-center gap-2 text-red-400 font-black text-sm">
                      <AlertTriangle size={18} className="animate-pulse" />
                      <span>تنبيه هام للشيف: طلبات وتعديلات العميل الخاصة!</span>
                    </div>
                    {(activeRecipeModal.item?.notes || activeRecipeModal.item?.Notes) && (
                      <div className="text-sm font-bold text-red-200 bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-800/50">
                        ⚠️ الملاحظة: «{activeRecipeModal.item.notes || activeRecipeModal.item.Notes}»
                      </div>
                    )}
                    {Array.isArray(activeRecipeModal.item?.addOns) && activeRecipeModal.item.addOns.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeRecipeModal.item.addOns.map((ad, idx) => (
                          <span key={idx} className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-lg font-bold">
                            + {typeof ad === 'string' ? ad : ad.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chef Specs & Timing Banner */}
                {(activeRecipeModal.guide?.grillingTemp || activeRecipeModal.guide?.cookingTimeSeconds || activeRecipeModal.guide?.toastingTimeSeconds || activeRecipeModal.guide?.prepNotes) && (
                  <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3.5 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/40 border border-gray-800 rounded-lg p-2">
                        <div className="text-[11px] text-gray-400 font-semibold">حرارة الجريل</div>
                        <div className="text-base font-black text-orange-400 mt-0.5">
                          🔥 {activeRecipeModal.guide?.grillingTemp || 220}°C
                        </div>
                      </div>
                      <div className="bg-black/40 border border-gray-800 rounded-lg p-2">
                        <div className="text-[11px] text-gray-400 font-semibold">مدة طهي اللحم</div>
                        <div className="text-base font-black text-cyan-400 mt-0.5">
                          ⏱️ {activeRecipeModal.guide?.cookingTimeSeconds || 120} ث
                        </div>
                      </div>
                      <div className="bg-black/40 border border-gray-800 rounded-lg p-2">
                        <div className="text-[11px] text-gray-400 font-semibold">تحميص الخبز</div>
                        <div className="text-base font-black text-amber-400 mt-0.5">
                          🍞 {activeRecipeModal.guide?.toastingTimeSeconds || 30} ث
                        </div>
                      </div>
                    </div>

                    {activeRecipeModal.guide?.prepNotes && (
                      <div className="bg-black/30 border border-gray-800/80 rounded-lg p-2.5 text-xs text-gray-300 leading-relaxed">
                        <span className="font-bold text-amber-400 ml-1">تعليمات التحضير:</span>
                        {activeRecipeModal.guide.prepNotes}
                      </div>
                    )}
                  </div>
                )}

                {/* Sandwich Layers Visual Stack */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span>⬇️ ابدأ بالرص من الخبز السفلي وصولاً للأعلى ⬆️</span>
                    </span>
                    <span>
                      إجمالي ({activeRecipeModal.guide?.layers?.length || 0}) طبقات
                    </span>
                  </div>

                  {Array.isArray(activeRecipeModal.guide?.layers) && activeRecipeModal.guide.layers.length > 0 ? (
                    <div className="space-y-2">
                      {activeRecipeModal.guide.layers.map((layer, lIdx) => {
                        const mod = checkLayerModification(layer, activeRecipeModal.item?.notes || activeRecipeModal.item?.Notes);
                        const visuals = getLayerVisuals(layer.type);

                        return (
                          <div
                            key={lIdx}
                            className={`p-3 rounded-xl border transition-all ${
                              mod.isRemoved
                                ? 'bg-red-950/40 border-red-500/70 opacity-75'
                                : mod.isExtra
                                ? 'bg-amber-950/40 border-amber-500/70 shadow-md'
                                : visuals.cardBg
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-black/50 border border-gray-700/60 font-black text-sm flex items-center justify-center text-gray-200 shrink-0">
                                  #{lIdx + 1}
                                </span>
                                <span className="text-2xl shrink-0" title={visuals.label}>
                                  {visuals.icon}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-bold text-sm md:text-base ${
                                      mod.isRemoved ? 'line-through text-red-300' : 'text-gray-100'
                                    }`}>
                                      {layer.name}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${visuals.badgeBg}`}>
                                      {visuals.label}
                                    </span>
                                  </div>
                                  {layer.notes && !mod.isRemoved && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      💡 {layer.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Alert Badges */}
                              {mod.isRemoved ? (
                                <span className="bg-red-500/30 text-red-300 border border-red-500/50 text-xs font-black px-2.5 py-1 rounded-lg shrink-0">
                                  {mod.alertText}
                                </span>
                              ) : mod.isExtra ? (
                                <span className="bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-black px-2.5 py-1 rounded-lg shrink-0 animate-pulse">
                                  {mod.alertText}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm bg-gray-900/40 rounded-xl border border-gray-800">
                      لم يتم تسجيل طبقات تفصيلية لهذا الصنف في السيستم بعد.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-900/90 border-t border-gray-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setActiveRecipeModal(null)}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={18} />
                  <span>فهمت الدليل، عودة للأوردرات ✓</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
