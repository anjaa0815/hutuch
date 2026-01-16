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
  Warehouse, Fence, Square, Layout, Check, Play, RefreshCw, DoorOpen, Maximize,
  Zap, Droplets, Construction, Move3d, Map, User, LogOut, Store, BarChart3, ListOrdered, Plus,
  Bell, Lock, Smartphone, Printer, Download
} from 'lucide-react';
import { Layers as AlignVerticalJustifyStart } from 'lucide-react';

// ==========================================
// 1. DATA CONSTANTS & UTILS
// ==========================================

const MATERIAL_GROUPS = [
  { id: 'structure', name: 'Дүүргэгч материал', icon: <BrickWall size={24}/>, color: 'bg-orange-100 text-orange-600', desc: 'Цемент, тоосго, блок, элс, хайрга' },
  { id: 'metal', name: 'Төмөр хийц', icon: <Hammer size={24}/>, color: 'bg-slate-200 text-slate-700', desc: 'Арматур, дээвэр, труба, төмөр хавтан' },
  { id: 'wood', name: 'Модон хийц', icon: <Ruler size={24}/>, color: 'bg-amber-100 text-amber-700', desc: 'Банз, палк, паркет, дүнз' },
  { id: 'plumbing', name: 'Сантехник', icon: <Droplets size={24}/>, color: 'bg-blue-100 text-blue-600', desc: 'Шугам хоолой, холбох хэрэгсэл, кран' },
  { id: 'electric', name: 'Цахилгаан', icon: <Zap size={24}/>, color: 'bg-yellow-100 text-yellow-600', desc: 'Утас, розетка, гэрэлтүүлэг, автомат' },
  { id: 'finishing', name: 'Засал чимэглэл', icon: <PaintBucket size={24}/>, color: 'bg-pink-100 text-pink-600', desc: 'Будаг, обой, плита, замаск' },
];

const HOUSE_OPTIONS = {
  foundation: [
    { id: 'strip', name: 'Туузан суурь', price: 15000000, color: '#64748b', type: 'solid', unit: 'м3', desc: 'Бат бөх, найдвартай' }, 
    { id: 'pile', name: 'Баганан суурь', price: 8500000, color: '#94a3b8', type: 'dots', unit: 'м3', desc: 'Зардал бага, хөнгөн' },
    { id: 'slab', name: 'Хавтан суурь', price: 18000000, color: '#475569', type: 'solid', unit: 'м3', desc: 'Намгархаг хөрсөнд' }, 
  ],
  wall: [
    { id: 'block_light', name: 'Хөнгөн блок', price: 25000000, color: '#e2e8f0', pattern: 'block', unit: 'м3', desc: 'Дулаан алдагдал бага' }, 
    { id: 'brick_red', name: 'Улаан тоосго', price: 35000000, color: '#ef4444', pattern: 'brick', unit: 'м3', desc: 'Уламжлалт, бат бөх' },
    { id: 'brick_black', name: 'Хар тоосго', price: 38000000, color: '#334155', pattern: 'brick', unit: 'м3', desc: 'Модерн загвар' },
    { id: 'timber', name: 'Дүнзэн (Мод)', price: 45000000, color: '#d97706', pattern: 'wood', unit: 'м3', desc: 'Эко, дулаан' },
  ],
  roof: [
    { id: 'gable_red', name: 'Төмөр (Улаан)', price: 45000, color: '#b91c1c', type: 'gable', unit: 'м2', desc: 'Энгийн хийц' }, 
    { id: 'gable_black', name: 'Битамон (Хар)', price: 65000, color: '#1e293b', type: 'gable', unit: 'м2', desc: 'Дуу чимээ бага' },
    { id: 'hip_green', name: 'Майхан (Ногоон)', price: 55000, color: '#15803d', type: 'hip', unit: 'м2', desc: 'Салхинд тэсвэртэй' },
    { id: 'flat', name: 'Хавтгай', price: 50000, color: '#475569', type: 'flat', unit: 'м2', desc: 'Террас хийх боломжтой' },
  ],
  window: [
    { id: 'standard', name: 'Стандарт', price: 450000, type: 'std', unit: 'ш', desc: '2 давхар шил' }, 
    { id: 'triple', name: '3 давхар шил', price: 650000, type: 'std', unit: 'ш', desc: 'Дулаан' },
    { id: 'panoramic', name: 'Панорама', price: 950000, type: 'pano', unit: 'ш', desc: 'Шалнаас тааз хүртэл' },
  ],
  door: [
    { id: 'metal', name: 'Бүргэд', price: 650000, color: '#7f1d1d', unit: 'ш', desc: 'ОХУ стандарт' }, 
    { id: 'smart', name: 'Ухаалаг (Хар)', price: 1200000, color: '#171717', unit: 'ш', desc: 'Код, хурууны хээ' },
    { id: 'white', name: 'Цагаан', price: 450000, color: '#f1f5f9', unit: 'ш', desc: 'Модерн' },
  ],
  facade: [
    { id: 'none', name: 'Өнгөлгөөгүй', price: 0, color: 'transparent', unit: 'м2', desc: 'Үндсэн хана' },
    { id: 'stucco', name: 'Чулуун замаск', price: 25000, color: '#f5f5f4', pattern: 'noise', unit: 'м2', desc: 'Гоёлын шавардлага' },
    { id: 'siding', name: 'Сайдинг', price: 45000, color: '#cbd5e1', pattern: 'lines', unit: 'м2', desc: 'Металл өнгөлгөө' },
  ]
};

const MATERIALS_DB = [
  { id: 'cement', category: 'structure', name: 'Цемент / Бетон', icon: <Box size={24}/>, desc: 'PC42.5, M200, M300' },
  { id: 'brick', category: 'structure', name: 'Тоосго / Блок', icon: <BrickWall size={24}/>, desc: 'Блок, тоосго, даацын хана' },
  { id: 'roof', category: 'structure', name: 'Дээвэр', icon: <Home size={24}/>, desc: 'Төмөр дээвэр, дулаалга' },
  { id: 'sand', category: 'structure', name: 'Элс / Хайрга', icon: <Box size={24}/>, desc: 'Зуурмаг бэлтгэх' },
  { id: 'paint', category: 'finishing', name: 'Будаг / Замаск', icon: <PaintBucket size={24}/>, desc: 'Дотор, гадна засал' },
  { id: 'tile', category: 'finishing', name: 'Плита / Чулуу', icon: <Grid size={24}/>, desc: 'Ванн, гал тогоо' },
  { id: 'floor', category: 'finishing', name: 'Паркет / Шал', icon: <Ruler size={24}/>, desc: 'Ламинат, модон шал' },
  { id: 'wallpaper', category: 'finishing', name: 'Обой', icon: <Scroll size={24}/>, desc: 'Хананы гоёл' },
  { id: 'pipes', groupId: 'plumbing', name: 'Шугам хоолой', icon: <Droplets size={24}/>, desc: 'PPR, PVC хоолойнууд' },
  { id: 'faucet', groupId: 'plumbing', name: 'Холигч / Кран', icon: <Wrench size={24}/>, desc: 'Гал тогоо, ванны кран' },
  { id: 'wire', groupId: 'electric', name: 'Цахилгааны утас', icon: <Zap size={24}/>, desc: 'Зэс утас, кабель' },
  { id: 'switch', groupId: 'electric', name: 'Розетка / Унтраалга', icon: <Box size={24}/>, desc: 'Евро стандарт' },
];

const INITIAL_SUPPLIERS = {
  cement: [
    { id: 1, sellerId: 's1', name: 'Төмөр Трейд - МАК Цемент', price: 24000, unit: 'шуудай', stock: 500, delivery: 'paid', image: 'https://placehold.co/150x150/e2e8f0/64748b?text=Cement', tags: ['M300', 'Портланд'] },
    { id: 2, sellerId: 's2', name: 'Барилга МН - Хөтөл Цемент', price: 23500, unit: 'шуудай', stock: 120, delivery: 'free', image: 'https://placehold.co/150x150/e2e8f0/64748b?text=Cement', tags: ['M200'] },
  ],
  brick: [{ id: 4, sellerId: 's3', name: 'Налайх Тоосго', price: 650, unit: 'ш', stock: 10000, delivery: 'paid', image: 'https://placehold.co/150x150/ef4444/fee2e2?text=Brick', tags: ['Улаан'] }],
  pipes: [{ id: 50, sellerId: 's1', name: 'PPR Хоолой Ф20', price: 2500, unit: 'м', stock: 1000, delivery: 'paid', image: 'https://placehold.co/150x150/bfdbfe/1d4ed8?text=Pipe', tags: ['PPR', 'Ф20'] }],
  wire: [{ id: 60, sellerId: 's4', name: 'Зэс утас 2.5мм', price: 1200, unit: 'м', stock: 5000, delivery: 'paid', image: 'https://placehold.co/150x150/fef08a/a16207?text=Wire', tags: ['2.5мм', 'Орос'] }],
  faucet: [{ id: 70, sellerId: 's4', name: 'Ванны холигч', price: 85000, unit: 'ш', stock: 20, delivery: 'free', image: 'https://placehold.co/150x150/94a3b8/1e293b?text=Faucet', tags: ['Ган', 'Матт'] }],
  switch: [{ id: 80, sellerId: 's1', name: 'Розетка (Legrand)', price: 12000, unit: 'ш', stock: 200, delivery: 'paid', image: 'https://placehold.co/150x150/f3f4f6/1f2937?text=Switch', tags: ['Цагаан'] }],
  roof: [{ id: 90, sellerId: 's2', name: 'Төмөр дээвэр', price: 22000, unit: 'м²', stock: 50, delivery: 'paid', image: 'https://placehold.co/150x150/94a3b8/1e293b?text=Roof', tags: ['0.35mm'] }],
  floor: [{ id: 100, sellerId: 's4', name: 'Евро паркет', price: 45000, unit: 'м²', stock: 300, delivery: 'paid', image: 'https://placehold.co/150x150/78350f/fef3c7?text=Parquet', tags: ['8mm', 'AC4'] }],
  sand: [{ id: 110, sellerId: 's2', name: 'Карьерын элс', price: 25000, unit: 'тн', stock: 1000, delivery: 'paid', image: 'https://placehold.co/150x150/d97706/fef3c7?text=Sand', tags: ['Шигшсэн'] }],
  paint: [{ id: 120, sellerId: 's1', name: 'Dulux Эмульс', price: 125000, unit: 'ш', stock: 50, delivery: 'free', image: 'https://placehold.co/150x150/dcfce7/16a34a?text=Paint', tags: ['15л'] }],
  tile: [{ id: 130, sellerId: 's4', name: 'Pro Tiles', price: 35000, unit: 'м²', stock: 400, delivery: 'paid', image: 'https://placehold.co/150x150/cffafe/0891b2?text=Tile', tags: ['60x60'] }],
  wallpaper: [{ id: 140, sellerId: 's1', name: 'Солонгос Обой', price: 55000, unit: 'рулон', stock: 100, delivery: 'paid', image: 'https://placehold.co/150x150/f3e8ff/9333ea?text=Wallpaper', tags: ['1.06м'] }],
  timber_raw: [{ id: 150, sellerId: 's2', name: 'Шар нарс (Палк)', price: 650000, unit: 'м³', stock: 20, delivery: 'paid', image: 'https://placehold.co/150x150/b45309/fffbeb?text=Timber', tags: ['4м'] }]
};

// Flatten INITIAL_SUPPLIERS to create PRODUCTS array
const PRODUCTS = Object.values(INITIAL_SUPPLIERS).flat();

// Mock Data for Sellers
const SELLERS = [
  { id: 's1', name: 'Төмөр Трейд', rating: 4.5, location: '100 айл', phone: '9911-xxxx', verified: true },
  { id: 's2', name: 'Барилга МН', rating: 4.0, location: 'Гурвалжин', phone: '8811-xxxx', verified: true },
  { id: 's3', name: 'Налайх Тоосго', rating: 4.2, location: 'Налайх', phone: '7011-xxxx', verified: true },
  { id: 's4', name: 'Pro Tiles', rating: 4.6, location: 'Мишээл', phone: '9900-xxxx', verified: true },
];

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
      { id: 'cem', name: 'Цемент (M400)', unit: 'шуудай', calc: (w, l) => Math.ceil(((w+l)*2 * 0.4 * 1.0) * 7), categoryRef: 'cement' }, 
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
      { id: 'sheet', name: 'Дээврийн төмөр', unit: 'ш', calc: (w, l) => Math.ceil((w * l * 1.3) / 1.5), categoryRef: 'roof' },
      { id: 'scr_b', name: 'Шруп', unit: 'хайрцаг', calc: () => 3 },
    ],
    tools: ['Дрель', 'Тасдагч', 'Аюулгүйн бүс']
  }
};

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

const Header = ({ cartCount, onNavigate, onOpenCart, darkMode, toggleDarkMode, userRole, setUserRole }) => (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform bg-white flex items-center justify-center">
                    <img 
                        src="/logo.png" 
                        alt="Hutuch" 
                        className="w-full h-full object-contain" 
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.className += ' bg-orange-600';
                            e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>';
                        }} 
                    />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Hutuch</span>
                    <span className="text-[10px] text-orange-500 font-bold tracking-widest uppercase">{userRole === 'seller' ? 'Seller Center' : 'Smart Build'}</span>
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
                {userRole === 'user' ? (
                    <>
                        <button onClick={() => onNavigate('home')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Нүүр</button>
                        <button onClick={() => onNavigate('builder')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Визуал</button>
                        <button onClick={() => onNavigate('services')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Үйлчилгээ</button>
                        <button onClick={() => onNavigate('estimator')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Төсөвлөх</button>
                    </>
                ) : (
                    <button className="text-sm font-bold text-orange-600 cursor-default">Борлуулагчийн удирдлага</button>
                )}
            </nav>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setUserRole(userRole === 'user' ? 'seller' : 'user')} 
                    className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold ${userRole === 'seller' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                    {userRole === 'user' ? <User size={16} /> : <Store size={16} />}
                    <span className="hidden sm:inline">{userRole === 'user' ? 'Хэрэглэгч' : 'Борлуулагч'}</span>
                </button>

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
                         <img src="/logo.png" alt="Hutuch" className="w-6 h-6 object-contain" onError={(e) => {e.target.onerror = null; e.target.src='https://placehold.co/24x24?text=H';}} /> Hutuch
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

// --- SELLER LOGIN COMPONENT ---
const SellerLogin = ({ onLogin }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [shopName, setShopName] = useState('');
    const [location, setLocation] = useState('100 айл'); 
    const [tradeCenter, setTradeCenter] = useState(''); 
    const [shopNumber, setShopNumber] = useState('');   

    const LOCATIONS = [
        '100 айл', 'Гурвалжин', 'Мишээл', 'Налайх', 'Яармаг', 'Цайз', 'Хангай', 'Big Building', 'Бусад'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) {
            if (phone && password && shopName && location && tradeCenter && shopNumber) {
                alert(`Амжилттай бүртгэгдлээ: ${shopName}\nХаяг: ${location}, ${tradeCenter}, ${shopNumber}`);
                onLogin();
            } else {
                alert("Бүх талбарыг бөглөнө үү");
            }
        } else {
            if (phone && password) {
                onLogin();
            } else {
                alert("Утас болон нууц үгээ оруулна уу");
            }
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-800">
                <div className="text-center mb-8">
                    <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600 dark:text-orange-400">
                        <Store size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isRegistering ? 'Шинэ борлуулагч бүртгэх' : 'Борлуулагч нэвтрэх'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                        {isRegistering ? 'Мэдээллээ оруулаад борлуулж эхлээрэй' : 'Бараагаа удирдаж, захиалгаа хянаарай'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Борлуулагчийн нэр</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Store size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 outline-none transition-colors"
                                        placeholder="Миний Дэлгүүр"
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Хаяг байршил</label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <MapPin size={18} />
                                        </div>
                                        <select 
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full pl-10 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 outline-none transition-colors text-slate-900 dark:text-white"
                                        >
                                            {LOCATIONS.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            type="text" 
                                            value={tradeCenter}
                                            onChange={(e) => setTradeCenter(e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 outline-none transition-colors text-sm"
                                            placeholder="Худалдааны төв"
                                        />
                                        <input 
                                            type="text" 
                                            value={shopNumber}
                                            onChange={(e) => setShopNumber(e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 outline-none transition-colors text-sm"
                                            placeholder="Лангуу №"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Утасны дугаар</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Smartphone size={18} />
                            </div>
                            <input 
                                type="tel" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 outline-none transition-colors"
                                placeholder="8888-8888"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Нууц үг</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-orange-500 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-3.5 bg-slate-900 dark:bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity mt-2">
                        {isRegistering ? 'Бүртгүүлэх' : 'Нэвтрэх'}
                    </button>
                </form>
                
                <p className="text-center text-xs text-slate-400 mt-6">
                    {isRegistering ? 'Бүртгэлтэй юу?' : 'Бүртгэлгүй бол'} 
                    <span 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-orange-600 font-bold cursor-pointer hover:underline ml-1"
                    >
                        {isRegistering ? 'Нэвтрэх' : 'энд дарж бүртгүүлнэ үү'}
                    </span>.
                </p>
            </div>
        </div>
    );
};

// V. SELLER DASHBOARD (MOBILE FIRST)
const SellerDashboard = ({ allProducts, setAllProducts }) => {
    const currentSellerId = 'v1';
    const myProducts = allProducts.filter(p => p.vendorId === currentSellerId);

    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: 'ш', stock: '', color: '', size: '', type: 'brick' });

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.price) return;
        
        const product = {
            id: Date.now(),
            vendorId: currentSellerId,
            category: 'structure', 
            ...newProduct,
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock) || 0,
            image: 'https://placehold.co/150x150/orange/white?text=New'
        };
        
        setAllProducts([product, ...allProducts]);
        
        setIsAdding(false);
        setNewProduct({ name: '', price: '', unit: 'ш', color: '', size: '', stock: '', type: 'brick' });
        alert("Бараа амжилттай нэмэгдлээ! Хэрэглэгчийн хэсэгт харагдах болно.");
    };

    return (
        <div className="pb-24 animate-in fade-in">
            <div className="bg-slate-900 text-white p-6 rounded-b-3xl mb-6 shadow-xl relative overflow-hidden">
                 <div className="absolute top-6 right-6">
                    <div className="relative p-2 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors">
                        <Bell size={20} className="text-slate-300"/>
                        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Төмөр Трейд</h2>
                        <div className="flex items-center gap-1 text-slate-400 text-sm"><MapPin size={14}/> 100 айл, 2-р эгнээ</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-2xl">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Өнөөдрийн орлого</p>
                        <p className="text-xl font-black">450,000₮</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-2xl">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Захиалга</p>
                        <p className="text-xl font-black flex items-center gap-2">3 <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">Шинэ</span></p>
                    </div>
                </div>
            </div>

            <div className="px-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Миний бараа ({myProducts.length})</h3>
                    <button onClick={() => setIsAdding(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/30">
                        <Plus size={16}/> Нэмэх
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-orange-50 dark:bg-slate-800 p-4 rounded-2xl mb-6 border border-orange-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-orange-600 uppercase mb-3">Шинэ бараа бүртгэх</p>
                        <div className="space-y-3">
                            <select 
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:border-slate-600"
                                value={newProduct.type}
                                onChange={e => setNewProduct({...newProduct, type: e.target.value})}
                            >
                                <option value="cement">Цемент</option>
                                <option value="brick">Тоосго/Блок</option>
                                <option value="paint">Будаг/Эмульс</option>
                                <option value="roof">Дээвэр</option>
                                <option value="sand">Элс/Хайрга</option>
                                <option value="floor">Паркет/Шал</option>
                                <option value="pipes">Хоолой/Сантехник</option>
                                <option value="wire">Цахилгаан утас</option>
                            </select>

                            <input 
                                placeholder="Барааны нэр (Ж: МАК Цемент)" 
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 text-slate-900 dark:text-white dark:bg-slate-700 dark:border-slate-600"
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                            />
                            
                            <div className="flex gap-3">
                                <input 
                                    placeholder="Өнгө" 
                                    className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 text-slate-900 dark:text-white dark:bg-slate-700 dark:border-slate-600"
                                    value={newProduct.color}
                                    onChange={e => setNewProduct({...newProduct, color: e.target.value})}
                                />
                                <input 
                                    placeholder="Хэмжээ" 
                                    className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 text-slate-900 dark:text-white dark:bg-slate-700 dark:border-slate-600"
                                    value={newProduct.size}
                                    onChange={e => setNewProduct({...newProduct, size: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3">
                                <input 
                                    type="number" 
                                    placeholder="Үнэ (₮)" 
                                    className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 text-slate-900 dark:text-white dark:bg-slate-700 dark:border-slate-600"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                                />
                                <input 
                                    type="number" 
                                    placeholder="Үлдэгдэл" 
                                    className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 text-slate-900 dark:text-white dark:bg-slate-700 dark:border-slate-600"
                                    value={newProduct.stock}
                                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                                />
                            </div>

                            <select 
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:border-slate-600"
                                value={newProduct.unit}
                                onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                            >
                                <option value="ш">ш</option>
                                <option value="м2">м²</option>
                                <option value="тн">тн</option>
                                <option value="шуудай">шуудай</option>
                                <option value="м">м</option>
                            </select>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold bg-white dark:bg-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Болих</button>
                                <button onClick={handleAddProduct} className="flex-1 py-3 bg-slate-900 dark:bg-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">Хадгалах</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {myProducts.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                            <img src={p.image} className="w-12 h-12 rounded-lg bg-slate-100 object-cover" alt="" />
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {p.color && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{p.color}</span>}
                                    {p.size && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{p.size}</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-orange-600 font-bold text-sm">{formatCurrency(p.price)}</span>
                                    <span className="text-xs text-slate-400">/ {p.unit}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Үлдэгдэл</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{p.stock}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. VISUAL BUILDER COMPONENTS
// ==========================================

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
            <pattern id="brickPattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill={wallColor} /><path d="M0 10h20M10 0v10" stroke="rgba(0,0,0,0.1)" strokeWidth="1" /></pattern>
            <pattern id="blockPattern" x="0" y="0" width="30" height="15" patternUnits="userSpaceOnUse"><rect width="30" height="15" fill={wallColor} /><path d="M0 15h30M15 0v15" stroke="rgba(0,0,0,0.1)" strokeWidth="1" /></pattern>
            <pattern id="woodPattern" x="0" y="0" width="40" height="10" patternUnits="userSpaceOnUse"><rect width="40" height="10" fill={wallColor} /><path d="M0 10h40" stroke="rgba(0,0,0,0.2)" strokeWidth="1" /></pattern>
            <pattern id="sidingPattern" x="0" y="0" width="40" height="10" patternUnits="userSpaceOnUse"><rect width="40" height="10" fill={wallColor} /><path d="M0 10h40" stroke="rgba(0,0,0,0.1)" strokeWidth="1" /></pattern>
            <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#bae6fd" /><stop offset="100%" stopColor="#7dd3fc" /></linearGradient>
            <linearGradient id="nightWindow" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fef08a" /><stop offset="100%" stopColor="#eab308" /></linearGradient>
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
                {!isPano && (<><line x1={w/2} y1="0" x2={w/2} y2={h} stroke="white" strokeWidth="2" /><line x1="0" y1={h/2} x2={w} y2={h/2} stroke="white" strokeWidth="2" /></>)}
                {isPano && <line x1="0" y1={h/2} x2={w} y2={h/2} stroke="white" strokeWidth="2" />}
            </g>
        );
    };

    const houseHeightClass = floors === 2 ? 'h-64' : 'h-40';

    return (
        <div className="w-full h-80 flex items-end justify-center">
            <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl">
                {renderPatterns()}
                <g transform="translate(50, 50)">
                    {/* ROOF */}
                    {roofOpt.type === 'gable' && <path d="M-20 100 L100 20 L220 100 Z" fill={roofColor} />}
                    {roofOpt.type === 'flat' && <rect x="-10" y="80" width="220" height="20" fill={roofColor} />}
                    {roofOpt.type === 'hip' && <path d="M-10 100 L40 40 L160 40 L210 100 Z" fill={roofColor} />}
                    {/* WALLS */}
                    <rect x="0" y="100" width="200" height={floors === 2 ? 180 : 120} fill={getWallFill()} />
                    {/* WINDOWS */}
                    {floors === 2 ? (
                        <>
                            <WindowSVG x="20" y="120" w="60" h={windowOpt.type === 'pano' ? 50 : 40} />
                            <WindowSVG x="120" y="120" w="60" h={windowOpt.type === 'pano' ? 50 : 40} />
                            <WindowSVG x="20" y="200" w="60" h={windowOpt.type === 'pano' ? 70 : 40} />
                            <rect x="130" y="200" width="40" height="80" fill={doorColor} stroke="white" strokeWidth="2" />
                        </>
                    ) : (
                        <>
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

const FloorPlanVisualizer = ({ shape, dims }) => {
    const scale = 200 / Math.max(dims.l, dims.w || dims.l); 
    const w = (dims.w || dims.l) * scale;
    const l = dims.l * scale;
    let path = `M50,50 h${l} v${w} h-${l} z`;

    return (
        <div className="w-full h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300">
             <svg width="300" height="300" viewBox="0 0 300 300">
                 <path d={path} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-900 dark:text-white"/>
                 <text x="100" y="150" fill="currentColor" className="text-slate-500 text-xs">2D План (Удахгүй)</text>
             </svg>
        </div>
    )
};

const BuilderControls = ({ step, config, setConfig, onNext, onPrev }) => {
     return (
        <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 relative z-20">
             <div className="flex justify-between mb-4"><span className="font-bold">Алхам {step + 1}</span></div>
             <div className="grid grid-cols-2 gap-4 mb-4">
                 <button onClick={onNext} className="col-span-2 py-3 bg-orange-600 text-white rounded-xl font-bold">Дараах</button>
             </div>
        </div>
     )
};

// --- NEW BUDGET REPORT MODAL (Like Google Sheets) ---
const BreakdownModal = ({ config, isOpen, onClose, floors, dimensions }) => {
    if (!isOpen) return null;
    
    const footprint = dimensions.l * dimensions.w;
    const perimeter = (dimensions.l + dimensions.w) * 2;
    const wallArea = perimeter * 2.8 * floors; // Approx height 2.8m per floor
    
    // Sample norms (simplified)
    const foundationVol = footprint * 0.4; // 40cm height slab assumption
    const cementBags = Math.ceil(foundationVol * 7); // ~7 bags per m3 concrete
    
    // Generate Report Items based on selection
    const items = [];
    
    // 1. Foundation
    const foundOpt = HOUSE_OPTIONS.foundation.find(f => f.id === config.foundation);
    if(foundOpt) {
        items.push({
            category: 'Суурийн ажил',
            name: `Бетон зуурмаг (${foundOpt.name})`,
            unit: foundOpt.unit,
            qty: parseFloat(foundationVol.toFixed(1)),
            price: 250000, // Market price for ready mix
            total: foundationVol * 250000
        });
        items.push({
            category: 'Суурийн ажил',
            name: 'Арматур Ф12',
            unit: 'тн',
            qty: 0.5, 
            price: 2600000,
            total: 0.5 * 2600000
        });
    }

    // 2. Wall
    const wallOpt = HOUSE_OPTIONS.wall.find(w => w.id === config.wall);
    if(wallOpt) {
        const wallQty = Math.ceil(wallArea); // Simplified
        items.push({
            category: 'Хана & Өрлөг',
            name: wallOpt.name,
            unit: wallOpt.unit,
            qty: wallQty,
            price: wallOpt.price / 10, // Assuming price was for large quantity, normalizing
            total: wallQty * (wallOpt.price / 10) 
        });
        items.push({
             category: 'Хана & Өрлөг',
             name: 'Өрлөгийн зуурмаг / Цавуу',
             unit: 'шуудай',
             qty: Math.ceil(wallQty * 0.5),
             price: 18000,
             total: Math.ceil(wallQty * 0.5) * 18000
        });
    }

    // 3. Roof
    const roofOpt = HOUSE_OPTIONS.roof.find(r => r.id === config.roof);
    if(roofOpt) {
        const roofArea = footprint * 1.3;
        items.push({
            category: 'Дээврийн ажил',
            name: roofOpt.name,
            unit: roofOpt.unit,
            qty: Math.ceil(roofArea),
            price: roofOpt.price,
            total: Math.ceil(roofArea) * roofOpt.price
        });
    }
    
    // Calculate Grand Total
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Modal Header */}
                <div className="bg-slate-50 dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Receipt size={24} className="text-orange-600"/> Барилгын Төсвийн Тайлан
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Огноо: {new Date().toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-slate-700 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={24} className="text-slate-600 dark:text-slate-300"/>
                    </button>
                </div>

                {/* Report Table */}
                <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-slate-950">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">№</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ажлын нэр / Материал</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Хэмжих нэгж</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Тоо хэмжээ</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Нэгж үнэ</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Нийт үнэ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm text-slate-400 font-medium">{index + 1}</td>
                                        <td className="p-4">
                                            <p className="text-xs text-orange-600 font-bold uppercase mb-0.5">{item.category}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                                        </td>
                                        <td className="p-4 text-sm text-center text-slate-500 bg-slate-50 dark:bg-slate-800/30 font-medium">{item.unit}</td>
                                        <td className="p-4 text-sm text-right font-bold text-slate-700 dark:text-slate-300">{item.qty}</td>
                                        <td className="p-4 text-sm text-right text-slate-500">{formatCurrency(item.price)}</td>
                                        <td className="p-4 text-sm text-right font-black text-slate-900 dark:text-white">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                                <tr>
                                    <td colSpan="5" className="p-4 text-right text-sm font-bold text-slate-500 uppercase">Нийт төсөв</td>
                                    <td className="p-4 text-right text-xl font-black text-orange-600">{formatCurrency(grandTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                        <Printer size={18} /> Хэвлэх
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30 transition-colors">
                        <Download size={18} /> Excel татах
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-500/30 transition-colors">
                        <Save size={18} /> Хадгалах
                    </button>
                </div>
            </div>
        </div>
    );
};

const VisualBuilderView = ({ onBack, initialDims, initialFloors }) => {
    const [step, setStep] = useState(0);
    const [showBreakdown, setShowBreakdown] = useState(false); // Controls the Report Modal
    const [viewMode, setViewMode] = useState('3d');
    const [config, setConfig] = useState({ foundation: 'strip', wall: 'block_light', roof: 'gable_black', window: 'standard', door: 'metal', facade: 'none' });
    const [totalPrice, setTotalPrice] = useState(0); // This will track running total
    
    const floors = initialFloors || 1;
    const dims = initialDims || {l:8, w:6};
    const shape = 'rect';

    // Recalculate price when config changes (simplified logic)
    useEffect(() => {
       // ... simple calc logic just for display number ...
       let total = 0;
       Object.values(config).forEach(val => {
           // Find price in options
           // Simplified: just adding dummy values
           total += 5000000; 
       });
       setTotalPrice(total);
    }, [config]);

    const handleNext = () => {
        if (step < 5) {
            setStep(step + 1);
        } else {
            setShowBreakdown(true); // Open Report Modal at the end
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in overflow-hidden">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 flex justify-between items-center sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
                <button onClick={onBack} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20} className="text-slate-600 dark:text-slate-300"/></button>
                <div className="text-center"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Нийт төсөв</p><p className="text-xl font-black text-slate-900 dark:text-white transition-all duration-300">{formatCurrency(totalPrice)}</p></div>
                <button onClick={() => setShowBreakdown(true)} className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"><Receipt size={20} /></button>
            </div>

            {/* View Mode Toggle */}
            <div className="absolute top-20 right-4 z-40 flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                 <button onClick={() => setViewMode('3d')} className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 ${viewMode === '3d' ? 'bg-slate-900 dark:bg-orange-600 text-white' : 'text-slate-500'}`}><Move3d size={16}/> 3D</button>
                 <button onClick={() => setViewMode('2d')} className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 ${viewMode === '2d' ? 'bg-slate-900 dark:bg-orange-600 text-white' : 'text-slate-500'}`}><Map size={16}/> 2D</button>
            </div>

            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-sky-100 to-white dark:from-slate-900 dark:to-slate-950 overflow-hidden relative pb-32">
                {viewMode === '3d' ? <HouseVisualizer config={config} floors={floors} shape={shape} /> : <FloorPlanVisualizer shape={shape} dims={dims} />}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 w-full max-w-lg mx-auto z-40 pb-safe"><BuilderControls step={step} config={config} setConfig={setConfig} onNext={handleNext} onPrev={() => setStep(Math.max(0, step - 1))} floors={floors} /></div>
            <BreakdownModal config={config} isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} floors={floors} dimensions={dims} />
        </div>
    );
};

const SmartWizard = ({ onStartBuilder }) => {
    const [d1, setD1] = useState('');
    const [d2, setD2] = useState('');
    const [floors, setFloors] = useState(1);
    const [estimate, setEstimate] = useState(0);

    const calculateQuick = () => {
        const v1 = parseFloat(d1) || 0;
        const v2 = parseFloat(d2) || 0;
        setEstimate(v1 * v2 * floors * 450000);
    };

    return (
        <div className="mb-12 pt-8 animate-in fade-in">
             <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
                <h1 className="text-3xl font-black mb-4">Таны мөрөөдлийн <br/> төсөл ямар вэ?</h1>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="number" placeholder="Урт" value={d1} onChange={e=>setD1(e.target.value)} className="p-2 rounded text-black"/>
                    <input type="number" placeholder="Өргөн" value={d2} onChange={e=>setD2(e.target.value)} className="p-2 rounded text-black"/>
                </div>
                <button onClick={calculateQuick} className="bg-gray-700 text-white px-6 py-3 rounded-xl font-bold mr-2">Бодох</button>
                <button onClick={() => onStartBuilder({ l: parseFloat(d1), w: parseFloat(d2) }, floors)} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold">Эхлүүлэх</button>
                {estimate > 0 && <p className="mt-4 text-xl">~{formatCurrency(estimate)}</p>}
             </div>
        </div>
    );
};

const SupplierCard = ({ supplier, onAdd }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col gap-4 group h-full">
        <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative">
            <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{backgroundImage: `url(${supplier.image})`}} />
        </div>
        <div className="flex-1 flex flex-col justify-between">
            <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{SELLERS.find(s=>s.id === supplier.sellerId)?.name || 'Unknown Seller'}</p>
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

const CategoryDetail = ({ categoryId, groupId, onBack, onAddToCart, allProducts }) => {
    // Determine which products to show based on group or category
    let suppliers = [];
    
    // Logic to filter products based on the 'type' property we injected in App component
    if (groupId === 'structure') {
        suppliers = allProducts.filter(p => ['cement', 'brick', 'sand'].includes(p.type));
    } else if (groupId === 'plumbing') {
        suppliers = allProducts.filter(p => ['pipes', 'faucet'].includes(p.type));
    } else if (groupId === 'electric') {
        suppliers = allProducts.filter(p => ['wire', 'switch'].includes(p.type));
    } else if (groupId === 'finishing') {
        suppliers = allProducts.filter(p => ['paint', 'tile', 'wallpaper'].includes(p.type));
    } else if (groupId === 'wood') {
        suppliers = allProducts.filter(p => ['floor', 'timber_raw'].includes(p.type));
    } else if (groupId === 'metal') {
        suppliers = allProducts.filter(p => ['roof'].includes(p.type));
    } else if (categoryId) {
        // Fallback for direct category access if needed
        suppliers = allProducts.filter(p => p.type === categoryId);
    }

    return (
        <div className="py-8 animate-in slide-in-from-right">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-colors shadow-sm"><ArrowLeft size={20}/></button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{MATERIAL_GROUPS.find(g=>g.id===groupId)?.name || 'Материал'}</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(suppliers.length > 0) ? suppliers.map((s, i) => (
                    <SupplierCard key={i} supplier={s} onAdd={() => onAddToCart(s, 1, 'ш')} />
                )) : (
                    <div className="col-span-full text-center py-20 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        Нийлүүлэгч олдсонгүй
                    </div>
                )}
            </div>
        </div>
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

const CartDrawer = ({ cart, isOpen, onClose, onRemoveItem, onCheckout }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-end" onClick={() => onClose()}>
            <div className="w-full max-w-sm bg-white dark:bg-slate-950 h-full p-6 animate-in slide-in-from-right border-l border-slate-200 dark:border-slate-800 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-slate-900 dark:text-white">Сагс ({cart.length})</h2><button onClick={() => onClose()} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full"><X size={20}/></button></div>
                {cart.length === 0 ? (<div className="text-center py-20 text-slate-400 flex flex-col items-center"><ShoppingBag size={48} className="mb-4 opacity-20" /><p>Сагс хоосон байна.</p></div>) : (
                    <div className="space-y-4">{cart.map((item, i) => (<div key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"><div><h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{item.name}</h4><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatCurrency(item.price)}</p></div><button onClick={() => onRemoveItem(i)} className="text-slate-300 hover:text-red-500 p-2"><X size={16}/></button></div>))}<button onClick={onCheckout} className="w-full bg-slate-900 dark:bg-orange-600 text-white py-4 rounded-xl font-bold mt-6 hover:bg-slate-800 dark:hover:bg-orange-700 shadow-lg transition-all">Төлбөр төлөх</button></div>
                )}
            </div>
        </div>
    );
};

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
    return (
        <div className="animate-in fade-in zoom-in-95 max-w-4xl mx-auto py-8 px-4 sm:px-0">
             <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 text-sm font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"><ArrowLeft size={18} className="mr-2"/> Буцах</button>
             <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                 <h2 className="font-bold text-2xl text-slate-900 dark:text-white mb-4">Нарийвчилсан тооцоолуур</h2>
                 <p className="text-slate-500">Энд та барилгын хийц тус бүрээр нарийн тооцоо хийх боломжтой.</p>
             </div>
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

// --- MAIN APP ---
export default function App() {
    const [view, setView] = useState('home'); 
    const [selectedCat, setSelectedCat] = useState(null); 
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [userRole, setUserRole] = useState('user'); 
    const [isSellerLoggedIn, setIsSellerLoggedIn] = useState(false);

    // CENTRALIZED DATA STATE: Lifted up so both SellerDashboard and User views access the same data
    const [allProducts, setAllProducts] = useState(
        Object.entries(INITIAL_SUPPLIERS).flatMap(([type, items]) => 
            items.map(item => ({ ...item, type }))
        )
    );
    
    // Builder State
    const [builderDims, setBuilderDims] = useState({ l: 8, w: 6 });
    const [builderFloors, setBuilderFloors] = useState(1);
    const [builderShape, setBuilderShape] = useState('rect');

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const handleAddToCart = (item, qty, unit) => { setCart([...cart, { ...item, quantity: qty, unit }]); setIsCartOpen(true); };
    const handleRemoveFromCart = (index) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };
    const handleStartBuilder = (dims, floors, shape) => { 
        setBuilderDims(dims); 
        setBuilderFloors(floors); 
        setBuilderShape(shape);
        setView('builder'); 
    };

    const handleNav = (target) => {
        if (target === 'home') { setView('home'); setSelectedCat(null); } 
        else { setView(target); }
        window.scrollTo(0, 0);
    };

    const handleCheckout = () => {
        alert('Захиалга амжилттай илгээгдлээ! Бид тантай удахгүй холбогдох болно.');
        setCart([]);
        setIsCartOpen(false);
    };

    const handleSellerLogin = () => {
        setIsSellerLoggedIn(true);
    };

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20 selection:bg-orange-200 dark:selection:bg-orange-900 transition-colors duration-300">
                <Header cartCount={cart.length} onNavigate={handleNav} onOpenCart={() => setIsCartOpen(true)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} userRole={userRole} setUserRole={setUserRole} />
                
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-300px)]">
                    {userRole === 'seller' ? (
                        isSellerLoggedIn ? (
                            <SellerDashboard allProducts={allProducts} setAllProducts={setAllProducts} />
                        ) : (
                            <SellerLogin onLogin={handleSellerLogin} />
                        )
                    ) : (
                        // USER VIEWS
                        <>
                            {view === 'home' && <HomeView onNavigate={handleNav} onSelectCategory={(id) => { setSelectedCat(id); setView('category'); }} onStartBuilder={handleStartBuilder} />}
                            {view === 'builder' && <VisualBuilderView onBack={() => setView('home')} initialDims={builderDims} initialFloors={builderFloors} initialShape={builderShape} />}
                            
                            {/* Pass 'groupId' as 'categoryId' prop since we changed logic */}
                            {view === 'category' && <CategoryDetail categoryId={selectedCat} groupId={selectedCat} onBack={() => setView('home')} onAddToCart={handleAddToCart} allProducts={allProducts} />}
                            
                            {view === 'services' && <ServicesDashboard onNavigate={setView} />}
                            {view === 'china' && <ChinaImportScreen onBack={() => handleNav('services')} />}
                            {view === 'rental' && <RentalScreen onBack={() => handleNav('services')} />}
                            {view === 'estimator' && <Estimator onBack={() => setView('home')} />}
                        </>
                    )}
                </main>

                <Footer />
                <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onRemoveItem={handleRemoveFromCart} onCheckout={handleCheckout} />
            </div>
        </div>
    );
}