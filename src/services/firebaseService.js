import { APP_CONFIG } from '../config/appConfig';

/**
 * Helper to fetch JSON from Firebase with a cache-busting version parameter.
 * Falls back to standard timestamp if version.json is unreachable.
 */
export const fetchWithVersion = async (url) => {
    try {
        const vRes = await fetch(`${APP_CONFIG.firebaseDbUrl}/version.json?t=${new Date().getTime()}`);
        let version = '';
        if (vRes.ok) {
            version = await vRes.json();
        } else {
            version = new Date().getTime().toString();
        }
        
        const joiner = url.includes('?') ? '&' : '?';
        return fetch(`${url}${joiner}v=${version}`);
    } catch (error) {
        console.warn('Failed to fetch version, falling back to timestamp caching.', error);
        const joiner = url.includes('?') ? '&' : '?';
        return fetch(`${url}${joiner}v=${new Date().getTime()}`);
    }
};

/**
 * Fetches the entire menu data from menu.json
 */
export const fetchMenuData = async () => {
    try {
        const res = await fetchWithVersion(`${APP_CONFIG.firebaseDbUrl}menu.json`);
        if (!res.ok) throw new Error("Network response was not ok");
        return await res.json();
    } catch (error) {
        console.error("Error fetching menu data:", error);
        return null;
    }
};

/**
 * Fetches the website configuration/content data from WebsiteData.json
 */
export const fetchWebsiteData = async () => {
    try {
        const res = await fetchWithVersion(`${APP_CONFIG.firebaseDbUrl}WebsiteData.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Error fetching website data:", error);
        return null;
    }
};
