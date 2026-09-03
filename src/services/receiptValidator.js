import { createWorker } from 'tesseract.js';
import { db } from '../firebase';
import { ref, get, set } from 'firebase/database';

export const validateReceiptFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'يرجى اختيار صورة إيصال التحويل' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { isValid: false, error: 'صيغة الملف غير مدعومة. يرجى رفع صورة بصيغة (JPG أو PNG أو WEBP)' };
  }

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return { isValid: false, error: 'حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت' };
  }

  return { isValid: true };
};

export const scanAndVerifyReceipt = async (file, expectedAmount) => {
  // First check basic file attributes
  const fileCheck = validateReceiptFile(file);
  if (!fileCheck.isValid) {
    return fileCheck;
  }

  try {
    const worker = await createWorker(['ara', 'eng']);
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();

    console.log('[Receipt OCR Result]:', text);

    // Extract reference numbers (typically 8 to 16 continuous digits or preceded by Ref / عملية / مرجع)
    const refRegex = /(?:المرجعي|عملية|مرجع|ref|reference|txn|id)[:\s#]*([0-9]{6,18})|\b([0-9]{8,18})\b/gi;
    let foundRef = null;
    let match;

    while ((match = refRegex.exec(text)) !== null) {
      const candidate = match[1] || match[2];
      // Exclude standard date stamps like 20260903
      if (candidate && candidate.length >= 8 && candidate !== '20260903') {
        foundRef = candidate;
        break;
      }
    }

    if (foundRef) {
      // Check Firebase UsedReceipts node
      try {
        const snapshot = await get(ref(db, `UsedReceipts/${foundRef}`));
        if (snapshot.exists()) {
          const usedData = snapshot.val();
          return {
            isValid: false,
            error: `❌ إيصال مكرر! تم استخدام رقم العملية (${foundRef}) مسبقاً في الطلب رقم #${usedData.orderId || ''}. لا يمكن استخدام نفس الإيصال مرتين.`
          };
        }
      } catch (fbErr) {
        console.warn('Firebase UsedReceipts check error:', fbErr);
      }
    }

    return {
      isValid: true,
      refNumber: foundRef,
      ocrText: text
    };
  } catch (err) {
    console.warn('OCR Scan failed gracefully:', err);
    // Allow through if OCR library fails on unsupported device, cashier still reviews manual receipt
    return {
      isValid: true,
      refNumber: null,
      warning: 'تعذر فحص الإيصال آلياً، سيتم مراجعته يدوياً من الكاشير'
    };
  }
};

export const registerUsedReceipt = async (refNumber, orderId, phone, amount) => {
  if (!refNumber) return;
  try {
    await set(ref(db, `UsedReceipts/${refNumber}`), {
      orderId,
      phone: phone || '',
      amount: amount || 0,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn('Failed to record used receipt:', err);
  }
};
