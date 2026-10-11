// Device and IP tracker for OTP security

let cachedIp = null;

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

export function checkLocalDailyOtpLimit() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
  try {
    const raw = localStorage.getItem('bb_otp_tracker');
    if (raw) {
      const tracker = JSON.parse(raw);
      if (tracker.date === today && tracker.count >= 3) {
        return {
          allowed: false,
          message: 'تم استنفاد الحد الأقصى لمحاولات إرسال الكود اليوم من هذا الجهاز (3 محاولات كحد أقصى). يرجى المحاولة غداً.'
        };
      }
      if (Date.now() - (tracker.lastAttempt || 0) < 45 * 1000) {
        const remaining = Math.ceil((45 * 1000 - (Date.now() - tracker.lastAttempt)) / 1000);
        return {
          allowed: false,
          message: `يرجى الانتظار ${remaining} ثانية قبل طلب كود جديد.`
        };
      }
    }
  } catch (e) {}
  return { allowed: true };
}

export function recordLocalOtpAttempt() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
  try {
    let tracker = { date: today, count: 0, lastAttempt: 0 };
    const raw = localStorage.getItem('bb_otp_tracker');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        tracker = parsed;
      }
    }
    tracker.count += 1;
    tracker.lastAttempt = Date.now();
    localStorage.setItem('bb_otp_tracker', JSON.stringify(tracker));
  } catch (e) {}
}
