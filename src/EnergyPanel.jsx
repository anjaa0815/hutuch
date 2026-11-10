import { useMemo } from "react";
import { estimateHeating, ROOF_U, ENERGY_DEFAULTS, CEILING_INSULATION_U, CEILING_INSULATION_LABEL, HDD_ZONES } from "./energyEstimate.js";

/* ============================================================
   ХӨТӨЧ — Жилийн халаалтын зардал + дулаалгын харьцуулалт ("Төсөв" таб)
   Планы геометр, сонгосон хана/дулаалга/цонхноос халаалтын эрчим хүч,
   зардал, зуухны хүчин чадлыг тооцож, дулаалгын сонголт бүрийг
   өртөг ба хэмнэлтээр нь харьцуулна.
   ============================================================ */


const INS_LABELS = { none: "Дулаалгагүй", eps100: "EPS 100мм", rockwool100: "Чулуун хөвөн 100мм", eps150: "EPS 150мм" };
const PART_LABELS = [["wall", "Хана", "bg-orange-500"], ["win", "Цонх", "bg-sky-500"], ["roof", "Тааз", "bg-amber-400"], ["floor", "Шал", "bg-stone-400"], ["air", "Агаар солилцоо", "bg-emerald-500"]];

const n0 = (v) => Math.round(v).toLocaleString("en-US");
const n1 = (v) => (Math.round(v * 10) / 10).toLocaleString("en-US");
const tg = (v) => n0(v) + "₮";

/* Сонгосон халаалтын системийн хүчин чадал (кВт) — BuildEstimator-ийн heating сонголттой тааруулсан */
function installedKw(heatingId, floorArea) {
  if (heatingId === "radiator" || heatingId === "underfloor") return { kw: 24, label: "Комби зуух 24кВт" };
  if (heatingId === "electric_heat") { const c = Math.ceil(floorArea / 15); return { kw: c * 2, label: `${c} конвектор × 2кВт` }; }
  return null;
}

function Inp({ label, unit, value, onChange, step = 1 }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{label}</span>
      <div className="mt-0.5 flex items-center gap-1">
        <input type="number" value={value} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-md border border-stone-300 px-2 py-1 text-right font-mono text-xs focus:border-orange-500 focus:outline-none" />
        <span className="whitespace-nowrap text-[10px] text-stone-400">{unit}</span>
      </div>
    </label>
  );
}

export default function EnergyPanel({ geo, settings, setS, selections, insulationCosts = {}, onPickInsulation }) {
  const s = { ...ENERGY_DEFAULTS, ...settings };
  const roofU = (ROOF_U.find((r) => r[0] === s.enRoof) || ROOF_U[0])[2];
  const ceilKnown = CEILING_INSULATION_U[selections.ceilInsulation] != null;
  const opts = { roofU, ach: s.enAch, tIn: s.enTin, tOut: s.enTout, hdd: s.enHdd, price: s.enPrice };

  const cur = useMemo(() => estimateHeating(geo, s, selections, opts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [geo, s.extT, s.wallH, selections, roofU, s.enAch, s.enTin, s.enTout, s.enHdd, s.enPrice]);

  const compare = useMemo(() => {
    const base = estimateHeating(geo, s, selections, { ...opts, insulation: "none" });
    return Object.keys(INS_LABELS).map((id) => {
      const r = estimateHeating(geo, s, selections, { ...opts, insulation: id });
      if (!r || !base) return null;
      const cost = insulationCosts[id] ?? 0;
      const saving = base.annualCost - r.annualCost;
      return { id, uWall: r.uWall, cost, annualCost: r.annualCost, saving, payback: saving > 0 && cost > 0 ? cost / saving : null };
    }).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, s.extT, s.wallH, selections, roofU, s.enAch, s.enTin, s.enTout, s.enHdd, s.enPrice, insulationCosts]);

  if (!cur) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-xs text-stone-500 shadow-sm">
        🔥 Жилийн халаалтын тооцоо энэ хананы төрөлд боломжгүй байна.
      </div>
    );
  }

  const inst = installedKw(selections.heating, geo.floorArea);
  const enough = inst ? inst.kw >= cur.boilerKw : null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-stone-800">🔥 Жилийн халаалтын зардал (ойролцоо)</h3>
      <p className="mt-0.5 text-[11px] text-stone-500">
        Таны план, сонгосон хана, дулаалга, цонх, таазнаас тооцоолов. Хананы U = {cur.uWall.toFixed(2)}, цонх U = {cur.uWin.toFixed(1)}, тааз U = {cur.uRoof.toFixed(2)} Вт/м²K.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Дулаан алдагдал", `${n1(cur.Q / 1000)} кВт`, `ΔT = ${cur.dT}°C үед`],
          ["Жилийн эрчим хүч", `${n0(cur.annualKwh)} кВт·ц`, `${n0(cur.annualKwh / geo.floorArea)} кВт·ц/м²`],
          ["Жилийн зардал", `${n1(cur.annualCost / 1e6)} сая ₮`, `${s.enPrice}₮/кВт·ц-аар`],
          ["Зуухны шаардлага (+20%)", `${n1(cur.boilerKw)} кВт`, inst ? `${inst.label}` : "Халаалт сонгоогүй"]].map(([k, v, sub]) => (
          <div key={k} className="rounded-lg border border-stone-200 p-3">
            <div className="text-[10px] uppercase tracking-wide text-stone-500">{k}</div>
            <div className="font-mono text-base font-bold text-orange-700">{v}</div>
            <div className="text-[10px] text-stone-400">{sub}</div>
          </div>
        ))}
      </div>
      {inst && (
        <p className={`mt-2 rounded-lg px-3 py-1.5 text-xs ${enough ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {enough ? `✓ ${inst.label} хангалттай (${n1(cur.boilerKw)} кВт шаардлагатай).`
                  : `⚠ ${inst.label} хүрэлцэхгүй — ${n1(cur.boilerKw)} кВт шаардлагатай. Дулаалгаа сайжруулах эсвэл илүү чадалтай зуух сонгоно уу.`}
        </p>
      )}

      {/* Дулаан хаашаа алдагдаж байна */}
      <div className="mt-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Дулаан хаашаа алдагдаж байна</div>
        <div className="mt-1 flex h-3 w-full overflow-hidden rounded-full bg-stone-100">
          {PART_LABELS.map(([k, , c]) => <div key={k} className={c} style={{ width: `${(cur.parts[k] / cur.H) * 100}%` }} />)}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-stone-500">
          {PART_LABELS.map(([k, l, c]) => (
            <span key={k} className="flex items-center gap-1"><span className={`inline-block h-2 w-2 rounded-full ${c}`} />{l} {n0((cur.parts[k] / cur.H) * 100)}%</span>
          ))}
        </div>
      </div>

      {/* Дулаалгын харьцуулалт */}
      <div className="mt-4 overflow-x-auto">
        <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Дулаалгын сонголтын харьцуулалт</div>
        <table className="mt-1 w-full min-w-[560px] text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-left text-[10px] uppercase tracking-wide text-stone-400">
              <th className="py-1.5 pr-2">Дулаалга</th><th className="py-1.5 pr-2 text-right">Хананы U</th>
              <th className="py-1.5 pr-2 text-right">Дулаалгын өртөг</th><th className="py-1.5 pr-2 text-right">Жилийн халаалт</th>
              <th className="py-1.5 pr-2 text-right">Хэмнэлт / жил</th><th className="py-1.5 pr-2 text-right">Нөхөгдөх</th><th />
            </tr>
          </thead>
          <tbody>
            {compare.map((r) => {
              const on = r.id === selections.insulation;
              return (
                <tr key={r.id} className={`border-b border-stone-100 ${on ? "bg-orange-50 font-semibold" : ""}`}>
                  <td className="py-1.5 pr-2">{INS_LABELS[r.id]}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{r.uWall.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{r.cost > 0 ? tg(r.cost) : "—"}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{tg(r.annualCost)}</td>
                  <td className="py-1.5 pr-2 text-right font-mono text-emerald-700">{r.saving > 0 ? tg(r.saving) : "—"}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{r.payback ? `${n1(r.payback)} жил` : "—"}</td>
                  <td className="py-1.5 text-right">
                    {on ? <span className="text-[10px] text-orange-700">сонгосон</span>
                        : onPickInsulation && <button onClick={() => onPickInsulation(r.id)} className="rounded border border-stone-300 px-2 py-0.5 text-[10px] hover:bg-stone-50">Сонгох</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1 text-[10px] text-stone-400">Хэмнэлт, нөхөгдөх хугацааг дулаалгагүй хувилбартай харьцуулав. Өртөг = материал + ажлын хөлс (НӨАТ, тээвэргүй).</p>
      </div>

      {/* Тооцооны нөхцөл */}
      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] font-medium text-stone-500">Тооцооны нөхцөл (байршил, үнэ, тааз)</summary>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Байршил (хэм хоног)</span>
            <select value={HDD_ZONES.find((z) => z.hdd === s.enHdd)?.zone ?? ""} onChange={(e) => { const z = HDD_ZONES.find((x) => x.zone === e.target.value); if (z) setS({ enHdd: z.hdd }); }}
              className="mt-0.5 w-full rounded-md border border-stone-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none">
              <option value="">Аймаг сонгох…</option>
              {HDD_ZONES.map((z) => <option key={z.zone} value={z.zone}>{z.zone} бүс ({z.hdd}): {z.places.join(", ")}</option>)}
            </select>
          </label>
          {ceilKnown ? (
            <div className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Таазны дулаалга</span>
              <div className="mt-0.5 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-600">
                {CEILING_INSULATION_LABEL[selections.ceilInsulation]} (U {CEILING_INSULATION_U[selections.ceilInsulation]}) — материалын сонголтоос
              </div>
            </div>
          ) : (
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Таазны дулаалга</span>
              <select value={s.enRoof} onChange={(e) => setS({ enRoof: e.target.value })}
                className="mt-0.5 w-full rounded-md border border-stone-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none">
                {ROOF_U.map(([v, l, u]) => <option key={v} value={v}>{l} (U {u})</option>)}
              </select>
            </label>
          )}
          <Inp label="Дотор темп." unit="°C" value={s.enTin} onChange={(v) => setS({ enTin: v })} />
          <Inp label="Гадна загварын темп." unit="°C" value={s.enTout} onChange={(v) => setS({ enTout: v })} />
          <Inp label="Халаалтын градус·хоног" unit="°C·хоног" value={s.enHdd} step={100} onChange={(v) => setS({ enHdd: v })} />
          <Inp label="Агаар солилцоо" unit="удаа/цаг" value={s.enAch} step={0.1} onChange={(v) => setS({ enAch: v })} />
          <Inp label="Эрчим хүчний үнэ" unit="₮/кВт·ц" value={s.enPrice} step={10} onChange={(v) => setS({ enPrice: v })} />
        </div>
      </details>

      <p className="mt-3 border-t border-stone-100 pt-2 text-[10px] leading-snug text-stone-400">
        Анхдагч нь УБ-ын нөхцөл (−39°C, 7800 °C·хоног). Аймгийн хэм хоногийг БНбД «Барилгын дулаан хамгаалалт»-ын бүсчлэлээс сонгоно; гадна загварын темп.-ийг БНбД 23-01-09-өөс оруулна. λ, U утгууд нийтлэг материалын ойролцоо утга; нарны дулаан, хүн, тоног
        төхөөрөмжийн дулааныг тооцоогүй тул бодит зардал бага зэрэг доогуур байж болно. Зуухны хүчин чадлыг БНбД 23-02-ын аргачлалаар инженер баталгаажуулна.
      </p>
    </div>
  );
}
