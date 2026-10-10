import { logEdgeFunctionError } from "../_shared/error-logger.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getEgyptTime(d = new Date()) {
  const opts = { 
    timeZone: "Africa/Cairo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  };
  return new Intl.DateTimeFormat("en-GB", opts as any).format(d).replace(", ", " ");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {

  const authHeader = req.headers.get("authorization");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!authHeader || authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      return new Response("Unauthorized", { status: 401 });
  }
    const FIREBASE_DB_URL = Deno.env.get("FIREBASE_DB_URL") || "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app";
    const FIREBASE_SECRET = Deno.env.get("FIREBASE_SECRET") || "";
    const authParam = FIREBASE_SECRET ? "?auth=" + FIREBASE_SECRET : "";

    const now = new Date();
    
    // Limits
    const ACTIVE_TIMEOUT_MS = 90 * 1000;
    const HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
    const EVENTS_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
    const SECURITY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
    const DAILY_HEALTH_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

    let expiredActiveCount = 0;
    let purgedHistoryCount = 0;
    let purgedEventsCount = 0;

    const updates: Record<string, any> = {};

    // 1. Cleanup Active Visitors
    const activeRes = await fetch(`${FIREBASE_DB_URL}/_visitors/active.json${authParam}`);
    if (activeRes.ok) {
      const activeData = await activeRes.json();
      if (activeData) {
        for (const [sessionId, session] of Object.entries(activeData)) {
          if (session && (session as any).LastSeenAt) {
            const lastSeen = new Date((session as any).LastSeenAt);
            if (now.getTime() - lastSeen.getTime() > ACTIVE_TIMEOUT_MS) {
              (session as any).Status = "EXPIRED";
              (session as any).IsActive = false;
              (session as any).EndedAt = now.toISOString();

              updates[`active/${sessionId}`] = null;
              updates[`history/${sessionId}/snapshot`] = session;
              expiredActiveCount++;
            }
          }
        }
      }
    }

    // 2. Cleanup History & Events
    const historyRes = await fetch(`${FIREBASE_DB_URL}/_visitors/history.json${authParam}`);
    if (historyRes.ok) {
      const historyData = await historyRes.json();
      if (historyData) {
        for (const [sessionId, session] of Object.entries(historyData)) {
          if (!session) continue;
          
          let sessionTime = now;
          if ((session as any).LastSeenAt) {
            sessionTime = new Date((session as any).LastSeenAt);
          } else if ((session as any).StartedAt) {
            sessionTime = new Date((session as any).StartedAt);
          }

          const ageMs = now.getTime() - sessionTime.getTime();

          if (ageMs > HISTORY_RETENTION_MS) {
            updates[`history/${sessionId}`] = null;
            purgedHistoryCount++;
            continue;
          }

          if (ageMs > EVENTS_RETENTION_MS && (session as any).events) {
             updates[`history/${sessionId}/events`] = null;
             purgedEventsCount += Object.keys((session as any).events).length;
          }
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await fetch(`${FIREBASE_DB_URL}/_visitors.json${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
    }

    // 3. Cleanup Security and Incidents in bulk
    const rootUpdates: Record<string, any> = {};
    const secRes = await fetch(`${FIREBASE_DB_URL}/_security.json${authParam}`);
    if (secRes.ok) {
      const secData = await secRes.json();
      if (secData) {
        for (const [key, ev] of Object.entries(secData)) {
          if (ev && (ev as any).Timestamp) {
            if (now.getTime() - new Date((ev as any).Timestamp).getTime() > SECURITY_RETENTION_MS) {
              rootUpdates[`_security/${key}`] = null;
            }
          }
        }
      }
    }

    const incRes = await fetch(`${FIREBASE_DB_URL}/_incidents.json${authParam}`);
    if (incRes.ok) {
      const incData = await incRes.json();
      if (incData) {
        for (const [key, inc] of Object.entries(incData)) {
          if (inc && ((inc as any).CreatedAt || (inc as any).Timestamp)) {
            const t = (inc as any).CreatedAt || (inc as any).Timestamp;
            if (now.getTime() - new Date(t).getTime() > SECURITY_RETENTION_MS) {
              rootUpdates[`_incidents/${key}`] = null;
            }
          }
        }
      }
    }

    const hlRes = await fetch(`${FIREBASE_DB_URL}/_dailyHealthLogs.json${authParam}`);
    if (hlRes.ok) {
      const hlData = await hlRes.json();
      if (hlData) {
        for (const [key, hl] of Object.entries(hlData)) {
          if (key.startsWith("cleanup_")) continue;
          let hlTime = now;
          if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
              hlTime = new Date(key);
          }
          if (now.getTime() - hlTime.getTime() > DAILY_HEALTH_RETENTION_MS) {
            rootUpdates[`_dailyHealthLogs/${key}`] = null;
          }
        }
      }
    }

    if (Object.keys(rootUpdates).length > 0) {
      await fetch(`${FIREBASE_DB_URL}/.json${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rootUpdates)
      });
    }

    // 4. Log Cleanup Run
    const cleanupKey = "cleanup_" + now.toISOString().split('T')[0];
    await fetch(`${FIREBASE_DB_URL}/_dailyHealthLogs/${cleanupKey}.json${authParam}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: getEgyptTime(now),
        expiredActiveCount,
        purgedHistoryCount,
        purgedEventsCount,
        status: "SUCCESS"
      })
    });

    return new Response(JSON.stringify({ 
      success: true, 
      expiredActiveCount,
      purgedHistoryCount,
      purgedEventsCount
    }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    await logEdgeFunctionError("visitor-cleanup", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500, headers: corsHeaders });
  }
});
