import { createWorker } from 'tesseract.js';
import { db } from '../firebase';
import { ref, get, set } from 'firebase/database';

export const computeFileHash = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Could not compute file hash:', err);
    // Fallback hash using file properties
    return 'fallback_' + file.name + '_' + file.size + '_' + file.lastModified;
  }
};

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
  // 1. Basic file attribute check
  const fileCheck = validateReceiptFile(file);
  if (!fileCheck.isValid) {
    return fileCheck;
  }

  // 2. Binary SHA-256 Hash Duplicate Check (Fast, offline, 100% accurate for identical screenshots)
  const fileHash = await computeFileHash(file);
  if (fileHash) {
    try {
      const hashSnapshot = await get(ref(db, `UsedReceipts/hashes/${fileHash}`));
      if (hashSnapshot.exists()) {
        const hashData = hashSnapshot.val();
        return {
          isValid: false,
          fileHash,
          error: `❌ إيصال مكرر! تم رفع نفس صورة هذا الإيصال مسبقاً في الطلب رقم #${hashData.orderId || ''}. لا يمكن استخدام نفس الإيصال مرتين.`
        };
      }
    } catch (fbErr) {
      console.warn('Firebase hash check error:', fbErr);
    }
  }

  // 3. OCR Scan for reference number
  let foundRef = null;
  let ocrText = '';

  try {
    const worker = await createWorker(['ara', 'eng'], 1, {
      errorHandler: (e) => console.warn('Tesseract worker error:', e)
    });
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();

    ocrText = text || '';
    console.log('[Receipt OCR Result]:', ocrText);

    // Extract reference numbers (typically 6 to 18 continuous digits)
    const refRegex = /(?:المرجعي|عملية|مرجع|ref|reference|txn|id)[:\s#]*([0-9]{6,18})|\b([0-9]{8,18})\b/gi;
    let match;

    while ((match = refRegex.exec(ocrText)) !== null) {
      const candidate = match[1] || match[2];
      if (candidate && candidate.length >= 8 && candidate !== '20260903') {
        foundRef = candidate;
        break;
      }
    }

    if (foundRef) {
      try {
        const snapshot = await get(ref(db, `UsedReceipts/refs/${foundRef}`));
        if (snapshot.exists()) {
          const usedData = snapshot.val();
          return {
            isValid: false,
            fileHash,
            refNumber: foundRef,
            error: `❌ إيصال مكرر! تم استخدام رقم العملية (${foundRef}) مسبقاً في الطلب رقم #${usedData.orderId || ''}. لا يمكن استخدام نفس الإيصال مرتين.`
          };
        }
      } catch (fbErr) {
        console.warn('Firebase ref check error:', fbErr);
      }
    }
  } catch (ocrErr) {
    console.warn('OCR Scan failed gracefully:', ocrErr);
  }

  return {
    isValid: true,
    fileHash,
    refNumber: foundRef,
    ocrText
  };
};

export const registerUsedReceipt = async (fileHash, refNumber, orderId, phone, amount) => {
  const receiptRecord = {
    orderId: orderId || '',
    phone: phone || '',
    amount: amount || 0,
    timestamp: Date.now()
  };

  try {
    if (fileHash) {
      await set(ref(db, `UsedReceipts/hashes/${fileHash}`), receiptRecord);
    }
    if (refNumber) {
      await set(ref(db, `UsedReceipts/refs/${refNumber}`), receiptRecord);
    }
  } catch (err) {
    console.warn('Failed to record used receipt:', err);
  }
};
