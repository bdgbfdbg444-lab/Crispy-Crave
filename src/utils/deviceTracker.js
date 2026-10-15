// Device and IP tracker for OTP and Password security

let cachedIp = null;

const TEST_WHITELIST_PHONES = ['01116348079', '201116348079'];
export const TEST_WHITELIST_IPS = ['156.218.228.180', '127.0.0.1', 'localhost', '::1'];

function normalizeTrackerPhone(p) {
  if (!p) return '';
  let clean = p.toString().replace(/\D/g, '');
  if (clean.startsWith('20') && clean.length === 12) clean = '0' + clean.substring(2);
  else if (clean.startsWith('0020') && clean.length === 14) clean = '0' + clean.substring(4);
  else if (clean.startsWith('+20') && clean.length === 13) clean = '0' + clean.substring(3);
  else if (clean.length === 10 && !clean.startsWith('0')) clean = '0' + clean;
  return clean;
}

export function getDeviceId() {
  let id = localStorage.getItem('bb_device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('bb_device_id', id);
  }
  return id;
}

export async function getClientIp() {
  if (cachedIp) return cachedIp;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedIp = data.ip;
        return data.ip;
      }
    }
  } catch (e) {}
  return 'unknown';
}

export function getLocalOtpInfo(phone) {
  const clean = normalizeTrackerPhone(phone);
  if (clean && TEST_WHITELIST_PHONES.includes(clean)) {
    return {
      count: 1,
      max: 3,
      remaining: 2,
      allowed: true,
      lastAttempt: 0,
      isTestWhitelisted: true
    };
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
  const storageKey = clean ? `bb_otp_tracker_${clean}` : 'bb_otp_tracker';

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const tracker = JSON.parse(raw);
      if (tracker.date === today) {
        const count = tracker.count || 0;
        const max = 3;
        const remaining = Math.max(0, max - count);
        return {
          count,
          max,
          remaining,
          allowed: count < max,
          lastAttempt: tracker.lastAttempt || 0,
          isTestWhitelisted: false
        };
      }
    }
  } catch (e) {}
  return { count: 0, max: 3, remaining: 3, allowed: true, lastAttempt: 0, isTestWhitelisted: false };
}

export function checkLocalDailyOtpLimit(phone) {
  const clean = normalizeTrackerPhone(phone);
  if (clean && TEST_WHITELIST_PHONES.includes(clean)) {
    return { allowed: true };
  }

  const info = getLocalOtpInfo(phone);
  if (!info.allowed) {
    return {
      allowed: false,
      message: 'تم استنفاد الحد الأقصى لمحاولات إرسال الكود اليوم لهذا الرقم (3 محاولات كحد أقصى). يرجى المحاولة غداً.'
    };
  }
  if (info.lastAttempt && (Date.now() - info.lastAttempt < 45 * 1000)) {
    const remainingSec = Math.ceil((45 * 1000 - (Date.now() - info.lastAttempt)) / 1000);
    return {
      allowed: false,
      message: `يرجى الانتظار ${remainingSec} ثانية قبل طلب كود جديد.`
    };
  }
  return { allowed: true };
}

export function recordLocalOtpAttempt(phone) {
  const clean = normalizeTrackerPhone(phone);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
  const storageKey = clean ? `bb_otp_tracker_${clean}` : 'bb_otp_tracker';

  try {
    let tracker = { date: today, count: 0, lastAttempt: 0 };
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        tracker = parsed;
      }
    }
    tracker.count += 1;
    tracker.lastAttempt = Date.now();
    localStorage.setItem(storageKey, JSON.stringify(tracker));
  } catch (e) {}
}

// ----------------- Password Rate Limiting & Device/IP Ban (3 attempts max) -----------------
const MAX_PWD_ATTEMPTS = 3;
const DEVICE_BAN_MS = 60 * 60 * 1000; // 60 minutes ban for attacker device/IP

export function checkDeviceOrIpBanned(ip) {
  const deviceId = getDeviceId();
  const safeIp = (ip || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = Date.now();

  try {
    // 1. Check Device Ban
    const rawDev = localStorage.getItem('bb_banned_device');
    if (rawDev) {
      const devData = JSON.parse(rawDev);
      if (devData.bannedUntil && now < devData.bannedUntil) {
        const remainingMinutes = Math.ceil((devData.bannedUntil - now) / 60000);
        return {
          banned: true,
          remainingMinutes,
          message: `تم حظر هذا الجهاز لمدة ${remainingMinutes} دقيقة بسبب تكرار محاولات إدخال كلمة مرور خاطئة.`
        };
      } else if (devData.bannedUntil && now >= devData.bannedUntil) {
        localStorage.removeItem('bb_banned_device');
      }
    }

    // 2. Check IP Ban
    const rawIp = localStorage.getItem(`bb_banned_ip_${safeIp}`);
    if (rawIp) {
      const ipData = JSON.parse(rawIp);
      if (ipData.bannedUntil && now < ipData.bannedUntil) {
        const remainingMinutes = Math.ceil((ipData.bannedUntil - now) / 60000);
        return {
          banned: true,
          remainingMinutes,
          message: `تم حظر شبكة الإنترنت الخاصة بك (${ip}) لمدة ${remainingMinutes} دقيقة بسبب تكرار محاولات الدخول الخاطئة.`
        };
      } else if (ipData.bannedUntil && now >= ipData.bannedUntil) {
        localStorage.removeItem(`bb_banned_ip_${safeIp}`);
      }
    }
  } catch (e) {}

  return { banned: false };
}

export function getDevicePasswordAttempts(ip) {
  const deviceId = getDeviceId();
  const safeIp = (ip || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const key = `bb_pwd_attempts_${deviceId}_${safeIp}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      return data.attempts || 0;
    }
  } catch (e) {}
  return 0;
}

export function recordFailedDevicePasswordAttempt(ip) {
  const deviceId = getDeviceId();
  const safeIp = (ip || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const key = `bb_pwd_attempts_${deviceId}_${safeIp}`;
  const now = Date.now();

  try {
    let data = { attempts: 0, lastAttempt: now };
    const raw = localStorage.getItem(key);
    if (raw) {
      data = JSON.parse(raw);
    }
    data.attempts = (data.attempts || 0) + 1;
    data.lastAttempt = now;

    if (data.attempts >= MAX_PWD_ATTEMPTS) {
      // Ban Device and Ban IP!
      const banInfo = { bannedUntil: now + DEVICE_BAN_MS, bannedAt: now, ip, deviceId };
      localStorage.setItem('bb_banned_device', JSON.stringify(banInfo));
      localStorage.setItem(`bb_banned_ip_${safeIp}`, JSON.stringify(banInfo));
      localStorage.removeItem(key);

      return {
        banned: true,
        attempts: data.attempts,
        remainingMinutes: 60,
        requiresCaptcha: true,
        message: `تم حظر هذا الجهاز وشبكة الإنترنت (${ip}) لمدة 60 دقيقة لحماية النظام بعد 3 محاولات خاطئة متتالية.`
      };
    }

    localStorage.setItem(key, JSON.stringify(data));
    const remaining = MAX_PWD_ATTEMPTS - data.attempts;
    return {
      banned: false,
      attempts: data.attempts,
      remainingAttempts: remaining,
      requiresCaptcha: true, // After first failed attempt, Turnstile is REQUIRED!
      message: `كلمة المرور غير صحيحة. المحاولة ${data.attempts} من ${MAX_PWD_ATTEMPTS} (متبقي ${remaining} ${remaining === 1 ? 'محاولة واحدة' : 'محاولات'} قبل حظر جهازك). يرجى إكمال التحقق الأمني أدناه للمتابعة.`
    };
  } catch (e) {
    return { banned: false, attempts: 1, remainingAttempts: 2, requiresCaptcha: true };
  }
}

export function clearDevicePasswordAttempts(ip) {
  const deviceId = getDeviceId();
  const safeIp = (ip || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    localStorage.removeItem(`bb_pwd_attempts_${deviceId}_${safeIp}`);
  } catch (e) {}
}

// Backward compatibility proxies
export function checkPasswordLockout(phone, ip) {
  const banCheck = checkDeviceOrIpBanned(ip);
  if (banCheck.banned) {
    return { locked: true, remainingMinutes: banCheck.remainingMinutes, message: banCheck.message };
  }
  return { locked: false, attempts: getDevicePasswordAttempts(ip), remainingAttempts: MAX_PWD_ATTEMPTS };
}

export function recordFailedPasswordAttempt(phone, ip) {
  return recordFailedDevicePasswordAttempt(ip);
}

export function clearPasswordAttempts(phone, ip) {
  clearDevicePasswordAttempts(ip);
}

// ----------------- Catering IP Limit (Max 2 requests per day) -----------------
export const MAX_CATERING_PER_DAY = 2;

export function getCateringDailyLimitInfo(ip) {
  const safeIp = (ip || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const isDevWhitelisted = Boolean(ip && TEST_WHITELIST_IPS.includes(ip));

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
  const storageKey = `bb_catering_tracker_${safeIp}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const tracker = JSON.parse(raw);
      if (tracker.date === today) {
        const count = tracker.count || 0;
        const max = MAX_CATERING_PER_DAY;
        const remaining = Math.max(0, max - count);
        return {
          count,
          max,
          remaining,
          allowed: isDevWhitelisted || count < max,
          lastAttempt: tracker.lastAttempt || 0,
          isDevWhitelisted
        };
      }
    }
  } catch (e) {}

  return {
    count: 0,
    max: MAX_CATERING_PER_DAY,
    remaining: MAX_CATERING_PER_DAY,
    allowed: true,
    lastAttempt: 0,
    isDevWhitelisted
  };
}

export function checkCateringIpLimit(ip) {
  if (ip && TEST_WHITELIST_IPS.includes(ip)) {
    return { allowed: true };
  }
  const info = getCateringDailyLimitInfo(ip);
  if (!info.allowed) {
    return {
      allowed: false,
      message: 'عفواً، لقد تم الوصول للحد الأقصى لطلبات حجز المناسبات اليوم من هذا الجهاز أو الشبكة (طلبان كحد أقصى في اليوم). يرجى المحاولة غداً أو التواصل هاتفياً مع إدارة المطعم.'
    };
  }
  return { allowed: true };
}

export function recordCateringIpAttempt(ip) {
  const safeIp = (ip || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
  const storageKey = `bb_catering_tracker_${safeIp}`;

  try {
    let tracker = { date: today, count: 0, lastAttempt: 0 };
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        tracker = parsed;
      }
    }
    tracker.count += 1;
    tracker.lastAttempt = Date.now();
    localStorage.setItem(storageKey, JSON.stringify(tracker));
  } catch (e) {}
}

