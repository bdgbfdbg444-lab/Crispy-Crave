import { APP_CONFIG } from '../config/appConfig';

const MENU_CACHE_KEY = 'tbbox_menu_cache';
const WEBSITE_CACHE_KEY = 'tbbox_website_cache';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const isEditorMode = () => {
    try {
        return window.location.search.includes('mode=editor') || 
               window.location.hash.includes('mode=editor');
    } catch {
        return false;
    }
};

/**
 * Helper to fetch JSON from Firebase with a cache-busting version parameter.
 * Falls back to standard timestamp if version.json is unreachable.
 */
export const fetchWithVersion = async (url) => {
    try {
        const isEditor = isEditorMode();
        
        let versionStr = '';
        if (isEditor) {
            versionStr = Date.now().toString();
        } else {
            const vRes = await fetch(APP_CONFIG.firebaseDbUrl + 'version.json?t=' + Date.now());
            if (vRes.ok) {
                const data = await vRes.json();
                versionStr = data?.version || data?.toString() || Date.now().toString();
            } else {
                versionStr = Date.now().toString();
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
        return fetch(url + joiner + 'v=' + Date.now() + authStr);
    }
};

export const fetchMenuData = async (forceRefresh = false) => {
    try {
        const isEditor = isEditorMode();

        // 1. Check session cache first (fast, instant load)
        if (!isEditor && !forceRefresh) {
            try {
                const cached = sessionStorage.getItem(MENU_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
                        return parsed.data;
                    }
                }
            } catch (e) {
                // Ignore storage parsing errors
            }
        }

        // 2. Fetch fresh data from Firebase
        const res = await fetchWithVersion(APP_CONFIG.firebaseDbUrl + 'menu.json');
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();

        // 3. Save to session cache
        if (!isEditor && data) {
            try {
                sessionStorage.setItem(MENU_CACHE_KEY, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } catch (e) {
                // Ignore storage quota errors
            }
        }

        return data;
    } catch (error) {
        console.error("Error fetching menu data:", error);
        // Fallback to cache even if expired on network failure
        try {
            const cached = sessionStorage.getItem(MENU_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.data) return parsed.data;
            }
        } catch (_) {}
        return null;
    }
};

export const fetchWebsiteData = async (forceRefresh = false) => {
    try {
        const isEditor = isEditorMode();
        const endpoint = isEditor ? 'WebsiteDraft.json' : 'WebsiteData.json';

        // 1. Check session cache first
        if (!isEditor && !forceRefresh) {
            try {
                const cached = sessionStorage.getItem(WEBSITE_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
                        return parsed.data;
                    }
                }
            } catch (e) {
                // Ignore storage errors
            }
        }

        // 2. Fetch from Firebase
        const res = await fetchWithVersion(APP_CONFIG.firebaseDbUrl + endpoint);
        if (!res.ok) return null;
        const data = await res.json();

        // 3. Save to cache
        if (!isEditor && data) {
            try {
                sessionStorage.setItem(WEBSITE_CACHE_KEY, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } catch (e) {
                // Ignore quota errors
            }
        }

        return data;
    } catch (error) {
        console.error("Error fetching website data:", error);
        try {
            const cached = sessionStorage.getItem(WEBSITE_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.data) return parsed.data;
            }
        } catch (_) {}
        return null;
    }
};

export const fetchSystemState = async () => {
    try {
        const joiner = APP_CONFIG.firebaseDbUrl.includes('?') ? '&' : '?';
        const res = await fetch(APP_CONFIG.firebaseDbUrl + '_systemState/website.json' + joiner + 't=' + Date.now());
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Error fetching system state:", error);
        return null;
    }
};
