/**
 * Checks if the store is currently open based on live status, manual override, and operating hours schedule.
 * @param {object} storeStatus - Object from Firebase (StoreStatus or menuData.storeStatus)
 * @param {string} lang - 'ar' or 'en'
 * @returns {{ isOpen: boolean, reason: 'manual_closed' | 'schedule_closed' | 'open', message: string, messageEn: string }}
 */
export function checkStoreOpenStatus(storeStatus, lang = 'ar') {
  if (!storeStatus) {
    return {
      isOpen: true,
      reason: 'open',
      title: 'مفتوح الآن لاستقبال طلباتكم',
      titleEn: 'Open Now for Orders',
      message: '',
      messageEn: '',
      openTimeDisplay: '',
      closeTimeDisplay: '',
      openDisplayAr: '',
      closeDisplayAr: '',
      openDisplayEn: '',
      closeDisplayEn: ''
    };
  }

  // 1. Manual Override takes highest priority: if isOpen is explicitly false, it is force closed!
  if (storeStatus.isOpen === false || storeStatus.IsOpen === false) {
    const closedMsg = storeStatus.closedMessage || storeStatus.ClosedMessage || 'المطعم مغلق حالياً، نسعد باستقبال طلباتكم قريباً';
    const closedMsgEn = storeStatus.closedMessageEn || storeStatus.ClosedMessageEn || 'The restaurant is currently closed. We look forward to serving you soon.';
    return {
      isOpen: false,
      reason: 'manual_closed',
      title: 'المطعم مغلق حالياً',
      titleEn: 'Restaurant is Currently Closed',
      message: closedMsg,
      messageEn: closedMsgEn,
      openTimeDisplay: '',
      closeTimeDisplay: '',
      openDisplayAr: '',
      closeDisplayAr: '',
      openDisplayEn: '',
      closeDisplayEn: ''
    };
  }

  // 2. Check Auto Schedule
  const enableSchedule = storeStatus.enableAutoSchedule ?? storeStatus.EnableAutoSchedule ?? true;
  if (!enableSchedule) {
    return {
      isOpen: true,
      reason: 'open',
      title: 'مفتوح الآن لاستقبال طلباتكم',
      titleEn: 'Open Now for Orders',
      message: '',
      messageEn: '',
      openTimeDisplay: '',
      closeTimeDisplay: '',
      openDisplayAr: '',
      closeDisplayAr: '',
      openDisplayEn: '',
      closeDisplayEn: ''
    };
  }

  const rawOpen = (storeStatus.openTime || storeStatus.OpenTime || '13:00').toString().trim();
  const rawClose = (storeStatus.closeTime || storeStatus.CloseTime || '02:00').toString().trim();

  // Helper to parse "HH:mm" or "hh:mm AM/PM" to minutes from 00:00
  const parseToMinutes = (timeStr, defaultMinutes) => {
    if (!timeStr) return defaultMinutes;
    const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match12) return defaultMinutes;
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const ampm = match12[3] ? match12[3].toUpperCase() : null;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const openMinutes = parseToMinutes(rawOpen, 13 * 60); // Default: 13:00 (1:00 PM)
  const closeMinutes = parseToMinutes(rawClose, 2 * 60); // Default: 02:00 (2:00 AM)

  // Current Egypt Time (Africa/Cairo)
  let curMinutes = 0;
  try {
    const cairoTimeStr = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Africa/Cairo',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [h, m] = cairoTimeStr.split(':').map(Number);
    curMinutes = h * 60 + m;
  } catch {
    const now = new Date();
    curMinutes = now.getHours() * 60 + now.getMinutes();
  }

  let isWithinHours = false;
  if (openMinutes <= closeMinutes) {
    // Standard same-day window (e.g. 10:00 to 23:00)
    isWithinHours = curMinutes >= openMinutes && curMinutes <= closeMinutes;
  } else {
    // Overnight window (e.g. 13:00 to 02:00 next day)
    isWithinHours = curMinutes >= openMinutes || curMinutes <= closeMinutes;
  }

  // Format nice human-readable times
  const formatTimeDisplay = (mins, isLangEn = false) => {
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const isPm = h >= 12;
    h = h % 12 || 12;
    const mStr = m > 0 ? `:${m < 10 ? '0' : ''}${m}` : '';
    return `${h}${mStr} ${isPm ? (isLangEn ? 'PM' : 'مساءً') : (isLangEn ? 'AM' : 'صباحاً')}`;
  };

  const openDisplayAr = formatTimeDisplay(openMinutes, false);
  const closeDisplayAr = formatTimeDisplay(closeMinutes, false);
  const openDisplayEn = formatTimeDisplay(openMinutes, true);
  const closeDisplayEn = formatTimeDisplay(closeMinutes, true);

  if (isWithinHours) {
    return {
      isOpen: true,
      reason: 'open',
      title: 'مفتوح الآن لاستقبال طلباتكم',
      titleEn: 'Open Now for Orders',
      message: `نسعد باستقبال طلباتكم يومياً حتى الساعة ${closeDisplayAr}`,
      messageEn: `Accepting orders daily until ${closeDisplayEn}`,
      openTimeDisplay: lang === 'en' ? openDisplayEn : openDisplayAr,
      closeTimeDisplay: lang === 'en' ? closeDisplayEn : closeDisplayAr,
      openDisplayAr,
      closeDisplayAr,
      openDisplayEn,
      closeDisplayEn
    };
  }

  const schedClosedMsg = `المطعم مغلق حالياً وفقاً لمواعيد العمل الرسمية. نسعد باستقبال طلباتكم يومياً من الساعة ${openDisplayAr} حتى ${closeDisplayAr}.`;
  const schedClosedMsgEn = `The restaurant is currently closed. Our daily working hours are from ${openDisplayEn} to ${closeDisplayEn}.`;

  return {
    isOpen: false,
    reason: 'schedule_closed',
    title: 'المطعم مغلق حالياً',
    titleEn: 'Restaurant is Currently Closed',
    message: schedClosedMsg,
    messageEn: schedClosedMsgEn,
    openTimeDisplay: lang === 'en' ? openDisplayEn : openDisplayAr,
    closeTimeDisplay: lang === 'en' ? closeDisplayEn : closeDisplayAr,
    openDisplayAr,
    closeDisplayAr,
    openDisplayEn,
    closeDisplayEn
  };
}
