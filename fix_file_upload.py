import re

with open('src/components/ReviewModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_handle = """  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };"""

new_handle = """  const handleFileChange = (e) => {
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

content = content.replace(old_handle, new_handle)

with open('src/components/ReviewModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
