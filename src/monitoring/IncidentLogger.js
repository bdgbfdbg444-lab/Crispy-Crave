// Imports removed for Firebase

const trace = (msg) => {
    // Debug tracing disabled in production for security
    // console.debug(msg);
};
const INCIDENTS_KEY = "pos_website_incidents";
const DEDUP_TIMEFRAME_MS = 60 * 60 * 1000; // 1 hour dedup window

// Utility to generate a hash/signature for an error
const generateErrorSignature = (type, message, stack) => {
    const cleanMsg = (message || "").substring(0, 100);
    const cleanStack = (stack || "").split("\n")[1] || "";
    return btoa(`${type}|${cleanMsg}|${cleanStack}`).substring(0, 32);
};

// Check for sensitive info
const sanitizeText = (text) => {
    if (!text) return "";
    let s = text.toString();
    s = s.replace(/(token|password|otp|secret|key|pwd|auth)=([^\s&]+)/gi, "$1=[REDACTED]");
    return s;
};

export const logIncident = async (type, severity, errorOrMessage, extraContext = {}) => {
    trace('logIncident started: ' + type);
    try {
        const message = sanitizeText(typeof errorOrMessage === "string" ? errorOrMessage : (errorOrMessage?.message || "Unknown error"));
        const stackTrace = sanitizeText(errorOrMessage?.stack || "");
        
        const signature = generateErrorSignature(type, message, stackTrace);
        const now = new Date().toISOString();
        let sessionId = sessionStorage.getItem("incident_session_id");
        if (!sessionId) {
            sessionId = "s_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem("incident_session_id", sessionId);
        }

        // Read local offline incidents
        let offlineIncidents = JSON.parse(localStorage.getItem(INCIDENTS_KEY) || "{}");

        if (offlineIncidents[signature]) {
            // Deduplicate
            const existing = offlineIncidents[signature];
            if (Date.now() - new Date(existing.LastSeen).getTime() < DEDUP_TIMEFRAME_MS) {
                existing.Count += 1;
                existing.LastSeen = now;
                existing.Synced = false; // Mark for sync
            } else {
                // Timeframe expired, create new
                trace('createNewIncident called');
                  offlineIncidents[signature] = createNewIncident(type, severity, message, stackTrace, sessionId, signature, extraContext);
            }
        } else {
            trace('createNewIncident called');
                  offlineIncidents[signature] = createNewIncident(type, severity, message, stackTrace, sessionId, signature, extraContext);
        }

        trace('localStorage keys count: ' + Object.keys(offlineIncidents).length);
          localStorage.setItem(INCIDENTS_KEY, JSON.stringify(offlineIncidents));
        
        // Attempt sync
        await syncIncidents();
    } catch (e) {
        console.error("Failed to log incident", e);
    }
};

const createNewIncident = (type, severity, message, stackTrace, sessionId, signature, extraContext) => {
    const incidentId = `WEB-${new Date().toISOString().replace(/\D/g, "").slice(0,14)}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    return {
        IncidentId: incidentId,
        Type: type,
        Severity: severity,
        Timestamp: new Date().toISOString(),
        Message: message,
        Source: "WEBSITE",
        StackTrace: stackTrace,
        SessionId: sessionId,
        Count: 1,
        FirstSeen: new Date().toISOString(),
        LastSeen: new Date().toISOString(),
        Page: window.location.origin + window.location.pathname,
        Route: window.location.hash || "/",
        ErrorContext: typeof extraContext === "object" ? JSON.stringify(extraContext) : String(extraContext),
        Signature: signature,
        Synced: false
    };
};

export const syncIncidents = async () => {
    trace('syncIncidents started, onLine: ' + navigator.onLine);
    // if (!navigator.onLine) return;
    
    let offlineIncidents = JSON.parse(localStorage.getItem(INCIDENTS_KEY) || "{}");
    let needsUpdate = false;
    

    for (const signature in offlineIncidents) {
        const incident = offlineIncidents[signature];
        trace('incident is: ' + typeof incident + ', Synced: ' + (incident ? incident.Synced : 'null'));
          if (incident && !incident.Synced) {
            try {
                // Exclude Signature and Synced from Firebase payload
                const { Signature, Synced, ...payload } = incident;
                
                const apiUrl = "https://cjzdghtahpjqjefjwsan.supabase.co/functions/v1/incident-logger";
                if (apiUrl) {
                    trace('fetching apiUrl: ' + apiUrl);
                      const res = await (window.originalFetch || fetch)(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...payload, IncidentId: incident.IncidentId })
                    });
                    trace('apiUrl response status: ' + res.status);
                    if (!res.ok) { const txt = await res.text(); trace('apiUrl error text: ' + txt); throw new Error('Failed to send incident to API'); }
                } else {
                    console.warn("VITE_INCIDENT_API_URL is not set. Incident saved locally but not synced.");
                }
                
                trace('incident Synced = true');
                  incident.Synced = true;
                needsUpdate = true;
            } catch (err) {
                console.error("Failed to sync incident", err);
                // We stop reporting errors here to avoid loop
            }
        }
    }

    if (needsUpdate) {
        trace('localStorage keys count: ' + Object.keys(offlineIncidents).length);
          localStorage.setItem(INCIDENTS_KEY, JSON.stringify(offlineIncidents));
    }
};

// Global Listeners (Replaces the old scattered ones)
export const initGlobalMonitoring = () => {
    window.addEventListener("error", (event) => {
        logIncident("REACT", "ERROR", event.error || event.message);
    });

    window.addEventListener("unhandledrejection", (event) => {
        logIncident("JAVASCRIPT", "ERROR", event.reason || "Unhandled Promise Rejection");
    });
    
    // Attempt sync on load
    
    // Central Network/API Interceptor
    window.originalFetch = window.fetch;
    window.fetch = async (...args) => {
        // Don't intercept calls to the logger itself to prevent infinite loops
        if (args[0] && typeof args[0] === 'string' && args[0].includes('incident-logger')) {
            return window.originalFetch(...args);
        }
        try {
            const response = await window.originalFetch(...args);
            if (!response.ok) {
                logIncident("API", "ERROR", "HTTP " + response.status + ": " + response.statusText, { url: args[0] });
            }
            return response;
        } catch (error) {
            logIncident("NETWORK", "ERROR", error.message || "Network request failed", { url: args[0] });
            throw error;
        }
    };
    setTimeout(syncIncidents, 2000);
};




















