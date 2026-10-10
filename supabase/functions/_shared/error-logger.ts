export async function logEdgeFunctionError(componentName: string, error: any) {
    try {
        const FIREBASE_DB_URL = Deno.env.get("FIREBASE_DB_URL");
        const FIREBASE_SECRET = Deno.env.get("FIREBASE_SECRET");
        if (FIREBASE_DB_URL && FIREBASE_SECRET) {
            const edgeIncidentId = "WEB-" + new Date().toISOString().replace(/\D/g, "").slice(0,14) + "-" + Math.random().toString(36).substring(2,6).toUpperCase();
            const errPayload = {
                IncidentId: edgeIncidentId,
                Program: "WEBSITE",
                Component: componentName,
                ErrorType: "EDGE_FUNCTION",
                Severity: "ERROR",
                Timestamp: new Date().toISOString(),
                Message: error.message || "Unknown edge error",
                TechnicalDetails: "",
                Source: "WEBSITE",
                StackTrace: error.stack || "",
                Status: "NEW",
                Occurrences: 1
            };
            await fetch(`${FIREBASE_DB_URL}/_incidents/${edgeIncidentId}.json?auth=${FIREBASE_SECRET}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(errPayload)
            });
        }
    } catch(err) {}
}
