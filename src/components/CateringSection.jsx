import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ArrowLeft, ArrowRight, Send, CheckCircle, Loader2, AlertCircle, 
  RefreshCw, Calendar, Clock, MapPin, Sparkles, Check, Phone, User, 
  Flame, Home, PartyPopper, Briefcase, Sun, Moon, Truck, ShoppingBag, 
  Layers, Utensils, UtensilsCrossed, UserCheck
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { getDeviceId, getClientIp, checkLocalDailyOtpLimit, recordLocalOtpAttempt } from '../utils/deviceTracker';
import AddressMapPicker, { formatAddressDetails } from './AddressMapPicker';

const EVENT_TYPES = [
  { id: 'family', labelAr: 'لمة عائلة / منزلية', labelEn: 'Family / Home Gathering', icon: Home },
  { id: 'corporate', labelAr: 'شركات وعمل', labelEn: 'Corporate / Business', icon: Briefcase },
  { id: 'birthday', labelAr: 'عيد ميلاد واحتفال', labelEn: 'Birthday / Celebration', icon: PartyPopper },
  { id: 'friends', labelAr: 'تجمع أصدقاء', labelEn: 'Friends Gathering', icon: Users },
  { id: 'other', labelAr: 'مناسبة خاصة', labelEn: 'Special Occasion', icon: Sparkles },
];

const GUEST_PRESETS = [
  { labelAr: '10 - 15 فرد', labelEn: '10 - 15 Guests', value: '10 - 15' },
  { labelAr: '15 - 25 فرد', labelEn: '15 - 25 Guests', value: '15 - 25' },
  { labelAr: '25 - 50 فرد', labelEn: '25 - 50 Guests', value: '25 - 50' },
  { labelAr: '50+ فرد', labelEn: '50+ Guests', value: '50+' },
  { labelAr: 'عدد مخصص', labelEn: 'Custom Count', value: 'custom' },
];

const TIME_SLOTS = [
  { id: 'lunch', labelAr: 'غداء (1:00 م - 5:00 م)', labelEn: 'Lunch (1:00 PM - 5:00 PM)', icon: Sun },
  { id: 'dinner', labelAr: 'عشاء (6:00 م - 11:00 م)', labelEn: 'Dinner (6:00 PM - 11:00 PM)', icon: Moon },
  { id: 'custom', labelAr: 'ساعة محددة', labelEn: 'Specific Time', icon: Clock },
];

const FOOD_OPTIONS = [
  { 
    id: 'smoked', 
    titleAr: 'لحوم وبريسكت مدخن', 
    titleEn: 'Smoked Brisket & Ribs', 
    descAr: 'بريسكت وأضلاع مدخنة على الحطب لساعات طويلة', 
    descEn: 'Low & slow wood-smoked brisket and tender ribs',
    icon: Flame 
  },
  { 
    id: 'burgers', 
    titleAr: 'ميني سلايدرز وبرجر', 
    titleEn: 'Mini Sliders & Burgers', 
    descAr: 'تشكيلة سماش برجر وسلايدرز بحجم الحفلات', 
    descEn: 'Party-size smash sliders and assorted burgers',
    icon: Layers 
  },
  { 
    id: 'crispy', 
    titleAr: 'بوكسات كريسبي ودجاج', 
    titleEn: 'Crispy Chicken & Strips', 
    descAr: 'ستريبس مقرمش ودجاج ذهبي مع خلطات سرية', 
    descEn: 'Crispy chicken strips, tenders and dipping sauces',
    icon: Utensils 
  },
  { 
    id: 'sides', 
    titleAr: 'مقبلات، بطاطس وصوصات', 
    titleEn: 'Sides, Fries & Sauces', 
    descAr: 'ماك آند تشيز، بطاطس بأنواعها، وصوصات البيت', 
    descEn: 'Loaded fries, mac & cheese, and signature dips',
    icon: Sparkles 
  },
];

const SERVICE_OPTIONS = [
  { 
    id: 'warmers', 
    titleAr: 'سخانات بوفيه لحفظ الحرارة', 
    titleEn: 'Buffet Food Warmers (Chafing Dishes)', 
    descAr: 'سخانات استيل لحفظ جودة وحرارة الأطباق طوال المناسبة', 
    descEn: 'Keeps meals hot throughout the entire event',
    icon: Flame 
  },
  { 
    id: 'tableware', 
    titleAr: 'أدوات مائدة وسفرة فاخرة ديسبوزابل', 
    titleEn: 'Premium Disposable Tableware', 
    descAr: 'أطباق وشوك ومفارش ومناديل عالية الجودة جاهزة للتقديم', 
    descEn: 'High-grade cutlery, plates, table covers, and napkins',
    icon: UtensilsCrossed 
  },
  { 
    id: 'chef', 
    titleAr: 'شيف مشرف وفريق تقديم', 
    titleEn: 'On-site Chef & Service Staff', 
    descAr: 'شيف للتقطيع المباشر وتنسيق البوفيه والإشراف', 
    descEn: 'Dedicated staff for setup, carving, and hospitality',
    icon: UserCheck 
  },
];

export default function CateringSection({ websiteData }) {
  const { lang } = useLanguage();
  const { customerData, userPhone } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: 'family',
    guests: '15 - 25',
    customGuests: '',
    date: '',
    timeSlot: 'dinner',
    customTime: '',
    locationType: 'delivery',
    address: '',
    mapsUrl: '',
    preferredFood: ['smoked', 'burgers'],
    additionalServices: ['warmers'],
    notes: ''
  });

  // Saved Addresses Handling
  const savedAddresses = useMemo(() => {
    if (customerData?.addresses && Array.isArray(customerData.addresses) && customerData.addresses.length > 0) {
      return customerData.addresses;
    }
    const legacy = customerData?.Address || customerData?.address;
    if (legacy && typeof legacy === 'string' && legacy.trim()) {
      return [{
        id: 'legacy-default',
        label: lang === 'en' ? 'Saved Address' : 'العنوان المسجل',
        fullAddress: legacy.trim(),
        isDefault: true
      }];
    }
    return [];
  }, [customerData, lang]);

  const [addressMode, setAddressMode] = useState('saved'); // 'saved' | 'new'
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Custom Address Draft with Map & Detailed Fields
  const [customAddressDraft, setCustomAddressDraft] = useState({
    zone: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    landmark: '',
    lat: null,
    lng: null,
    fullAddress: '',
    mapsUrl: ''
  });

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Auto-fill customer contact if logged in
  useEffect(() => {
    if (customerData?.Name || userPhone) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || customerData?.Name || '',
        phone: prev.phone || userPhone || ''
      }));
    }
  }, [customerData, userPhone]);

  // Sync saved addresses on customer data load
  useEffect(() => {
    if (savedAddresses.length > 0) {
      const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      if (defaultAddr && (!formData.address || addressMode === 'saved')) {
        setSelectedAddressId(defaultAddr.id);
        setAddressMode('saved');
        const formatted = defaultAddr.fullAddress || formatAddressDetails(defaultAddr);
        setFormData(prev => ({
          ...prev,
          address: formatted,
          mapsUrl: defaultAddr.mapsUrl || (defaultAddr.lat && defaultAddr.lng ? `https://maps.google.com/?q=${defaultAddr.lat},${defaultAddr.lng}` : '')
        }));
      }
    } else {
      setAddressMode('new');
    }
  }, [savedAddresses]);

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setAddressMode('saved');
    const formatted = addr.fullAddress || formatAddressDetails(addr);
    setFormData(prev => ({ 
      ...prev, 
      address: formatted,
      mapsUrl: addr.mapsUrl || (addr.lat && addr.lng ? `https://maps.google.com/?q=${addr.lat},${addr.lng}` : '')
    }));
  };

  const handleSelectCustomAddress = () => {
    setAddressMode('new');
    setSelectedAddressId('new');
    const formatted = formatAddressDetails(customAddressDraft) || customAddressDraft.fullAddress || '';
    setFormData(prev => ({ 
      ...prev, 
      address: formatted,
      mapsUrl: customAddressDraft.mapsUrl || ''
    }));
  };

  const handleCustomAddressDraftChange = (newDraft) => {
    setCustomAddressDraft(newDraft);
    const formatted = formatAddressDetails(newDraft) || newDraft.fullAddress || '';
    setFormData(prev => ({
      ...prev,
      address: formatted,
      mapsUrl: newDraft.mapsUrl || (newDraft.lat && newDraft.lng ? `https://maps.google.com/?q=${newDraft.lat},${newDraft.lng}` : '')
    }));
  };

  const toggleFoodPreference = (id) => {
    setFormData(prev => {
      const exists = prev.preferredFood.includes(id);
      const updated = exists 
        ? prev.preferredFood.filter(item => item !== id)
        : [...prev.preferredFood, id];
      return { ...prev, preferredFood: updated };
    });
  };

  const toggleService = (id) => {
    setFormData(prev => {
      const exists = prev.additionalServices.includes(id);
      const updated = exists 
        ? prev.additionalServices.filter(item => item !== id)
        : [...prev.additionalServices, id];
      return { ...prev, additionalServices: updated };
    });
  };

  const normalizePhone = (phone) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('20') && p.length === 12) p = p.substring(2);
    else if (p.startsWith('+20')) p = p.substring(3);
    if (p.startsWith('0020')) p = p.substring(4);
    return p;
  };

  const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const expiry = Date.now() + 5 * 60 * 1000;

    const localCheck = checkLocalDailyOtpLimit();
    if (!localCheck.allowed) {
      throw new Error(localCheck.message);
    }

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    setOtpExpiry(expiry);
    setOtpCountdown(120);

    const reqId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const deviceId = getDeviceId();
    const clientIp = await getClientIp();

    await set(ref(db, `PendingOtpRequests/${reqId}`), {
      phone: cleanPhone,
      uid: auth.currentUser.uid,
      deviceId,
      clientIp,
      createdAt: Date.now()
    });
    recordLocalOtpAttempt();
  };

  const handleTriggerOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setOtpError('');
    try {
      await sendWhatsAppOtp(formData.phone);
    } catch (err) {
      setOtpError(lang === 'en' ? 'Failed to send OTP: ' + err.message : 'فشل إرسال الرمز: ' + err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitToWorker = async () => {
    setIsSubmitting(true);
    try {
      const cleanPhone = normalizePhone(formData.phone);
      const finalGuests = formData.guests === 'custom' 
        ? (formData.customGuests ? `${formData.customGuests} فرد` : 'مخصص') 
        : formData.guests;
      
      const eventTypeLabelsAr = {
        family: 'لمة عائلة / منزلية',
        birthday: 'عيد ميلاد واحتفال',
        corporate: 'شركات ومناسبات عمل',
        friends: 'تجمع أصدقاء',
        other: 'مناسبة خاصة'
      };

      const timeSlotLabelsAr = {
        lunch: 'غداء (1:00 م - 5:00 م)',
        dinner: 'عشاء (6:00 م - 11:00 م)',
        custom: formData.customTime ? `ساعة محددة (${formData.customTime})` : 'ساعة محددة'
      };

      const foodLabelsAr = {
        smoked: 'لحوم وبريسكت مدخن',
        burgers: 'ميني سلايدرز وبرجر',
        crispy: 'بوكسات كريسبي ودجاج',
        sides: 'مقبلات، بطاطس وصوصات'
      };

      const serviceLabelsAr = {
        warmers: 'سخانات بوفيه لحفظ الحرارة',
        tableware: 'أدوات مائدة وسفرة فاخرة ديسبوزابل',
        chef: 'شيف مشرف وفريق تقديم'
      };

      const selectedEvent = eventTypeLabelsAr[formData.eventType] || formData.eventType;
      const selectedTime = timeSlotLabelsAr[formData.timeSlot] || formData.timeSlot;
      
      // Map food selections to array of names
      const foodNames = formData.preferredFood
        .map(id => foodLabelsAr[id])
        .filter(Boolean);

      // Map services to array of names
      const serviceNames = formData.additionalServices
        .map(id => serviceLabelsAr[id])
        .filter(Boolean);

      // Clean address string
      const finalAddress = (formData.address || '').trim();
      const mapsUrl = formData.mapsUrl || customAddressDraft.mapsUrl || '';

      // Build an impeccably organized, highly legible Telegram summary
      const lines = [];
      lines.push('──────────────────────');
      lines.push(`🎪 نوع المناسبة: ${selectedEvent}`);
      lines.push(`⏰ موعد التقديم: ${selectedTime}`);
      
      if (formData.locationType === 'delivery') {
        lines.push(`🛵 طريقة الاستلام: توصيل للمكان`);
        if (finalAddress) {
          lines.push(`📍 العنوان: ${finalAddress}`);
        }
        if (mapsUrl) {
          lines.push(`🗺️ خريطة الموقع: ${mapsUrl}`);
        }
      } else {
        lines.push(`🛍️ طريقة الاستلام: استلام مجهز من المطعم`);
      }

      lines.push('');
      lines.push('🍽️ تشكيلة الأطباق المطلوبة:');
      if (foodNames.length > 0) {
        foodNames.forEach(item => lines.push(`  ▫️ ${item}`));
      } else {
        lines.push('  ▫️ لم يتم تحديد أصناف معينة');
      }

      if (serviceNames.length > 0) {
        lines.push('');
        lines.push('♨️ خدمات وتجهيزات البوفيه:');
        serviceNames.forEach(srv => lines.push(`  ▫️ ${srv}`));
      }

      if (formData.notes && formData.notes.trim()) {
        lines.push('');
        lines.push('💬 ملاحظات وطلبات خاصة:');
        lines.push(`${formData.notes.trim()}`);
      }

      lines.push('──────────────────────');

      // Starts with newline so it wraps right below "ملاحظات:" in Telegram
      const structuredTelegramNotes = '\n' + lines.join('\n');

      const fullSummaryText = `📋 طلب حجز مناسبة وعزومة جديدة:
👤 الاسم: ${formData.name.trim()}
📞 الهاتف: ${cleanPhone}
👥 عدد الضيوف: ${finalGuests}
📅 التاريخ: ${formData.date}
${structuredTelegramNotes}`;

      const payload = {
        name: formData.name.trim(),
        phone: cleanPhone,
        guests: finalGuests,
        date: formData.date,
        // The worker prints data.notes to Telegram:
        notes: structuredTelegramNotes,
        
        // Structured fields:
        eventType: selectedEvent,
        eventTypeId: formData.eventType,
        timeSlot: selectedTime,
        locationType: formData.locationType === 'delivery' ? 'توصيل' : 'استلام',
        address: finalAddress || (formData.locationType === 'delivery' ? 'لم يحدد عنوان' : 'استلام من المطعم'),
        mapsUrl: mapsUrl,
        preferredFood: foodNames.join('، '),
        additionalServices: serviceNames.join('، ') || 'لا يوجد',
        clientNotes: (formData.notes || '').trim(),
        
        // Full formatted messages:
        message: fullSummaryText,
        text: fullSummaryText,
        summary: fullSummaryText,
        
        createdAt: new Date().toISOString()
      };

      // 1. Post to Cloudflare Worker (triggers Telegram bot)
      const WORKER_URL = "https://smoke-catering-bot.abusaudgaming.workers.dev";
      try {
        await fetch(WORKER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } catch (workerErr) {
        console.warn('Worker post error (continuing with DB save):', workerErr);
      }

      // 2. Save backup in Firebase RTDB safely
      try {
        const reqId = `catering_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await set(ref(db, `CateringRequests/${reqId}`), {
          ...payload,
          status: 'New',
          timestamp: Date.now()
        });
      } catch (dbErr) {
        console.warn('Firebase catering backup error:', dbErr);
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setIsSuccess(false);
        setFormData({
          name: customerData?.Name || '',
          phone: userPhone || '',
          eventType: 'family',
          guests: '15 - 25',
          customGuests: '',
          date: '',
          timeSlot: 'dinner',
          customTime: '',
          locationType: 'delivery',
          address: '',
          mapsUrl: '',
          preferredFood: ['smoked', 'burgers'],
          additionalServices: ['warmers'],
          notes: ''
        });
      }, 4000);
    } catch (error) {
      console.error(error);
      alert(lang === 'en' ? 'Failed to submit. Please try again.' : 'فشل في إرسال الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError(lang === 'en' ? 'Please enter the 6-digit verification code.' : 'يرجى إدخال كود التحقق المكون من 6 أرقام.');
      return;
    }
    
    setIsSubmitting(true);
    setOtpError('');
    
    try {
      const cleanPhone = normalizePhone(formData.phone);
      const reqId = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      await set(ref(db, `PendingOtpVerifications/${reqId}`), {
        phone: cleanPhone,
        uid: auth.currentUser.uid,
        code: otpInput
      });

      // Poll for up to 10 seconds to see if UidToPhone is set
      let verified = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const snapshot = await get(ref(db, `UidToPhone/${auth.currentUser.uid}`));
        if (snapshot.exists() && snapshot.val() === cleanPhone) {
          verified = true;
          break;
        }
      }

      if (verified) {
        setIsOtpModalOpen(false);
        setOtpInput('');
        submitToWorker();
      } else {
        setOtpError(lang === 'en' ? 'Verification failed or timed out. Please try again.' : 'فشل التحقق أو انتهى الوقت. حاول مرة أخرى.');
      }
    } catch (err) {
      setOtpError(lang === 'en' ? 'Error verifying code.' : 'حدث خطأ أثناء التحقق.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(formData.phone);
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      alert(lang === 'en' ? "Please enter a valid 11-digit Egyptian phone number." : "برجاء إدخال رقم هاتف مصري صحيح (11 رقم)");
      return;
    }

    if (!formData.name.trim()) {
      alert(lang === 'en' ? "Please enter your name." : "برجاء إدخال الاسم");
      return;
    }

    if (!formData.date) {
      alert(lang === 'en' ? "Please select the event date." : "برجاء اختيار تاريخ المناسبة");
      return;
    }

    if (formData.guests === 'custom' && !formData.customGuests) {
      alert(lang === 'en' ? "Please enter the number of guests." : "برجاء تحديد عدد الأفراد المتوقع");
      return;
    }

    if (formData.timeSlot === 'custom' && !formData.customTime) {
      alert(lang === 'en' ? "Please enter the preferred time." : "برجاء تحديد وقت التقديم المطلوب");
      return;
    }

    if (formData.locationType === 'delivery') {
      const currentAddress = (formData.address || '').trim();
      const draftAddress = formatAddressDetails(customAddressDraft) || customAddressDraft.fullAddress || '';
      if (!currentAddress && !draftAddress) {
        alert(lang === 'en' ? "Please provide the delivery address / venue." : "برجاء إدخال عنوان وتفاصيل مكان المناسبة أو اختياره من الخريطة");
        return;
      }
    }

    const isAuthVerified = Boolean(userPhone && normalizePhone(userPhone) === cleanPhone);

    if (!isAuthVerified) {
      setIsOtpModalOpen(true);
      setOtpError('');
      setOtpInput('');
      sendWhatsAppOtp(formData.phone).catch(() => {});
      return;
    }

    submitToWorker();
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = `${new Date().getFullYear() + 1}-12-31`;

  return (
    <section id="catering" className="py-24 bg-black-primary relative overflow-hidden" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        <AnimatePresence mode="wait">
          {!showForm ? (
            /* HERO PRESENTATION */
            <motion.div 
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
            >
              {/* Image Side */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 relative"
              >
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] group shadow-2xl shadow-brand-red/10 border border-white/5">
                  <img 
                    src={websiteData?.cateringImageUrl || "https://res.cloudinary.com/vgk0saib/image/upload/v1789401239/cqutdoqk1iptig3mjbkh.webp"}
                    alt="Catering & Events"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black-primary via-black-primary/20 to-transparent opacity-80 pointer-events-none"></div>
                  
                  {/* Floating Badge */}
                  <div className={`absolute bottom-6 ${lang === 'en' ? 'left-6 lg:left-10' : 'right-6 lg:right-10'} bg-brand-red p-6 rounded-2xl shadow-xl transform ${lang === 'en' ? '-rotate-3' : 'rotate-3'} hover:rotate-0 hover:scale-110 hover:-translate-y-2 transition-all duration-300 cursor-default`}>
                    <div className="flex items-center gap-4 text-white">
                      <div>
                        <p className="text-sm font-bold opacity-90">{lang === 'en' ? (websiteData?.cateringBadgeLine1En || 'Discounts up to') : (websiteData?.cateringBadgeLine1 || 'خصومات تصل إلى')}</p>
                        <p className="text-2xl font-black">{lang === 'en' ? (websiteData?.cateringBadgeLine2En || '15% for groups') : (websiteData?.cateringBadgeLine2 || '15% للمجموعات')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-red/20 rounded-full blur-3xl -z-10"></div>
              </motion.div>

              {/* Text Side */}
              <motion.div 
                initial={{ opacity: 0, x: lang === 'en' ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full lg:w-1/2 text-center lg:text-start"
              >
                <div className="inline-flex items-center gap-2 bg-black-surface/5 border border-white/10 rounded-full px-4 py-2 mb-6 text-brand-red">
                  <Users size={18} />
                  <span className="text-sm font-bold tracking-wide">{lang === 'en' ? 'Private Events & Gatherings' : 'عزومات وحفلات'}</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-display font-black text-text-light mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((lang === 'en' ? (websiteData?.cateringTitleEn || 'Make Your Gatherings <span class="text-brand-red">More Enjoyable</span>') : (websiteData?.cateringTitle || 'اجعل تجمعاتك <span class="text-brand-red">أكثر متعة</span>')), { ALLOWED_TAGS: ['span', 'br', 'b', 'strong', 'em'], ALLOWED_ATTR: ['class'] }) }} />
                
                <p className="text-lg text-gray-300 leading-relaxed mb-8 whitespace-pre-line">
                  {(lang === 'en' && websiteData?.cateringDescriptionEn ? websiteData?.cateringDescriptionEn : websiteData?.cateringDescription) || (lang === 'en' ? 'Whether it is a family gathering, corporate event, or a special occasion, we prepare customized gourmet packages to suit your guests.' : 'سواء كانت لمة عائلة، مناسبة عمل، أو احتفال خاص، جهزنا تشكيلات حصرية ومتكاملة تناسب جميع الضيوف والمناسبات.')}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-brand-red hover:bg-brand-red-dark text-text-light font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 w-full sm:w-auto outline-none group cursor-pointer"
                  >
                    <span>{lang === 'en' ? (websiteData?.cateringButtonTextEn || 'Request Event Booking') : (websiteData?.cateringButtonText || 'طلب حجز مناسبة')}</span>
                    {lang === 'en' ? (
                      <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <ArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* FORMAL CATERING BOOKING FORM */
            <motion.div
              key="booking-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {isSuccess ? (
                <div className="bg-black-surface/90 border border-green-500/50 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl">
                  <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-400">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-sans font-bold text-white mb-3">
                    {lang === 'en' ? 'Request Submitted Successfully' : 'تم استلام طلب الحجز بنجاح'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 max-w-lg mx-auto leading-relaxed mb-6">
                    {lang === 'en' 
                      ? `Thank you. Our events team will contact you shortly on (${formData.phone}) to confirm the event specifications and finalize the menu.` 
                      : `شكراً لتواصلكم. سيقوم فريق تنظيم الحفلات بالتواصل معكم قريباً على رقم (${formData.phone}) لتأكيد كافة الترتيبات وتفاصيل التقديم.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setIsSuccess(false); }}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/15 cursor-pointer"
                  >
                    {lang === 'en' ? 'Close' : 'إغلاق'}
                  </button>
                </div>
              ) : (
                <div className="bg-[#121212]/95 border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl relative">
                  
                  {/* Clean Formal Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-sans font-bold text-text-light tracking-tight">
                        {lang === 'en' ? 'Private Events & Catering Request' : 'طلب حجز المناسبات والبوفيه الخاص'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
                        {lang === 'en' 
                          ? 'Please provide your event specifications for a tailored executive catering proposal.'
                          : 'يرجى تحديد تفاصيل المناسبة لإعداد عرض تقديم وبوفيه مخصص بالكامل.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="self-start sm:self-center shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-xs sm:text-sm font-semibold border border-white/10 cursor-pointer"
                    >
                      {lang === 'en' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                      <span>{lang === 'en' ? 'Back' : 'العودة'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* 1. EVENT TYPE */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red"></span>
                        <span>{lang === 'en' ? 'Event Type' : 'نوع المناسبة'}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                        {EVENT_TYPES.map((type) => {
                          const active = formData.eventType === type.id;
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, eventType: type.id })}
                              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center gap-2 cursor-pointer ${
                                active
                                  ? 'bg-brand-red/10 border-brand-red text-white shadow-sm ring-1 ring-brand-red/40'
                                  : 'bg-black-primary/60 border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
                              }`}
                            >
                              <Icon size={19} className={active ? 'text-brand-red' : 'text-gray-400'} />
                              <span className="text-xs font-semibold leading-tight">
                                {lang === 'en' ? type.labelEn : type.labelAr}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. GUESTS COUNT */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                        <Users size={14} className="text-brand-red" />
                        <span>{lang === 'en' ? 'Estimated Guests' : 'عدد الضيوف المتوقع'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {GUEST_PRESETS.map((preset) => {
                          const active = formData.guests === preset.value;
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, guests: preset.value })}
                              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                                active
                                  ? 'bg-brand-red text-white border-brand-red shadow-sm'
                                  : 'bg-black-primary/60 border-white/10 text-gray-300 hover:border-white/20'
                              }`}
                            >
                              {lang === 'en' ? preset.labelEn : preset.labelAr}
                            </button>
                          );
                        })}
                      </div>
                      {formData.guests === 'custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2"
                        >
                          <input
                            type="number"
                            name="customGuests"
                            min="5"
                            placeholder={lang === 'en' ? 'Enter exact guest count (e.g. 35)' : 'أدخل عدد الأفراد المتوقع (مثال: 35)'}
                            value={formData.customGuests}
                            onChange={handleInputChange}
                            className="w-full bg-black-primary border border-brand-red/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-brand-red outline-none transition-colors text-sm"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* 3. DATE & TIME */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-brand-red" />
                        <span>{lang === 'en' ? 'Date & Serving Window' : 'الموعد وفترة التقديم'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-xs text-gray-400 mb-1.5">{lang === 'en' ? 'Event Date *' : 'تاريخ المناسبة *'}</span>
                          <input
                            required
                            type="date"
                            min={today}
                            max={maxDate}
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full bg-black-primary border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red outline-none transition-colors text-sm"
                          />
                        </div>
                        <div>
                          <span className="block text-xs text-gray-400 mb-1.5">{lang === 'en' ? 'Preferred Serving Window' : 'فترة التقديم المطلوبة'}</span>
                          <div className="grid grid-cols-3 gap-2">
                            {TIME_SLOTS.map((slot) => {
                              const active = formData.timeSlot === slot.id;
                              const SlotIcon = slot.icon;
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, timeSlot: slot.id })}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                                    active
                                      ? 'bg-brand-red/10 border-brand-red text-white ring-1 ring-brand-red/30'
                                      : 'bg-black-primary/60 border-white/10 text-gray-400 hover:text-gray-200'
                                  }`}
                                >
                                  <SlotIcon size={16} className={active ? 'text-brand-red' : 'text-gray-400'} />
                                  <span className="text-[11px] font-semibold leading-tight">
                                    {lang === 'en' ? slot.labelEn : slot.labelAr}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {formData.timeSlot === 'custom' && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2"
                            >
                              <input
                                type="time"
                                name="customTime"
                                value={formData.customTime}
                                onChange={handleInputChange}
                                className="w-full bg-black-primary border border-brand-red/40 rounded-xl px-4 py-2.5 text-white focus:border-brand-red outline-none transition-colors text-sm"
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. DELIVERY METHOD & LOCATION */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                        <MapPin size={14} className="text-brand-red" />
                        <span>{lang === 'en' ? 'Delivery Method & Venue Location' : 'طريقة الاستلام وموقع المناسبة'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, locationType: 'delivery' })}
                          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-start ${
                            formData.locationType === 'delivery'
                              ? 'bg-brand-red/10 border-brand-red text-white ring-1 ring-brand-red/30 shadow-sm'
                              : 'bg-black-primary/60 border-white/10 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            formData.locationType === 'delivery' ? 'bg-brand-red/20 border-brand-red/40 text-brand-red' : 'bg-white/5 border-white/10 text-gray-400'
                          }`}>
                            <Truck size={18} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-white">{lang === 'en' ? 'Direct Venue Delivery' : 'توصيل لموقع المناسبة'}</p>
                            <p className="text-[11px] text-gray-400">{lang === 'en' ? 'Delivered fresh and insulated to your location' : 'توصيل حراري مجهز للمقر أو الفيلا'}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, locationType: 'pickup' })}
                          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer text-start ${
                            formData.locationType === 'pickup'
                              ? 'bg-brand-red/10 border-brand-red text-white ring-1 ring-brand-red/30 shadow-sm'
                              : 'bg-black-primary/60 border-white/10 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            formData.locationType === 'pickup' ? 'bg-brand-red/20 border-brand-red/40 text-brand-red' : 'bg-white/5 border-white/10 text-gray-400'
                          }`}>
                            <ShoppingBag size={18} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-white">{lang === 'en' ? 'Restaurant Pickup' : 'استلام من المطعم'}</p>
                            <p className="text-[11px] text-gray-400">{lang === 'en' ? 'Packaged ready for transport at scheduled time' : 'مجهز في بوكسات حرارية للتسليم الفوري'}</p>
                          </div>
                        </button>
                      </div>

                      {formData.locationType === 'delivery' && (
                        <div className="space-y-4 mt-4">
                          {savedAddresses.length > 0 && (
                            <div className="space-y-2.5">
                              <span className="block text-xs font-semibold text-gray-400 mb-1">
                                {lang === 'en' ? 'Select from your saved addresses:' : 'اختر من عناوينك المسجلة أو حدد موقعاً جديداً:'}
                              </span>

                              <div className="grid grid-cols-1 gap-2.5">
                                {savedAddresses.map((addr) => {
                                  const isSelected = addressMode === 'saved' && selectedAddressId === addr.id;
                                  return (
                                    <div
                                      key={addr.id}
                                      onClick={() => handleSelectSavedAddress(addr)}
                                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-start ${
                                        isSelected
                                          ? 'bg-brand-red/10 border-brand-red text-white ring-1 ring-brand-red/40 shadow-sm'
                                          : 'bg-black-primary/60 border-white/10 text-gray-300 hover:border-white/20'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                                        isSelected ? 'border-brand-red bg-brand-red text-white' : 'border-gray-600 bg-transparent'
                                      }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="text-xs font-bold text-white">
                                            {lang === 'en' ? (addr.label === 'المنزل' ? 'Home' : addr.label === 'العمل' ? 'Work' : (addr.label || 'Saved Address')) : (addr.label || 'العنوان المسجل')}
                                          </span>
                                          {addr.isDefault && (
                                            <span className="text-[10px] bg-brand-red/20 text-brand-red px-1.5 py-0.5 rounded font-bold">
                                              {lang === 'en' ? 'Default' : 'الرئيسي'}
                                            </span>
                                          )}
                                          {addr.zone && (
                                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-semibold">
                                              📍 {addr.zone}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-200 font-medium">
                                          {addr.fullAddress}
                                        </p>
                                        {(addr.building || addr.floor || addr.apartment || addr.landmark) && (
                                          <p className="text-[11px] text-gray-400 mt-0.5">
                                            {[
                                              addr.building && (lang === 'en' ? `Bldg ${addr.building}` : `عمارة ${addr.building}`),
                                              addr.floor && (lang === 'en' ? `Floor ${addr.floor}` : `دور ${addr.floor}`),
                                              addr.apartment && (lang === 'en' ? `Apt ${addr.apartment}` : `شقة ${addr.apartment}`),
                                              addr.landmark && (lang === 'en' ? `Near: ${addr.landmark}` : `علامة: ${addr.landmark}`),
                                            ].filter(Boolean).join(' • ')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Custom Address Radio Card */}
                                <div
                                  onClick={handleSelectCustomAddress}
                                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-start ${
                                    addressMode === 'new'
                                      ? 'bg-brand-red/10 border-brand-red text-white ring-1 ring-brand-red/40 shadow-sm'
                                      : 'bg-black-primary/60 border-white/10 text-gray-300 hover:border-white/20'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                                    addressMode === 'new' ? 'border-brand-red bg-brand-red text-white' : 'border-gray-600 bg-transparent'
                                  }`}>
                                    {addressMode === 'new' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <div>
                                    <p className="text-xs sm:text-sm font-semibold text-white">
                                      {lang === 'en' ? 'Enter a Different Venue / Custom Address' : 'إدخال عنوان آخر / موقع جديد للمناسبة'}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                      {lang === 'en' ? 'Pin location on map, specify street, building, and apartment details' : 'تحديد الموقع على الخريطة وإدخال تفاصيل الشارع والعمارة والشقة'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Detailed AddressMapPicker Component when addressMode === 'new' or when no saved addresses exist */}
                          {(addressMode === 'new' || savedAddresses.length === 0) && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="pt-2"
                            >
                              <div className="bg-black-primary/80 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-inner">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <MapPin size={15} className="text-brand-red" />
                                    <span>{lang === 'en' ? 'Custom Venue & Detailed Address' : 'تفاصيل عنوان وموقع المناسبة'}</span>
                                  </span>
                                  {customAddressDraft.zone && (
                                    <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                                      📍 {customAddressDraft.zone}
                                    </span>
                                  )}
                                </div>

                                <AddressMapPicker 
                                  value={customAddressDraft}
                                  onChange={handleCustomAddressDraftChange}
                                  zonesList={websiteData?.deliveryZones || []}
                                  lang={lang}
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 5. FOOD PREFERENCES */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <Flame size={14} className="text-brand-red" />
                          <span>{lang === 'en' ? 'Menu Preferences' : 'تشكيلة الأطباق المفضلة'}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {lang === 'en' ? '(Multiple selection)' : '(اختيار متعدد)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {FOOD_OPTIONS.map((item) => {
                          const active = formData.preferredFood.includes(item.id);
                          const FoodIcon = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleFoodPreference(item.id)}
                              className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer relative text-start ${
                                active
                                  ? 'bg-brand-red/10 border-brand-red/80 ring-1 ring-brand-red/30'
                                  : 'bg-black-primary/60 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                active ? 'bg-brand-red/20 border-brand-red/40 text-brand-red' : 'bg-white/5 border-white/10 text-gray-400'
                              }`}>
                                <FoodIcon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-white mb-0.5">
                                  {lang === 'en' ? item.titleEn : item.titleAr}
                                </p>
                                <p className="text-[11px] text-gray-400 leading-snug">
                                  {lang === 'en' ? item.descEn : item.descAr}
                                </p>
                              </div>
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                                active ? 'bg-brand-red border-brand-red text-white' : 'border-gray-600 bg-black/40'
                              }`}>
                                {active && <Check size={12} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. ADDITIONAL SERVICES */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <Sparkles size={14} className="text-brand-red" />
                          <span>{lang === 'en' ? 'Catering Equipment & Staff' : 'تجهيزات وخدمات البوفيه'}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {lang === 'en' ? '(Optional)' : '(اختياري)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {SERVICE_OPTIONS.map((srv) => {
                          const active = formData.additionalServices.includes(srv.id);
                          const SrvIcon = srv.icon;
                          return (
                            <div
                              key={srv.id}
                              onClick={() => toggleService(srv.id)}
                              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer relative text-start ${
                                active
                                  ? 'bg-brand-red/10 border-brand-red/80 ring-1 ring-brand-red/30'
                                  : 'bg-black-primary/60 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                active ? 'bg-brand-red/20 border-brand-red/40 text-brand-red' : 'bg-white/5 border-white/10 text-gray-400'
                              }`}>
                                <SrvIcon size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white mb-0.5">
                                  {lang === 'en' ? srv.titleEn : srv.titleAr}
                                </p>
                                <p className="text-[10px] text-gray-400 leading-tight">
                                  {lang === 'en' ? srv.descEn : srv.descAr}
                                </p>
                              </div>
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-all ${
                                active ? 'bg-brand-red border-brand-red text-white' : 'border-gray-600 bg-black/40'
                              }`}>
                                {active && <Check size={10} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 7. CONTACT DETAILS & NOTES */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                        <User size={14} className="text-brand-red" />
                        <span>{lang === 'en' ? 'Contact Details & Notes' : 'بيانات التواصل والملاحظات'}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="block text-xs text-gray-400 mb-1.5">{lang === 'en' ? 'Full Name *' : 'الاسم بالكامل *'}</span>
                          <input
                            required
                            type="text"
                            name="name"
                            placeholder={lang === 'en' ? 'e.g. Ahmed Ali' : 'مثال: أحمد علي'}
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-black-primary border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red outline-none transition-colors text-sm"
                          />
                        </div>
                        <div>
                          <span className="block text-xs text-gray-400 mb-1.5">{lang === 'en' ? 'Phone Number (WhatsApp) *' : 'رقم الهاتف (واتساب) *'}</span>
                          <input
                            required
                            type="tel"
                            name="phone"
                            dir="ltr"
                            placeholder="010XXXXXXXX"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full bg-black-primary border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red outline-none transition-colors text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400 mb-1.5">{lang === 'en' ? 'Special Requests or Dietary Requirements (Optional)' : 'ملاحظات خاصة أو طلبات إضافية (اختياري)'}</span>
                        <textarea
                          rows="2"
                          name="notes"
                          placeholder={lang === 'en' ? 'Any specific preferences, timing requirements, or notes...' : 'أي تفاصيل عن التوقيت، تفضيلات معينة، أو تجهيزات خاصة...'}
                          value={formData.notes}
                          onChange={handleInputChange}
                          className="w-full bg-black-primary border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-brand-red outline-none transition-colors text-sm resize-none"
                        />
                      </div>
                    </div>

                    {/* SUBMIT BUTTONS */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-brand-red hover:bg-brand-red-dark disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-red/25 cursor-pointer text-sm sm:text-base"
                      >
                        {isSubmitting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Send size={16} />
                            <span>{lang === 'en' ? 'Submit Catering Request' : 'إرسال طلب الحجز'}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        disabled={isSubmitting}
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-colors cursor-pointer text-sm sm:text-base border border-white/10"
                      >
                        {lang === 'en' ? 'Cancel' : 'إلغاء'}
                      </button>
                    </div>

                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {isOtpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-black-surface border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
              dir={lang === 'en' ? 'ltr' : 'rtl'}
            >
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setIsOtpModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="text-brand-red" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-light">
                    {lang === 'en' ? 'Phone Verification' : 'تأكيد رقم الهاتف'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === 'en' 
                      ? 'Confirming phone number via WhatsApp OTP' 
                      : 'للتأكد من صحة رقمك، أرسلنا لك كود على الواتساب'}
                  </p>
                </div>
              </div>

              <div className="bg-black-primary/50 rounded-xl p-4 mb-6 border border-white/5">
                <p className="text-sm text-gray-300 leading-relaxed text-center">
                  {lang === 'en' 
                    ? `We sent a 6-digit verification code to WhatsApp on number (${formData.phone}). Please enter it below:` 
                    : `لقد أرسلنا كود مكون من 6 أرقام إلى واتساب الرقم (${formData.phone}). يرجى إدخاله للتحقق:`}
                </p>
              </div>

              <form onSubmit={handleConfirmOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 text-center">
                    {lang === 'en' ? 'Enter 6-Digit Code' : 'أدخل الكود (6 أرقام)'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="w-full bg-black-primary border border-brand-red/40 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] text-text-light focus:outline-none focus:border-brand-red transition-colors"
                    autoFocus
                  />
                </div>

                {otpError && (
                  <p className="text-xs text-brand-red font-semibold flex items-center justify-center gap-1.5 animate-in fade-in">
                    <AlertCircle size={14} />
                    {otpError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerOtp}
                    disabled={otpCountdown > 0 || isSendingOtp}
                    className="text-xs text-brand-red hover:underline disabled:opacity-50 disabled:no-underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                    {otpCountdown > 0 
                      ? (lang === 'en' ? `Resend in (${otpCountdown}s)` : `إعادة الإرسال بعد (${otpCountdown} ث)`) 
                      : (lang === 'en' ? 'Resend WhatsApp Code' : 'إعادة إرسال الكود')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOtpModalOpen(false); setOtpError(''); }}
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    {lang === 'en' ? 'Change Phone' : 'تغيير الرقم'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={otpInput.length !== 6 || isSubmitting}
                  className="w-full py-4 bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (lang === 'en' ? 'Confirm and Proceed' : 'تأكيد وإرسال الطلب')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
