import { useState, useRef, useEffect } from "react";
import { auth } from "./firebase.js";

/* ============================================================
   ХӨТӨЧ — AI Зөвлөх чат (Зөвлөгөө хэсэг)
   Cloud Function-оор дамжин Anthropic Claude-тай ярилцана.
   Endpoint: .env дэх VITE_CHAT_API_URL (функцээ deploy хийсний
   дараа хэвлэгдэх URL), эсвэл hosting rewrite бол /api/chat.
   ============================================================ */

const API = import.meta.env.VITE_CHAT_API_URL || "/api/chat";

const SUGGESTIONS = [
  "УБ-д амины сууцны суурийн гүн хэд байх ёстой вэ?",
  "Хөнгөн блок, тоосго хоёрын аль нь дээр вэ?",
  "Гадна дулаалгад EPS үү, чулуун хөвөн үү?",
  "1м² барилгын өртөг одоо ойролцоогоор хэд вэ?",
  "Шалны халаалт манай нөхцөлд тохирох уу?",
];

export default function AdviceChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const headers = { "content-type": "application/json" };
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (token) headers.authorization = `Bearer ${token}`;
      } catch { /* зочноор үргэлжилнэ */ }
      const r = await fetch(API, { method: "POST", headers, body: JSON.stringify({ messages: next }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.reply) throw new Error(data.error || "Хариу ирсэнгүй");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch (e) {
      setError(e.message === "Failed to fetch"
        ? "Сервертэй холбогдож чадсангүй — chat функц deploy хийгдсэн, VITE_CHAT_API_URL зөв эсэхийг шалгана уу."
        : e.message);
      setMessages((m) => m.slice(0, -1));
      setInput(q);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
      {/* Толгой */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 to-indigo-900 px-5 py-4 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-lg font-black">AI</div>
        <div>
          <div className="font-bold">Хөтөч AI зөвлөх</div>
          <div className="text-[11px] text-slate-300">Барилгын материал, хийц, өртгийн талаар асуугаарай — 24/7</div>
        </div>
      </div>

      {/* Мессежүүд */}
      <div className="max-h-[420px] min-h-[180px] space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div>
            <p className="mb-3 text-sm text-slate-500">Түгээмэл асуултаас сонгох эсвэл өөрийн асуултаа бичээрэй:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 transition hover:border-orange-400 hover:text-orange-600">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "rounded-br-md bg-orange-600 text-white"
                : "rounded-bl-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 px-4 py-3">
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        {error && <p className="rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>

      {/* Оруулга */}
      <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Асуултаа бичээрэй..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none" />
        <button onClick={() => send()} disabled={busy || !input.trim()}
          className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-40">
          Илгээх
        </button>
      </div>
      <p className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 text-[10px] text-slate-400">
        AI зөвлөгөө нь ерөнхий мэдээлэл — даацын бүтээц, цахилгаан зэрэг чухал шийдвэрийг мэргэжлийн инженерээр баталгаажуулна уу.
        {remaining !== null && <span className="ml-2 font-mono">Өнөөдөр үлдсэн: {remaining} асуулт</span>}
      </p>
    </div>
  );
}
