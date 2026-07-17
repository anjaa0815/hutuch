/* ============================================================
   ХӨТӨЧ — AI зөвлөгөөний Cloud Function
   Browser → энэ функц → Anthropic API. API түлхүүр зөвхөн
   серверийн нууцад хадгалагдана (ANTHROPIC_API_KEY secret).
   Тохируулах: firebase functions:secrets:set ANTHROPIC_API_KEY
   Деплой:     firebase deploy --only functions
   ============================================================ */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const SYSTEM_PROMPT = `Чи бол hutuch.com сайтын барилгын зөвлөх AI. Монголоор, товч бөгөөд ойлгомжтой хариулна.

Чиний мэргэжлийн хүрээ: Монголын нөхцөл дэх барилгын материал, хийц, технологи (суурь, хана, дулаалга, дээвэр, халаалт, цахилгаан, сантехник), БНБД норм дүрмийн ерөнхий чиглэл, өртөг зардлын ойлголт, Улаанбаатарын эрс тэс уур амьсгалын онцлог (-40°C хүйтэн, дулаалгын чухал ач холбогдол).

Дүрэм:
- Хариултаа 2-6 өгүүлбэрт багтаахыг хичээ; жагсаалт хэрэгтэй бол богино жагсаалт хэрэглэ.
- Тоон утга хэлэхдээ ойролцоо гэдгийг тэмдэглэ, нарийн тооцоог hutuch.com-ын Тооцоолуур болон Инженерийн тооцоо хэсгээр хийхийг санал болго.
- Даацын бүтээц, цахилгааны угсралт, галын аюулгүй байдал зэрэг аюултай сэдэвт заавал мэргэжлийн инженер/мэргэжилтнээр баталгаажуулахыг сануул.
- Мэдэхгүй зүйлдээ мэдэхгүй гэж шударга хэл, таамаг бүү зохио.
- Барилгаас огт хамааргүй асуултад маш товч эелдэг хариулаад барилгын сэдэв рүү чиглүүл.`;

exports.chat = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: true, region: "asia-northeast1", timeoutSeconds: 60, memory: "256MiB" },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
    try {
      const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
      if (!messages || messages.length === 0) { res.status(400).json({ error: "messages шаардлагатай" }); return; }
      // Хамгаалалт: сүүлийн 20 мессеж, мессеж бүр 4000 тэмдэгтээс ихгүй
      const trimmed = messages.slice(-20).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 4000),
      }));
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY.value(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: trimmed,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        console.error("Anthropic error:", data);
        res.status(502).json({ error: "AI үйлчилгээ түр боломжгүй" });
        return;
      }
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      res.json({ reply: text });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Серверийн алдаа" });
    }
  }
);
