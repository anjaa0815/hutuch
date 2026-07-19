import { useState } from "react";
import { createPortal } from "react-dom";
import { auth } from "./firebase.js";
import { usePro, ProUpgradeModal } from "./ProMembership.jsx";

/* ============================================================
   ХӨТӨЧ — Төсвийн мөрийг AI-аас тайлбарлуулах (Pro)
   Тооцоолуурын төсвийн мөр бүрийн хажууд 💡 товч. Pro хэрэглэгч
   дарахад тухайн мөрийн нэр, тоо хэмжээ, үнийг AI рүү илгээж
   "энэ юу вэ, яагаад ийм үнэтэй, хэмнэж болох уу" гэж асууна.
   AI endpoint нь AdviceChat-тай ижил (VITE_CHAT_API_URL).
   ============================================================ */

const API = import.meta.env.VITE_CHAT_API_URL || "/api/chat";

async function askAI(question) {
  const headers = { "content-type": "application/json" };
  try {
    const token = await auth?.currentUser?.getIdToken();
    if (token) headers.authorization = `Bearer ${token}`;
  } catch { /* зочноор */ }
  const r = await fetch(API, {
    method: "POST", headers,
    body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.reply) throw new Error(data.error || "Хариу ирсэнгүй");
  return data.reply;
}

/* Нэг мөрийн тайлбарын товч + цонх */
export function ExplainButton({ line, context }) {
  const { isPro } = usePro();
  const [open, setOpen] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!isPro) { setShowPro(true); return; }
    setOpen(true);
    if (answer || busy) return;
    setBusy(true); setError(null);
    try {
      const q = `Барилгын төсвийн энэ мөрийг энгийн монголоор тайлбарлаж өгөөч:
"${line.name}" — тоо хэмжээ ${line.qty} ${line.unit || ""}, нэгж үнэ ${line.price}₮, нийт ${line.total}₮.${context ? " Барилгын нөхцөл: " + context : ""}
Дараах 3 зүйлийг товч хэл: (1) энэ юу вэ, юунд хэрэглэдэг вэ; (2) яагаад ийм тоо хэмжээ, үнэ гарч байгаа вэ; (3) хэмнэх боломж байвал. 4-5 өгүүлбэрт багтаа.`;
      setAnswer(await askAI(q));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={run} title="AI-аас тайлбар асуух"
        className="ml-1 rounded px-1 text-sm opacity-60 transition hover:opacity-100 hover:bg-orange-50">
        💡
      </button>
      {open && createPortal(
        <div className="flex items-center justify-center bg-black/50 p-4"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647, overflowY: "auto" }}
          onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-stone-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-xs text-white">AI</span>
                  {line.name}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-stone-400">
                  {line.qty} {line.unit} × {Number(line.price).toLocaleString()}₮ = {Number(line.total).toLocaleString()}₮
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100">✕</button>
            </div>
            {busy && (
              <div className="flex justify-center py-6">
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </span>
              </div>
            )}
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            {answer && <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{answer}</p>}
          </div>
        </div>,
        document.body
      )}
      {showPro && <ProUpgradeModal onClose={() => setShowPro(false)} reason="Төсвийн мөрийг AI-аас тайлбарлуулах нь Pro гишүүдэд нээлттэй." />}
    </>
  );
}
