/**
 * Image Optimization Utilities for Cloudinary & Media Assets
 * Ensures images are delivered with automatic WebP/AVIF formatting,
 * auto quality compression, and responsive widths.
 */

/**
 * Optimizes a Cloudinary image URL by injecting f_auto, q_auto, and optional dimensions.
 * If the image is not from Cloudinary, it is returned untouched.
 * 
 * @param {string} url - Original image URL
 * @param {object} options - Optimization options (width, height, quality, crop)
 * @returns {string} - Optimized URL
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;

  // Only transform Cloudinary upload URLs
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  // If already contains optimization parameters, return as is
  if (url.includes('f_auto') && url.includes('q_auto')) {
    return url;
  }

  const { width, height, quality = 'auto', format = 'auto', crop = 'limit' } = options;
  const transforms = [`f_${format}`, `q_${quality}`];
  
  if (width) {
    transforms.push(`w_${width}`);
  }
  if (height) {
    transforms.push(`h_${height}`);
  }
  if (width || height) {
    transforms.push(`c_${crop}`);
  }

  const transformPrefix = transforms.join(',') + '/';

  // Insert transforms right after /upload/ (handles optional v12345/ version tag)
  return url.replace(/\/upload\/(v\d+\/)?/, (match, version) => {
    return `/upload/${transformPrefix}${version || ''}`;
  });
};

/**
 * Convenience helper to optimize product/menu images for card display
 */
export const getProductThumbnailUrl = (url) => {
  return optimizeCloudinaryUrl(url, { width: 500, quality: 'auto' });
};

/**
 * Convenience helper for hero banners / large images
 */
export const getHeroImageUrl = (url) => {
  return optimizeCloudinaryUrl(url, { width: 1400, quality: 'auto' });
};
