import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

export default function ReviewModal({ isOpen, onClose, onReviewSubmitted }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    comment: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  // Cloudinary Config (ideally from env)
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'vgk0saib';
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset'; // Replace with actual

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Basic Type Validation
      if (!file.type.startsWith('image/')) {
        alert(lang === 'en' ? 'Only image files are allowed.' : 'يسمح فقط برفع الصور.');
        return;
      }

      // 2. Absolute sanity check (reject ridiculous files > 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(lang === 'en' ? 'File is too large.' : 'الصورة كبيرة جداً.');
        return;
      }

      try {
        // 3. Compress the image automatically
        const options = {
          maxSizeMB: 0.5, // 500 KB limit
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        
        setSelectedFile(compressedFile);
        
        // 4. Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Compression Error:", error);
        alert(lang === 'en' ? 'Error processing image.' : 'حدث خطأ أثناء معالجة الصورة.');
      }
    }
  };

  const uploadToCloudinary = async (file) => {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', UPLOAD_PRESET);
    
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error('فشل رفع الصورة');
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary Error:", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      let imageUrl = null;
      
      // 1. Upload Image if exists
      if (selectedFile) {
        imageUrl = await uploadToCloudinary(selectedFile);
      }

      // 2. Prepare Review Data
      const reviewData = {
        customerName: formData.customerName || 'عميل مميز',
        rating: formData.rating,
        comment: formData.comment,
        imageUrl: imageUrl, // null if no image or upload failed
        status: 'pending', // Requires admin approval
        date: new Date().toISOString()
      };

      // 3. Save to Firebase
      const response = await fetch(`${APP_CONFIG.firebaseDbUrl}PendingReviews.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) throw new Error('فشل حفظ التقييم');
      
      setSubmitStatus('success');
      
      // Auto close after 3 seconds on success
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setFormData({ customerName: '', rating: 5, comment: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setSubmitStatus(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ direction: 'rtl' }}>
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black-primary/90 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="relative w-full max-w-lg bg-black-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-black-primary text-text-light p-6 relative">
            <button 
              onClick={handleClose}
              className="absolute top-6 left-6 text-text-muted hover:text-text-light transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-black mb-1 text-brand-red">{lang === 'en' ? 'Share Your Opinion' : 'شاركنا رأيك'}</h2>
            <p className="text-sm text-gray-300">{lang === 'en' ? 'Your feedback helps us serve you better.' : 'تقييمك يهمنا ويساعدنا على تقديم الأفضل دائماً.'}</p>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {submitStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-black text-text-light mb-2">تم استلام تقييمك بنجاح!</h3>
                <p className="text-text-muted">شكراً لمشاركتك. سيتم مراجعة التقييم ونشره قريباً.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                {submitStatus === 'error' && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200">
                    حدث خطأ أثناء {lang === 'en' ? 'Submit Review' : 'إرسال التقييم'}. يرجى التأكد من الاتصال بالإنترنت والمحاولة مرة أخرى.
                  </div>
                )}

                {/* Rating Stars */}
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Overall Rating' : 'تقييمك العام'} <span className="text-red-500">*</span></label>
                  <div className="flex gap-2" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          size={32} 
                          fill={star <= formData.rating ? "#F97316" : "none"} // Primary Color
                          className={star <= formData.rating ? "text-brand-red" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Name (Optional)' : 'الاسم (اختياري)'}</label>
                  <input 
                    type="text"
                    placeholder={lang === 'en' ? 'Enter your name here' : 'اكتب اسمك هنا'}
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Detailed Feedback' : 'رأيك بالتفصيل'} <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows={4}
                    placeholder={lang === 'en' ? 'What do you think about the food and service?' : 'ما رأيك في الأكل والخدمة؟'}
                    value={formData.comment}
                    onChange={(e) => setFormData({...formData, comment: e.target.value})}
                    className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-text-light mb-2">{lang === 'en' ? 'Order Photo (Optional)' : 'صورة الطلب (اختياري)'}</label>
                  
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-3 flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">ℹ️</span>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {lang === 'en' ? <>The photo you upload will be <strong>publicly visible</strong> with your review to other customers. Please upload a clear photo of the meal only.</> : <>الصورة التي ترفعها <strong>ستظهر للعامة</strong> مع تقييمك على الموقع للعملاء الآخرين. يرجى رفع صورة واضحة للوجبة فقط.</>}
                    </p>
                  </div>

                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${previewUrl ? 'border-brand-red bg-brand-red/5' : 'border-brand-red-dark/50 hover:border-gray-400 bg-black-primary'}`}>
                      {previewUrl ? (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-text-light font-bold flex items-center gap-2"><Upload size={18} /> {lang === 'en' ? 'Change Photo' : 'تغيير الصورة'}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload size={32} className="text-text-muted mb-2" />
                          <span className="text-sm font-bold text-text-muted">{lang === 'en' ? 'Click here to upload' : 'اضغط هنا لرفع صورة'}</span>
                          <span className="text-xs text-text-muted mt-1">{lang === 'en' ? 'PNG, JPG (Auto-compressed)' : 'PNG, JPG حتى 5MB'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.comment.trim()}
                  className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-text-light font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      {lang === 'en' ? 'Sending...' : 'جاري الإرسال...'}
                    </span>
                  ) : (
                    lang === 'en' ? 'Submit Review' : 'إرسال التقييم'
                  )}
                </button>
                
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
