import { useState } from "react";
import { createPortal } from "react-dom";

/* ============================================================
   ХӨТӨЧ — Бэлэн байшингийн загварууд
   Хэрэглэгч загвар сонгоход тооцоолуурт өрөөнүүд бүрэн зурагдаж
   ирнэ — дараа нь хэмжээ, материалаа өөрчилж төсвөө гаргана.
   <TemplateGallery onApply={(data)=>...} /> — Орон сууц зурах таб дээр
   ============================================================ */

const R = (x, y, w, l) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + l }, { x, y: y + l }];
const win = (id, edge, t, w = 1.2) => ({ id, type: "win", edge, t, w, h: 1.4 });
const door = (id, edge, t, w = 0.9) => ({ id, type: "door", edge, t, w, h: 2.1 });

export const HOUSE_TEMPLATES = [
  {
    id: "t63",
    name: "Амины сууц 63м²",
    desc: "3 өрөө, гал тогоо, угаалгын өрөө — хамгийн түгээмэл",
    area: 63,
    rooms: [
      { id: "r1", name: "Унтлагын өрөө", points: R(0, 0, 4, 4), openings: [win("o1", 0, 0.5), door("o2", 2, 0.5)] },
      { id: "r2", name: "Зочны өрөө", points: R(4, 0, 5, 4), openings: [win("o3", 0, 0.33), win("o4", 0, 0.67), door("o5", 2, 0.5)] },
      { id: "r3", name: "Гал тогоо", points: R(0, 4, 4, 3), openings: [win("o6", 2, 0.5), door("o7", 0, 0.5)] },
      { id: "r4", name: "Угаалгын өрөө", points: R(4, 4, 3, 3), openings: [door("o8", 0, 0.5, 0.8)] },
      { id: "r5", name: "Коридор", points: R(7, 4, 2, 3), openings: [door("o9", 2, 0.5, 1.0)] },
    ],
    settings: { floors: 1, wallHeight: 2.7 },
  },
  {
    id: "t36",
    name: "Зуслангийн байшин 36м²",
    desc: "6×6 — унтлага + том өрөө, хямд хурдан баригдана",
    area: 36,
    rooms: [
      { id: "r1", name: "Унтлагын өрөө", points: R(0, 0, 3, 3.5), openings: [win("o1", 0, 0.5), door("o2", 1, 0.5)] },
      { id: "r2", name: "Үндсэн өрөө", points: R(3, 0, 3, 6), openings: [win("o3", 0, 0.5), win("o4", 1, 0.5), door("o5", 2, 0.5, 1.0)] },
      { id: "r3", name: "Агуулах / угаалга", points: R(0, 3.5, 3, 2.5), openings: [door("o6", 1, 0.5, 0.8)] },
    ],
    settings: { floors: 1, wallHeight: 2.5 },
  },
  {
    id: "tgarage",
    name: "Гараж 24м²",
    desc: "4×6 — 1 машины гараж, агуулахтай",
    area: 24,
    rooms: [
      { id: "r1", name: "Гараж", points: R(0, 0, 4, 6), openings: [{ id: "o1", type: "door", edge: 0, t: 0.5, w: 2.6, h: 2.2 }, win("o2", 1, 0.5, 0.8)] },
    ],
    settings: { floors: 1, wallHeight: 2.6 },
  },
  {
    id: "t48",
    name: "2 өрөө сууц 48м²",
    desc: "6×8 — залуу гэр бүлд тохиромжтой",
    area: 48,
    rooms: [
      { id: "r1", name: "Унтлагын өрөө", points: R(0, 0, 3.5, 4), openings: [win("o1", 0, 0.5), door("o2", 2, 0.5)] },
      { id: "r2", name: "Зочны өрөө + гал тогоо", points: R(3.5, 0, 4.5, 5), openings: [win("o3", 0, 0.5), win("o4", 1, 0.4), door("o5", 2, 0.7, 1.0)] },
      { id: "r3", name: "Угаалгын өрөө", points: R(0, 4, 2, 4), openings: [door("o6", 1, 0.5, 0.8)] },
      { id: "r4", name: "Коридор", points: R(2, 4, 1.5, 4), openings: [door("o7", 2, 0.5, 1.0)] },
      { id: "r5", name: "Хувцасны өрөө", points: R(3.5, 5, 4.5, 3), openings: [door("o8", 0, 0.2, 0.8), win("o9", 2, 0.5)] },
    ],
    settings: { floors: 1, wallHeight: 2.7 },
  },
  {
    id: "t100",
    name: "Том сууц 100м²",
    desc: "10×10 — 3 унтлага, том зочны өрөө",
    area: 100,
    rooms: [
      { id: "r1", name: "Унтлага 1", points: R(0, 0, 4, 4), openings: [win("o1", 0, 0.5), door("o2", 2, 0.5)] },
      { id: "r2", name: "Унтлага 2", points: R(0, 4, 4, 3), openings: [win("o3", 3, 0.5), door("o4", 1, 0.5)] },
      { id: "r3", name: "Унтлага 3", points: R(0, 7, 4, 3), openings: [win("o5", 3, 0.5), door("o6", 1, 0.5)] },
      { id: "r4", name: "Зочны өрөө", points: R(4, 0, 6, 6), openings: [win("o7", 0, 0.3), win("o8", 0, 0.7), win("o9", 1, 0.5), door("o10", 2, 0.5, 1.0)] },
      { id: "r5", name: "Гал тогоо", points: R(4, 6, 3.5, 4), openings: [win("o11", 2, 0.5), door("o12", 0, 0.5)] },
      { id: "r6", name: "Угаалга + коридор", points: R(7.5, 6, 2.5, 4), openings: [door("o13", 2, 0.5, 1.0)] },
    ],
    settings: { floors: 1, wallHeight: 2.8 },
  },
  {
    id: "tshop",
    name: "Дэлгүүр / үйлчилгээ 40м²",
    desc: "5×8 — худалдааны танхим, агуулахтай",
    area: 40,
    rooms: [
      { id: "r1", name: "Худалдааны танхим", points: R(0, 0, 5, 5.5), openings: [{ id: "o1", type: "door", edge: 0, t: 0.5, w: 1.4, h: 2.2 }, win("o2", 0, 0.15, 1.6), win("o3", 0, 0.85, 1.6)] },
      { id: "r2", name: "Агуулах", points: R(0, 5.5, 3, 2.5), openings: [door("o4", 0, 0.5)] },
      { id: "r3", name: "Ажилтны өрөө", points: R(3, 5.5, 2, 2.5), openings: [door("o5", 0, 0.5, 0.8)] },
    ],
    settings: { floors: 1, wallHeight: 3.0 },
  },
];

/* Жижиг SVG урьдчилсан харагдац — өрөөнүүдийг polygon-оор зурна */
function MiniPlan({ rooms }) {
  const COLORS = ["#fdba74", "#93c5fd", "#86efac", "#fca5a5", "#d8b4fe", "#fde047"];
  const allPts = rooms.flatMap((r) => r.points);
  const maxX = Math.max(...allPts.map((p) => p.x));
  const maxY = Math.max(...allPts.map((p) => p.y));
  const W = 130, H = 96, pad = 6;
  const s = Math.min((W - pad * 2) / maxX, (H - pad * 2) / maxY);
  return (
    <svg width={W} height={H} className="rounded-lg bg-stone-50">
      {rooms.map((r, i) => (
        <polygon key={r.id}
          points={r.points.map((p) => `${pad + p.x * s},${pad + p.y * s}`).join(" ")}
          fill={COLORS[i % COLORS.length]} fillOpacity="0.55" stroke="#78716c" strokeWidth="1" />
      ))}
    </svg>
  );
}

export default function TemplateGallery({ onApply }) {
  const [open, setOpen] = useState(false);

  const apply = (tpl) => {
    // Гүн хуулбар — загварыг өөрчлөхөд эх загвар эвдрэхгүй
    onApply(JSON.parse(JSON.stringify({ rooms: tpl.rooms, settings: tpl.settings })));
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="rounded-lg border border-orange-600 px-2.5 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-50">
        🏠 Бэлэн загвар
      </button>
      {open && createPortal(
        <div className="flex items-center justify-center bg-black/50 p-4"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647, overflowY: "auto" }}
          onClick={() => setOpen(false)}>
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-stone-900">🏠 Бэлэн байшингийн загварууд</h3>
                <p className="text-xs text-stone-500">Загвар сонгоход төлөвлөгөө бүрэн зурагдана — дараа нь хэмжээ, материалаа өөрчилж болно</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100">✕</button>
            </div>
            <div className="grid max-h-[70vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {HOUSE_TEMPLATES.map((tpl) => (
                <button key={tpl.id} onClick={() => apply(tpl)}
                  className="group rounded-2xl border border-stone-200 p-3 text-left transition hover:border-orange-500 hover:shadow-md">
                  <MiniPlan rooms={tpl.rooms} />
                  <div className="mt-2 text-sm font-bold text-stone-800 group-hover:text-orange-700">{tpl.name}</div>
                  <div className="text-[11px] leading-snug text-stone-500">{tpl.desc}</div>
                  <div className="mt-1 text-[10px] font-mono text-stone-400">{tpl.rooms.length} өрөө · ~{tpl.area}м²</div>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              ⚠️ Загвар сонгоход одоогийн зурсан төлөвлөгөө солигдоно. Хадгалаагүй бол эхлээд ☁️ Миний төслүүд эсвэл 💾 JSON-оор хадгалаарай.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
