import { db } from "../firebase";
import { ref, set } from "firebase/database";

const INCIDENTS_KEY = "pos_website_incidents";

export const WebsiteMonitor = {
    init: () => {
        window.addEventListener("error", (event) => {
            WebsiteMonitor.logIncident({
                type: "WEBSITE_ERROR",
                severity: "ERROR",
                message: event.message,
                stackTrace: event.error?.stack || "",
                source: "WEBSITE",
                operation: "JS_ERROR"
            });
        });

        window.addEventListener("unhandledrejection", (event) => {
            WebsiteMonitor.logIncident({
                type: "WEBSITE_ERROR",
                severity: "ERROR",
                message: event.reason?.message || "Unhandled Promise Rejection",
                stackTrace: event.reason?.stack || "",
                source: "WEBSITE",
                operation: "PROMISE_REJECTION"
            });
        });
        
        // Attempt to sync offline incidents on startup
        WebsiteMonitor.syncOfflineIncidents();
    },

    logIncident: async (incidentData) => {
        const incident = {
            incidentId: `WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            application: "SmokeAndSmashWeb",
            status: "NEW",
            alertState: 0, // NEW
            ...incidentData
        };

        // Save local first
        const offlineIncidents = JSON.parse(localStorage.getItem(INCIDENTS_KEY) || "[]");
        offlineIncidents.push(incident);
        localStorage.setItem(INCIDENTS_KEY, JSON.stringify(offlineIncidents));

        // Attempt sync
        await WebsiteMonitor.syncOfflineIncidents();
    },

    syncOfflineIncidents: async () => {
        if (!navigator.onLine) return;
        
        const offlineIncidents = JSON.parse(localStorage.getItem(INCIDENTS_KEY) || "[]");
        if (offlineIncidents.length === 0) return;

        const remaining = [];
        
        for (const incident of offlineIncidents) {
            try {
                // Use RTDB instead of Firestore
                const incidentRef = ref(db, `_incidents/${incident.incidentId}`);
                await set(incidentRef, {
                    ...incident,
                    synced: true
                });
            } catch (err) {
                console.error("Failed to sync incident", err);
                remaining.push(incident);
            }
        }
        
        localStorage.setItem(INCIDENTS_KEY, JSON.stringify(remaining));
    }
};
