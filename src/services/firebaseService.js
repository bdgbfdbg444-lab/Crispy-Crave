import { APP_CONFIG } from '../config/appConfig';

/**
 * Helper to fetch JSON from Firebase with a cache-busting version parameter.
 * Falls back to standard timestamp if version.json is unreachable.
 */
export const fetchWithVersion = async (url) => {
    try {
        const isEditor = window.location.search.includes('mode=editor') || window.location.hash.includes('mode=editor');
        
        let versionStr = '';
        if (isEditor) {
            // ALWAYS bust cache in editor mode
            versionStr = new Date().getTime().toString();
        } else {
            const vRes = await fetch(APP_CONFIG.firebaseDbUrl + 'version.json?t=' + new Date().getTime());
            if (vRes.ok) {
                const data = await vRes.json();
                versionStr = data.version || data.toString();
            } else {
                versionStr = new Date().getTime().toString();
            }
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const auth = urlParams.get('auth');
        const authStr = auth ? '&auth=' + auth : '';

        const joiner = url.includes('?') ? '&' : '?';
        return fetch(url + joiner + 'v=' + versionStr + authStr);
    } catch (error) {
        console.warn('Failed to fetch version, falling back to timestamp caching.', error);
        const urlParams = new URLSearchParams(window.location.search);
        const auth = urlParams.get('auth');
        const authStr = auth ? '&auth=' + auth : '';
        const joiner = url.includes('?') ? '&' : '?';
        return fetch(url + joiner + 'v=' + new Date().getTime() + authStr);
    }
};

/**
 * Fetches the entire menu data from menu.json
 */
export const fetchMenuData = async () => {
    try {
        const res = await fetchWithVersion(APP_CONFIG.firebaseDbUrl + 'menu.json');
        if (!res.ok) throw new Error("Network response was not ok");
        return await res.json();
    } catch (error) {
        console.error("Error fetching menu data:", error);
        return null;
    }
};

/**
 * Fetches the website configuration/content data from WebsiteData.json (or WebsiteDraft.json if in editor mode)
 */
export const fetchWebsiteData = async () => {
    try {
        const isEditor = window.location.search.includes('mode=editor') || window.location.hash.includes('mode=editor');
        const endpoint = isEditor ? 'WebsiteDraft.json' : 'WebsiteData.json';
        const res = await fetchWithVersion(APP_CONFIG.firebaseDbUrl + endpoint);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Error fetching website data:", error);
        return null;
    }
};