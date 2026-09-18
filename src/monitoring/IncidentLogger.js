export const logIncident = (type, severity, error) => {
    try {
        const incidentId = `WEB-${new Date().toISOString().replace(/\D/g, "").slice(0,14)}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
        const incident = {
            IncidentId: incidentId,
            Source: "WEBSITE",
            Severity: severity,
            Type: type,
            Timestamp: new Date().toISOString(),
            Application: "SmokeAndSmashWeb",
            Message: typeof error === "string" ? error : (error && error.message) || "Unknown error",
            StackTrace: (error && error.stack) || "",
            Status: "NEW",
            Synced: false
        };

        const existing = JSON.parse(localStorage.getItem("offline_incidents") || "[]");
        existing.push(incident);
        localStorage.setItem("offline_incidents", JSON.stringify(existing));
    } catch (e) {
        console.error("Failed to log incident", e);
    }
};

window.addEventListener("error", (event) => {
    logIncident("ERROR", "ERROR", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
    logIncident("ERROR", "ERROR", event.reason || "Unhandled Promise Rejection");
});
