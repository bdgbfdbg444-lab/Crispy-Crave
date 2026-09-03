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
