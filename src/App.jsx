import React, { useState, useEffect, useMemo } from 'react';
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
  Bell, Lock, Smartphone, Printer, Download, Sofa, Bed, Lamp, Armchair, Briefcase, Factory, MessageSquare, ShieldCheck,
  Send, FileInput, Undo, Redo, ZoomIn, ZoomOut, MousePointer2, Eraser, Flame, Snowflake, Shield, Settings, Navigation
} from 'lucide-react';

// ==========================================
// 1. DATA CONSTANTS & LOGIC
// ==========================================

const formatCurrency = (amount) => new Intl.NumberFormat('mn-MN', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ₮';

const DISTRICTS = [
  { id: 'SBD', name: 'Сүхбаатар дүүрэг' },
  { id: 'BGD', name: 'Баянгол дүүрэг' },
  { id: 'BZD', name: 'Баянзүрх дүүрэг' },
  { id: 'HUD', name: 'Хан-Уул дүүрэг' },
  { id: 'SHD', name: 'Сонгинохайрхан дүүрэг' },
  { id: 'CHD', name: 'Чингэлтэй дүүрэг' },
  { id: 'ND', name: 'Налайх дүүрэг' },
];

const DELIVERY_SLOTS = [
  { id: 'morning', label: '10:00 - 13:00' },
  { id: 'afternoon', label: '14:00 - 17:00' },
  { id: 'evening', label: '18:00 - 21:00' },
];

const DISTRICT_MATRIX = {
    '100 айл': { SBD: 2, BZD: 5, BGD: 8, HUD: 12, SHD: 15, CHD: 4, ND: 35 },
    'Гурвалжин': { SBD: 8, BZD: 12, BGD: 3, HUD: 6, SHD: 10, CHD: 9, ND: 45 },
    'Мишээл': { SBD: 10, BZD: 15, BGD: 5, HUD: 2, SHD: 12, CHD: 11, ND: 40 },
    'Налайх': { SBD: 35, BZD: 30, BGD: 45, HUD: 40, SHD: 55, CHD: 38, ND: 2 },
    'Яармаг': { SBD: 15, BZD: 20, BGD: 8, HUD: 5, SHD: 12, CHD: 16, ND: 45 },
    'Цайз': { SBD: 6, BZD: 3, BGD: 10, HUD: 14, SHD: 18, CHD: 8, ND: 30 },
};

const DELIVERY_ENGINE = {
    calculate: (cartItems, userDistrictId, sellers) => {
        if (!userDistrictId) return { total: 0, details: [] };

        let totalDeliveryCost = 0;
        let trips = [];

        const itemsByLocation = {};
        
        cartItems.forEach(item => {
            const seller = sellers.find(s => s.id === item.vendorId);
            const location = seller?.location || '100 айл'; 
            if (!itemsByLocation[location]) itemsByLocation[location] = [];
            itemsByLocation[location].push({ item, seller });
        });

        Object.entries(itemsByLocation).forEach(([location, group]) => {
            const distance = DISTRICT_MATRIX[location]?.[userDistrictId] || 10;
            const tripCost = 15000 + (distance * 1500); 
            
            totalDeliveryCost += tripCost;
            trips.push({
                from: location,
                distance: distance,
                cost: tripCost,
                sellers: [...new Set(group.map(g => g.seller.name))]
            });
        });

        return {
            total: totalDeliveryCost,
            trips: trips,
            isAggregated: true 
        };
    }
};

const MATERIAL_GROUPS = [
  { id: 'structure', name: 'Дүүргэгч материал', icon: <BrickWall size={24}/>, color: 'bg-orange-100 text-orange-600', desc: 'Цемент, тоосго, блок, элс, хайрга' },
  { id: 'metal', name: 'Төмөр хийц', icon: <Hammer size={24}/>, color: 'bg-slate-200 text-slate-700', desc: 'Арматур, дээвэр, труба, төмөр хавтан' },
  { id: 'wood', name: 'Модон хийц', icon: <Ruler size={24}/>, color: 'bg-amber-100 text-amber-700', desc: 'Банз, палк, паркет, дүнз' },
  { id: 'plumbing', name: 'Сантехник', icon: <Droplets size={24}/>, color: 'bg-blue-100 text-blue-600', desc: 'Шугам хоолой, холбох хэрэгсэл, кран' },
  { id: 'electric', name: 'Цахилгаан', icon: <Zap size={24}/>, color: 'bg-yellow-100 text-yellow-600', desc: 'Утас, розетка, гэрэлтүүлэг, автомат' },
  { id: 'finishing', name: 'Засал чимэглэл', icon: <PaintBucket size={24}/>, color: 'bg-pink-100 text-pink-600', desc: 'Будаг, обой, плита, замаск' },
];

const CALC_ENGINE = {
    norms: {
      block: { unit: 'ш', perM2: 12.5, waste: 0.05, price: 4000, insulation: 0.5 },
      brick: { unit: 'ш', perM2: 52, waste: 0.05, price: 650, insulation: 0.8 },   
      cement: { unit: 'кг', perM3: 350, waste: 0.0, price: 250 }, 
      sand: { unit: 'тн', perM3: 1.6, waste: 0.05, price: 25000 },
      rebar: { unit: 'кг', perM3: 60, waste: 0.05, price: 2800 }, 
      roof_sheet: { unit: 'м2', waste: 0.15, price: 22000, lifetime: 15 },
      roof_tile: { unit: 'м2', waste: 0.1, price: 45000, lifetime: 30 },
    },
    
    scenarios: {
        economy: { multiplier: 1, label: 'Хэмнэлттэй', color: 'bg-green-100 text-green-700' },
        standard: { multiplier: 1.4, label: 'Стандарт', color: 'bg-blue-100 text-blue-700' },
        premium: { multiplier: 2.2, label: 'Тансаг', color: 'bg-purple-100 text-purple-700' }
    },
  
    calculateProject: (dims, floors, config, scenario = 'standard') => {
        const sMultiplier = CALC_ENGINE.scenarios[scenario].multiplier;
        
        const perimeter = (dims.l + dims.w) * 2;
        const area = dims.l * dims.w;
        const wallHeight = 2.8;
        const totalWallArea = perimeter * wallHeight * floors;
        
        const foundVol = (perimeter * 0.5 * 1.5).toFixed(1); 
        const cementQty = Math.ceil(foundVol * CALC_ENGINE.norms.cement.perM3);
        const sandQty = Math.ceil(foundVol * CALC_ENGINE.norms.sand.perM3);
        const foundCost = (cementQty * CALC_ENGINE.norms.cement.price) + (sandQty * CALC_ENGINE.norms.sand.price);

        const wallType = config.wall.includes('brick') ? 'brick' : 'block';
        const wallNorm = CALC_ENGINE.norms[wallType];
        const wallCount = Math.ceil(totalWallArea * wallNorm.perM2 * (1 + wallNorm.waste));
        const wallCost = wallCount * wallNorm.price * (scenario === 'premium' ? 1.5 : 1);

        const roofArea = area * 1.3;
        const roofCount = Math.ceil(roofArea);
        const roofCost = roofCount * CALC_ENGINE.norms.roof_sheet.price * (scenario === 'economy' ? 1 : 1.8);

        const buildCost = foundCost + wallCost + roofCost;

        const insulationFactor = scenario === 'economy' ? 1.5 : (scenario === 'standard' ? 1.0 : 0.7); 
        const heatingCostPerYear = (area * floors * 5000 * 8 * insulationFactor); 
        const maintenanceCostPerYear = buildCost * (scenario === 'economy' ? 0.03 : 0.01);

        return {
            totalCost: buildCost,
            lifecycle: {
                heating10Y: heatingCostPerYear * 10,
                maintenance10Y: maintenanceCostPerYear * 10,
                total10Y: buildCost + (heatingCostPerYear * 10) + (maintenanceCostPerYear * 10)
            },
            details: [
                { category: 'Суурь', material: 'Цемент', qty: cementQty, unit: 'кг', price: foundCost },
                { category: 'Хана', material: wallType === 'brick' ? 'Тоосго' : 'Блок', qty: wallCount, unit: 'ш', price: wallCost },
                { category: 'Дээвэр', material: 'Төмөр дээвэр', qty: roofCount, unit: 'м2', price: roofCost },
            ]
        };
    },

    mapToRFQItems: (rawDetails) => {
        return rawDetails || [];
    }
};

const HOUSE_OPTIONS = {
  foundation: [
    { id: 'strip', name: 'Туузан суурь', price: 12000000, color: '#64748b', type: 'solid', unit: 'багц', desc: 'Бат бөх, найдвартай' }, 
    { id: 'pile', name: 'Баганан суурь', price: 6500000, color: '#94a3b8', type: 'dots', unit: 'багц', desc: 'Зардал бага, хөнгөн' },
    { id: 'slab', name: 'Хавтан суурь', price: 15000000, color: '#475569', type: 'solid', unit: 'багц', desc: 'Намгархаг хөрсөнд' }, 
    { id: 'basement', name: 'Зоорьтой суурь', price: 28000000, color: '#334155', type: 'solid', unit: 'багц', desc: 'Агуулах, гаражтай' },
  ],
  wall: [
    { id: 'block_light', name: 'Хөнгөн блок', price: 12500000, color: '#e2e8f0', pattern: 'block', unit: 'багц', desc: 'Дулаан алдагдал бага' }, 
    { id: 'brick_red', name: 'Улаан тоосго', price: 18000000, color: '#ef4444', pattern: 'brick', unit: 'багц', desc: 'Уламжлалт, бат бөх' },
    { id: 'brick_black', name: 'Хар тоосго', price: 20000000, color: '#1e293b', pattern: 'brick', unit: 'багц', desc: 'Модерн загвар' },
    { id: 'timber', name: 'Дүнзэн (Мод)', price: 35000000, color: '#d97706', pattern: 'wood', unit: 'багц', desc: 'Эко, дулаан' },
    { id: 'concrete', name: 'Цутгамал бетон', price: 28000000, color: '#94a3b8', pattern: 'plain', unit: 'багц', desc: 'Маш бат бөх' },
  ],
  roof: [
    { id: 'gable_red', name: 'Төмөр (Улаан)', price: 6500000, color: '#b91c1c', type: 'gable', unit: 'багц', desc: 'Энгийн хийц' }, 
    { id: 'gable_black', name: 'Битамон (Хар)', price: 9500000, color: '#1e293b', type: 'gable', unit: 'багц', desc: 'Дуу чимээ бага' },
    { id: 'hip_green', name: 'Майхан (Ногоон)', price: 8500000, color: '#15803d', type: 'hip', unit: 'багц', desc: 'Салхинд тэсвэртэй' },
    { id: 'flat', name: 'Хавтгай', price: 12000000, color: '#475569', type: 'flat', unit: 'багц', desc: 'Террас хийх боломжтой' },
    { id: 'shed', name: 'Нэг налуу (Хар)', price: 5500000, color: '#0f172a', type: 'shed', unit: 'багц', desc: 'Модерн, энгийн' },
  ],
  window: [
    { id: 'standard', name: 'Стандарт', price: 350000, type: 'std', unit: 'ш', desc: '2 давхар шил' }, 
    { id: 'triple', name: '3 давхар шил', price: 550000, type: 'std', unit: 'ш', desc: 'Дулаан алдагдал бага' },
    { id: 'panoramic', name: 'Панорама', price: 850000, type: 'pano', unit: 'ш', desc: 'Шалнаас тааз хүртэл' },
    { id: 'arched', name: 'Тал дугуй', price: 650000, type: 'arch', unit: 'ш', desc: 'Сонгодог загвар' },
  ],
  door: [
    { id: 'metal', name: 'Бүргэд', price: 650000, color: '#7f1d1d', type: 'std', unit: 'ш', desc: 'ОХУ стандарт' }, 
    { id: 'smart', name: 'Ухаалаг (Хар)', price: 1200000, color: '#171717', type: 'std', unit: 'ш', desc: 'Код, хурууны хээ' },
    { id: 'white', name: 'Цагаан', price: 550000, color: '#f1f5f9', type: 'std', unit: 'ш', desc: 'Модерн' },
    { id: 'glass', name: 'Шилэн', price: 1500000, color: '#94a3b8', type: 'glass', unit: 'ш', desc: 'Оффис, дэлгүүр' },
  ],
  facade: [
    { id: 'none', name: 'Өнгөлгөөгүй', price: 0, color: 'transparent', pattern: 'none', unit: 'багц', desc: 'Үндсэн хана' },
    { id: 'stucco', name: 'Чулуун замаск', price: 2500000, color: '#f5f5f4', pattern: 'noise', unit: 'багц', desc: 'Гоёлын шавардлага' },
    { id: 'siding', name: 'Сайдинг', price: 3500000, color: '#cbd5e1', pattern: 'lines', unit: 'багц', desc: 'Металл өнгөлгөө' },
    { id: 'brick_veneer', name: 'Өнгөлгөөний тоосго', price: 5500000, color: '#b91c1c', pattern: 'brick', unit: 'багц', desc: 'Тансаг харагдац' },
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
  brick: [
    { id: 4, sellerId: 's3', name: 'Налайх Тоосго', price: 650, unit: 'ш', stock: 10000, delivery: 'paid', image: 'https://placehold.co/150x150/ef4444/fee2e2?text=Brick', tags: ['Улаан'] },
    { id: 202, sellerId: 's2', name: 'Хөнгөн Блок', price: 4000, unit: 'ш', stock: 2000, delivery: 'paid', image: 'https://placehold.co/150x150/d1d5db/64748b?text=Block', tags: ['60x30x20'] }
  ],
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

const SELLERS = [
  { id: 's1', name: 'Төмөр Трейд', rating: 4.8, location: '100 айл', phone: '9911-0001', verified: true, delivery: { enabled: true, priceKm: 1500, minOrder: 100000 } },
  { id: 's2', name: 'Барилга МН', rating: 4.5, location: 'Гурвалжин', phone: '8811-0002', verified: true, delivery: { enabled: true, priceKm: 1200, minOrder: 500000 } },
  { id: 's3', name: 'Налайх Тоосго', rating: 4.2, location: 'Налайх', phone: '7011-0003', verified: true, delivery: { enabled: false, priceKm: 0, minOrder: 0 } },
  { id: 's4', name: 'Pro Tiles', rating: 4.6, location: 'Мишээл', phone: '9900-0004', verified: true },
];

const GROUP_BUYS = [
  { id: 'g1', title: 'Арматур (Шууд үйлдвэрээс)', origin: 'Бээжин, Хятад', deadline: '3 хоногийн дараа', target: 20, current: 14, price: 2100000, marketPrice: 2600000, image: 'https://placehold.co/300x150/e2e8f0/64748b?text=Rebar+China', desc: 'Хэбэй мужийн гангийн үйлдвэрээс шууд татан авалт.' },
  { id: 'g2', title: 'Гоёлын Плита', origin: 'Гуанжоу, Хятад', deadline: '5 хоногийн дараа', target: 1000, current: 650, price: 28000, marketPrice: 45000, image: 'https://placehold.co/300x150/cffafe/0891b2?text=Tile+Guangzhou', desc: '60x60 хэмжээтэй, сайн чанарын чулуун плита.' }
];

const RENTALS = [
  { id: 'r1', name: 'Бетон зуурмагийн машин', price: 150000, unit: 'цаг', image: 'https://placehold.co/100x100/fef3c7/d97706?text=Pump', desc: '36м урттай, өндөр бүтээмжтэй.' },
  { id: 'r2', name: 'Барилгын шат', price: 2000, unit: 'өдөр', image: 'https://placehold.co/100x100/e5e7eb/374151?text=Scaffold', desc: '1.8м өндөртэй, аюулгүй байдал хангасан.' },
];

const PROJECT_TEMPLATES = [
    { id: 'house_small', title: 'Зуслангийн байшин', subtitle: '6x8м, 1 давхар', icon: <Home size={24}/>, dims: { l: 8, w: 6 }, floors: 1 },
    { id: 'house_large', title: 'Амины орон сууц', subtitle: '10x12м, 2 давхар', icon: <Building2 size={24}/>, dims: { l: 12, w: 10 }, floors: 2 },
    { id: 'garage', title: 'Дулаан гараж', subtitle: '6x4м, 1 машин', icon: <Warehouse size={24}/>, dims: { l: 6, w: 4 }, floors: 1 },
    { id: 'fence', title: 'Хашаа', subtitle: '0.07 га', icon: <Fence size={24}/>, dims: { l: 35, w: 20 }, floors: 1 },
];

// --- COMPONENTS ---

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

const Header = ({ cartCount, onNavigate, onOpenCart, darkMode, toggleDarkMode, userRole, setUserRole }) => (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
                    <img src="/logo.png" alt="Hutuch" className="w-full h-full object-contain" onError={(e) => {e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🏗️';}} />
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
                        <button onClick={() => onNavigate('builder')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Төлөвлөгч</button>
                        <button onClick={() => onNavigate('rfq')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Үнийн санал</button>
                    </>
                ) : (
                    <button className="text-sm font-bold text-orange-600 cursor-default">Борлуулагчийн удирдлага</button>
                )}
            </nav>
            <div className="flex items-center gap-3">
                <button onClick={() => setUserRole(userRole === 'user' ? 'seller' : 'user')} className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold ${userRole === 'seller' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {userRole === 'user' ? <User size={16}/> : <Store size={16}/>}
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

const SellerDashboard = ({ allProducts, setAllProducts, rfqs }) => {
    const currentSellerId = 'v1';
    const myProducts = allProducts.filter(p => p.vendorId === currentSellerId);
    const [activeTab, setActiveTab] = useState('products');
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: 'ш', stock: '', color: '', size: '', type: 'brick' });
    const [deliveryConfig, setDeliveryConfig] = useState({ enabled: true, priceKm: 1500, minOrder: 100000 });

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
        alert("Бараа амжилттай нэмэгдлээ!");
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
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={()=>setActiveTab('products')} className={`p-3 rounded-xl text-xs font-bold ${activeTab==='products'?'bg-orange-600':'bg-slate-800'}`}>Бараа</button>
                    <button onClick={()=>setActiveTab('rfqs')} className={`p-3 rounded-xl text-xs font-bold ${activeTab==='rfqs'?'bg-orange-600':'bg-slate-800'}`}>Захиалга</button>
                    <button onClick={()=>setActiveTab('settings')} className={`p-3 rounded-xl text-xs font-bold ${activeTab==='settings'?'bg-orange-600':'bg-slate-800'}`}>Тохиргоо</button>
                 </div>
            </div>

            <div className="px-4">
                 {activeTab === 'settings' && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Truck size={18}/> Хүргэлтийн тохиргоо</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Хүргэлт хийх</span>
                                <input type="checkbox" checked={deliveryConfig.enabled} onChange={e=>setDeliveryConfig({...deliveryConfig, enabled: e.target.checked})} className="toggle"/>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Км-ийн үнэ (₮)</label>
                                <input type="number" value={deliveryConfig.priceKm} onChange={e=>setDeliveryConfig({...deliveryConfig, priceKm: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg"/>
                            </div>
                            <button className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">Хадгалах</button>
                        </div>
                    </div>
                )}
                
                {activeTab === 'products' && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Миний бараа ({myProducts.length})</h3>
                            <button onClick={() => setIsAdding(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/30">
                                <Plus size={16}/> Нэмэх
                            </button>
                        </div>

                        {/* Add Product Form */}
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
                    </>
                )}
                
                {activeTab === 'rfqs' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg mb-4">Ирсэн үнийн санал (RFQs)</h3>
                        {rfqs.length === 0 ? <p className="text-center text-slate-400 py-10">Хүсэлт алга.</p> : rfqs.map((rfq, idx) => (
                             <div key={idx} className="bg-white p-5 rounded-2xl border shadow-sm">
                                 <div className="flex justify-between mb-2"><span className="font-bold">Төсөл #{rfq.id}</span><span className="text-xs text-slate-400">{new Date(rfq.date).toLocaleDateString()}</span></div>
                                 <div className="text-xs bg-slate-50 p-2 rounded mb-3">{rfq.items.length} төрлийн материал</div>
                                 <button className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Үнэ илгээх</button>
                             </div>
                        ))}
                    </div>
                )}
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
    let suppliers = [];
    
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

const CartDrawer = ({ cart, isOpen, onClose, onCheckout }) => {
    const [district, setDistrict] = useState('');
    const [slot, setSlot] = useState('');
    
    // Delivery Calculation
    const delivery = useMemo(() => {
        if (!district) return { total: 0 };
        return DELIVERY_ENGINE.calculate(cart, district, SELLERS);
    }, [cart, district]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = cartTotal + (delivery.total || 0);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-end" onClick={() => onClose()}>
            <div className="w-full max-w-md bg-white dark:bg-slate-950 h-full p-6 animate-in slide-in-from-right border-l border-slate-200 dark:border-slate-800 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-slate-900 dark:text-white">Сагс ({cart.length})</h2><button onClick={() => onClose()} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full"><X size={20}/></button></div>
                
                <div className="flex-1 overflow-y-auto space-y-4">
                    {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{item.name}</h4><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.quantity} {item.unit} x {formatCurrency(item.price)}</p>
                            </div>
                            <button className="text-slate-300 hover:text-red-500 p-2"><X size={16}/></button>
                        </div>
                    ))}
                    
                    {/* Delivery Options */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3 mt-4">
                        <h4 className="font-bold text-sm flex items-center gap-2"><Truck size={16}/> Хүргэлт</h4>
                        <select className="w-full p-2 text-sm border rounded-lg" value={district} onChange={e=>setDistrict(e.target.value)}>
                            <option value="">Дүүрэг сонгох</option>
                            {DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        {district && (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    {DELIVERY_SLOTS.map(s => (
                                        <button key={s.id} onClick={()=>setSlot(s.id)} className={`flex-1 py-1 text-[10px] border rounded ${slot===s.id?'bg-slate-900 text-white':''}`}>{s.label}</button>
                                    ))}
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                                    <span>Хүргэлт ({delivery.isAggregated ? 'Нэгдсэн' : 'Энгийн'})</span>
                                    <span className="font-bold">{formatCurrency(delivery.total)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto">
                    <div className="flex justify-between items-center mb-4 text-lg font-black text-slate-900 dark:text-white">
                        <span>Нийт</span>
                        <span>{formatCurrency(finalTotal)}</span>
                    </div>
                    <button onClick={onCheckout} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all hover:bg-orange-700">Төлбөр төлөх</button>
                </div>
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
const HomeView = ({ onNavigate, onSelectCategory, onStartTemplate }) => (
    <div className="animate-in fade-in py-8">
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 mb-12 shadow-2xl relative overflow-hidden mx-4 sm:mx-0">
            <div className="relative z-10 max-w-lg">
                <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded-full mb-3 border border-orange-500/30">HUTUCH PLATFORM v2.0</span>
                <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">Юу барих гэж байна?</h1>
                <p className="text-slate-400 text-sm mb-8">Бид зөвхөн материал зардаггүй. Бид таны төсөв, дулаан алдагдал, ирээдүйн зардлыг тооцоолж өгнө.</p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none"><Construction size={250} /></div>
        </div>
        
        <div className="px-2 mb-10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-2">Түгээмэл төслүүдээс эхлэх</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PROJECT_TEMPLATES.map(tpl => (
                    <button 
                        key={tpl.id} 
                        onClick={() => onStartTemplate(tpl)}
                        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all text-left group"
                    >
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3 text-slate-600 group-hover:text-orange-600 transition-colors">
                            {tpl.icon}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{tpl.title}</h3>
                        <p className="text-[10px] text-slate-500 mt-1">{tpl.subtitle}</p>
                    </button>
                ))}
            </div>
        </div>

        <div className="px-2 mb-10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-2">Материал хайх</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {MATERIAL_GROUPS.map((group) => (
                    <button key={group.id} onClick={() => { onSelectCategory(group.id); onNavigate('category'); }} className="flex flex-col items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${group.color} bg-opacity-20`}>{group.icon}</div>
                        <span className="font-bold text-xs text-center">{group.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    </div>
);

// --- MAIN APP ---
export default function App() {
    const [view, setView] = useState('home'); 
    const [selectedCat, setSelectedCat] = useState(null); // This stores groupId now
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [userRole, setUserRole] = useState('user'); // 'user', 'seller', 'admin'
    const [isSellerLoggedIn, setIsSellerLoggedIn] = useState(false);
    const [rfqs, setRfqs] = useState([]);
    const [initialTemplate, setInitialTemplate] = useState(null);

    const [allProducts, setAllProducts] = useState(Object.values(INITIAL_SUPPLIERS).flat());

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const handleAddToCart = (item, qty, unit) => { setCart([...cart, { ...item, quantity: qty, unit }]); setIsCartOpen(true); };
    const handleRemoveFromCart = (index) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };

    const handleStartTemplate = (tpl) => { 
        setInitialTemplate(tpl); 
        setView('builder'); 
    };

    const handleSaveEstimateAsRFQ = (data) => {
        setRfqs([{ id: Date.now().toString().slice(-4), date: new Date().toISOString(), items: data.details || [] }, ...rfqs]);
        alert("RFQ Sent!"); 
        setView('rfq');
    };

    const handleNav = (target) => {
        setView(target);
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
                        // 3.2 SELLER DASHBOARD VIEW
                        isSellerLoggedIn ? 
                        <SellerDashboard allProducts={allProducts} setAllProducts={setAllProducts} rfqs={rfqs} /> 
                        : 
                        <SellerLogin onLogin={handleSellerLogin} />
                    ) : (
                        // USER VIEWS
                        <>
                            {view === 'home' && <HomeView onNavigate={handleNav} onSelectCategory={(id) => { setSelectedCat(id); setView('category'); }} onStartTemplate={handleStartTemplate} />}
                            {view === 'builder' && <VisualBuilderView onBack={() => setView('home')} initialDims={builderDims} initialFloors={builderFloors} />}
                            {view === 'rfq' && <RFQManager rfqs={rfqs} onBack={() => setView('home')} />}
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