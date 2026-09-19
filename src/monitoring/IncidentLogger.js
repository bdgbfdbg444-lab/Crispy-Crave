// Imports removed for Firebase
import { visitorTracker } from "../services/visitorTracker";

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
    s = s.replace(/(token|password|otp|secret|key|pwd)=([^\s&]+)/gi, "$1=[REDACTED]");
    return s;
};

export const logIncident = async (type, severity, errorOrMessage, extraContext = {}) => {
    try {
        const message = sanitizeText(typeof errorOrMessage === "string" ? errorOrMessage : (errorOrMessage?.message || "Unknown error"));
        const stackTrace = sanitizeText(errorOrMessage?.stack || "");
        
        const signature = generateErrorSignature(type, message, stackTrace);
        const now = new Date().toISOString();
        const sessionId = visitorTracker.sessionId || "unknown";

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
                offlineIncidents[signature] = createNewIncident(type, severity, message, stackTrace, sessionId, signature, extraContext);
            }
        } else {
            offlineIncidents[signature] = createNewIncident(type, severity, message, stackTrace, sessionId, signature, extraContext);
        }

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
        Timestamp: new Date().toISOString(),
        Source: "WEBSITE",
        Type: type,
        Severity: severity,
        Page: window.location.href,
        Route: window.location.hash || "/",
        Message: message,
        ErrorContext: extraContext,
        StackTrace: stackTrace,
        SessionId: sessionId,
        Count: 1,
        FirstSeen: new Date().toISOString(),
        LastSeen: new Date().toISOString(),
        Signature: signature,
        Synced: false
    };
};

export const syncIncidents = async () => {
    if (!navigator.onLine) return;
    
    let offlineIncidents = JSON.parse(localStorage.getItem(INCIDENTS_KEY) || "{}");
    let needsUpdate = false;
    const apiUrl = import.meta.env.VITE_INCIDENT_API_URL; // Supabase Edge Function URL

    for (const signature in offlineIncidents) {
        const incident = offlineIncidents[signature];
        if (!incident.Synced) {
            try {
                // Exclude Signature and Synced from Firebase payload
                const { Signature, Synced, ...payload } = incident;
                
                if (apiUrl) {
                    const res = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...payload, IncidentId: incident.IncidentId })
                    });
                    if (!res.ok) throw new Error("Failed to send incident to API");
                } else {
                    console.warn("VITE_INCIDENT_API_URL is not set. Incident saved locally but not synced.");
                }
                
                incident.Synced = true;
                needsUpdate = true;
            } catch (err) {
                console.error("Failed to sync incident", err);
                // We stop reporting errors here to avoid loop
            }
        }
    }

    if (needsUpdate) {
        localStorage.setItem(INCIDENTS_KEY, JSON.stringify(offlineIncidents));
    }
};

// Global Listeners (Replaces the old scattered ones)
export const initGlobalMonitoring = () => {
    window.addEventListener("error", (event) => {
        logIncident("REACT_RUNTIME_ERROR", "ERROR", event.error || event.message);
    });

    window.addEventListener("unhandledrejection", (event) => {
        logIncident("PROMISE_REJECTION", "ERROR", event.reason || "Unhandled Promise Rejection");
    });
    
    // Attempt sync on load
    setTimeout(syncIncidents, 2000);
};

