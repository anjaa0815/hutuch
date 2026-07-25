import { useState } from "react";
import { createPortal } from "react-dom";
import { auth } from "./firebase.js";

/* ============================================================
   ХӨТӨЧ — AI план үүсгэгч
   Хэрэглэгч энгийн үгээр бичнэ ("60м², 2 унтлагатай, гаражтай")
   → AI зөвхөн ӨРӨӨНИЙ ХӨТӨЛБӨР (нэр, төрөл, талбай) гаргана
   → Зохион байгуулалтыг ЭНД, алгоритмаар барина (давхцалгүй)
   → Хаалга, цонх автоматаар байрлана
   ============================================================ */

const API = import.meta.env.VITE_CHAT_API_URL || "/api/chat";
const uid = () => Math.random().toString(36).slice(2, 9);
const snap = (v, st = 0.25) => Math.round(v / st) * st;

/* ---------- 1. AI-аас өрөөний хөтөлбөр авах ---------- */
const SYS = `Чи бол Монголын барилгын төлөвлөгч. Хэрэглэгчийн тайлбараас өрөөний жагсаалт гаргана.
ЗӨВХӨН JSON буцаа, өөр текст, тайлбар, markdown хашилт бичих ЁСГҮЙ.
Формат:
{"totalArea": 60, "rooms": [{"name":"Зочны өрөө","type":"living","area":18},{"name":"Унтлагын өрөө","type":"bed","area":12}]}
Дүрэм:
- type нь: living, bed, kitchen, bath, hall, garage, storage, work-ийн аль нэг
- Талбайн нийлбэр totalArea-тай ойролцоо байна
- Монгол нөхцөлд: угаалгын өрөө 4-6м², коридор 4-8м², гал тогоо 8-14м², унтлага 10-16м², зочны 16-24м², гараж 18-24м²
- 3-8 өрөө. Хэрэглэгч тоо заагаагүй бол талбайд тохирсон логик тоо.
- Нэрийг монголоор бич.`;

async function askProgram(text) {
  const headers = { "content-type": "application/json" };
  try {
    const token = await auth?.currentUser?.getIdToken();
    if (token) headers.authorization = `Bearer ${token}`;
  } catch { /* зочноор */ }
  const r = await fetch(API, {
    method: "POST", headers,
    body: JSON.stringify({ messages: [{ role: "user", content: `${SYS}\n\nХэрэглэгч: ${text}` }] }),
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 429) throw new Error("Өдрийн лимит дууслаа — маргааш эсвэл Pro-гоор үргэлжлүүлнэ үү.");
  if (!r.ok || !data.reply) throw new Error(data.error || "AI хариу ирсэнгүй");
  // JSON-г цэвэрлэж задлах (заримдаа ```json хашилттай ирдэг)
  const clean = String(data.reply).replace(/```json|```/g, "").trim();
  const m = clean.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI буруу хариу өгсөн — дахин оролдоно уу");
  const prog = JSON.parse(m[0]);
  if (!Array.isArray(prog.rooms) || !prog.rooms.length) throw new Error("Өрөө таньсангүй — тайлбараа дэлгэрүүлнэ үү");
  return prog;
}

/* ---------- 2. Зохион байгуулалт: slice-and-dice (давхцалгүй) ---------- */
export function layoutRooms(program) {
  const rooms = program.rooms
    .map((r) => ({ ...r, area: Math.max(3, Number(r.area) || 8) }))
    .sort((a, b) => b.area - a.area);
  const total = rooms.reduce((a, r) => a + r.area, 0);
  // Барилгын гадна хэмжээ — 1.25 харьцаатай тэгш өнцөгт
  const W = snap(Math.sqrt(total * 1.25), 0.25);
  const L = snap(total / W, 0.25);

  const out = [];
  /* Тэгш өнцөгтийг талбайн харьцаагаар рекурсив хуваана */
  const split = (list, x, y, w, l) => {
    if (!list.length) return;
    if (list.length === 1) {
      out.push({ ...list[0], x, y, w, l });
      return;
    }
    const sum = list.reduce((a, r) => a + r.area, 0);
    // Хагасыг нь эхний бүлэгт — талбайгаар тэнцүүлж
    let acc = 0, cut = 1;
    for (let i = 0; i < list.length; i++) {
      acc += list[i].area;
      if (acc >= sum / 2) { cut = i + 1; break; }
    }
    cut = Math.min(Math.max(cut, 1), list.length - 1);
    const aSum = list.slice(0, cut).reduce((a, r) => a + r.area, 0);
    const frac = aSum / sum;
    if (w >= l) {
      const wa = snap(w * frac, 0.25);
      split(list.slice(0, cut), x, y, wa, l);
      split(list.slice(cut), x + wa, y, w - wa, l);
    } else {
      const la = snap(l * frac, 0.25);
      split(list.slice(0, cut), x, y, w, la);
      split(list.slice(cut), x, y + la, w, l - la);
    }
  };
  split(rooms, 0, 0, W, L);

  /* Хэт нарийн өрөөг засах — 1.5м-ээс нарийн бол алгасна */
  return { W, L, boxes: out.filter((b) => b.w >= 1.2 && b.l >= 1.2) };
}

/* ---------- 3. Хаалга, цонх автоматаар ---------- */
function buildRooms(layout) {
  const { W, L, boxes } = layout;
  const eps = 0.01;
  return boxes.map((b, i) => {
    const points = [
      { x: b.x, y: b.y }, { x: b.x + b.w, y: b.y },
      { x: b.x + b.w, y: b.y + b.l }, { x: b.x, y: b.y + b.l },
    ];
    /* Ирмэг бүр гадна талд эсэхийг тодорхойлно */
    const edges = points.map((p, j) => {
      const q = points[(j + 1) % 4];
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const outer = Math.abs(mx) < eps || Math.abs(mx - W) < eps
        || Math.abs(my) < eps || Math.abs(my - L) < eps;
      return { j, len: Math.hypot(q.x - p.x, q.y - p.y), outer };
    });
    const openings = [];
    // Цонх — хамгийн урт ГАДНА ирмэг дээр (угаалга, агуулах, коридороос бусад)
    const outers = edges.filter((e) => e.outer && e.len > 1.4).sort((a, b) => b.len - a.len);
    if (outers.length && !["bath", "storage", "hall"].includes(b.type)) {
      openings.push({ id: uid(), type: "win", edge: outers[0].j, t: 0.5, w: Math.min(1.5, outers[0].len * 0.5), h: 1.4 });
    }
    // Хаалга — дотор ирмэг дээр, байхгүй бол гадна (орох хаалга)
    const inners = edges.filter((e) => !e.outer && e.len > 1.0).sort((a, b) => b.len - a.len);
    const doorEdge = inners[0] || outers[0] || edges[0];
    const isEntry = b.type === "garage" || (!inners.length && b.type === "hall");
    openings.push({
      id: uid(), type: "door", edge: doorEdge.j, t: 0.5,
      w: b.type === "garage" ? Math.min(2.6, doorEdge.len * 0.8) : (isEntry ? 1.0 : 0.9),
      h: b.type === "garage" ? 2.2 : 2.1,
    });
    return {
      id: "r" + Date.now() + i,
      name: b.name || `Өрөө ${i + 1}`,
      points,
      openings,
      wallKind: "ext",
    };
  });
}

export function programToProject(program) {
  const layout = layoutRooms(program);
  return {
    rooms: buildRooms(layout),
    settings: { floors: 1, wallH: 2.7 },
    _meta: { W: layout.W, L: layout.L },
  };
}

/* ---------- Жижиг урьдчилсан харагдац ---------- */
function Preview({ rooms }) {
  const COLORS = ["#fdba74", "#93c5fd", "#86efac", "#fca5a5", "#d8b4fe", "#fde047", "#a5b4fc", "#fdba74"];
  const pts = rooms.flatMap((r) => r.points);
  const maxX = Math.max(...pts.map((p) => p.x)), maxY = Math.max(...pts.map((p) => p.y));
  const W = 300, H = 210, pad = 10;
  const s = Math.min((W - pad * 2) / maxX, (H - pad * 2) / maxY);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded-xl bg-stone-50">
      {rooms.map((r, i) => {
        const cx = r.points.reduce((a, p) => a + p.x, 0) / 4;
        const cy = r.points.reduce((a, p) => a + p.y, 0) / 4;
        const area = Math.abs((r.points[1].x - r.points[0].x) * (r.points[2].y - r.points[1].y));
        return (
          <g key={r.id}>
            <polygon points={r.points.map((p) => `${pad + p.x * s},${pad + p.y * s}`).join(" ")}
              fill={COLORS[i % COLORS.length]} fillOpacity="0.5" stroke="#44403c" strokeWidth="2.5" strokeLinejoin="round" />
            <text x={pad + cx * s} y={pad + cy * s} textAnchor="middle" fontSize="8" fontWeight="700" fill="#292524">{r.name}</text>
            <text x={pad + cx * s} y={pad + cy * s + 9} textAnchor="middle" fontSize="7" fill="#57534e" fontFamily="monospace">{area.toFixed(1)}м²</text>
          </g>
        );
      })}
    </svg>
  );
}

const EXAMPLES = [
  "60м², 2 унтлагатай, гал тогоо, угаалгын өрөөтэй амины сууц",
  "100м², 3 унтлага, том зочны өрөө, гараж",
  "40м² зуслангийн байшин, 1 унтлагатай",
  "80м², 2 унтлага, ажлын өрөө, агуулахтай",
];

/* ---------- Дотоод самбар: оруулга + үр дүн ---------- */
function PlanPanel({ onApply, locked, onLocked }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (locked) { onLocked?.(); return; }
    if (!text.trim() || busy) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const prog = await askProgram(text.trim());
      const proj = programToProject(prog);
      if (!proj.rooms.length) throw new Error("План үүсгэж чадсангүй — өөрөөр тайлбарлана уу");
      setResult(proj);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="Жишээ: 70м², 2 унтлагатай, гал тогоо, угаалгын өрөө, коридортой амины сууц"
        className="w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-800 focus:border-violet-500 focus:outline-none" />

      <div className="mt-2 flex flex-wrap gap-1">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => setText(ex)}
            className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] text-stone-600 hover:bg-stone-200">
            {ex.length > 34 ? ex.slice(0, 34) + "…" : ex}
          </button>
        ))}
      </div>

      <button onClick={run} disabled={busy || (!locked && !text.trim())}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40">
        {busy ? "AI бодож байна…" : locked ? "🔒 Pro болж нээх" : "План үүсгэх"}
      </button>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {result && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
              {result.rooms.length} өрөө · {result._meta.W}×{result._meta.L}м
            </span>
            <button onClick={run} className="text-[11px] font-bold text-violet-600 hover:underline">↻ Дахин үүсгэх</button>
          </div>
          <Preview rooms={result.rooms} />
          <button onClick={() => { onApply({ rooms: result.rooms, settings: result.settings }); setResult(null); setText(""); }}
            className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
            Планд буулгах →
          </button>
          <p className="mt-2 text-[10px] text-stone-400">
            Буулгасны дараа өрөө бүрийн хэмжээ, хана, хаалга цонхыг чирж засна. Одоогийн зурсан план солигдоно.
          </p>
        </div>
      )}
    </>
  );
}

/* ---------- Нүүр хуудсанд суух хувилбар ---------- */
export function AIPlanInline({ onApply, locked, onLocked }) {
  return (
    <div className="rounded-[2rem] border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-900/50 dark:from-violet-950/20 dark:to-slate-900 sm:p-8">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          ✨ AI-аар байшингаа зуруул
        </h2>
        <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-[10px] font-black text-white">PRO</span>
      </div>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Ямар байшин барихаа энгийн үгээр бичихэд AI өрөөнүүдийг зохион байгуулж, план зурж өгнө — дараа нь төсөв нь шууд гарна.
      </p>
      <PlanPanel onApply={onApply} locked={locked} onLocked={onLocked} />
      {locked && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          AI план зурах нь Pro гишүүдэд нээлттэй. Pro болбол хязгааргүй план, cloud төсөл, төсвийн AI тайлбар нэмэгдэнэ.
        </p>
      )}
    </div>
  );
}

/* ---------- Тооцоолуур доторх товч + цонх ---------- */
export default function AIPlanGenerator({ onApply, locked, onLocked }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} title="AI-аар план үүсгэх"
        className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1.5 text-sm font-medium text-white shadow hover:opacity-90">
        ✨ AI план
      </button>
      {open && createPortal(
        <div className="flex items-center justify-center bg-black/50 p-4"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647, overflowY: "auto" }}
          onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900">✨ AI-аар план үүсгэх</h3>
                <p className="text-xs text-stone-500">Ямар байшин барихаа энгийн үгээр бичээрэй</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100">✕</button>
            </div>
            <PlanPanel onApply={(d) => { onApply(d); setOpen(false); }} locked={locked}
              onLocked={() => { setOpen(false); onLocked?.(); }} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
