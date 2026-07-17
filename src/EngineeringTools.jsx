import { useState, useMemo } from "react";

/* ============================================================
   ХӨТӨЧ — Инженерийн тооцоо (hutuch.com)
   Мэргэжлийн инженерүүдэд зориулсан 8 тооцоолуур, бүгд стандарт
   инженерийн томьёогоор, өөрийн кодоор бичигдсэн:
   Дулаан алдагдал · Радиатор · Кабель · Хоолойн урсац (Маннинг)
   Бетоны найрлага · Арматур · Тоосгон өрлөг · Шавардлага & будаг
   Бүх үр дүн урьдчилсан тооцоо тул эцсийн шийдвэрт мэргэжлийн
   инженерийн баталгаажуулалт шаардлагатай.
   ============================================================ */

const fmt = (n, d = 1) => (isFinite(n) ? Number(n.toFixed(d)).toLocaleString("en-US") : "—");

/* ---------- Жижиг UI ---------- */
function Num({ label, value, onChange, step = 1, min = 0, unit }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}{unit && <span className="text-slate-400"> ({unit})</span>}</span>
      <input type="number" value={value} step={step} min={min}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none" />
    </label>
  );
}
function Sel({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function Res({ label, value, hi }) {
  return (
    <div className={`flex items-baseline justify-between rounded-xl px-3 py-2 ${hi ? "bg-orange-50 dark:bg-orange-950/40" : "bg-slate-50 dark:bg-slate-800/60"}`}>
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`font-mono font-bold ${hi ? "text-lg text-orange-600" : "text-slate-900 dark:text-white"}`}>{value}</span>
    </div>
  );
}
function Note({ children }) {
  return <p className="mt-3 text-[11px] leading-snug text-slate-400">{children}</p>;
}

/* ============ 1. Дулаан алдагдал ============ */
const WALL_U = [
  ["b400e100", "Блок 400мм + EPS 100мм", 0.28],
  ["b400", "Блок 400мм (дулаалгагүй)", 0.9],
  ["br380e100", "Тоосго 380мм + EPS 100мм", 0.3],
  ["br380", "Тоосго 380мм (дулаалгагүй)", 1.2],
  ["frame150", "Модон каркас + хөвөн 150мм", 0.32],
  ["panel100", "Сэндвич панель 100мм", 0.4],
];
const ROOF_U = [["ins", "Дулаалгатай дээвэр/тааз", 0.25], ["thin", "Сул дулаалгатай", 0.6], ["none", "Дулаалгагүй", 1.1]];
const WIN_U = [["pvc2", "Вакум 2 давхар шил", 1.8], ["pvc3", "Вакум 3 давхар шил", 1.1], ["old", "Хуучин модон цонх", 2.8]];

function HeatLoss() {
  const [floorArea, setFloorArea] = useState(63);
  const [wallArea, setWallArea] = useState(83);
  const [winArea, setWinArea] = useState(7);
  const [height, setHeight] = useState(2.8);
  const [wall, setWall] = useState("b400e100");
  const [roof, setRoof] = useState("ins");
  const [win, setWin] = useState("pvc2");
  const [tIn, setTIn] = useState(20);
  const [tOut, setTOut] = useState(-39);
  const [ach, setAch] = useState(0.5);
  const [hdd, setHdd] = useState(7800);
  const [price, setPrice] = useState(180);

  const r = useMemo(() => {
    const dT = tIn - tOut;
    const uW = WALL_U.find((x) => x[0] === wall)[2];
    const uR = ROOF_U.find((x) => x[0] === roof)[2];
    const uG = WIN_U.find((x) => x[0] === win)[2];
    const uFloor = 0.4;
    const netWall = Math.max(0, wallArea - winArea);
    const UA = netWall * uW + floorArea * uR + floorArea * uFloor * 0.5 + winArea * uG; // шал: газартай тул 0.5 коэфф
    const vol = floorArea * height;
    const infUA = 0.34 * ach * vol; // Вт/К (агаарын 0.34 Вт·ц/м³К)
    const Q = (UA + infUA) * dT;
    const boiler = Q * 1.2 / 1000;
    const annualKwh = (UA + infUA) * 24 * hdd / 1000;
    return { dT, Q, perM2: Q / floorArea, boiler, annualKwh, annualCost: annualKwh * price };
  }, [floorArea, wallArea, winArea, height, wall, roof, win, tIn, tOut, ach, hdd, price]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Num label="Шалны талбай" unit="м²" value={floorArea} onChange={setFloorArea} step={1} />
        <Num label="Гадна хананы талбай" unit="м²" value={wallArea} onChange={setWallArea} step={1} />
        <Num label="Цонхны талбай" unit="м²" value={winArea} onChange={setWinArea} step={0.5} />
        <Num label="Таазны өндөр" unit="м" value={height} onChange={setHeight} step={0.1} />
        <Num label="Доторх температур" unit="°C" value={tIn} onChange={setTIn} />
        <Num label="Гадна загварын темп." unit="°C" value={tOut} onChange={setTOut} />
        <Sel label="Гадна хана" value={wall} onChange={setWall} options={WALL_U.map(([v, l]) => [v, l])} />
        <Sel label="Дээвэр / тааз" value={roof} onChange={setRoof} options={ROOF_U.map(([v, l]) => [v, l])} />
        <Sel label="Цонх" value={win} onChange={setWin} options={WIN_U.map(([v, l]) => [v, l])} />
        <Num label="Агаар солилцоо" unit="удаа/цаг" value={ach} onChange={setAch} step={0.1} />
        <Num label="Халаалтын градус·хоног" unit="°C·хоног" value={hdd} onChange={setHdd} step={100} />
        <Num label="Эрчим хүчний үнэ" unit="₮/кВт·ц" value={price} onChange={setPrice} step={10} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Res label={`Дулаан алдагдал (ΔT=${r.dT}°C)`} value={`${fmt(r.Q / 1000, 2)} кВт`} hi />
        <Res label="Хувийн алдагдал" value={`${fmt(r.perM2, 0)} Вт/м²`} />
        <Res label="Зуухны хүчин чадал (+20% нөөц)" value={`${fmt(r.boiler, 1)} кВт`} hi />
        <Res label="Жилийн халаалтын эрчим хүч" value={`${fmt(r.annualKwh, 0)} кВт·ц`} />
        <Res label="Жилийн зардал (цахилгаанаар)" value={`${fmt(r.annualCost / 1e6, 2)} сая ₮`} />
      </div>
      <Note>УБ-ын загварын гадна температур −39°C, халаалтын улирал ≈7800 °C·хоног. Дулаалгын сонголтоо солиод жилийн зардал хэрхэн өөрчлөгдөхийг харьцуулаарай — энэ л дулаалгын хөрөнгө оруулалтын үндэслэл. U утгууд нийтлэг хийцийн ойролцоо утга; нарийн тооцоог БНбД 23-02-д заасан аргачлалаар инженер баталгаажуулна.</Note>
    </div>
  );
}

/* ============ 2. Радиатор ============ */
function Radiator() {
  const [area, setArea] = useState(16);
  const [spec, setSpec] = useState(120);
  const [secPower, setSecPower] = useState(180);
  const r = useMemo(() => {
    const Q = area * spec;
    return { Q, sections: Math.ceil(Q / secPower) };
  }, [area, spec, secPower]);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Num label="Өрөөний талбай" unit="м²" value={area} onChange={setArea} />
        <Num label="Хувийн хэрэгцээ" unit="Вт/м²" value={spec} onChange={setSpec} step={10} />
        <Num label="Нэг секцийн хүч" unit="Вт" value={secPower} onChange={setSecPower} step={10} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Res label="Өрөөний дулааны хэрэгцээ" value={`${fmt(r.Q, 0)} Вт`} />
        <Res label="Шаардлагатай секц" value={`${r.sections} секц`} hi />
      </div>
      <Note>Хувийн хэрэгцээ: сайн дулаалгатай 80–100 Вт/м², дунд 120, муу дулаалгатай/булангийн өрөө 150–180 Вт/м². Алюмин секц ≈180Вт (ΔT=70°C үед), биметалл ≈170Вт. Нарийн утгыг дулаан алдагдлын тооцооноос авбал зөв.</Note>
    </div>
  );
}

/* ============ 3. Кабель ============ */
const AMP_CU = [[1.5, 19], [2.5, 27], [4, 38], [6, 46], [10, 70], [16, 85], [25, 115], [35, 135], [50, 175]];
const BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
function Cable() {
  const [p, setP] = useState(5);
  const [phase, setPhase] = useState("1");
  const [len, setLen] = useState(25);
  const [mat, setMat] = useState("cu");
  const [cosf, setCosf] = useState(0.95);
  const [maxDrop, setMaxDrop] = useState(3);
  const r = useMemo(() => {
    const V = phase === "1" ? 220 : 380;
    const I = phase === "1" ? (p * 1000) / (V * cosf) : (p * 1000) / (Math.sqrt(3) * V * cosf);
    const rho = mat === "cu" ? 0.0175 : 0.028;
    const ampK = mat === "cu" ? 1 : 0.78;
    let pick = null;
    for (const [s, amp] of AMP_CU) {
      const ampacity = amp * ampK;
      const drop = phase === "1"
        ? (2 * rho * len * I) / s / V * 100
        : (Math.sqrt(3) * rho * len * I) / s / V * 100;
      if (ampacity >= I * 1.25 && drop <= maxDrop) { pick = { s, ampacity, drop }; break; }
    }
    const breaker = BREAKERS.find((b) => b >= I * 1.1 && (!pick || b <= pick.ampacity)) || null;
    return { I, V, pick, breaker };
  }, [p, phase, len, mat, cosf, maxDrop]);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Num label="Ачаалал" unit="кВт" value={p} onChange={setP} step={0.5} />
        <Sel label="Фаз" value={phase} onChange={setPhase} options={[["1", "1 фаз · 220В"], ["3", "3 фаз · 380В"]]} />
        <Num label="Кабелийн урт" unit="м" value={len} onChange={setLen} />
        <Sel label="Дамжуулагч" value={mat} onChange={setMat} options={[["cu", "Зэс"], ["al", "Хөнгөнцагаан"]]} />
        <Num label="cos φ" value={cosf} onChange={setCosf} step={0.05} />
        <Num label="Зөвшөөрөх уналт" unit="%" value={maxDrop} onChange={setMaxDrop} step={0.5} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Res label="Тооцоот гүйдэл" value={`${fmt(r.I, 1)} А`} />
        {r.pick ? (
          <>
            <Res label="Санал болгох огтлол" value={`${r.pick.s} мм²`} hi />
            <Res label="Хүчдэлийн уналт" value={`${fmt(r.pick.drop, 2)} %`} />
            <Res label="Автомат таслуур" value={r.breaker ? `${r.breaker} А` : "—"} hi />
          </>
        ) : (
          <Res label="Үр дүн" value="50мм²-аас том хэрэгтэй — инженертэй зөвшилц" hi />
        )}
      </div>
      <Note>Ачаалах чадвар: агаарт тавьсан зэс кабелийн нийтлэг утга (хөнгөнцагаан ≈78%). Таслуур гүйдлээс ≥10% дээгүүр, кабелийн чадвараас доогуур сонгогдоно. Далд монтаж, бүлэг кабель, өндөр темп. орчинд бууруулах коэфф. хэрэглэнэ — эцсийн сонголтыг цахилгааны инженер баталгаажуулна.</Note>
    </div>
  );
}

/* ============ 4. Хоолойн урсац (Маннинг) ============ */
function Manning() {
  const [d, setD] = useState(110);
  const [slope, setSlope] = useState(20);
  const [n, setN] = useState(0.013);
  const [fill, setFill] = useState(70);
  const r = useMemo(() => {
    const D = d / 1000, h = D * fill / 100, S = slope / 1000;
    if (h <= 0 || h > D) return null;
    const theta = 2 * Math.acos(1 - (2 * h) / D);
    const A = (D * D / 8) * (theta - Math.sin(theta));
    const P = (D * theta) / 2;
    const R = A / P;
    const v = (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
    return { v, Q: v * A * 1000 };
  }, [d, slope, n, fill]);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Num label="Хоолойн диаметр" unit="мм" value={d} onChange={setD} step={10} />
        <Num label="Налуу" unit="‰" value={slope} onChange={setSlope} />
        <Num label="Барзгарын коэфф. n" value={n} onChange={setN} step={0.001} />
        <Num label="Дүүргэлт" unit="%" value={fill} onChange={setFill} step={5} />
      </div>
      {r && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Res label="Урсгалын хурд" value={`${fmt(r.v, 2)} м/с`} />
          <Res label="Зарцуулалт" value={`${fmt(r.Q, 1)} л/с`} hi />
        </div>
      )}
      <Note>Маннингийн томьёо: v = (1/n)·R^⅔·√S. Барзгар n: хуванцар PVC 0.010–0.013, бетон 0.013–0.015, ган 0.012. Бохирын өөрөө урсах шугамд хурд 0.7–3 м/с, дүүргэлт ≤70% байх нь зохимжтой.</Note>
    </div>
  );
}

/* ============ 5. Бетоны найрлага ============ */
const GRADES = [
  ["m100", "М100 (1:3:6)", 1, 3, 6],
  ["m150", "М150 (1:2:4)", 1, 2, 4],
  ["m200", "М200 (1:1.5:3)", 1, 1.5, 3],
  ["m250", "М250 (1:1:2)", 1, 1, 2],
];
function Concrete() {
  const [vol, setVol] = useState(5);
  const [grade, setGrade] = useState("m250");
  const r = useMemo(() => {
    const [, , c, s, g] = GRADES.find((x) => x[0] === grade);
    const dry = vol * 1.54;
    const sum = c + s + g;
    const cementM3 = dry * c / sum;
    const cementKg = cementM3 * 1440;
    return { dry, cementKg, bags: Math.ceil(cementKg / 50), sand: dry * s / sum, gravel: dry * g / sum, water: cementKg * 0.5 };
  }, [vol, grade]);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Num label="Бетоны эзлэхүүн" unit="м³" value={vol} onChange={setVol} step={0.5} />
        <Sel label="Марк (харьцаа)" value={grade} onChange={setGrade} options={GRADES.map(([v, l]) => [v, l])} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Res label="Хуурай эзлэхүүн (×1.54)" value={`${fmt(r.dry, 2)} м³`} />
        <Res label="Цемент" value={`${fmt(r.cementKg, 0)} кг = ${r.bags} ш (50кг)`} hi />
        <Res label="Элс" value={`${fmt(r.sand, 2)} м³`} />
        <Res label="Хайрга / дайрга" value={`${fmt(r.gravel, 2)} м³`} />
        <Res label="Ус (ойролцоо, Ц/У=0.5)" value={`${fmt(r.water, 0)} л`} />
      </div>
      <Note>Эзлэхүүний харьцааны уламжлалт арга — гар зуурмаг, жижиг ажилд. Даацын бүтээцэд заводын бетон эсвэл жингийн аргаар лабораторийн жороор найруулна.</Note>
    </div>
  );
}

/* ============ 6. Арматур ============ */
function Rebar() {
  const [d, setD] = useState(12);
  const [len, setLen] = useState(11.7);
  const [count, setCount] = useState(50);
  const r = useMemo(() => {
    const kgm = (d * d) / 162;
    const total = kgm * len * count;
    return { kgm, total, perBar: kgm * len };
  }, [d, len, count]);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <Num label="Диаметр" unit="мм" value={d} onChange={setD} />
        <Num label="Нэг ширхэгийн урт" unit="м" value={len} onChange={setLen} step={0.1} />
        <Num label="Ширхэг" unit="ш" value={count} onChange={setCount} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Res label="1 метрийн жин" value={`${fmt(r.kgm, 3)} кг/м`} />
        <Res label="1 ширхэгийн жин" value={`${fmt(r.perBar, 1)} кг`} />
        <Res label="Нийт жин" value={`${fmt(r.total / 1000, 2)} тн`} hi />
      </div>
      <Note>Жин = d²/162 (кг/м) — арматурын стандарт томьёо. Ø12 = 0.888 кг/м, Ø16 = 1.58 кг/м. Худалдан авахдаа огтлол, давхардлын 3–5% нөөц нэмээрэй.</Note>
    </div>
  );
}

/* ============ 7. Тоосгон өрлөг ============ */
function Brick() {
  const [area, setArea] = useState(50);
  const [t, setT] = useState("0.25");
  const r = useMemo(() => {
    const vol = area * parseFloat(t);
    const bricks = Math.ceil(vol * 394 * 1.05);
    const mortar = vol * 0.23;
    const cementKg = mortar * 320;
    return { vol, bricks, mortar, cementKg, bags: Math.ceil(cementKg / 50), sand: mortar * 1.05 };
  }, [area, t]);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Num label="Хананы талбай" unit="м²" value={area} onChange={setArea} />
        <Sel label="Хананы зузаан" value={t} onChange={setT}
          options={[["0.12", "0.12м (хагас тоосго)"], ["0.25", "0.25м (1 тоосго)"], ["0.38", "0.38м (1.5 тоосго)"], ["0.51", "0.51м (2 тоосго)"]]} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Res label="Өрлөгийн эзлэхүүн" value={`${fmt(r.vol, 2)} м³`} />
        <Res label="Тоосго (5% нөөцтэй)" value={`${fmt(r.bricks, 0)} ш`} hi />
        <Res label="Зуурмаг (1:4)" value={`${fmt(r.mortar, 2)} м³`} />
        <Res label="Цемент" value={`${fmt(r.cementKg, 0)} кг = ${r.bags} ш`} />
        <Res label="Элс" value={`${fmt(r.sand, 2)} м³`} />
      </div>
      <Note>Стандарт тоосго 250×120×65мм, 10мм зуурмагийн үетэй үед 1м³ өрлөгт ≈394ш тоосго, 0.23м³ зуурмаг ордог. Нүх сүв, цонх хаалганы талбайг хасч тооцоорой.</Note>
    </div>
  );
}

/* ============ 8. Шавардлага & будаг ============ */
function PlasterPaint() {
  const [area, setArea] = useState(120);
  const [th, setTh] = useState(15);
  const [layers, setLayers] = useState(2);
  const [coverage, setCoverage] = useState(8);
  const r = useMemo(() => {
    const mortar = area * th / 1000 * 1.3;
    const cementKg = mortar * 320;
    return { mortar, cementKg, bags: Math.ceil(cementKg / 50), sand: mortar * 1.05, paint: area * layers / coverage };
  }, [area, th, layers, coverage]);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Num label="Талбай" unit="м²" value={area} onChange={setArea} />
        <Num label="Шавардлагын зузаан" unit="мм" value={th} onChange={setTh} />
        <Num label="Будгийн үе" value={layers} onChange={setLayers} />
        <Num label="Будгийн хамрах" unit="м²/л" value={coverage} onChange={setCoverage} step={0.5} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Res label="Зуурмаг (1:4, алдагдалтай)" value={`${fmt(r.mortar, 2)} м³`} />
        <Res label="Цемент" value={`${fmt(r.cementKg, 0)} кг = ${r.bags} ш`} hi />
        <Res label="Элс" value={`${fmt(r.sand, 2)} м³`} />
        <Res label="Будаг" value={`${fmt(r.paint, 1)} л`} hi />
      </div>
      <Note>Шавардлагад гадаргын барзгар, алдагдлын 30% нөөц орсон. Будгийн хамрах чадвар үйлдвэрлэгчээс хамаарна (усан суурьтай 7–10 м²/л/үе) — лаазан дээрх зааврыг баримтлаарай.</Note>
    </div>
  );
}

/* ============================================================ */
const TOOLS = [
  { id: "heat", icon: "🌡", name: "Дулаан алдагдал", desc: "Зуухны хүч, жилийн халаалтын зардал", comp: HeatLoss, cat: "Халаалт" },
  { id: "rad", icon: "♨️", name: "Радиаторын секц", desc: "Өрөө тус бүрийн радиатор сонголт", comp: Radiator, cat: "Халаалт" },
  { id: "cable", icon: "⚡", name: "Кабель & автомат", desc: "Огтлол, хүчдэлийн уналт, таслуур", comp: Cable, cat: "Цахилгаан" },
  { id: "manning", icon: "💧", name: "Хоолойн урсац", desc: "Маннингийн томьёо — бохир, борооны шугам", comp: Manning, cat: "Сантехник" },
  { id: "concrete", icon: "🏗", name: "Бетоны найрлага", desc: "Цемент, элс, хайрга, ус", comp: Concrete, cat: "Барилга" },
  { id: "rebar", icon: "🔩", name: "Арматурын жин", desc: "d²/162 — кг/м, нийт тонн", comp: Rebar, cat: "Барилга" },
  { id: "brick", icon: "🧱", name: "Тоосгон өрлөг", desc: "Тоосго, зуурмаг, цемент, элс", comp: Brick, cat: "Барилга" },
  { id: "plaster", icon: "🎨", name: "Шавардлага & будаг", desc: "Зуурмаг, цемент, будгийн литр", comp: PlasterPaint, cat: "Засал" },
];

export default function EngineeringTools({ onBack }) {
  const [active, setActive] = useState("heat");
  const tool = TOOLS.find((t) => t.id === active);
  const Comp = tool.comp;
  return (
    <div className="py-6">
      <div className="mb-5 flex items-center gap-3">
        {onBack && <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200">←</button>}
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Инженерийн тооцоо</h1>
          <p className="text-xs text-slate-500">Мэргэжлийн инженерүүдэд зориулсан 8 тооцоолуур — стандарт инженерийн томьёогоор</p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {TOOLS.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`rounded-2xl border p-3 text-left transition ${active === t.id
                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-300"}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{t.icon}</span>
                <div>
                  <div className={`text-sm font-bold ${active === t.id ? "text-orange-700 dark:text-orange-400" : "text-slate-800 dark:text-slate-100"}`}>{t.name}</div>
                  <div className="text-[10px] text-slate-400">{t.cat}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">{tool.icon}</span>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white">{tool.name}</h2>
              <p className="text-xs text-slate-500">{tool.desc}</p>
            </div>
          </div>
          <Comp />
        </div>
      </div>
    </div>
  );
}
