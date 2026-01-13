import React, { useState, useEffect } from 'react';
import { 
  Calculator, BrickWall, PaintBucket, Ruler, Info, 
  Menu, X, Grid, Cylinder, Box, Scroll, Coins, 
  ShoppingBag, Truck, Phone, MapPin, ChevronRight, Star,
  UserPlus, Save, CheckCircle, ShoppingCart, CreditCard, 
  Receipt, Building2, AlertCircle, FileText, Search, ArrowLeft, Home,
  BookOpen, Hammer, Youtube, CheckSquare, Palette, Image as ImageIcon,
  Container, Wrench, Clock, Users, Anchor, ClipboardList, Package, Compass, ArrowRight,
  Sun, Moon, Facebook, Instagram, Twitter, Mail, LayoutDashboard, Layers, Divide, Combine,
  TrendingUp, CornerDownRight, RotateCw, Filter, HardHat, DollarSign, ChevronDown, ChevronUp, PieChart,
  Warehouse, Fence, Square, Layout, Check, Play, RefreshCw, DoorOpen, Maximize
} from 'lucide-react';
import { Layers as AlignVerticalJustifyStart } from 'lucide-react';

// --- 1. DATA CONSTANTS ---

const HOUSE_OPTIONS = {
  foundation: [
    { id: 'strip', name: 'Туузан суурь', price: 15000000, color: '#64748b', type: 'solid', desc: 'Бат бөх, найдвартай' }, 
    { id: 'pile', name: 'Баганан суурь', price: 8500000, color: '#94a3b8', type: 'dots', desc: 'Зардал бага, хөнгөн' },
    { id: 'slab', name: 'Хавтан суурь', price: 18000000, color: '#475569', type: 'solid', desc: 'Намгархаг хөрсөнд' }, 
  ],
  wall: [
    { id: 'block_light', name: 'Хөнгөн блок', price: 25000000, color: '#e2e8f0', pattern: 'block', desc: 'Дулаан алдагдал бага' }, 
    { id: 'brick_red', name: 'Улаан тоосго', price: 35000000, color: '#ef4444', pattern: 'brick', desc: 'Уламжлалт, бат бөх' },
    { id: 'brick_black', name: 'Хар тоосго', price: 38000000, color: '#334155', pattern: 'brick', desc: 'Модерн загвар' },
    { id: 'timber', name: 'Дүнзэн (Мод)', price: 45000000, color: '#d97706', pattern: 'wood', desc: 'Эко, дулаан' },
  ],
  roof: [
    { id: 'gable_red', name: 'Төмөр (Улаан)', price: 8500000, color: '#b91c1c', type: 'gable', desc: 'Энгийн хийц' }, 
    { id: 'gable_black', name: 'Битамон (Хар)', price: 12000000, color: '#1e293b', type: 'gable', desc: 'Дуу чимээ бага' },
    { id: 'hip_green', name: 'Майхан (Ногоон)', price: 10500000, color: '#15803d', type: 'hip', desc: 'Салхинд тэсвэртэй' },
    { id: 'flat', name: 'Хавтгай', price: 15000000, color: '#475569', type: 'flat', desc: 'Террас хийх боломжтой' },
  ],
  window: [
    { id: 'standard', name: 'Стандарт', price: 4500000, type: 'std', desc: '2 давхар шил' }, 
    { id: 'triple', name: '3 давхар шил', price: 6500000, type: 'std', desc: 'Дулаан' },
    { id: 'panoramic', name: 'Панорама', price: 9500000, type: 'pano', desc: 'Шалнаас тааз хүртэл' },
  ],
  door: [
    { id: 'metal', name: 'Бүргэд', price: 650000, color: '#7f1d1d', desc: 'ОХУ стандарт' }, 
    { id: 'smart', name: 'Ухаалаг (Хар)', price: 2500000, color: '#171717', desc: 'Код, хурууны хээ' },
    { id: 'white', name: 'Цагаан', price: 850000, color: '#f1f5f9', desc: 'Модерн' },
  ],
  facade: [
    { id: 'none', name: 'Өнгөлгөөгүй', price: 0, color: 'transparent', desc: 'Үндсэн хана' },
    { id: 'stucco', name: 'Чулуун замаск', price: 25000, color: '#f5f5f4', pattern: 'noise', desc: 'Гоёлын шавардлага' },
    { id: 'siding', name: 'Сайдинг', price: 45000, color: '#cbd5e1', pattern: 'lines', desc: 'Металл өнгөлгөө' },
  ]
};

const MATERIALS_DB = [
  { id: 'cement', category: 'structure', name: 'Бетон / Суурь', icon: <Box size={24}/>, desc: 'Суурь, шал, багана цутгалт' },
  { id: 'brick', category: 'structure', name: 'Хана / Өрлөг', icon: <BrickWall size={24}/>, desc: 'Блок, тоосго, даацын хана' },
  { id: 'roof', category: 'structure', name: 'Дээвэр', icon: <Home size={24}/>, desc: 'Төмөр дээвэр, дулаалга' },
  { id: 'sand', category: 'structure', name: 'Элс / Хайрга', icon: <Box size={24}/>, desc: 'Зуурмаг бэлтгэх' },
  { id: 'paint', category: 'finishing', name: 'Будаг / Замаск', icon: <PaintBucket size={24}/>, desc: 'Дотор, гадна засал' },
  { id: 'tile', category: 'finishing', name: 'Плита / Чулуу', icon: <Grid size={24}/>, desc: 'Ванн, гал тогоо' },
  { id: 'floor', category: 'finishing', name: 'Паркет / Шал', icon: <Ruler size={24}/>, desc: 'Ламинат, модон шал' },
  { id: 'wallpaper', category: 'finishing', name: 'Обой', icon: <Scroll size={24}/>, desc: 'Хананы гоёл' },
];

const INITIAL_SUPPLIERS = {
  cement: [
    { id: 1, name: 'Төмөр Трейд', price: 24000, location: '100 айл', delivery: true, rating: 4.5, vatPayer: true, image: 'https://placehold.co/150x150/e2e8f0/64748b?text=Cement', tags: ['M300', 'Портланд'] },
    { id: 2, name: 'Барилга МН', price: 23500, location: 'Гурвалжин', delivery: false, rating: 4.0, vatPayer: true, image: 'https://placehold.co/150x150/e2e8f0/64748b?text=Cement', tags: ['M200'] },
  ],
  brick: [{ id: 4, name: 'Налайх Тоосго', price: 650, location: 'Налайх', delivery: true, rating: 4.2, vatPayer: true, image: 'https://placehold.co/150x150/ef4444/fee2e2?text=Brick', tags: ['Улаан'] }],
};

const GROUP_BUYS = [
  { id: 'g1', title: 'Арматур (Шууд үйлдвэрээс)', origin: 'Бээжин, Хятад', deadline: '3 хоногийн дараа', target: 20, current: 14, price: 2100000, marketPrice: 2600000, image: 'https://placehold.co/300x150/e2e8f0/64748b?text=Rebar+China', desc: 'Хэбэй мужийн гангийн үйлдвэрээс шууд татан авалт.' },
  { id: 'g2', title: 'Гоёлын Плита', origin: 'Гуанжоу, Хятад', deadline: '5 хоногийн дараа', target: 1000, current: 650, price: 28000, marketPrice: 45000, image: 'https://placehold.co/300x150/cffafe/0891b2?text=Tile+Guangzhou', desc: '60x60 хэмжээтэй, сайн чанарын чулуун плита.' }
];

const RENTALS = [
  { id: 'r1', name: 'Бетон зуурмагийн машин', price: 150000, unit: 'цаг', image: 'https://placehold.co/100x100/fef3c7/d97706?text=Pump', desc: '36м урттай, өндөр бүтээмжтэй.' },
  { id: 'r2', name: 'Барилгын шат', price: 2000, unit: 'өдөр', image: 'https://placehold.co/100x100/e5e7eb/374151?text=Scaffold', desc: '1.8м өндөртэй, аюулгүй байдал хангасан.' },
];

const ESTIMATOR_DATA = {
  foundation: {
    title: 'Суурийн ажил',
    desc: 'Бүрэн цутгамал туузан суурь',
    items: [
      { id: 'cem', name: 'Цемент (M400)', unit: 'шуудай', calc: (w, l) => Math.ceil(((w+l)*2 * 0.4 * 1.0) * 7) }, 
      { id: 'sand', name: 'Элс', unit: 'портер', calc: (w, l) => Math.ceil(((w+l)*2 * 0.4 * 1.0) * 0.5) }, 
    ],
    tools: ['Хүрз', 'Түрдэг тэрэг', 'Доргиур']
  },
  wall: {
    title: 'Хана & Өрлөг',
    desc: '64-ийн хана (36см зузаан)',
    items: [
      { id: 'blk', name: 'Хөнгөн блок', unit: 'ш', calc: (w, l) => Math.ceil(((w+l)*2 * 2.8) * 13) }, 
      { id: 'mort', name: 'Өрлөгийн зуурмаг', unit: 'шуудай', calc: (w, l) => Math.ceil(((w+l)*2 * 2.8) * 0.5) },
    ],
    tools: ['Өрлөгийн нийлүүр', 'Шохойтой утас']
  },
  roof: {
    title: 'Дээвэр',
    desc: '2 налуу дээвэр',
    items: [
      { id: 'sheet', name: 'Дээврийн төмөр', unit: 'ш', calc: (w, l) => Math.ceil((w * l * 1.3) / 1.5) },
      { id: 'scr_b', name: 'Шруп', unit: 'хайрцаг', calc: () => 3 },
    ],
    tools: ['Дрель', 'Тасдагч', 'Аюулгүйн бүс']
  }
};

const CALCULATOR_CATEGORIES = [
  { 
    id: 'foundation', 
    name: 'Суурь', 
    icon: <Box size={24}/>, 
    desc: 'Туузан, хавтан, баганан суурь',
    types: [
      { id: 'strip_foundation', name: 'Туузан суурь', desc: 'Периметрийн дагуу цутгах бетон', inputs: ['length', 'width', 'height', 'thickness'] },
      { id: 'slab_foundation', name: 'Хавтан суурь', desc: 'Нийт талбайн цутгалт', inputs: ['length', 'width', 'height'] },
      { id: 'pile_foundation', name: 'Баганан суурь (Дугуй)', desc: 'Дугуй огтлолтой шон суурь', inputs: ['count', 'diameter', 'height'] },
      { id: 'square_pile_foundation', name: 'Баганан суурь (Дөрвөлжин)', desc: 'Дөрвөлжин огтлолтой шон суурь', inputs: ['count', 'width', 'height'] }
    ] 
  },
  { 
    id: 'wall', 
    name: 'Хана', 
    icon: <BrickWall size={24}/>, 
    desc: 'Тоосго, блок, хаалт',
    types: [
      { id: 'brick_wall', name: 'Тоосгон хана', desc: 'Стандарт тоосго, өрлөг', inputs: ['length', 'height'] },
      { id: 'block_wall', name: 'Блокон хана', desc: 'Хөнгөн блок, бетон блок', inputs: ['length', 'height'] }
    ] 
  },
  { 
    id: 'roof', 
    name: 'Дээвэр', 
    icon: <Home size={24}/>, 
    desc: '1 ба 2 налуу дээвэр',
    types: [
      { id: 'gable_roof', name: '2 налуу дээвэр', desc: 'Төмөр дээвэр, стропил', inputs: ['length', 'width'] },
      { id: 'shed_roof', name: '1 налуу дээвэр', desc: 'Амбаар, гаражийн дээвэр', inputs: ['length', 'width'] }
    ] 
  },
  { 
    id: 'floor', 
    name: 'Шал', 
    icon: <Grid size={24}/>, 
    desc: 'Бетон, модон, паркет',
    types: [
      { id: 'concrete_floor', name: 'Бетон шал', desc: 'Тэгшилгээ, цутгалт', inputs: ['length', 'width', 'thickness'] },
      { id: 'wood_floor', name: 'Паркет шал', desc: 'Ламинат, модон шал', inputs: ['length', 'width'] },
      { id: 'vinyl_floor', name: 'Хулдаасан шал', desc: 'Линолеум, PVC хулдаас', inputs: ['length', 'width'] }
    ] 
  },
  { 
    id: 'stairs', 
    name: 'Шат', 
    icon: <AlignVerticalJustifyStart size={24}/>, 
    desc: 'Бетон болон модон шат',
    types: [
      { id: 'straight_stairs', name: 'Шулуун шат', desc: 'Гишгүүрийн тооцоо', inputs: ['height', 'length'] }
    ] 
  }
];

const formatCurrency = (amount) => new Intl.NumberFormat('mn-MN', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ₮';

// --- 2. HELPERS & SMALL COMPONENTS ---

const InputField = ({ label, value, onChange, unit, type = "number", step = "any", min=0 }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</label>
    <div className="relative rounded-md shadow-sm">
      <input
        type={type}
        step={step}
        min={min}
        value={value === 0 && type === 'number' ? '' : value}
        onChange={(e) => {
            const val = e.target.value;
            onChange(type === 'number' ? (val === '' ? 0 : parseFloat(val)) : val);
        }}
        className="block w-full rounded-lg border-slate-300 dark:border-slate-700 pl-3 pr-12 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm shadow-sm transition-colors text-left"
      />
      {unit && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-slate-500 dark:text-slate-400 sm:text-sm font-medium">{unit}</span>
        </div>
      )}
    </div>
  </div>
);

const ShapeIcon = ({ type, active }) => {
    const color = active ? "#f97316" : "currentColor";
    const fill = active ? "#ffedd5" : "none";
    switch (type) {
        case 'rect': return <svg width="24" height="24" viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /></svg>;
        case 'l-shape': return <svg width="24" height="24" viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h8v8h8v8H4z" /></svg>;
        case 't-shape': return <svg width="24" height="24" viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v6h-5v10h-6V10H4z" /></svg>;
        case 'u-shape': return <svg width="24" height="24" viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v16h16V4h-5v10H9V4z" /></svg>;
        default: return null;
    }
};

// --- 3. CORE COMPONENTS ---

const Header = ({ cartCount, onNavigate, onOpenCart, darkMode, toggleDarkMode }) => (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
                <div className="bg-orange-600 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
                    <Compass size={24} strokeWidth={2} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Hutuch</span>
                    <span className="text-[10px] text-orange-500 font-bold tracking-widest uppercase">Smart Build</span>
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
                <button onClick={() => onNavigate('home')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Нүүр</button>
                <button onClick={() => onNavigate('builder')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Визуал</button>
                <button onClick={() => onNavigate('services')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Үйлчилгээ</button>
                <button onClick={() => onNavigate('estimator')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Төсөвлөх</button>
            </nav>

            <div className="flex items-center gap-3">
                <button onClick={toggleDarkMode} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">
                    {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
                </button>
                <button onClick={onOpenCart} className="relative p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">
                    <ShoppingBag size={20} />
                    {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">{cartCount}</span>}
                </button>
            </div>
        </div>
    </header>
);

const Footer = () => (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2 justify-center md:justify-start">
                        <Compass className="text-orange-600" /> Hutuch
                    </h3>
                    <p className="text-slate-500 text-sm mt-2">Барилгын ухаалаг туслах.</p>
                </div>
                <div className="text-xs text-slate-400">
                    &copy; 2026 Hutuch.com. All rights reserved.
                </div>
            </div>
        </div>
    </footer>
);

// --- 4. VISUAL BUILDER COMPONENTS (SVG) ---

const HouseVisualizer = ({ config, floors }) => {
    const wallOpt = HOUSE_OPTIONS.wall.find(w => w.id === config.wall) || HOUSE_OPTIONS.wall[0];
    const roofOpt = HOUSE_OPTIONS.roof.find(r => r.id === config.roof) || HOUSE_OPTIONS.roof[0];
    const foundationOpt = HOUSE_OPTIONS.foundation.find(f => f.id === config.foundation) || HOUSE_OPTIONS.foundation[0];
    const doorOpt = HOUSE_OPTIONS.door.find(d => d.id === config.door) || HOUSE_OPTIONS.door[0];
    const windowOpt = HOUSE_OPTIONS.window.find(w => w.id === config.window) || HOUSE_OPTIONS.window[0];
    const facadeOpt = HOUSE_OPTIONS.facade.find(f => f.id === config.facade) || HOUSE_OPTIONS.facade[0];

    const wallColor = facadeOpt.id !== 'none' ? facadeOpt.color : wallOpt.color;
    const roofColor = roofOpt.color;
    const foundColor = foundationOpt.color;
    const doorColor = doorOpt.color;

    const renderPatterns = () => (
        <defs>
            <pattern id="brickPattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
                <rect width="20" height="10" fill={wallColor} />
                <path d="M0 10h20M10 0v10" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
            </pattern>
            <pattern id="blockPattern" x="0" y="0" width="30" height="15" patternUnits="userSpaceOnUse">
                <rect width="30" height="15" fill={wallColor} />
                <path d="M0 15h30M15 0v15" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
            </pattern>
            <pattern id="woodPattern" x="0" y="0" width="40" height="10" patternUnits="userSpaceOnUse">
                <rect width="40" height="10" fill={wallColor} />
                <path d="M0 10h40" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
            </pattern>
            <pattern id="sidingPattern" x="0" y="0" width="40" height="10" patternUnits="userSpaceOnUse">
                <rect width="40" height="10" fill={wallColor} />
                <path d="M0 10h40" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
            </pattern>
            <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
            <linearGradient id="nightWindow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
        </defs>
    );

    const getWallFill = () => {
        if (facadeOpt.id === 'siding') return 'url(#sidingPattern)';
        if (wallOpt.pattern === 'brick' && facadeOpt.id === 'none') return 'url(#brickPattern)';
        if (wallOpt.pattern === 'block' && facadeOpt.id === 'none') return 'url(#blockPattern)';
        if (wallOpt.pattern === 'wood' && facadeOpt.id === 'none') return 'url(#woodPattern)';
        return wallColor;
    };

    const WindowSVG = ({ x, y, w, h }) => {
        const isPano = windowOpt.type === 'pano';
        return (
            <g transform={`translate(${x}, ${y})`}>
                <rect width={w} height={h} fill="url(#windowGrad)" className="dark:fill-[url(#nightWindow)]" stroke="white" strokeWidth="2" />
                {!isPano && (
                    <>
                         <line x1={w/2} y1="0" x2={w/2} y2={h} stroke="white" strokeWidth="2" />
                         <line x1="0" y1={h/2} x2={w} y2={h/2} stroke="white" strokeWidth="2" />
                    </>
                )}
                {isPano && <line x1="0" y1={h/2} x2={w} y2={h/2} stroke="white" strokeWidth="2" />}
            </g>
        );
    };

    const houseHeightClass = floors === 2 ? 'h-64' : 'h-40';

    return (
        <div className="w-full h-80 flex items-end justify-center">
            <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl">
                {renderPatterns()}

                {/* --- HOUSE GROUP --- */}
                <g transform="translate(50, 50)">
                    
                    {/* ROOF */}
                    {roofOpt.type === 'gable' && <path d="M-20 100 L100 20 L220 100 Z" fill={roofColor} />}
                    {roofOpt.type === 'flat' && <rect x="-10" y="80" width="220" height="20" fill={roofColor} />}
                    {roofOpt.type === 'hip' && <path d="M-10 100 L40 40 L160 40 L210 100 Z" fill={roofColor} />}

                    {/* WALLS (Body) */}
                    <rect x="0" y="100" width="200" height={floors === 2 ? 180 : 120} fill={getWallFill()} />

                    {/* WINDOWS & DOOR */}
                    {floors === 2 ? (
                        <>
                            {/* 2nd Floor */}
                            <WindowSVG x="20" y="120" w="60" h={windowOpt.type === 'pano' ? 50 : 40} />
                            <WindowSVG x="120" y="120" w="60" h={windowOpt.type === 'pano' ? 50 : 40} />
                            {/* 1st Floor */}
                            <WindowSVG x="20" y="200" w="60" h={windowOpt.type === 'pano' ? 70 : 40} />
                            <rect x="130" y="200" width="40" height="80" fill={doorColor} stroke="white" strokeWidth="2" />
                        </>
                    ) : (
                        <>
                            {/* 1 Floor Layout */}
                            <WindowSVG x="20" y="130" w="60" h={windowOpt.type === 'pano' ? 80 : 50} />
                            <WindowSVG x="120" y="130" w="60" h={windowOpt.type === 'pano' ? 80 : 50} />
                            <rect x="85" y="150" width="30" height="70" fill={doorColor} stroke="white" strokeWidth="2" />
                        </>
                    )}

                    {/* FOUNDATION */}
                    <rect x="-5" y={floors === 2 ? 280 : 220} width="210" height="15" fill={foundColor} />
                </g>
            </svg>
        </div>
    );
};

const BuilderControls = ({ step, config, setConfig, onNext, onPrev }) => {
    const steps = [
        { key: 'foundation', title: 'Суурь', options: HOUSE_OPTIONS.foundation, icon: <Box size={18}/> },
        { key: 'wall', title: 'Хана', options: HOUSE_OPTIONS.wall, icon: <BrickWall size={18}/> },
        { key: 'roof', title: 'Дээвэр', options: HOUSE_OPTIONS.roof, icon: <Home size={18}/> },
        { key: 'window', title: 'Цонх', options: HOUSE_OPTIONS.window, icon: <Maximize size={18}/> },
        { key: 'door', title: 'Хаалга', options: HOUSE_OPTIONS.door, icon: <DoorOpen size={18}/> },
        { key: 'facade', title: 'Фасад', options: HOUSE_OPTIONS.facade, icon: <PaintBucket size={18}/> },
    ];
    const currentStep = steps[step];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 shadow-2xl border-t border-slate-100 dark:border-slate-800 relative z-20 w-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-1">{steps.map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx <= step ? 'w-6 bg-orange-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>))}</div>
                <div className="text-xs font-bold text-slate-400 uppercase">{step + 1} / {steps.length}</div>
            </div>
            <h3 className="font-black text-xl text-slate-900 dark:text-white mb-4 flex items-center gap-2"><span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">{currentStep.icon}</span>{currentStep.title} сонгох</h3>
            <div className="grid grid-cols-1 gap-3 mb-8 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {currentStep.options.map(opt => (
                    <button key={opt.id} onClick={() => setConfig({ ...config, [currentStep.key]: opt.id })} className={`p-3 rounded-2xl border-2 text-left transition-all relative group flex items-center gap-4 ${config[currentStep.key] === opt.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-orange-200'}`}>
                        <div className="w-12 h-12 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0" style={{backgroundColor: opt.color}}></div>
                        <div className="flex-1"><div className="flex justify-between items-center mb-0.5"><span className={`text-sm font-bold ${config[currentStep.key] === opt.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{opt.name}</span>{opt.price > 0 && <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">{formatCurrency(opt.price)}</span>}</div><span className="text-[10px] text-slate-400 line-clamp-1">{opt.desc}</span></div>
                        {config[currentStep.key] === opt.id && <div className="text-orange-500"><CheckCircle size={20} fill="currentColor" className="text-white dark:text-slate-900" /></div>}
                    </button>
                ))}
            </div>
            <div className="flex gap-3 mt-auto">
                {step > 0 && <button onClick={onPrev} className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700">Буцах</button>}
                <button onClick={onNext} className="flex-[2] py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">{step === steps.length - 1 ? 'Дуусгах' : 'Дараах'} <ArrowRight size={18} /></button>
            </div>
        </div>
    );
};

const BreakdownModal = ({ config, isOpen, onClose, floors, dimensions }) => {
    if (!isOpen) return null;
    const footprint = dimensions.l * dimensions.w;
    const baseArea = 48; 
    const scaleFactor = footprint / baseArea;

    const items = [
        { cat: 'Суурь', ...HOUSE_OPTIONS.foundation.find(i => i.id === config.foundation), qty: 1, multiplier: scaleFactor },
        { cat: 'Хана', ...HOUSE_OPTIONS.wall.find(i => i.id === config.wall), qty: floors, multiplier: scaleFactor * floors },
        { cat: 'Дээвэр', ...HOUSE_OPTIONS.roof.find(i => i.id === config.roof), qty: 1, multiplier: scaleFactor },
        { cat: 'Цонх', ...HOUSE_OPTIONS.window.find(i => i.id === config.window), qty: 4 * floors, multiplier: 1 },
        { cat: 'Хаалга', ...HOUSE_OPTIONS.door.find(i => i.id === config.door), qty: 1, multiplier: 1 },
        { cat: 'Фасад', ...HOUSE_OPTIONS.facade.find(i => i.id === config.facade), qty: 1, multiplier: scaleFactor * floors },
    ];
    
    const total = items.reduce((sum, item) => sum + (item.price * item.multiplier || 0), 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 text-center border-b border-slate-100 dark:border-slate-700">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm"><CheckCircle size={28} /></div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Таны төсөл бэлэн!</h2>
                    <p className="text-slate-500 text-sm">{floors} давхар, {dimensions.l}x{dimensions.w}м байшин</p>
                </div>
                <div className="p-6 max-h-[40vh] overflow-y-auto">
                    <div className="space-y-4">{items.map((item, idx) => {
                        const cost = item.price * item.multiplier;
                        if (cost === 0) return null;
                        return (<div key={idx} className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-3 last:border-0 last:pb-0"><div><p className="text-xs text-slate-400 font-bold uppercase">{item.cat}</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</p></div><p className="text-sm font-mono text-slate-600 dark:text-slate-400">{formatCurrency(cost)}</p></div>)
                    })}</div>
                </div>
                <div className="bg-slate-900 dark:bg-black p-6 text-white"><div className="flex justify-between items-center mb-6"><span className="text-sm font-medium text-slate-300">Нийт төсөв</span><span className="text-2xl font-black text-orange-500">{formatCurrency(total)}</span></div><div className="grid grid-cols-2 gap-3"><button onClick={onClose} className="py-3 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 transition-colors">Засах</button><button className="py-3 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-900/20 transition-colors flex items-center justify-center gap-2"><Save size={18} /> Хадгалах</button></div></div>
            </div>
        </div>
    );
};

const VisualBuilderView = ({ onBack, initialDims, initialFloors }) => {
    const [step, setStep] = useState(0);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [config, setConfig] = useState({ foundation: 'strip', wall: 'block_light', roof: 'gable_black', window: 'standard', door: 'metal', facade: 'none' });
    const [totalPrice, setTotalPrice] = useState(0);
    
    const dims = initialDims || { l: 8, w: 6 };
    const floors = initialFloors || 1;

    useEffect(() => {
        let total = 0;
        const baseArea = 48; 
        const scaleFactor = (dims.l * dims.w) / baseArea;

        Object.keys(config).forEach(key => {
            const selected = HOUSE_OPTIONS[key].find(o => o.id === config[key]);
            if (selected && selected.price) {
                let multiplier = scaleFactor;
                if (key === 'wall' || key === 'facade') multiplier *= floors;
                if (key === 'window' || key === 'door') multiplier = 1;
                total += selected.price * multiplier;
            }
        });
        setTotalPrice(total);
    }, [config, dims, floors]);

    const handleNext = () => { if (step < 5) setStep(step + 1); else setShowBreakdown(true); };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in overflow-hidden">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 flex justify-between items-center sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
                <button onClick={onBack} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20} className="text-slate-600 dark:text-slate-300"/></button>
                <div className="text-center"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Нийт төсөв</p><p className="text-xl font-black text-slate-900 dark:text-white transition-all duration-300">{formatCurrency(totalPrice)}</p></div>
                <button onClick={() => setShowBreakdown(true)} className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"><Receipt size={20} /></button>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* Visualizer (Left/Top) */}
                <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-sky-100 to-white dark:from-slate-900 dark:to-slate-950 overflow-hidden relative min-h-[300px] lg:min-h-full">
                    <HouseVisualizer config={config} floors={floors} />
                </div>
                
                {/* Controls (Right/Bottom) */}
                <div className="w-full lg:w-[400px] bg-white dark:bg-slate-900 border-t lg:border-l lg:border-t-0 border-slate-100 dark:border-slate-800 shadow-2xl relative z-40">
                    <div className="h-full">
                        <BuilderControls step={step} config={config} setConfig={setConfig} onNext={handleNext} onPrev={() => setStep(step - 1)} />
                    </div>
                </div>
            </div>
            
            <BreakdownModal config={config} isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} floors={floors} dimensions={dims} />
        </div>
    );
};

const SmartWizard = ({ onStartBuilder }) => {
    const [type, setType] = useState('house');
    const [shape, setShape] = useState('rect');
    const [d1, setD1] = useState(''); // Length
    const [d2, setD2] = useState(''); // Width
    const [floors, setFloors] = useState(1);
    const [height, setHeight] = useState(2.8);
    const [estimate, setEstimate] = useState(0);

    const PRICES_M2 = { house: 450000, garage: 350000, fence: 85000 };

    const calculateQuick = () => {
        const v1 = parseFloat(d1) || 0;
        const v2 = parseFloat(d2) || 0;
        let area = v1 * v2;
        if (type === 'fence') area = (v1 + v2) * 2;
        let total = area * PRICES_M2[type];
        if (type === 'house') total *= floors;
        setEstimate(total);
    };

    useEffect(() => { setEstimate(0); }, [d1, d2, floors, type]);

    return (
        <div className="mb-12 pt-8 animate-in fade-in">
            <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden transition-colors duration-300">
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div className="pt-4">
                        <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full mb-4 border border-orange-500/30">Алхам 1: Хэмжээ</span>
                        <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">Таны мөрөөдлийн <br/> төсөл ямар вэ?</h1>
                        <p className="text-slate-400 text-base md:text-lg mb-8 max-w-lg">Хэмжээ, давхар, онцлогоо оруулаад урьдчилсан төсвөө хараарай.</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl text-slate-900 dark:text-white max-w-md mx-auto w-full border border-slate-100 dark:border-slate-700">
                        {/* 1. Type */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                            {[{id:'house', icon:<Home size={18}/>, label:'Байшин'}, {id:'garage', icon:<Warehouse size={18}/>, label:'Гараж'}, {id:'fence', icon:<Fence size={18}/>, label:'Хашаа'}].map(i=>(<button key={i.id} onClick={()=>setType(i.id)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${type===i.id?'bg-white dark:bg-slate-700 shadow-sm text-orange-600 dark:text-orange-400':'text-slate-500'}`}>{i.icon}{i.label}</button>))}
                        </div>

                        {/* 2. Shape (Simple for now) */}
                        {type !== 'fence' && (
                           <div className="mb-4 flex gap-2">
                               {[{id:'rect',icon:<Square size={16}/>, label:'Тэгш'}, {id:'l',icon:<CornerDownRight size={16}/>, label:'Г-хэлбэр'}].map(s=>(<button key={s.id} onClick={()=>setShape(s.id)} className={`flex-1 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 ${shape===s.id?'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600':'border-slate-200 dark:border-slate-700 text-slate-500'}`}>{s.icon}{s.label}</button>))}
                           </div>
                        )}

                        {/* 3. INPUTS (Expanded) */}
                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Урт (м)</label><input type="number" value={d1} onChange={e=>setD1(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white border-2 border-transparent focus:border-orange-500 outline-none text-center" placeholder="0"/></div>
                                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Өргөн (м)</label><input type="number" value={d2} onChange={e=>setD2(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white border-2 border-transparent focus:border-orange-500 outline-none text-center" placeholder="0"/></div>
                            </div>
                            
                            {type === 'house' && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl flex items-center justify-between px-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Давхар</label>
                                        <div className="flex items-center gap-3">
                                            <button onClick={()=>setFloors(Math.max(1, floors-1))} className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">-</button>
                                            <span className="font-bold">{floors}</span>
                                            <button onClick={()=>setFloors(floors+1)} className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">+</button>
                                        </div>
                                    </div>
                                    <div>
                                         <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Өндөр (м)</label>
                                         <input type="number" value={height} onChange={e=>setHeight(parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white border-2 border-transparent focus:border-orange-500 outline-none text-center" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {estimate > 0 ? (
                            <div className="animate-in slide-in-from-bottom-2 fade-in">
                                <div className="text-center mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800">
                                    <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-bold mb-1">Урьдчилсан төсөв</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white">~{formatCurrency(estimate)}</p>
                                </div>
                                <button onClick={() => onStartBuilder({ l: parseFloat(d1), w: parseFloat(d2) }, floors)} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90">Материал сонгох & Нарийвчлах <ArrowRight size={18} /></button>
                            </div>
                        ) : (
                            <button onClick={calculateQuick} disabled={!d1 || !d2} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 disabled:opacity-50 transition-all">Төсөв харах</button>
                        )}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
            </div>
        </div>
    );
};

const SupplierCard = ({ supplier, onAdd }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col gap-4 group h-full">
        <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative">
            <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{backgroundImage: `url(${supplier.image})`}} />
            {supplier.vatPayer && <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg">НӨАТ</span>}
        </div>
        <div className="flex-1 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-1">{supplier.name}</h4><span className="font-bold text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-lg text-sm">{formatCurrency(supplier.price)}</span></div>
                <div className="flex flex-wrap gap-1 mb-3">{supplier.tags?.map((t,i) => <span key={i} className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700">{t}</span>)}</div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs text-slate-400"><span className="flex items-center gap-1"><MapPin size={12}/> {supplier.location}</span><span className="flex items-center gap-1 text-yellow-500"><Star size={12} fill="currentColor"/> {supplier.rating}</span></div>
                <button onClick={() => onAdd(supplier)} className="bg-slate-900 dark:bg-orange-600 text-white p-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-orange-700 active:scale-95 transition-transform shadow-md"><ShoppingCart size={18} /></button>
            </div>
        </div>
    </div>
);

const CategoryDetail = ({ categoryId, onBack, onAddToCart }) => {
    const suppliers = INITIAL_SUPPLIERS[categoryId] || [];
    return (
        <div className="py-8 animate-in slide-in-from-right"><div className="flex items-center gap-4 mb-8"><button onClick={onBack} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-colors shadow-sm"><ArrowLeft size={20}/></button><h1 className="text-2xl font-bold text-slate-900 dark:text-white">{MATERIALS_DB.find(m=>m.id===categoryId)?.name}</h1></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{(suppliers.length > 0) ? suppliers.map((s, i) => (<SupplierCard key={i} supplier={s} onAdd={() => onAddToCart(s, 1, 'ш')} />)) : <div className="col-span-full text-center py-10 text-slate-400">Бараа олдсонгүй</div>}</div></div>
    );
};

const ServicesDashboard = ({ onNavigate }) => (
    <div className="animate-in fade-in py-8"><h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Үйлчилгээ 🛠️</h1><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div onClick={() => onNavigate('china')} className="bg-gradient-to-r from-red-600 to-red-800 rounded-[2rem] p-8 text-white shadow-xl cursor-pointer"><h2 className="text-3xl font-black mb-2">Хятадаас хамтдаа</h2><button className="bg-white text-red-700 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg mt-4">Нэгдэх</button></div><div onClick={() => onNavigate('rental')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm cursor-pointer"><h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Багаж түрээс</h2><button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg mt-4">Сонгох</button></div></div></div>
);

const ChinaImportScreen = ({ onBack }) => (
    <div className="animate-in slide-in-from-right py-8"><div className="flex items-center gap-4 mb-8"><button onClick={onBack} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-colors shadow-sm"><ArrowLeft size={20}/></button><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Хятадаас захиалах</h1></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{GROUP_BUYS.map(item => (<div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm p-6"><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3><p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{item.desc}</p><div className="flex justify-between items-center"><p className="text-2xl font-black text-green-600 dark:text-green-500">{formatCurrency(item.price)}</p><button className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg">Захиалах</button></div></div>))}</div></div>
);

const RentalScreen = ({ onBack }) => (
    <div className="animate-in slide-in-from-right py-8"><div className="flex items-center gap-4 mb-8"><button onClick={onBack} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-colors shadow-sm"><ArrowLeft size={20}/></button><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Багаж түрээс</h1></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{RENTALS.map(tool => (<div key={tool.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 flex gap-5 shadow-sm"><div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden"><div className="w-full h-full bg-cover bg-center" style={{backgroundImage: `url(${tool.image})`}} /></div><div className="flex-1"> <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{tool.name}</h3><span className="block text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-2">{formatCurrency(tool.price)}</span></div></div>))}</div></div>
);

const QuickCalculator = ({ typeId, typeName, inputs, onCalculate }) => {
    const [val1, setVal1] = useState(0); const [val2, setVal2] = useState(0); const [val3, setVal3] = useState(0);
    const handleCalc = () => {
        let quantity = 0, unit = '';
        if (typeId === 'pile_foundation') { const vol = val1 * Math.PI * Math.pow(val2 / 2, 2) * val3; quantity = Math.ceil(vol * 7); unit = 'шуудай цемент'; } 
        else if (typeId === 'square_pile_foundation') { const vol = val1 * val2 * val2 * val3; quantity = Math.ceil(vol * 7); unit = 'шуудай цемент'; } 
        else if (typeId.includes('brick') || typeId.includes('block')) { const area = val1 * val2; quantity = Math.ceil(area * 104); unit = 'ш'; }
        else { quantity = Math.ceil(val1 * val2); unit = 'нэгж'; }
        onCalculate(quantity, unit);
    };
    return (
        <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 mt-4 transition-all">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Calculator size={18}/> {typeName} тооцоолох</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
                {inputs.includes('length') && <InputField label="Урт (м)" value={val1} onChange={setVal1} />}
                {inputs.includes('width') && <InputField label="Өргөн (м)" value={val2} onChange={setVal2} />}
                {inputs.includes('height') && <InputField label="Өндөр (м)" value={val3} onChange={setVal3} />}
                {inputs.includes('count') && <InputField label="Тоо" value={val1} onChange={setVal1} />}
                {inputs.includes('diameter') && <InputField label="Диаметр" value={val2} onChange={setVal2} />}
            </div>
            <button onClick={handleCalc} className="w-full py-3 bg-indigo-600 dark:bg-orange-600 text-white rounded-xl font-bold">Тооцох</button>
        </div>
    );
};

const Estimator = ({ onBack }) => {
    const [mode, setMode] = useState('house');
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeType, setActiveType] = useState(null);
    const [w, setW] = useState(6); const [l, setL] = useState(8);
    const [showDetails, setShowDetails] = useState(false);
    const foundationVol = ((w + l) * 2 * 0.4 * 1.0).toFixed(1);
    
    return (
        <div className="animate-in fade-in zoom-in-95 max-w-4xl mx-auto py-8 px-4 sm:px-0">
             <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 text-sm font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"><ArrowLeft size={18} className="mr-2"/> Буцах</button>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 max-w-md mx-auto">
                <button onClick={() => {setMode('house'); setActiveCategory(null); setActiveType(null);}} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'house' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><Home size={18} /> Бүтэн байшин</button>
                <button onClick={() => setMode('material')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'material' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><Combine size={18} /> Нарийвчилсан</button>
            </div>
            {mode === 'house' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                             <div className="flex items-center gap-4 mb-8"><div className="p-4 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl"><ClipboardList size={32}/></div><div><h2 className="font-bold text-2xl text-slate-900 dark:text-white">Байшин тооцоолох</h2><p className="text-sm text-slate-500 dark:text-slate-400">Байшингийн хэмжээг оруулна уу</p></div></div>
                             <div className="space-y-6">
                                <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Урт (метр)</label><input type="number" value={l} onChange={e=>setL(parseFloat(e.target.value) || 0)} className="w-full text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white border-2 border-transparent focus:border-orange-500 outline-none text-2xl transition-all" /></div>
                                <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Өргөн (метр)</label><input type="number" value={w} onChange={e=>setW(parseFloat(e.target.value) || 0)} className="w-full text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white border-2 border-transparent focus:border-orange-500 outline-none text-2xl transition-all" /></div>
                             </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 h-full flex flex-col justify-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Урьдчилсан тооцоо</h3>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">Суурийн бетон</span><span className="font-bold text-xl text-slate-900 dark:text-white">~{foundationVol} м³</span></div>
                                </div>
                                <button onClick={() => setShowDetails(true)} className="w-full bg-slate-900 dark:bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-orange-700 shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"><FileText size={20} /> Дэлгэрэнгүй жагсаалт харах</button>
                            </div>
                        </div>
                    </div>
                    {showDetails && (<div className="space-y-6 animate-in slide-in-from-bottom-4"><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Нарийвчилсан тооцоо</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{['foundation', 'wall', 'roof'].map(key => { const section = ESTIMATOR_DATA[key]; if (!section) return null; return (<div key={key} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"><div className="flex items-center gap-3 mb-4"><div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">{key === 'foundation' && <Box size={20}/>}{key === 'wall' && <BrickWall size={20}/>}{key === 'roof' && <Home size={20}/>}</div><div><h3 className="font-bold text-slate-900 dark:text-white">{section.title}</h3><p className="text-xs text-slate-500 dark:text-slate-400">{section.desc}</p></div></div><ul className="space-y-3 mb-6">{section.items.map((item, idx) => (<li key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0"><span className="text-slate-600 dark:text-slate-300">{item.name}</span><span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{item.calc(w, l)} {item.unit}</span></li>))}</ul><div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-700"><p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Wrench size={12}/> Хэрэг болох багаж</p><div className="flex flex-wrap gap-1">{section.tools.map((t, i) => (<span key={i} className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-full">{t}</span>))}</div></div></div>); })}</div></div>)}
                </>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right">
                    {!activeCategory ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {CALCULATOR_CATEGORIES.map(cat => (<div key={cat.id} onClick={() => setActiveCategory(cat.id)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all cursor-pointer group"><div className="flex items-start justify-between mb-4"><div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{cat.icon}</div><ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-orange-500 transition-colors" /></div><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{cat.name}</h3><p className="text-sm text-slate-500 dark:text-slate-400">{cat.desc}</p></div>))}
                        </div>
                    ) : !activeType ? (
                        <div>
                             <div className="flex items-center gap-2 mb-6"><button onClick={() => setActiveCategory(null)} className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Ангилал</button><ChevronRight size={14} className="text-slate-400"/><span className="text-sm font-bold text-slate-900 dark:text-white">{CALCULATOR_CATEGORIES.find(c => c.id === activeCategory)?.name}</span></div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{CALCULATOR_CATEGORIES.find(c => c.id === activeCategory)?.types.map(type => (<div key={type.id} onClick={() => setActiveType(type)} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 dark:hover:border-orange-500 cursor-pointer transition-all"><h4 className="font-bold text-slate-900 dark:text-white mb-1">{type.name}</h4><p className="text-sm text-slate-500 dark:text-slate-400">{type.desc}</p></div>))}</div>
                        </div>
                    ) : (
                         <div>
                            <div className="flex items-center gap-2 mb-6"><button onClick={() => setActiveCategory(null)} className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Ангилал</button><ChevronRight size={14} className="text-slate-400"/><button onClick={() => setActiveType(null)} className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">{CALCULATOR_CATEGORIES.find(c => c.id === activeCategory)?.name}</button><ChevronRight size={14} className="text-slate-400"/><span className="text-sm font-bold text-slate-900 dark:text-white">{activeType.name}</span></div>
                            <QuickCalculator typeId={activeType.id} typeName={activeType.name} inputs={activeType.inputs} onCalculate={(qty, unit) => alert(`Танд ойролцоогоор ${qty} ${unit} хэрэгтэй.`)} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- HOME SCREEN ---
const HomeView = ({ onNavigate, onSelectCategory, onStartBuilder }) => (
    <div className="animate-in fade-in">
        <SmartWizard onStartBuilder={onStartBuilder} />
        <div className="flex justify-between items-end mb-6 px-2"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Материал хайх</h2><button className="text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1">Бүгдийг харах <ChevronRight size={16}/></button></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-16">{MATERIALS_DB.map((item) => (<button key={item.id} onClick={() => { onSelectCategory(item.id); onNavigate('category'); }} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all group"><div className="text-slate-400 group-hover:text-orange-600 transition-colors mb-3">{item.icon}</div><span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{item.name}</span></button>))}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
             <div onClick={() => onNavigate('china')} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-6 transition-all hover:shadow-xl cursor-pointer group"><div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl group-hover:scale-110 transition-transform"><Anchor size={32}/></div><div><h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Хятадаас хамтдаа</h4><p className="text-sm text-slate-500 dark:text-slate-400">Арматур захиалга 80% дүүрсэн.</p></div></div>
             <div onClick={() => onNavigate('rental')} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center gap-6 transition-all hover:shadow-xl cursor-pointer group"><div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><Wrench size={32}/></div><div><h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Багаж түрээс</h4><p className="text-sm text-slate-500 dark:text-slate-400">Пум, Шат, Дрель түрээслүүлнэ.</p></div></div>
        </div>
    </div>
);

const CartDrawer = ({ cart, isOpen, onClose, onRemoveItem }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-end" onClick={() => onClose()}>
            <div className="w-full max-w-sm bg-white dark:bg-slate-950 h-full p-6 animate-in slide-in-from-right border-l border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-slate-900 dark:text-white">Сагс ({cart.length})</h2><button onClick={() => onClose()} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full"><X size={20}/></button></div>
                {cart.length === 0 ? (<div className="text-center py-20 text-slate-400">Сагс хоосон байна.</div>) : (
                    <div className="space-y-4">{cart.map((item, i) => (<div key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2"><div><h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4><p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(item.price)}</p></div><button onClick={() => onRemoveItem(i)} className="text-slate-300 hover:text-red-500"><X size={16}/></button></div>))}<button className="w-full bg-slate-900 dark:bg-orange-600 text-white py-4 rounded-xl font-bold mt-6 hover:bg-slate-800 dark:hover:bg-orange-700">Төлбөр төлөх</button></div>
                )}
            </div>
        </div>
    );
};

// --- MAIN APP ---
export default function App() {
    const [view, setView] = useState('home'); 
    const [selectedCat, setSelectedCat] = useState(null);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    
    // Builder State
    const [builderDims, setBuilderDims] = useState({ l: 8, w: 6 });
    const [builderFloors, setBuilderFloors] = useState(1);

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const handleAddToCart = (item, qty, unit) => { setCart([...cart, { ...item, quantity: qty, unit }]); setIsCartOpen(true); };
    const handleRemoveFromCart = (index) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };
    const handleStartBuilder = (dims, floors) => { setBuilderDims(dims); setBuilderFloors(floors); setView('builder'); };

    const handleNav = (target) => {
        if (target === 'home') { setView('home'); setSelectedCat(null); } 
        else { setView(target); }
        window.scrollTo(0, 0);
    };

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20 selection:bg-orange-200 dark:selection:bg-orange-900 transition-colors duration-300">
                <Header cartCount={cart.length} onNavigate={handleNav} onOpenCart={() => setIsCartOpen(true)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentView={view} />
                
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-300px)]">
                    {view === 'home' && <HomeView onNavigate={handleNav} onSelectCategory={(id) => { setSelectedCat(id); setView('category'); }} onStartBuilder={handleStartBuilder} />}
                    {view === 'builder' && <VisualBuilderView onBack={() => setView('home')} initialDims={builderDims} initialFloors={builderFloors} />}
                    {view === 'category' && <CategoryDetail categoryId={selectedCat} onBack={() => setView('home')} onAddToCart={handleAddToCart} />}
                    {view === 'services' && <ServicesDashboard onNavigate={setView} />}
                    {view === 'china' && <ChinaImportScreen onBack={() => handleNav('services')} />}
                    {view === 'rental' && <RentalScreen onBack={() => handleNav('services')} />}
                    {view === 'estimator' && <Estimator onBack={() => setView('home')} />}
                </main>

                <Footer />
                <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onRemoveItem={handleRemoveFromCart} />
            </div>
        </div>
    );
}