/* ============================================================
   ХӨТӨЧ — DXF (CAD) экспорт
   Планыг AutoCAD/BricsCAD/NanoCAD-д нээгддэг DXF болгоно.
   Формат: DXF R12 (хамгийн өргөн нийцтэй), нэгж = МИЛЛИМЕТР.
   Давхарга: WALL-EXT, WALL-INT, DOOR, WINDOW, FURNITURE, TEXT
   ============================================================ */

const MM = 1000;               // 1м = 1000мм
const F = (v) => (Math.round(v * 100) / 100).toFixed(2);

/* Кирилл үсгийг DXF-ийн \U+XXXX escape болгоно (CAD-д зөв уншигдана) */
function dxfStr(s) {
  return String(s || "").split("").map((ch) => {
    const c = ch.charCodeAt(0);
    return c < 128 ? ch : "\\U+" + c.toString(16).toUpperCase().padStart(4, "0");
  }).join("");
}

/* --- Үндсэн элементүүд --- */
const line = (layer, x1, y1, x2, y2) =>
  `0\nLINE\n8\n${layer}\n10\n${F(x1)}\n20\n${F(y1)}\n30\n0.0\n11\n${F(x2)}\n21\n${F(y2)}\n31\n0.0\n`;

const arc = (layer, cx, cy, r, a1, a2) =>
  `0\nARC\n8\n${layer}\n10\n${F(cx)}\n20\n${F(cy)}\n30\n0.0\n40\n${F(r)}\n50\n${F(a1)}\n51\n${F(a2)}\n`;

const text = (layer, x, y, h, s, rot = 0) =>
  `0\nTEXT\n8\n${layer}\n10\n${F(x)}\n20\n${F(y)}\n30\n0.0\n40\n${F(h)}\n1\n${dxfStr(s)}\n50\n${F(rot)}\n`;

const LAYERS = [
  ["WALL-EXT", 7], ["WALL-INT", 8], ["DOOR", 3],
  ["WINDOW", 5], ["FURNITURE", 9], ["TEXT", 2], ["DIM", 1],
];

/* --- Туслах геометр --- */
const polyArea = (pts) => Math.abs(pts.reduce((a, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return a + (p.x * q.y - q.x * p.y);
}, 0) / 2);

/**
 * Планыг DXF текст болгож хөрвүүлнэ.
 * @param {Array} rooms      — өрөөнүүд (points, openings, wallKind, name)
 * @param {Array} freeWalls  — дан хана [{a,b,kind}]
 * @param {Array} furniture  — тавилга [{x,y,w,d,rot}] (w,d нь СМ)
 */
export function buildDXF(rooms = [], freeWalls = [], furniture = []) {
  const all = rooms.flatMap((r) => r.points)
    .concat(freeWalls.flatMap((w) => [w.a, w.b]));
  const maxY = all.length ? Math.max(...all.map((p) => p.y)) : 0;
  /* CAD-ын Y тэнхлэг дээшээ, дэлгэцийнх доошоо — эргүүлнэ */
  const X = (x) => x * MM;
  const Y = (y) => (maxY - y) * MM;

  let e = "";

  /* --- Өрөөний хана --- */
  rooms.forEach((r) => {
    const layer = r.wallKind === "int" ? "WALL-INT" : "WALL-EXT";
    r.points.forEach((p, i) => {
      const q = r.points[(i + 1) % r.points.length];
      e += line(layer, X(p.x), Y(p.y), X(q.x), Y(q.y));
    });

    /* --- Хаалга, цонх --- */
    (r.openings || []).forEach((o) => {
      const p = r.points[o.edge % r.points.length];
      const q = r.points[(o.edge + 1) % r.points.length];
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      if (len < 0.1) return;
      const ux = (q.x - p.x) / len, uy = (q.y - p.y) / len;   // ирмэгийн нэгж вектор
      const nx = -uy, ny = ux;                                 // нормаль
      const w = Math.min(o.w || 0.9, len * 0.9);
      const cx = p.x + ux * (len * o.t), cy = p.y + uy * (len * o.t);
      const ax = cx - ux * w / 2, ay = cy - uy * w / 2;        // эхлэл
      const bx = cx + ux * w / 2, by = cy + uy * w / 2;        // төгсгөл

      if (o.type === "win") {
        /* Цонх — хананы завсарт хос зураас */
        const off = 0.04;
        e += line("WINDOW", X(ax + nx * off), Y(ay + ny * off), X(bx + nx * off), Y(by + ny * off));
        e += line("WINDOW", X(ax - nx * off), Y(ay - ny * off), X(bx - nx * off), Y(by - ny * off));
        e += line("WINDOW", X(ax), Y(ay), X(ax), Y(ay));
      } else {
        /* Хаалга — далбаа + нээгдэх нум */
        e += line("DOOR", X(ax), Y(ay), X(ax + nx * w), Y(ay + ny * w));
        const a0 = Math.atan2(-(uy), ux) * 180 / Math.PI;      // Y эргүүлсэн тул -uy
        e += arc("DOOR", X(ax), Y(ay), w * MM, a0, a0 + 90);
      }
    });

    /* --- Өрөөний нэр, талбай --- */
    const cx = r.points.reduce((a, p) => a + p.x, 0) / r.points.length;
    const cy = r.points.reduce((a, p) => a + p.y, 0) / r.points.length;
    const area = polyArea(r.points);
    e += text("TEXT", X(cx) - 600, Y(cy) + 100, 200, r.name || "Өрөө");
    e += text("TEXT", X(cx) - 600, Y(cy) - 200, 150, `${area.toFixed(1)} m2`);
  });

  /* --- Дан хана --- */
  freeWalls.forEach((w) => {
    e += line(w.kind === "int" ? "WALL-INT" : "WALL-EXT", X(w.a.x), Y(w.a.y), X(w.b.x), Y(w.b.y));
  });

  /* --- Тавилга (см → м, эргэлттэй) --- */
  furniture.forEach((f) => {
    const hw = (f.w / 100) / 2, hd = (f.d / 100) / 2;
    const rad = ((f.rot || 0) * Math.PI) / 180;
    const cs = Math.cos(rad), sn = Math.sin(rad);
    const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([dx, dy]) => ({
      x: f.x + dx * cs - dy * sn,
      y: f.y + dx * sn + dy * cs,
    }));
    corners.forEach((c, i) => {
      const n = corners[(i + 1) % 4];
      e += line("FURNITURE", X(c.x), Y(c.y), X(n.x), Y(n.y));
    });
  });

  /* --- Гарчиг --- */
  const totalArea = rooms.reduce((a, r) => a + polyArea(r.points), 0);
  e += text("TEXT", 0, -800, 300, `hutuch.com — ${totalArea.toFixed(1)} m2, ${rooms.length} oroo`);
  e += text("TEXT", 0, -1400, 180, "Neg = millimeter. Ajlyn zurag bolgohod inzhener batalgaajuulna.");

  /* --- Давхаргын хүснэгт --- */
  let tbl = `0\nTABLE\n2\nLAYER\n70\n${LAYERS.length}\n`;
  LAYERS.forEach(([n, c]) => {
    tbl += `0\nLAYER\n2\n${n}\n70\n0\n62\n${c}\n6\nCONTINUOUS\n`;
  });
  tbl += "0\nENDTAB\n";

  return [
    "0\nSECTION\n2\nHEADER\n",
    "9\n$ACADVER\n1\nAC1009\n",
    "9\n$INSUNITS\n70\n4\n",           // 4 = миллиметр
    "0\nENDSEC\n",
    "0\nSECTION\n2\nTABLES\n", tbl, "0\nENDSEC\n",
    "0\nSECTION\n2\nENTITIES\n", e, "0\nENDSEC\n",
    "0\nEOF\n",
  ].join("");
}

/* Файл болгож татах */
export function downloadDXF(rooms, freeWalls, furniture, name = "hutuch-plan") {
  const blob = new Blob([buildDXF(rooms, freeWalls, furniture)], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.dxf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
