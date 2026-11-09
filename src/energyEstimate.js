/* ============================================================
   ХӨТӨЧ — Халаалтын эрчим хүчний хялбаршуулсан тооцоо
   Дулааны баланс: Q = (ΣU·A + 0.34·n·V)·ΔT,  жилийн E = (ΣU·A + 0.34·n·V)·24·ГХ / 1000
   Хананы U = 1 / (Rsi + Σ d/λ + Rse).  Rsi = 0.13, Rse = 0.04 м²К/Вт.
   λ, U утгууд нь нийтлэг материалын ойролцоо лавлах утга — нарийн тооцоог
   БНбД 23-02 (Барилгын дулааны хамгаалалт)-ын аргачлалаар инженер баталгаажуулна.
   EngineeringTools-ийн "Дулаан алдагдал" хэрэгсэл ч энэ heatBalance()-ийг ашиглана.
   ============================================================ */

/* УБ-ын тооцооны утга (EngineeringTools-той ижил) */
export const UB_CLIMATE = { tIn: 20, tOut: -39, hdd: 7800 };

const RSI = 0.13, RSE = 0.04;

/* Гадна хананы үндсэн давхарга — BuildEstimator-ийн extWall сонголтоор.
   lambda: Вт/мК (зузаан нь settings.extT); R: зузаанаас үл хамаарах тогтмол эсэргүүцэл */
export const WALL_LAYERS = {
  eps_block:    { lambda: 0.14, label: "ЭПС хөнгөн блок (полистиролбетон D500)" },
  cement_block: { lambda: 0.70, label: "Цемент блок (хөндий)" },
  brick:        { lambda: 0.70, label: "Улаан тоосгон өрлөг" },
  timber_frame: { R: 0.35,      label: "Модон каркас + OSB (хөндий дүүргэлтгүй)" },
};

/* Дулаалга — insulation сонголтоор */
export const INSULATION_LAYERS = {
  eps100:      { d: 0.10, lambda: 0.038 },
  rockwool100: { d: 0.10, lambda: 0.040 },
  eps150:      { d: 0.15, lambda: 0.038 },
  none:        { d: 0,    lambda: 1 },
};

/* Цонх — windows сонголтоор (W/м²K) */
export const WINDOW_U = { pvc: 1.8, wood_win: 1.8, alu: 2.6 };

/* Тааз/дээврийн дулаалга — EngineeringTools-ийн ROOF_U-тэй ижил (гараар сонгох үед) */
export const ROOF_U = [["ins", "Дулаалгатай тааз (≈200мм хөвөн)", 0.25], ["thin", "Сул дулаалгатай", 0.6], ["none", "Дулаалгагүй", 1.1]];

/* Тооцоолуурын "Таазны дулаалга" (ceilInsulation) сонголтын U-утга (Вт/м²K).
   U = 1 / (Rsi + R_тааз ба хүйтэн мансарда ≈0.7 + d/λ + Rse), хөвөн λ = 0.040 */
export const CEILING_INSULATION_U = { rw200: 0.17, rw150: 0.22, rw100: 0.31, none: 1.1 };
export const CEILING_INSULATION_LABEL = { rw200: "Чулуун хөвөн 200мм", rw150: "Чулуун хөвөн 150мм", rw100: "Чулуун хөвөн 100мм", none: "Дулаалгагүй" };

/* Халаалтын улирлын хэм хоног (ХУХХ), °C·хоног — БНбД "Барилгын дулаан хамгаалалт" (2021)
   3-р хүснэгт, орон нутгийн бүсчлэл. Хүснэгтэд нэр нь тодорхой гарсан аймгуудыг л оруулав.
   Гадна загварын темп.-ийг (хамгийн хүйтэн 5 хоног) БНбД 23-01-09-өөс гараар оруулна. */
export const HDD_ZONES = [
  { zone: "I", hdd: 7000, places: ["Улаанбаатар", "Архангай", "Говь-Алтай", "Завхан", "Сэлэнгэ"] },
  { zone: "II", hdd: 6500, places: ["Баян-Өлгий", "Баянхонгор", "Булган", "Орхон (Эрдэнэт)", "Дархан-Уул"] },
  { zone: "III", hdd: 6000, places: ["Өвөрхангай", "Ховд", "Хэнтий", "Дорнод", "Дундговь", "Сүхбаатар"] },
  { zone: "IV", hdd: 5000, places: ["Дорноговь", "Говь-Сүмбэр", "Өмнөговь"] },
];

export const FLOOR_U = 0.4;          // газартай шал
export const FLOOR_FACTOR = 0.5;     // газрын температур агаарынхаас өндөр тул

/* Хананы U-утга */
export function wallU(wallId, insulationId, extT) {
  const w = WALL_LAYERS[wallId];
  const ins = INSULATION_LAYERS[insulationId] || INSULATION_LAYERS.none;
  if (!w) return null;
  const rWall = w.R ?? (extT > 0 ? extT / w.lambda : 0);
  return 1 / (RSI + rWall + ins.d / ins.lambda + RSE);
}

/* Дулааны баланс — талбай (м²), U (Вт/м²K), эзлэхүүн (м³) */
export function heatBalance({ wallArea, winArea, roofArea, floorArea, volume, uWall, uWin, uRoof,
  uFloor = FLOOR_U, ach = 0.5, tIn = UB_CLIMATE.tIn, tOut = UB_CLIMATE.tOut, hdd = UB_CLIMATE.hdd }) {
  const parts = {
    wall: wallArea * uWall,
    win: winArea * uWin,
    roof: roofArea * uRoof,
    floor: floorArea * uFloor * FLOOR_FACTOR,
    air: 0.34 * ach * volume,                     // 0.34 Вт·ц/м³K — агаарын дулаан багтаамж
  };
  const H = Object.values(parts).reduce((a, b) => a + b, 0);  // Вт/K
  const dT = tIn - tOut;
  return { parts, H, dT, Q: H * dT, annualKwh: H * 24 * hdd / 1000 };
}

/* BuildEstimator-ийн геометр, сонголтоос жилийн халаалт тооцно.
   opts: { insulation?, roofU, ach, tIn, tOut, hdd, price } — insulation-ийг дарж өөр сонголтыг туршиж болно */
export function estimateHeating(geo, settings, selections, opts) {
  if (!geo) return null;
  const insulation = opts.insulation ?? selections.insulation;
  // Таазны дулаалгыг тооцоолуурын сонголтоос авна (хуучин төсөлд байхгүй бол гараар сонгосон roofU)
  const uRoof = CEILING_INSULATION_U[selections.ceilInsulation] ?? opts.roofU;
  const uWall = wallU(selections.extWall, insulation, settings.extT);
  if (uWall == null) return null;
  const uWin = WINDOW_U[selections.windows] ?? 1.8;
  const r = heatBalance({
    wallArea: geo.extNet,                         // цонхгүй цэвэр талбай, бүх давхар
    winArea: geo.winArea * geo.floors,
    roofArea: geo.sumArea,                        // дээд давхрын тааз
    floorArea: geo.sumArea,                       // доод давхрын шал
    volume: geo.floorArea * settings.wallH,
    uWall, uWin, uRoof, ach: opts.ach, tIn: opts.tIn, tOut: opts.tOut, hdd: opts.hdd,
  });
  return { ...r, uWall, uWin, uRoof, insulation, annualCost: r.annualKwh * opts.price, boilerKw: r.Q * 1.2 / 1000 };
}
