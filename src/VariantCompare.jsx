import { useEffect, useMemo, useState } from "react";

/* ============================================================
   ХӨТӨЧ — Хувилбар харьцуулах ("Төсөв" таб)
   Нэг планыг өөр өөр материалын сонголтоор (жишээ нь блок vs мод,
   10 vs 15см дулаалга) 3 хүртэл хувилбар болгон хадгалж, нийт төсөв,
   жилийн халаалт, 10 жилийн нийт өртгийг зэрэгцүүлнэ.
   Хувилбарууд зөвхөн тухайн хөтөч дээр (localStorage) хадгалагдана.
   ============================================================ */

const STORE_KEY = "hutuch_variants_v1";
const MAX_VARIANTS = 3;
const YEARS = 10;

const tg = (v) => Math.round(v).toLocaleString("en-US") + "₮";

function loadVariants() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => x && x.selections).slice(0, MAX_VARIANTS) : [];
  } catch { return []; }
}

function optName(sys, id) {
  return (sys.options.find((o) => o.id === id) || sys.options[0]).name;
}

export default function VariantCompare({ systems, selections, floorArea, calcBudget, calcHeating, onApply }) {
  const [variants, setVariants] = useState(loadVariants);
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(variants)); } catch { /* хадгалах боломжгүй */ }
  }, [variants]);

  const cols = useMemo(() => [
    { id: "cur", name: "Одоогийн", selections, current: true },
    ...variants,
  ].map((c) => {
    const b = calcBudget(c.selections);
    const heat = calcHeating(c.selections);
    return { ...c, ...b, heat, life: heat != null ? b.grand + heat * YEARS : null };
  }), [variants, selections, calcBudget, calcHeating]);

  const saveCurrent = () => {
    if (variants.length >= MAX_VARIANTS) return;
    const letter = "ABC"[variants.length] || String(variants.length + 1);
    setVariants((v) => [...v, { id: Date.now().toString(36), name: `Хувилбар ${letter}`, selections: { ...selections } }]);
  };
  const rename = (id, name) => setVariants((v) => v.map((x) => (x.id === id ? { ...x, name } : x)));
  const remove = (id) => setVariants((v) => v.filter((x) => x.id !== id));

  // Хувилбаруудын хооронд ялгаатай системүүд л харагдана
  const diffSystems = systems.filter((sys) => new Set(cols.map((c) => c.selections[sys.comp] ?? sys.options[0].id)).size > 1);

  const minOf = (k) => {
    const vals = cols.map((c) => c[k]).filter((x) => x != null);
    return vals.length > 1 ? Math.min(...vals) : null;
  };
  const best = { grand: minOf("grand"), heat: minOf("heat"), life: minOf("life") };
  const base = cols[0];

  const cell = (c, k, sub) => {
    const v = c[k];
    if (v == null) return <td key={c.id} className="px-3 py-2 text-right font-mono text-stone-400">—</td>;
    const isBest = best[k] != null && v === best[k];
    const d = !c.current && base[k] != null ? v - base[k] : null;
    return (
      <td key={c.id} className={`px-3 py-2 text-right font-mono ${isBest ? "bg-emerald-50 font-bold text-emerald-700" : ""}`}>
        {tg(v)}{sub}
        {d != null && Math.round(d) !== 0 && (
          <div className={`text-[10px] ${d < 0 ? "text-emerald-600" : "text-red-600"}`}>{d > 0 ? "+" : "−"}{tg(Math.abs(d))}</div>
        )}
      </td>
    );
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-stone-600">⚖️ Хувилбар харьцуулах</h3>
          <p className="text-[11px] text-stone-500">
            Материалаа сонгоод «Хадгалах» дарна. Дараа нь өөр материал сонгоход «Одоогийн» багана шинэчлэгдэж, хадгалсан хувилбартай зэрэгцэнэ.
          </p>
        </div>
        <button onClick={saveCurrent} disabled={variants.length >= MAX_VARIANTS}
          className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300">
          ＋ Одоогийнхыг хадгалах ({variants.length}/{MAX_VARIANTS})
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
          Хадгалсан хувилбар алга. Жишээ нь: одоогийн сонголтоо хадгалаад, «Материал» табд ханаа модоор сольж ирээд харьцуулна уу.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b-2 border-stone-300 text-left text-[11px] uppercase tracking-wide text-stone-500">
                <th className="px-3 py-2"></th>
                {cols.map((c) => (
                  <th key={c.id} className="px-3 py-2 text-right align-top">
                    {c.current ? <span className="text-orange-700">{c.name}</span> : (
                      <div className="flex flex-col items-end gap-1">
                        <input value={c.name} onChange={(e) => rename(c.id, e.target.value)} maxLength={30}
                          className="w-32 rounded border border-stone-200 px-1.5 py-0.5 text-right text-xs font-bold normal-case text-stone-700 focus:border-orange-500 focus:outline-none" />
                        <div className="flex gap-2 normal-case">
                          <button onClick={() => onApply(c.selections)} className="text-[11px] font-medium text-orange-700 hover:underline">↺ Ачаалах</button>
                          <button onClick={() => remove(c.id)} className="text-[11px] text-stone-400 hover:text-red-600">✕ Устгах</button>
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-100">
                <td className="px-3 py-2 font-medium">Нийт төсөв</td>
                {cols.map((c) => cell(c, "grand"))}
              </tr>
              <tr className="border-b border-stone-100 text-stone-600">
                <td className="px-3 py-2">1м² өртөг</td>
                {cols.map((c) => <td key={c.id} className="px-3 py-2 text-right font-mono">{floorArea > 0 ? tg(c.grand / floorArea) : "—"}</td>)}
              </tr>
              <tr className="border-b border-stone-100 text-stone-600">
                <td className="px-3 py-2">Материал / Ажлын хөлс</td>
                {cols.map((c) => <td key={c.id} className="px-3 py-2 text-right font-mono text-xs">{tg(c.material)}<br />{tg(c.labor)}</td>)}
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-3 py-2 font-medium">Жилийн халаалт</td>
                {cols.map((c) => cell(c, "heat", "/жил"))}
              </tr>
              <tr className="border-b-2 border-stone-300">
                <td className="px-3 py-2 font-medium">{YEARS} жилийн нийт өртөг<div className="text-[10px] font-normal text-stone-400">төсөв + {YEARS} жилийн халаалт</div></td>
                {cols.map((c) => cell(c, "life"))}
              </tr>
              {diffSystems.map((sys) => (
                <tr key={sys.comp} className="border-b border-stone-100 text-xs text-stone-600">
                  <td className="px-3 py-1.5">{sys.icon} {sys.label}</td>
                  {cols.map((c) => <td key={c.id} className="px-3 py-1.5 text-right">{optName(sys, c.selections[sys.comp])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {diffSystems.length === 0 && (
            <p className="mt-2 text-[11px] text-stone-400">Хувилбаруудын материалын сонголт ижил байна — «Материал» табд өөр сонголт хийж үзээрэй.</p>
          )}
          <p className="mt-2 text-[11px] text-stone-400">
            Хамгийн бага дүн ногооноор тодорно. Халаалтыг доорх «Жилийн халаалтын зардал» хэсгийн тохиргоогоор тооцно. Хувилбарууд зөвхөн энэ хөтөч дээр хадгалагдана.
          </p>
        </div>
      )}
    </div>
  );
}
