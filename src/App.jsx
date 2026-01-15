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
  Zap, Droplets, Construction, Move3d, Map, User, LogOut, Store, BarChart3, ListOrdered, Plus, Wallet
} from 'lucide-react';
import { Layers as AlignVerticalJustifyStart } from 'lucide-react';

// ==========================================
// I & II. DATABASE SCHEMA (MOCK DATA)
// ==========================================

// 1. Users & Vendors
const USERS = {
  currentUser: { id: 'u1', name: 'Бат', role: 'user', phone: '99112233' },
  currentSeller: { id: 'u2', name: 'Дорж', role: 'seller', vendorId: 'v1' }
};

const VENDORS = [
  { id: 'v1', name: 'Төмөр Трейд', market: '100 айл', location: { district: 'СБД' }, rating: 4.8, verified: true, delivery: { enabled: true, priceKm: 1500 } },
  { id: 'v2', name: 'Барилга МН', market: 'Гурвалжин', location: { district: 'БГД' }, rating: 4.5, verified: true, delivery: { enabled: true, priceKm: 1500 } },
  { id: 'v3', name: 'Налайх Тоосго', market: 'Налайх', location: { district: 'НД' }, rating: 4.2, verified: true, delivery: { enabled: false, priceKm: 0 } },
];

// 2. Categories mapping
const CATEGORIES = {
  structure: { label: 'Дүүргэгч', icon: <BrickWall size={20}/> },
  metal: { label: 'Төмөр хийц', icon: <Hammer size={20}/> },
  wood: { label: 'Мод', icon: <Ruler size={20}/> },
  plumbing: { label: 'Сантехник', icon: <Droplets size={20}/> },
  electric: { label: 'Цахилгаан', icon: <Zap size={20}/> },
  finishing: { label: 'Засал', icon: <PaintBucket size={20}/> },
};

// 3. Products (Normalized)
const PRODUCTS = [
  // Structure
  { id: 'p1', vendorId: 'v1', category: 'structure', type: 'cement', name: 'МАК Цемент М400', unit: 'шуудай', price: 24000, stock: 500, image: 'https://placehold.co/150x150/e2e8f0/64748b?text=Cement' },
  { id: 'p2', vendorId: 'v2', category: 'structure', type: 'cement', name: 'Хөтөл Цемент М300', unit: 'шуудай', price: 23500, stock: 200, image: 'https://placehold.co/150x150/e2e8f0/64748b?text=Cement' },
  { id: 'p3', vendorId: 'v3', category: 'structure', type: 'brick', name: 'Улаан тоосго', unit: 'ш', price: 650, stock: 10000, image: 'https://placehold.co/150x150/ef4444/fee2e2?text=Brick' },
  { id: 'p4', vendorId: 'v2', category: 'structure', type: 'block', name: 'Хөнгөн блок 60x30x20', unit: 'ш', price: 3500, stock: 2000, image: 'https://placehold.co/150x150/d1d5db/64748b?text=Block' },
  
  // Metal
  { id: 'p5', vendorId: 'v1', category: 'metal', type: 'rebar', name: 'Арматур Ф12', unit: 'тн', price: 2600000, stock: 50, image: 'https://placehold.co/150x150/334155/64748b?text=Rebar' },
  { id: 'p6', vendorId: 'v2', category: 'metal', type: 'roof', name: 'Төмөр дээвэр (0.35)', unit: 'м²', price: 22000, stock: 500, image: 'https://placehold.co/150x150/94a3b8/1e293b?text=Roof' },
  
  // Finishing
  { id: 'p7', vendorId: 'v1', category: 'finishing', type: 'paint', name: 'Dulux Эмульс', unit: 'ш', price: 125000, stock: 30, image: 'https://placehold.co/150x150/dcfce7/16a34a?text=Paint' },
];

// 4. Material Norms (Calculator Heart)
const MATERIAL_NORMS = {
  block: { unit: 'ш', perM2: 12.5, waste: 1.08, productId: 'p4' }, // 8% waste included
  brick: { unit: 'ш', perM2: 52, waste: 1.05, productId: 'p3' },
  cement: { unit: 'кг', perM3: 350, waste: 1.02, productId: 'p1' }, // For concrete
  roof_sheet: { unit: 'м²', waste: 1.15, productId: 'p6' }, // 15% overlap
  rebar: { unit: 'кг', perM3: 60, waste: 1.05, productId: 'p5' },
};

const formatCurrency = (amount) => new Intl.NumberFormat('mn-MN', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ₮';

// ==========================================
// III. CALCULATOR ENGINE
// ==========================================
const calcEngine = {
  // Ханын тооцоо
  calculateWall: (perimeter, height, floors, type = 'block') => {
    const wallArea = perimeter * height * floors;
    const norm = MATERIAL_NORMS[type];
    const qty = Math.ceil(wallArea * norm.perM2 * norm.waste);
    return { material: type, qty, unit: norm.unit, productId: norm.productId };
  },

  // Суурийн тооцоо
  calculateFoundation: (l, w, h, t) => {
    const perimeter = (l + w) * 2;
    const volume = perimeter * t * h;
    const cementKg = Math.ceil(volume * MATERIAL_NORMS.cement.perM3 * MATERIAL_NORMS.cement.waste);
    const cementBags = Math.ceil(cementKg / 50); // 50kg bags
    
    return { material: 'cement', qty: cementBags, unit: 'шуудай', productId: MATERIAL_NORMS.cement.productId };
  },

  // Дээврийн тооцоо
  calculateRoof: (l, w) => {
    const area = l * w * 1.3; // Pitch factor
    const qty = Math.ceil(area * MATERIAL_NORMS.roof_sheet.waste);
    return { material: 'roof_sheet', qty, unit: 'м²', productId: MATERIAL_NORMS.roof_sheet.productId };
  }
};

// ==========================================
// UI COMPONENTS
// ==========================================

const Header = ({ cartCount, onNavigate, userRole, setUserRole, darkMode, toggleDarkMode }) => (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white flex items-center justify-center border border-slate-100">
                     <img src="/logo.png" alt="Hutuch" className="w-full h-full object-contain" onError={(e) => {e.target.style.display = 'none'; e.target.parentElement.innerHTML = '🏗️';}} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Hutuch</span>
                    <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wide">{userRole === 'seller' ? 'Merchant' : 'Smart Build'}</span>
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                 {userRole === 'user' ? (
                     <>
                        <button onClick={() => onNavigate('home')} className="px-4 py-1.5 text-sm font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all">Нүүр</button>
                        <button onClick={() => onNavigate('builder')} className="px-4 py-1.5 text-sm font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all">Визуал</button>
                        <button onClick={() => onNavigate('estimator')} className="px-4 py-1.5 text-sm font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all">Төсөв</button>
                     </>
                 ) : (
                    <span className="px-4 py-1.5 text-sm font-bold text-orange-600">Лангууны удирдлага</span>
                 )}
            </nav>

            <div className="flex items-center gap-3">
                <button onClick={() => setUserRole(userRole === 'user' ? 'seller' : 'user')} className={`p-2 rounded-lg text-xs font-bold border flex items-center gap-2 ${userRole === 'seller' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200'}`}>
                    {userRole === 'user' ? <User size={16}/> : <Store size={16}/>}
                    <span className="hidden sm:inline">{userRole === 'user' ? 'Хэрэглэгч' : 'Лангуу'}</span>
                </button>
                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {darkMode ? <Sun size={20} className="text-yellow-500"/> : <Moon size={20} className="text-slate-600"/>}
                </button>
                {userRole === 'user' && (
                    <div className="relative p-2">
                        <ShoppingBag size={22} className="text-slate-700 dark:text-slate-300" />
                        {cartCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{cartCount}</span>}
                    </div>
                )}
            </div>
        </div>
    </header>
);

// V. SELLER DASHBOARD (MOBILE FIRST)
const SellerDashboard = () => {
    const [products, setProducts] = useState(PRODUCTS.filter(p => p.vendorId === 'v1')); // Mock logged in as v1
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: 'ш' });

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.price) return;
        const product = {
            id: Date.now(),
            vendorId: 'v1',
            category: 'structure',
            ...newProduct,
            price: parseFloat(newProduct.price),
            stock: 0,
            image: 'https://placehold.co/150x150/orange/white?text=New'
        };
        setProducts([product, ...products]);
        setIsAdding(false);
        setNewProduct({ name: '', price: '', unit: 'ш' });
    };

    return (
        <div className="pb-24 animate-in fade-in">
            {/* 1. Header Stats */}
            <div className="bg-slate-900 text-white p-6 rounded-b-3xl mb-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Төмөр Трейд</h2>
                        <div className="flex items-center gap-1 text-slate-400 text-sm"><MapPin size={14}/> 100 айл, 2-р эгнээ</div>
                    </div>
                    <div className="bg-orange-500 p-2 rounded-xl"><Store size={24}/></div>
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
                {/* 2. Quick Actions */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Миний бараа ({products.length})</h3>
                    <button onClick={() => setIsAdding(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/30">
                        <Plus size={16}/> Нэмэх
                    </button>
                </div>

                {/* 3. Simple Add Form (Modal-like inline) */}
                {isAdding && (
                    <div className="bg-orange-50 dark:bg-slate-800 p-4 rounded-2xl mb-6 border border-orange-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-orange-600 uppercase mb-3">Шинэ бараа бүртгэх</p>
                        <div className="space-y-3">
                            <input 
                                placeholder="Барааны нэр (Ж: МАК Цемент)" 
                                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                            />
                            <div className="flex gap-3">
                                <input 
                                    type="number" 
                                    placeholder="Үнэ (₮)" 
                                    className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                                />
                                <select 
                                    className="p-3 rounded-xl border border-slate-200 outline-none bg-white"
                                    value={newProduct.unit}
                                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                                >
                                    <option value="ш">ш</option>
                                    <option value="м2">м²</option>
                                    <option value="тн">тн</option>
                                    <option value="шуудай">шуудай</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold bg-white rounded-xl">Болих</button>
                                <button onClick={handleAddProduct} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl">Хадгалах</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Product List */}
                <div className="space-y-3">
                    {products.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                            <img src={p.image} className="w-12 h-12 rounded-lg bg-slate-100 object-cover" alt="" />
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h4>
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

// --- IV. MARKETPLACE + CALCULATOR INTEGRATION ---
const SmartEstimator = ({ onAddToCart }) => {
    const [d1, setD1] = useState(8);
    const [d2, setD2] = useState(6);
    const [floors, setFloors] = useState(1);
    const [results, setResults] = useState(null);

    const calculate = () => {
        const perimeter = (d1 + d2) * 2;
        const height = 2.8;
        const area = d1 * d2;

        const wallRes = calcEngine.calculateWall(perimeter, height, floors);
        const foundRes = calcEngine.calculateFoundation(d1, d2, 1, 0.4);
        const roofRes = calcEngine.calculateRoof(area);

        setResults([wallRes, foundRes, roofRes]);
    };

    const addAllToCart = () => {
        if (!results) return;
        
        let addedCount = 0;
        results.forEach(res => {
            // Find cheapest vendor for this product type
            // In a real app, this would query backend. Here we filter PRODUCTS array.
            const matchingProducts = PRODUCTS.filter(p => p.id === res.productId);
            if (matchingProducts.length > 0) {
                // Simplified: just take the first one found (simulating "best match")
                const product = matchingProducts[0];
                onAddToCart(product, res.qty, res.unit);
                addedCount++;
            }
        });
        alert(`${addedCount} төрлийн материал сагсанд нэмэгдлээ!`);
    };

    return (
        <div className="p-4 sm:p-0">
             <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white mb-6">
                 <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Calculator size={20}/> Төсөв тооцоолох</h2>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                     <div><label className="text-xs text-slate-400 block mb-1">Урт (м)</label><input type="number" value={d1} onChange={e=>setD1(Number(e.target.value))} className="w-full p-2 rounded-lg bg-slate-800 text-white font-bold text-center"/></div>
                     <div><label className="text-xs text-slate-400 block mb-1">Өргөн (м)</label><input type="number" value={d2} onChange={e=>setD2(Number(e.target.value))} className="w-full p-2 rounded-lg bg-slate-800 text-white font-bold text-center"/></div>
                 </div>
                 <button onClick={calculate} className="w-full py-3 bg-orange-600 rounded-xl font-bold hover:bg-orange-700 transition-colors">Бодох</button>
             </div>

             {results && (
                 <div className="space-y-4 animate-in slide-in-from-bottom-4">
                     {results.map((res, idx) => {
                         // Find product details for display
                         const prod = PRODUCTS.find(p => p.id === res.productId);
                         return (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                                        {idx === 0 ? <BrickWall size={20}/> : idx === 1 ? <Box size={20}/> : <Home size={20}/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{prod ? prod.name : res.material}</p>
                                        <p className="text-xs text-slate-500">{res.qty} {res.unit}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{prod ? formatCurrency(prod.price * res.qty) : '-'}</p>
                            </div>
                         )
                     })}
                     
                     <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                         <div className="flex justify-between items-center mb-3">
                             <span className="text-green-800 dark:text-green-400 font-bold text-sm">Нийт төсөв</span>
                             <span className="text-2xl font-black text-green-700 dark:text-green-400">
                                 {formatCurrency(results.reduce((acc, curr) => {
                                     const p = PRODUCTS.find(prod => prod.id === curr.productId);
                                     return acc + (p ? p.price * curr.qty : 0);
                                 }, 0))}
                             </span>
                         </div>
                         <button onClick={addAllToCart} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                             <ShoppingCart size={18}/> Бүгдийг сагслах
                         </button>
                     </div>
                 </div>
             )}
        </div>
    );
}

// --- HOME & CATEGORY VIEWS ---
const HomeView = ({ onNavigate, onSelectCategory }) => (
    <div className="animate-in fade-in py-8">
        {/* Marketplace Categories */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2">Категори</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {Object.keys(CATEGORIES).map(key => (
                <button 
                    key={key}
                    onClick={() => { onSelectCategory(key); onNavigate('category'); }}
                    className="flex flex-col p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
                >
                    <div className="text-orange-600 mb-3">{CATEGORIES[key].icon}</div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{CATEGORIES[key].label}</span>
                </button>
            ))}
        </div>
        
        {/* Quick Access */}
        <div onClick={() => onNavigate('estimator')} className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 rounded-3xl text-white shadow-xl cursor-pointer relative overflow-hidden group">
            <div className="relative z-10">
                <h3 className="text-2xl font-black mb-2">Барилгын Төсөв</h3>
                <p className="text-blue-100 mb-6 max-w-xs">Байшингийнхаа хэмжээг оруулаад материалын зардлаа шууд тооцоол.</p>
                <span className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm">Тооцоолох</span>
            </div>
            <Calculator size={140} className="absolute -bottom-4 -right-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform"/>
        </div>
    </div>
);

const CategoryDetail = ({ category, onBack, onAddToCart }) => {
    // Filter products by category
    const categoryProducts = PRODUCTS.filter(p => p.category === category);

    return (
        <div className="py-8 animate-in slide-in-from-right">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"><ArrowLeft size={20} className="text-slate-600 dark:text-slate-300"/></button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{CATEGORIES[category]?.label || 'Бараа'}</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map(product => {
                    const vendor = VENDORS.find(v => v.id === product.vendorId);
                    return (
                        <div key={product.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                            <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 overflow-hidden relative group">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                {product.stock < 50 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">Цөөхөн үлдсэн</span>}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2">{product.name}</h3>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Store size={12}/> {vendor?.name} ({vendor?.market})</p>
                                <div className="flex justify-between items-end mt-auto">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Үнэ</p>
                                        <p className="text-lg font-black text-orange-600">{formatCurrency(product.price)} <span className="text-xs text-slate-400 font-normal">/ {product.unit}</span></p>
                                    </div>
                                    <button onClick={() => onAddToCart(product, 1, product.unit)} className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-transform"><ShoppingCart size={18}/></button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            {categoryProducts.length === 0 && (
                <div className="text-center py-20 text-slate-400">Энэ ангилалд бараа байхгүй байна.</div>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
    const [view, setView] = useState('home'); 
    const [selectedCat, setSelectedCat] = useState(null);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [userRole, setUserRole] = useState('user'); // 'user' or 'seller'

    const toggleDarkMode = () => setDarkMode(!darkMode);

    const handleAddToCart = (product, qty, unit) => {
        setCart(prev => {
            // Check if product from same vendor exists
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, { ...product, quantity: qty }];
        });
        setIsCartOpen(true);
    };

    const handleRemoveFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const CartDrawer = () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Group by Vendor for display logic mentioned in architecture
        const groupedItems = cart.reduce((groups, item) => {
            const vendor = VENDORS.find(v => v.id === item.vendorId);
            const vendorName = vendor ? vendor.name : 'Unknown';
            if (!groups[vendorName]) groups[vendorName] = [];
            groups[vendorName].push(item);
            return groups;
        }, {});

        return (
            <div className={`fixed inset-0 z-[60] ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsCartOpen(false)} />
                <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="font-bold text-xl text-slate-900 dark:text-white">Сагс ({cart.length})</h2>
                        <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} className="text-slate-500"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {cart.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">Сагс хоосон байна</div>
                        ) : (
                            Object.entries(groupedItems).map(([vendorName, items]) => (
                                <div key={vendorName} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <Store size={16} className="text-orange-500"/>
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{vendorName}</span>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.quantity} {item.unit} x {formatCurrency(item.price)}</p>
                                                </div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 font-medium">Нийт дүн</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(total)}</span>
                        </div>
                        <button className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all">Захиалах</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
                <Header cartCount={cart.length} onNavigate={setView} onOpenCart={() => setIsCartOpen(true)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} userRole={userRole} setUserRole={setUserRole} />
                
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)]">
                    {userRole === 'seller' ? (
                        <SellerDashboard />
                    ) : (
                        <>
                            {view === 'home' && <HomeView onNavigate={setView} onSelectCategory={(cat) => { setSelectedCat(cat); setView('category'); }} onStartBuilder={() => {}} />}
                            {view === 'category' && <CategoryDetail categoryId={selectedCat} onBack={() => setView('home')} onAddToCart={handleAddToCart} />}
                            {view === 'estimator' && <SmartEstimator onAddToCart={handleAddToCart} />}
                            {/* Other views placeholders if needed */}
                        </>
                    )}
                </main>

                <CartDrawer />
            </div>
        </div>
    );
}