import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Building2, Home, Layers, Check, AlertCircle, Search } from 'lucide-react';

// Custom SVG Leaflet Pin Icon to avoid missing asset paths
const pinIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
  <path fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
  <circle cx="12" cy="9" r="3" fill="#FFFFFF"/>
</svg>`;

const customIcon = L.divIcon({
  html: pinIconSvg,
  className: 'custom-map-pin',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

export const normalizeArabic = (text) => {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ً-ٟ]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
    .replace(/\s+/g, ' ');
};

export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const ALEXANDRIA_DISTRICTS = {
  'سيدي بشر': {
    aliases: ['سيدي بشر', 'سيدى بشر', 'sidi bishr'],
    subAreas: [
      'سيدي بشر', 'سيدى بشر', 'سيدي بشر بحري', 'سيدي بشر قبلي', 'سيدى بشر بحرى', 'سيدى بشر قبلى',
      'خالد بن الوليد', 'العيسوي', 'العيسوى', 'جمال عبد الناصر', 'ملك حفني', 'ملك حفنى',
      'بير مسعود', 'المحروسة', 'المحروسه', 'شاطئ إدوارد خراط', 'شاطئ سيدي بشر', 'خليل حمادة', 'خليل حماده',
      'مساكن الضباط', 'شارع 45', 'شارع خمسة واربعين', 'الفلكي', 'الفلكى', 'عزبة الشامي', 'عزبة الشامى',
      'حي أول المنتزه', 'حي اول المنتزه', 'منتزه أول', 'منتزه اول'
    ],
    center: { lat: 31.2598, lng: 29.9868 },
    radiusKm: 1.3
  },
  'سموحة': {
    aliases: ['سموحة', 'سموحه', 'smouha'],
    subAreas: [
      'سموحة', 'سموحه', 'فوزي معاذ', 'فوزى معاذ', 'فيكتور عمانويل', 'جرين بلازا', 'زهران',
      'مصطفى كامل', 'شارع النصر', 'ألبرت الأول', 'البرت الاول', 'توت عنخ آمون', 'توت عنخ امون',
      'عزبة سعد', 'نادي سموحة', 'نادى سموحه', 'حدائق النزهة', 'حدائق النزهه', 'سيدي جابر محطة',
      'سيدي جابر المحطة', 'سيدى جابر محطه', 'قسم سيدي جابر', 'قسم سيدى جابر'
    ],
    center: { lat: 31.2156, lng: 29.9452 },
    radiusKm: 1.4
  },
  'ميامي': {
    aliases: ['ميامي', 'ميامى', 'miami'],
    subAreas: [
      'ميامي', 'ميامى', 'اسكندر ابراهيم', 'إسكندر إبراهيم', 'الأكاديمية', 'الاكاديميه',
      'شاطئ ميامي', 'شاطئ ميامى', 'جمال عبد الناصر ميامي', 'خالد بن الوليد ميامي'
    ],
    center: { lat: 31.2687, lng: 29.9965 },
    radiusKm: 1.1
  },
  'العصافرة': {
    aliases: ['العصافرة', 'العصافره', 'asafra'],
    subAreas: [
      'العصافرة', 'العصافره', 'العصافرة بحري', 'العصافرة قبلي', 'العصافره بحرى', 'العصافره قبلى',
      'شارع 45', 'سليمان الفارسي', 'المعهد الديني', 'شارع الملازم بسيوني', 'شاطئ العصافرة'
    ],
    center: { lat: 31.2750, lng: 30.0070 },
    radiusKm: 1.1
  },
  'المندرة': {
    aliases: ['المندرة', 'المندره', 'mandara'],
    subAreas: [
      'المندرة', 'المندره', 'المندرة بحري', 'المندرة قبلي', 'المندره بحرى', 'المندره قبلى',
      'كوبري المندرة', 'شاطئ المندرة', 'شارع النبوي المهندس', 'حي ثان المنتزه'
    ],
    center: { lat: 31.2825, lng: 30.0175 },
    radiusKm: 1.2
  },
  'المعمورة': {
    aliases: ['المعمورة', 'المعموره', 'mamoura'],
    subAreas: [
      'المعمورة', 'المعموره', 'المعمورة الشاطئ', 'المعمورة البلد', 'المعموره الشاطئ', 'المعموره البلد',
      'بوابة المعمورة', 'طريق الطابية'
    ],
    center: { lat: 31.2950, lng: 30.0350 },
    radiusKm: 1.4
  },
  'أبو قير': {
    aliases: ['أبو قير', 'ابو قير', 'abu qir'],
    subAreas: ['أبو قير', 'ابو قير', 'طوسون', 'كلية التربية الرياضية', 'الأكاديمية البحرية'],
    center: { lat: 31.3150, lng: 30.0650 },
    radiusKm: 1.6
  },
  'لوران': {
    aliases: ['لوران', 'lauran'],
    subAreas: ['لوران', 'شارع الإقبال', 'شارع الاقبال', 'شاطئ لوران', 'طريق الكورنيش لوران'],
    center: { lat: 31.2480, lng: 29.9720 },
    radiusKm: 0.9
  },
  'سان ستيفانو': {
    aliases: ['سان ستيفانو', 'san stefano'],
    subAreas: ['سان ستيفانو', 'مول سان ستيفانو', 'فندق ريكسوس', 'طريق الحرية سان ستيفانو'],
    center: { lat: 31.2430, lng: 29.9650 },
    radiusKm: 0.8
  },
  'جليم': {
    aliases: ['جليم', 'gleem'],
    subAreas: ['جليم', 'شاطئ جليم', 'شارع عبد السلام عارف', 'طريق الكورنيش جليم'],
    center: { lat: 31.2380, lng: 29.9570 },
    radiusKm: 0.8
  },
  'كفر عبده': {
    aliases: ['كفر عبده', 'kafr abdo'],
    subAreas: ['كفر عبده', 'شارع خليل باشا', 'شارع أبو قير كفر عبده'],
    center: { lat: 31.2280, lng: 29.9520 },
    radiusKm: 0.8
  },
  'رشدي': {
    aliases: ['رشدي', 'roushdy'],
    subAreas: ['رشدي', 'شارع أحمد شوقي', 'شارع سوريا رشدي'],
    center: { lat: 31.2320, lng: 29.9480 },
    radiusKm: 0.8
  },
  'سيدي جابر': {
    aliases: ['سيدي جابر', 'سيدى جابر', 'sidi gaber'],
    subAreas: ['سيدي جابر', 'سيدى جابر', 'محطة سيدي جابر', 'شارع المشير أحمد إسماعيل', 'شارع بورسعيد'],
    center: { lat: 31.2210, lng: 29.9380 },
    radiusKm: 1.0
  },
  'كليوباترا': {
    aliases: ['كليوباترا', 'cleopatra'],
    subAreas: ['كليوباترا', 'كليوباترا حمامات', 'كليوباترا صغرى'],
    center: { lat: 31.2180, lng: 29.9320 },
    radiusKm: 0.8
  },
  'سبورتنج': {
    aliases: ['سبورتنج', 'sporting'],
    subAreas: ['سبورتنج', 'نادي سبورتنج', 'شارع الدلتا', 'شارع بورسعيد سبورتنج'],
    center: { lat: 31.2140, lng: 29.9260 },
    radiusKm: 0.8
  },
  'الإبراهيمية': {
    aliases: ['الإبراهيمية', 'الابراهيميه', 'ibrahimya'],
    subAreas: ['الإبراهيمية', 'الابراهيميه', 'شارع لاجيتيه', 'شارع عمر لطفي', 'ميدان سبورتنج'],
    center: { lat: 31.2090, lng: 29.9200 },
    radiusKm: 0.8
  },
  'الشاطبي': {
    aliases: ['الشاطبي', 'الشاطبى', 'shatby'],
    subAreas: ['الشاطبي', 'الشاطبى', 'مكتبة الإسكندرية', 'جامعة الإسكندرية', 'مستشفى الشاطبي'],
    center: { lat: 31.2060, lng: 29.9120 },
    radiusKm: 0.8
  },
  'الأزاريطة': {
    aliases: ['الأزاريطة', 'الازاريطه', 'azarita'],
    subAreas: ['الأزاريطة', 'الازاريطه', 'كلية الطب', 'المجمع النظري', 'شارع شامبليون'],
    center: { lat: 31.2040, lng: 29.9080 },
    radiusKm: 0.8
  },
  'محطة الرمل': {
    aliases: ['محطة الرمل', 'محطه الرمل', 'raml station'],
    subAreas: ['محطة الرمل', 'محطه الرمل', 'سعد زغلول', 'شارع النبي دانيال', 'شارع صفية زغلول', 'ميدان الرمل'],
    center: { lat: 31.2000, lng: 29.9000 },
    radiusKm: 1.0
  },
  'المنشية': {
    aliases: ['المنشية', 'المنشيه', 'mansheya'],
    subAreas: ['المنشية', 'المنشيه', 'ميدان التحرير', 'سوق الميدان', 'شارع فرنسا', 'السبع بنات', 'بحري'],
    center: { lat: 31.1960, lng: 29.8920 },
    radiusKm: 1.0
  },
  'محرم بك': {
    aliases: ['محرم بك', 'moharram bek'],
    subAreas: ['محرم بك', 'الرصافة', 'شارع بوالينو', 'شارع منشا', 'قنال السويس', 'أمبروزو', 'بشاير الخير', 'ميدان الرصافة'],
    center: { lat: 31.1920, lng: 29.9140 },
    radiusKm: 1.3
  },
  'كرموز': {
    aliases: ['كرموز', 'karmouz'],
    subAreas: ['كرموز', 'عمود السواري', 'شارع راغب', 'غيط العنب', 'بشاير الخير 1', 'بشاير الخير 2'],
    center: { lat: 31.1820, lng: 29.8980 },
    radiusKm: 1.1
  },
  'العجمي': {
    aliases: ['العجمي', 'العجمى', 'agami'],
    subAreas: ['العجمي', 'العجمى', 'البيطاش', 'الهانوفيل', 'أبو تلات', 'الكيلو 21', 'الدخيلة', 'الدخيله'],
    center: { lat: 31.1200, lng: 29.7700 },
    radiusKm: 2.2
  }
};

export const checkZoneMismatch = (addressText, selectedZone, zonesList) => {
  if (!addressText || !selectedZone || !zonesList || zonesList.length === 0) return null;
  const normAddress = normalizeArabic(addressText);
  const normSelected = normalizeArabic(selectedZone);

  for (const z of zonesList) {
    const zoneName = typeof z === 'string' ? z : (z.name || '');
    if (!zoneName) continue;
    const normZ = normalizeArabic(zoneName);
    if (!normZ || normZ === normSelected) continue;

    // Check if the other zone name appears in address
    const tokens = normZ.split(/\s+/).filter(t => t.length > 2);
    const hasMismatch = tokens.length > 0 && tokens.every(tok => normAddress.includes(tok));
    if (hasMismatch && !normSelected.includes(normZ)) {
      return zoneName;
    }
  }
  return null;
};

export const formatAddressDetails = (data) => {
  const parts = [];
  if (data.street) parts.push(`شارع ${data.street.trim()}`);
  if (data.building) parts.push(`عمارة ${data.building.trim()}`);
  if (data.floor) parts.push(`الدور ${data.floor.trim()}`);
  if (data.apartment) parts.push(`شقة ${data.apartment.trim()}`);
  if (data.landmark) parts.push(`(علامة مميزة: ${data.landmark.trim()})`);
  return parts.join(' - ');
};

export const DESCRIPTOR_WORDS = new Set([
  'street', 'st', 'str', 'road', 'rd', 'avenue', 'ave', 'lane', 'sq', 'square',
  'building', 'bldg', 'floor', 'fl', 'apartment', 'apt', 'flat', 'block', 'blk',
  'near', 'behind', 'opposite', 'beside', 'front',
  'شارع', 'الشارع', 'طريق', 'ميدان', 'حارة', 'زقاق', 'عمارة', 'العمارة', 'برج', 
  'البرج', 'بلوك', 'الدور', 'دور', 'شقة', 'الشقة', 'بجوار', 'خلف', 'أمام', 'امام', 
  'ناصية', 'علامة', 'مميزة', 'مدخل', 'محل', 'مكتب', 'فيلا', 'كمبوند'
]);

export const KNOWN_SPAM_WORDS = new Set([
  'test', 'testing', 'fake', 'asdf', 'qwer', 'zxcv', 'asdfgh', 'dsad', 'dsada', 
  'asdasd', 'qweqwe', 'qwerty', 'zxcvbn', 'none', 'null', 'undefined', 'demo', 
  'sample', 'home', 'house', 'city', 'xxx', 'yyy', 'zzz',
  'تست', 'تجربة', 'تجربه', 'اي حاجة', 'اى حاجه', 'مش عارف', 'مفيش', 'عنوان', 'بيتي', 
  'شقتي', 'شارعنا', 'البيت', 'اي كلام', 'كلام فاضي', 'مجهول', 'سري'
]);

export function isGibberishWord(word) {
  if (!word) return false;
  const w = word.toString().toLowerCase().trim();
  if (w.length < 3) return false;

  // 1. Direct spam word match
  if (KNOWN_SPAM_WORDS.has(w)) return true;

  // 2. Character repetition (e.g. "aaaa", ".....", "1111", "لللل")
  if (/(.)\1{3,}/.test(w)) return true;

  // 3. Repeated pattern spam (e.g. "ababab", "asdasd", "qweqwe")
  // Note: Allow natural 4-letter words like "بابا", "ماما", "فلفل", "سمسم", "مشمش", "lulu", "papa"
  if (/^(.{2})\1{2,}$/.test(w)) return true; // 2 chars repeated 3+ times (length 6+)
  if (/^([a-z]{3})\1+$/i.test(w)) return true; // English 3-char keyboard repeat like "qweqwe", "asdasd"

  // 4. English consonant & keyboard checks
  const isEnglish = /^[a-z]+$/i.test(w);
  if (isEnglish) {
    const vowels = (w.match(/[aeiouy]/gi) || []).length;
    const len = w.length;

    // Word >= 4 with 0 vowels (e.g. "sdfg", "zxcv", "fghjk")
    if (len >= 4 && vowels === 0) return true;

    // Word >= 7 with low vowel ratio and 4+ consecutive consonants
    if (len >= 7 && vowels / len <= 0.22) {
      if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(w)) return true;
    }

    // 4+ consonants in a row anywhere in a word >= 6 chars
    if (len >= 6 && /[bcdfghjklmnpqrstvwxz]{4,}/i.test(w)) {
      const allowedClusters = ['strength', 'lengths', 'rights', 'nights'];
      if (!allowedClusters.some(ac => w.includes(ac))) {
        return true;
      }
    }

    // Keyboard row mash: >= 75% of chars belong to a single keyboard cluster of <= 5 adjacent keys
    const rowClusters = [
      'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl',
      'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
      'zxcvb', 'xcvbn', 'cvbnm'
    ];
    for (const cluster of rowClusters) {
      let matchCount = 0;
      for (const char of w) {
        if (cluster.includes(char)) matchCount++;
      }
      if (w.length >= 5 && matchCount / w.length >= 0.75) {
        return true; // Catches "dsadafgsdg" 100%!
      }
    }

    // Sequential keyboard or alphabet runs
    const sequences = ['abcdef', 'bcdefg', 'cdefgh', 'qwerty', 'wertyu', 'asdfgh', 'sdfghj', 'zxcvbn'];
    for (const seq of sequences) {
      if (w.includes(seq)) return true;
    }
  }

  // 5. Arabic Keyboard mash checks
  const isArabic = /^[\u0600-\u06FF]+$/.test(w);
  if (isArabic) {
    const mashRuns = [
      'ضصثق', 'صثقف', 'ثقفغ', 'قفغه', 'فغهخ', 'غهخح', 'هخحج', 'خحجد',
      'دجحخ', 'جحخه', 'حخهغ', 'خهغف', 'هغفق', 'غفقث', 'فقثص', 'قثصض',
      'شسيب', 'سيبلا', 'يبلات', 'بلاتن', 'لاتنم', 'اتنمك', 'تنمكط',
      'طكمن', 'كمنت', 'منتا', 'نتال', 'تالب', 'البي', 'لبيس', 'بيسش',
      'ئءؤر', 'ءؤرل', 'ؤرلا', 'رلاى', 'لاىة', 'ىةوز', 'ةوزظ',
      'ظزوة', 'زوةى', 'وةىا', 'ىالر', 'الرؤ', 'لرؤء', 'رؤءئ'
    ];

    for (const run of mashRuns) {
      if (w.includes(run)) return true;
    }

    // Repeated 3-character pattern (e.g. "شسيشسي", "ثقفثقف")
    if (/^([\u0600-\u06FF]{3})\1+$/.test(w)) return true;

    // Low unique char count in Arabic word >= 5 (e.g. "شسشسشس", "بليبلي")
    const uniqueChars = new Set(w.split('')).size;
    if (w.length >= 5 && uniqueChars <= 2) return true;
  }

  return false;
}

export function validateStreet(street, lang = 'ar') {
  if (!street || typeof street !== 'string' || street.trim().length < 3) {
    return {
      isValid: false,
      error: lang === 'en' ? 'Please enter a valid street name (at least 3 characters).' : 'يرجى إدخال اسم شارع صحيح (3 حروف على الأقل).'
    };
  }

  const trimmed = street.trim();

  // Repeated chars: e.g. "......", "aaaaa", "11111"
  if (/(.)\1{3,}/.test(trimmed)) {
    return {
      isValid: false,
      error: lang === 'en' ? 'Invalid street: contains repetitive characters.' : 'اسم الشارع غير صالح (يحتوي على حروف أو رموز مكررة عشوائياً).'
    };
  }

  // Check words
  const words = trimmed.split(/[\s,،\-]+/).filter(w => w.length > 0);
  const nonDescriptorWords = words.filter(w => !DESCRIPTOR_WORDS.has(w.toLowerCase()));
  if (nonDescriptorWords.length === 0) {
    return {
      isValid: false,
      error: lang === 'en' ? 'Please specify the actual street name.' : 'يرجى كتابة اسم الشارع الفعلي، وليس كلمة "شارع" فقط.'
    };
  }

  for (const word of words) {
    if (DESCRIPTOR_WORDS.has(word.toLowerCase())) continue;
    if (isGibberishWord(word)) {
      return {
        isValid: false,
        error: lang === 'en' 
          ? `Invalid or unrecognized street name: "${word}". Please enter a real street name.` 
          : `اسم الشارع غير صالح أو غير مفهوم ("${word}"). يرجى إدخال اسم شارع حقيقي.`
      };
    }
  }

  // Must contain at least one readable word of at least 3 letters
  if (!/[\u0600-\u06FFa-zA-Z]{3,}/.test(trimmed)) {
    return {
      isValid: false,
      error: lang === 'en' ? 'Street must contain readable letters.' : 'يجب أن يحتوي اسم الشارع على حروف واضحة.'
    };
  }

  return { isValid: true, error: '' };
}

export function validateLandmark(landmark, lang = 'ar') {
  if (!landmark || typeof landmark !== 'string' || !landmark.trim()) {
    return { isValid: true, error: '' }; // Landmark is optional!
  }

  const trimmed = landmark.trim();
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: lang === 'en' ? 'Landmark is too short (at least 3 characters).' : 'العلامة المميزة قصيرة جداً (3 حروف على الأقل).'
    };
  }

  // Repeated chars: e.g. "......", "aaaaa", "11111"
  if (/(.)\1{3,}/.test(trimmed)) {
    return {
      isValid: false,
      error: lang === 'en' ? 'Invalid landmark: contains repetitive characters.' : 'العلامة المميزة غير صالحة (تحتوي على حروف أو رموز مكررة عشوائياً).'
    };
  }

  // Check words
  const words = trimmed.split(/[\s,،\-]+/).filter(w => w.length > 0);
  for (const word of words) {
    if (DESCRIPTOR_WORDS.has(word.toLowerCase())) continue;
    if (isGibberishWord(word)) {
      return {
        isValid: false,
        error: lang === 'en' 
          ? `Invalid or unrecognized word in landmark: "${word}".` 
          : `العلامة المميزة تحتوي على كلمة غير مفهومة ("${word}"). يرجى إدخال علامة مميزة حقيقية.`
      };
    }
  }

  return { isValid: true, error: '' };
}

export const validateDeliveryAddress = (addressText, lang = 'ar', isCashCod = false) => {
  if (!addressText || typeof addressText !== 'string') {
    return { 
      isValid: false, 
      error: lang === 'en' ? 'Please enter your detailed delivery address' : 'يرجى إدخال عنوان التوصيل بالتفصيل' 
    };
  }

  const trimmed = addressText.trim();

  // 1. Length check: at least 10 characters (15 for cash on delivery)
  const minLength = isCashCod ? 15 : 10;
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: lang === 'en'
        ? `Address is too short (min ${minLength} chars). Please provide detailed street, building, and apartment info.`
        : `العنوان غير مكتمل (يجب ألا يقل عن ${minLength} حرفاً). يرجى كتابة عنوان تفصيلي واضح (اسم الشارع، رقم العمارة، والدور أو علامة مميزة) لتأكيد التوصيل.`
    };
  }

  // 2. Reject digits-only or punctuation-only addresses (e.g. "1234567890", "..... 12345")
  if (/^[\d\s\-_.,،/\\#]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: lang === 'en'
        ? 'Address cannot contain numbers and symbols only. Please include street and building names in letters.'
        : 'العنوان غير صالح: لا يمكن أن يتكون العنوان من أرقام أو رموز فقط. يرجى كتابة اسم الشارع والعمارة بحروف واضحة.'
    };
  }

  // 3. Repeated characters spam: e.g. "......", "aaaaa", "11111", "لللللل" (more than 3 consecutive repeats)
  if (/(.)\1{3,}/.test(trimmed)) {
    return {
      isValid: false,
      error: lang === 'en'
        ? 'Invalid address: contains repetitive characters or punctuation.'
        : 'العنوان غير صالح (يحتوي على حروف أو رموز مكررة بشكل عشوائي).'
    };
  }

  // 4. Word count: at least 2 distinct words with meaningful length
  const words = trimmed.split(/[\s,،\-]+/).filter(w => w.length >= 2);
  const minWords = isCashCod ? 3 : 2;
  if (words.length < minWords) {
    return {
      isValid: false,
      error: lang === 'en'
        ? 'Please specify more details (e.g. Street name, Building number, Landmark).'
        : 'يرجى توضيح تفاصيل العنوان (مثال: شارع جمال عبد الناصر، عمارة 12، بجوار صيدلية...)'
    };
  }

  // 5. Keyboard mash / Gibberish words check across all words
  for (const word of words) {
    if (/^\d+$/.test(word)) continue;
    if (DESCRIPTOR_WORDS.has(word.toLowerCase())) continue;
    if (isGibberishWord(word)) {
      return {
        isValid: false,
        error: lang === 'en'
          ? `Invalid or unrecognized word in address: "${word}". Please enter a real address.`
          : `العنوان يحتوي على كلمات غير مفهومة أو عشوائية ("${word}"). يرجى إدخال عنوان حقيقي واضح.`
      };
    }
  }

  // 6. Must contain at least one readable word of at least 3 letters (Arabic or Latin)
  if (!/[\u0600-\u06FFa-zA-Z]{3,}/.test(trimmed)) {
    return {
      isValid: false,
      error: lang === 'en'
        ? 'Address must contain street or area name in letters.'
        : 'يرجى كتابة اسم الشارع أو المنطقة بحروف واضحة.'
    };
  }

  return { isValid: true, error: '' };
};

export default function AddressMapPicker({
  value,
  onChange,
  zonesList = [],
  lang = 'ar',
  disabled = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const [locatingGps, setLocatingGps] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [detectedZoneName, setDetectedZoneName] = useState('');
  const [rawAreaName, setRawAreaName] = useState('');
  const [isOutOfZone, setIsOutOfZone] = useState(false);
  const [allowManualOverride, setAllowManualOverride] = useState(false);

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef(null);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setIsSearching(true);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const q = val.trim() + ' الإسكندرية';
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=ar&countrycodes=eg&limit=5`, {
          headers: { 'Accept-Language': 'ar' }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
        }
      } catch (err) {
        console.warn('Map search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17);
      markerRef.current.setLatLng([lat, lng]);
    }
    setSearchQuery(item.display_name.split(',')[0]);
    setSearchResults([]);
    reverseGeocode(lat, lng);
  };

  // Local state for individual fields initialized from value
  const combinedText = `${value?.street || ''} ${value?.landmark || ''} ${value?.fullAddress || ''}`;
  const [formData, setFormData] = useState({
    street: value?.street || '',
    building: value?.building || '',
    floor: value?.floor || '',
    apartment: value?.apartment || '',
    landmark: value?.landmark || '',
    zone: value?.zone || '',
    lat: value?.lat || 31.2001,
    lng: value?.lng || 29.9187,
    mapsUrl: value?.mapsUrl || ''
  });

  useEffect(() => {
    if (value) {
      setFormData(prev => ({
        ...prev,
        ...value
      }));
    }
  }, [value]);

  const updateParent = (updated) => {
    setFormData(updated);
    const fullAddress = formatAddressDetails(updated);
    const mapsUrl = updated.lat && updated.lng ? `https://maps.google.com/?q=${updated.lat},${updated.lng}` : '';
    if (onChange) {
      onChange({
        ...updated,
        fullAddress,
        mapsUrl
      });
    }
  };

  // Reverse geocoding function with Alexandria Geofencing
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    setGpsError('');

    // Check Alexandria bounds (Lat ~ 30.85 to 31.45, Lng ~ 29.50 to 30.40)
    const isInsideAlexandria = lat >= 30.85 && lat <= 31.45 && lng >= 29.50 && lng <= 30.40;
    if (!isInsideAlexandria) {
      setGpsError('⚠️ موقع الدبوس يقع خارج نطاق محافظة الإسكندرية ومناطق توصيل المطعم.');
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`, {
        headers: { 'Accept-Language': 'ar' }
      });
      const data = await res.json();
      
      let streetName = '';
      let zoneDetected = '';

      let neighborhoodName = '';
      if (data && data.address) {
        const addr = data.address;
        streetName = addr.road || addr.pedestrian || addr.street || '';
        neighborhoodName = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.district || '';
        setRawAreaName(neighborhoodName);
        
        // Match against zonesList using ALEXANDRIA_DISTRICTS + subAreas + radius + searchPool
        const searchPool = [
          streetName,
          addr.road,
          addr.suburb,
          addr.neighbourhood,
          addr.quarter,
          addr.city_district,
          addr.district,
          data.display_name
        ].filter(Boolean).join(' ');

        const normSearchPool = normalizeArabic(searchPool);

        // Tier 1: Match by district knowledge base (subAreas & radius)
        for (const z of zonesList) {
          const normZName = normalizeArabic(z.name || '');
          
          const districtKey = Object.keys(ALEXANDRIA_DISTRICTS).find(k => {
            const d = ALEXANDRIA_DISTRICTS[k];
            return normalizeArabic(k) === normZName || d.aliases.some(a => normalizeArabic(a) === normZName);
          });

          if (districtKey) {
            const districtInfo = ALEXANDRIA_DISTRICTS[districtKey];
            
            // 1. Check if any subArea matches the street or address pool
            const hasSubAreaMatch = districtInfo.subAreas.some(sub => normSearchPool.includes(normalizeArabic(sub)));
            if (hasSubAreaMatch) {
              zoneDetected = z.name;
              break;
            }

            // 2. Check if pin coordinates are within district radius
            if (lat && lng && districtInfo.center) {
              const dist = calculateDistanceKm(lat, lng, districtInfo.center.lat, districtInfo.center.lng);
              if (dist <= districtInfo.radiusKm) {
                zoneDetected = z.name;
                break;
              }
            }
          }
        }

        // Tier 2: Fallback to token text matching if not matched by district knowledge base
        if (!zoneDetected) {
          for (const z of zonesList) {
            const normZoneName = normalizeArabic(z.name || '');
            const tokens = normZoneName.split(/\s+/).filter(t => t.length > 2);
            const matched = tokens.length > 0 && tokens.some(t => normSearchPool.includes(t));
            if (matched) {
              zoneDetected = z.name;
              break;
            }
          }
        }
      }

      setDetectedZoneName(zoneDetected);

      if (!zoneDetected) {
        setIsOutOfZone(true);
        setGpsError(neighborhoodName 
          ? `⚠️ هذا الموقع يقع في (${neighborhoodName}) وهي خارج نطاق التوصيل المتاح حالياً للمطعم.` 
          : '⚠️ هذا الموقع خارج نطاق مناطق التوصيل المتاحة للمطعم.');
      } else {
        setIsOutOfZone(false);
        setGpsError('');
      }

      const next = {
        ...formData,
        lat,
        lng,
        mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
        street: streetName || formData.street,
        zone: zoneDetected || (allowManualOverride ? formData.zone : ''),
        isOutOfZone: !zoneDetected
      };
      updateParent(next);
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = formData.lat || 31.2001;
    const initialLng = formData.lng || 29.9187;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        reverseGeocode(pos.lat, pos.lng);
      }, 500);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      }, 500);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map marker when coordinates change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && formData.lat && formData.lng) {
      markerRef.current.setLatLng([formData.lat, formData.lng]);
    }
  }, [formData.lat, formData.lng]);

  // Handle GPS location click
  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsError('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي (GPS).');
      return;
    }

    setLocatingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
        setLocatingGps(false);
      },
      (err) => {
        setLocatingGps(false);
        if (err.code === 1) {
          setGpsError('يرجى السماح بصلاحية الموقع (Location Permission) في المتصفح لتحديد مكانك.');
        } else {
          setGpsError('تعذر تحديد موقعك بدقة، يمكنك تحديد موقعك يدوياً على الخريطة.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const handleFieldChange = (field, val) => {
    const updated = {
      ...formData,
      [field]: val
    };
    updateParent(updated);
  };

  return (
    <div className="space-y-4">
      {/* Map Card */}
      <div className="bg-black-surface border border-brand-red-dark/40 rounded-2xl p-3 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-text-light flex items-center gap-1.5">
            <MapPin size={15} className="text-brand-red" />
            {lang === 'en' ? 'Pin Delivery Location on Map' : 'حدد موقع التوصيل على الخريطة (أو حرك الدبوس)'}
          </span>
          <button
            type="button"
            onClick={handleGetLiveGps}
            disabled={locatingGps}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Navigation size={13} className={locatingGps ? 'animate-spin' : ''} />
            <span>{locatingGps ? 'جاري تحديد موقعك...' : (lang === 'en' ? 'Use Current GPS' : '📍 مكاني الحالي')}</span>
          </button>
        </div>

        {/* Interactive Alexandria Street Search Bar */}
        <div className="relative mb-2.5">
          <div className="relative flex items-center">
            <Search size={15} className="absolute right-3 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={lang === 'en' ? '🔍 Search street, square, or landmark in Alexandria...' : '🔍 ابحث عن اسم الشارع، الميدان، أو المعلم في الإسكندرية...'}
              className="w-full bg-black-primary border border-brand-red-dark/40 text-text-light text-xs pr-9 pl-8 py-2.5 rounded-xl focus:outline-none focus:border-brand-red placeholder:text-text-muted/60 transition-all shadow-inner"
            />
            {isSearching && (
              <div className="absolute left-3 w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            )}
            {searchQuery && !isSearching && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute left-3 text-text-muted hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-1.5 bg-black-primary border border-brand-red/40 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-brand-red-dark/20 backdrop-blur-md">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-right px-3.5 py-2.5 hover:bg-black-surface text-xs text-text-light flex items-center gap-2 transition-colors group cursor-pointer"
                >
                  <MapPin size={13} className="text-brand-red shrink-0 group-hover:scale-125 transition-transform" />
                  <span className="truncate">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* The Leaflet Map Canvas */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-44 rounded-xl border border-brand-red-dark/30 z-0 cursor-crosshair relative"
          style={{ minHeight: '176px' }}
        />

        {geocoding && (
          <div className="mt-2 text-xs text-amber-400 font-semibold flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>جاري قراءة تفاصيل الشارع والمنطقة من الخريطة...</span>
          </div>
        )}

        {detectedZoneName && (
          <div className="mt-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
            <Check size={14} />
            <span>تم تحديد المنطقة تلقائياً: {detectedZoneName}</span>
          </div>
        )}

        {gpsError && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Structured Address Fields Grid */}
      <div className="space-y-3">
        {/* Smart Zone Box (Driven by Map Pin) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-text-light">
              {lang === 'en' ? 'Delivery Zone (Auto-detected from Map) *' : 'منطقة التوصيل (تُحدد تلقائياً من الخريطة 📍) *'}
            </label>
            <button 
              type="button" 
              onClick={() => setAllowManualOverride(!allowManualOverride)} 
              className="text-[11px] text-text-muted hover:text-brand-red underline"
            >
              {allowManualOverride ? 'إلغاء التعديل اليدوي' : 'تعديل يدوي للمنطقة'}
            </button>
          </div>

          {allowManualOverride ? (
            <select
              required
              disabled={disabled}
              value={formData.zone}
              onChange={(e) => {
                handleFieldChange('zone', e.target.value);
                setIsOutOfZone(!e.target.value);
              }}
              className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl font-bold text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="">{lang === 'en' ? '-- Select Area --' : '-- اختر المنطقة السكنية --'}</option>
              {zonesList.map(z => (
                <option key={z.id || z.name} value={z.name}>{z.name}</option>
              ))}
            </select>
          ) : (
            <div>
              {formData.zone ? (
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-emerald-400" size={18} />
                    <span className="text-emerald-300 font-bold text-sm">{formData.zone}</span>
                  </div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    مغطاة بالتوصيل ✓
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-red-950/40 border border-red-500/40 px-3.5 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-400 shrink-0" size={18} />
                    <span className="text-red-300 font-bold text-xs">
                      {rawAreaName ? `خارج نطاق التوصيل (${rawAreaName})` : 'حرك الدبوس لتحديد منطقتك'}
                    </span>
                  </div>
                  <span className="text-[11px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-bold">
                    غير متاح ✕
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Street Name */}
        <div>
          <label className="block text-xs font-bold text-text-light mb-1.5">
            {lang === 'en' ? 'Street Name *' : 'اسم الشارع *'}
          </label>
          <input
            type="text"
            required
            placeholder={lang === 'en' ? 'e.g. Fawzy Moaz St.' : 'مثال: شارع فوزي معاذ'}
            value={formData.street}
            onChange={(e) => handleFieldChange('street', e.target.value)}
            className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          />
        </div>

        {/* Building, Floor, Apartment Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">
              {lang === 'en' ? 'Building *' : 'رقم/اسم العمارة *'}
            </label>
            <input
              type="text"
              required
              placeholder="مثال: عمارة 15"
              value={formData.building}
              onChange={(e) => handleFieldChange('building', e.target.value)}
              className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">
              {lang === 'en' ? 'Floor *' : 'الدور *'}
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 4"
              value={formData.floor}
              onChange={(e) => handleFieldChange('floor', e.target.value)}
              className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">
              {lang === 'en' ? 'Apartment *' : 'رقم الشقة *'}
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 8"
              value={formData.apartment}
              onChange={(e) => handleFieldChange('apartment', e.target.value)}
              className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>
        </div>

        {/* Landmark (Optional) */}
        <div>
          <label className="block text-xs font-bold text-text-muted mb-1.5">
            {lang === 'en' ? 'Landmark (Optional)' : 'علامة مميزة (اختياري للطيار)'}
          </label>
          <input
            type="text"
            placeholder={lang === 'en' ? 'e.g. Near Khalil Pharmacy' : 'مثال: بجوار صيدلية خليل، أمام المسجد'}
            value={formData.landmark}
            onChange={(e) => handleFieldChange('landmark', e.target.value)}
            className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          />
        </div>
      </div>
    </div>
  );
}
