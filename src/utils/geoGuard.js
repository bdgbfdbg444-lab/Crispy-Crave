// Geo-location guard for restricting access to Egypt (EG) only

import { TEST_WHITELIST_IPS } from './deviceTracker';

const CACHE_KEY = 'bb_geo_guard_v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function checkEgyptGeoAccess() {
  // 1. Check local session cache first
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (Date.now() - parsed.timestamp < CACHE_TTL_MS)) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Localhost & development bypass
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '' || hostname.endsWith('.local')) {
    const result = { allowed: true, country: 'EG', ip: '127.0.0.1', isDev: true };
    cacheResult(result);
    return result;
  }

  // 3. Query primary fast Geo-IP provider (api.country.is)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://api.country.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        const country = (data.country || '').toUpperCase();
        const ip = data.ip || '';
        
        // Check developer whitelist
        if (ip && TEST_WHITELIST_IPS.includes(ip)) {
          const result = { allowed: true, country, ip, isWhitelisted: true };
          cacheResult(result);
          return result;
        }

        const isEgypt = country === 'EG';
        const result = { allowed: isEgypt, country, ip };
        cacheResult(result);
        return result;
      }
    }
  } catch (err) {
    // Primary failed, continue to fallback
  }

  // 4. Secondary fallback provider (ipwho.is)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const country = (data.country_code || '').toUpperCase();
        const ip = data.ip || '';

        if (ip && TEST_WHITELIST_IPS.includes(ip)) {
          const result = { allowed: true, country, ip, isWhitelisted: true };
          cacheResult(result);
          return result;
        }

        const isEgypt = country === 'EG';
        const result = { allowed: isEgypt, country, ip };
        cacheResult(result);
        return result;
      }
    }
  } catch (err) {
    // Fallback failed
  }

  // 5. Fail-open safety: if all geo APIs are unreachable, do not lock out customers
  return { allowed: true, country: 'EG', ip: 'unknown', fallback: true };
}

function cacheResult(result) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      ...result,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

export function clearGeoCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (e) {}
}
