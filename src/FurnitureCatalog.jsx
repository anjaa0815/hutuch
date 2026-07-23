/* ============================================================
   ХӨТӨЧ — Тавилга, сантехникийн каталог
   Планд тавилга байрлуулах: жинхэнэ хэмжээтэй (см), эргүүлэх,
   зөөх боломжтой. Зөвхөн харагдац — материал, төсөвт нөлөөлөхгүй.

   Зарим тэмдэгт arcada-planner (MIT)-ээс, бусад нь өөрсдийн зурсан.
   ============================================================ */

/* Тэмдэгт бүр: viewBox 0 0 100 100 дотор зурагдсан, дүүргэлт currentColor */
const ICONS = {
  bed_single: (
    <g>
      <rect x="12" y="8" width="76" height="84" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="18" y="14" width="64" height="22" rx="3" fill="currentColor" opacity="0.18" />
      <line x1="12" y1="40" x2="88" y2="40" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  bed_double: (
    <g>
      <rect x="8" y="8" width="84" height="84" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="14" y="14" width="34" height="22" rx="3" fill="currentColor" opacity="0.18" />
      <rect x="52" y="14" width="34" height="22" rx="3" fill="currentColor" opacity="0.18" />
      <line x1="8" y1="40" x2="92" y2="40" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  wardrobe: (
    <g>
      <rect x="8" y="20" width="84" height="60" rx="3" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
      <circle cx="45" cy="50" r="2.5" fill="currentColor" />
      <circle cx="55" cy="50" r="2.5" fill="currentColor" />
    </g>
  ),
  sofa: (
    <g>
      <rect x="6" y="30" width="88" height="46" rx="6" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="6" y="18" width="88" height="16" rx="5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
      <line x1="35" y1="34" x2="35" y2="76" stroke="currentColor" strokeWidth="2" />
      <line x1="65" y1="34" x2="65" y2="76" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  armchair: (
    <g>
      <rect x="20" y="28" width="60" height="50" rx="6" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="20" y="18" width="60" height="14" rx="5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  table_dining: (
    <g>
      <rect x="14" y="26" width="72" height="48" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="24" y="10" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="58" y="10" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="24" y="78" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="58" y="78" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  table_round: (
    <g>
      <circle cx="50" cy="50" r="32" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </g>
  ),
  desk: (
    <g>
      <rect x="8" y="32" width="84" height="36" rx="3" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="62" y="36" width="26" height="28" rx="2" fill="currentColor" opacity="0.12" />
      <line x1="62" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  fridge: (
    <g>
      <rect x="24" y="10" width="52" height="80" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <line x1="24" y1="38" x2="76" y2="38" stroke="currentColor" strokeWidth="2.5" />
      <line x1="68" y1="20" x2="68" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="68" y1="48" x2="68" y2="62" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  stove: (
    <g>
      <rect x="14" y="14" width="72" height="72" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <circle cx="34" cy="34" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="66" cy="34" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="34" cy="66" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="66" cy="66" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </g>
  ),
  sink_kitchen: (
    <g>
      <rect x="10" y="24" width="80" height="52" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="18" y="32" width="40" height="36" rx="3" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" />
      <circle cx="74" cy="40" r="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M74 44 Q74 56 62 56" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </g>
  ),
  counter: (
    <g>
      <rect x="6" y="34" width="88" height="32" rx="3" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <line x1="34" y1="34" x2="34" y2="66" stroke="currentColor" strokeWidth="1.5" />
      <line x1="62" y1="34" x2="62" y2="66" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  toilet: (
    <g>
      <rect x="34" y="8" width="32" height="20" rx="3" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="50" cy="58" rx="24" ry="30" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="50" cy="58" rx="14" ry="20" fill="currentColor" opacity="0.1" />
    </g>
  ),
  bathtub: (
    <g>
      <rect x="8" y="22" width="84" height="56" rx="12" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="16" y="30" width="68" height="40" rx="8" fill="currentColor" opacity="0.1" />
      <circle cx="80" cy="34" r="3" fill="currentColor" />
    </g>
  ),
  shower: (
    <g>
      <rect x="16" y="16" width="68" height="68" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <path d="M16 16 L84 84" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="30" cy="30" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </g>
  ),
  sink_bath: (
    <g>
      <ellipse cx="50" cy="54" rx="30" ry="24" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="50" cy="54" rx="18" ry="13" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="26" r="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </g>
  ),
  washer: (
    <g>
      <rect x="16" y="12" width="68" height="76" rx="4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="56" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="56" r="12" fill="currentColor" opacity="0.1" />
      <line x1="22" y1="24" x2="78" y2="24" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  stairs: (
    <g>
      <rect x="14" y="10" width="72" height="80" fill="#fff" stroke="currentColor" strokeWidth="3" />
      {[22, 34, 46, 58, 70, 82].map((y) => (
        <line key={y} x1="14" y1={y} x2="86" y2={y} stroke="currentColor" strokeWidth="2" />
      ))}
      <path d="M50 84 L50 20 M44 28 L50 20 L56 28" stroke="currentColor" strokeWidth="2.5" fill="none" />
    </g>
  ),
  boiler: (
    <g>
      <rect x="26" y="14" width="48" height="72" rx="5" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M46 46 Q50 34 54 46" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="34" y1="66" x2="66" y2="66" stroke="currentColor" strokeWidth="2" />
      <line x1="34" y1="74" x2="66" y2="74" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  radiator: (
    <g>
      <rect x="10" y="30" width="80" height="40" rx="3" fill="#fff" stroke="currentColor" strokeWidth="3" />
      {[22, 34, 46, 58, 70, 82].map((x) => (
        <line key={x} x1={x} y1="30" x2={x} y2="70" stroke="currentColor" strokeWidth="2" />
      ))}
    </g>
  ),
  car: (
    <g>
      <rect x="26" y="8" width="48" height="84" rx="10" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <path d="M32 30 L68 30 L64 18 L36 18 Z" fill="currentColor" opacity="0.15" />
      <path d="M32 62 L68 62 L64 78 L36 78 Z" fill="currentColor" opacity="0.15" />
    </g>
  ),
  tv: (
    <g>
      <rect x="8" y="36" width="84" height="20" rx="2" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <rect x="14" y="40" width="72" height="12" fill="currentColor" opacity="0.15" />
      <line x1="42" y1="56" x2="58" y2="56" stroke="currentColor" strokeWidth="3" />
    </g>
  ),
};

/* Каталог: бодит хэмжээ сантиметрээр (w = өргөн, d = гүн) */
export const FURNITURE = [
  // Унтлагын өрөө
  { id: "bed_double", icon: "bed_double", name: "Хос ор", cat: "Унтлага", w: 160, d: 200 },
  { id: "bed_single", icon: "bed_single", name: "Ганц ор", cat: "Унтлага", w: 90, d: 200 },
  { id: "wardrobe", icon: "wardrobe", name: "Хувцасны шүүгээ", cat: "Унтлага", w: 180, d: 60 },
  { id: "bedside", icon: "bed_single", name: "Шүүгээ", cat: "Унтлага", w: 45, d: 40 },
  // Зочны өрөө
  { id: "sofa", icon: "sofa", name: "Буйдан", cat: "Зочны", w: 200, d: 90 },
  { id: "armchair", icon: "armchair", name: "Сандал", cat: "Зочны", w: 80, d: 85 },
  { id: "tv", icon: "tv", name: "Зурагт", cat: "Зочны", w: 120, d: 30 },
  { id: "table_round", icon: "table_round", name: "Дугуй ширээ", cat: "Зочны", w: 110, d: 110 },
  // Гал тогоо
  { id: "table_dining", icon: "table_dining", name: "Хоолны ширээ", cat: "Гал тогоо", w: 160, d: 90 },
  { id: "fridge", icon: "fridge", name: "Хөргөгч", cat: "Гал тогоо", w: 60, d: 65 },
  { id: "stove", icon: "stove", name: "Зуух (плита)", cat: "Гал тогоо", w: 60, d: 60 },
  { id: "sink_kitchen", icon: "sink_kitchen", name: "Гал тогооны угаалтуур", cat: "Гал тогоо", w: 80, d: 60 },
  { id: "counter", icon: "counter", name: "Тавцан", cat: "Гал тогоо", w: 200, d: 60 },
  // Ариун цэвэр
  { id: "toilet", icon: "toilet", name: "Суултуур", cat: "Ариун цэвэр", w: 40, d: 70 },
  { id: "bathtub", icon: "bathtub", name: "Ванн", cat: "Ариун цэвэр", w: 170, d: 75 },
  { id: "shower", icon: "shower", name: "Шүршүүр", cat: "Ариун цэвэр", w: 90, d: 90 },
  { id: "sink_bath", icon: "sink_bath", name: "Гар угаагуур", cat: "Ариун цэвэр", w: 55, d: 45 },
  { id: "washer", icon: "washer", name: "Угаалгын машин", cat: "Ариун цэвэр", w: 60, d: 60 },
  // Инженерийн
  { id: "boiler", icon: "boiler", name: "Зуух / бойлер", cat: "Инженер", w: 60, d: 60 },
  { id: "radiator", icon: "radiator", name: "Радиатор", cat: "Инженер", w: 100, d: 12 },
  { id: "stairs", icon: "stairs", name: "Шат", cat: "Инженер", w: 100, d: 250 },
  { id: "desk", icon: "desk", name: "Ажлын ширээ", cat: "Инженер", w: 140, d: 70 },
  { id: "car", icon: "car", name: "Машин (гараж)", cat: "Инженер", w: 180, d: 450 },
];

export const FURNITURE_CATS = ["Унтлага", "Зочны", "Гал тогоо", "Ариун цэвэр", "Инженер"];

/* Тэмдэгтийг SVG-д зурах — планд байрлуулахад ашиглана */
export function FurnitureIcon({ type, size = 100, color = "#57534e" }) {
  const icon = ICONS[type] || ICONS.desk;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ color }}>
      {icon}
    </svg>
  );
}

/* Планд байрлуулсан нэг тавилга (метрээр, эргэлттэй) */
export function PlacedFurniture({ item, X, Y, SCALE, selected, onPointerDown, onDelete }) {
  const w = (item.w / 100) * SCALE;  // см → м → пиксел
  const d = (item.d / 100) * SCALE;
  const cx = X(item.x), cy = Y(item.y);
  const def = FURNITURE.find((f) => f.id === item.type);
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${item.rot || 0})`}
      onPointerDown={onPointerDown} style={{ cursor: "move" }}>
      <rect x={-w / 2} y={-d / 2} width={w} height={d}
        fill={selected ? "#fed7aa" : "transparent"} stroke={selected ? "#ea580c" : "transparent"}
        strokeWidth={selected ? 2 : 0} rx={2} />
      <g transform={`translate(${-w / 2} ${-d / 2}) scale(${w / 100} ${d / 100})`}>
        {ICONS[def?.icon] || ICONS.desk}
      </g>
      {selected && (
        <g>
          <circle cx={w / 2 + 10} cy={-d / 2 - 10} r={9} fill="#ef4444"
            onPointerDown={(e) => { e.stopPropagation(); onDelete(); }} style={{ cursor: "pointer" }} />
          <text x={w / 2 + 10} y={-d / 2 - 6} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700"
            style={{ pointerEvents: "none" }}>×</text>
        </g>
      )}
    </g>
  );
}
