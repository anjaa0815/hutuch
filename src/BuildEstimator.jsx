import { useState, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import CloudProjects from "./ProjectStore.jsx";

/* ============================================================
   ХӨТӨЧ — Барилгын Төсвийн Тооцоолуур v9 (hutuch.com)
   • Хэсэг бүрд МАТЕРИАЛЫН СОНГОЛТ: суурь / гадна хана / дотор
     хана / дулаалга / гадна өнгөлгөө / дээвэр / шал / тааз /
     цонх / хаалга — сонголт бүр өөрийн материалын багцтай
   • Ажлын хөлс: нэгж нормоор — хүн/цаг × ангиллын цагийн тариф + НДШ
   • Дурын олон талт өрөө + 2D/3D харагдал (v2-оос)
   Санамж: норм, үнэ нь засварлагдах жишиг утга — албан ёсны
   БНБД 81-06 / 81-94-12 / 81-95-12-той тулгаж баталгаажуулна.
   ============================================================ */

const ROOM_COLORS = ["#bfdbfe", "#bbf7d0", "#fef08a", "#fbcfe8", "#e9d5ff", "#fed7aa", "#a5f3fc", "#e2e8f0"];
let _id = 10;
const uid = () => `r${_id++}`;

const rect = (x, y, w, l) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + l }, { x, y: y + l }];
const lShape = (x, y) => [{ x, y }, { x: x + 5, y }, { x: x + 5, y: y + 2.5 }, { x: x + 2.5, y: y + 2.5 }, { x: x + 2.5, y: y + 5 }, { x, y: y + 5 }];

const DEFAULT_ROOMS = [
  { id: "r1", name: "Унтлагын өрөө", points: rect(0, 0, 4, 4), openings: [
    { id: "o1", type: "win", edge: 0, t: 0.5, w: 1.2, h: 1.4 },
    { id: "o2", type: "door", edge: 2, t: 0.5, w: 0.9, h: 2.1 } ] },
  { id: "r2", name: "Байрны өрөө", points: rect(4, 0, 5, 4), openings: [
    { id: "o3", type: "win", edge: 0, t: 0.33, w: 1.2, h: 1.4 },
    { id: "o4", type: "win", edge: 0, t: 0.67, w: 1.2, h: 1.4 },
    { id: "o5", type: "door", edge: 2, t: 0.5, w: 0.9, h: 2.1 } ] },
  { id: "r3", name: "Гал тогоо", points: rect(0, 4, 4, 3), openings: [
    { id: "o6", type: "win", edge: 2, t: 0.5, w: 1.2, h: 1.4 },
    { id: "o7", type: "door", edge: 0, t: 0.5, w: 0.9, h: 2.1 } ] },
  { id: "r4", name: "Угаалгын өрөө", points: rect(4, 4, 3, 3), openings: [
    { id: "o8", type: "door", edge: 0, t: 0.5, w: 0.8, h: 2.1 } ] },
  { id: "r5", name: "Коридор", points: rect(7, 4, 2, 3), openings: [
    { id: "o9", type: "door", edge: 1, t: 0.5, w: 0.9, h: 2.1 } ] },
];

/* Нүхний (хаалга/цонх) байрлал: ирмэгийн индекс + t (0..1) → метрийн координат */
const openingGeom = (room, o) => {
  const n = room.points.length;
  const j = ((o.edge % n) + n) % n;
  const p = room.points[j], q = room.points[(j + 1) % n];
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 0.001;
  const dx = (q.x - p.x) / len, dy = (q.y - p.y) / len;
  const x = p.x + dx * len * o.t, y = p.y + dy * len * o.t;
  const c = centroid(room.points);
  const side = Math.sign((c.x - x) * -dy + (c.y - y) * dx) || 1;
  return { j, p, q, len, dx, dy, x, y, side, deg: Math.atan2(dy, dx) * 180 / Math.PI };
};

/* Хуучин doors/windows тоолуурт форматыг нүхний байрлалт формат руу хөрвүүлэх */
const migrateOpenings = (r) => {
  if (r.openings) return r;
  const pts = r.points || rect(r.x, r.y, r.w, r.l);
  const edges = pts.map((p, j) => {
    const q = pts[(j + 1) % pts.length];
    return { j, len: Math.hypot(q.x - p.x, q.y - p.y) };
  }).sort((a, b) => b.len - a.len);
  const ops = [];
  const wc = r.windows?.count || 0, dc = r.doors?.count || 0;
  for (let k = 0; k < wc; k++) ops.push({ id: uid(), type: "win", edge: edges[0].j, t: (k + 1) / (wc + 1), w: r.windows.w, h: r.windows.h });
  const de = (edges[1] || edges[0]).j;
  for (let k = 0; k < dc; k++) ops.push({ id: uid(), type: "door", edge: de, t: (k + 1) / (dc + 1), w: r.doors.w, h: r.doors.h });
  const { doors, windows, x, y, w, l, ...rest } = r;
  return { ...rest, points: pts, openings: ops };
};

const DEFAULT_SETTINGS = {
  floors: 1, wallH: 2.8, extT: 0.4, intT: 0.12,
  foundWidth: 0.5, foundDepth: 1.2, roofSlope: 1.15, roofOverhang: 0.5,
  extPerimOverride: 0,
  transportPct: 5, vatPct: 10,
  /* Ажлын хөлс — нэгж нормоор (хүн/цаг × цагийн тариф) */
  rateA: 8000,   // Туслах ажилтан ₮/цаг
  rateB: 15000,  // Мэргэжлийн ажилтан ₮/цаг
  rateC: 22000,  // Өндөр мэргэжлийн ₮/цаг
  ndshPct: 14.5, // НДШ (ажлын хөлс дээр)
  crewSize: 4,   // Багийн хүний тоо (хугацаа тооцоход)
};

/* Ажилчны ангилал */
const RATE_CATS = { A: "Туслах", B: "Мэргэжлийн", C: "Өндөр мэргэжлийн" };
const rateOf = (s, cat) => (cat === "A" ? s.rateA : cat === "C" ? s.rateC : s.rateB);

/* ---------- Геометрийн туслахууд ---------- */
const polyArea = (pts) => Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p.x * q.y - q.x * p.y; }, 0)) / 2;
const polyPerim = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + Math.hypot(q.x - p.x, q.y - p.y); }, 0);
const centroid = (pts) => ({ x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length });

/* ============================================================
   МАТЕРИАЛЫН СИСТЕМҮҮД
   Хэсэг бүр хэд хэдэн сонголттой, сонголт бүр өөрийн
   материалын мөрүүдтэй. qty(g, s, n): g=геометр, s=тохиргоо,
   n=нормын коэфф (засварлагдана).
   Түгээмэл суурь хэмжигдэхүүн:
   g.fLen = суурийн нийт урт, g.extNet = гадна хана цэвэр м²,
   g.wallVol = гадна хананы эзлэхүүн, g.intNet = дотор хана м²
   ============================================================ */
const SYSTEMS = [
  {
    comp: "foundation", label: "Суурь", icon: "🏗", options: [
      { id: "strip_concrete", name: "Цутгамал бетон туузан суурь", items: [
        { key: "f_concrete", name: "Бетон М250", unit: "м³", norm: 1.02, price: 330000, labor: 4.5, cat: "B", hint: "алдагдал", qty: (g, s, n) => g.fVol * n },
        { key: "f_rebar", name: "Арматур Ø12 (каркас)", unit: "кг", norm: 80, price: 3800, labor: 0.03, cat: "B", hint: "кг/м³", qty: (g, s, n) => g.fVol * n },
        { key: "f_gravel", name: "Хайрган дэр (15см)", unit: "м³", norm: 1.1, price: 55000, labor: 1.2, cat: "A", hint: "нягтруулга", qty: (g, s, n) => g.fLen * s.foundWidth * 0.15 * n },
      ]},
      { id: "fbs_block", name: "ФБС бетон блокон суурь", items: [
        { key: "f_fbs", name: "ФБС блок 2400×400×600", unit: "ш", norm: 1.03, price: 285000, labor: 1, cat: "B", hint: "0.55м³/ш", qty: (g, s, n) => (g.fVol / 0.55) * n },
        { key: "f_fbs_mortar", name: "Өрлөгийн зуурмаг", unit: "м³", norm: 0.05, price: 280000, labor: 0, cat: "A", hint: "м³/м³ өрлөг", qty: (g, s, n) => g.fVol * n },
        { key: "f_fbs_gravel", name: "Хайрган дэр (15см)", unit: "м³", norm: 1.1, price: 55000, labor: 1.2, cat: "A", hint: "", qty: (g, s, n) => g.fLen * s.foundWidth * 0.15 * n },
      ]},
      { id: "screw_pile", name: "Винт шонгийн суурь", items: [
        { key: "f_pile", name: "Винт шон Ø108 (2.5м, суулгалттай)", unit: "ш", norm: 1.0, price: 185000, labor: 0, cat: "B", hint: "2м алхам", qty: (g, s, n) => Math.ceil(g.fLen / 2) * n },
        { key: "f_channel", name: "Ростверк швеллер 16", unit: "м", norm: 1.05, price: 48000, labor: 0.4, cat: "C", hint: "", qty: (g, s, n) => g.fLen * n },
      ]},
    ],
  },
  {
    comp: "extWall", label: "Гадна хана", icon: "🧱", options: [
      { id: "eps_block", name: "ЭПС хөнгөн блок 600×300×200", wallColor: 0xe7e5e4, items: [
        { key: "w_eps", name: "ЭПС блок", unit: "ш", norm: 1.05, price: 3400, labor: 0.1, cat: "B", hint: "хагарлын нөөц", qty: (g, s, n) => (g.wallVol / 0.036) * n },
        { key: "w_eps_glue", name: "Өрлөгийн цавуу", unit: "кг", norm: 25, price: 520, labor: 0, cat: "A", hint: "кг/м³", qty: (g, s, n) => g.wallVol * n },
        { key: "w_eps_plaster", name: "Дотор шавардлага", unit: "м²", norm: 1.02, price: 9500, labor: 0.55, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "cement_block", name: "Цемент блок 390×190×190", wallColor: 0xd6d3d1, items: [
        { key: "w_cb", name: "Цемент блок", unit: "ш", norm: 1.05, price: 2200, labor: 0.07, cat: "B", hint: "0.0141м³/ш", qty: (g, s, n) => (g.wallVol / 0.0141) * n },
        { key: "w_cb_mortar", name: "Өрлөгийн зуурмаг", unit: "м³", norm: 0.08, price: 280000, labor: 0, cat: "A", hint: "м³/м³ өрлөг", qty: (g, s, n) => g.wallVol * n },
        { key: "w_cb_plaster", name: "Дотор шавардлага", unit: "м²", norm: 1.02, price: 9500, labor: 0.55, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "brick", name: "Улаан тоосго 250×120×65", wallColor: 0xc2775b, items: [
        { key: "w_brick", name: "Улаан тоосго", unit: "ш", norm: 400, price: 850, labor: 0.014, cat: "B", hint: "ш/м³ зуурмагтай", qty: (g, s, n) => g.wallVol * n },
        { key: "w_brick_mortar", name: "Өрлөгийн зуурмаг", unit: "м³", norm: 0.24, price: 280000, labor: 0, cat: "A", hint: "м³/м³ өрлөг", qty: (g, s, n) => g.wallVol * n },
        { key: "w_brick_plaster", name: "Дотор шавардлага", unit: "м²", norm: 1.02, price: 9500, labor: 0.55, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "timber_frame", name: "Модон каркас + OSB", wallColor: 0xd9b38c, items: [
        { key: "w_tf_timber", name: "Каркасын мод 50×150", unit: "м³", norm: 0.05, price: 980000, labor: 22, cat: "B", hint: "м³/м²", qty: (g, s, n) => g.extNet * n },
        { key: "w_tf_osb", name: "OSB хавтан (2 тал)", unit: "м²", norm: 1.05, price: 28000, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => g.extNet * 2 * n },
        { key: "w_tf_membrane", name: "Салхи, уур тусгаарлагч (2 тал)", unit: "м²", norm: 1.1, price: 4500, labor: 0.05, cat: "A", hint: "", qty: (g, s, n) => g.extNet * 2 * n },
        { key: "w_tf_gypsum", name: "Дотор гипсэн хавтан", unit: "м²", norm: 1.05, price: 14000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
    ],
  },
  {
    comp: "intWall", label: "Дотор хана", icon: "▤", options: [
      { id: "gypsum_sys", name: "Гипсэн хавтан систем (профильтэй)", items: [
        { key: "iw_gypsum", name: "Гипсэн хавтан систем (2 тал)", unit: "м²", norm: 1.05, price: 30000, labor: 0.8, cat: "B", hint: "профиль орсон", qty: (g, s, n) => g.intNet * 2 * n },
      ]},
      { id: "block100", name: "Хөнгөн блок 100мм", items: [
        { key: "iw_block", name: "Блок 600×300×100", unit: "ш", norm: 1.05, price: 2300, labor: 0.09, cat: "B", hint: "5.56ш/м²", qty: (g, s, n) => (g.intNet / 0.18) * n },
        { key: "iw_block_glue", name: "Өрлөгийн цавуу", unit: "кг", norm: 3, price: 520, labor: 0, cat: "A", hint: "кг/м²", qty: (g, s, n) => g.intNet * n },
        { key: "iw_block_plaster", name: "Шавардлага (2 тал)", unit: "м²", norm: 1.02, price: 9500, labor: 0.55, cat: "B", hint: "", qty: (g, s, n) => g.intNet * 2 * n },
      ]},
      { id: "timber_int", name: "Модон каркас + гипсэн хавтан", items: [
        { key: "iw_tf_timber", name: "Каркасын мод 50×100", unit: "м³", norm: 0.03, price: 980000, labor: 20, cat: "B", hint: "м³/м²", qty: (g, s, n) => g.intNet * n },
        { key: "iw_tf_gypsum", name: "Гипсэн хавтан (2 тал)", unit: "м²", norm: 1.05, price: 14000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.intNet * 2 * n },
      ]},
    ],
  },
  {
    comp: "insulation", label: "Дулаалга", icon: "🌡", options: [
      { id: "eps100", name: "EPS хөөсөнцөр 100мм", items: [
        { key: "ins_eps", name: "EPS 100мм + бэхэлгээ", unit: "м²", norm: 1.05, price: 19000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "rockwool100", name: "Чулуун хөвөн 100мм", items: [
        { key: "ins_rw", name: "Чулуун хөвөн 100мм + бэхэлгээ", unit: "м²", norm: 1.05, price: 26000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "eps150", name: "EPS хөөсөнцөр 150мм", items: [
        { key: "ins_eps150", name: "EPS 150мм + бэхэлгээ", unit: "м²", norm: 1.05, price: 27000, labor: 0.55, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "none", name: "Дулаалгагүй", items: [] },
    ],
  },
  {
    comp: "extFinish", label: "Гадна өнгөлгөө", icon: "🎨", options: [
      { id: "decor_plaster", name: "Декоратив шавардлага", items: [
        { key: "ef_plaster", name: "Декоратив шавардлага (тор, праймертай)", unit: "м²", norm: 1.02, price: 16000, labor: 0.7, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "siding", name: "Сайдинг", items: [
        { key: "ef_siding", name: "Сайдинг (обрешётка орсон)", unit: "м²", norm: 1.05, price: 22000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "stone_panel", name: "Хиймэл чулуун өнгөлгөө", items: [
        { key: "ef_stone", name: "Чулуун хавтан + цавуу", unit: "м²", norm: 1.03, price: 48000, labor: 0.9, cat: "C", hint: "", qty: (g, s, n) => g.extNet * n },
      ]},
      { id: "none", name: "Өнгөлгөөгүй", items: [] },
    ],
  },
  {
    comp: "roof", label: "Дээвэр", icon: "⛰", options: [
      { id: "metal_sheet", name: "Төмөр хуудас (профнастил)", roofColor: 0x57534e, items: [
        { key: "r_timber1", name: "Дээврийн мод (дам, шургаага)", unit: "м³", norm: 0.025, price: 980000, labor: 14, cat: "B", hint: "м³/м²", qty: (g, s, n) => g.roofArea * n },
        { key: "r_metal", name: "Профнастил С21", unit: "м²", norm: 1.12, price: 34000, labor: 0.35, cat: "B", hint: "давхардал", qty: (g, s, n) => g.roofArea * n },
      ]},
      { id: "metal_tile", name: "Металл ваар", roofColor: 0x7f1d1d, items: [
        { key: "r_timber2", name: "Дээврийн мод (дам, шургаага)", unit: "м³", norm: 0.025, price: 980000, labor: 14, cat: "B", hint: "м³/м²", qty: (g, s, n) => g.roofArea * n },
        { key: "r_mtile", name: "Металл ваар", unit: "м²", norm: 1.15, price: 42000, labor: 0.4, cat: "B", hint: "давхардал", qty: (g, s, n) => g.roofArea * n },
      ]},
      { id: "shingle", name: "Битум ваар (зөөлөн дээвэр)", roofColor: 0x374151, items: [
        { key: "r_timber3", name: "Дээврийн мод (дам, шургаага)", unit: "м³", norm: 0.025, price: 980000, labor: 14, cat: "B", hint: "м³/м²", qty: (g, s, n) => g.roofArea * n },
        { key: "r_osb", name: "OSB дэвсгэр", unit: "м²", norm: 1.05, price: 28000, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => g.roofArea * n },
        { key: "r_shingle", name: "Битум ваар", unit: "м²", norm: 1.08, price: 38000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.roofArea * n },
      ]},
    ],
  },
  {
    comp: "floor", label: "Шал", icon: "▦", options: [
      { id: "laminate", name: "Ламинат", items: [
        { key: "fl_screed1", name: "Шалны цутгалт (5см)", unit: "м³", norm: 1.02, price: 310000, labor: 6, cat: "B", hint: "", qty: (g, s, n) => g.floorArea * 0.05 * n },
        { key: "fl_underlay", name: "Дэвсгэр (подложка)", unit: "м²", norm: 1.05, price: 3500, labor: 0.03, cat: "A", hint: "", qty: (g, s, n) => g.floorArea * n },
        { key: "fl_laminate", name: "Ламинат 8мм 32кл", unit: "м²", norm: 1.05, price: 42000, labor: 0.25, cat: "B", hint: "эсгэлт", qty: (g, s, n) => g.floorArea * n },
      ]},
      { id: "parquet", name: "Паркет", items: [
        { key: "fl_screed2", name: "Шалны цутгалт (5см)", unit: "м³", norm: 1.02, price: 310000, labor: 6, cat: "B", hint: "", qty: (g, s, n) => g.floorArea * 0.05 * n },
        { key: "fl_parquet", name: "Модон паркет", unit: "м²", norm: 1.05, price: 95000, labor: 0.6, cat: "C", hint: "", qty: (g, s, n) => g.floorArea * n },
      ]},
      { id: "tile", name: "Хавтанцар (керамик)", items: [
        { key: "fl_screed3", name: "Шалны цутгалт (5см)", unit: "м³", norm: 1.02, price: 310000, labor: 6, cat: "B", hint: "", qty: (g, s, n) => g.floorArea * 0.05 * n },
        { key: "fl_tile", name: "Керамик хавтанцар", unit: "м²", norm: 1.08, price: 35000, labor: 0.9, cat: "B", hint: "эсгэлт", qty: (g, s, n) => g.floorArea * n },
        { key: "fl_tile_glue", name: "Хавтанцрын цавуу", unit: "кг", norm: 5, price: 800, labor: 0, cat: "A", hint: "кг/м²", qty: (g, s, n) => g.floorArea * n },
      ]},
      { id: "polished", name: "Өнгөлсөн бетон", items: [
        { key: "fl_screed4", name: "Шалны цутгалт (7см)", unit: "м³", norm: 1.02, price: 310000, labor: 6, cat: "B", hint: "", qty: (g, s, n) => g.floorArea * 0.07 * n },
        { key: "fl_polish", name: "Бетон өнгөлгөө, лак", unit: "м²", norm: 1.0, price: 18000, labor: 0.3, cat: "C", hint: "", qty: (g, s, n) => g.floorArea * n },
      ]},
    ],
  },
  {
    comp: "ceiling", label: "Тааз", icon: "⬜", options: [
      { id: "gypsum_ceil", name: "Гипсэн хавтан тааз", items: [
        { key: "c_gypsum", name: "Таазны гипсэн хавтан систем", unit: "м²", norm: 1.05, price: 24000, labor: 0.7, cat: "B", hint: "", qty: (g, s, n) => g.floorArea * n },
      ]},
      { id: "stretch", name: "Таталттай тааз", items: [
        { key: "c_stretch", name: "Таталттай тааз (угсралттай)", unit: "м²", norm: 1.0, price: 35000, labor: 0, cat: "B", hint: "", qty: (g, s, n) => g.floorArea * n },
      ]},
      { id: "wood_lining", name: "Модон бүрээс (вагонка)", items: [
        { key: "c_wood", name: "Модон бүрээс + каркас", unit: "м²", norm: 1.05, price: 45000, labor: 0.8, cat: "B", hint: "", qty: (g, s, n) => g.floorArea * n },
      ]},
    ],
  },
  {
    comp: "windows", label: "Цонх", icon: "🪟", options: [
      { id: "pvc", name: "Вакум цонх (PVC)", items: [
        { key: "win_pvc", name: "Вакум цонх, угсралттай", unit: "м²", norm: 1.0, price: 390000, labor: 0, cat: "B", hint: "", qty: (g, s, n) => g.winArea * g.floors * n },
      ]},
      { id: "wood_win", name: "Модон цонх", items: [
        { key: "win_wood", name: "Модон цонх, угсралттай", unit: "м²", norm: 1.0, price: 520000, labor: 0, cat: "B", hint: "", qty: (g, s, n) => g.winArea * g.floors * n },
      ]},
      { id: "alu", name: "Алюмин цонх", items: [
        { key: "win_alu", name: "Алюмин цонх, угсралттай", unit: "м²", norm: 1.0, price: 460000, labor: 0, cat: "B", hint: "", qty: (g, s, n) => g.winArea * g.floors * n },
      ]},
    ],
  },
  {
    comp: "doors", label: "Хаалга", icon: "🚪", options: [
      { id: "wood_door", name: "Модон хаалга", items: [
        { key: "d_wood", name: "Модон хаалга, угсралттай", unit: "ш", norm: 1.0, price: 460000, labor: 0, cat: "B", hint: "", qty: (g, s, n) => g.doorCount * g.floors * n },
      ]},
      { id: "mdf_door", name: "MDF хаалга", items: [
        { key: "d_mdf", name: "MDF хаалга, угсралттай", unit: "ш", norm: 1.0, price: 320000, labor: 0, cat: "B", hint: "", qty: (g, s, n) => g.doorCount * g.floors * n },
      ]},
      { id: "steel_door", name: "Төмөр хаалга (гадна)", items: [
        { key: "d_steel", name: "Төмөр хаалга, угсралттай", unit: "ш", norm: 1.0, price: 750000, labor: 0, cat: "B", hint: "", qty: (g, s, n) => g.doorCount * g.floors * n },
      ]},
    ],
  },
  {
    comp: "electric", label: "Цахилгаан", icon: "⚡", options: [
      { id: "concealed", name: "Далд монтаж (шавардлагад)", items: [
        { key: "el_cable25", name: "Кабель ВВГнг 3×2.5 (розетка)", unit: "м", norm: 10, price: 3200, labor: 0.08, cat: "B", hint: "м/цэг", qty: (g, s, n) => g.mep.sockets * n },
        { key: "el_cable15", name: "Кабель ВВГнг 3×1.5 (гэрэл)", unit: "м", norm: 8, price: 2400, labor: 0.08, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.lights + g.mep.switches) * n },
        { key: "el_socket", name: "Розетка (суулгагдмал)", unit: "ш", norm: 1, price: 8500, labor: 0.4, cat: "B", hint: "", qty: (g, s, n) => g.mep.sockets * n },
        { key: "el_switch", name: "Унтраалга", unit: "ш", norm: 1, price: 7500, labor: 0.4, cat: "B", hint: "", qty: (g, s, n) => g.mep.switches * n },
        { key: "el_light", name: "Гэрэлтүүлэг (LED)", unit: "ш", norm: 1, price: 45000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.mep.lights * n },
        { key: "el_breaker", name: "Автомат таслуур", unit: "ш", norm: 1, price: 18000, labor: 0.3, cat: "C", hint: "", qty: (g, s, n) => (Math.ceil(g.mep.sockets / 5) + 2) * n },
        { key: "el_panel", name: "Хуваарилах самбар", unit: "ш", norm: 1, price: 140000, labor: 4, cat: "C", hint: "", qty: (g, s, n) => 1 * n },
      ]},
      { id: "exposed", name: "Ил монтаж (кабель суваг)", items: [
        { key: "el_cable25x", name: "Кабель ВВГнг 3×2.5 (розетка)", unit: "м", norm: 10, price: 3200, labor: 0.04, cat: "B", hint: "м/цэг", qty: (g, s, n) => g.mep.sockets * n },
        { key: "el_cable15x", name: "Кабель ВВГнг 3×1.5 (гэрэл)", unit: "м", norm: 8, price: 2400, labor: 0.04, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.lights + g.mep.switches) * n },
        { key: "el_duct", name: "Кабель суваг 25×16", unit: "м", norm: 0.8, price: 2800, labor: 0.1, cat: "B", hint: "м/м кабель", qty: (g, s, n) => (g.mep.sockets * 10 + (g.mep.lights + g.mep.switches) * 8) * n },
        { key: "el_socketx", name: "Розетка (ил)", unit: "ш", norm: 1, price: 7500, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => g.mep.sockets * n },
        { key: "el_switchx", name: "Унтраалга (ил)", unit: "ш", norm: 1, price: 6500, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => g.mep.switches * n },
        { key: "el_lightx", name: "Гэрэлтүүлэг (LED)", unit: "ш", norm: 1, price: 45000, labor: 0.5, cat: "B", hint: "", qty: (g, s, n) => g.mep.lights * n },
        { key: "el_breakerx", name: "Автомат таслуур", unit: "ш", norm: 1, price: 18000, labor: 0.3, cat: "C", hint: "", qty: (g, s, n) => (Math.ceil(g.mep.sockets / 5) + 2) * n },
        { key: "el_panelx", name: "Хуваарилах самбар", unit: "ш", norm: 1, price: 140000, labor: 4, cat: "C", hint: "", qty: (g, s, n) => 1 * n },
      ]},
      { id: "none", name: "Цахилгаангүй (тооцохгүй)", items: [] },
    ],
  },
  {
    comp: "plumbing", label: "Сантехник", icon: "🚿", options: [
      { id: "ppr", name: "PPR хоолойн систем", items: [
        { key: "pl_cold", name: "PPR хоолой Ø25 (хүйтэн ус)", unit: "м", norm: 5, price: 4500, labor: 0.3, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.sinks + g.mep.toilets + g.mep.showers) * n },
        { key: "pl_hot", name: "PPR хоолой Ø25 (халуун ус)", unit: "м", norm: 5, price: 5500, labor: 0.3, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.sinks + g.mep.showers) * n },
        { key: "pl_fit", name: "Холбох хэрэгсэл (цэг тутамд багц)", unit: "багц", norm: 1, price: 28000, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => (g.mep.sinks + g.mep.toilets + g.mep.showers) * n },
        { key: "pl_sew50", name: "Канализаци PVC Ø50", unit: "м", norm: 4, price: 8000, labor: 0.25, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.sinks + g.mep.showers) * n },
        { key: "pl_sew110", name: "Канализаци PVC Ø110", unit: "м", norm: 1, price: 15000, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => (g.mep.toilets * 4 + 6) * n },
        { key: "pl_sink", name: "Угаалтуур (холигчтой)", unit: "ш", norm: 1, price: 220000, labor: 2, cat: "B", hint: "", qty: (g, s, n) => g.mep.sinks * n },
        { key: "pl_toilet", name: "Суултуур", unit: "ш", norm: 1, price: 380000, labor: 2, cat: "B", hint: "", qty: (g, s, n) => g.mep.toilets * n },
        { key: "pl_shower", name: "Шүршүүрийн бүрэн иж бүрдэл", unit: "ш", norm: 1, price: 550000, labor: 3, cat: "B", hint: "", qty: (g, s, n) => g.mep.showers * n },
      ]},
      { id: "pex", name: "PEX хоолойн систем (коллектортой)", items: [
        { key: "px_cold", name: "PEX хоолой 16 (хүйтэн ус)", unit: "м", norm: 6, price: 3800, labor: 0.2, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.sinks + g.mep.toilets + g.mep.showers) * n },
        { key: "px_hot", name: "PEX хоолой 16 (халуун ус)", unit: "м", norm: 6, price: 3800, labor: 0.2, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.sinks + g.mep.showers) * n },
        { key: "px_manifold", name: "Коллектор (хос)", unit: "ш", norm: 1, price: 320000, labor: 3, cat: "C", hint: "", qty: (g, s, n) => 1 * n },
        { key: "px_fit", name: "Пресс холболт (цэг тутамд)", unit: "багц", norm: 1, price: 42000, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => (g.mep.sinks + g.mep.toilets + g.mep.showers) * n },
        { key: "px_sew50", name: "Канализаци PVC Ø50", unit: "м", norm: 4, price: 8000, labor: 0.25, cat: "B", hint: "м/цэг", qty: (g, s, n) => (g.mep.sinks + g.mep.showers) * n },
        { key: "px_sew110", name: "Канализаци PVC Ø110", unit: "м", norm: 1, price: 15000, labor: 0.3, cat: "B", hint: "", qty: (g, s, n) => (g.mep.toilets * 4 + 6) * n },
        { key: "px_sink", name: "Угаалтуур (холигчтой)", unit: "ш", norm: 1, price: 220000, labor: 2, cat: "B", hint: "", qty: (g, s, n) => g.mep.sinks * n },
        { key: "px_toilet", name: "Суултуур", unit: "ш", norm: 1, price: 380000, labor: 2, cat: "B", hint: "", qty: (g, s, n) => g.mep.toilets * n },
        { key: "px_shower", name: "Шүршүүрийн бүрэн иж бүрдэл", unit: "ш", norm: 1, price: 550000, labor: 3, cat: "B", hint: "", qty: (g, s, n) => g.mep.showers * n },
      ]},
      { id: "none", name: "Сантехникгүй (тооцохгүй)", items: [] },
    ],
  },
  {
    comp: "heating", label: "Халаалт", icon: "🔥", options: [
      { id: "radiator", name: "Комби зуух + радиатор", items: [
        { key: "ht_boiler", name: "Комби зуух 24кВт (хий/цахилгаан)", unit: "ш", norm: 1, price: 2900000, labor: 8, cat: "C", hint: "", qty: (g, s, n) => 1 * n },
        { key: "ht_rad", name: "Алюмин радиатор (10 секц)", unit: "ш", norm: 1, price: 290000, labor: 2.5, cat: "B", hint: "", qty: (g, s, n) => g.mep.radiators * n },
        { key: "ht_pipe", name: "PPR хоолой Ø25 (халаалтын шугам)", unit: "м", norm: 8, price: 5500, labor: 0.3, cat: "B", hint: "м/радиатор", qty: (g, s, n) => g.mep.radiators * n },
        { key: "ht_valve", name: "Терморегулятор хавхлаг", unit: "ш", norm: 1, price: 45000, labor: 0.4, cat: "B", hint: "", qty: (g, s, n) => g.mep.radiators * n },
        { key: "ht_exp", name: "Тэлэлтийн сав, насос, аюулгүйн бүлэг", unit: "багц", norm: 1, price: 380000, labor: 3, cat: "C", hint: "", qty: (g, s, n) => 1 * n },
      ]},
      { id: "underfloor", name: "Усан шалны халаалт", items: [
        { key: "uf_boiler", name: "Комби зуух 24кВт", unit: "ш", norm: 1, price: 2900000, labor: 8, cat: "C", hint: "", qty: (g, s, n) => 1 * n },
        { key: "uf_pipe", name: "PEX халаалтын хоолой 16", unit: "м", norm: 5, price: 3500, labor: 0.12, cat: "B", hint: "м/м² шал", qty: (g, s, n) => g.floorArea * n },
        { key: "uf_manifold", name: "Коллектор (урсгал тохируулгатай)", unit: "ш", norm: 1, price: 480000, labor: 3, cat: "C", hint: "давхар тутамд", qty: (g, s, n) => g.floors * n },
        { key: "uf_insul", name: "Шалны дулаалга + тусгаарлагч хальс", unit: "м²", norm: 1.05, price: 9500, labor: 0.08, cat: "A", hint: "", qty: (g, s, n) => g.floorArea * n },
      ]},
      { id: "electric_heat", name: "Цахилгаан конвектор", items: [
        { key: "eh_conv", name: "Цахилгаан конвектор 2кВт", unit: "ш", norm: 1, price: 360000, labor: 0.5, cat: "B", hint: "≈15м² тутамд", qty: (g, s, n) => Math.ceil(g.floorArea / 15) * n },
        { key: "eh_cable", name: "Тэжээлийн кабель 3×2.5", unit: "м", norm: 10, price: 3200, labor: 0.06, cat: "B", hint: "м/конвектор", qty: (g, s, n) => Math.ceil(g.floorArea / 15) * n },
      ]},
      { id: "none", name: "Халаалтгүй (тооцохгүй)", items: [] },
    ],
  },
];

/* Сонголтоос хамаарахгүй нийтлэг материал */
const COMMON_ITEMS = [
  { key: "cm_putty", group: "Дотор заслын нийтлэг", name: "Замаск", unit: "кг", norm: 1.2, price: 2600, labor: 0.25, cat: "B", hint: "кг/м²", qty: (g, s, n) => (g.extNet + g.intNet * 2 + g.floorArea) * n },
  { key: "cm_paint", group: "Дотор заслын нийтлэг", name: "Дотор будаг (2 үе)", unit: "кг", norm: 0.4, price: 14000, labor: 0.4, cat: "B", hint: "кг/м²", qty: (g, s, n) => (g.extNet + g.intNet * 2 + g.floorArea) * n },
];

const DEFAULT_SELECTIONS = {
  foundation: "strip_concrete", extWall: "eps_block", intWall: "gypsum_sys",
  insulation: "eps100", extFinish: "decor_plaster", roof: "metal_sheet",
  floor: "laminate", ceiling: "gypsum_ceil", windows: "pvc", doors: "wood_door",
  electric: "concealed", plumbing: "ppr", heating: "radiator",
};

/* Инженерийн цэгүүдийн тоо (бүх барилгаар) */
const DEFAULT_MEP = { sockets: 20, switches: 6, lights: 9, sinks: 2, toilets: 1, showers: 1, radiators: 6 };

/* Планаас цэгүүдийг санал болгох */
const suggestMep = (rooms, geo) => ({
  sockets: rooms.length * 4 * geo.floors,
  switches: rooms.length * geo.floors,
  lights: (rooms.length + Math.ceil(geo.sumArea / 20)) * geo.floors,
  sinks: Math.max(2, Math.round(geo.floors * 1.5)),
  toilets: Math.max(1, geo.floors),
  showers: Math.max(1, geo.floors),
  radiators: Math.ceil(geo.floorArea / 12),
});

/* Бүх сонголтын бүх материалын анхны норм/үнэ */
const ALL_ITEMS = [...SYSTEMS.flatMap((sys) => sys.options.flatMap((o) => o.items)), ...COMMON_ITEMS];
const DEFAULT_NORMS = Object.fromEntries(ALL_ITEMS.map((d) => [d.key, d.norm]));
const DEFAULT_PRICES = Object.fromEntries(ALL_ITEMS.map((d) => [d.key, d.price]));
const DEFAULT_LABOR = Object.fromEntries(ALL_ITEMS.map((d) => [d.key, d.labor ?? 0]));

function computeGeometry(rooms, s) {
  if (!rooms.length) return null;
  const allPts = rooms.flatMap((r) => r.points);
  const sumArea = rooms.reduce((a, r) => a + polyArea(r.points), 0);
  const totalPerim = rooms.reduce((a, r) => a + polyPerim(r.points), 0);
  const minX = Math.min(...allPts.map((p) => p.x)), maxX = Math.max(...allPts.map((p) => p.x));
  const minY = Math.min(...allPts.map((p) => p.y)), maxY = Math.max(...allPts.map((p) => p.y));
  const bw = maxX - minX, bl = maxY - minY;
  const autoExt = 2 * (bw + bl);
  const extPerim = s.extPerimOverride > 0 ? s.extPerimOverride : autoExt;
  const intLen = Math.max(0, (totalPerim - extPerim) / 2);
  const allOps = rooms.flatMap((r) => r.openings || []);
  const winArea = allOps.filter((o) => o.type === "win").reduce((a, o) => a + o.w * o.h, 0);
  const winCount = allOps.filter((o) => o.type === "win").length;
  const doorArea = allOps.filter((o) => o.type === "door").reduce((a, o) => a + o.w * o.h, 0);
  const doorCount = allOps.filter((o) => o.type === "door").length;
  const f = s.floors, h = s.wallH;
  const extGross = extPerim * h * f;
  const extNet = Math.max(0, extGross - winArea * f);
  const intGross = intLen * h * f;
  const intNet = Math.max(0, intGross - doorArea * f);
  const floorArea = sumArea * f;
  const roofArea = (bw + 2 * s.roofOverhang) * (bl + 2 * s.roofOverhang) * s.roofSlope;
  const fLen = extPerim + intLen * 0.5;
  const fVol = fLen * s.foundWidth * s.foundDepth;
  const wallVol = extNet * s.extT;
  return { sumArea, totalPerim, extPerim, autoExt, intLen, winArea, winCount, doorArea, doorCount, extGross, extNet, intGross, intNet, floorArea, footprint: bw * bl, roofArea, bw, bl, minX, minY, maxX, maxY, floors: f, fLen, fVol, wallVol };
}

const fmt = (n, d = 1) => Number(n.toFixed(d)).toLocaleString("en-US");
const fmtT = (n) => Math.round(n).toLocaleString("en-US") + "₮";
const snap = (v, st = 0.25) => Math.round(v / st) * st;

/* ---------- Жижиг UI ---------- */
function NumInput({ value, onChange, step = 0.1, min, className = "" }) {
  return (
    <input type="number" value={value} step={step} min={min}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={"w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-right font-mono text-sm text-stone-800 focus:border-orange-500 focus:outline-none " + className} />
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</span>
      {children}
    </label>
  );
}

/* ---------- Инженерийн цэгүүдийн самбар ---------- */
function MepPanel({ mep, setMep, onSuggest }) {
  const FIELDS = [
    ["sockets", "🔌 Розетка"], ["switches", "🎚 Унтраалга"], ["lights", "💡 Гэрэл"],
    ["sinks", "🚰 Угаалтуур"], ["toilets", "🚽 Суултуур"], ["showers", "🚿 Шүршүүр"], ["radiators", "♨️ Радиатор"],
  ];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-stone-500">Инженерийн цэгүүдийн тоо (бүх барилгаар)</h3>
        <button onClick={onSuggest}
          className="rounded-lg bg-orange-100 px-2.5 py-1 text-[11px] font-medium text-orange-700 hover:bg-orange-200">
          ✨ Планаас санал болгох
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
        {FIELDS.map(([k, lbl]) => (
          <Field key={k} label={lbl}>
            <NumInput value={mep[k]} step={1} min={0} onChange={(v) => setMep((m) => ({ ...m, [k]: Math.max(0, Math.round(v)) }))} />
          </Field>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-stone-400">Цахилгаан, сантехник, халаалтын материал эдгээр цэгийн тооноос бодогдоно. Радиаторын санал = талбай ÷ 12м².</p>
    </div>
  );
}

/* ---------- Материалын сонголтын самбар ---------- */
function MaterialSelector({ selections, setSelections, lines }) {
  const costOf = (comp) => {
    const sys = SYSTEMS.find((x) => x.comp === comp);
    const opt = sys.options.find((o) => o.id === selections[comp]);
    const keys = new Set(opt.items.map((i) => i.key));
    return lines.filter((l) => keys.has(l.key)).reduce((a, l) => a + l.total, 0);
  };
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {SYSTEMS.map((sys) => (
        <div key={sys.comp} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{sys.icon} {sys.label}</span>
            <span className="font-mono text-[11px] font-semibold text-orange-700">{fmtT(costOf(sys.comp))}</span>
          </div>
          <select value={selections[sys.comp]}
            onChange={(e) => setSelections((sel) => ({ ...sel, [sys.comp]: e.target.value }))}
            className="w-full cursor-pointer rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none">
            {sys.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

/* ---------- 2D SVG план ---------- */
function PlanCanvas({ rooms, setRooms, selected, setSelected }) {
  const SCALE = 42, PAD = 1.5;
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const allPts = rooms.flatMap((r) => r.points);
  const minX = Math.min(0, ...allPts.map((p) => p.x)), maxX = Math.max(10, ...allPts.map((p) => p.x));
  const minY = Math.min(0, ...allPts.map((p) => p.y)), maxY = Math.max(8, ...allPts.map((p) => p.y));
  const vw = (maxX - minX + PAD * 2) * SCALE, vh = (maxY - minY + PAD * 2) * SCALE;
  const ox = (-minX + PAD) * SCALE, oy = (-minY + PAD) * SCALE;
  const X = (x) => ox + x * SCALE, Y = (y) => oy + y * SCALE;

  const toM = (e) => {
    const rc = svgRef.current.getBoundingClientRect();
    const sx = vw / rc.width;
    return { x: ((e.clientX - rc.left) * sx - ox) / SCALE, y: ((e.clientY - rc.top) * sx - oy) / SCALE };
  };
  const startRoomDrag = (e, room) => {
    e.preventDefault();
    setSelected(room.id);
    dragRef.current = { mode: "room", id: room.id, start: toM(e), orig: room.points.map((p) => ({ ...p })) };
  };
  const startVertexDrag = (e, room, idx) => {
    e.preventDefault(); e.stopPropagation();
    setSelected(room.id);
    dragRef.current = { mode: "vertex", id: room.id, idx };
  };
  const startMidDrag = (e, room, idx) => {
    e.preventDefault(); e.stopPropagation();
    setSelected(room.id);
    const p = room.points[idx], q = room.points[(idx + 1) % room.points.length];
    const mid = { x: snap((p.x + q.x) / 2), y: snap((p.y + q.y) / 2) };
    setRooms((rs) => rs.map((r) => r.id === room.id
      ? { ...r, points: [...r.points.slice(0, idx + 1), mid, ...r.points.slice(idx + 1)],
          openings: (r.openings || []).map((o) => (o.edge > idx ? { ...o, edge: o.edge + 1 } : o)) } : r));
    dragRef.current = { mode: "vertex", id: room.id, idx: idx + 1 };
  };
  const startOpeningDrag = (e, room, opening) => {
    e.preventDefault(); e.stopPropagation();
    setSelected(room.id);
    dragRef.current = { mode: "opening", id: room.id, oid: opening.id };
  };
  const onMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const m = toM(e);
    if (d.mode === "room") {
      const dx = snap(m.x - d.start.x, 0.5), dy = snap(m.y - d.start.y, 0.5);
      setRooms((rs) => rs.map((r) => r.id === d.id ? { ...r, points: d.orig.map((p) => ({ x: p.x + dx, y: p.y + dy })) } : r));
    } else if (d.mode === "opening") {
      setRooms((rs) => rs.map((r) => {
        if (r.id !== d.id) return r;
        /* Заагчид хамгийн ойр ирмэгийг олж, түүн дээрх t байрлалыг тооцно */
        let best = null;
        r.points.forEach((p, j) => {
          const q = r.points[(j + 1) % r.points.length];
          const ex = q.x - p.x, ey = q.y - p.y;
          const len2 = ex * ex + ey * ey;
          if (len2 < 1e-6) return;
          const t = Math.max(0.05, Math.min(0.95, ((m.x - p.x) * ex + (m.y - p.y) * ey) / len2));
          const px = p.x + ex * t, py = p.y + ey * t;
          const dist = Math.hypot(m.x - px, m.y - py);
          if (!best || dist < best.dist) best = { j, t, dist };
        });
        if (!best) return r;
        return { ...r, openings: (r.openings || []).map((o) =>
          o.id === d.oid ? { ...o, edge: best.j, t: Math.round(best.t * 40) / 40 } : o) };
      }));
    } else {
      setRooms((rs) => rs.map((r) => r.id === d.id
        ? { ...r, points: r.points.map((p, i) => (i === d.idx ? { x: snap(m.x), y: snap(m.y) } : p)) } : r));
    }
  };
  const onUp = () => (dragRef.current = null);
  const deleteVertex = (room, idx) => {
    if (room.points.length <= 3) return;
    setRooms((rs) => rs.map((r) => r.id === room.id
      ? { ...r, points: r.points.filter((_, i) => i !== idx),
          openings: (r.openings || []).map((o) => (o.edge >= idx ? { ...o, edge: Math.max(0, o.edge - 1) } : o)) } : r));
  };

  const gridLines = [];
  for (let i = Math.floor(minX - PAD); i <= Math.ceil(maxX + PAD); i++)
    gridLines.push(<line key={"v" + i} x1={X(i)} y1={0} x2={X(i)} y2={vh} stroke="#d6d3d1" strokeWidth={i === 0 ? 1.2 : 0.5} />);
  for (let i = Math.floor(minY - PAD); i <= Math.ceil(maxY + PAD); i++)
    gridLines.push(<line key={"h" + i} x1={0} y1={Y(i)} x2={vw} y2={Y(i)} stroke="#d6d3d1" strokeWidth={i === 0 ? 1.2 : 0.5} />);

  const rMinX = Math.min(...allPts.map((p) => p.x)), rMaxX = Math.max(...allPts.map((p) => p.x));
  const rMinY = Math.min(...allPts.map((p) => p.y)), rMaxY = Math.max(...allPts.map((p) => p.y));

  return (
    <div className="overflow-auto rounded-xl border border-stone-300 bg-stone-50 shadow-inner">
      <svg ref={svgRef} viewBox={`0 0 ${vw} ${vh}`} className="min-w-[520px] touch-none select-none"
        onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
        {gridLines}
        {rooms.map((r, i) => {
          const sel = selected === r.id;
          const c = centroid(r.points);
          const path = r.points.map((p, j) => `${j ? "L" : "M"}${X(p.x)},${Y(p.y)}`).join(" ") + " Z";
          /* Хаалга, цонх — хадгалсан байрлалаас (ирмэг + t) */
          const syms = (r.openings || []).map((o) => {
            const gm = openingGeom(r, o);
            return { o, x: X(gm.x), y: Y(gm.y), deg: gm.deg, w: Math.min(o.w, gm.len * 0.8) * SCALE, side: gm.side, lenM: gm.len };
          });
          /* Сонгосон өрөөний ханын хэмжээс — гадагш офсеттэй, унших чиглэлээр эргүүлсэн */
          const dims = sel ? r.points.map((p, j) => {
            const q = r.points[(j + 1) % r.points.length];
            const len = Math.hypot(q.x - p.x, q.y - p.y);
            if (len < 0.3) return null;
            const dx = (q.x - p.x) / len, dy = (q.y - p.y) / len;
            const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
            const nx = -dy, ny = dx;
            const s = Math.sign((c.x - mx) * nx + (c.y - my) * ny) || 1; // дотогшийн тал
            let deg = Math.atan2(dy, dx) * 180 / Math.PI;
            if (deg > 90 || deg <= -90) deg += 180;
            return { j, x: X(mx - nx * s * 0.4), y: Y(my - ny * s * 0.4), deg, len };
          }).filter(Boolean) : [];
          return (
            <g key={r.id}>
              <path d={path} fill={ROOM_COLORS[i % ROOM_COLORS.length]}
                stroke={sel ? "#ea580c" : "#57534e"} strokeWidth={sel ? 2.5 : 1.4}
                strokeDasharray={sel ? "" : "6 3"} className="cursor-move"
                onPointerDown={(e) => startRoomDrag(e, r)} />
              <text x={X(c.x)} y={Y(c.y) - 5} textAnchor="middle" fontSize={13} fontWeight="600" fill="#292524" pointerEvents="none">{r.name}</text>
              <text x={X(c.x)} y={Y(c.y) + 13} textAnchor="middle" fontSize={11} fill="#57534e" fontFamily="monospace" pointerEvents="none">
                {fmt(polyArea(r.points), 1)}м²
              </text>
              {/* Хаалга, цонхны стандарт тэмдэглэгээ — чирж хана дээгүүр зөөнө */}
              {syms.map((sm) => (
                <g key={sm.o.id} transform={`translate(${sm.x} ${sm.y}) rotate(${sm.deg})`}
                  className="cursor-grab"
                  onPointerDown={(e) => startOpeningDrag(e, r, sm.o)}>
                  <rect x={-sm.w / 2 - 4} y={-10} width={sm.w + 8} height={20} fill="transparent">
                    <title>Чирж хананы дагуу болон өөр хана руу зөөнө</title>
                  </rect>
                  {sm.o.type === "win" ? (
                    <g pointerEvents="none">
                      <rect x={-sm.w / 2} y={-4} width={sm.w} height={8} fill="#fff" stroke="#292524" strokeWidth={1.1} />
                      <line x1={-sm.w / 2} y1={0} x2={sm.w / 2} y2={0} stroke="#292524" strokeWidth={1.1} />
                    </g>
                  ) : (
                    <g pointerEvents="none">
                      <rect x={-sm.w / 2} y={-3.5} width={sm.w} height={7} fill="#fff" stroke="none" />
                      <line x1={-sm.w / 2} y1={-3.5} x2={-sm.w / 2} y2={3.5} stroke="#292524" strokeWidth={1.2} />
                      <line x1={sm.w / 2} y1={-3.5} x2={sm.w / 2} y2={3.5} stroke="#292524" strokeWidth={1.2} />
                      <line x1={-sm.w / 2} y1={0} x2={-sm.w / 2} y2={sm.side * sm.w} stroke="#292524" strokeWidth={1.6} />
                      <path d={`M ${sm.w / 2} 0 A ${sm.w} ${sm.w} 0 0 ${sm.side > 0 ? 1 : 0} ${-sm.w / 2} ${sm.side * sm.w}`}
                        fill="none" stroke="#78716c" strokeWidth={1} strokeDasharray="3 2" />
                    </g>
                  )}
                </g>
              ))}
              {/* Сонгосон өрөө: ханын урт + хаалга, цонхны хэмжээ */}
              {dims.map((d) => (
                <text key={"dim" + d.j} x={d.x} y={d.y}
                  transform={`rotate(${d.deg} ${d.x} ${d.y})`}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={10.5} fontFamily="monospace" fontWeight="700" fill="#ea580c"
                  stroke="#fafaf9" strokeWidth={3} paintOrder="stroke" pointerEvents="none">
                  {fmt(d.len, 2)}м
                </text>
              ))}
              {sel && syms.map((sm) => {
                let deg = sm.deg;
                if (deg > 90 || deg <= -90) deg += 180;
                const ox = sm.x - Math.sin(sm.deg * Math.PI / 180) * -sm.side * 30;
                const oy = sm.y + Math.cos(sm.deg * Math.PI / 180) * -sm.side * 30;
                return (
                  <text key={"od" + sm.o.id} x={ox} y={oy}
                    transform={`rotate(${deg} ${ox} ${oy})`}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={9.5} fontFamily="monospace" fontWeight="600"
                    fill={sm.o.type === "win" ? "#0369a1" : "#57534e"}
                    stroke="#fafaf9" strokeWidth={3} paintOrder="stroke" pointerEvents="none">
                    {sm.o.type === "win" ? "Ц" : "Х"} {sm.o.w}×{sm.o.h}
                  </text>
                );
              })}
              {sel && r.points.map((p, j) => {
                const q = r.points[(j + 1) % r.points.length];
                return (
                  <g key={j}>
                    <rect x={X((p.x + q.x) / 2) - 4} y={Y((p.y + q.y) / 2) - 4} width={8} height={8}
                      fill="#fff" stroke="#ea580c" strokeWidth={1.2} className="cursor-copy"
                      onPointerDown={(e) => startMidDrag(e, r, j)}>
                      <title>Чирж шинэ цэг нэмнэ</title>
                    </rect>
                    <circle cx={X(p.x)} cy={Y(p.y)} r={6} fill="#ea580c" stroke="#fff" strokeWidth={1.5}
                      className="cursor-grab"
                      onPointerDown={(e) => startVertexDrag(e, r, j)}
                      onDoubleClick={() => deleteVertex(r, j)}>
                      <title>Чирж зөөнө · Давхар товшиж устгана</title>
                    </circle>
                  </g>
                );
              })}
            </g>
          );
        })}
        <g stroke="#ea580c" strokeWidth={1} fill="#ea580c" fontFamily="monospace" fontSize={12}>
          <line x1={X(rMinX)} y1={Y(rMaxY) + 22} x2={X(rMaxX)} y2={Y(rMaxY) + 22} />
          <line x1={X(rMinX)} y1={Y(rMaxY) + 14} x2={X(rMinX)} y2={Y(rMaxY) + 30} strokeWidth={0.8} />
          <line x1={X(rMaxX)} y1={Y(rMaxY) + 14} x2={X(rMaxX)} y2={Y(rMaxY) + 30} strokeWidth={0.8} />
          <text x={(X(rMinX) + X(rMaxX)) / 2} y={Y(rMaxY) + 38} textAnchor="middle" stroke="none">{fmt(rMaxX - rMinX)}м</text>
          <line x1={X(rMaxX) + 22} y1={Y(rMinY)} x2={X(rMaxX) + 22} y2={Y(rMaxY)} />
          <line x1={X(rMaxX) + 14} y1={Y(rMinY)} x2={X(rMaxX) + 30} y2={Y(rMinY)} strokeWidth={0.8} />
          <line x1={X(rMaxX) + 14} y1={Y(rMaxY)} x2={X(rMaxX) + 30} y2={Y(rMaxY)} strokeWidth={0.8} />
          <text x={X(rMaxX) + 36} y={(Y(rMinY) + Y(rMaxY)) / 2} stroke="none"
            transform={`rotate(90 ${X(rMaxX) + 36} ${(Y(rMinY) + Y(rMaxY)) / 2})`} textAnchor="middle">{fmt(rMaxY - rMinY)}м</text>
        </g>
      </svg>
    </div>
  );
}

/* ---------- 3D харагдал ---------- */
function ThreeView({ rooms, settings, geo, selections }) {
  const mountRef = useRef(null);
  const [showRoof, setShowRoof] = useState(true);

  useEffect(() => {
    if (!geo || !mountRef.current) return;
    const el = mountRef.current;
    const W = el.clientWidth || 800, H = 480;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f4);
    scene.fog = new THREE.Fog(0xf5f5f4, 60, 140);
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xfff4e0, 0.75);
    sun.position.set(15, 25, 10);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdbeafe, 0.25);
    fill.position.set(-10, 10, -15);
    scene.add(fill);

    const cx = (geo.minX + geo.maxX) / 2, cz = (geo.minY + geo.maxY) / 2;
    scene.add(new THREE.GridHelper(50, 50, 0xd6d3d1, 0xe7e5e4));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshLambertMaterial({ color: 0xefeae2 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    const extWallOpt = SYSTEMS.find((x) => x.comp === "extWall").options.find((o) => o.id === selections.extWall);
    const roofOpt = SYSTEMS.find((x) => x.comp === "roof").options.find((o) => o.id === selections.roof);
    const wallMat = new THREE.MeshLambertMaterial({ color: extWallOpt?.wallColor ?? 0xe7e5e4 });
    const winMat = new THREE.MeshLambertMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 });
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x92400e });

    for (let f = 0; f < settings.floors; f++) {
      const y0 = f * settings.wallH;
      rooms.forEach((room, i) => {
        const pts2 = room.points.map((p) => new THREE.Vector2(p.x - cx, p.y - cz));
        const shape = new THREE.Shape(pts2);
        const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape),
          new THREE.MeshLambertMaterial({ color: ROOM_COLORS[i % ROOM_COLORS.length], side: THREE.DoubleSide }));
        floor.rotation.x = Math.PI / 2;
        floor.position.y = y0 + 0.02 + i * 0.001;
        scene.add(floor);
        const edges = room.points.map((p, j) => {
          const q = room.points[(j + 1) % room.points.length];
          return { p, q, len: Math.hypot(q.x - p.x, q.y - p.y) };
        }).filter((e) => e.len > 0.01);
        edges.forEach((e) => {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(e.len, settings.wallH, settings.intT), wallMat);
          wall.position.set((e.p.x + e.q.x) / 2 - cx, y0 + settings.wallH / 2, (e.p.y + e.q.y) / 2 - cz);
          wall.rotation.y = -Math.atan2(e.q.y - e.p.y, e.q.x - e.p.x);
          scene.add(wall);
        });
        /* Цонх, хаалга — хадгалсан бодит байрлалаас (2D-тэй яг ижил) */
        (room.openings || []).forEach((o) => {
          const gm = openingGeom(room, o);
          const w = Math.min(o.w, gm.len * 0.9);
          const sill = o.type === "win" ? 0.9 : 0;
          const m = new THREE.Mesh(new THREE.BoxGeometry(w, o.h, settings.intT + 0.06),
            o.type === "win" ? winMat : doorMat);
          m.position.set(gm.x - cx, y0 + sill + o.h / 2, gm.y - cz);
          m.rotation.y = -Math.atan2(gm.dy, gm.dx);
          scene.add(m);
        });
      });
    }

    if (showRoof) {
      const ov = settings.roofOverhang;
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(geo.bw + ov * 2, 0.22, geo.bl + ov * 2),
        new THREE.MeshLambertMaterial({ color: roofOpt?.roofColor ?? 0x57534e }));
      roof.position.set(0, settings.floors * settings.wallH + 0.11, 0);
      scene.add(roof);
    }

    let theta = Math.PI / 4, phi = Math.PI / 3.1;
    let radius = Math.max(geo.bw, geo.bl) * 1.6 + settings.floors * settings.wallH + 6;
    const target = new THREE.Vector3(0, settings.floors * settings.wallH / 2, 0);
    const update = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.cos(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.sin(theta));
      camera.lookAt(target);
    };
    update();
    let drag = null;
    const dom = renderer.domElement;
    dom.style.touchAction = "none";
    const down = (e) => { drag = { x: e.clientX, y: e.clientY }; dom.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!drag) return;
      theta += (e.clientX - drag.x) * 0.008;
      phi = Math.min(Math.PI / 2.05, Math.max(0.15, phi - (e.clientY - drag.y) * 0.008));
      drag = { x: e.clientX, y: e.clientY };
      update();
    };
    const up = () => (drag = null);
    const wheel = (e) => { e.preventDefault(); radius = Math.min(150, Math.max(4, radius + e.deltaY * 0.02)); update(); };
    dom.addEventListener("pointerdown", down);
    dom.addEventListener("pointermove", move);
    dom.addEventListener("pointerup", up);
    dom.addEventListener("pointerleave", up);
    dom.addEventListener("wheel", wheel, { passive: false });

    let raf;
    const loop = () => { renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      dom.removeEventListener("pointerdown", down);
      dom.removeEventListener("pointermove", move);
      dom.removeEventListener("pointerup", up);
      dom.removeEventListener("pointerleave", up);
      dom.removeEventListener("wheel", wheel);
      renderer.dispose();
      el.removeChild(dom);
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
    };
  }, [rooms, settings, geo, showRoof, selections]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-stone-200 px-2 py-1 font-mono text-[11px] text-stone-600">
          🖱 Чирж эргүүлнэ · Wheel — ойртуулна
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={showRoof} onChange={(e) => setShowRoof(e.target.checked)} className="accent-orange-600" />
          Дээвэр харуулах
        </label>
      </div>
      <div ref={mountRef} className="overflow-hidden rounded-xl border border-stone-300 shadow-inner" style={{ minHeight: 480 }} />
    </div>
  );
}

/* ---------- Өрөөний карт ---------- */
function RoomCard({ room, index, selected, onSelect, onChange, onDelete }) {
  const set = (patch) => onChange({ ...room, ...patch });
  const setOpening = (oid, patch) => onChange({ ...room, openings: (room.openings || []).map((o) => (o.id === oid ? { ...o, ...patch } : o)) });
  const delOpening = (oid) => onChange({ ...room, openings: (room.openings || []).filter((o) => o.id !== oid) });
  const addOpening = (type) => {
    /* Шинэ нүхийг: цонх бол хамгийн урт, хаалга бол дараагийн урт хананд */
    const edges = room.points.map((p, j) => {
      const q = room.points[(j + 1) % room.points.length];
      return { j, len: Math.hypot(q.x - p.x, q.y - p.y) };
    }).sort((a, b) => b.len - a.len);
    const edge = type === "win" ? edges[0].j : (edges[1] || edges[0]).j;
    const def = type === "win" ? { w: 1.2, h: 1.4 } : { w: 0.9, h: 2.1 };
    onChange({ ...room, openings: [...(room.openings || []), { id: uid(), type, edge, t: 0.5, ...def }] });
  };
  const setPoint = (idx, axis, v) => onChange({ ...room, points: room.points.map((p, i) => (i === idx ? { ...p, [axis]: v } : p)) });
  const addPoint = () => {
    let best = 0, bestLen = 0;
    room.points.forEach((p, j) => {
      const q = room.points[(j + 1) % room.points.length];
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      if (len > bestLen) { bestLen = len; best = j; }
    });
    const p = room.points[best], q = room.points[(best + 1) % room.points.length];
    const mid = { x: snap((p.x + q.x) / 2), y: snap((p.y + q.y) / 2) };
    onChange({ ...room, points: [...room.points.slice(0, best + 1), mid, ...room.points.slice(best + 1)],
      openings: (room.openings || []).map((o) => (o.edge > best ? { ...o, edge: o.edge + 1 } : o)) });
  };
  return (
    <div onClick={onSelect}
      className={`rounded-xl border bg-white p-3 shadow-sm transition ${selected ? "border-orange-500 ring-2 ring-orange-100" : "border-stone-200"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ROOM_COLORS[index % ROOM_COLORS.length] }} />
        <input value={room.name} onChange={(e) => set({ name: e.target.value })}
          className="w-full rounded-md border border-stone-200 px-2 py-1 text-sm font-medium focus:border-orange-500 focus:outline-none" />
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded-md px-2 py-1 text-stone-400 hover:bg-red-50 hover:text-red-600" title="Устгах">✕</button>
      </div>
      {selected && (
        <div className="mb-2 rounded-lg bg-stone-50 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500">📍 Булангийн цэгүүд (м)</span>
            <button onClick={(e) => { e.stopPropagation(); addPoint(); }}
              className="rounded bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 hover:bg-orange-200">+ цэг</button>
          </div>
          <div className="grid max-h-32 grid-cols-2 gap-1 overflow-y-auto">
            {room.points.map((p, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-4 font-mono text-[10px] text-stone-400">{i + 1}</span>
                <NumInput value={p.x} step={0.25} onChange={(v) => setPoint(i, "x", v)} />
                <NumInput value={p.y} step={0.25} onChange={(v) => setPoint(i, "y", v)} />
              </div>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-stone-400">Зураг дээр: цэг чирж зөөх · ирмэгийн ⬜ чирч цэг нэмэх · цэгийг давхар товшиж устгах</p>
        </div>
      )}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-stone-500">🚪🪟 Хаалга, цонх ({(room.openings || []).length})</span>
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); addOpening("door"); }}
              className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 hover:bg-stone-200">+ Хаалга</button>
            <button onClick={(e) => { e.stopPropagation(); addOpening("win"); }}
              className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100">+ Цонх</button>
          </div>
        </div>
        {(room.openings || []).length > 0 && (
          <div className="max-h-36 space-y-1 overflow-y-auto">
            <div className="grid grid-cols-[20px_1fr_1fr_1fr_20px] gap-1 text-[9px] uppercase tracking-wide text-stone-400">
              <span /><span>Хана №</span><span>Өргөн</span><span>Өндөр</span><span />
            </div>
            {room.openings.map((o) => (
              <div key={o.id} className="grid grid-cols-[20px_1fr_1fr_1fr_20px] items-center gap-1">
                <span title={o.type === "door" ? "Хаалга" : "Цонх"}>{o.type === "door" ? "🚪" : "🪟"}</span>
                <select value={((o.edge % room.points.length) + room.points.length) % room.points.length}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setOpening(o.id, { edge: parseInt(e.target.value), t: 0.5 })}
                  className="w-full rounded-md border border-stone-300 bg-white px-1 py-1 font-mono text-xs focus:border-orange-500 focus:outline-none">
                  {room.points.map((_, j) => <option key={j} value={j}>{j + 1}–{(j + 1) % room.points.length + 1}</option>)}
                </select>
                <NumInput value={o.w} step={0.1} onChange={(v) => setOpening(o.id, { w: Math.max(0.3, v) })} />
                <NumInput value={o.h} step={0.1} onChange={(v) => setOpening(o.id, { h: Math.max(0.3, v) })} />
                <button onClick={(e) => { e.stopPropagation(); delOpening(o.id); }}
                  className="text-stone-400 hover:text-red-600" title="Устгах">✕</button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-[10px] text-stone-400">Тэмдэглэгээг зураг дээр чирж хананы дагуу болон өөр хана руу зөөнө</p>
      </div>
      <div className="mt-2 border-t border-dashed border-stone-200 pt-1.5 font-mono text-[11px] text-orange-700">
        Талбай: {fmt(polyArea(room.points))}м² · Периметр: {fmt(polyPerim(room.points))}м · {room.points.length} цэг
      </div>
    </div>
  );
}

/* ============================================================ */
export default function BuildEstimator({ onBack, preset }) {
  const [tab, setTab] = useState("plan");
  const [view, setView] = useState("2d");
  const [rooms, setRooms] = useState(preset?.rooms || DEFAULT_ROOMS);
  const [settings, setSettings] = useState(preset?.settings ? { ...DEFAULT_SETTINGS, ...preset.settings } : DEFAULT_SETTINGS);
  const [selections, setSelections] = useState(preset?.selections ? { ...DEFAULT_SELECTIONS, ...preset.selections } : DEFAULT_SELECTIONS);
  const [norms, setNorms] = useState(DEFAULT_NORMS);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [laborNorms, setLaborNorms] = useState(DEFAULT_LABOR);
  const [mep, setMep] = useState(preset?.mep ? { ...DEFAULT_MEP, ...preset.mep } : DEFAULT_MEP);
  const [quote, setQuote] = useState({
    company: "Хөтөч · hutuch.com", phone: "", email: "",
    client: "", project: "Амины орон сууц", number: "Т-" + new Date().getFullYear() + "-001",
    date: new Date().toISOString().slice(0, 10), validDays: 14, preparedBy: "",
  });
  const [selected, setSelected] = useState(null);
  const fileRef = useRef(null);

  const geo = useMemo(() => {
    const g = computeGeometry(rooms, settings);
    return g ? { ...g, mep } : null;
  }, [rooms, settings, mep]);

  /* Сонгосон системүүдийн материалын мөрүүд — материал + хөдөлмөр */
  const lines = useMemo(() => {
    if (!geo) return [];
    const mk = (d, group) => {
      const qty = d.qty(geo, settings, norms[d.key]);
      const hours = qty * (laborNorms[d.key] ?? 0);
      const laborCost = hours * rateOf(settings, d.cat);
      return { ...d, group, qty, price: prices[d.key], total: qty * prices[d.key], hours, laborCost };
    };
    const out = [];
    SYSTEMS.forEach((sys) => {
      const opt = sys.options.find((o) => o.id === selections[sys.comp]) || sys.options[0];
      opt.items.forEach((d) => out.push(mk(d, `${sys.icon} ${sys.label} — ${opt.name}`)));
    });
    COMMON_ITEMS.forEach((d) => out.push(mk(d, d.group)));
    return out;
  }, [geo, settings, selections, norms, prices, laborNorms]);

  const materialTotal = lines.reduce((a, l) => a + l.total, 0);
  const totalHours = lines.reduce((a, l) => a + l.hours, 0);
  const laborTotal = lines.reduce((a, l) => a + l.laborCost, 0);
  const ndsh = laborTotal * settings.ndshPct / 100;
  const transport = materialTotal * settings.transportPct / 100;
  const subtotal = materialTotal + laborTotal + ndsh + transport;
  const vat = subtotal * settings.vatPct / 100;
  const grand = subtotal + vat;
  const workDays = settings.crewSize > 0 ? totalHours / (settings.crewSize * 8) : 0;

  const setS = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const nextY = () => rooms.length ? Math.max(...rooms.flatMap((r) => r.points.map((p) => p.y))) : 0;
  const addRect = () => setRooms((rs) => [...rs, { id: uid(), name: `Өрөө ${rs.length + 1}`, points: rect(0, nextY(), 3, 3), openings: [{ id: uid(), type: "win", edge: 0, t: 0.5, w: 1.2, h: 1.4 }, { id: uid(), type: "door", edge: 2, t: 0.5, w: 0.9, h: 2.1 }] }]);
  const addL = () => setRooms((rs) => [...rs, { id: uid(), name: `Өрөө ${rs.length + 1}`, points: lShape(0, nextY()), openings: [{ id: uid(), type: "win", edge: 0, t: 0.5, w: 1.2, h: 1.4 }, { id: uid(), type: "door", edge: 5, t: 0.5, w: 0.9, h: 2.1 }] }]);

  const exportCSV = () => {
    const rows = [["№", "Хэсэг", "Материал / Ажил", "Нэгж", "Тоо хэмжээ", "Нэгж үнэ (₮)", "Материал (₮)", "Хүн/цаг", "Ажлын хөлс (₮)", "Нийт (₮)"]];
    lines.forEach((l, i) => rows.push([i + 1, l.group, l.name, l.unit, l.qty.toFixed(2), l.price, Math.round(l.total), l.hours.toFixed(1), Math.round(l.laborCost), Math.round(l.total + l.laborCost)]));
    rows.push([], ["", "", "Материалын дүн", "", "", "", "", "", "", Math.round(materialTotal)],
      ["", "", `Ажлын хөлс (${fmt(totalHours, 0)} хүн/цаг, нормоор)`, "", "", "", "", "", "", Math.round(laborTotal)],
      ["", "", `НДШ (${settings.ndshPct}%)`, "", "", "", "", "", "", Math.round(ndsh)],
      ["", "", `Тээвэр (${settings.transportPct}%)`, "", "", "", "", "", "", Math.round(transport)],
      ["", "", `НӨАТ (${settings.vatPct}%)`, "", "", "", "", "", "", Math.round(vat)],
      ["", "", "НИЙТ ТӨСӨВ", "", "", "", "", "", "", Math.round(grand)]);
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "hutuch-tusuv.csv";
    a.click();
  };
  const exportJSON = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ rooms, settings, selections, norms, prices, laborNorms, mep, quote }, null, 2)], { type: "application/json" }));
    a.download = "hutuch-tusul.json";
    a.click();
  };
  /* Төслийн өгөгдлийг тооцоолуурт буулгах — JSON импорт болон cloud нээлт хоёул үүнийг хэрэглэнэ */
  const applyProject = (d) => {
    if (d.rooms) setRooms(d.rooms.map(migrateOpenings));
    if (d.settings) setSettings((s) => ({ ...s, ...d.settings }));
    if (d.selections) setSelections((s) => ({ ...s, ...d.selections }));
    if (d.norms) setNorms((n) => ({ ...n, ...d.norms }));
    if (d.prices) setPrices((p) => ({ ...p, ...d.prices }));
    if (d.laborNorms) setLaborNorms((l) => ({ ...l, ...d.laborNorms }));
    if (d.mep) setMep((m) => ({ ...m, ...d.mep }));
    if (d.quote) setQuote((q) => ({ ...q, ...d.quote }));
  };
  const projectData = () => ({ rooms, settings, selections, norms, prices, laborNorms, mep, quote });
  const importJSON = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { applyProject(JSON.parse(rd.result)); }
      catch { alert("JSON файл уншигдсангүй"); }
    };
    rd.readAsText(f);
    e.target.value = "";
  };

  const TABS = [
    { id: "plan", label: "📐 Орон сууц зурах" },
    { id: "materials", label: "🧱 Материал сонголт & тооцоо" },
    { id: "budget", label: "💰 Төсөв" },
    { id: "print", label: "🖨 Төсвийн маягт" },
    { id: "settings", label: "⚙️ Норм & Үнэ" },
  ];
  const lineGroups = [...new Set(lines.map((l) => l.group))];

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-sheet, .print-sheet * { visibility: visible !important; }
          .print-sheet { position: absolute !important; left: 0 !important; top: 0 !important;
            box-shadow: none !important; border: none !important; margin: 0 !important;
            width: 100% !important; max-width: none !important; padding: 0 !important; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-break-avoid { break-inside: avoid; }
          @page { size: A4; margin: 14mm 12mm; }
        }
      `}</style>
      <header className="no-print border-b-4 border-orange-600 bg-stone-900 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} title="Нүүр хуудас руу буцах"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-700 text-lg text-white transition hover:bg-stone-600">
                ←
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-xl font-black">Х</div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Барилгын Төсвийн Тооцоолуур</h1>
              <p className="font-mono text-[11px] text-stone-400">hutuch.com · БНБД 81-06 / 81-94-12 / 81-95-12 маягийн норм</p>
            </div>
          </div>
          {geo && (
            <div className="flex gap-4 font-mono text-xs">
              <div><span className="text-stone-400">Талбай</span><div className="text-base font-bold text-orange-400">{fmt(geo.floorArea)}м²</div></div>
              <div><span className="text-stone-400">Нийт төсөв</span><div className="text-base font-bold text-orange-400">{fmtT(grand)}</div></div>
            </div>
          )}
        </div>
      </header>

      <nav className="no-print border-b border-stone-300 bg-white px-4">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${tab === t.id ? "border-orange-600 text-orange-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl p-4">
        {tab === "plan" && (
          <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-stone-600">Өрөөний жагсаалт</h2>
                <div className="flex gap-1">
                  <button onClick={addRect} className="rounded-lg bg-orange-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-orange-700">+ Тэгш өнцөгт</button>
                  <button onClick={addL} className="rounded-lg border border-orange-600 px-2.5 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-50">+ L-хэлбэр</button>
                </div>
              </div>
              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {rooms.map((r, i) => (
                  <RoomCard key={r.id} room={r} index={i} selected={selected === r.id}
                    onSelect={() => setSelected(r.id)}
                    onChange={(nr) => setRooms((rs) => rs.map((x) => (x.id === r.id ? nr : x)))}
                    onDelete={() => setRooms((rs) => rs.filter((x) => x.id !== r.id))} />
                ))}
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Байрны тохиргоо</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Давхрын тоо"><NumInput value={settings.floors} step={1} min={1} onChange={(v) => setS({ floors: Math.max(1, Math.round(v)) })} /></Field>
                  <Field label="Ханын өндөр (м)"><NumInput value={settings.wallH} onChange={(v) => setS({ wallH: v })} /></Field>
                  <Field label="Гадна ханын зузаан (м)"><NumInput value={settings.extT} step={0.05} onChange={(v) => setS({ extT: v })} /></Field>
                  <Field label="Гадна периметр (0=авто)"><NumInput value={settings.extPerimOverride} step={0.5} onChange={(v) => setS({ extPerimOverride: v })} /></Field>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1 rounded-lg bg-stone-200 p-1">
                  {[["2d", "▦ 2D Зураг"], ["3d", "◈ 3D Харагдал"]].map(([v, lbl]) => (
                    <button key={v} onClick={() => setView(v)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${view === v ? "bg-white text-orange-700 shadow" : "text-stone-500 hover:text-stone-800"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {view === "2d" && <span className="rounded-md bg-stone-200 px-2 py-1 font-mono text-[11px] text-stone-600">1 нүд = 1м · чирнэ · ⌒ хаалга, ☰ цонх авто байрлана</span>}
              </div>
              {rooms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-400">Өрөө нэмээд планаа эхлүүлнэ үү</div>
              ) : view === "2d" ? (
                <PlanCanvas rooms={rooms} setRooms={setRooms} selected={selected} setSelected={setSelected} />
              ) : (
                <ThreeView rooms={rooms} settings={settings} geo={geo} selections={selections} />
              )}
              {geo && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[["Барилгын хэмжээ", `${fmt(geo.bw)}×${fmt(geo.bl)}м`],
                    ["Гадна периметр", fmt(geo.extPerim) + "м" + (settings.extPerimOverride > 0 ? " (гар)" : "")],
                    ["Дотор хананы урт", fmt(geo.intLen) + "м"], ["Дээврийн талбай", fmt(geo.roofArea) + "м²"]].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-stone-200 bg-white p-2 text-center shadow-sm">
                      <div className="text-[10px] uppercase tracking-wide text-stone-500">{k}</div>
                      <div className="font-mono text-sm font-bold text-stone-800">{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "materials" && geo && (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-600">Хэсэг бүрийн материал сонголт</h2>
              <MaterialSelector selections={selections} setSelections={setSelections} lines={lines} />
            </div>
            <MepPanel mep={mep} setMep={setMep} onSuggest={() => setMep(suggestMep(rooms, geo))} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Гадна хана (цэвэр)", fmt(geo.extNet) + "м²"], ["Дотор хана (цэвэр)", fmt(geo.intNet) + "м²"],
                ["Суурийн урт", fmt(geo.fLen) + "м"], ["Дээврийн талбай", fmt(geo.roofArea) + "м²"]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wide text-stone-500">{k}</div>
                  <div className="font-mono text-lg font-bold text-orange-700">{v}</div>
                </div>
              ))}
            </div>
            {lineGroups.map((g) => (
              <div key={g} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="border-b border-stone-200 bg-stone-50 px-4 py-2 text-sm font-bold text-stone-700">{g}</div>
                <table className="w-full text-sm">
                  <tbody>
                    {lines.filter((l) => l.group === g).map((l) => (
                      <tr key={l.key} className="border-b border-stone-100 last:border-0">
                        <td className="px-4 py-2">{l.name}{l.hint && <span className="ml-2 text-[10px] text-stone-400">({l.hint}: {norms[l.key]})</span>}</td>
                        <td className="w-40 px-4 py-2 text-right font-mono font-semibold">{fmt(l.qty, 2)} <span className="text-stone-400">{l.unit}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              ⚠️ Нормын коэффициентууд нь ерөнхий практикт тулгуурласан анхны утга тул албан ёсны БНБД баримт бичигтэй тулгаж, «Норм & Үнэ» хэсэгт засварлана уу.
            </p>
          </div>
        )}

        {tab === "budget" && geo && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-600">Төсвийн дэлгэрэнгүй</h2>
              <div className="flex gap-2">
                <button onClick={exportCSV} className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800">⬇ CSV татах</button>
                <CloudProjects getData={projectData} onLoad={applyProject} />
                <button onClick={exportJSON} className="rounded-lg bg-stone-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800">💾 JSON татах</button>
                <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50">📂 Төсөл нээх</button>
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
              </div>
            </div>
            {/* Хөдөлмөр зарцуулалтын хураангуй */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Нийт хөдөлмөр", fmt(totalHours, 0) + " хүн/цаг"],
                ["Ажлын хөлс (нормоор)", fmtT(laborTotal)],
                ["Багаар " + settings.crewSize + " хүн", "≈ " + fmt(workDays, 0) + " өдөр"],
                ["Хөлс / материалын харьцаа", materialTotal > 0 ? fmt(laborTotal / materialTotal * 100, 0) + "%" : "—"]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
                  <div className="text-[10px] uppercase tracking-wide text-stone-500">{k}</div>
                  <div className="font-mono text-base font-bold text-orange-700">{v}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b-2 border-stone-300 bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500">
                    <th className="px-3 py-2">№</th><th className="px-3 py-2">Материал / Ажил</th><th className="px-3 py-2 text-right">Тоо хэмжээ</th>
                    <th className="px-3 py-2 text-right">Нэгж үнэ</th><th className="px-3 py-2 text-right">Материал</th>
                    <th className="px-3 py-2 text-right">Хүн/цаг</th><th className="px-3 py-2 text-right">Ажлын хөлс</th><th className="px-3 py-2 text-right">Нийт</th>
                  </tr>
                </thead>
                <tbody>
                  {lineGroups.map((g) => (
                    [<tr key={g} className="bg-stone-50"><td colSpan={8} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">{g}</td></tr>,
                      ...lines.filter((l) => l.group === g).map((l) => (
                        <tr key={l.key} className="border-b border-stone-100">
                          <td className="px-3 py-2 font-mono text-stone-400">{lines.indexOf(l) + 1}</td>
                          <td className="px-3 py-2">{l.name}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(l.qty, 2)} {l.unit}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmtT(l.price)}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmtT(l.total)}</td>
                          <td className="px-3 py-2 text-right font-mono text-stone-500">{l.hours > 0 ? fmt(l.hours, 1) : "—"}</td>
                          <td className="px-3 py-2 text-right font-mono text-stone-500">{l.laborCost > 0 ? fmtT(l.laborCost) : "—"}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">{fmtT(l.total + l.laborCost)}</td>
                        </tr>
                      ))]
                  ))}
                </tbody>
                <tfoot className="font-mono">
                  <tr className="border-t-2 border-stone-300"><td colSpan={7} className="px-3 py-2 text-right font-sans font-medium">Материалын дүн</td><td className="px-3 py-2 text-right font-bold">{fmtT(materialTotal)}</td></tr>
                  <tr><td colSpan={7} className="px-3 py-1 text-right font-sans text-stone-600">Ажлын хөлс ({fmt(totalHours, 0)} хүн/цаг, нэгж нормоор)</td><td className="px-3 py-1 text-right">{fmtT(laborTotal)}</td></tr>
                  <tr><td colSpan={7} className="px-3 py-1 text-right font-sans text-stone-600">НДШ ({settings.ndshPct}%)</td><td className="px-3 py-1 text-right">{fmtT(ndsh)}</td></tr>
                  <tr><td colSpan={7} className="px-3 py-1 text-right font-sans text-stone-600">Тээвэр ({settings.transportPct}%)</td><td className="px-3 py-1 text-right">{fmtT(transport)}</td></tr>
                  <tr><td colSpan={7} className="px-3 py-1 text-right font-sans text-stone-600">НӨАТ ({settings.vatPct}%)</td><td className="px-3 py-1 text-right">{fmtT(vat)}</td></tr>
                  <tr className="border-t-2 border-orange-600 bg-orange-50 text-base"><td colSpan={7} className="px-3 py-3 text-right font-sans font-bold">НИЙТ ТӨСӨВ</td><td className="px-3 py-3 text-right font-black text-orange-700">{fmtT(grand)}</td></tr>
                  <tr><td colSpan={7} className="px-3 py-1 text-right font-sans text-xs text-stone-500">1м² өртөг</td><td className="px-3 py-1 text-right text-xs">{fmtT(grand / geo.floorArea)}/м²</td></tr>
                </tfoot>
              </table>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Цагийн тариф ба нэмэгдэл (₮/цаг, %)</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <Field label="Туслах ₮/цаг"><NumInput value={settings.rateA} step={500} onChange={(v) => setS({ rateA: v })} /></Field>
                <Field label="Мэргэжлийн ₮/цаг"><NumInput value={settings.rateB} step={500} onChange={(v) => setS({ rateB: v })} /></Field>
                <Field label="Өндөр мэргэж. ₮/цаг"><NumInput value={settings.rateC} step={500} onChange={(v) => setS({ rateC: v })} /></Field>
                <Field label="НДШ (%)"><NumInput value={settings.ndshPct} step={0.5} onChange={(v) => setS({ ndshPct: v })} /></Field>
                <Field label="Тээвэр (%)"><NumInput value={settings.transportPct} step={1} onChange={(v) => setS({ transportPct: v })} /></Field>
                <Field label="НӨАТ (%)"><NumInput value={settings.vatPct} step={1} onChange={(v) => setS({ vatPct: v })} /></Field>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
                <Field label="Багийн хүний тоо"><NumInput value={settings.crewSize} step={1} min={1} onChange={(v) => setS({ crewSize: Math.max(1, Math.round(v)) })} /></Field>
              </div>
            </div>
          </div>
        )}

        {tab === "print" && geo && (() => {
          const setQ = (patch) => setQuote((q) => ({ ...q, ...patch }));
          const groupTotals = lineGroups.map((g) => {
            const gl = lines.filter((l) => l.group === g);
            return { g, mat: gl.reduce((a, l) => a + l.total, 0), lab: gl.reduce((a, l) => a + l.laborCost, 0), items: gl };
          }).filter((x) => x.mat + x.lab > 0);
          const specs = SYSTEMS.map((sys) => {
            const opt = sys.options.find((o) => o.id === selections[sys.comp]) || sys.options[0];
            return opt.items.length ? `${sys.label}: ${opt.name}` : null;
          }).filter(Boolean);
          return (
            <div className="space-y-4">
              <div className="no-print rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-stone-600">Маягтын мэдээлэл</h3>
                  <button onClick={() => window.print()}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">
                    🖨 Хэвлэх / PDF болгох
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Байгууллага"><input value={quote.company} onChange={(e) => setQ({ company: e.target.value })} className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none" /></Field>
                  <Field label="Утас"><input value={quote.phone} onChange={(e) => setQ({ phone: e.target.value })} className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none" /></Field>
                  <Field label="И-мэйл"><input value={quote.email} onChange={(e) => setQ({ email: e.target.value })} className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none" /></Field>
                  <Field label="Маягтын дугаар"><input value={quote.number} onChange={(e) => setQ({ number: e.target.value })} className="w-full rounded-md border border-stone-300 px-2 py-1 font-mono text-sm focus:border-orange-500 focus:outline-none" /></Field>
                  <Field label="Захиалагч"><input value={quote.client} onChange={(e) => setQ({ client: e.target.value })} placeholder="Нэр / байгууллага" className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none" /></Field>
                  <Field label="Төслийн нэр"><input value={quote.project} onChange={(e) => setQ({ project: e.target.value })} className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none" /></Field>
                  <Field label="Огноо"><input type="date" value={quote.date} onChange={(e) => setQ({ date: e.target.value })} className="w-full rounded-md border border-stone-300 px-2 py-1 font-mono text-sm focus:border-orange-500 focus:outline-none" /></Field>
                  <Field label="Хүчинтэй хугацаа (хоног)"><NumInput value={quote.validDays} step={1} onChange={(v) => setQ({ validDays: Math.max(1, Math.round(v)) })} /></Field>
                  <Field label="Төсөв боловсруулсан"><input value={quote.preparedBy} onChange={(e) => setQ({ preparedBy: e.target.value })} placeholder="Овог нэр" className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none" /></Field>
                </div>
                <p className="mt-2 text-[11px] text-stone-400">«Хэвлэх» дарж гарч ирэх цонхонд Destination → «Save as PDF» сонговол PDF файл болно.</p>
              </div>

              {/* ===== A4 маягт ===== */}
              <div className="print-sheet mx-auto max-w-[820px] rounded-md border border-stone-300 bg-white p-10 text-[13px] leading-relaxed text-stone-900 shadow-lg">
                <div className="flex items-start justify-between border-b-4 border-orange-600 pb-4">
                  <div>
                    <div className="text-xl font-black tracking-tight">{quote.company || "—"}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-stone-500">
                      {[quote.phone, quote.email].filter(Boolean).join(" · ") || " "}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold uppercase tracking-wide">Барилгын төсвийн санал</div>
                    <div className="font-mono text-[12px] text-stone-500">№ {quote.number} · {quote.date}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-[12px]">
                  <div><span className="text-stone-500">Захиалагч:</span> <b>{quote.client || "________________"}</b></div>
                  <div><span className="text-stone-500">Төсөл:</span> <b>{quote.project}</b></div>
                  <div><span className="text-stone-500">Нийт талбай:</span> <b>{fmt(geo.floorArea)}м²</b> ({settings.floors} давхар, {fmt(geo.bw)}×{fmt(geo.bl)}м)</div>
                  <div><span className="text-stone-500">Өрөөний тоо:</span> <b>{rooms.length}</b> · Ханын өндөр {settings.wallH}м</div>
                </div>

                <div className="print-break-avoid mt-4">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">Сонгосон материал, хийц</div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 rounded-md border border-stone-200 bg-stone-50 p-3 text-[11.5px]">
                    {specs.map((s) => <div key={s}>• {s}</div>)}
                  </div>
                </div>

                <table className="mt-5 w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b-2 border-stone-800 text-left text-[10.5px] uppercase tracking-wide">
                      <th className="py-1.5 pr-2">Ажлын хэсэг</th>
                      <th className="py-1.5 pr-2 text-right">Материал (₮)</th>
                      <th className="py-1.5 pr-2 text-right">Ажлын хөлс (₮)</th>
                      <th className="py-1.5 text-right">Нийт (₮)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupTotals.map(({ g, mat, lab }) => (
                      <tr key={g} className="border-b border-stone-200">
                        <td className="py-1.5 pr-2">{g}</td>
                        <td className="py-1.5 pr-2 text-right font-mono">{Math.round(mat).toLocaleString("en-US")}</td>
                        <td className="py-1.5 pr-2 text-right font-mono">{Math.round(lab).toLocaleString("en-US")}</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{Math.round(mat + lab).toLocaleString("en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={3} className="py-1 pt-3 text-right text-stone-600">Материалын дүн</td><td className="py-1 pt-3 text-right font-mono">{fmtT(materialTotal)}</td></tr>
                    <tr><td colSpan={3} className="py-1 text-right text-stone-600">Ажлын хөлс ({fmt(totalHours, 0)} хүн/цаг)</td><td className="py-1 text-right font-mono">{fmtT(laborTotal)}</td></tr>
                    <tr><td colSpan={3} className="py-1 text-right text-stone-600">НДШ ({settings.ndshPct}%)</td><td className="py-1 text-right font-mono">{fmtT(ndsh)}</td></tr>
                    <tr><td colSpan={3} className="py-1 text-right text-stone-600">Тээвэр ({settings.transportPct}%)</td><td className="py-1 text-right font-mono">{fmtT(transport)}</td></tr>
                    <tr><td colSpan={3} className="py-1 text-right text-stone-600">НӨАТ ({settings.vatPct}%)</td><td className="py-1 text-right font-mono">{fmtT(vat)}</td></tr>
                    <tr className="border-t-2 border-stone-800">
                      <td colSpan={3} className="py-2 text-right text-[14px] font-bold">НИЙТ ТӨСӨВ</td>
                      <td className="py-2 text-right font-mono text-[15px] font-black">{fmtT(grand)}</td>
                    </tr>
                    <tr><td colSpan={3} className="py-0.5 text-right text-[11px] text-stone-500">1м² өртөг</td><td className="py-0.5 text-right font-mono text-[11px] text-stone-500">{fmtT(grand / geo.floorArea)}/м²</td></tr>
                    <tr><td colSpan={3} className="py-0.5 text-right text-[11px] text-stone-500">Урьдчилсан хугацаа ({settings.crewSize} хүнтэй баг)</td><td className="py-0.5 text-right font-mono text-[11px] text-stone-500">≈ {fmt(workDays, 0)} ажлын өдөр</td></tr>
                  </tfoot>
                </table>

                <div className="print-break-avoid mt-6 grid grid-cols-2 gap-10 text-[12px]">
                  <div>
                    <div className="text-stone-500">Төсөв боловсруулсан:</div>
                    <div className="mt-8 border-b border-stone-400" />
                    <div className="mt-1 text-[11px] text-stone-500">{quote.preparedBy || "Овог нэр, гарын үсэг"}</div>
                  </div>
                  <div>
                    <div className="text-stone-500">Захиалагч (танилцсан):</div>
                    <div className="mt-8 border-b border-stone-400" />
                    <div className="mt-1 text-[11px] text-stone-500">Овог нэр, гарын үсэг</div>
                  </div>
                </div>

                <p className="mt-6 border-t border-stone-200 pt-2 text-[10px] leading-snug text-stone-400">
                  Энэхүү санал нь {quote.date}-ны өдрөөс хойш {quote.validDays} хоногийн хугацаанд хүчинтэй. Тооцоо нь урьдчилсан бөгөөд материалын зах зээлийн үнэ, ажлын нөхцөлөөс хамаарч өөрчлөгдөж болно. Нормын коэффициентыг албан ёсны БНБД баримт бичигтэй тулгаж баталгаажуулна уу. · Боловсруулсан: hutuch.com
                </p>
              </div>
            </div>
          );
        })()}

        {tab === "settings" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-600">Байгууламжийн параметр</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Суурийн өргөн (м)"><NumInput value={settings.foundWidth} step={0.05} onChange={(v) => setS({ foundWidth: v })} /></Field>
                <Field label="Суурийн гүн (м)"><NumInput value={settings.foundDepth} onChange={(v) => setS({ foundDepth: v })} /></Field>
                <Field label="Дээврийн налуугийн коэфф."><NumInput value={settings.roofSlope} step={0.01} onChange={(v) => setS({ roofSlope: v })} /></Field>
                <Field label="Дээврийн саравч (м)"><NumInput value={settings.roofOverhang} onChange={(v) => setS({ roofOverhang: v })} /></Field>
              </div>
            </div>
            {SYSTEMS.map((sys) => {
              const opt = sys.options.find((o) => o.id === selections[sys.comp]) || sys.options[0];
              if (!opt.items.length) return null;
              return (
                <div key={sys.comp} className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                  <div className="border-b border-stone-200 bg-stone-50 px-4 py-2 text-sm font-bold text-stone-700">{sys.icon} {sys.label} — {opt.name}</div>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-left text-[10px] uppercase tracking-wide text-stone-400">
                        <th className="px-4 py-1.5">Материал / Ажил</th><th className="px-4 py-1.5">Нэгж</th>
                        <th className="px-4 py-1.5 text-right">Нормын коэфф.</th><th className="px-4 py-1.5 text-right">Хүн/цаг · нэгжид</th>
                        <th className="px-4 py-1.5">Ангилал</th><th className="px-4 py-1.5 text-right">Нэгж үнэ (₮)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opt.items.map((d) => (
                        <tr key={d.key} className="border-b border-stone-100 last:border-0">
                          <td className="px-4 py-2">{d.name}{d.hint && <span className="ml-2 text-[10px] text-stone-400">{d.hint}</span>}</td>
                          <td className="w-16 px-4 py-2 text-stone-500">{d.unit}</td>
                          <td className="w-32 px-4 py-1"><NumInput value={norms[d.key]} step={0.01} onChange={(v) => setNorms((n) => ({ ...n, [d.key]: v }))} /></td>
                          <td className="w-32 px-4 py-1"><NumInput value={laborNorms[d.key]} step={0.01} onChange={(v) => setLaborNorms((l) => ({ ...l, [d.key]: v }))} /></td>
                          <td className="w-28 px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${d.cat === "C" ? "bg-purple-100 text-purple-700" : d.cat === "A" ? "bg-stone-200 text-stone-600" : "bg-blue-100 text-blue-700"}`}>{RATE_CATS[d.cat] || RATE_CATS.B}</span></td>
                          <td className="w-36 px-4 py-1"><NumInput value={prices[d.key]} step={100} onChange={(v) => setPrices((p) => ({ ...p, [d.key]: v }))} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-200 bg-stone-50 px-4 py-2 text-sm font-bold text-stone-700">Дотор заслын нийтлэг материал</div>
              <table className="w-full min-w-[760px] text-sm">
                <tbody>
                  {COMMON_ITEMS.map((d) => (
                    <tr key={d.key} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-2">{d.name}<span className="ml-2 text-[10px] text-stone-400">{d.hint}</span></td>
                      <td className="w-16 px-4 py-2 text-stone-500">{d.unit}</td>
                      <td className="w-32 px-4 py-1"><NumInput value={norms[d.key]} step={0.01} onChange={(v) => setNorms((n) => ({ ...n, [d.key]: v }))} /></td>
                      <td className="w-32 px-4 py-1"><NumInput value={laborNorms[d.key]} step={0.01} onChange={(v) => setLaborNorms((l) => ({ ...l, [d.key]: v }))} /></td>
                      <td className="w-28 px-4 py-2"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{RATE_CATS[d.cat] || RATE_CATS.B}</span></td>
                      <td className="w-36 px-4 py-1"><NumInput value={prices[d.key]} step={100} onChange={(v) => setPrices((p) => ({ ...p, [d.key]: v }))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              ⚠️ Энд зөвхөн одоо сонгогдсон материалын системүүд харагдана — өөр сонголтын норм/үнийг засахын тулд эхлээд «Материал сонголт» хэсэгт тухайн сонголтоо идэвхжүүлнэ. «Хүн/цаг · нэгжид» = тухайн ажлын нэгжид зарцуулах хөдөлмөр (ажлын хөлс = тоо хэмжээ × хүн/цаг × ангиллын цагийн тариф). «Угсралттай» гэсэн үнэтэй материалын (цонх, хаалга, таталттай тааз, винт шон) хүн/цаг нь 0 — хөлс нь үнэнд орсон. Бүх утга нь жишиг тул албан ёсны БНБД норм болон 2026 оны зах зээлийн үнээр шинэчилнэ үү.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

/* Хурдан тооцоолуур (QuickPlanner) зэрэг бусад хэсэгт хуваалцах хөдөлгүүр */
export {
  SYSTEMS, COMMON_ITEMS,
  DEFAULT_NORMS, DEFAULT_PRICES, DEFAULT_LABOR,
  DEFAULT_SETTINGS, DEFAULT_SELECTIONS, DEFAULT_MEP,
  computeGeometry, rateOf, rect, fmt, fmtT,
};
