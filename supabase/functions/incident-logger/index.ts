import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ORIGINS = ["http://localhost:5173", "https://kgbbq.com", "https://www.kgbbq.com"];

const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT = 50;
const WINDOW_MS = 60000;

const FIREBASE_DB_URL = Deno.env.get("FIREBASE_DB_URL");
const FIREBASE_SECRET = Deno.env.get("FIREBASE_SECRET");

const sanitizeText = (text: string) => {
  if (!text) return "";
  let s = text.toString();
  s = s.replace(/(token|password|otp|secret|key|pwd)=([^\s&]+)/gi, "=[REDACTED]");
  return s;
};

async function writeIncidentToFirebase(payload: any) {
    if (!FIREBASE_DB_URL || !FIREBASE_SECRET) return false;
    const fbUrl = `${FIREBASE_DB_URL}/_incidents/${payload.IncidentId}.json?auth=${FIREBASE_SECRET}`;
    const res = await fetch(fbUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.ok;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin);
  const headers = { ...corsHeaders, 'Access-Control-Allow-Origin': isAllowedOrigin && origin ? origin : ALLOWED_ORIGINS[0] };

  if (req.method === 'OPTIONS') return new Response('ok', { headers });

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: "Unauthorized Origin" }), { status: 403, headers });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    let rl = rateLimitMap.get(ip);
    
    if (!rl || now > rl.resetAt) rl = { count: 1, resetAt: now + WINDOW_MS };
    else rl.count++;
    rateLimitMap.set(ip, rl);

    if (rl.count > RATE_LIMIT) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...headers, "Content-Type": "application/json" } });

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10240) return new Response(JSON.stringify({ error: "Payload too large" }), { status: 413, headers: { ...headers, "Content-Type": "application/json" } });

    const payload = await req.json();

    const allowedKeys = [
        "IncidentId", "Program", "Component", "ErrorType", "Severity", "Timestamp", 
        "Message", "TechnicalDetails", "Source", "StackTrace", "CorrelationId", 
        "SessionId", "UserContext", "Status", "Occurrences",
        "Application", "Type", "Page", "Route", "ErrorContext", "Count", "FirstSeen", "LastSeen", "Signature", "Synced"
    ];
    const payloadKeys = Object.keys(payload);
    const hasExtraKeys = payloadKeys.some(k => !allowedKeys.includes(k));
    if (hasExtraKeys) return new Response(JSON.stringify({ error: "Extraneous fields not allowed" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });

    const cleanMessage = sanitizeText(String(payload.Message || "")).substring(0, 500);
    const cleanStack = sanitizeText(String(payload.StackTrace || "")).substring(0, 2000);
    const serverTimestamp = new Date().toISOString();

    const finalIncident = {
        IncidentId: (payload.IncidentId ? String(payload.IncidentId).substring(0, 40) + "-" + Math.random().toString(36).substring(2,6).toUpperCase() : "WEB-" + new Date().toISOString().replace(/\D/g, "").slice(0,14) + "-" + Math.random().toString(36).substring(2,6).toUpperCase()), "").slice(0,14) + "-" + Math.random().toString(36).substring(2,6).toUpperCase()),
        Program: "WEBSITE",
        Component: payload.Component || "BROWSER",
        ErrorType: payload.ErrorType || payload.Type || "UNKNOWN",
        Severity: payload.Severity || "ERROR",
        Timestamp: serverTimestamp,
        Message: cleanMessage,
        TechnicalDetails: sanitizeText(String(payload.TechnicalDetails || payload.ErrorContext || "")),
        Source: "WEBSITE",
        StackTrace: cleanStack,
        CorrelationId: payload.CorrelationId || payload.Signature || "",
        SessionId: payload.SessionId || "",
        UserContext: payload.UserContext || "Anonymous Visitor",
        Status: payload.Status || "NEW",
        Occurrences: payload.Occurrences || payload.Count || 1,

        Application: "WEBSITE",
        Type: payload.ErrorType || payload.Type || "UNKNOWN",
        Page: payload.Page || "",
        Route: payload.Route || "",
        ErrorContext: payload.ErrorContext || "",
        Count: payload.Occurrences || payload.Count || 1,
        FirstSeen: payload.FirstSeen || serverTimestamp,
        LastSeen: serverTimestamp,
        Signature: payload.CorrelationId || payload.Signature || "",
        Synced: true
    };

    const success = await writeIncidentToFirebase(finalIncident);
    if (!success) return new Response(JSON.stringify({ error: "Internal Storage Error" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ success: true, message: "Incident logged securely" }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("Edge Function Error:", e);
    // Log edge function error itself to Firebase
    try {
        const edgeIncidentId = "WEB-" + new Date().toISOString().replace(/\D/g, "").slice(0,14) + "-" + Math.random().toString(36).substring(2,6).toUpperCase();
        await writeIncidentToFirebase({
            IncidentId: edgeIncidentId,
            Program: "WEBSITE",
            Component: "EDGE_FUNCTION",
            ErrorType: "EDGE_FUNCTION",
            Severity: "ERROR",
            Timestamp: new Date().toISOString(),
            Message: e.message || "Unknown edge error",
            TechnicalDetails: "",
            Source: "WEBSITE",
            StackTrace: e.stack || "",
            CorrelationId: "",
            SessionId: "",
            UserContext: "System",
            Status: "NEW",
            Occurrences: 1
        });
    } catch(err) {}
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
  }
});


