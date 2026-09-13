export const validateReceiptFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'يرجى اختيار صورة إيصال التحويل' };
  }

  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { isValid: false, error: 'صيغة الملف غير مدعومة. يرجى رفع صورة بصيغة (JPG أو PNG فقط)' };
  }

  const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSizeInBytes) {
    return { isValid: false, error: 'حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 2 ميجابايت' };
  }

  return { isValid: true };
};
