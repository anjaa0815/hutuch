import React, { useState, useEffect, useMemo } from 'react';
import BuildEstimator from './BuildEstimator.jsx';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
  Send, FileInput, Undo, Redo, ZoomIn, ZoomOut, MousePointer2, Eraser, Flame, Snowflake, Shield, Settings, Navigation,
  ThumbsUp, MessageCircle, HelpCircle
} from 'lucide-react';

// --- Firebase Init (тохиргоо байхгүй бол алгасна — сайт унахгүй) ---
let app = null;
let auth = null;
try {
    // eslint-disable-next-line no-undef
    const cfgStr = typeof __firebase_config !== 'undefined' ? __firebase_config : (import.meta.env.VITE_FIREBASE_CONFIG || null);
    if (cfgStr) {
        const firebaseConfig = typeof cfgStr === 'string' ? JSON.parse(cfgStr) : cfgStr;
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        getFirestore(app); // initialized for future use
    } else {
        console.warn('Firebase тохиргоо олдсонгүй — auth/firestore идэвхгүй горимд ажиллана.');
    }
} catch (e) {
    console.warn('Firebase эхлүүлж чадсангүй:', e);
}

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

// --- FOUNDATION TYPES ---
const FOUNDATION_TYPES = [
    { id: 'strip', name: 'Туузан суурь', desc: 'Даацын хананд тохиромжтой', icon: <Layers size={20}/>, multiplier: 1.0 },
    { id: 'pad', name: 'Баганан суурь', desc: 'Каркасан барилгад', icon: <Grid size={20}/>, multiplier: 0.7 },
    { id: 'raft', name: 'Хавтан суурь', desc: 'Сул хөрстэй газар', icon: <Square size={20}/>, multiplier: 1.5 },
];

const WALL_TYPES = [
    { id: 'block', name: 'Хөнгөн блок', price: 4200, unit: 'ш', desc: '60x30x20 стандарт', waste: 0.05, perM2: 12.5, calcType: 'piece' },
    { id: 'mak', name: 'МАК Евро блок', price: 11500, unit: 'ш', desc: '60x40x25 дулаан', waste: 0.03, perM2: 6.6, calcType: 'piece' },
    { id: 'brick', name: 'Улаан тоосго', price: 680, unit: 'ш', desc: '36-ын хана (давхар)', waste: 0.05, perM2: 104, calcType: 'piece' },
    { id: 'timber', name: 'Дүнз (Орос)', price: 850000, unit: 'м3', desc: '25см диаметртэй нарс', waste: 0.1, thickness: 0.25, calcType: 'volume' },
    { id: 'concrete', name: 'Цутгамал бетон', price: 280000, unit: 'м3', desc: 'М300 бетон, 20см', waste: 0.05, thickness: 0.20, calcType: 'volume' },
];

const ROOF_TYPES = [
    { id: 'flat', name: 'Хавтгай (Flat)', multiplier: 1.02, priceM2: 65000, desc: 'Орчин үеийн, террас хийх боломжтой', waste: 0.05 },
    { id: 'gable', name: 'Энгийн үзүүрт (Gable)', multiplier: 1.35, priceM2: 45000, desc: 'Хамгийн түгээмэл, цас унахдаа сайн', waste: 0.1 },
    { id: 'hip', name: 'Дөрвөн талт (Hip)', multiplier: 1.45, priceM2: 55000, desc: 'Салхинд тэсвэртэй, бат бөх', waste: 0.15 },
    { id: 'mansard', name: 'Мансард (Mansard)', multiplier: 1.8, priceM2: 75000, desc: 'Доороо өрөө гаргах боломжтой', waste: 0.2 },
    { id: 'shed', name: 'Нэг налуу (Shed)', multiplier: 1.2, priceM2: 40000, desc: 'Энгийн хийц, гараж болон амбаарт тохиромжтой', waste: 0.08 },
    { id: 'butterfly', name: 'Эрвээхэй (Butterfly)', multiplier: 1.4, priceM2: 95000, desc: 'Өвөрмөц дизайн, ус цуглуулах боломжтой', waste: 0.15 },
    { id: 'pyramid', name: 'Пирамид (Pyramid)', multiplier: 1.5, priceM2: 60000, desc: 'Квадрат суурьтай барилгад тохиромжтой', waste: 0.15 },
    { id: 'skillion', name: 'Скиллион (Skillion)', multiplier: 1.25, priceM2: 48000, desc: 'Модерн загвар', waste: 0.1 },
];

const CALC_ENGINE = {
    norms: {
      cement: { unit: 'кг', perM3: 350, waste: 0.0, price: 250 }, 
      sand: { unit: 'тн', perM3: 1.6, waste: 0.05, price: 25000 },
      // Interior Norms
      paint: { unit: 'л', perM2: 0.25, price: 18000, desc: '2 давхар' },
      wallpaper: { unit: 'рулон', width: 1.06, length: 10, price: 65000, pattern: 0 },
      parquet: { unit: 'м2', waste: 0.05, price: 45000 },
      tile: { unit: 'м2', waste: 0.1, price: 35000 },
    },
    
    calculateProject: (dims, floors, config) => {
        const perimeter = (dims.l + dims.w) * 2;
        const floorArea = dims.l * dims.w;
        const wallHeight = 2.8;
        const grossWallArea = perimeter * wallHeight * floors;
        const netWallArea = grossWallArea * 0.85; 
        
        let details = [];
        let totalCost = 0;

        // --- 1. Structure ---
        
        // Foundation Calculation Logic
        let foundVol = 0;
        const selectedFound = FOUNDATION_TYPES.find(f => f.id === config.foundation) || FOUNDATION_TYPES[0];

        if (config.foundation === 'raft') {
             // Хавтан суурь: Бүх талбайгаар * 30см зузаан
             foundVol = floorArea * 0.3;
        } else if (config.foundation === 'pad') {
             // Баганан суурь: Ойролцоогоор 3м тутамд 1 багана гэж тооцъё
             const pads = Math.ceil(perimeter / 3) + Math.ceil(floorArea / 15); // Периметр + дунд багана
             foundVol = pads * (0.8 * 0.8 * 1.5); // 80x80см хэмжээтэй 1.5м гүн
        } else {
             // Туузан суурь (Default): Периметр * 50см өргөн * 1.5м гүн
             foundVol = perimeter * 0.5 * 1.5;
        }

        const cementQty = Math.ceil(foundVol * CALC_ENGINE.norms.cement.perM3);
        const foundCost = cementQty * CALC_ENGINE.norms.cement.price;
        
        details.push({ 
            category: 'Карказ', 
            material: `${selectedFound.name}`, 
            qty: cementQty, 
            unit: 'кг (Цемент)', 
            price: foundCost,
            note: `Тооцсон эзлэхүүн: ${foundVol.toFixed(1)} м³`
        });

        // Wall
        const selectedWall = WALL_TYPES.find(w => w.id === config.wall) || WALL_TYPES[0];
        let wallQty = 0;
        let wallCost = 0;

        if (selectedWall.calcType === 'piece') {
            wallQty = Math.ceil(grossWallArea * selectedWall.perM2 * (1 + selectedWall.waste));
            wallCost = wallQty * selectedWall.price;
        } else if (selectedWall.calcType === 'volume') {
            wallQty = Math.ceil(grossWallArea * selectedWall.thickness * (1 + selectedWall.waste));
            wallCost = wallQty * selectedWall.price;
        }
        
        details.push({ category: 'Карказ', material: selectedWall.name, qty: wallQty, unit: selectedWall.unit, price: wallCost });

        // Roof
        const selectedRoof = ROOF_TYPES.find(r => r.id === config.roof) || ROOF_TYPES[1];
        const roofRealArea = Math.ceil(floorArea * selectedRoof.multiplier * 1.2); 
        const roofMaterialCost = roofRealArea * selectedRoof.priceM2;
        
        details.push({ category: 'Карказ', material: `Дээвэр (${selectedRoof.name})`, qty: roofRealArea, unit: 'м2', price: roofMaterialCost });

        // --- 2. Interior ---

        // Floor
        if (config.floorType === 'parquet') {
            const qty = Math.ceil(floorArea * floors * (1 + CALC_ENGINE.norms.parquet.waste));
            const cost = qty * CALC_ENGINE.norms.parquet.price;
            details.push({ category: 'Дотор засал', material: 'Паркет шал', qty: qty, unit: 'м2', price: cost });
            totalCost += cost;
        } else if (config.floorType === 'tile') {
            const qty = Math.ceil(floorArea * floors * (1 + CALC_ENGINE.norms.tile.waste));
            const cost = qty * CALC_ENGINE.norms.tile.price;
            details.push({ category: 'Дотор засал', material: 'Плита (Шал)', qty: qty, unit: 'м2', price: cost });
            totalCost += cost;
        }

        // Wall Finish
        if (config.wallFinish === 'paint') {
            const qty = Math.ceil(netWallArea * CALC_ENGINE.norms.paint.perM2);
            const cost = qty * CALC_ENGINE.norms.paint.price;
            details.push({ category: 'Дотор засал', material: 'Будаг (Эмульс)', qty: qty, unit: 'литр', price: cost, note: '2 давхар' });
            totalCost += cost;
        } else if (config.wallFinish === 'wallpaper') {
            const strips = Math.ceil(perimeter / CALC_ENGINE.norms.wallpaper.width);
            const stripsPerRoll = Math.floor(CALC_ENGINE.norms.wallpaper.length / wallHeight);
            const rolls = Math.ceil(strips / stripsPerRoll) * floors;
            const cost = rolls * CALC_ENGINE.norms.wallpaper.price;
            details.push({ category: 'Дотор засал', material: 'Обой (1.06м)', qty: rolls, unit: 'рулон', price: cost });
            totalCost += cost;
        }

        totalCost += (foundCost + wallCost + roofMaterialCost);

        return {
            totalCost: totalCost,
            details: details
        };
    },
};

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

const FORUM_POSTS = [
    { id: 1, user: 'Болд-Эрдэнэ', avatar: 'https://placehold.co/40x40/orange/white?text=B', title: 'Өвөл бетон цутгахад юу анхаарах вэ?', desc: 'Сайн байна уу? Одоо 11 сард суурь цутгавал хөлдөх болов уу? Ямар нэмэлт бодис хийх вэ?', category: 'structure', likes: 15, comments: 4, date: '2 цагийн өмнө' },
    { id: 2, user: 'Сарантуяа', avatar: 'https://placehold.co/40x40/purple/white?text=S', title: 'Ванны өрөөний ус алдаад байна, яах вэ?', desc: 'Дээд айлаас ус алдаад таазаар шар толбо үүсчихлээ. Яаж засуулах вэ?', category: 'plumbing', likes: 8, comments: 12, date: 'Өчигдөр' },
    { id: 3, user: 'Hutuch Admin', avatar: 'https://placehold.co/40x40/1e293b/white?text=A', title: 'Шинэчлэгдсэн үнийн тариф', desc: 'Цементийн үнэ 2024 оны 1-р улирлын байдлаар нэмэгдсэн байна. Дэлгэрэнгүйг...', category: 'general', likes: 45, comments: 2, date: '3 хоногийн өмнө' },
    { id: 4, user: 'Ганбаа', avatar: 'https://placehold.co/40x40/green/white?text=G', title: 'Цахилгааны монтаж хийж өгнө', desc: 'Бүх төрлийн цахилгааны ажил чанартай хийнэ. Утас: 9911-XXXX', category: 'electric', likes: 2, comments: 0, date: '5 хоногийн өмнө' },
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
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center border border-slate-200">
                    <img 
                        src="logo.png" 
                        alt="Hutuch Logo" 
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/100x100/orange/white?text=H'; // Fallback
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
                        <button onClick={() => onNavigate('builder')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Төлөвлөгч</button>
                        <button onClick={() => onNavigate('estimator')} className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">Тооцоолуур</button>
                        <button onClick={() => onNavigate('advice')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">Зөвлөгөө</button>
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
                         <img 
                            src="logo.png" 
                            alt="Hutuch" 
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/50x50/orange/white?text=H';
                            }}
                         />
                         Hutuch
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
    
    // Updated State for Registration
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
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-slate-100 p-2 overflow-hidden">
                        <img src="logo.png" alt="Hutuch Logo" className="w-full h-full object-contain" />
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

const AdviceForumView = ({ onBack }) => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [isAsking, setIsAsking] = useState(false);

    const categories = [
        { id: 'all', label: 'Бүгд' },
        { id: 'structure', label: 'Барилга угсралт' },
        { id: 'plumbing', label: 'Сантехник' },
        { id: 'electric', label: 'Цахилгаан' },
        { id: 'interior', label: 'Дотор засал' },
        { id: 'legal', label: 'Зөвлөгөө' },
        { id: 'general', label: 'Ерөнхий' }
    ];

    const filteredPosts = activeCategory === 'all' 
        ? FORUM_POSTS 
        : FORUM_POSTS.filter(post => post.category === activeCategory);

    return (
        <div className="animate-in fade-in py-8">
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-lg border hover:bg-slate-50 dark:border-slate-700 dark:text-white"><ArrowLeft size={20}/></button>
                 <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Зөвлөгөө & Форум</h2>
                    <p className="text-slate-500 text-sm">Мэргэжлийн хүмүүсээс зөвлөгөө аваарай</p>
                 </div>
                 <button onClick={() => setIsAsking(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
                    <MessageSquare size={18} /> Асуулт асуух
                 </button>
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-6">
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
                {filteredPosts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <img src={post.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 transition-colors">{post.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{post.user}</span>
                                        <span>•</span>
                                        <span>{post.date}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] rounded-lg font-bold uppercase">{categories.find(c => c.id === post.category)?.label}</span>
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{post.desc}</p>
                        
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"><ThumbsUp size={16}/> {post.likes}</div>
                            <div className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"><MessageCircle size={16}/> {post.comments} Хариулт</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ask Modal (Visual Only) */}
            {isAsking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Асуулт асуух</h3>
                            <button onClick={() => setIsAsking(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Гарчиг</label>
                                <input type="text" placeholder="Жишээ: Хананд цууралт үүсээд байна" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Төрөл</label>
                                <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none">
                                    {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Дэлгэрэнгүй</label>
                                <textarea rows="4" placeholder="Асуудлаа дэлгэрэнгүй бичнэ үү..." className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none resize-none"></textarea>
                            </div>
                            <button onClick={() => { alert('Таны асуулт нийтлэгдлээ!'); setIsAsking(false); }} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700">Нийтлэх</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CartDrawer = ({ cart, isOpen, onClose, onCheckout }) => {
    const [district, setDistrict] = useState('');
    
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
                             <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                                    <span>Хүргэлт</span>
                                    <span className="font-bold">{formatCurrency(delivery.total)}</span>
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

// --- HELPER COMPONENTS (outside render) ---
const CostBar = ({ label, cost, total, color }) => {
    const pct = total > 0 ? Math.round((cost / total) * 100) : 0;
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-bold">{pct}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="text-right text-[10px] text-slate-500 mt-0.5">{formatCurrency(cost)}</div>
        </div>
    );
};

const CategoryBadge = ({ cat }) => {
    const colors = {
        'Суурь': 'bg-purple-900/60 text-purple-300',
        'Карказ': 'bg-blue-900/60 text-blue-300',
        'Дотор засал': 'bg-green-900/60 text-green-300',
    };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[cat] || 'bg-slate-700 text-slate-300'}`}>{cat}</span>;
};

// --- VISUAL BUILDER VIEW (Professional Enhanced) ---
const VisualBuilderView = ({ onBack, template }) => {
    const [dims, setDims] = useState(template?.dims || { l: 8, w: 6 });
    const [floors, setFloors] = useState(template?.floors || 1);
    const [windows, setWindows] = useState(4);
    const [doors, setDoors] = useState(2);
    const [includeLaborCost, setIncludeLaborCost] = useState(true);
    const [config, setConfig] = useState({ foundation: 'strip', wall: 'block', roof: 'gable', floorType: 'none', wallFinish: 'none' });
    const [activeTab, setActiveTab] = useState('structure');

    // Real-time calculation with useMemo (no setState in effect)
    const result = useMemo(() => {
        if (dims.l > 0 && dims.w > 0 && floors > 0) {
            const res = CALC_ENGINE.calculateProject(dims, floors, config);
            const openingArea = (windows * 1.5) + (doors * 2.0);
            const laborCost = includeLaborCost ? Math.round(res.totalCost * 0.35) : 0;
            return { ...res, openingArea, laborCost, grandTotal: res.totalCost + laborCost };
        }
        return null;
    }, [dims, floors, config, windows, doors, includeLaborCost]);

    const handlePrint = () => window.print();

    const TABS = [
        { id: 'structure', label: 'Карказ', icon: <BrickWall size={16}/> },
        { id: 'interior', label: 'Дотор', icon: <PaintBucket size={16}/> },
        { id: 'openings', label: 'Нээлхий', icon: <DoorOpen size={16}/> },
    ];

    const structureCost = result ? result.details.filter(d => d.category === 'Карказ' || d.category === 'Суурь').reduce((s, d) => s + d.price, 0) : 0;
    const interiorCost = result ? result.details.filter(d => d.category === 'Дотор засал').reduce((s, d) => s + d.price, 0) : 0;

    return (
        <div className="animate-in fade-in py-8">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-lg border hover:bg-slate-50 dark:border-slate-700 dark:text-white"><ArrowLeft size={20}/></button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Барилгын төлөвлөгч</h2>
                        <p className="text-xs text-slate-500">Бодит цагийн автомат тооцоо</p>
                    </div>
                </div>
                {result && (
                    <button onClick={handlePrint} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                        <Printer size={16}/> Хэвлэх
                    </button>
                )}
            </div>

            {/* Dimensions Row */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Ruler size={14} className="text-orange-600"/> Барилгын хэмжээ</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Урт (м)', val: dims.l, set: v => setDims({...dims, l: v}), min: 1 },
                        { label: 'Өргөн (м)', val: dims.w, set: v => setDims({...dims, w: v}), min: 1 },
                        { label: 'Давхар', val: floors, set: v => setFloors(Math.max(1, v)), min: 1 },
                        { label: 'Хана өндөр (м)', val: 2.8, set: () => {}, min: 2, disabled: true },
                    ].map((f, i) => (
                        <div key={i}>
                            <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
                            <input type="number" min={f.min} disabled={f.disabled}
                                value={f.val}
                                onChange={e => f.set(parseFloat(e.target.value) || 0)}
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:border-orange-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-6 text-xs text-slate-500">
                    <span>Талбай: <strong className="text-slate-900 dark:text-white">{(dims.l * dims.w * floors).toFixed(1)} м²</strong></span>
                    <span>Периметр: <strong className="text-slate-900 dark:text-white">{((dims.l + dims.w) * 2).toFixed(1)} м</strong></span>
                    <span>Хана: <strong className="text-slate-900 dark:text-white">{((dims.l + dims.w) * 2 * 2.8 * floors * 0.85).toFixed(1)} м²</strong></span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Config Panel */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Tab Switch */}
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB: Карказ */}
                    {activeTab === 'structure' && (
                        <div className="space-y-5">
                            {/* Foundation */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                                    <Layers size={16} className="text-purple-600"/> 1. Суурийн төрөл
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {FOUNDATION_TYPES.map(f => (
                                        <button key={f.id} onClick={() => setConfig({...config, foundation: f.id})}
                                            className={`p-3 rounded-xl border text-left transition-all ${config.foundation === f.id ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'}`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">{f.icon}<span className="text-xs font-bold">{f.name}</span></div>
                                            <div className={`text-[10px] leading-tight ${config.foundation === f.id ? 'text-purple-100' : 'text-slate-400'}`}>{f.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Wall */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                                    <BrickWall size={16} className="text-orange-600"/> 2. Хананы материал
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {WALL_TYPES.map(wall => (
                                        <button key={wall.id} onClick={() => setConfig({...config, wall: wall.id})}
                                            className={`p-3 rounded-xl border text-left transition-all ${config.wall === wall.id ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-100 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                                        >
                                            <div className="text-xs font-bold mb-0.5">{wall.name}</div>
                                            <div className={`text-[10px] ${config.wall === wall.id ? 'text-orange-100' : 'text-slate-400'}`}>{wall.desc}</div>
                                            <div className={`text-[10px] font-bold mt-1 ${config.wall === wall.id ? 'text-orange-200' : 'text-orange-600'}`}>{formatCurrency(wall.price)}/{wall.unit}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Roof */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                                <h3 className="font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                                    <Home size={16} className="text-blue-600"/> 3. Дээврийн төрөл
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {ROOF_TYPES.map(roof => (
                                        <button key={roof.id} onClick={() => setConfig({...config, roof: roof.id})}
                                            className={`p-3 rounded-xl border text-left transition-all ${config.roof === roof.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                                        >
                                            <div className="text-xs font-bold mb-0.5">{roof.name}</div>
                                            <div className={`text-[10px] leading-tight ${config.roof === roof.id ? 'text-blue-100' : 'text-slate-400'}`}>{roof.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Дотор засал */}
                    {activeTab === 'interior' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                                    <Square size={16} className="text-green-600"/> Шалны материал
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'none', label: 'Тооцохгүй', sub: '—' },
                                        { id: 'parquet', label: 'Паркет', sub: formatCurrency(45000) + '/м²' },
                                        { id: 'tile', label: 'Плита', sub: formatCurrency(35000) + '/м²' },
                                    ].map(t => (
                                        <button key={t.id} onClick={() => setConfig({...config, floorType: t.id})}
                                            className={`p-3 rounded-xl border text-center transition-all ${config.floorType === t.id ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-green-300'}`}
                                        >
                                            <div className="text-xs font-bold">{t.label}</div>
                                            <div className={`text-[10px] mt-0.5 ${config.floorType === t.id ? 'text-green-100' : 'text-slate-400'}`}>{t.sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                                    <PaintBucket size={16} className="text-pink-600"/> Хана өнгөлгөө
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'none', label: 'Тооцохгүй', sub: '—' },
                                        { id: 'paint', label: 'Будаг', sub: formatCurrency(18000) + '/л' },
                                        { id: 'wallpaper', label: 'Обой', sub: formatCurrency(65000) + '/рул' },
                                    ].map(t => (
                                        <button key={t.id} onClick={() => setConfig({...config, wallFinish: t.id})}
                                            className={`p-3 rounded-xl border text-center transition-all ${config.wallFinish === t.id ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-300'}`}
                                        >
                                            <div className="text-xs font-bold">{t.label}</div>
                                            <div className={`text-[10px] mt-0.5 ${config.wallFinish === t.id ? 'text-pink-100' : 'text-slate-400'}`}>{t.sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={includeLaborCost} onChange={e => setIncludeLaborCost(e.target.checked)} className="accent-orange-600 w-4 h-4" />
                                    <div>
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">Ажлын хөлс нэмэх (35%)</div>
                                        <div className="text-xs text-slate-500">Монголын барилгын ажлын зах зээлийн дундаж норм</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB: Нээлхий */}
                    {activeTab === 'openings' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
                            <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">Цонх болон хаалганы тоо хана тооцооноос хасагдана (1.5м² / 2.0м² тутамд).</p>
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-2"><Maximize size={16} className="text-sky-500"/> Цонхны тоо</label>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setWindows(Math.max(0, windows-1))} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors">−</button>
                                    <span className="text-2xl font-black w-8 text-center text-slate-900 dark:text-white">{windows}</span>
                                    <button onClick={() => setWindows(windows+1)} className="w-10 h-10 bg-orange-600 rounded-xl font-bold text-lg text-white hover:bg-orange-700 transition-colors">+</button>
                                    <span className="text-xs text-slate-400">× 1.5 м² = {(windows * 1.5).toFixed(1)} м² хасагдана</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-2"><DoorOpen size={16} className="text-amber-500"/> Хаалганы тоо</label>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setDoors(Math.max(0, doors-1))} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors">−</button>
                                    <span className="text-2xl font-black w-8 text-center text-slate-900 dark:text-white">{doors}</span>
                                    <button onClick={() => setDoors(doors+1)} className="w-10 h-10 bg-orange-600 rounded-xl font-bold text-lg text-white hover:bg-orange-700 transition-colors">+</button>
                                    <span className="text-xs text-slate-400">× 2.0 м² = {(doors * 2.0).toFixed(1)} м² хасагдана</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400">
                                <strong>Нийт нээлхий:</strong> {((windows * 1.5) + (doors * 2.0)).toFixed(1)} м² → хана тооцооноос хасагдана
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Result Panel */}
                <div className="lg:col-span-2">
                    {result ? (
                        <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 overflow-hidden sticky top-24">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Урьдчилсан төсөв</span>
                                    <span className="text-[10px] text-slate-500">{new Date().toLocaleDateString('mn-MN')}</span>
                                </div>
                                <div className="text-3xl font-black text-white">{formatCurrency(result.grandTotal)}</div>
                                <p className="text-slate-500 text-[10px] mt-1">
                                    {dims.l}×{dims.w}м, {floors} давхар
                                    {includeLaborCost ? ' · Ажлын хөлс орсон' : ' · Зөвхөн материал'}
                                </p>
                            </div>

                            {/* Cost Breakdown Bars */}
                            <div className="p-5 border-b border-slate-800">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Зардлын бүтэц</h4>
                                <CostBar label="Карказ / Суурь" cost={structureCost} total={result.grandTotal} color="bg-blue-500" />
                                {interiorCost > 0 && <CostBar label="Дотор засал" cost={interiorCost} total={result.grandTotal} color="bg-green-500" />}
                                {result.laborCost > 0 && <CostBar label="Ажлын хөлс (35%)" cost={result.laborCost} total={result.grandTotal} color="bg-amber-500" />}
                            </div>

                            {/* Material Lines */}
                            <div className="p-5 max-h-64 overflow-y-auto border-b border-slate-800 space-y-3">
                                {result.details.map((d, i) => (
                                    <div key={i} className="flex justify-between items-start text-sm">
                                        <div className="flex-1 pr-3">
                                            <CategoryBadge cat={d.category} />
                                            <div className="text-white font-semibold text-xs mt-1 leading-tight">{d.material}</div>
                                            {d.note && <div className="text-[10px] text-orange-400">{d.note}</div>}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-white text-xs font-bold">{d.qty.toLocaleString()} {d.unit}</div>
                                            <div className="text-slate-400 text-[10px]">{formatCurrency(d.price)}</div>
                                        </div>
                                    </div>
                                ))}
                                {result.laborCost > 0 && (
                                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                                        <div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300">Ажлын хөлс</span>
                                            <div className="text-white font-semibold text-xs mt-1">Угсралт, барилгын ажил</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-amber-400 text-xs font-bold">35%</div>
                                            <div className="text-slate-400 text-[10px]">{formatCurrency(result.laborCost)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Total + CTA */}
                            <div className="p-5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Нийт дүн</span>
                                    <span className="text-xl font-black text-white">{formatCurrency(result.grandTotal)}</span>
                                </div>
                                <button className="w-full py-3 bg-orange-600 rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm">
                                    <FileText size={16}/> Үнийн санал авах (RFQ)
                                </button>
                                <button onClick={handlePrint} className="w-full py-2.5 bg-slate-800 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-xs text-slate-300">
                                    <Printer size={14}/> Хэвлэх / PDF хадгалах
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
                            <Calculator size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 text-sm">Хэмжээ оруулах үед автоматаар тооцоолно</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- RFQ MANAGER (Restored) ---
const RFQManager = ({ rfqs, onBack }) => (
    <div className="animate-in fade-in py-8">
         <div className="flex items-center gap-4 mb-6">
                 <button onClick={onBack} className="p-2 bg-white rounded-lg border hover:bg-slate-50"><ArrowLeft size={20}/></button>
                 <h2 className="text-2xl font-bold">Таны үнийн саналууд</h2>
         </div>
         
         {rfqs.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
                 <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                 <p className="text-slate-500">Одоогоор үнийн санал алга байна.</p>
             </div>
         ) : (
             <div className="space-y-4">
                 {rfqs.map(rfq => (
                     <div key={rfq.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                         <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h3 className="font-bold text-lg">RFQ #{rfq.id}</h3>
                                 <p className="text-slate-500 text-sm">{new Date(rfq.date).toLocaleDateString()}</p>
                             </div>
                             <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Хүлээгдэж буй</span>
                         </div>
                         <div className="space-y-2">
                             {rfq.items.map((item, idx) => (
                                 <div key={idx} className="flex justify-between text-sm">
                                     <span>{item.material}</span>
                                     <span className="text-slate-500">{item.qty} {item.unit}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
         )}
    </div>
);

// --- DETAILED ESTIMATOR (Full Professional Version) ---
const Estimator = ({ onBack }) => {
    const SECTIONS = [
        { id: 'concrete', label: 'Бетон / Суурь', icon: <Layers size={18}/>, color: 'purple' },
        { id: 'masonry', label: 'Тоосго / Блок', icon: <BrickWall size={18}/>, color: 'orange' },
        { id: 'roof', label: 'Дээвэр', icon: <Home size={18}/>, color: 'blue' },
        { id: 'floor', label: 'Шал', icon: <Square size={18}/>, color: 'green' },
        { id: 'wall_finish', label: 'Хана өнгөлгөө', icon: <PaintBucket size={18}/>, color: 'pink' },
        { id: 'plumbing', label: 'Сантехник', icon: <Droplets size={18}/>, color: 'cyan' },
        { id: 'electric', label: 'Цахилгаан', icon: <Zap size={18}/>, color: 'yellow' },
    ];

    const ITEMS = {
        concrete: [
            { id: 'c1', name: 'М200 Бетон', unit: 'м³', price: 220000, desc: 'Суурь, хавтан' },
            { id: 'c2', name: 'М300 Бетон', unit: 'м³', price: 280000, desc: 'Дамнуурга, багана' },
            { id: 'c3', name: 'Цемент (шуудай)', unit: 'шуудай', price: 24000, desc: '50кг, Портланд М400' },
            { id: 'c4', name: 'Элс (шигшсэн)', unit: 'тн', price: 25000, desc: 'Карьерын' },
            { id: 'c5', name: 'Хайрга', unit: 'тн', price: 28000, desc: '5-20мм фракц' },
            { id: 'c6', name: 'Арматур Ф12', unit: 'тн', price: 2100000, desc: 'A500C' },
            { id: 'c7', name: 'Арматур Ф10', unit: 'тн', price: 2080000, desc: 'A500C' },
            { id: 'c8', name: 'Тор арматур', unit: 'м²', price: 8500, desc: '150×150 Ф6' },
        ],
        masonry: [
            { id: 'm1', name: 'Хөнгөн блок', unit: 'ш', price: 4200, desc: '60×30×20см' },
            { id: 'm2', name: 'МАК Евро блок', unit: 'ш', price: 11500, desc: '60×40×25см' },
            { id: 'm3', name: 'Улаан тоосго', unit: 'ш', price: 680, desc: 'Стандарт M150' },
            { id: 'm4', name: 'Хийц зуурмаг', unit: 'уут', price: 6500, desc: '25кг, M100' },
            { id: 'm5', name: 'Дулаалгын блок EPS', unit: 'м²', price: 12000, desc: '10см зузаан' },
        ],
        roof: [
            { id: 'r1', name: 'Металл профиль', unit: 'м²', price: 22000, desc: '0.35мм' },
            { id: 'r2', name: 'Ондулин', unit: 'хавтан', price: 18000, desc: '3×1м' },
            { id: 'r3', name: 'Шиферт', unit: 'м²', price: 28000, desc: '2-давхар' },
            { id: 'r4', name: 'Мягк черепица', unit: 'м²', price: 45000, desc: 'Tegola' },
            { id: 'r5', name: 'Модон дам нуруу', unit: 'м³', price: 650000, desc: 'Нарс' },
            { id: 'r6', name: 'ОСП хавтан', unit: 'хавтан', price: 65000, desc: '18мм, 1.25×2.5м' },
        ],
        floor: [
            { id: 'f1', name: 'Евро паркет', unit: 'м²', price: 45000, desc: '8мм, AC4' },
            { id: 'f2', name: 'Ламинат', unit: 'м²', price: 28000, desc: '12мм' },
            { id: 'f3', name: 'Плита 60×60', unit: 'м²', price: 35000, desc: 'Гладкий' },
            { id: 'f4', name: 'Плита 30×30', unit: 'м²', price: 28000, desc: 'Ванны өрөө' },
            { id: 'f5', name: 'Хальс (подложка)', unit: 'м²', price: 4000, desc: '3мм' },
            { id: 'f6', name: 'Бетон хаяа', unit: 'м²', price: 8000, desc: 'М150 нивелир' },
        ],
        wall_finish: [
            { id: 'w1', name: 'Dulux будаг', unit: 'л', price: 8500, desc: 'Эмульс' },
            { id: 'w2', name: 'Солонгос обой', unit: 'рулон', price: 55000, desc: '1.06×10м' },
            { id: 'w3', name: 'Гипскартон', unit: 'хавтан', price: 14500, desc: '12.5мм' },
            { id: 'w4', name: 'Шпатлевка', unit: 'уут', price: 18000, desc: '20кг' },
            { id: 'w5', name: 'Грунт', unit: 'л', price: 4500, desc: 'Глубокого пр.' },
            { id: 'w6', name: 'Цагаан цемент', unit: 'уут', price: 12000, desc: '25кг' },
        ],
        plumbing: [
            { id: 'p1', name: 'PPR хоолой Ф20', unit: 'м', price: 2500, desc: 'Халуун/хүйтэн ус' },
            { id: 'p2', name: 'PPR хоолой Ф25', unit: 'м', price: 3200, desc: '' },
            { id: 'p3', name: 'Ванн', unit: 'ш', price: 350000, desc: 'Стандарт 150см' },
            { id: 'p4', name: 'Ариун цэврийн өрөөний иж', unit: 'иж', price: 180000, desc: 'WC+умывалник' },
            { id: 'p5', name: 'Халуун усны бойлер', unit: 'ш', price: 450000, desc: '80л' },
            { id: 'p6', name: 'Радиатор (хэсэг)', unit: 'хэсэг', price: 35000, desc: 'Биметалл' },
        ],
        electric: [
            { id: 'e1', name: 'Зэс кабель 2.5мм', unit: 'м', price: 1800, desc: 'ВВГ 3×2.5' },
            { id: 'e2', name: 'Зэс кабель 1.5мм', unit: 'м', price: 1200, desc: 'Гэрэлтүүлэг' },
            { id: 'e3', name: 'Автомат 16А', unit: 'ш', price: 18000, desc: 'ABB' },
            { id: 'e4', name: 'Розетка (Legrand)', unit: 'ш', price: 12000, desc: 'Хамгаалалттай' },
            { id: 'e5', name: 'Унтраалга', unit: 'ш', price: 8000, desc: 'Нэг товч' },
            { id: 'e6', name: 'Тарилгын самбар', unit: 'ш', price: 85000, desc: '12 автомат' },
            { id: 'e7', name: 'LED гэрэл', unit: 'ш', price: 25000, desc: '12W' },
        ],
    };

    const [activeSection, setActiveSection] = useState('concrete');
    const [quantities, setQuantities] = useState({});
    const [includeLaborPct, setIncludeLaborPct] = useState(35);
    const [includeLabor, setIncludeLabor] = useState(true);
    const [projectName, setProjectName] = useState('Миний Төсөл');

    const setQty = (itemId, val) => {
        const v = parseFloat(val) || 0;
        setQuantities(prev => ({ ...prev, [itemId]: v }));
    };

    const allItems = Object.values(ITEMS).flat();
    const usedItems = allItems.filter(item => (quantities[item.id] || 0) > 0);
    const materialTotal = usedItems.reduce((sum, item) => sum + (quantities[item.id] * item.price), 0);
    const laborTotal = includeLabor ? Math.round(materialTotal * (includeLaborPct / 100)) : 0;
    const grandTotal = materialTotal + laborTotal;

    const sectionTotal = (sectionId) => {
        return (ITEMS[sectionId] || []).reduce((sum, item) => sum + ((quantities[item.id] || 0) * item.price), 0);
    };

    const colorMap = {
        purple: 'bg-purple-600', orange: 'bg-orange-600', blue: 'bg-blue-600',
        green: 'bg-green-600', pink: 'bg-pink-600', cyan: 'bg-cyan-600', yellow: 'bg-yellow-500'
    };
    return (
        <div className="animate-in fade-in zoom-in-95 max-w-7xl mx-auto py-8 px-2 sm:px-0">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:text-white transition-colors"><ArrowLeft size={20}/></button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Нарийвчилсан тооцоолуур</h2>
                        <p className="text-xs text-slate-500">Хийц тус бүрээр, материал нэг бүрээр</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        value={projectName} 
                        onChange={e => setProjectName(e.target.value)}
                        className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-orange-500 outline-none"
                        placeholder="Төслийн нэр"
                    />
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                        <Printer size={16}/> Хэвлэх
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Section + Items */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Section Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {SECTIONS.map(sec => {
                            const secTotal = sectionTotal(sec.id);
                            const isActive = activeSection === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    onClick={() => setActiveSection(sec.id)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${isActive ? `${colorMap[sec.color]} text-white border-transparent shadow-lg` : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
                                >
                                    {sec.icon}
                                    <span>{sec.label}</span>
                                    {secTotal > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-orange-100 text-orange-700'}`}>{Math.round(secTotal/1000000*10)/10}M</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Item Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className={`px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center`}>
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {SECTIONS.find(s => s.id === activeSection)?.icon}
                                {SECTIONS.find(s => s.id === activeSection)?.label}
                            </h3>
                            {sectionTotal(activeSection) > 0 && (
                                <span className="text-sm font-bold text-orange-600">{formatCurrency(sectionTotal(activeSection))}</span>
                            )}
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(ITEMS[activeSection] || []).map(item => {
                                const qty = quantities[item.id] || 0;
                                const total = qty * item.price;
                                return (
                                    <div key={item.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${qty > 0 ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</div>
                                            <div className="text-xs text-slate-400">{item.desc} · {formatCurrency(item.price)}/{item.unit}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setQty(item.id, Math.max(0, qty - 1))} className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 text-sm font-bold transition-colors">−</button>
                                            <input
                                                type="number"
                                                min="0"
                                                value={qty || ''}
                                                placeholder="0"
                                                onChange={e => setQty(item.id, e.target.value)}
                                                className="w-20 text-center p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:border-orange-500 outline-none"
                                            />
                                            <span className="text-xs text-slate-400 w-10">{item.unit}</span>
                                            <button onClick={() => setQty(item.id, qty + 1)} className="w-7 h-7 bg-orange-600 rounded-lg text-white hover:bg-orange-700 text-sm font-bold transition-colors">+</button>
                                        </div>
                                        <div className="w-28 text-right">
                                            <span className={`text-sm font-bold ${total > 0 ? 'text-orange-600' : 'text-slate-300 dark:text-slate-700'}`}>
                                                {total > 0 ? formatCurrency(total) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="space-y-4">
                    {/* Total Card */}
                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-slate-700">
                        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">{projectName}</div>
                        <div className="text-3xl font-black mb-1">{formatCurrency(grandTotal)}</div>
                        <div className="text-slate-500 text-xs mb-5">Нийт өртөг</div>
                        
                        {/* Section Breakdown */}
                        <div className="space-y-2 mb-5">
                            {SECTIONS.map(sec => {
                                const st = sectionTotal(sec.id);
                                if (st === 0) return null;
                                const pct = grandTotal > 0 ? Math.round((st / grandTotal) * 100) : 0;
                                return (
                                    <div key={sec.id}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400 flex items-center gap-1">{sec.icon}{sec.label}</span>
                                            <span className="text-white font-bold">{formatCurrency(st)}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full">
                                            <div className={`h-full rounded-full ${colorMap[sec.color]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {laborTotal > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400 flex items-center gap-1"><Hammer size={14}/>Ажлын хөлс</span>
                                        <span className="text-amber-400 font-bold">{formatCurrency(laborTotal)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full">
                                        <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${grandTotal > 0 ? Math.round(laborTotal/grandTotal*100) : 0}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Labor toggle */}
                        <div className="border-t border-slate-800 pt-4 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={includeLabor} onChange={e => setIncludeLabor(e.target.checked)} className="accent-orange-600 w-4 h-4" />
                                <span className="text-sm font-bold">Ажлын хөлс нэмэх</span>
                            </label>
                            {includeLabor && (
                                <div>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Материалын % хувь</span>
                                        <span className="font-bold text-amber-400">{includeLaborPct}%</span>
                                    </div>
                                    <input type="range" min="15" max="60" step="5" value={includeLaborPct}
                                        onChange={e => setIncludeLaborPct(parseInt(e.target.value))}
                                        className="w-full accent-orange-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-600 mt-0.5"><span>15% (энгийн)</span><span>60% (нарийн)</span></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Used items list */}
                    {usedItems.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Сонгогдсон материал</h3>
                                <span className="text-xs text-slate-400">{usedItems.length} зүйл</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                                {usedItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center px-4 py-2.5 text-sm">
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white text-xs">{item.name}</div>
                                            <div className="text-[10px] text-slate-400">{quantities[item.id]} {item.unit}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-orange-600 font-bold text-xs">{formatCurrency(quantities[item.id] * item.price)}</span>
                                            <button onClick={() => setQty(item.id, 0)} className="w-5 h-5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded text-xs hover:bg-red-200 transition-colors">×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Материал нийт</span>
                                <span className="font-black text-orange-600">{formatCurrency(materialTotal)}</span>
                            </div>
                        </div>
                    )}

                    {usedItems.length === 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                            <Calculator size={36} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 text-sm">Материалын тоо хэмжээг оруулснаар нийт өртөг автоматаар тооцогдоно</p>
                        </div>
                    )}

                    {usedItems.length > 0 && (
                        <button className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                            <FileText size={18}/> Үнийн санал авах (RFQ)
                        </button>
                    )}
                </div>
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
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none grayscale">
                <img src="logo.png" alt="Background" className="w-64 h-64 object-contain" />
            </div>
        </div>
        
        <div className="px-2 mb-10">
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Түгээмэл</h2>
                <button onClick={() => onNavigate('advice')} className="text-orange-600 text-xs font-bold hover:underline">Бүгдийг харах</button>
            </div>
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

        {/* Advice Shortcut Card */}
        <div className="px-2 mb-10">
            <div onClick={() => onNavigate('advice')} className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><HelpCircle size={20}/> Зөвлөгөө авах уу?</h3>
                        <p className="text-indigo-200 text-xs max-w-xs">Мэргэжлийн инженерүүд болон туршлагатай хэрэглэгчдээс асуугаарай.</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                        <ArrowRight size={20} />
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <MessageSquare size={120} />
                </div>
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
    const [selectedCat, setSelectedCat] = useState(null); 
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [userRole, setUserRole] = useState('user'); // 'user', 'seller'
    const [isSellerLoggedIn, setIsSellerLoggedIn] = useState(false);
    const [rfqs] = useState([]); // populated via API in future
    const [initialTemplate, setInitialTemplate] = useState(null);

    const [allProducts, setAllProducts] = useState(Object.values(INITIAL_SUPPLIERS).flat());

    // Auth Init
    useEffect(() => {
        const initAuth = async () => {
            // eslint-disable-next-line no-undef
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                // Handle custom token if needed
            } else {
                if (auth) await signInAnonymously(auth);
            }
        };
        initAuth();
    }, []);

    const toggleDarkMode = () => setDarkMode(!darkMode);
    const handleAddToCart = (item, qty, unit) => { setCart([...cart, { ...item, quantity: qty, unit }]); setIsCartOpen(true); };
    const handleRemoveFromCart = (index) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };

    const handleStartTemplate = (tpl) => { 
        setInitialTemplate(tpl); 
        setView('builder'); 
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
                        // SELLER DASHBOARD VIEW
                        isSellerLoggedIn ? 
                        <SellerDashboard allProducts={allProducts} setAllProducts={setAllProducts} rfqs={rfqs} /> 
                        : 
                        <SellerLogin onLogin={handleSellerLogin} />
                    ) : (
                        // USER VIEWS
                        <>
                            {view === 'home' && <HomeView onNavigate={handleNav} onSelectCategory={(id) => { setSelectedCat(id); setView('category'); }} onStartTemplate={handleStartTemplate} />}
                            {view === 'builder' && <VisualBuilderView onBack={() => setView('home')} template={initialTemplate} />}
                            {view === 'advice' && <AdviceForumView onBack={() => setView('home')} />}
                            {view === 'rfq' && <RFQManager rfqs={rfqs} onBack={() => setView('home')} />}
                            {view === 'category' && <CategoryDetail categoryId={selectedCat} groupId={selectedCat} onBack={() => setView('home')} onAddToCart={handleAddToCart} allProducts={allProducts} />}
                            
                            {view === 'services' && <ServicesDashboard onNavigate={setView} />}
                            {view === 'china' && <ChinaImportScreen onBack={() => handleNav('services')} />}
                            {view === 'rental' && <RentalScreen onBack={() => handleNav('services')} />}
                            {view === 'estimator' && <BuildEstimator onBack={() => setView('home')} />}
                        </>
                    )}
                </main>

                <Footer />
                <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onRemoveItem={handleRemoveFromCart} onCheckout={handleCheckout} />
            </div>
        </div>
    );
}