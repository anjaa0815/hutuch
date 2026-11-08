import { useMemo, useState } from "react";

/* ============================================================
   ХӨТӨЧ — Материалын эрчимшлийн жишиг (RASMI)
   Дэлхийн 3072 хязгаараас Монголд хамаарах бүсүүдийг шүүж авсан.
   Утга = [p5, p50, p95] кг/м² (шалны талбай дээр)

   Эх сурвалж: Fishman, Mastrucci, Peled, Saxe, van Ruijven (2024)
   "RASMI: Global Ranges of Building Material Intensities…"
   Scientific Data 11, 418. doi:10.1038/s41597-024-03190-7
   github.com/TomerFishman/MaterialIntensityEstimator
   ============================================================ */

export const MI_RANGES = {"NR|C|ASIA_CHN":{"concrete":[174.0,945.4,2054.1],"brick":[0.1,289.6,667.0],"wood":[0.0,6.0,30.0],"steel":[17.4,62.5,134.4],"glass":[0.0,2.0,7.0]},"NR|C|OECD_EEU":{"concrete":[429.5,1062.4,2235.4],"brick":[5.5,148.5,592.2],"wood":[1.1,25.7,100.1],"steel":[10.4,47.0,138.6],"glass":[0.5,2.6,22.7]},"NR|C|REF_CAS":{"concrete":[400.0,1078.6,2221.0],"brick":[5.1,206.5,642.0],"wood":[0.3,19.3,88.6],"steel":[10.7,54.7,141.5],"glass":[0.0,2.0,8.4]},"NR|C|REF_RUS":{"concrete":[400.0,1078.6,2221.0],"brick":[5.1,206.5,642.0],"wood":[0.3,19.3,88.6],"steel":[10.7,54.7,141.5],"glass":[0.0,2.0,8.4]},"NR|M|ASIA_CHN":{"concrete":[782.0,1431.0,1965.2],"brick":[109.0,570.0,854.3],"wood":[10.3,17.0,116.6],"steel":[9.0,26.0,66.0],"glass":[1.7,2.0,2.7]},"NR|M|OECD_EEU":{"concrete":[86.9,465.2,1538.9],"brick":[424.0,973.4,1513.6],"wood":[12.6,27.8,81.0],"steel":[3.3,23.6,46.0],"glass":[1.0,2.0,2.9]},"NR|M|REF_CAS":{"concrete":[89.6,655.6,1636.1],"brick":[420.3,729.0,1388.5],"wood":[11.2,20.6,70.7],"steel":[10.0,26.0,60.4],"glass":[1.0,2.0,2.8]},"NR|M|REF_RUS":{"concrete":[89.6,655.6,1636.1],"brick":[420.3,729.0,1388.5],"wood":[11.2,20.6,70.7],"steel":[10.0,26.0,60.4],"glass":[1.0,2.0,2.8]},"NR|S|ASIA_CHN":{"concrete":[108.0,496.0,994.7],"brick":[32.8,117.0,180.0],"wood":[0.7,11.0,61.0],"steel":[8.0,142.0,280.9],"glass":[1.0,1.0,7.8]},"NR|S|OECD_EEU":{"concrete":[126.0,463.0,690.0],"brick":[32.7,37.2,151.6],"wood":[1.5,11.0,15.9],"steel":[100.6,142.0,178.0],"glass":[0.8,1.0,8.4]},"NR|S|REF_CAS":{"concrete":[117.0,496.0,1262.5],"brick":[32.7,41.6,161.1],"wood":[0.2,11.0,20.0],"steel":[100.6,142.0,310.3],"glass":[1.0,1.0,8.1]},"NR|S|REF_RUS":{"concrete":[117.0,496.0,1262.5],"brick":[32.7,41.6,161.1],"wood":[0.2,11.0,20.0],"steel":[100.6,142.0,310.3],"glass":[1.0,1.0,8.1]},"NR|T|ASIA_CHN":{"concrete":[6.9,231.4,649.0],"brick":[0.0,100.0,1092.9],"wood":[0.0,0.5,125.6],"steel":[0.0,0.0,8.6],"glass":[0.0,0.0,2.0]},"NR|T|OECD_EEU":{"concrete":[186.2,399.0,994.7],"brick":[7.3,60.0,866.9],"wood":[0.0,5.0,95.9],"steel":[0.0,29.0,102.0],"glass":[0.0,0.0,3.1]},"NR|T|REF_CAS":{"concrete":[7.8,321.0,994.7],"brick":[5.0,60.0,938.3],"wood":[0.0,5.0,103.8],"steel":[0.0,1.5,97.1],"glass":[0.0,0.0,2.2]},"NR|T|REF_RUS":{"concrete":[7.8,321.0,994.7],"brick":[5.0,60.0,938.3],"wood":[0.0,5.0,103.8],"steel":[0.0,1.5,97.1],"glass":[0.0,0.0,2.2]},"RM|C|ASIA_CHN":{"concrete":[392.5,1012.4,1689.0],"brick":[14.0,191.2,682.6],"wood":[9.0,21.8,29.8],"steel":[4.6,46.6,77.3],"glass":[0.3,2.0,2.3]},"RM|C|OECD_EEU":{"concrete":[485.9,961.2,2105.6],"brick":[13.8,257.4,614.6],"wood":[2.4,19.0,109.0],"steel":[21.3,52.6,245.4],"glass":[1.4,3.0,8.7]},"RM|C|REF_CAS":{"concrete":[484.4,965.1,2137.2],"brick":[13.3,212.6,660.6],"wood":[2.4,19.0,104.0],"steel":[18.1,52.6,211.5],"glass":[0.8,2.5,8.3]},"RM|C|REF_RUS":{"concrete":[484.4,965.1,2137.2],"brick":[13.3,212.6,660.6],"wood":[2.4,19.0,104.0],"steel":[18.1,52.6,211.5],"glass":[0.8,2.5,8.3]},"RM|M|ASIA_CHN":{"concrete":[870.0,1145.0,2613.9],"brick":[314.0,500.0,727.5],"wood":[7.0,20.0,75.2],"steel":[0.6,16.0,183.8],"glass":[0.1,1.8,7.8]},"RM|M|OECD_EEU":{"concrete":[32.4,319.0,960.8],"brick":[85.6,639.5,1625.4],"wood":[6.3,53.2,86.6],"steel":[2.0,24.0,135.0],"glass":[0.8,2.2,5.0]},"RM|M|REF_CAS":{"concrete":[40.4,365.0,1598.0],"brick":[89.2,640.5,1707.4],"wood":[7.4,46.6,81.8],"steel":[1.6,21.0,135.0],"glass":[0.6,2.0,5.3]},"RM|M|REF_RUS":{"concrete":[40.4,365.0,1598.0],"brick":[89.2,640.5,1707.4],"wood":[7.4,46.6,81.8],"steel":[1.6,21.0,135.0],"glass":[0.6,2.0,5.3]},"RM|S|ASIA_CHN":{"concrete":[152.3,746.2,1689.0],"brick":[14.9,107.0,180.0],"wood":[18.0,22.0,61.0],"steel":[7.0,71.0,134.2],"glass":[0.2,2.0,4.9]},"RM|S|OECD_EEU":{"concrete":[160.1,535.0,1207.4],"brick":[14.6,32.7,175.8],"wood":[4.0,22.0,52.7],"steel":[3.8,70.5,178.0],"glass":[0.0,2.6,5.7]},"RM|S|REF_CAS":{"concrete":[160.1,677.2,1392.8],"brick":[14.6,107.0,177.0],"wood":[7.6,22.0,52.7],"steel":[3.8,70.0,145.5],"glass":[0.2,2.0,5.0]},"RM|S|REF_RUS":{"concrete":[160.1,677.2,1392.8],"brick":[14.6,107.0,177.0],"wood":[7.6,22.0,52.7],"steel":[3.8,70.0,145.5],"glass":[0.2,2.0,5.0]},"RM|T|ASIA_CHN":{"concrete":[0.0,85.9,1108.1],"brick":[0.0,61.0,855.0],"wood":[0.2,69.6,243.2],"steel":[0.1,6.5,79.0],"glass":[0.1,0.3,6.3]},"RM|T|OECD_EEU":{"concrete":[25.0,244.8,837.3],"brick":[0.0,88.0,292.7],"wood":[37.7,92.0,255.3],"steel":[0.7,18.0,107.0],"glass":[1.1,4.0,8.7]},"RM|T|REF_CAS":{"concrete":[18.0,204.0,837.3],"brick":[0.0,83.3,486.5],"wood":[33.9,90.0,237.2],"steel":[0.1,17.0,107.0],"glass":[0.3,4.0,8.3]},"RM|T|REF_RUS":{"concrete":[18.0,204.0,837.3],"brick":[0.0,83.3,486.5],"wood":[33.9,90.0,237.2],"steel":[0.1,17.0,107.0],"glass":[0.3,4.0,8.3]},"RS|C|ASIA_CHN":{"concrete":[219.6,924.5,1491.5],"brick":[13.5,329.2,810.0],"wood":[12.9,22.0,31.9],"steel":[4.7,25.9,75.0],"glass":[0.2,2.0,2.0]},"RS|C|OECD_EEU":{"concrete":[251.8,618.4,1563.2],"brick":[10.1,176.5,714.1],"wood":[4.4,69.5,123.7],"steel":[5.0,30.0,90.4],"glass":[0.9,2.1,14.9]},"RS|C|REF_CAS":{"concrete":[280.2,781.5,2048.4],"brick":[10.2,275.5,782.2],"wood":[4.5,69.0,120.1],"steel":[5.0,21.2,92.3],"glass":[0.7,2.0,14.9]},"RS|C|REF_RUS":{"concrete":[280.2,781.5,2048.4],"brick":[10.2,275.5,782.2],"wood":[4.5,69.0,120.1],"steel":[5.0,21.2,92.3],"glass":[0.7,2.0,14.9]},"RS|M|ASIA_CHN":{"concrete":[870.0,1117.0,1517.0],"brick":[320.0,580.0,1690.0],"wood":[7.0,20.0,88.1],"steel":[0.6,16.0,29.2],"glass":[0.1,1.8,2.0]},"RS|M|OECD_EEU":{"concrete":[356.8,608.9,1495.5],"brick":[88.1,693.3,2219.0],"wood":[14.4,38.9,69.9],"steel":[6.7,10.5,87.2],"glass":[0.9,5.8,10.0]},"RS|M|REF_CAS":{"concrete":[1.3,542.5,1364.2],"brick":[0.0,645.3,2219.0],"wood":[6.2,39.3,139.8],"steel":[6.7,27.0,77.1],"glass":[0.6,5.8,9.9]},"RS|M|REF_RUS":{"concrete":[1.3,542.5,1364.2],"brick":[0.0,645.3,2219.0],"wood":[6.2,39.3,139.8],"steel":[6.7,27.0,77.1],"glass":[0.6,5.8,9.9]},"RS|S|ASIA_CHN":{"concrete":[108.0,880.0,1689.0],"brick":[14.9,107.0,180.0],"wood":[7.8,22.0,61.0],"steel":[8.0,71.0,165.0],"glass":[0.7,2.0,3.8]},"RS|S|OECD_EEU":{"concrete":[236.3,584.0,1610.0],"brick":[14.6,32.7,175.8],"wood":[4.0,20.0,48.1],"steel":[17.0,125.0,178.0],"glass":[0.0,2.0,5.7]},"RS|S|REF_CAS":{"concrete":[197.8,587.0,1689.0],"brick":[14.6,107.0,177.0],"wood":[6.5,22.0,52.0],"steel":[17.0,75.0,165.0],"glass":[0.5,2.0,4.3]},"RS|S|REF_RUS":{"concrete":[197.8,587.0,1689.0],"brick":[14.6,107.0,177.0],"wood":[6.5,22.0,52.0],"steel":[17.0,75.0,165.0],"glass":[0.5,2.0,4.3]},"RS|T|ASIA_CHN":{"concrete":[0.0,326.0,1015.0],"brick":[0.0,53.9,855.0],"wood":[1.2,73.0,169.2],"steel":[0.1,5.2,69.2],"glass":[0.1,2.2,10.0]},"RS|T|OECD_EEU":{"concrete":[47.4,351.8,865.6],"brick":[0.0,59.0,636.8],"wood":[48.5,73.4,150.7],"steel":[0.1,5.7,64.0],"glass":[1.0,3.1,10.0]},"RS|T|REF_CAS":{"concrete":[48.5,351.2,861.8],"brick":[0.0,59.0,636.8],"wood":[47.3,73.7,160.0],"steel":[0.1,5.8,63.9],"glass":[0.9,3.0,10.0]},"RS|T|REF_RUS":{"concrete":[48.5,351.2,861.8],"brick":[0.0,59.0,636.8],"wood":[47.3,73.7,160.0],"steel":[0.1,5.8,63.9],"glass":[0.9,3.0,10.0]}};

export const MI_REGIONS = [
  ["ASIA_CHN", "Хятадын бүс (Монгол багтана)"],
  ["REF_RUS", "Орос"],
  ["REF_CAS", "Төв Ази"],
  ["OECD_EEU", "Зүүн Европ"],
];
export const MI_FUNCTIONS = [
  ["RS", "Амины сууц"],
  ["RM", "Олон айлын орон сууц"],
  ["NR", "Орон сууц бус (үйлчилгээ, үйлдвэр)"],
];
export const MI_STRUCTURES = [
  ["C", "Төмөр бетон"],
  ["M", "Өрлөг (тоосго, блок)"],
  ["S", "Ган хийц"],
  ["T", "Мод хийц"],
];
export const MI_MATERIALS = [
  ["concrete", "Бетон"],
  ["brick", "Тоосго, блок"],
  ["steel", "Ган, арматур"],
  ["wood", "Мод"],
  ["glass", "Шил"],
];

/* --- Төсвийн мөрийг масс (кг) руу хөрвүүлэх дүрмүүд ---
   Дарааллаар шалгана — эхний таарсан дүрэм хэрэгжинэ.
   mat: null → RASMI-ийн 5 материалд хамаарахгүй (дулаалга, гипс, кабель, хоолой, тоног…):
   харьцуулалтад оруулахгүй, "таниагүй" гэж ч тоолохгүй.
   Нягт/жин: ФБС 24.4.6 ≈ 0.55м³×2400; зуурмаг, шавардлага ≈ 1800 кг/м³ (2см ≈ 36кг/м², 30 гэж авав);
   стяжка ≈ 2000 кг/м³; швеллер 16 = 14.2 кг/м; винт шон Ø108×4 2.5м ≈ 30 кг;
   цонх: зөвхөн шилний хэсэг ≈ 20 кг/м² (хүрээ тооцохгүй); OSB 12мм ≈ 8, 18мм ≈ 11 кг/м². */
const W = "(?<![а-яөүёa-z])";                    // кирилл үгийн эхлэл (\b кирилл дээр ажилладаггүй)
const word = (s) => new RegExp(W + "(?:" + s + ")", "i");

const RULES = [
  /* 1. RASMI-д хамаарахгүй — бусад дүрэмд андуурч таарахаас өмнө шүүнэ */
  { re: word("будаг|замаск|лак|праймер|грунт"),                                mat: null, why: "будаг, замаск" },
  { re: word("радиатор|коллектор|конвектор|терморегулятор|зуух|насос|тэлэлтийн сав|бойлер"), mat: null, why: "халаалтын тоног" },
  { re: word("кабель|розетка|унтраалга|гэрэлтүүлэг|автомат|самбар|кабель суваг"), mat: null, why: "цахилгаан" },
  { re: word("ppr|pex|pvc|канализаци|хоолой|холбох хэрэгсэл|пресс холболт"),   mat: null, why: "хоолой, холбох хэрэгсэл" },
  { re: word("угаалтуур|суултуур|шүршүүр|ванн"),                                mat: null, why: "сантехник" },
  { re: word("гипс|eps|хөвөн|дулаалга|тусгаарлагч|хальс|мембран|подложка|таталттай тааз|сайдинг|битум|хавтанцар|чулуун хавтан|декоратив|хайрга|элс"), mat: null, why: "дулаалга, өнгөлгөө, бусад" },

  /* 2. Бетон, зуурмаг (RASMI "concrete" — цементэн зуурмаг, стяжка багтана) */
  { re: word("фбс"),                         mat: "concrete", per: { "ш": 1300, "м³": 2400 } },
  { re: word("бетон"),                       mat: "concrete", per: { "м³": 2400, "кг": 1, "т": 1000 } },
  { re: word("стяжк|цутгалт"),               mat: "concrete", per: { "м³": 2000, "кг": 1 } },
  { re: word("зуурмаг"),                     mat: "concrete", per: { "м³": 1800, "кг": 1 } },
  { re: word("цавуу"),                       mat: "concrete", per: { "кг": 1, "т": 1000 } },
  { re: word("шавардлага|штукатур"),         mat: "concrete", per: { "м²": 30, "кг": 1 } },

  /* 3. Өрлөгийн материал (RASMI "bricks") */
  { re: word("хөнгөн блок|эпс блок|газобетон|пеноблок"), mat: "brick", per: { "ш": 21.6, "м³": 600, "кг": 1 } },
  { re: word("цемент блок"),                 mat: "brick", per: { "ш": 15, "м³": 1100, "кг": 1 } },
  { re: /блок 600×300×100/i,                 mat: "brick", per: { "ш": 10, "м³": 550 } },
  { re: word("блок"),                        mat: "brick", per: { "ш": 21.6, "м³": 600, "м²": 120, "кг": 1 } },
  { re: word("тоосго|кирпич"),               mat: "brick", per: { "ш": 3.5, "м³": 1800, "м²": 250, "кг": 1 } },

  /* 4. Цонх — шилний хэсэг (модон цонх ч энд орно, хүрээ тооцохгүй) */
  { re: word("цонх|витраж|шил"),             mat: "glass", per: { "м²": 20, "ш": 30, "кг": 1 } },

  /* 5. Мод — "каркасын мод", "модон бүрээс + каркас" ганд орохгүйн тулд гангаас өмнө */
  { re: /osb дэвсгэр/i,                      mat: "wood", per: { "м²": 11 } },          // 18мм
  { re: word("osb|осб"),                     mat: "wood", per: { "м²": 8, "м³": 650, "кг": 1 } }, // 12мм
  { re: word("ламинат"),                     mat: "wood", per: { "м²": 7, "кг": 1 } },
  { re: word("mdf хаалга|модон хаалга"),     mat: "wood", per: { "ш": 30 } },
  { re: word("мод|дам нуруу|банз|фанер|вагонк|паркет"), mat: "wood", per: { "м³": 500, "м²": 12, "кг": 1, "м": 3 } },

  /* 6. Ган */
  { re: word("винт шон"),                    mat: "steel", per: { "ш": 30, "м": 12 } },
  { re: word("швеллер"),                     mat: "steel", per: { "м": 14.2, "кг": 1, "т": 1000 } },
  { re: word("төмөр хаалга|ган хаалга"),     mat: "steel", per: { "ш": 60 } },
  { re: word("арматур|тор"),                 mat: "steel", per: { "кг": 1, "т": 1000, "м": 0.888 } },
  { re: word("профнастил|төмөр хуудас|металл|ган хийц|дүнз төмөр"), mat: "steel", per: { "м²": 5, "кг": 1, "т": 1000, "м": 8 } },
];

/* Нэгжийг нэг хэлбэрт оруулна: m2/м2 → м², m3/м3 → м³, латин m → м */
const normUnit = (unit) => String(unit || "").trim().toLowerCase()
  .replace(/m/g, "м").replace(/^м2$/, "м²").replace(/^м3$/, "м³");

/* Нэг мөрөөс масс гаргана.
   { mat, kg } — хөрвүүлсэн; { mat: null, why } — RASMI-д хамаарахгүй; null — таниагүй. */
export function lineToMass(name, unit, qty) {
  const q = Number(qty);
  if (!name || !isFinite(q) || q <= 0) return null;
  const u = normUnit(unit);
  for (const r of RULES) {
    if (!r.re.test(name)) continue;
    if (r.mat === null) return { mat: null, why: r.why };
    const k = Object.keys(r.per).find((x) => x === u);
    if (!k) return null;              // нэгж нь тохирохгүй — таниагүйд тооцно
    return { mat: r.mat, kg: q * r.per[k] };
  }
  return null;
}

/* Төсвийн мөрүүдээс кг/м² тооцоолно */
export function computeMI(lines = [], floorArea = 0) {
  const sum = {}, unknown = [], other = [];
  lines.forEach((l) => {
    const m = lineToMass(l.name, l.unit, l.qty);
    if (!m) { if (l.name) unknown.push(l.name); return; }
    if (m.mat === null) { other.push(l.name); return; }
    sum[m.mat] = (sum[m.mat] || 0) + m.kg;
  });
  const mi = {};
  if (floorArea > 0) Object.keys(sum).forEach((k) => { mi[k] = sum[k] / floorArea; });
  return { mi, kg: sum, unknown, other };
}

/* Жишигтэй харьцуулах дүгнэлт */
export function verdict(v, range) {
  if (!range || !isFinite(v)) return null;
  const [p5, p50, p95] = range;
  if (v < p5) return { s: "low", t: "Жишгээс бага", c: "text-sky-600" };
  if (v > p95) return { s: "high", t: "Жишгээс их", c: "text-red-600" };
  if (v < p50 * 0.8 || v > p50 * 1.25) return { s: "edge", t: "Хэвийн хязгаарт", c: "text-amber-600" };
  return { s: "ok", t: "Ердийн түвшин", c: "text-emerald-600" };
}

/* --- Нэг материалын зурвас --- */
function Bar({ value, range }) {
  const [p5, p50, p95] = range;
  const lo = Math.min(p5, value) * 0.9, hi = Math.max(p95, value) * 1.05;
  const pos = (x) => `${Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100))}%`;
  return (
    <div className="relative h-6 w-full rounded-md bg-stone-100">
      <div className="absolute top-1.5 h-3 rounded-sm bg-emerald-200"
        style={{ left: pos(p5), width: `calc(${pos(p95)} - ${pos(p5)})` }} />
      <div className="absolute top-0.5 h-5 w-px bg-emerald-700" style={{ left: pos(p50) }} />
      <div className="absolute top-0 h-6 w-[3px] rounded bg-orange-600" style={{ left: pos(value) }} />
    </div>
  );
}

/* --- Үндсэн самбар --- */
export default function MaterialBenchmark({ lines = [], floorArea = 0 }) {
  const [region, setRegion] = useState("ASIA_CHN");
  const [fn, setFn] = useState("RS");
  const [st, setSt] = useState("M");

  const { mi, unknown, other } = useMemo(() => computeMI(lines, floorArea), [lines, floorArea]);
  const ranges = MI_RANGES[`${fn}|${st}|${region}`] || {};
  const rows = MI_MATERIALS
    .map(([key, label]) => ({ key, label, v: mi[key], r: ranges[key] }))
    .filter((x) => x.v > 0 || x.r);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-stone-800">⚖️ Материалын эрчимшлийн шалгалт</h3>
      <p className="mt-0.5 text-[11px] text-stone-500">
        Таны төсвийн материалын хэмжээг дэлхийн 3072 барилгын судалгааны жишигтэй (кг/м²) харьцуулна.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[[region, setRegion, MI_REGIONS, "Бүс"], [fn, setFn, MI_FUNCTIONS, "Зориулалт"], [st, setSt, MI_STRUCTURES, "Хийц"]].map(
          ([val, set, opts, label], i) => (
            <label key={i} className="block">
              <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{label}</span>
              <select value={val} onChange={(e) => set(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-orange-500 focus:outline-none">
                {opts.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </select>
            </label>
          )
        )}
      </div>

      {floorArea <= 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Эхлээд өрөөгөө зурж талбайгаа гаргана уу.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {rows.map(({ key, label, v, r }) => {
            const vd = verdict(v, r);
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium text-stone-700">{label}</span>
                  <span className="font-mono text-stone-500">
                    {v > 0 ? `${v.toFixed(0)} кг/м²` : "—"}
                    {r && <span className="ml-2 text-[10px] text-stone-400">жишиг {r[0].toFixed(0)}–{r[2].toFixed(0)} (дунд {r[1].toFixed(0)})</span>}
                  </span>
                </div>
                {r && v > 0 && <div className="mt-1"><Bar value={v} range={r} /></div>}
                {vd && <div className={`mt-0.5 text-[10px] font-bold ${vd.c}`}>{vd.t}</div>}
              </div>
            );
          })}
          {!rows.length && <p className="text-xs text-stone-400">Харьцуулах материал олдсонгүй.</p>}
        </div>
      )}

      {unknown.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[10px] text-stone-400">Таниагүй {unknown.length} мөр</summary>
          <p className="mt-1 text-[10px] leading-snug text-stone-400">{[...new Set(unknown)].join(" · ")}</p>
        </details>
      )}
      {other.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[10px] text-stone-400">Жишигт хамаарахгүй {other.length} мөр (дулаалга, гипс, цахилгаан, сантехник…)</summary>
          <p className="mt-1 text-[10px] leading-snug text-stone-400">{[...new Set(other)].join(" · ")}</p>
        </details>
      )}

      <p className="mt-3 border-t border-stone-100 pt-2 text-[10px] leading-snug text-stone-400">
        Жишиг: RASMI (Fishman нар, Scientific Data 2024) — дэлхийн барилгуудын бодит материалын хэмжээнээс гаргасан хязгаар.
        Энэ бол чиглүүлэх үзүүлэлт, норм биш. Хэт өндөр гарвал тоо хэмжээ, нэгжээ шалгаарай.
      </p>
    </div>
  );
}
