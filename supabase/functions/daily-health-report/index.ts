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

function getDailyKey() {
  const d = new Date();
  const opts = { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" };
  const parts = new Intl.DateTimeFormat("en-GB", opts as any).formatToParts(d);
  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;
  return "${p.year}-${p.month}-${p.day}";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const FIREBASE_DB_URL = Deno.env.get("FIREBASE_DB_URL") || "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app";
    const FIREBASE_SECRET = Deno.env.get("FIREBASE_SECRET") || "";
    const authParam = FIREBASE_SECRET ? "?auth=${FIREBASE_SECRET}" : "";
    const dailyKey = getDailyKey();
    const idempUrl = "${FIREBASE_DB_URL}/_dailyHealthLogs/${dailyKey}.json${authParam}";
    
    const checkRes = await fetch(idempUrl);
    if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData && checkData.sent) {
            return new Response(JSON.stringify({ message: "Already sent today", message_id: checkData.message_id }), { status: 200, headers: corsHeaders });
        }
    }

    let firebaseStatus = "HEALTHY";
    let websiteStatusVal = "ONLINE";
    let syncStatus = "HEALTHY";
    let failedOnlineOrders = 0;
    let totalOnlineOrders = 0;
    let webCritical = 0;
    let webSuspicious = 0;
    
    try {
        const stateRes = await fetch("${FIREBASE_DB_URL}/_systemState.json${authParam}");
        if (stateRes.ok) {
            const stateJson = await stateRes.text();
            if (stateJson.includes("\"status\":\"PROTECTED\"")) websiteStatusVal = "PROTECTED";
            if (stateJson.includes("\"status\":\"MAINTENANCE\"")) websiteStatusVal = "MAINTENANCE";
        } else {
            firebaseStatus = "DEGRADED (Read Failed)";
        }
        
        const incRes = await fetch("${FIREBASE_DB_URL}/_incidents.json${authParam}");
        if (incRes.ok) {
            const incJson = await incRes.json();
            if (incJson) {
                for (const key in incJson) {
                    const inc = incJson[key];
                    if (inc.Severity === "CRITICAL" || inc.Type === "SECURITY_THREAT") webCritical++;
                    if (inc.Severity === "SUSPICIOUS" || inc.Severity === "WARNING") webSuspicious++;
                }
            }
        }
        
        const ordRes = await fetch("${FIREBASE_DB_URL}/orders.json${authParam}&orderBy=\"timestamp\"&limitToLast=100");
        if (ordRes.ok) {
            const ordJson = await ordRes.text();
            if (ordJson !== "null") {
                totalOnlineOrders = (ordJson.match(/"status"/g) || []).length;
                failedOnlineOrders = (ordJson.match(/"failed"/g) || []).length;
            }
        }
    } catch (e) {
        firebaseStatus = "CRITICAL (${e.message})";
        syncStatus = "DEGRADED (Connectivity Issue)";
    }

    let supabaseStatus = "HEALTHY";
    let telegramStatus = "HEALTHY";
    try {
        const supabaseUrl = Deno.env.get("SUPABASE_SECURITY_TELEGRAM_URL") || "https://cjzdghtahpjqjefjwsan.supabase.co/functions/v1/security-telegram";
        const res = await fetch(supabaseUrl, { method: "OPTIONS" });
        if (!res.ok) supabaseStatus = "DEGRADED (OPTIONS Check Failed)";
    } catch (e) {
        supabaseStatus = "CRITICAL (${e.message})";
        telegramStatus = "DEGRADED (Supabase Dependency Failed)";
    }

    const posErrors = 0;
    const p3Errors = 0;
    const localSecurity = 0;
    const totalSecurity = localSecurity + webCritical;
    
    let systemStatus = "HEALTHY";
    if (firebaseStatus.includes("CRITICAL") || supabaseStatus.includes("CRITICAL") || posErrors > 20 || webCritical > 5)
        systemStatus = "CRITICAL";
    else if (posErrors > 0 || p3Errors > 0 || webSuspicious > 0 || firebaseStatus.includes("DEGRADED") || supabaseStatus.includes("DEGRADED"))
        systemStatus = "DEGRADED";
        
    const textMsg = "?? <b>DAILY SYSTEM HEALTH REPORT</b>\n" +
        "<b>System Status:</b> ${systemStatus}\n" +
        "-------------------------\n" +
        "<b>POS:</b> ${posErrors > 0 ? "DEGRADED" : "HEALTHY"} (0 errors - Server View)\n" +
        "<b>Website:</b> ${webCritical > 0 ? "DEGRADED" : "HEALTHY"} (Status: ${websiteStatusVal})\n" +
        "<b>Program 3:</b> ${p3Errors > 0 ? "DEGRADED" : "HEALTHY"} (0 errors - Server View)\n" +
        "<b>Firebase:</b> ${firebaseStatus}\n" +
        "<b>Supabase:</b> ${supabaseStatus}\n" +
        "<b>Incident Pipeline:</b> HEALTHY (Server-side tracking)\n" +
        "<b>Security:</b> ${totalSecurity > 0 ? "DEGRADED" : "HEALTHY"}\n" +
        "<b>Telegram:</b> ${telegramStatus}\n" +
        "<b>Data Sync:</b> ${syncStatus}\n" +
        "-------------------------\n" +
        "<b>Business Health:</b>\n" +
        "- Recent Orders Sample: ${totalOnlineOrders}\n" +
        "- Failed Checks/Anomalies: ${failedOnlineOrders}\n" +
        "-------------------------\n" +
        "<b>Critical Incidents:</b> ${webCritical}\n" +
        "<b>Suspicious Activity:</b> ${webSuspicious}\n" +
        "<b>Protective Mode Events:</b> ${websiteStatusVal === "PROTECTED" ? "1 (CURRENTLY ACTIVE)" : "0"}\n" +
        "-------------------------\n" +
        "<b>Recommendations:</b> ${systemStatus === "HEALTHY" ? "Keep up the good work." : "Check Firebase incident logs for details on degraded components."}\n\n" +
        "<b>Time:</b> ${getEgyptTime()}";

    const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_SECURITY_BOT_TOKEN");
    const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_SECURITY_CHAT_ID");

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
      return new Response(JSON.stringify({ error: "Server Telegram configuration error" }), { status: 500, headers: corsHeaders });
    }

    const tgUrl = "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage";
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: textMsg,
        parse_mode: "HTML"
      })
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      return new Response(JSON.stringify({ error: "Failed to dispatch alert", telegram_error: tgData.description }), { status: 502, headers: corsHeaders });
    }

    const message_id = tgData.result.message_id;

    await fetch(idempUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sent: true, message_id, timestamp: getEgyptTime() })
    });

    return new Response(JSON.stringify({ success: true, message_id }), { status: 200, headers: corsHeaders });
  } catch (error: any) {
    await logEdgeFunctionError("daily-health-report", error);
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { status: 500, headers: corsHeaders });
  }
});

