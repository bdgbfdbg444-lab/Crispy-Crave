import { ref, get, set, update, onValue } from 'firebase/database';
import { db } from '../firebase';
import { getClientIp } from './deviceTracker';

// -------------------------------------------------------------
// 1. Hardware Fingerprint Utilities
// -------------------------------------------------------------

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase();
}

function getGpuRenderer() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'WebGL-Generic';
      }
    }
  } catch { }
  return 'WebGL-Unavailable';
}

function getCanvasHash() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas-none';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('TheBlackBox-KDS', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('TheBlackBox-KDS', 4, 17);
    return simpleHash(canvas.toDataURL());
  } catch {
    return 'canvas-fallback';
  }
}

export function generateHardwareProfile() {
  const gpu = getGpuRenderer();
  const canvasHash = getCanvasHash();
  const screenSpec = `${window.screen?.width || 0}x${window.screen?.height || 0}@${window.screen?.colorDepth || 0}`;
  const cores = navigator.hardwareConcurrency || 4;
  const platform = navigator.platform || 'Unknown';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const rawFingerprint = `${gpu}::${canvasHash}::${screenSpec}::${cores}::${platform}::${tz}`;
  const fingerprintHash = simpleHash(rawFingerprint);

  // Friendly Device Platform string (e.g. "Android Tablet / Chrome" or "Windows PC / Chrome")
  let friendlyDevice = 'جهاز كمبيوتر / متصفح';
  const ua = navigator.userAgent || '';
  if (/iPad|tablet|PlayBook/i.test(ua) || (navigator.maxTouchPoints > 1 && window.screen.width >= 768)) {
    friendlyDevice = 'تابلت لوحي (Tablet)';
  } else if (/Android/i.test(ua)) {
    friendlyDevice = 'جهاز أندرويد (Android)';
  } else if (/iPhone|iPod/i.test(ua)) {
    friendlyDevice = 'جهاز آيفون (iOS)';
  } else if (/Windows/i.test(ua)) {
    friendlyDevice = 'كمبيوتر ويندوز (Windows)';
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    friendlyDevice = 'جهاز ماك (macOS)';
  }

  return {
    fingerprintHash,
    gpu,
    screenSpec,
    platform,
    friendlyDevice,
    userAgent: ua
  };
}

// -------------------------------------------------------------
// 2. Local Device Credentials Management
// -------------------------------------------------------------

const STORAGE_KEYS = {
  DEVICE_ID: 'bb_kds_device_id',
  DEVICE_SECRET: 'bb_kds_device_secret',
  DEVICE_NAME: 'bb_kds_device_name',
  FINGERPRINT: 'bb_kds_fingerprint'
};

export function getLocalKdsCredentials() {
  try {
    const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    const deviceSecret = localStorage.getItem(STORAGE_KEYS.DEVICE_SECRET);
    const deviceName = localStorage.getItem(STORAGE_KEYS.DEVICE_NAME);
    const savedFingerprint = localStorage.getItem(STORAGE_KEYS.FINGERPRINT);
    if (!deviceId || !deviceSecret) return null;
    return { deviceId, deviceSecret, deviceName, savedFingerprint };
  } catch {
    return null;
  }
}

export function saveLocalKdsCredentials(deviceId, deviceSecret, deviceName, fingerprint) {
  try {
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    localStorage.setItem(STORAGE_KEYS.DEVICE_SECRET, deviceSecret);
    if (deviceName) localStorage.setItem(STORAGE_KEYS.DEVICE_NAME, deviceName);
    if (fingerprint) localStorage.setItem(STORAGE_KEYS.FINGERPRINT, fingerprint);
  } catch (e) {
    console.warn('Failed to save KDS credentials to storage:', e);
  }
}

export function clearLocalKdsCredentials() {
  try {
    localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.DEVICE_SECRET);
    localStorage.removeItem(STORAGE_KEYS.DEVICE_NAME);
    localStorage.removeItem(STORAGE_KEYS.FINGERPRINT);
    localStorage.removeItem('kds_auth');
  } catch { }
}

function generateRandomHex(length = 4) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, length);
}

// -------------------------------------------------------------
// 3. Pairing and Registration Functions
// -------------------------------------------------------------

/**
 * Validates a pairing token from Firebase.
 * Returns { valid: boolean, error?: string, tokenData?: object }
 */
export async function validatePairingToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'كود أو رابط التفعيل غير صالح.' };
  }
  const cleanToken = token.trim().toUpperCase();

  try {
    const tokenRef = ref(db, `KdsPairingTokens/${cleanToken}`);
    const snap = await get(tokenRef);
    if (!snap.exists()) {
      return { valid: false, error: 'رابط التفعيل غير صحيح أو تم حذفه من قبل الإدارة.' };
    }
    const data = snap.val();
    if (data.isUsed) {
      return { valid: false, error: 'تم استخدام رابط التفعيل هذا مسبقاً لجهاز آخر.' };
    }
    if (data.expiresAt && Date.now() > data.expiresAt) {
      return { valid: false, error: 'انتهت صلاحية رابط التفعيل. يرجى طلب رابط جديد من الكاشير.' };
    }
    return { valid: true, tokenData: data, cleanToken };
  } catch (err) {
    return { valid: false, error: 'حدث خطأ أثناء فحص رابط التفعيل: ' + (err?.message || err) };
  }
}

/**
 * Registers a new KDS device with Firebase using a valid pairing token.
 * Sets status to 'pending' waiting for POS Admin approval.
 */
export async function registerKdsDevice(token, userChosenName = '') {
  const tokenCheck = await validatePairingToken(token);
  if (!tokenCheck.valid) {
    throw new Error(tokenCheck.error);
  }

  const profile = generateHardwareProfile();
  const deviceId = `KDS-${generateRandomHex(4)}-${generateRandomHex(4)}`;
  const deviceSecret = `sec_${Date.now()}_${generateRandomHex(16)}`;
  const clientIp = await getClientIp();

  const finalName = userChosenName.trim() || `${profile.friendlyDevice} (${deviceId})`;

  const devicePayload = {
    deviceId,
    deviceName: finalName,
    deviceSecret,
    fingerprint: profile.fingerprintHash,
    gpu: profile.gpu,
    screenSpec: profile.screenSpec,
    platform: profile.platform,
    friendlyDevice: profile.friendlyDevice,
    userAgent: profile.userAgent,
    ip: clientIp,
    status: 'pending', // Initial state: pending admin approval
    pairingTokenUsed: tokenCheck.cleanToken,
    requestedAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    blockedAt: null,
    lastActiveAt: new Date().toISOString()
  };

  // 1. Save device in Firebase
  const deviceRef = ref(db, `KdsAuthorizedDevices/${deviceId}`);
  await set(deviceRef, devicePayload);

  // 2. Mark pairing token as used
  const tokenRef = ref(db, `KdsPairingTokens/${tokenCheck.cleanToken}`);
  await update(tokenRef, {
    isUsed: true,
    usedByDeviceId: deviceId,
    usedAt: new Date().toISOString()
  });

  // 3. Save locally
  saveLocalKdsCredentials(deviceId, deviceSecret, finalName, profile.fingerprintHash);

  return { deviceId, deviceSecret, deviceName: finalName };
}

// -------------------------------------------------------------
// 4. Realtime Device Authorization Listener & Heartbeat
// -------------------------------------------------------------

/**
 * Listens to device status changes in Firebase in real-time.
 * Returns an unsubscribe function.
 */
export function listenToKdsDeviceAuth(deviceId, onStatusChange) {
  if (!deviceId) {
    onStatusChange({ status: 'unregistered' });
    return () => {};
  }

  const deviceRef = ref(db, `KdsAuthorizedDevices/${deviceId}`);
  const unsubscribe = onValue(deviceRef, (snapshot) => {
    if (!snapshot.exists()) {
      clearLocalKdsCredentials();
      onStatusChange({ status: 'unregistered', error: 'تم إلغاء تسجيل الجهاز أو حذفه من قبل الإدارة.' });
      return;
    }

    const device = snapshot.val();
    const creds = getLocalKdsCredentials();

    // Verify secret matches to prevent local tampering
    if (!creds || device.deviceSecret !== creds.deviceSecret) {
      clearLocalKdsCredentials();
      onStatusChange({ status: 'blocked', error: 'فشل التحقق الأمني: مفتاح تشفير الجهاز غير متطابق.' });
      return;
    }

    // Hardware tamper check: warn if hardware fingerprint drastically changed
    const currentProfile = generateHardwareProfile();
    if (device.fingerprint && device.fingerprint !== currentProfile.fingerprintHash) {
      console.warn('[Security Warning] Hardware fingerprint mismatch detected for device:', deviceId);
    }

    onStatusChange({
      status: device.status || 'pending',
      device
    });
  }, (err) => {
    console.error('KDS device auth listener error:', err);
    onStatusChange({ status: 'error', error: err?.message || 'خطأ في الاتصال بخادم الأمان.' });
  });

  return unsubscribe;
}

/**
 * Sends a heartbeat every 60s to let POS Admin know this device is currently online.
 */
export function startKdsDeviceHeartbeat(deviceId) {
  if (!deviceId) return () => {};

  const sendPing = () => {
    try {
      const deviceRef = ref(db, `KdsAuthorizedDevices/${deviceId}`);
      update(deviceRef, {
        lastActiveAt: new Date().toISOString()
      }).catch(() => {});
    } catch { }
  };

  sendPing();
  const intervalId = setInterval(sendPing, 45000); // every 45s
  return () => clearInterval(intervalId);
}
