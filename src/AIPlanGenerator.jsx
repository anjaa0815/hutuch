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
    body: JSON.stringify({ mode: "plan", messages: [{ role: "user", content: `${SYS}\n\nХэрэглэгч: ${text}` }] }),
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

/* ---------- 2. Зохион байгуулалт: "нуруутай" схем ----------
   Төв өрөө (коридор/зочны) нь бүх өрөөтэй хиллэдэг зурвас болно →
   өрөө бүр төвөөс ШУУД нэвтэрнэ, унтлагаар дамжин өнгөрөхгүй.
   Жижиг өрөөг хосоор нь давхарлана (жишээ: агуулах угаалгын ард).
   ------------------------------------------------------------- */

const MIN_W = 1.8;   // баганын хамгийн бага өргөн (м)
/* Төвд хэр ойр байх шаардлагатай вэ — бага нь ойр */
const HUB_NEED = { bath: 0, bed: 1, kitchen: 2, work: 3, hall: 3, living: 4, storage: 6, garage: 7 };
const hubNeed = (t) => HUB_NEED[t] ?? 4;

export function layoutRooms(program) {
  const rooms = program.rooms
    .map((r) => ({ ...r, area: Math.max(3, Number(r.area) || 8) }))
    .sort((a, b) => b.area - a.area);
  const total = rooms.reduce((a, r) => a + r.area, 0);
  let W = snap(Math.sqrt(total * 1.25), 0.25);
  const L = snap(total / W, 0.25);

  /* Хоёроос цөөн өрөө бол энгийн хуваалт */
  if (rooms.length <= 2) {
    const out = [];
    let y = 0;
    rooms.forEach((r) => {
      const h = snap(r.area / W, 0.25);
      out.push({ ...r, x: 0, y, w: W, l: h });
      y += h;
    });
    return { W, L, boxes: out };
  }

  /* --- Төв өрөө: коридор → зочны → хамгийн том --- */
  let hi = rooms.findIndex((r) => r.type === "hall");
  if (hi < 0) hi = rooms.findIndex((r) => r.type === "living");
  if (hi < 0) hi = 0;
  const hub = rooms[hi];
  const others = rooms.filter((_, i) => i !== hi);

  /* --- Өрөөнүүдийг дээд/доод бүлэгт талбайгаар тэнцүүлж хуваана --- */
  const top = [], bot = [];
  let tA = 0, bA = 0;
  others.forEach((r) => { if (tA <= bA) { top.push(r); tA += r.area; } else { bot.push(r); bA += r.area; } });

  /* Зурвас бүрийн өндөр — хэт нарийн болгохгүй. Хэрэв нийт талбай зорилтоос
     хазайвал өргөнийг (W) тохируулж 3 удаа давтана. */
  const MIN_BAND = 2.2;
  const isHall = hub.type === "hall";
  const bands = (w) => {
    /* Коридор бол нарийхан (1.2-2.0м), эс бөгөөс талбайгаараа */
    const h = isHall
      ? Math.min(Math.max(snap(hub.area / w, 0.25), 1.2), 2.0)
      : Math.min(Math.max(snap(hub.area / w, 0.25), 2.2), 4.5);
    const t = top.length ? Math.max(MIN_BAND, snap(tA / w, 0.25)) : 0;
    const b = bot.length ? Math.max(MIN_BAND, snap(bA / w, 0.25)) : 0;
    return { hubH: h, topH: t, botH: b, Ltot: snap(h + t + b, 0.25) };
  };
  let bd = bands(W);
  for (let k = 0; k < 3; k++) {
    /* Барилга хэт "вагон" болохоос сэргийлж өргөнийг хязгаарлана */
    const wMin = Math.sqrt(total * 0.6), wMax = Math.sqrt(total * 2.2);
    const w2 = snap(Math.min(Math.max(total / bd.Ltot, wMin), wMax), 0.25);
    const nb = bands(w2);
    if (Math.abs(w2 * nb.Ltot - total) < Math.abs(W * bd.Ltot - total)) { W = w2; bd = nb; }
    else break;
  }
  const { hubH, topH, botH, Ltot } = bd;

  /* --- Нэг бүлгийг багана болгож байрлуулна --- */
  const layoutBand = (list, y0, h, hubBelow) => {
    if (!list.length || h <= 0) return [];
    /* Нарийн багануудыг хосоор нэгтгэнэ */
    let cols = list.map((r) => ({ rooms: [r], area: r.area }));
    let guard = 0;
    while (guard++ < 20) {
      const sumA = cols.reduce((a, c) => a + c.area, 0);
      const narrow = cols.findIndex((c) => (c.area / sumA) * W < MIN_W);
      if (narrow < 0 || cols.length < 2) break;
      /* Хамгийн жижиг хөрштэй нь нэгтгэх */
      const other = cols
        .map((c, i) => ({ c, i }))
        .filter((x) => x.i !== narrow && x.c.rooms.length < 2)
        .sort((a, b) => a.c.area - b.c.area)[0];
      if (!other) break;
      const merged = { rooms: [...cols[narrow].rooms, ...other.c.rooms], area: cols[narrow].area + other.c.area };
      cols = cols.filter((_, i) => i !== narrow && i !== other.i);
      cols.push(merged);
    }
    const sumA = cols.reduce((a, c) => a + c.area, 0);
    const out = [];
    let x = 0;
    cols.forEach((c, ci) => {
      const w = ci === cols.length - 1 ? W - x : snap((c.area / sumA) * W, 0.25);
      if (c.rooms.length === 1) {
        out.push({ ...c.rooms[0], x, y: y0, w, l: h });
      } else {
        /* Давхарласан хос: төвд ойр байх шаардлагатай нь төв рүүгээ */
        const sorted = [...c.rooms].sort((a, b) => hubNeed(a.type) - hubNeed(b.type));
        const [near, far] = sorted;
        const nearH = snap(h * (near.area / (near.area + far.area)), 0.25);
        const farH = h - nearH;
        if (hubBelow) {
          out.push({ ...far, x, y: y0, w, l: farH });
          out.push({ ...near, x, y: y0 + farH, w, l: nearH });
        } else {
          out.push({ ...near, x, y: y0, w, l: nearH });
          out.push({ ...far, x, y: y0 + nearH, w, l: farH });
        }
      }
      x += w;
    });
    return out;
  };

  const boxes = [
    ...layoutBand(top, 0, topH, true),                  // дээд бүлэг — нуруу доор нь
    { ...hub, x: 0, y: topH, w: W, l: hubH },           // нуруу (төв өрөө)
    ...layoutBand(bot, topH + hubH, botH, false),       // доод бүлэг — нуруу дээр нь
  ];

  return { W, L: Ltot, boxes: boxes.filter((b) => b.w >= 1.0 && b.l >= 1.0) };
}

/* ---------- 3. Хаалга, цонх — хөл хөдөлгөөний зохион байгуулалттай ----------
   Зарчим:
   1) Хоёр өрөөний хана нийтлэг хэсэгтэй бол хаалга тавьж болно (≥0.9м)
   2) Төв өрөө (коридор → зочны → хамгийн том) сонгоно
   3) Төвөөс эхлээд БҮХ өрөө рүү мод (spanning tree) байгуулна —
      унтлага, угаалгаар дамжин өнгөрөхөөс зайлсхийж жинлэнэ
   4) Орох хаалга төв өрөөний гадна хананд, гаражид өөрийн хаалга
   -------------------------------------------------------------- */

const MIN_DOOR = 0.9;      // хаалга багтах хамгийн бага нийтлэг урт
const EPS = 0.02;

/* Өрөөний ирмэг: 0=дээд, 1=баруун, 2=доод, 3=зүүн */
function edgeOf(box, side) { return { 0: 0, 1: 1, 2: 2, 3: 3 }[side]; }

/* Хоёр тэгш өнцөгтийн нийтлэг ханыг олно */
function sharedWall(a, b) {
  // a-ийн баруун тал = b-ийн зүүн тал
  if (Math.abs(a.x + a.w - b.x) < EPS) {
    const lo = Math.max(a.y, b.y), hi = Math.min(a.y + a.l, b.y + b.l);
    if (hi - lo >= MIN_DOOR) return { axis: "v", aEdge: 1, bEdge: 3, lo, hi, pos: a.x + a.w };
  }
  // a-ийн зүүн тал = b-ийн баруун тал
  if (Math.abs(a.x - (b.x + b.w)) < EPS) {
    const lo = Math.max(a.y, b.y), hi = Math.min(a.y + a.l, b.y + b.l);
    if (hi - lo >= MIN_DOOR) return { axis: "v", aEdge: 3, bEdge: 1, lo, hi, pos: a.x };
  }
  // a-ийн доод тал = b-ийн дээд тал
  if (Math.abs(a.y + a.l - b.y) < EPS) {
    const lo = Math.max(a.x, b.x), hi = Math.min(a.x + a.w, b.x + b.w);
    if (hi - lo >= MIN_DOOR) return { axis: "h", aEdge: 2, bEdge: 0, lo, hi, pos: a.y + a.l };
  }
  // a-ийн дээд тал = b-ийн доод тал
  if (Math.abs(a.y - (b.y + b.l)) < EPS) {
    const lo = Math.max(a.x, b.x), hi = Math.min(a.x + a.w, b.x + b.w);
    if (hi - lo >= MIN_DOOR) return { axis: "h", aEdge: 0, bEdge: 2, lo, hi, pos: a.y };
  }
  return null;
}

/* Дамжин өнгөрөхөд тохиромжтой байдал — бага нь дээр */
const PASS_COST = { hall: 0, living: 1, kitchen: 3, work: 4, storage: 5, garage: 7, bed: 9, bath: 12 };
const passCost = (t) => PASS_COST[t] ?? 5;

/* Ирмэг дээрх байрлалыг t (0..1) болгож хөрвүүлэх */
function tOnEdge(box, edge, coord) {
  switch (edge) {
    case 0: return (coord - box.x) / box.w;              // дээд: зүүнээс баруун
    case 1: return (coord - box.y) / box.l;              // баруун: дээрээс доош
    case 2: return (box.x + box.w - coord) / box.w;      // доод: баруунаас зүүн
    case 3: return (box.y + box.l - coord) / box.l;      // зүүн: доороос дээш
    default: return 0.5;
  }
}

function buildRooms(layout) {
  const { W, L, boxes } = layout;
  const n = boxes.length;
  const openings = boxes.map(() => []);
  const hasDoor = boxes.map(() => false);   // нийтлэг хана дээрх хаалга 2 өрөөнд хоёуланд нь тооцогдоно

  /* --- Зэргэлдээ байдлын граф --- */
  const adj = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sw = sharedWall(boxes[i], boxes[j]);
      if (sw) adj.push({ i, j, sw });
    }
  }

  /* --- Төв өрөө сонгох: коридор → зочны → хамгийн том --- */
  const byType = (t) => boxes.findIndex((b) => b.type === t);
  let hub = byType("hall");
  if (hub < 0) hub = byType("living");
  if (hub < 0) hub = boxes.reduce((best, b, i) => (b.w * b.l > boxes[best].w * boxes[best].l ? i : best), 0);

  /* --- Dijkstra: төвөөс өрөө бүр рүү хамгийн бага "хувийн өрөөгөөр дамжих"
         зардалтай зам. Ингэснээр унтлага, угаалгаар дамжин өнгөрөхөөс зайлсхийнэ. --- */
  const INF = Infinity;
  const dist = boxes.map(() => INF);
  const via = boxes.map(() => null);       // тухайн өрөө рүү ирсэн ирмэг
  dist[hub] = 0;
  const done = new Set();
  while (done.size < n) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done.has(i) && dist[i] < INF && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break;                       // үлдсэн өрөөнүүд холбогдох боломжгүй
    done.add(u);
    adj.forEach((e) => {
      const v = e.i === u ? e.j : (e.j === u ? e.i : -1);
      if (v < 0 || done.has(v)) return;
      /* u-гаар дамжих зардал: u хэр "хувийн" вэ + өргөн хаалга бага зэрэг урамшуулна */
      const step = passCost(boxes[u].type) - (e.sw.hi - e.sw.lo) * 0.05;
      if (dist[u] + step < dist[v]) { dist[v] = dist[u] + step; via[v] = e; }
    });
  }
  const treeEdges = via.filter(Boolean);

  /* --- Дотор хаалгуудыг нийтлэг ханын ГОЛД тавина --- */
  treeEdges.forEach((e) => {
    const { sw } = e;
    const w = Math.min(0.9, (sw.hi - sw.lo) * 0.8);
    const mid = (sw.lo + sw.hi) / 2;
    const a = boxes[e.i], b = boxes[e.j];
    openings[e.i].push({
      id: uid(), type: "door", edge: sw.aEdge,
      t: Math.min(0.9, Math.max(0.1, tOnEdge(a, sw.aEdge, mid))),
      w, h: 2.1, to: e.j,
    });
    hasDoor[e.i] = true; hasDoor[e.j] = true;
  });

  /* --- Гадна ирмэгүүд --- */
  const outerEdges = (b) => {
    const list = [];
    if (Math.abs(b.y) < EPS) list.push({ edge: 0, len: b.w, mid: b.x + b.w / 2 });
    if (Math.abs(b.x + b.w - W) < EPS) list.push({ edge: 1, len: b.l, mid: b.y + b.l / 2 });
    if (Math.abs(b.y + b.l - L) < EPS) list.push({ edge: 2, len: b.w, mid: b.x + b.w / 2 });
    if (Math.abs(b.x) < EPS) list.push({ edge: 3, len: b.l, mid: b.y + b.l / 2 });
    return list.sort((p, q) => q.len - p.len);
  };

  /* --- Орох хаалга: төв өрөөний хамгийн урт гадна хананд --- */
  const hubOuter = outerEdges(boxes[hub]);
  let entryEdge = null;
  if (hubOuter.length) {
    entryEdge = hubOuter[0];
    openings[hub].push({
      id: uid(), type: "door", edge: entryEdge.edge, t: 0.5,
      w: Math.min(1.0, entryEdge.len * 0.7), h: 2.1, entry: true,
    });
    hasDoor[hub] = true;
  } else {
    /* Төв нь гадна хананд хүрэхгүй бол гадна хананд хүрдэг хамгийн ойрын өрөөнд */
    const alt = boxes.findIndex((b) => outerEdges(b).length > 0);
    if (alt >= 0) {
      const oe = outerEdges(boxes[alt])[0];
      openings[alt].push({ id: uid(), type: "door", edge: oe.edge, t: 0.5, w: Math.min(1.0, oe.len * 0.7), h: 2.1, entry: true });
      hasDoor[alt] = true;
    }
  }

  /* --- Гараж: өөрийн гадна хаалгатай --- */
  boxes.forEach((b, i) => {
    if (b.type !== "garage") return;
    const oe = outerEdges(b);
    if (!oe.length) return;
    openings[i].push({
      id: uid(), type: "door", edge: oe[0].edge, t: 0.5,
      w: Math.min(2.6, oe[0].len * 0.8), h: 2.2, entry: true,
    });
    hasDoor[i] = true;
  });

  /* --- Холбогдож чадаагүй өрөө: гадна хаалга өгнө --- */
  boxes.forEach((b, i) => {
    if (hasDoor[i]) return;
    const oe = outerEdges(b);
    if (oe.length) {
      openings[i].push({ id: uid(), type: "door", edge: oe[0].edge, t: 0.5, w: 0.9, h: 2.1, entry: true });
      hasDoor[i] = true;
    }
  });

  /* --- Цонх: гадна хананд, хаалгатай мөргөлдөхгүй --- */
  boxes.forEach((b, i) => {
    if (["bath", "storage", "garage"].includes(b.type)) return;
    const oe = outerEdges(b).filter((e) => e.len > 1.4);
    if (!oe.length) return;
    /* Тухайн ирмэг дээр хаалга байвал t-г зөрүүлнэ */
    const target = oe[0];
    const doorSame = openings[i].find((o) => o.type === "door" && o.edge === target.edge);
    openings[i].push({
      id: uid(), type: "win", edge: target.edge,
      t: doorSame ? 0.78 : 0.5,
      w: Math.min(1.5, target.len * (doorSame ? 0.3 : 0.5)), h: 1.4,
    });
  });

  /* --- Эцсийн өрөөнүүд --- */
  return boxes.map((b, i) => ({
    id: "r" + Date.now() + i,
    name: b.name || `Өрөө ${i + 1}`,
    points: [
      { x: b.x, y: b.y }, { x: b.x + b.w, y: b.y },
      { x: b.x + b.w, y: b.y + b.l }, { x: b.x, y: b.y + b.l },
    ],
    openings: openings[i],
    wallKind: "ext",
  }));
}

export function programToProject(program) {
  const layout = layoutRooms(program);
  return {
    rooms: buildRooms(layout),
    settings: { floors: 1, wallH: 2.7 },
    _meta: { W: layout.W, L: layout.L },
  };
}

/* Тест, шалгалтад ашиглана */
export const _internals = { sharedWall, buildRooms, MIN_DOOR };

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
