import { logEdgeFunctionError } from "../_shared/error-logger.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const rateLimits = new Map<string, number>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const firebaseDbUrl = Deno.env.get("FIREBASE_DB_URL") || "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app";
    const firebaseSecret = Deno.env.get("FIREBASE_SECRET");

    if (!firebaseSecret) {
      return new Response(JSON.stringify({ error: "Server Configuration Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 8192) {
      return new Response(JSON.stringify({ error: "Payload too large" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const payload = await req.json();
    const { action, sessionData } = payload;

    if (!sessionData || !sessionData.SessionId || typeof sessionData.SessionId !== 'string' || sessionData.SessionId.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid SessionId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const sessionId = sessionData.SessionId;
    const visitorId = typeof sessionData.VisitorId === 'string' ? sessionData.VisitorId.substring(0, 64) : sessionId;
    const now = Date.now();
    const lastSeen = rateLimits.get(sessionId) || 0;
    if (now - lastSeen < 3000) {
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }
    rateLimits.set(sessionId, now);
    if (rateLimits.size > 2000) {
      const cutoff = now - 120000;
      for (const [k, v] of rateLimits.entries()) {
        if (v < cutoff) rateLimits.delete(k);
      }
    }

    const serverIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "Unknown";
    const serverTimestamp = new Date().toISOString();

    let ipLocation = "Unknown";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${serverIP}?fields=status,country,regionName,city`, { signal: AbortSignal.timeout(3000) });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.status === "success") {
          ipLocation = `${geo.city}, ${geo.regionName}, ${geo.country}`;
        }
      }
    } catch { }

    let locationSource = "IP_GEOLOCATION";
    let displayLocation = ipLocation;
    const geoPermission = typeof sessionData.GeoPermission === 'string' ? sessionData.GeoPermission.substring(0, 20) : "PENDING";
    const geoLat = typeof sessionData.GeoLat === 'number' ? sessionData.GeoLat : null;
    const geoLng = typeof sessionData.GeoLng === 'number' ? sessionData.GeoLng : null;
    const geoAccuracy = typeof sessionData.GeoAccuracy === 'number' ? sessionData.GeoAccuracy : null;

    if (geoPermission === "GRANTED" && geoLat !== null && geoLng !== null) {
      locationSource = "BROWSER_GPS";
      try {
        const rgRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${geoLat}&lon=${geoLng}&format=json&accept-language=en`, {
          headers: { "User-Agent": "SmokeAndSmashVisitorTracker/1.0" },
          signal: AbortSignal.timeout(3000)
        });
        if (rgRes.ok) {
          const rg = await rgRes.json();
          if (rg.display_name) {
            displayLocation = rg.display_name;
          } else if (rg.address) {
            const addr = rg.address;
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const state = addr.state || addr.region || "";
            const country = addr.country || "";
            displayLocation = [city, state, country].filter(Boolean).join(", ");
          }
        }
      } catch { }
    }

    const activeVisitor: Record<string, unknown> = {
      SessionId: sessionId,
      VisitorId: visitorId,
      StartedAt: typeof sessionData.StartedAt === 'string' ? sessionData.StartedAt.substring(0, 40) : serverTimestamp,
      LastSeenAt: serverTimestamp,
      CurrentPage: typeof sessionData.CurrentPage === 'string' ? sessionData.CurrentPage.substring(0, 200) : "/",
      CurrentRoute: typeof sessionData.CurrentRoute === 'string' ? sessionData.CurrentRoute.substring(0, 200) : "/",
      LastPage: typeof sessionData.LastPage === 'string' ? sessionData.LastPage.substring(0, 200) : "",
      LastRoute: typeof sessionData.LastRoute === 'string' ? sessionData.LastRoute.substring(0, 200) : "",
      DeviceType: typeof sessionData.DeviceType === 'string' ? sessionData.DeviceType.substring(0, 50) : "Unknown",
      OS: typeof sessionData.OS === 'string' ? sessionData.OS.substring(0, 50) : "Unknown",
      Browser: typeof sessionData.Browser === 'string' ? sessionData.Browser.substring(0, 50) : "Unknown",
      UserAgent: typeof sessionData.UserAgent === 'string' ? sessionData.UserAgent.substring(0, 250) : "",
      IP: serverIP,
      IPLocation: displayLocation,
      LocationSource: locationSource,
      GeoPermission: geoPermission,
      GeoLat: geoLat,
      GeoLng: geoLng,
      GeoAccuracy: geoAccuracy,
      IsOrdering: !!sessionData.IsOrdering,
      IsLoggedIn: !!sessionData.IsLoggedIn,
      EventCount: typeof sessionData.EventCount === 'number' ? Math.min(sessionData.EventCount, 10000) : 0,
      Duration: typeof sessionData.Duration === 'number' ? sessionData.Duration : 0,
      Status: "ACTIVE"
    };

    const dateObj = new Date();
    const dateKey = dateObj.toISOString().split('T')[0];
    const monthKey = dateKey.substring(0, 7);

    if (action === 'close') {
      activeVisitor.Status = "CLOSED";
      activeVisitor.EndedAt = serverTimestamp;

      const historySnapshot = { ...activeVisitor };
      const snapUrl = `${firebaseDbUrl}/_visitors/history/${sessionId}/snapshot.json?auth=${firebaseSecret}`;
      await fetch(snapUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(historySnapshot) });

      const delUrl = `${firebaseDbUrl}/_visitors/active/${sessionId}.json?auth=${firebaseSecret}`;
      await fetch(delUrl, { method: "DELETE" });

      return new Response(JSON.stringify({ success: true, closed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const fbUrl = `${firebaseDbUrl}/_visitors/active/${sessionId}.json?auth=${firebaseSecret}`;
    await fetch(fbUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activeVisitor) });

    const uniqueTodayUrl = `${firebaseDbUrl}/_visitors/stats/today/${dateKey}/${visitorId}.json?auth=${firebaseSecret}`;
    fetch(uniqueTodayUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(serverTimestamp) }).catch(() => {});

    const uniqueMonthUrl = `${firebaseDbUrl}/_visitors/stats/month/${monthKey}/${visitorId}.json?auth=${firebaseSecret}`;
    fetch(uniqueMonthUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(serverTimestamp) }).catch(() => {});

    if (action === 'event' && payload.event) {
      const eventData = { type: String(payload.event.type || "UNKNOWN").substring(0, 50), timestamp: serverTimestamp, details: String(payload.event.details || "").substring(0, 200) };
      const historyUrl = `${firebaseDbUrl}/_visitors/history/${sessionId}/events.json?auth=${firebaseSecret}`;
      await fetch(historyUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventData) });
    }

    const snapUrl = `${firebaseDbUrl}/_visitors/history/${sessionId}/snapshot.json?auth=${firebaseSecret}`;
    await fetch(snapUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activeVisitor) });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error: any) {
    await logEdgeFunctionError("visitor-tracker", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});


