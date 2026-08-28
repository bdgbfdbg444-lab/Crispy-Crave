import re

with open('src/components/ReviewModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if not exists
if 'browser-image-compression' not in content:
    content = content.replace("import { Star, X, Upload } from 'lucide-react';", "import { Star, X, Upload } from 'lucide-react';\nimport imageCompression from 'browser-image-compression';")

old_handle = """  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Security: Validate file type and size (Max 5MB)
      if (!file.type.startsWith('image/')) {
        alert(lang === 'en' ? 'Only image files are allowed.' : 'يسمح فقط برفع الصور.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'en' ? 'File size must be less than 5MB.' : 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت.');
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };"""

new_handle = """  const handleFileChange = async (e) => {
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
  };"""

content = content.replace(old_handle, new_handle)

# Update the UI text so it doesn't say "PNG, JPG up to 5MB" anymore
content = content.replace("'PNG, JPG up to 5MB'", "'PNG, JPG (Auto-compressed)'")
content = content.replace("'PNG, JPG OOU% 5MB'", "'صيغ PNG, JPG'")
content = content.replace("'PNG, JPG بحد أقصى 5MB'", "'صيغ PNG, JPG'")

with open('src/components/ReviewModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
