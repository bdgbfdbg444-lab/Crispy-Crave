/**
 * Dine-In & QR Security Utilities
 * Handles table session lifecycle, session expiration, single-use invalidation,
 * and optional GPS proximity geofencing.
 */

const SESSION_STORAGE_KEY = 'crispy_table_session';
const USED_TOKEN_PREFIX = 'crispy_used_table_';

/**
 * Calculates distance in meters between two GPS coordinates using Haversine formula
 */
export function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Retrieves the active table session from sessionStorage if valid
 */
export function getActiveTableSession(sessionDurationMinutes = 45) {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !data.table || data.used) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    const maxAgeMs = (Number(sessionDurationMinutes) || 45) * 60 * 1000;
    const elapsedMs = Date.now() - (data.scannedAt || 0);

    if (elapsedMs > maxAgeMs) {
      // Session has expired
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    const remainingMinutes = Math.max(0, Math.ceil((maxAgeMs - elapsedMs) / (60 * 1000)));

    return {
      table: String(data.table),
      scannedAt: data.scannedAt,
      remainingMinutes,
      isValid: true
    };
  } catch (e) {
    console.warn('[DineInSecurity] Error reading table session:', e);
    return null;
  }
}

/**
 * Initializes a new table session upon QR scan
 */
export function setTableSession(tableNumber) {
  if (!tableNumber) return null;
  try {
    const session = {
      table: String(tableNumber).trim(),
      scannedAt: Date.now(),
      used: false
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    // Purge legacy permanent localStorage table
    localStorage.removeItem('crispy_cart_table');
    return session;
  } catch (e) {
    console.warn('[DineInSecurity] Error setting table session:', e);
    return null;
  }
}

/**
 * Invalidates and consumes the active table session (Single-Use enforcement)
 */
export function invalidateTableSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.table) {
        // Record as consumed
        data.used = true;
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
        sessionStorage.setItem(`${USED_TOKEN_PREFIX}${data.table}`, String(Date.now()));
      }
    }
  } catch (e) {}
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem('crispy_cart_table');
}

/**
 * Verifies customer GPS proximity to the restaurant if GPS check is enabled
 * @returns {Promise<{ verified: boolean, reason?: string, distance?: number }>}
 */
export async function verifyDineInGpsProximity(websiteData) {
  if (!websiteData?.dineInRequireGps) {
    return { verified: true, bypassed: true };
  }

  const restLat = parseFloat(websiteData.restaurantLatitude);
  const restLng = parseFloat(websiteData.restaurantLongitude);
  const maxDistance = parseInt(websiteData.dineInMaxDistanceMeters, 10) || 100;

  if (isNaN(restLat) || isNaN(restLng)) {
    // If coords are not configured properly, do not block the user
    console.warn('[DineInSecurity] Restaurant coordinates not configured; bypassing GPS.');
    return { verified: true, bypassed: true };
  }

  if (!navigator.geolocation) {
    return { 
      verified: false, 
      reason: 'unsupported',
      message: 'خاصية تحديد الموقع غير مدعومة في متصفحك.' 
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const distance = calculateDistanceInMeters(userLat, userLng, restLat, restLng);

        if (distance != null && distance <= maxDistance) {
          resolve({ verified: true, distance });
        } else {
          resolve({ 
            verified: false, 
            reason: 'too_far', 
            distance,
            message: `أنت خارج نطاق الصالة حالياً (المسافة: ${distance} متر). يرجى التواجد داخل المطعم لإتمام طلب الصالة.` 
          });
        }
      },
      (err) => {
        console.warn('[DineInSecurity] Geolocation error:', err);
        resolve({ 
          verified: false, 
          reason: 'permission_denied',
          message: 'يرجى السماح بالوصول للموقع الجغرافي للتحقق من تواجدك داخل صالة المطعم.' 
        });
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 10000 }
    );
  });
}
