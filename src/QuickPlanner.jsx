import { useState, useMemo } from "react";
import {
  SYSTEMS, COMMON_ITEMS,
  DEFAULT_NORMS, DEFAULT_PRICES, DEFAULT_LABOR,
  DEFAULT_SETTINGS, DEFAULT_SELECTIONS, DEFAULT_MEP,
  computeGeometry, rateOf, rect, fmt, fmtT,
} from "./BuildEstimator.jsx";

/* ============================================================
   ХӨТӨЧ — Хурдан Төлөвлөгч (Quick Planner)
   Энгийн хэрэглэгчид зориулсан 2 минутын урьдчилсан тооцоо.
   Тооцооллын хөдөлгүүр нь Нарийвчилсан тооцоолууртай (BuildEstimator)
   НЭГ — норм, үнэ нэг эх сурвалжаас тул хоёр хэсэг хэзээ ч зөрөхгүй.
   «Нарийвчилсан руу шилжих» товч оруулсан мэдээллийг бүрэн
   төсөл болгон хөрвүүлж дамжуулна.
   ============================================================ */

/* Хурдан горимд харуулах гол сонголтууд — бусад нь стандарт утгаараа */
const QUICK_COMPS = ["extWall", "insulation", "roof", "floor", "heating"];

let _qid = 100;
const qid = () => `q${_qid++}`;

/* Оруулсан хэмжээнээс нарийвчилсан тооцоолуурын бүрэн төсөл үүсгэх */
function buildProject(dims, floors, winCount, doorCount) {
  const w = Math.max(2, dims.w), l = Math.max(2, dims.l);
  const openings = [];
  for (let k = 0; k < winCount; k++)
    openings.push({ id: qid(), type: "win", edge: 0, t: (k + 1) / (winCount + 1), w: 1.2, h: 1.4 });
  for (let k = 0; k < doorCount; k++)
    openings.push({ id: qid(), type: "door", edge: 2, t: (k + 1) / (doorCount + 1), w: 0.9, h: 2.1 });
  const rooms = [{ id: qid(), name: "Барилга", points: rect(0, 0, w, l), openings }];
  const settings = { ...DEFAULT_SETTINGS, floors };
  const area = w * l * floors;
  const roomsEq = Math.max(2, Math.round((w * l) / 16)); // өрөөний тэнцвэржүүлсэн тоо
  const mep = {
    ...DEFAULT_MEP,
    sockets: roomsEq * 4 * floors,
    switches: roomsEq * floors,
    lights: (roomsEq + Math.ceil((w * l) / 20)) * floors,
    sinks: Math.max(2, Math.round(floors * 1.5)),
    toilets: Math.max(1, floors),
    showers: Math.max(1, floors),
    radiators: Math.ceil(area / 12),
  };
  return { rooms, settings, mep };
}

export default function QuickPlanner({ onBack, template, onAdvanced }) {
  const [dims, setDims] = useState(template?.dims ? { l: template.dims.l, w: template.dims.w } : { l: 8, w: 6 });
  const [floors, setFloors] = useState(template?.floors || 1);
  const [winCount, setWinCount] = useState(4);
  const [doorCount, setDoorCount] = useState(2);
  const [selections, setSelections] = useState(DEFAULT_SELECTIONS);

  const project = useMemo(() => buildProject(dims, floors, winCount, doorCount), [dims, floors, winCount, doorCount]);

  const geo = useMemo(() => {
    const g = computeGeometry(project.rooms, project.settings);
    return g ? { ...g, mep: project.mep } : null;
  }, [project]);

  /* Нарийвчилсан тооцоолууртай яг ижил хөдөлгүүрээр бодно */
  const { lines, sections } = useMemo(() => {
    if (!geo) return { lines: [], sections: [] };
    const s = project.settings;
    const mk = (d, group) => {
      const qty = d.qty(geo, s, DEFAULT_NORMS[d.key]);
      const hours = qty * (DEFAULT_LABOR[d.key] ?? 0);
      return { ...d, group, qty, total: qty * DEFAULT_PRICES[d.key], hours, laborCost: hours * rateOf(s, d.cat) };
    };
    const out = [];
    const secs = [];
    SYSTEMS.forEach((sys) => {
      const opt = sys.options.find((o) => o.id === selections[sys.comp]) || sys.options[0];
      const items = opt.items.map((d) => mk(d, sys.label));
      out.push(...items);
      const tot = items.reduce((a, x) => a + x.total + x.laborCost, 0);
      if (tot > 0) secs.push({ label: `${sys.icon} ${sys.label}`, opt: opt.name, total: tot });
    });
    const common = COMMON_ITEMS.map((d) => mk(d, "Дотор засал"));
    out.push(...common);
    const ct = common.reduce((a, x) => a + x.total + x.laborCost, 0);
    if (ct > 0) secs.push({ label: "🖌 Дотор засал", opt: "", total: ct });
    return { lines: out, sections: secs.sort((a, b) => b.total - a.total) };
  }, [geo, project, selections]);

  const s = project.settings;
  const materialTotal = lines.reduce((a, l) => a + l.total, 0);
  const laborTotal = lines.reduce((a, l) => a + l.laborCost, 0);
  const totalHours = lines.reduce((a, l) => a + l.hours, 0);
  const ndsh = laborTotal * s.ndshPct / 100;
  const transport = materialTotal * s.transportPct / 100;
  const subtotal = materialTotal + laborTotal + ndsh + transport;
  const grand = subtotal * (1 + s.vatPct / 100);
  const workDays = totalHours / (s.crewSize * 8);
  const maxSec = sections.length ? sections[0].total : 1;

  const numInput = (val, set, min = 1, step = 1) => (
    <input type="number" value={val} min={min} step={step}
      onChange={(e) => set(Math.max(min, parseFloat(e.target.value) || min))}
      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none" />
  );

  return (
    <div className="py-6">
      {/* Толгой */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200">←</button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Хурдан төлөвлөгч</h1>
            <p className="text-xs text-slate-500">2 минутын урьдчилсан тооцоо · Нарийвчилсан тооцоолууртай нэг норм, үнэ</p>
          </div>
        </div>
        <button
          onClick={() => onAdvanced && onAdvanced({ rooms: project.rooms, settings: project.settings, selections, mep: project.mep })}
          className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-orange-700">
          Нарийвчилсан тооцоолуур руу →
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* ---------- Оруулга ---------- */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">📐 Хэмжээ</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-[11px] font-medium text-slate-500">Урт (м)</span>{numInput(dims.l, (v) => setDims((d) => ({ ...d, l: v })), 2, 0.5)}</label>
              <label className="block"><span className="mb-1 block text-[11px] font-medium text-slate-500">Өргөн (м)</span>{numInput(dims.w, (v) => setDims((d) => ({ ...d, w: v })), 2, 0.5)}</label>
              <label className="block"><span className="mb-1 block text-[11px] font-medium text-slate-500">Давхар</span>{numInput(floors, (v) => setFloors(Math.round(v)), 1)}</label>
              <div className="flex items-end pb-2 text-sm font-bold text-orange-600">{fmt(dims.l * dims.w * floors)}м²</div>
              <label className="block"><span className="mb-1 block text-[11px] font-medium text-slate-500">🪟 Цонх (ш)</span>{numInput(winCount, (v) => setWinCount(Math.round(v)), 0)}</label>
              <label className="block"><span className="mb-1 block text-[11px] font-medium text-slate-500">🚪 Хаалга (ш)</span>{numInput(doorCount, (v) => setDoorCount(Math.round(v)), 1)}</label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">🧩 Гол материалууд</h3>
            <div className="space-y-3">
              {SYSTEMS.filter((sys) => QUICK_COMPS.includes(sys.comp)).map((sys) => (
                <label key={sys.comp} className="block">
                  <span className="mb-1 block text-[11px] font-medium text-slate-500">{sys.icon} {sys.label}</span>
                  <select value={selections[sys.comp]}
                    onChange={(e) => setSelections((sel) => ({ ...sel, [sys.comp]: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none">
                    {sys.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-snug text-slate-400">Суурь, дотор хана, өнгөлгөө, тааз, цонх-хаалга, цахилгаан, сантехник стандарт сонголтоор орсон — нарийвчилсан тооцоолуур дээр бүгдийг өөрчилнө.</p>
          </div>
        </div>

        {/* ---------- Үр дүн ---------- */}
        <div className="space-y-4">
          {geo && (
            <>
              <div className="rounded-2xl bg-slate-900 dark:bg-slate-800 p-6 text-white shadow-lg">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Урьдчилсан төсөв (±10%)</div>
                <div className="mt-1 font-mono text-3xl font-black text-orange-400">
                  {fmt(grand * 0.9 / 1e6, 1)} — {fmt(grand * 1.1 / 1e6, 1)} сая ₮
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-700 pt-3 font-mono text-sm">
                  <div><div className="text-[10px] uppercase text-slate-400">1м² өртөг</div>≈ {fmtT(grand / geo.floorArea)}</div>
                  <div><div className="text-[10px] uppercase text-slate-400">Хугацаа</div>≈ {fmt(workDays, 0)} өдөр ({s.crewSize} хүн)</div>
                  <div><div className="text-[10px] uppercase text-slate-400">Хөдөлмөр</div>{fmt(totalHours, 0)} хүн/цаг</div>
                </div>
                <p className="mt-3 text-[10px] leading-snug text-slate-400">Урьдчилсан тооцоо — материалын зах зээлийн үнэ, газрын нөхцөлөөс хамаарч өөрчлөгдөнө. Нарийвчилсан тооцоолуур дээр өрөө зурж, норм үнээ тохируулбал илүү нарийн гарна.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Зардлын задаргаа</h3>
                <div className="space-y-2">
                  {sections.map((sec) => (
                    <div key={sec.label}>
                      <div className="mb-0.5 flex items-baseline justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{sec.label}
                          {sec.opt && <span className="ml-2 text-[10px] text-slate-400">{sec.opt}</span>}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{fmtT(sec.total)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(2, sec.total / maxSec * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-sm sm:grid-cols-4">
                  {[["Материал", materialTotal], ["Ажлын хөлс", laborTotal], ["НДШ + тээвэр", ndsh + transport], ["НӨАТ", grand - subtotal]].map(([k, v]) => (
                    <div key={k}><div className="text-[10px] uppercase text-slate-400">{k}</div><div className="font-mono font-bold text-slate-800 dark:text-slate-100">{fmtT(v)}</div></div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onAdvanced && onAdvanced({ rooms: project.rooms, settings: project.settings, selections, mep: project.mep })}
                className="w-full rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/30 px-4 py-4 text-left transition hover:border-orange-500 hover:bg-orange-100">
                <div className="text-sm font-bold text-orange-700 dark:text-orange-400">Илүү нарийн тооцоо хэрэгтэй юу? →</div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Энэ хэмжээ, сонголтууд чинь нарийвчилсан тооцоолуур руу шууд орно — тэнд өрөөгөө зурж, хаалга цонхоо байрлуулж, 3D-ээр харж, норм үнээ тохируулаад төсвийн маягт хэвлэнэ.</div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
