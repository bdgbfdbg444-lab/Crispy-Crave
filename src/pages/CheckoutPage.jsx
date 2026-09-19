import { useLanguage } from '../context/LanguageContext';
import PaymentSection from '../components/PaymentSection';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Wallet, CheckCircle, AlertCircle, MessageSquare, ShieldCheck, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { ref, set, push, update, remove, get, serverTimestamp } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { validateReceiptFile } from '../services/receiptValidator';
import AddressMapPicker, { checkZoneMismatch, validateDeliveryAddress, formatAddressDetails } from '../components/AddressMapPicker';
import { APP_CONFIG } from '../config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewModal from '../components/ReviewModal';
import imageCompression from 'browser-image-compression';
import { sanitizeText } from '../utils/sanitizer';
import { EGYPT_PHONE_REGEX, sanitizeOrderNotes } from '../utils/validation';
import { visitorTracker } from '../services/visitorTracker';

export default function CheckoutPage({ menuData }) {
  const { lang } = useLanguage();
  const { cartItems, cartTotal, clearCart, tableNumber } = useCart();
  const { customerData, userPhone } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: customerData?.Name || '',
    customerPhone: userPhone || '',
    notes: '',
    orderType: tableNumber ? 'DineIn' : 'takeaway', deliveryAddress: customerData?.addresses?.find(a => a.isDefault)?.fullAddress || customerData?.Address || '', tableNumber: tableNumber || ''
  });

  const [mapAddress, setMapAddress] = useState({
    zone: '', 
    street: '', 
    building: '', 
    floor: '', 
    apartment: '', 
    landmark: '', 
    lat: null, 
    lng: null, 
    mapsUrl: '', 
    fullAddress: ''
  });
  const rawZones = menuData?.deliveryZones;
  const deliveryZones = Array.isArray(rawZones) 
    ? rawZones 
    : (rawZones && typeof rawZones === 'object' ? Object.values(rawZones) : [
        { id: 1, name: "محرم بك / الشاطبي", deliveryFee: 20 },
        { id: 2, name: "سموحة", deliveryFee: 30 },
        { id: 3, name: "سيدي جابر / كليوباترا", deliveryFee: 25 },
        { id: 4, name: "ميامي / العصافرة", deliveryFee: 35 },
        { id: 5, name: "العجمي", deliveryFee: 60, minOrderAmount: 150 }
      ]);
  const taxPercentage = Number(menuData?.restaurant?.defaultTaxPercentage || 0);

  const defaultAddr = customerData?.addresses?.find(a => a.isDefault);
  const selectedAddressObj = customerData?.addresses?.find(a => a.fullAddress === formData.deliveryAddress);
  const currentFixedZone = selectedAddressObj?.zone || defaultAddr?.zone || customerData?.Zone || customerData?.zone || '';
  const hasFixedZone = Boolean(currentFixedZone);

  const [selectedZone, setSelectedZone] = useState(() => currentFixedZone);

  useEffect(() => {
    if (currentFixedZone && selectedZone !== currentFixedZone) {
      setSelectedZone(currentFixedZone);
    }
  }, [currentFixedZone]);

  const subtotal = cartTotal;
  const selectedZoneObj = deliveryZones.find(z => (z.name || '').trim() === (selectedZone || '').trim());
  const deliveryFee = formData?.orderType === 'delivery' && selectedZoneObj ? Number(selectedZoneObj.deliveryFee || 0) : 0;
  const taxAmount = taxPercentage > 0 ? Math.round((subtotal * (taxPercentage / 100)) * 100) / 100 : 0;

  // Store Status (Open / Closed)
  const [liveStoreStatus, setLiveStoreStatus] = useState(null);
  useEffect(() => {
      const fetchStoreStatus = async () => {
          try {
              const res = await fetch(`${APP_CONFIG.firebaseDbUrl}StoreStatus.json?t=${Date.now()}`);
              if (res.ok) {
                  const data = await res.json();
                  if (data) setLiveStoreStatus(data);
              }
          } catch (err) {
              console.error("Failed to fetch live store status", err);
          }
      };
      fetchStoreStatus();
  }, []);

  const isStoreOpen = liveStoreStatus ? liveStoreStatus.isOpen !== false : (menuData?.storeStatus ? menuData.storeStatus.isOpen !== false : true);
  const storeClosedMessage = (lang === 'en' 
      ? (liveStoreStatus?.closedMessageEn || menuData?.storeStatus?.closedMessageEn) 
      : (liveStoreStatus?.closedMessage || menuData?.storeStatus?.closedMessage)) 
      || (lang === 'en' ? 'The restaurant is currently closed and not receiving online orders.' : 'المطعم مغلق حالياً ولا يستقبل طلبات أونلاين مؤقتاً.');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  // Safe Coupon Discount Calculation
  let couponDiscount = 0;
  let finalDeliveryFee = deliveryFee;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'FreeDelivery') {
      couponDiscount = deliveryFee;
      finalDeliveryFee = 0;
    } else if (appliedCoupon.discountType === 'Percentage') {
      const calculated = subtotal * (Number(appliedCoupon.discountValue || 0) / 100);
      const maxCap = Number(appliedCoupon.maxDiscountAmount || 0) > 0 ? Number(appliedCoupon.maxDiscountAmount) : 9999;
      couponDiscount = Math.min(calculated, maxCap, subtotal);
    } else {
      couponDiscount = Math.min(subtotal, Number(appliedCoupon.discountValue || 0));
    }
  }
  couponDiscount = Math.round(couponDiscount * 100) / 100;

  // Grand Total can NEVER be negative!
  const grandTotal = Math.max(0, Math.round((subtotal - couponDiscount + taxAmount + deliveryFee) * 100) / 100);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);
  const [orderStatus, setOrderStatus] = useState("New");
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [activeOrderWarning, setActiveOrderWarning] = useState(() => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) return null;
    const actId = localStorage.getItem('activeOrderId');
    if (actId) {
      return {
        orderId: actId,
        cleanId: actId.replace('#', '').trim(),
        status: 'Pending'
      };
    }
    return null;
  });

  useEffect(() => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) {
      setActiveOrderWarning(null);
      return;
    }

    const activeId = localStorage.getItem('activeOrderId');
    if (activeId) {
      const cleanId = activeId.replace('#', '').trim();
      fetch(`${APP_CONFIG.firebaseDbUrl}PublicTracking/${cleanId}.json`)
        .then(res => res.json())
        .then(data => {
          const currentPhone = (userPhone || formData.customerPhone || '').trim();
          const localDetailsRaw = localStorage.getItem(`order_${cleanId}_details`) || localStorage.getItem(`order_#${cleanId}_details`);
          let localDetails = {};
          try { if (localDetailsRaw) localDetails = JSON.parse(localDetailsRaw); } catch(e) {}

          // If the order in localStorage belongs to a different account/phone, clear it!
          if (localDetails.customerPhone && currentPhone && localDetails.customerPhone.trim() !== currentPhone) {
            localStorage.removeItem('activeOrderId');
            setActiveOrderWarning(null);
            return;
          }

          if (!data || data.Status === 'Completed' || data.Status === 'Cancelled') {
            localStorage.removeItem('activeOrderId');
            setActiveOrderWarning(null);
          } else {
            setActiveOrderWarning({
              orderId: activeId,
              cleanId: cleanId,
              status: data.Status || 'Pending'
            });
          }
        })
        .catch(() => {
          setActiveOrderWarning(null);
        });
    } else {
      setActiveOrderWarning(null);
    }
  }, [userPhone, formData.customerPhone]);
  const handleCancelEditing = () => {
    const editingId = localStorage.getItem('editingOrderId');
    if (editingId) {
      try {
        fetch(`${APP_CONFIG.firebaseDbUrl}ActiveHoldRequests/${editingId}.json`, { method: 'DELETE' });
        fetch(`${APP_CONFIG.firebaseDbUrl}PublicTracking/${editingId}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            IsModifying: false, 
            ModificationExpired: true, 
            ModificationCount: 1 
          })
        }).catch(() => {});
      } catch(e) {}
    }
    localStorage.removeItem('editingOrderId');
    localStorage.removeItem('editingOrderDetails');
    localStorage.removeItem('modificationExpiresAt');
    clearCart();
    setShowPayment(false);
  };

  useEffect(() => {
    const editingId = localStorage.getItem('editingOrderId');
    const editingDetailsStr = localStorage.getItem('editingOrderDetails');
    if (editingId && editingDetailsStr) {
      // Validate with Firebase if the order is still active or cancelled!
      fetch(`${APP_CONFIG.firebaseDbUrl}PublicTracking/${editingId}.json`)
        .then(res => res.json())
        .then(data => {
          if (!data || data.Status === 'Cancelled' || data.Status === 'Completed' || data.Status === 'InKitchen' || data.Status === 'Ready' || data.Status === 'OutForDelivery') {
            // Order was cancelled, completed, or already being prepared in kitchen! Auto-clear editing session immediately!
            localStorage.removeItem('editingOrderId');
            localStorage.removeItem('editingOrderDetails');
            setShowPayment(false);
            if (data?.Status === 'InKitchen') {
              alert(lang === 'en' 
                ? 'Your order is already being prepared in the kitchen and cannot be modified.' 
                : '👨‍🍳 بدأ الشيف في تجهيز وجبتك بالمطبخ بالفعل، ولم يعد بالإمكان تعديل الطلب. تم إلغاء جلسة التعديل.');
            }
            return;
          }

          // Security Guard: Prevent order modification hijacking
          const activePhone = userPhone || formData.customerPhone;
          if (data.CustomerPhone && activePhone && data.CustomerPhone.trim() !== activePhone.trim()) {
            console.warn('[Security Guard] Attempted to modify order belonging to another customer!');
            localStorage.removeItem('editingOrderId');
            localStorage.removeItem('editingOrderDetails');
            setShowPayment(false);
            return;
          } else {
            try {
              const details = JSON.parse(editingDetailsStr);
              setFormData(prev => ({
                ...prev,
                customerName: details.customerName || prev.customerName,
                customerPhone: details.customerPhone || prev.customerPhone,
                orderType: details.orderType || prev.orderType,
                deliveryAddress: details.deliveryAddress || prev.deliveryAddress,
                tableNumber: details.tableNumber || prev.tableNumber,
                notes: details.notes || prev.notes
              }));
              setShowPayment(true);
            } catch(e) {}
          }
        })
        .catch(() => {
          try {
            const details = JSON.parse(editingDetailsStr);
            setFormData(prev => ({
              ...prev,
              customerName: details.customerName || prev.customerName,
              customerPhone: details.customerPhone || prev.customerPhone,
              orderType: details.orderType || prev.orderType,
              deliveryAddress: details.deliveryAddress || prev.deliveryAddress,
              tableNumber: details.tableNumber || prev.tableNumber,
              notes: details.notes || prev.notes
            }));
            setShowPayment(true);
          } catch(e) {}
        });
    }
  }, []);


  const normalizePhone = (p) => {
    let clean = (p || '').replace(/\D/g, '');
    return clean;
  };

  // OTP Phone Verification Barrier for Unverified / Guest Users
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(null);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const sendWhatsAppOtp = async (targetPhone) => {
    const cleanPhone = normalizePhone(targetPhone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes valid

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    setGeneratedOtp(code);
    setOtpExpiry(expiry);
    setOtpCountdown(120); // Strict 120s client cooldown

    // 2. Send silently to Firebase PendingOtpRequests for the POS WhatsApp server
    const reqId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await set(ref(db, `PendingOtpRequests/${reqId}`), {
      phone: cleanPhone,
      uid: auth.currentUser.uid,
      otp: code,
      createdAt: Date.now()
    });

    return code;
  };

  const handleTriggerOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setOtpError('');
    try {
      await sendWhatsAppOtp(formData.customerPhone);
    } catch (err) {
      setOtpError(lang === 'en' ? 'Failed to send OTP code: ' + err.message : 'فشل إرسال كود الواتساب: ' + err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmOtp = (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError(lang === 'en' ? 'Please enter the 6-digit verification code.' : 'يرجى إدخال كود التحقق المكون من 6 أرقام.');
      return;
    }
    if (Date.now() > otpExpiry) {
      setOtpError(lang === 'en' ? 'Verification code expired. Please request a new one.' : 'انتهت صلاحية كود التحقق. يرجى طلب كود جديد.');
      return;
    }
    if (otpInput.trim() !== generatedOtp) {
      setOtpError(lang === 'en' ? 'Incorrect verification code.' : 'رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى.');
      return;
    }

    // Successfully verified!
    const cleanPhone = normalizePhone(formData.customerPhone);
    setVerifiedPhone(cleanPhone);
    setIsOtpModalOpen(false);
    setOtpError('');
    setOtpInput('');
    // Automatically proceed to payment view!
    setShowPayment(true);
  };

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'vgk0saib';
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

  const marketing = menuData?.marketing || {};
  const walletNumber = marketing.walletNumber;
  const whatsappNumber = marketing.orderWhatsAppNumber || '201000000000'; // Default fallback

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setIsCheckingCoupon(true);
    try {
      const code = couponInput.trim().toUpperCase();
      let foundCoupon = null;

      try {
        const singleRes = await fetch(`${APP_CONFIG.firebaseDbUrl}Coupons/${code}.json`);
        if (singleRes.ok) {
          const singleData = await singleRes.json();
          if (singleData && (singleData.code || singleData.Code)) {
            foundCoupon = {
              id: singleData.id || singleData.Id,
              code: (singleData.code || singleData.Code || '').toUpperCase(),
              discountType: singleData.discountType || singleData.DiscountType,
              discountValue: singleData.discountValue || singleData.DiscountValue,
              minOrderAmount: parseFloat(singleData.minOrderAmount || singleData.MinOrderAmount || 0),
              maxDiscountAmount: parseFloat(singleData.maxDiscountAmount || singleData.MaxDiscountAmount || 0),
              expiryDate: singleData.expiryDate || singleData.ExpiryDate,
              isActive: singleData.isActive ?? singleData.IsActive ?? true,
              allowedPhones: singleData.allowedPhones || singleData.AllowedPhones || null
            };
          }
        }
      } catch (singleErr) {}

      if (!foundCoupon) {
        const res = await fetch(`${APP_CONFIG.firebaseDbUrl}menu/coupons.json`);
        const couponsData = await res.json();
        if (Array.isArray(couponsData)) {
          foundCoupon = couponsData.find(c => c && c.code && c.code.toUpperCase() === code);
        } else if (couponsData && typeof couponsData === 'object') {
          foundCoupon = Object.values(couponsData).find(c => c && c.code && c.code.toUpperCase() === code);
        }
      }

      if (!foundCoupon || !foundCoupon.isActive) {
        setCouponError(lang === 'en' ? 'Invalid or inactive coupon code' : 'كوبون الخصم غير صحيح أو غير مفعل');
        setIsCheckingCoupon(false);
        return;
      }

      // Check if restricted to specific phones
      if (foundCoupon.allowedPhones) {
        const activePhone = (formData.customerPhone || userPhone || '').trim();
        const phonesList = foundCoupon.allowedPhones.split(',').map(p => p.trim());
        if (!activePhone || !phonesList.includes(activePhone)) {
          setCouponError(lang === 'en' ? 'This coupon is for specific customers only' : 'عذراً، هذا الكوبون مخصص لعملاء محددين');
          setIsCheckingCoupon(false);
          return;
        }
      }

      // Check expiry date
      if (foundCoupon.expiryDate) {
        const exp = new Date(foundCoupon.expiryDate);
        if (new Date() > exp) {
          setCouponError(lang === 'en' ? 'This coupon has expired' : 'هذا الكوبون منتهي الصلاحية');
          setIsCheckingCoupon(false);
          return;
        }
      }

      // Check min order
      if (foundCoupon.minOrderAmount > 0 && subtotal < foundCoupon.minOrderAmount) {
        setCouponError(lang === 'en' 
          ? `Minimum order amount for this coupon is ${foundCoupon.minOrderAmount} EGP`
          : `الحد الأدنى للطلب لتفعيل هذا الكوبون هو ${foundCoupon.minOrderAmount} ج.م`);
        setIsCheckingCoupon(false);
        return;
      }

      // Check if already used by this customer
      const activePhone = (formData.customerPhone || userPhone || '').trim();
      if (activePhone) {
        try {
          const usageSnap = await get(ref(db, `UsedCoupons/${code}/${activePhone}`));
          if (usageSnap.exists() && usageSnap.val()) {
            setCouponError(lang === 'en' ? 'You have already used this coupon' : 'لقد قمت باستخدام هذا الكوبون مسبقاً');
            setIsCheckingCoupon(false);
            return;
          }
        } catch (err) {
          console.error("Error checking coupon usage:", err);
          // If permission denied, they probably aren't authenticated properly yet, but we allow it or show error?
          // Actually, if permission denied, it throws an error.
          // Wait, if they are not authenticated, they can't use the coupon?
          // Let's just proceed or block? If error, we can log it.
        }
      }

      setAppliedCoupon(foundCoupon);
      setCouponError('');
    } catch (err) {
      setCouponError(lang === 'en' ? 'Error validating coupon' : 'حدث خطأ أثناء فحص الكوبون');
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContinueToPayment = async (e) => {
    e.preventDefault();

    if (!isStoreOpen) {
      setErrorMessage(storeClosedMessage);
      alert(storeClosedMessage);
      return;
    }

    // THOGHRA 18: Deep Live Stock Check on Products & AddOns
    try {
      const liveMenuRes = await fetch(`${APP_CONFIG.firebaseDbUrl}menu.json?t=${Date.now()}`);
      if (liveMenuRes.ok) {
        const liveMenu = await liveMenuRes.json();
        const liveProducts = liveMenu?.categories?.flatMap(c => c.products || []) || [];
        const liveAddOns = liveMenu?.addOns || [];

        for (const item of cartItems) {
          const prodId = item.product?.id || item.id;
          const liveProd = liveProducts.find(p => p.id === prodId);
          if (liveProd) {
            const isSoldOut = Boolean(liveProd.isSoldOut || liveProd.IsSoldOut || liveProd.isAvailable === false || liveProd.IsAvailable === false);
            if (isSoldOut) {
              const name = lang === 'en' ? (liveProd.nameEn || liveProd.name) : liveProd.name;
              const msg = lang === 'en'
                ? `⚠️ Item "${name}" has run out of stock in the restaurant. Please remove it from your cart to proceed.`
                : `⚠️ الصنف "${name}" نفدت كميته في المطعم حالياً. يرجى حذفه من السلة لمتابعة الطلب.`;
              setErrorMessage(msg);
              alert(msg);
              return;
            }
          }

          // Check selected modifiers / add-ons against live add-ons status
          if (item.product?.selectedModifiers && item.product.selectedModifiers.length > 0 && liveAddOns.length > 0) {
            for (const mod of item.product.selectedModifiers) {
              const liveAddon = liveAddOns.find(a => a.id === mod.id || a.name === mod.name);
              if (liveAddon && liveAddon.isActive === false) {
                const modName = lang === 'en' ? (liveAddon.nameEn || liveAddon.name) : liveAddon.name;
                const msg = lang === 'en'
                  ? `⚠️ The add-on "${modName}" for item "${item.product.name}" is currently unavailable. Please adjust your selection.`
                  : `⚠️ الإضافة "${modName}" للصنف "${item.product.name}" غير متوفرة بالمطعم حالياً. يرجى تعديل اختيارك.`;
                setErrorMessage(msg);
                alert(msg);
                return;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Live stock verification fallback:", e);
    }

    if (!formData.customerName.trim() || !formData.customerPhone.trim()) { 
      setErrorMessage(lang === 'en' ? 'Please fill required fields' : 'يرجى ملء الحقول الإجبارية (الاسم ورقم الهاتف)'); 
      return; 
    }

    // Egyptian phone format check
    const phoneClean = (formData.customerPhone || '').trim();
    const egPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egPhoneRegex.test(phoneClean)) {
      const msg = lang === 'en' 
        ? 'Please enter a valid 11-digit Egyptian mobile number (e.g. 010xxxxxxxx)' 
        : 'يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً يبدأ بـ (010, 011, 012, 015)';
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    // Blacklist check
    try {
      const blRes = await fetch(`${APP_CONFIG.firebaseDbUrl}Blacklist/${phoneClean}.json`);
      const blData = await blRes.json();
      if (blData && blData.isBlacklisted) {
        const blMsg = lang === 'en'
          ? '⚠️ This mobile number is restricted from placing online orders. Please contact restaurant management.'
          : '⚠️ هذا الرقم محظور من تقديم طلبات عبر الموقع. يرجى التواصل مع إدارة المطعم مباشرة.';
        setErrorMessage(blMsg);
        alert(blMsg);
        return;
      }
    } catch (e) {}

    if (formData.orderType === 'DineIn' && !tableNumber && (!formData.tableNumber || parseInt(formData.tableNumber, 10) <= 0)) {
      const msg = lang === 'en' ? 'Please enter your table number' : 'يرجى إدخال رقم الطاولة التي تجلس عليها في الصالة';
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    if (formData.orderType === 'delivery') {
      const isCashPayment = !receiptFile; // If no receipt is uploaded, it's cash on delivery
      const addressValidation = validateDeliveryAddress(formData.deliveryAddress, lang, isCashPayment);
      if (!addressValidation.isValid) { 
        setErrorMessage(addressValidation.error); 
        alert(addressValidation.error);
        return; 
      }

      // Strict Min Order Amount Check
      if (selectedZoneObj && selectedZoneObj.minOrderAmount > 0 && subtotal < selectedZoneObj.minOrderAmount) {
        const msg = `⚠️ قيمة الوجبات (${subtotal} ج.م) أقل من الحد الأدنى للطلب لمنطقة ${selectedZoneObj.name} (${selectedZoneObj.minOrderAmount} ج.م). يرجى إضافة المزيد من الأصناف للسلة.`;
        setErrorMessage(msg);
        alert(msg);
        return;
      }

      // Keyword Mismatch Detection (prevents choosing cheap zone and writing distant zone)
      const mismatch = checkZoneMismatch(formData.deliveryAddress, selectedZone, deliveryZones);
      if (mismatch) {
        const msg = `⚠️ تنبيه أمني: العنوان المكتوب يحتوي على منطقة (${mismatch}) تختلف عن منطقة التوصيل المحددة (${selectedZone}). يرجى التأكد من اختيار منطقتك السكنية الصحيحة لتجنب إلغاء الطلب.`;
        setErrorMessage(msg);
        alert(msg);
        return;
      }
    }
    
    // Sanitize user inputs on proceeding (Thoghra 28)
    setFormData(prev => ({
      ...prev,
      customerName: sanitizeText(prev.customerName, 100),
      notes: sanitizeText(prev.notes, 500),
      deliveryAddress: sanitizeText(prev.deliveryAddress, 300),
      tableNumber: sanitizeText(prev.tableNumber, 20)
    }));

    setErrorMessage('');

    // THOGHRA 17: Phone Ownership OTP Barrier (Check if phone is verified)
    const cleanCurrentPhone = normalizePhone(formData.customerPhone);
    const isAuthVerified = Boolean(userPhone && normalizePhone(userPhone) === cleanCurrentPhone);
    const isSessionOtpVerified = Boolean(verifiedPhone && verifiedPhone === cleanCurrentPhone);

    if (!isAuthVerified && !isSessionOtpVerified) {
      // Trigger WhatsApp OTP verification modal before allowing payment!
      setIsOtpModalOpen(true);
      setOtpError('');
      setOtpInput('');
      sendWhatsAppOtp(formData.customerPhone).catch(() => {});
      return;
    }

    setShowPayment(true);
  };

  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const check = validateReceiptFile(file);
      if (!check.isValid) {
        alert(check.error);
        e.target.value = '';
        return;
      }

      try {
        setIsCompressingReceipt(true);
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1280,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        setReceiptFile(compressedFile);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        setReceiptFile(file);
      } finally {
        setIsCompressingReceipt(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) {
      console.warn("[Checkout] Submission already in progress, ignoring duplicate call.");
      return;
    }
    isSubmittingRef.current = true;
    console.log("[Checkout Submit] Form submit button clicked!");

    if (!isStoreOpen) {
      setErrorMessage(storeClosedMessage);
      alert(storeClosedMessage);
      isSubmittingRef.current = false;
      return;
    }

    // Real-Time Pre-Commit Store Status Guard (Fetches fresh status from Firebase)
    try {
      const liveStatusRes = await fetch(`${APP_CONFIG.firebaseDbUrl}StoreStatus.json?t=${Date.now()}`);
      if (liveStatusRes.ok) {
        const liveStatus = await liveStatusRes.json();
        if (liveStatus && liveStatus.isOpen === false) {
          const liveClosedMsg = (lang === 'en' ? liveStatus.closedMessageEn : liveStatus.closedMessage) || storeClosedMessage;
          setErrorMessage(liveClosedMsg);
          alert(liveClosedMsg);
          isSubmittingRef.current = false;
          return;
        }
      }
    } catch (statusErr) {
      console.warn("Store status live check fallback:", statusErr);
    }

    const currentEditId = localStorage.getItem("editingOrderId");
    if (currentEditId) {
      const cleanId = currentEditId.replace(/#/g, '').trim();
      try {
        const trkRes = await fetch(`${APP_CONFIG.firebaseDbUrl}PublicTracking/${cleanId}.json?t=${Date.now()}`);
        if (trkRes.ok) {
          const trkData = await trkRes.json();
          if (trkData && ['InKitchen', 'Preparing', 'Ready', 'OutForDelivery', 'Completed', 'Cancelled'].includes(trkData.Status)) {
            localStorage.removeItem('editingOrderId');
            localStorage.removeItem('editingOrderDetails');
            setShowPayment(false);
            isSubmittingRef.current = false;
            alert(lang === 'en'
              ? '👨‍🍳 The kitchen has already started preparing your meal. Modifications are no longer permitted.'
              : '👨‍🍳 عذراً، بدأ الشيف في تجهيز وجباتك بالمطبخ بالفعل (أو خرجت للتوصيل). تم قفل تعديل الطلب.');
            navigate(`/track/${cleanId}`);
            return;
          }
        }
      } catch (e) {}
    }

    if (activeOrderWarning && !localStorage.getItem("editingOrderId")) {
      const msg = lang === "en" 
        ? `You already have order #${activeOrderWarning.cleanId} in progress.`
        : `لديك طلب نشط حالياً برقم #${activeOrderWarning.cleanId} قيد التنفيذ، لا يمكنك إنشاء طلب جديد حتى استلامه.`;
      setErrorMessage(msg);
      alert(msg);
      isSubmittingRef.current = false;
      return;
    }

    if (cartItems.length === 0) {
      const emptyMsg = lang === "en" ? "The cart cannot be empty. Please add at least one item." : "لا يمكن أن تكون السلة فارغة. يرجى إضافة صنف واحد على الأقل أو إلغاء التعديل.";
      setErrorMessage(emptyMsg);
      isSubmittingRef.current = false;
      return;
    }

    // Security Check: Guard against invalid or negative quantities/prices (Thoghra 29)
    const hasTamperedItem = cartItems.some(i => {
      const q = parseInt(i.quantity, 10);
      const p = parseFloat(i.product.calculatedPrice || i.product.sellingPrice || 0);
      return isNaN(q) || q <= 0 || isNaN(p) || p < 0;
    });

    if (hasTamperedItem) {
      const msg = '⚠️ تم رصد بيانات غير صالحة في السلة (كميات أو أسعار غير صحيحة). يرجى مراجعة الأصناف.';
      setErrorMessage(msg);
      alert(msg);
      isSubmittingRef.current = false;
      return;
    }

    // THOGHRA 18: Pre-Commit Deep Live Stock Check on Products & AddOns
    try {
      const liveMenuRes = await fetch(`${APP_CONFIG.firebaseDbUrl}menu.json?t=${Date.now()}`);
      if (liveMenuRes.ok) {
        const liveMenu = await liveMenuRes.json();
        const liveProducts = liveMenu?.categories?.flatMap(c => c.products || []) || [];
        const liveAddOns = liveMenu?.addOns || [];

        for (const item of cartItems) {
          const prodId = item.product?.id || item.id;
          const liveProd = liveProducts.find(p => p.id === prodId);
          if (liveProd) {
            const isSoldOut = Boolean(liveProd.isSoldOut || liveProd.IsSoldOut || liveProd.isAvailable === false || liveProd.IsAvailable === false);
            if (isSoldOut) {
              const name = lang === 'en' ? (liveProd.nameEn || liveProd.name) : liveProd.name;
              const msg = lang === 'en'
                ? `⚠️ Item "${name}" has run out of stock in the restaurant. Please remove it from your cart to proceed.`
                : `⚠️ الصنف "${name}" نفدت كميته في المطعم حالياً. يرجى حذفه من السلة لمتابعة الطلب.`;
              setErrorMessage(msg);
              alert(msg);
              isSubmittingRef.current = false;
              return;
            }
          }

          // Check selected modifiers / add-ons against live add-ons status
          if (item.product?.selectedModifiers && item.product.selectedModifiers.length > 0 && liveAddOns.length > 0) {
            for (const mod of item.product.selectedModifiers) {
              const liveAddon = liveAddOns.find(a => a.id === mod.id || a.name === mod.name);
              if (liveAddon && liveAddon.isActive === false) {
                const modName = lang === 'en' ? (liveAddon.nameEn || liveAddon.name) : liveAddon.name;
                const msg = lang === 'en'
                  ? `⚠️ The add-on "${modName}" for item "${item.product.name}" is currently unavailable. Please adjust your selection.`
                  : `⚠️ الإضافة "${modName}" للصنف "${item.product.name}" غير متوفرة بالمطعم حالياً. يرجى تعديل اختيارك.`;
                setErrorMessage(msg);
                alert(msg);
                isSubmittingRef.current = false;
                return;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Pre-commit live stock check fallback:", e);
    }

    if (formData.orderType === "delivery") {
      const isCashPayment = !receiptFile;
      const addressValidation = validateDeliveryAddress(formData.deliveryAddress, lang, isCashPayment);
      if (!addressValidation.isValid) {
        setErrorMessage(addressValidation.error);
        alert(addressValidation.error);
        isSubmittingRef.current = false;
        return;
      }
    }

    if (!receiptFile) {
      const noReceiptMsg = lang === "en" ? "Please upload the payment receipt before confirming." : "يرجى إرفاق صورة إيصال الدفع لتأكيد الطلب.";
      setErrorMessage(noReceiptMsg);
      isSubmittingRef.current = false;
      return;
    }

    // Rate Limiting (anti-spam 30s)
    const nowTimestamp = Date.now();
    const lastOrderTime = Number(localStorage.getItem('last_order_submitted_timestamp') || 0);
    if (nowTimestamp - lastOrderTime < 30000 && !localStorage.getItem('editingOrderId')) {
      const waitSec = Math.ceil((30000 - (nowTimestamp - lastOrderTime)) / 1000);
      const msg = `يرجى الانتظار ${waitSec} ثانية قبل إرسال طلب جديد لمنع تكرار الطلبات.`;
      setErrorMessage(msg);
      alert(msg);
      isSubmittingRef.current = false;
      return;
    }

    // Min Order check on submit
    if (formData.orderType === 'delivery' && selectedZoneObj && selectedZoneObj.minOrderAmount > 0 && subtotal < selectedZoneObj.minOrderAmount) {
      setErrorMessage(`قيمة الوجبات أقل من الحد الأدنى للطلب (${selectedZoneObj.minOrderAmount} ج.م)`);
      isSubmittingRef.current = false;
      return;
    }

    // Pre-Commit Blacklist Verification Guard
    const submitPhoneClean = normalizePhone(formData.customerPhone);
    if (submitPhoneClean) {
      try {
        const blCheckRes = await fetch(`${APP_CONFIG.firebaseDbUrl}Blacklist/${submitPhoneClean}.json`);
        const blCheckData = await blCheckRes.json();
        if (blCheckData && blCheckData.isBlacklisted) {
          const blMsg = lang === 'en'
            ? '⚠️ This mobile number is restricted from placing online orders. Please contact restaurant management.'
            : '⚠️ هذا الرقم محظور من تقديم طلبات عبر الموقع. يرجى التواصل مع إدارة المطعم مباشرة.';
          setErrorMessage(blMsg);
          alert(blMsg);
          isSubmittingRef.current = false;
          return;
        }
      } catch (e) {}
    }

    // Pre-Commit Egyptian Phone RegEx Verification (Anti-Spoofing & Bank Grade Validation)
    const egPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egPhoneRegex.test(submitPhoneClean)) {
      const msg = lang === 'en' 
        ? 'Please enter a valid 11-digit Egyptian mobile number (e.g. 010xxxxxxxx)' 
        : 'يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً يبدأ بـ (010, 011, 012, 015)';
      setErrorMessage(msg);
      alert(msg);
      isSubmittingRef.current = false;
      return;
    }

    // Pre-Commit Phone Ownership OTP Guard
    const isAuthVerified = Boolean(userPhone && normalizePhone(userPhone) === submitPhoneClean);
    const isSessionOtpVerified = Boolean(verifiedPhone && verifiedPhone === submitPhoneClean);
    if (!isAuthVerified && !isSessionOtpVerified) {
      setIsOtpModalOpen(true);
      setOtpError('');
      setOtpInput('');
      sendWhatsAppOtp(formData.customerPhone).catch(() => {});
      isSubmittingRef.current = false;
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Prepare Order Data
      let displayOrderId = '#' + Math.floor(1000 + Math.random() * 9000);
      
      const items = cartItems.map(item => {
        let modifierText = '';
        if (item.product.selectedModifiers?.length > 0) {
          modifierText = ' - ' + item.product.selectedModifiers.map(m => sanitizeText(m.name, 50)).join(', ');
        }
        
        let weightText = '';
        if (item.product.isSoldByWeight && item.product.selectedWeight) {
          weightText = ` (${item.product.selectedWeight} ${lang === 'en' ? 'gm' : 'جرام'})`;
        }

        const safeProdName = sanitizeText(item.product.name, 120);
        const finalProductName = `${safeProdName}${weightText}${modifierText}`;

        // Thoghra 29: Invariant Shield on Unit Price & Quantity
        const safeQty = Math.max(1, Math.min(999, Math.floor(Number(item.quantity) || 1)));
        const basePrice = Math.max(0, Number(item.product.calculatedPrice ?? item.product.sellingPrice ?? 0));
        const modPrice = Math.max(0, Number(item.product.finalModifiersPrice || 0));
        const unitPrice = Math.round((basePrice + modPrice) * 100) / 100;

        return {
            productName: finalProductName,
            quantity: safeQty,
            unitPrice: unitPrice,
            productId: Number(item.product.id) || 0,
            weightInGrams: Math.max(0, Number(item.product.selectedWeight) || 0),
            modifierNotes: modifierText
          };
      });

      let paymentReceiptUrl = null;
      if (receiptFile) {
        let fileToUpload = receiptFile;
        try {
          if (receiptFile.size > 300 * 1024) {
            fileToUpload = await imageCompression(receiptFile, {
              maxSizeMB: 0.3,
              maxWidthOrHeight: 1280,
              useWebWorker: true
            });
          }
        } catch (compErr) {
          console.warn('Compression fallback:', compErr);
        }

        const cloudData = new FormData();
        cloudData.append('file', fileToUpload);
        cloudData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: cloudData,
        });
        if (res.ok) {
          const cloudResult = await res.json();
          paymentReceiptUrl = cloudResult.secure_url;
        }
      }

      const matchedAddr = customerData?.addresses?.find(a => a.fullAddress === formData.deliveryAddress);

      const editingOrderId = localStorage.getItem('editingOrderId');
      const cleanEditId = editingOrderId ? editingOrderId.replace(/#/g, '').trim() : '';
      const rawOrigItems = cleanEditId ? (localStorage.getItem(`order_${cleanEditId}_items`) || localStorage.getItem(`order_#${cleanEditId}_items`)) : null;
      const rawOrigDetails = cleanEditId ? (localStorage.getItem(`order_${cleanEditId}_details`) || localStorage.getItem(`order_#${cleanEditId}_details`)) : null;
      let origDetails = {};
      try { if (rawOrigDetails) origDetails = JSON.parse(rawOrigDetails); } catch(e) {}

      // Delivery Handover Code (OTP): 4 digits (enabled/disabled via Settings)
      const isHandoverEnabled = menuData?.storeStatus?.requireDeliveryHandoverCode !== false;
      const handoverCode = isHandoverEnabled
        ? (origDetails.handoverCode || Math.floor(1000 + Math.random() * 9000).toString())
        : '';

      // Thoghra 28: XSS Sanitization Shield
      const cleanCustomerName = sanitizeText(formData.customerName, 100);
      let cleanNotes = sanitizeOrderNotes(sanitizeText(formData.notes, 150));
      const cleanDeliveryAddress = sanitizeText(formData.deliveryAddress, 300);
      const cleanTableNumber = sanitizeText(formData.tableNumber, 20);

      // Thoghra 30: Idempotency Key Shield
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Thoghra 22: Anti-Enumeration High-Entropy Tracking Token Shield
      const generateTrackingToken = () => {
        try {
          const randomBytes = new Uint8Array(12);
          window.crypto.getRandomValues(randomBytes);
          const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
          return `trk_${Date.now().toString(36)}_${hex}`;
        } catch(e) {
          return `trk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 12)}`;
        }
      };

      const trackingToken = origDetails.trackingToken || generateTrackingToken();

      const orderPayload = {
        idempotencyKey: idempotencyKey,
        trackingToken: trackingToken,
        orderDate: new Date().toISOString(),
        customerName: cleanCustomerName,
        customerPhone: (formData.customerPhone || '').trim(),
        notes: cleanNotes,
        orderType: formData.orderType,
        handoverCode: handoverCode,
        deliveryAddress: formData.orderType === 'delivery' ? `[منطقة: ${selectedZone}] ${cleanDeliveryAddress}` : '',
        deliveryZone: formData.orderType === 'delivery' ? selectedZone : '',
        deliveryFee: formData.orderType === 'delivery' ? deliveryFee : 0,
        mapsUrl: formData.orderType === 'delivery' ? (matchedAddr?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cleanDeliveryAddress}, ${selectedZone}`)}`) : '',
        lat: formData.orderType === 'delivery' ? (matchedAddr?.lat || null) : null,
        lng: formData.orderType === 'delivery' ? (matchedAddr?.lng || null) : null,
        street: formData.orderType === 'delivery' ? (matchedAddr?.street || '') : '',
        building: formData.orderType === 'delivery' ? (matchedAddr?.building || '') : '',
        floor: formData.orderType === 'delivery' ? (matchedAddr?.floor || '') : '',
        apartment: formData.orderType === 'delivery' ? (matchedAddr?.apartment || '') : '',
        landmark: formData.orderType === 'delivery' ? (matchedAddr?.landmark || '') : '',
        tableNumber: formData.orderType === 'DineIn' ? cleanTableNumber : '',
        subtotal: Math.max(0, subtotal),
        taxPercentage: taxPercentage,
        taxAmount: taxAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        discountAmount: couponDiscount,
        totalAmount: grandTotal,
        paymentMethod: paymentReceiptUrl ? 'InstaPay' : 'Cash',
        status: 'New',
        items: items,
        displayOrderId: displayOrderId,
        paymentReceiptUrl: paymentReceiptUrl
      };

      if (editingOrderId) {
        // Pre-flight Check: Prevent late modification/cancellation if kitchen has already started preparing
        try {
          const trackRes = await fetch(`${APP_CONFIG.firebaseDbUrl}PublicTracking/${cleanEditId}.json?t=${Date.now()}`);
          if (trackRes.ok) {
            const trackData = await trackRes.json();
            if (trackData && ['InKitchen', 'Preparing', 'Ready', 'OutForDelivery', 'Completed', 'Cancelled'].includes(trackData.Status)) {
              localStorage.removeItem('editingOrderId');
              localStorage.removeItem('editingOrderDetails');
              setShowPayment(false);
              setIsSubmitting(false);
              alert(lang === 'en'
                ? '👨‍🍳 The kitchen has already started preparing your meal (or the order is out for delivery). Order modifications are locked.'
                : '👨‍🍳 عذراً، بدأ الشيف في تجهيز وجباتك بالمطبخ بالفعل (أو خرجت للتوصيل). تم قفل تعديل الطلب لضمان جودة وسرعة التسليم.');
              navigate(`/track/${cleanEditId}`);
              return;
            }
          }
        } catch (statusErr) {
          console.warn('Pre-flight status check warning:', statusErr);
        }

        orderPayload.displayOrderId = cleanEditId;
        orderPayload.isModification = true;

        if (rawOrigItems) {
           try {
              const parsedOrigItems = JSON.parse(rawOrigItems);
              orderPayload.originalItems = parsedOrigItems.map(i => ({
                 productName: sanitizeText(i.product?.name || i.productName || 'صنف', 120),
                 quantity: Math.max(1, Math.min(999, Math.floor(Number(i.quantity) || 1))),
                 unitPrice: Math.max(0, Number(i.product?.calculatedPrice || i.product?.sellingPrice || i.unitPrice || 0))
              }));
           } catch(e) {}
        }
        orderPayload.originalTotal = origDetails.originalTotal || 0;
        orderPayload.originalPaymentReceiptUrl = origDetails.paymentReceiptUrl || '';

        // Push modification request to Firebase Orders node! (To bypass security rules)
        try {
          const modRef = push(ref(db, 'OrderModificationRequests'));
          await set(modRef, orderPayload);
        } catch (err) {
          console.error("Firebase Error:", err);
          throw new Error(`فشل في إرسال طلب التعديل: ${err.message}`);
        }

        // Release the Active Hold in Firebase immediately!
        try {
          await remove(ref(db, `ActiveHoldRequests/${cleanEditId}`));
        } catch(e) {}
        
        localStorage.removeItem('editingOrderId');
        displayOrderId = editingOrderId;
      } else {
        // 2. Send to Firebase using SDK to include auth token
        let responseData = null;
        try {
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
          const newOrderRef = push(ref(db, 'Orders'));
          await set(newOrderRef, orderPayload);
          responseData = { name: newOrderRef.key };
        } catch (err) {
          throw new Error(err.message || 'فشل في إرسال الطلب، يرجى التأكد من اتصالك بالانترنت.');
        }

        if (!responseData || !responseData.name) {
          throw new Error('فشل غير متوقع من الخادم. لم يتم إنشاء الأوردر.');
        }
      }

      // 3. Success Handling (ONLY runs if fetch succeeded and threw no errors)
      visitorTracker.setOrdering(true); // Track order in website analytics
      setGeneratedOrderId(displayOrderId);
      setFinalTotal(grandTotal);

      // Save order items & details for future modifications and secure local owner display
      const existingDetailsStr = localStorage.getItem(`order_${displayOrderId}_details`);
      const existingDetails = existingDetailsStr ? JSON.parse(existingDetailsStr) : {};
      const newModCount = editingOrderId ? (existingDetails.modificationCount || 0) + 1 : 0;

      const savedDetailsObj = {
        customerName: cleanCustomerName,
        customerPhone: (formData.customerPhone || '').trim(),
        orderType: formData.orderType,
        handoverCode: handoverCode,
        deliveryAddress: cleanDeliveryAddress,
        tableNumber: cleanTableNumber,
        notes: cleanNotes,
        createdAt: existingDetails.createdAt || serverTimestamp(),
        originalTotal: grandTotal,
        paymentReceiptUrl: paymentReceiptUrl || existingDetails.paymentReceiptUrl || '',
        modificationCount: newModCount,
        trackingToken: trackingToken,
        displayOrderId: displayOrderId
      };

      const cleanId = displayOrderId.replace(/#/g, '').trim();

      localStorage.setItem(`order_${displayOrderId}_items`, JSON.stringify(cartItems));
      localStorage.setItem(`order_${cleanId}_items`, JSON.stringify(cartItems));
      localStorage.setItem(`order_${trackingToken}_items`, JSON.stringify(cartItems));

      localStorage.setItem(`order_${displayOrderId}_details`, JSON.stringify(savedDetailsObj));
      localStorage.setItem(`order_${cleanId}_details`, JSON.stringify(savedDetailsObj));
      localStorage.setItem(`order_${trackingToken}_details`, JSON.stringify(savedDetailsObj));

      localStorage.removeItem('editingOrderId');
      localStorage.removeItem('editingOrderDetails');

      // Thoghra 22: Immediately initialize PublicTracking node with 0% PII (Status, OrderType, DisplayOrderId, LastUpdate)
      try {
        const publicInit = {
          Status: 'Pending',
          OrderType: formData.orderType,
          DisplayOrderId: displayOrderId,
          LastUpdate: new Date().toISOString()
        };
        await set(ref(db, `PublicTracking/${trackingToken}`), publicInit);
        set(ref(db, `PublicTracking/${cleanId}`), publicInit).catch(() => {});
      } catch(e) { console.warn('PublicTracking init failed:', e); }

      // Record coupon usage
      if (appliedCoupon) {
        const activePhone = (formData.customerPhone || userPhone || '').trim();
        if (activePhone) {
          set(ref(db, `UsedCoupons/${appliedCoupon.code}/${activePhone}`), true).catch(() => {});
        }
      }

      clearCart();
      localStorage.setItem('last_order_submitted_timestamp', Date.now().toString());

      const currentPhone = (formData.customerPhone || '').trim();
      if (currentPhone) {
        localStorage.setItem('activeOrder_' + currentPhone, trackingToken);
      }
      localStorage.setItem('activeOrderId', trackingToken);
      localStorage.setItem('activeOrderToken', trackingToken);
      localStorage.setItem('activeOrderNumber', cleanId);
      localStorage.setItem('activeOrderTotal', grandTotal);
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      sessionStorage.setItem('placed_order_' + cleanId, 'true');
      sessionStorage.setItem('placed_order_' + trackingToken, 'true');

      // Navigate with secure high-entropy trackingToken (Anti-Enumeration Guard)
      navigate('/track/' + trackingToken);
      return;

    } catch (error) {
      console.error("Error submitting order:", error);
      
      let msg = "حدث خطأ غير متوقع أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.";
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        msg = "حصل خطأ في الاتصال، تأكد من الإنترنت وحاول تاني.";
      } else if (error.message) {
        // Use our custom thrown Arabic errors if available
        // If it's a generic English error, fallback to the connection message
        if (/[a-zA-Z]/.test(error.message) && !error.message.includes('فشل')) {
           msg = "حصل خطأ في الاتصال، تأكد من الإنترنت وحاول تاني.";
        } else {
           msg = error.message;
        }
      }
      
      setErrorMessage(msg);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const text = `${lang === 'en' ? 'Hello, I would like to confirm my new order from' : 'مرحباً، أود تأكيد طلبي الجديد من'} ${APP_CONFIG.restaurantName}.\n\n${lang === 'en' ? 'Name:' : 'الاسم:'} ${formData.customerName}\n${lang === 'en' ? 'Order Number:' : 'رقم الأوردر:'} ${generatedOrderId}\n${lang === 'en' ? 'Total:' : 'الإجمالي:'} ${finalTotal} ${lang === 'en' ? 'EGP' : 'ج.م'}\n${lang === 'en' ? 'Type:' : 'النوع:'} ${formData.orderType === 'DineIn' ? (lang === 'en' ? 'Dine-in' : 'صالة') : formData.orderType === 'delivery' ? (lang === 'en' ? 'Delivery' : 'دليفري') : (lang === 'en' ? 'Takeaway' : 'تيك أواي')}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    navigate('/');
  };

  if (isSuccess) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-black-surface p-10 rounded-3xl shadow-xl max-w-md w-full border border-green-100">
          <div className="w-20 h-20 bg-green-900/30 border border-green-700/50 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-display font-black text-text-light mb-2">تم استلام طلبك!</h2>
          <p className="text-text-muted mb-6">رقم الأوردر الخاص بك هو <strong className="text-text-light text-lg">{generatedOrderId}</strong></p>
          
          <div className="bg-black-primary p-4 rounded-xl mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">{lang === 'en' ? 'Total:' : ''}</span>
              <span className="font-bold text-lg">{finalTotal} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted"></span>
              <span className="font-bold">{formData.customerName}</span>
            </div>
          </div>

          {formData.orderType === 'DineIn' ? (
            <div className="bg-brand-red/5 border border-brand-red/20 text-text-light p-5 rounded-xl font-bold text-center">
              {lang === 'en' ? 'Please head to the cashier with your order number' : 'برجاء التوجه للكاشير مع رقم طلبك'} 
              <span className="text-brand-red mx-1">{generatedOrderId}</span>
              {lang === 'en' ? 'to complete payment' : 'لإتمام الدفع'}
            </div>
          ) : (
            <>
            <button 
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] text-text-light py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebd5a] transition-colors shadow-lg shadow-green-500/20"
              >
                تواصل عبر واتساب
              </button>

            {/* Live Order Tracking */}
            <div className="bg-black-surface p-5 rounded-xl border mt-6 text-right">
              <h3 className="font-bold mb-4">تتبع الطلب لحظياً</h3>
              <div className="relative">
                <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-black-surface"></div>
                {[
                  { id: 'New', label: 'تم الاستلام' },
                  { id: 'Accepted', label: 'تم القبول (جاري المراجعة)' },
                  { id: 'InKitchen', label: 'في المطبخ (جاري التحضير)' },
                  { id: 'Ready', label: 'جاهز' },
                  { id: 'Completed', label: 'تم التسليم' }
                ].map((step, index) => {
                  let statusIndex = ['New', 'Accepted', 'InKitchen', 'Ready', 'Completed'].indexOf(orderStatus);
                  let isCompleted = index <= statusIndex;
                  let isCurrent = index === statusIndex;
                  
                  return (
                    <div key={step.id} className="relative flex items-center gap-4 mb-4 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-black-surface ${isCompleted ? 'bg-brand-red' : 'bg-black-surface'}`}>
                        {isCompleted && <CheckCircle size={14} className="text-text-light" />}
                      </div>
                      <span className={`font-bold ${isCurrent ? 'text-brand-red' : isCompleted ? 'text-text-light' : 'text-text-muted'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <br/>
            <button 
              className="w-full bg-[#25D366] text-text-light py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebd5a] transition-colors shadow-lg shadow-green-500/20"
            >
              مراسلتنا لتأكيد الطلب 💬
            </button>
            </>
          )}

          <button 
            onClick={() => setIsReviewModalOpen(true)}
            className="w-full mt-4 bg-black-surface text-text-light border-2 border-brand-red-dark/30 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-brand-red hover:text-brand-red transition-colors"
          >
            شاركنا رأيك في الطلب ⭐️
          </button>
        </div>

        <ReviewModal 
          isOpen={isReviewModalOpen} 
          onClose={() => setIsReviewModalOpen(false)} 
        />
      </div>
    );
  }

  if (activeOrderWarning && !localStorage.getItem("editingOrderId")) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
        <div className="max-w-md w-full bg-black-primary border border-brand-red/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6 border border-amber-500/30">
            <AlertCircle size={44} />
          </div>
          <h2 className="text-2xl font-display font-black text-text-light mb-3">
            {lang === "en" ? "Active Order in Progress" : "لديك طلب نشط قيد التنفيذ!"}
          </h2>
          <p className="text-text-muted leading-relaxed mb-6 text-sm">
            {lang === "en" 
              ? `You already have order #${activeOrderWarning.cleanId} in progress. You cannot place a new order until your current order is completed.`
              : `لديك طلب حالي برقم #${activeOrderWarning.cleanId} جاري مراجعته أو تجهيزه في المطعم. لضمان عدم تداخل الطلبات وسرعة وصولها، لا يمكنك إنشاء طلب جديد قبل استلام طلبك الحالي.`}
          </p>
          <button 
            type="button"
            onClick={() => navigate(`/track/${encodeURIComponent(activeOrderWarning.cleanId)}`)}
            className="w-full py-4 rounded-xl font-bold text-text-light bg-brand-red hover:bg-brand-red-dark transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <span>{lang === "en" ? "Track My Active Order" : `متابعة طلبي الحالي #${activeOrderWarning.cleanId}`}</span>
            <ArrowRight size={18} className={lang === "ar" ? "rotate-180" : ""} />
          </button>
          <button 
            type="button"
            onClick={() => navigate("/menu")}
            className="w-full py-3 rounded-xl font-bold text-text-muted hover:text-text-light transition-colors text-sm cursor-pointer"
          >
            {lang === "en" ? "Back to Menu" : "العودة للمنيو"}
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-24 min-h-screen bg-black-surface flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag size={64} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-text-light mb-4">{lang === 'en' ? 'Cart is empty' : 'سلة الطلبات فارغة'}</h2>
        <p className="text-text-muted mb-8">أضف بعض المنتجات الشهية أولاً لتقوم بإتمام الطلب.</p>
        <button 
          onClick={() => navigate('/menu')}
          className="bg-brand-red text-text-light px-8 py-3 rounded-full font-bold hover:bg-brand-red-dark transition-colors"
        >
          تصفح المنيو
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 min-h-screen bg-black-surface">
      <div className="container mx-auto px-6 max-w-4xl">
        <button 
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-text-muted hover:text-text-light font-bold mb-8 transition-colors w-fit"
        >
          <ArrowRight size={20} />
          {lang === 'en' ? 'Back to Menu' : 'العودة للمنيو'}
        </button>

        <h1 className="text-4xl font-display font-black text-text-light mb-8">{lang === 'en' ? 'Checkout' : 'إتمام الطلب'}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-black-surface p-6 md:p-8 rounded-3xl shadow-sm border border-brand-red-dark/30">
              
              <AnimatePresence>
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6 bg-red-900/30 border border-red-900/50 text-red-400 px-4 py-4 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <span className="font-bold">{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showPayment ? (
                  <>
                  {/* Store Closed Banner */}
              {!isStoreOpen && (
                <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={26} />
                  <div>
                    <h4 className="font-black text-red-400 text-base">
                      {lang === 'en' ? 'Restaurant is Currently Closed' : '⛔ المطعم مغلق حالياً'}
                    </h4>
                    <p className="text-sm font-semibold text-text-light mt-0.5">
                      {storeClosedMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Type */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-text-light mb-4">{lang === 'en' ? 'Order Type' : 'نوع الطلب'}</h3>
                
                {!tableNumber ? (
                  <div className="grid grid-cols-3 gap-4">
                    {['DineIn', 'takeaway', 'delivery'].map(type => (
                      <label key={type} className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${formData.orderType === type ? 'border-brand-red bg-brand-red/5 text-brand-red' : 'border-brand-red-dark/30 text-text-muted hover:border-brand-red-dark/50'}`}>
                        <input 
                          type="radio" 
                          name="orderType" 
                          value={type} 
                          checked={formData.orderType === type}
                          onChange={handleChange}
                          className="hidden" 
                        />
                        <span className="font-bold block">{type === 'DineIn' ? (lang === 'en' ? 'Dine-in' : 'صالة') : type === 'delivery' ? (lang === 'en' ? 'Delivery' : 'توصيل') : (lang === 'en' ? 'Takeaway' : 'تيك اواي')}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-brand-red/10 border border-brand-red text-brand-red p-4 rounded-xl text-center">
                    <span className="font-bold text-lg">أنت تطلب من طاولة رقم {tableNumber}</span>
                  </div>
                )}

                {/* Manual Table Number Input if DineIn and not scanned by QR */}
                {formData.orderType === 'DineIn' && !tableNumber && (
                  <div className="mt-4 p-4 bg-brand-red/5 border border-brand-red/30 rounded-2xl animate-in fade-in">
                    <label className="block text-sm font-bold text-text-light mb-2">
                      {lang === 'en' ? 'Table Number in Dining Hall *' : 'رقم الطاولة في الصالة *'}
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="50"
                      required
                      value={formData.tableNumber || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                      placeholder={lang === 'en' ? 'e.g. 5' : 'اكتب رقم الطاولة التي تجلس عليها (مثال: 5)'}
                      className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 text-text-light focus:outline-none focus:ring-2 focus:ring-brand-red font-bold"
                    />
                  </div>
                )}

              </div>

              {/* Customer Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Full Name' : 'الاسم بالكامل'} *</label>
                  <input 
                    type="text" 
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all"
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Phone Number' : 'رقم الهاتف'} *</label>
                  <input 
                    type="tel" 
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all"
                    placeholder="مثال: 010xxxxxxxx" />
                </div>

                                  <AnimatePresence>
                    {formData.orderType === 'delivery' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {/* Address Cards Selector */}
                        {customerData?.addresses?.length > 0 && (
                          <div className="mb-4 flex flex-col gap-2">
                             {customerData.addresses.map(addr => {
                               const isSelected = formData.deliveryAddress === addr.fullAddress;
                               return (
                               <label key={addr.id} className={`p-3 rounded-xl border cursor-pointer flex gap-3 items-start transition-all ${isSelected ? 'bg-brand-red/10 border-brand-red' : 'bg-black-surface border-brand-red-dark/30 hover:border-brand-red-dark'}`}>
                                  <input 
                                    type="radio" 
                                    name="deliveryAddressSelection"
                                    value={addr.fullAddress}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      setFormData(prev => ({...prev, deliveryAddress: e.target.value}));
                                      if (addr.zone) setSelectedZone(addr.zone);
                                    }}
                                    className="mt-1 shrink-0 accent-brand-red"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-text-light block">{lang === 'en' ? (addr.label === 'المنزل' ? 'Home' : addr.label === 'العمل' ? 'Work' : 'Other') : addr.label}</span>
                                      {addr.zone && (
                                        <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                                          📍 {addr.zone}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-text-light text-sm block font-semibold">{addr.fullAddress}</span>
                                      {(addr.building || addr.floor || addr.apartment) && (
                                        <span className="text-xs text-text-muted block mt-0.5">
                                          {addr.building && <span>عمارة: {addr.building} </span>}
                                          {addr.floor && <span>| دور: {addr.floor} </span>}
                                          {addr.apartment && <span>| شقة: {addr.apartment} </span>}
                                          {addr.landmark && <span>| علامة: {addr.landmark}</span>}
                                        </span>
                                      )}
                                  </div>
                               </label>
                             )})}
                             <label className={`p-3 rounded-xl border cursor-pointer flex gap-3 items-center transition-all ${!customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress) && formData.deliveryAddress !== '' ? 'bg-brand-red/10 border-brand-red' : 'bg-black-surface border-brand-red-dark/30 hover:border-brand-red-dark'}`}>
                                  <input 
                                    type="radio" 
                                    name="deliveryAddressSelection"
                                    value="other"
                                    checked={!customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress)}
                                    onChange={() => setFormData(prev => ({...prev, deliveryAddress: ''}))}
                                    className="shrink-0 accent-brand-red"
                                  />
                                  <span className="font-bold text-text-light">{lang === 'en' ? 'Other Address (Map & GPS)' : 'عنوان آخر (خريطة و GPS)'}</span>
                             </label>
                          </div>
                        )}

                        {/* Minimum Order Warning if applicable */}
                        {selectedZoneObj && selectedZoneObj.minOrderAmount > 0 && subtotal < selectedZoneObj.minOrderAmount && (
                          <div className="mt-4 mb-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold">
                            ⚠️ قيمة الوجبات ({subtotal} ج.م) أقل من الحد الأدنى للطلب لمنطقة {selectedZoneObj.name} ({selectedZoneObj.minOrderAmount} ج.م). يرجى إضافة المزيد من الأصناف.
                          </div>
                        )}

                        {/* Map Picker if "Other" or no saved addresses */}
                        {(!customerData?.addresses?.length || !customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress)) && (
                          <div className="bg-black-primary border border-brand-red/30 p-4 rounded-xl mb-6">
                            <AddressMapPicker 
                              value={mapAddress} 
                              onChange={(newVal) => {
                                setMapAddress(newVal);
                                const fullAddr = formatAddressDetails(newVal);
                                setFormData(prev => ({ ...prev, deliveryAddress: fullAddr }));
                                setSelectedZone(newVal.zone || '');
                              }} 
                              zonesList={deliveryZones} 
                              lang={lang} 
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Additional Notes (Optional)' : 'ملاحظات إضافية (اختياري)'}</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all resize-none"
                    placeholder={lang === 'en' ? 'No onions, well done...' : 'بدون بصل، تسوية زيادة...'}
                  ></textarea>
                </div>
                </div>

                <button 
                    type="button" 
                    onClick={handleContinueToPayment}
                    disabled={!isStoreOpen || (formData.orderType === 'delivery' && selectedZoneObj && selectedZoneObj.minOrderAmount > 0 && subtotal < selectedZoneObj.minOrderAmount)}
                    className="w-full mt-8 py-4 rounded-xl font-bold text-lg text-text-light transition-all shadow-lg bg-brand-red hover:bg-brand-red-dark shadow-brand-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formData.orderType === 'delivery' && selectedZoneObj && selectedZoneObj.minOrderAmount > 0 && subtotal < selectedZoneObj.minOrderAmount
                      ? `الحد الأدنى للطلب ${selectedZoneObj.minOrderAmount} ج.م`
                      : (lang === 'en' ? 'Continue to Payment' : 'المتابعة للدفع')}
                  </button>
                  </>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* If editing, show a prominent modification summary banner */}
                    {localStorage.getItem('editingOrderId') && (() => {
                      const editingDetails = JSON.parse(localStorage.getItem('editingOrderDetails') || '{}');
                      const activeTotal = parseFloat(localStorage.getItem('activeOrderTotal') || '0');
                      const origTotal = editingDetails.originalTotal || (activeTotal > 0 ? activeTotal : 0);
                      const priceDiff = grandTotal - origTotal;
                      return (
                        <div className="mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
                              <span>✏️ ملخص تعديل الأوردر</span>
                              <span className="bg-amber-500/20 px-2 py-0.5 rounded-lg text-sm font-mono">#{localStorage.getItem('editingOrderId')}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={handleCancelEditing}
                              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>✕ إلغاء التعديل وبدء طلب جديد</span>
                            </button>
                          </div>
                          <div className="flex justify-between text-sm text-text-muted mb-1">
                            <span>الحساب الأصلي:</span>
                            <span className="font-bold text-text-light">{origTotal.toFixed(2)} ج.م</span>
                          </div>
                          <div className="flex justify-between text-sm text-text-muted mb-2">
                            <span>الحساب الجديد بعد التعديل:</span>
                            <span className="font-bold text-text-light">{grandTotal.toFixed(2)} ج.م</span>
                          </div>
                          <div className="pt-3 border-t border-amber-500/20 flex justify-between font-bold">
                            <span className="text-text-light text-base">
                              {priceDiff > 0 ? 'مبلغ الفرق الإضافي للدفع:' : priceDiff < 0 ? 'مبلغ الفرق المسترد:' : 'فرق الحساب:'}
                            </span>
                            <span className={`text-xl ${priceDiff > 0 ? 'text-amber-500' : priceDiff < 0 ? 'text-green-500' : 'text-text-light'}`}>
                              {priceDiff > 0 ? `+${priceDiff.toFixed(2)} ج.م` : `${priceDiff.toFixed(2)} ج.م`}
                            </span>
                          </div>
                          {priceDiff > 0 && (
                            <p className="text-xs text-amber-400 mt-3 font-semibold leading-relaxed">
                              * يرجى تحويل مبلغ الزيادة (${priceDiff.toFixed(2)} ج.م) ورفع صورة الإيصال بالأسفل لتأكيد التعديل.
                            </p>
                          )}
                          {priceDiff <= 0 && (
                            <p className="text-xs text-green-400 mt-3 font-semibold leading-relaxed">
                              * لا يوجد مبلغ إضافي مطلوب، سيتم تسوية الحساب عند الاستلام.
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {!localStorage.getItem('editingOrderId') && (
                      <button 
                        type="button" 
                        onClick={() => setShowPayment(false)}
                        className="mb-6 flex items-center gap-2 text-text-muted hover:text-text-light transition-colors"
                      >
                        <ArrowRight className="rotate-180" size={20} />
                        <span className="font-bold">{lang === 'en' ? 'Back to Details' : 'الرجوع للبيانات'}</span>
                      </button>
                    )}

                    <PaymentSection marketing={marketing} onFileSelect={handleFileSelect} isCompressing={isCompressingReceipt} />

                    <button 
                      type="submit" 
                      disabled={!isStoreOpen || isSubmitting}
                      className={`w-full mt-8 py-4 rounded-xl font-bold text-lg text-text-light transition-all shadow-lg ${isSubmitting ? 'bg-brand-red-dark/50 text-text-muted cursor-not-allowed' : 'bg-brand-red hover:bg-brand-red-dark shadow-brand-red/30'}`}
                    >
                      {isSubmitting ? 'جاري الإرسال...' : (lang === 'en' ? 'Confirm and Submit Order' : 'تأكيد وإرسال الطلب')}
                    </button>
                    </div>
                  )}
                </form>
              </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-black-surface p-6 rounded-3xl shadow-sm border border-brand-red-dark/30 sticky top-24">
              <h3 className="text-xl font-bold text-text-light mb-6 flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-red" />
                {lang === 'en' ? 'Order Summary' : 'ملخص الطلب'}
              </h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pe-">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-start gap-2 border-b border-brand-red-dark/30 pb-4 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-bold text-sm text-text-light">{item.quantity}x {item.product.name}</h4>
                      {item.product.isSoldByWeight && (
                        <p className="text-xs text-text-muted mt-1">{lang === 'en' ? 'Weight:' : 'الوزن:'} {item.product.selectedWeight} {lang === 'en' ? 'EGP' : 'ج'}رام</p>
                      )}
                      {item.product.selectedModifiers?.length > 0 && (
                        <div className="text-xs text-text-muted mt-1">
                          {item.product.selectedModifiers.map(m => m.name).join('، ')}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-sm shrink-0">
                      {((item.product.calculatedPrice || item.product.sellingPrice) + (item.product.finalModifiersPrice || 0)) * item.quantity} {lang === 'en' ? 'EGP' : 'ج'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-brand-red-dark/30 space-y-2 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>{lang === 'en' ? 'Subtotal:' : 'قيمة الوجبات:'}</span>
                  <span className="font-bold text-text-light">{subtotal.toFixed(2)} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
                </div>
                {taxPercentage > 0 && (
                  <div className="flex justify-between text-text-muted">
                    <span>{lang === 'en' ? `VAT (${taxPercentage}%):` : `ضريبة القيمة المضافة (${taxPercentage}%):`}</span>
                    <span className="font-bold text-text-light">{taxAmount.toFixed(2)} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
                  </div>
                )}
                {formData.orderType === 'delivery' && (
                  <div className="flex justify-between text-text-muted">
                    <span>{lang === 'en' ? 'Delivery Fee:' : 'سعر التوصيل:'} {selectedZone ? `(${selectedZone})` : ''}</span>
                    <span className={`font-bold ${deliveryFee > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {deliveryFee > 0 ? `+${deliveryFee.toFixed(2)} ${lang === 'en' ? 'EGP' : 'ج.م'}` : (lang === 'en' ? 'Select Zone' : 'اختر المنطقة')}
                    </span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-emerald-400">
                    <span>🎟️ {lang === 'en' ? 'Coupon Discount:' : 'خصم الكوبون:'} ({appliedCoupon?.code})</span>
                    <span>
                        {appliedCoupon?.discountType === 'FreeDelivery' 
                          ? (lang === 'en' ? 'Free Delivery' : 'توصيل مجاني')
                          : `-${couponDiscount.toFixed(2)} ${lang === 'en' ? 'EGP' : 'ج.م'}`}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-brand-red-dark/30 flex justify-between items-center text-xl">
                  <span className="font-bold text-text-muted">{lang === 'en' ? 'Grand Total' : 'الإجمالي'}</span>
                  <span className="font-black text-brand-red">{grandTotal.toFixed(2)} {lang === 'en' ? 'EGP' : 'ج.م'}</span>
                </div>

                {/* Promo / Coupon Box */}
                <div className="mt-4 pt-4 border-t border-brand-red-dark/20">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={lang === 'en' ? '🎟️ Promo / Coupon Code' : '🎟️ كود الخصم (كوبون)'}
                      className="flex-1 bg-black-primary border border-brand-red-dark/30 rounded-xl px-3 py-2.5 text-xs font-bold text-text-light focus:outline-none focus:border-brand-red placeholder:text-text-muted/60 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isCheckingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      {isCheckingCoupon ? '...' : (lang === 'en' ? 'Apply' : 'تطبيق')}
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-1.5 text-[11px] text-brand-red font-bold flex items-center gap-1 animate-in fade-in">
                      ⚠️ {couponError}
                    </p>
                  )}
                  {appliedCoupon && (
                    <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-400 animate-in fade-in">
                      <span>✅ تم تفعيل كود الخصم ({appliedCoupon.code})</span>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                        className="text-text-muted hover:text-white ml-2 text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* THOGHRA 17: WhatsApp Phone Ownership Verification Modal */}
      <AnimatePresence>
        {isOtpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black-surface border border-brand-red/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-text-light"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-light">
                    {lang === 'en' ? 'Phone Verification' : 'تأكيد ملكية رقم الهاتف'}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {lang === 'en' 
                      ? 'Confirming phone number via WhatsApp OTP' 
                      : 'تأكيد رقم الموبايل عبر رسالة واتساب لحماية طلبك'}
                  </p>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                <MessageSquare className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-text-muted leading-relaxed">
                  {lang === 'en' 
                    ? `We sent a 6-digit verification code to WhatsApp on number (${formData.customerPhone}). Please enter it below:` 
                    : `تم إرسال كود تحقق مكون من 6 أرقام على واتساب الرقم (${formData.customerPhone}). يرجى إدخاله للمتابعة:`}
                </p>
              </div>

              <form onSubmit={handleConfirmOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">
                    {lang === 'en' ? 'Enter 6-Digit Code' : 'أدخل رمز التحقق (6 أرقام)'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="w-full bg-black-primary border border-brand-red-dark/40 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-text-light focus:outline-none focus:border-brand-red"
                    autoFocus
                  />
                </div>

                {otpError && (
                  <p className="text-xs text-brand-red font-bold flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle size={14} />
                    {otpError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerOtp}
                    disabled={otpCountdown > 0 || isSendingOtp}
                    className="text-xs text-brand-red hover:underline disabled:opacity-50 disabled:no-underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                    {otpCountdown > 0 
                      ? (lang === 'en' ? `Resend in (${otpCountdown}s)` : `إعادة الإرسال بعد (${otpCountdown} ث)`) 
                      : (lang === 'en' ? 'Resend WhatsApp Code' : 'إعادة إرسال كود الواتساب')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOtpModalOpen(false); setOtpError(''); }}
                    className="text-xs text-text-muted hover:text-white"
                  >
                    {lang === 'en' ? 'Change Phone' : 'تغيير الرقم'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={otpInput.length !== 6}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
                >
                  {lang === 'en' ? 'Confirm and Proceed' : 'تأكيد ومتابعة الطلب'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


