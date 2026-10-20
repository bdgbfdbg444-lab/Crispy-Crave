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
  if (!data) return '';
  const parts = [];
  if (data.street) parts.push(`شارع ${data.street.trim()}`);
  if (data.building) parts.push(`عمارة ${data.building.trim()}`);
  if (data.floor) parts.push(`الدور ${data.floor.trim()}`);
  if (data.apartment) parts.push(`شقة ${data.apartment.trim()}`);
  if (data.landmark) parts.push(`(علامة مميزة: ${data.landmark.trim()})`);
  const formatted = parts.join(' - ');
  if (formatted) return formatted;
  return data.fullAddress || data.street || '';
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
