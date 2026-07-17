/* ============================================================
   ХӨТӨЧ — AI зөвлөгөөний Cloud Function (provider сэлгэдэг)
   OpenAI-compatible форматтай ямар ч API ажиллана:
   Groq (Llama, ҮНЭГҮЙ tier), Google Gemini, xAI Grok, OpenAI...
   Anthropic Claude-г мөн дэмжинэ (формат нь өөр тул автоматаар таньдаг).

   Тохиргоо (functions/.env файлд):
     CHAT_BASE_URL=https://api.groq.com/openai/v1/chat/completions
     CHAT_MODEL=llama-3.3-70b-versatile
   Түлхүүр (нууцаар):
     firebase functions:secrets:set CHAT_API_KEY
   Деплой:
     firebase deploy --only functions
   ============================================================ */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
admin.initializeApp();
const adb = admin.firestore();

/* Өдрийн лимит: нэвтэрсэн хэрэглэгч 10, зочин (IP-ээр) 5 асуулт */
const LIMIT_USER = 10;
const LIMIT_GUEST = 5;

const CHAT_API_KEY = defineSecret("CHAT_API_KEY");
const CHAT_BASE_URL = defineString("CHAT_BASE_URL", { default: "https://api.groq.com/openai/v1/chat/completions" });
const CHAT_MODEL = defineString("CHAT_MODEL", { default: "llama-3.3-70b-versatile" });

const SYSTEM_PROMPT = `Чи бол hutuch.com сайтын барилгын зөвлөх AI. Зөвхөн монголоор, дүрмийн алдаагүй, товч бөгөөд ойлгомжтой хариулна.

Чиний мэргэжлийн хүрээ: Монголын нөхцөл дэх барилгын материал, хийц, технологи (суурь, хана, дулаалга, дээвэр, халаалт, цахилгаан, сантехник), БНБД норм дүрмийн ерөнхий чиглэл, өртөг зардлын ойлголт, Улаанбаатарын эрс тэс уур амьсгал (-40°C хүйтэн, дулаалгын чухал ач холбогдол).

Дүрэм:
- Хариултаа 2-6 өгүүлбэрт багтаа; шаардлагатай бол богино жагсаалт хэрэглэ.
- Тоон утга ойролцоо гэдгийг тэмдэглэж, нарийн тооцоог hutuch.com-ын Тооцоолуур, Инженерийн тооцоо хэсгээр хийхийг санал болго.
- Даацын бүтээц, цахилгааны угсралт, галын аюулгүй байдал зэрэг сэдэвт мэргэжлийн инженерээр баталгаажуулахыг заавал сануул.
- Мэдэхгүй зүйлдээ мэдэхгүй гэж шударга хэл, таамаг бүү зохио.
- Барилгаас хамааргүй асуултад маш товч хариулаад барилгын сэдэв рүү чиглүүл.`;

exports.chat = onRequest(
  { secrets: [CHAT_API_KEY], cors: true, region: "asia-northeast1", timeoutSeconds: 60, memory: "256MiB" },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
    try {
      const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
      if (!messages || messages.length === 0) { res.status(400).json({ error: "messages шаардлагатай" }); return; }
      const trimmed = messages.slice(-20).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 4000),
      }));

      /* --- Өдрийн лимит --- */
      let uid = null;
      const authz = req.headers.authorization || "";
      if (authz.startsWith("Bearer ")) {
        try { uid = (await admin.auth().verifyIdToken(authz.slice(7))).uid; } catch { /* хүчингүй token = зочин */ }
      }
      const ip = String(req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim();
      const limit = uid ? LIMIT_USER : LIMIT_GUEST;
      const today = new Date().toISOString().slice(0, 10);
      const docId = `${today}_${uid ? "u_" + uid : "ip_" + ip.replace(/[^a-zA-Z0-9.:]/g, "")}`;
      const ref = adb.collection("aiUsage").doc(docId);
      const count = await adb.runTransaction(async (t) => {
        const snap = await t.get(ref);
        const c = (snap.data()?.count || 0) + 1;
        t.set(ref, { count: c, uid: uid || null, updated: admin.firestore.FieldValue.serverTimestamp() });
        return c;
      });
      if (count > limit) {
        res.status(429).json({
          error: uid
            ? `Өдрийн ${limit} асуултын лимит дууслаа — маргааш дахин асуугаарай.`
            : `Зочны өдрийн ${limit} асуултын лимит дууслаа — нэвтэрч илүү олон асуулт асуугаарай.`,
          remaining: 0,
        });
        return;
      }
      const remaining = limit - count;

      const baseUrl = CHAT_BASE_URL.value();
      const model = CHAT_MODEL.value();
      const key = CHAT_API_KEY.value();
      const isAnthropic = baseUrl.includes("api.anthropic.com");

      let reply = "";
      if (isAnthropic) {
        /* --- Anthropic формат --- */
        const r = await fetch(baseUrl, {
          method: "POST",
          headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          body: JSON.stringify({ model, max_tokens: 1024, system: SYSTEM_PROMPT, messages: trimmed }),
        });
        const data = await r.json();
        if (!r.ok) { console.error("Provider error:", data); res.status(502).json({ error: "AI үйлчилгээ түр боломжгүй" }); return; }
        reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      } else {
        /* --- OpenAI-compatible формат: Groq, Gemini, Grok, OpenAI... --- */
        const r = await fetch(baseUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
          }),
        });
        const data = await r.json();
        if (!r.ok) { console.error("Provider error:", data); res.status(502).json({ error: "AI үйлчилгээ түр боломжгүй" }); return; }
        reply = data.choices?.[0]?.message?.content || "";
      }

      if (!reply) { res.status(502).json({ error: "Хоосон хариу ирлээ" }); return; }
      res.json({ reply, remaining });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Серверийн алдаа" });
    }
  }
);
