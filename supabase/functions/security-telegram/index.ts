import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getEgyptTime(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
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
    const EXPECTED_KEY = Deno.env.get("PROGRAM2_SECURITY_KEY");
    const authHeader = req.headers.get("authorization");

    if (!EXPECTED_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!authHeader || authHeader !== "Bearer " + EXPECTED_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized caller" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json();
    const { AlertId, Source, Type, Severity, Title, Message, Timestamp, IncidentId, Metadata } = payload;
    
    const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_SECURITY_BOT_TOKEN");
    const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_SECURITY_CHAT_ID");

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const timeStr = getEgyptTime(Timestamp);

    const textMsg = "?? <b>" + (Title || "Security Alert") + "</b>\n\n" +
                    "<b>Severity:</b> " + (Severity || "N/A") + "\n" +
                    "<b>Type:</b> " + (Type || "N/A") + "\n" +
                    "<b>Source:</b> " + (Source || "N/A") + "\n" +
                    "<b>IncidentId:</b> " + (IncidentId || "N/A") + "\n\n" +
                    "<b>Message:</b>\n" + (Message || "N/A") + "\n\n" +
                    "<b>Time:</b> " + timeStr;

    const tgUrl = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
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
      console.error("Telegram API Error:", JSON.stringify(tgData));
      return new Response(JSON.stringify({ error: "Failed to dispatch alert", telegram_error: tgData.description || "Unknown Telegram Error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Security alert dispatched.", message_id: tgData.result.message_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Edge Function Error:", error);
    try {
        const FIREBASE_DB_URL = Deno.env.get("FIREBASE_DB_URL");
        const FIREBASE_SECRET = Deno.env.get("FIREBASE_SECRET");
        if (FIREBASE_DB_URL && FIREBASE_SECRET) {
            const edgeIncidentId = "WEB-" + new Date().toISOString().replace(/\D/g, "").slice(0,14) + "-" + Math.random().toString(36).substring(2,6).toUpperCase();
            const errPayload = {
                IncidentId: edgeIncidentId,
                Program: "WEBSITE",
                Component: "security-telegram",
                ErrorType: "EDGE_FUNCTION",
                Severity: "ERROR",
                Timestamp: new Date().toISOString(),
                Message: error.message || "Unknown edge error",
                TechnicalDetails: "",
                Source: "WEBSITE",
                StackTrace: error.stack || "",
                CorrelationId: "",
                SessionId: "",
                UserContext: "System",
                Status: "NEW",
                Occurrences: 1
            };
            fetch(`${FIREBASE_DB_URL}/_incidents/${edgeIncidentId}.json?auth=${FIREBASE_SECRET}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(errPayload)
            }).catch(()=>{});
        }
    } catch(err) {}
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
