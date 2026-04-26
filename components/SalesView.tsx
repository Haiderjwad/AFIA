import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Search, Coffee, Plus, History, X, Clock, PackageCheck,
    ShoppingCart, UtensilsCrossed, CheckCircle2, ChevronDown, ChevronUp,
    Table2, Layers, CheckCircle, Bell, AlertCircle, Ban, Utensils,
    ChefHat, Wallet, User, Monitor, ChevronRight, ChevronLeft
} from 'lucide-react';
import { MenuItem, AppSettings, Transaction, Employee } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { soundService } from '../services/soundService';

interface SalesViewProps {
    products: MenuItem[];
    addToCart: (product: MenuItem) => void;
    settings: AppSettings;
    readyOrders: Transaction[];
    transactions: Transaction[];
    currentUser: Employee | null;
    onCompleteOrder: (id: string) => void;
    onCancelOrder?: (id: string) => void;
    onToggleReceiptPanel?: () => void;
    cartCount?: number;
    selectedTableNumber?: string;
    onSelectTable: (num: string) => void;
}

// ── TABLE ITEM COMPONENT (Standalone for Performance) ────────────────
interface TableItemProps {
    num: string;
    isSelected: boolean;
    status: 'available' | 'occupied' | 'ready' | 'manual';
    readyOrder?: Transaction;
    onClick: (num: string, readyOrderId?: string) => void;
    onDoubleClick: (num: string) => void;
}

const TableItem = React.memo<TableItemProps>(({ num, isSelected, status, readyOrder, onClick, onDoubleClick }) => {
    const isAvailable = status === 'available';
    const isManual = status === 'manual';
    const isOccupied = status === 'occupied';
    const isReady = status === 'ready';

    let themeColor = "emerald";
    let statusText = "متاح";
    let Icon = CheckCircle2;

    if (isReady) {
        themeColor = "amber";
        statusText = "جاهز للتسليم";
        Icon = Bell;
    } else if (isOccupied) {
        themeColor = "rose";
        statusText = "مشغول";
        Icon = Utensils;
    } else if (isManual) {
        themeColor = "orange";
        statusText = "محجوز";
        Icon = Layers;
    }

    const colors: any = {
        emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500", shadow: "shadow-emerald-500/10", accent: "bg-emerald-500" },
        rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500", shadow: "shadow-rose-500/10", accent: "bg-rose-500" },
        orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500", shadow: "shadow-orange-500/10", accent: "bg-orange-500" },
        amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500", shadow: "shadow-amber-500/10", accent: "bg-amber-500" },
    };

    const c = colors[themeColor];

    return (
        <div className="flex flex-col items-center group w-28 sm:w-32 lg:w-40">
            <button
                onClick={() => onClick(num, readyOrder?.id)}
                onDoubleClick={() => onDoubleClick(num)}
                className={`
          relative w-full aspect-[4/5] rounded-[1.5rem] border-2 transition-all duration-300 
          active:scale-95 flex flex-col items-center justify-between p-3 overflow-hidden
          ${isSelected ? 'bg-brand-dark border-brand-accent shadow-2xl scale-105 z-10' : `${c.bg} ${c.border} ${c.shadow} hover:border-brand-primary/30 hover:-translate-y-1`}
        `}
            >
                {isReady && <div className="absolute inset-0 bg-amber-400/5 animate-pulse" />}
                <div className="w-full flex justify-between items-start">
                    <span className={`text-sm font-black italic tracking-tighter ${isSelected ? 'text-brand-accent' : c.text}`}>
                        #{num.padStart(2, '0')}
                    </span>
                    <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${isSelected ? 'bg-brand-accent text-brand-dark' : `${c.accent} text-white`}`}>
                        {statusText}
                    </div>
                </div>
                <div className="relative flex items-center justify-center">
                    <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
            ${isSelected ? 'bg-brand-accent text-brand-dark shadow-[0_0_15px_rgba(248,150,30,0.4)]' : `${c.icon} ${c.bg} group-hover:scale-110`}
          `}>
                        <Icon size={18} className={isReady ? 'animate-bounce' : ''} />
                    </div>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden bg-black/5 mt-1">
                    <div className={`h-full transition-all duration-1000 ${isSelected ? 'bg-brand-accent w-full' : (status === 'available' ? 'w-1/4 bg-emerald-400' : 'w-full ' + c.accent)}`} />
                </div>
            </button>
        </div>
    );
});

const SalesView: React.FC<SalesViewProps> = React.memo(({
    products, addToCart, settings, readyOrders, transactions,
    currentUser, onCompleteOrder, onCancelOrder, onToggleReceiptPanel, cartCount,
    selectedTableNumber, onSelectTable
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [activityTab, setActivityTab] = useState<'active' | 'completed' | 'cancelled'>('active');
    const [tablesOpen, setTablesOpen] = useState(true);
    const [manualOccupied, setManualOccupied] = useState<Set<string>>(new Set());

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [notifiedReadyIds, setNotifiedReadyIds] = useState<Set<string>>(new Set());
    const [activeReadyAlert, setActiveReadyAlert] = useState<{ id: string, tableName: string } | null>(null);

    useEffect(() => {
        const newReady = readyOrders.filter(o => !notifiedReadyIds.has(o.id));
        if (newReady.length > 0) {
            const first = newReady[0];
            const tableName = first.tableNumber === 'Takeaway' ? 'طلب سفري' : `طاولة ${first.tableNumber}`;
            setActiveReadyAlert({ id: first.id, tableName });
            soundService.playNotification();
            setNotifiedReadyIds(prev => {
                const next = new Set(prev);
                newReady.forEach(o => next.add(o.id));
                return next;
            });
            const timer = setTimeout(() => setActiveReadyAlert(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [readyOrders, notifiedReadyIds]);

    useEffect(() => {
        if (activeReadyAlert && !readyOrders.find(o => o.id === activeReadyAlert.id)) {
            setActiveReadyAlert(null);
        }
    }, [readyOrders, activeReadyAlert]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const amount = 400;
            const { scrollLeft } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTo({
                left: direction === 'right' ? scrollLeft + amount : scrollLeft - amount,
                behavior: 'smooth'
            });
        }
    }, []);

    const [completionSuccess, setCompletionSuccess] = useState<{ isOpen: boolean, tableName: string } | null>(null);
    const categories = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.category)))], [products]);

    const filteredProducts = useMemo(() => products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }), [products, searchQuery, selectedCategory]);

    const tablesCount = settings.tablesCount || 10;

    const occupiedByOrder = useMemo(() => {
        const map: Record<string, Transaction[]> = {};
        transactions
            .filter(t => t.tableNumber && t.tableNumber !== 'Takeaway' && !['completed', 'refunded', 'cancelled'].includes(t.status) && !t.isPaid)
            .forEach(t => {
                const key = t.tableNumber!;
                if (!map[key]) map[key] = [];
                map[key].push(t);
            });
        return map;
    }, [transactions]);

    const handleCompleteOrder = useCallback((id: string, tableName: string) => {
        onCompleteOrder(id);
        setCompletionSuccess({ isOpen: true, tableName });
        setTimeout(() => setCompletionSuccess(null), 3000);
    }, [onCompleteOrder]);

    const readyByTable = useMemo(() => {
        const map: Record<string, Transaction> = {};
        readyOrders.forEach(o => {
            if (o.tableNumber && o.tableNumber !== 'Takeaway') map[o.tableNumber] = o;
        });
        return map;
    }, [readyOrders]);

    const handleTableClick = useCallback((num: string, readyOrderId?: string) => {
        if (readyOrderId) {
            onCompleteOrder(readyOrderId);
            setCompletionSuccess({ isOpen: true, tableName: `طاولة ${num}` });
            setTimeout(() => setCompletionSuccess(null), 3000);
        } else {
            onSelectTable(num);
            const isAvailable = !readyByTable[num] && !occupiedByOrder[num] && !manualOccupied.has(num);
            if (isAvailable) {
                setManualOccupied(prev => {
                    const next = new Set(prev);
                    next.add(num);
                    return next;
                });
            }
        }
    }, [onCompleteOrder, onSelectTable, readyByTable, occupiedByOrder, manualOccupied]);

    const handleTableDoubleClick = useCallback((num: string) => {
        if (!occupiedByOrder[num] && !readyByTable[num]) {
            setManualOccupied(prev => {
                const next = new Set(prev);
                if (next.has(num)) next.delete(num);
                else next.add(num);
                return next;
            });
        }
    }, [occupiedByOrder, readyByTable]);

    const availableCount = useMemo(() => Array.from({ length: tablesCount }, (_, i) => String(i + 1))
        .filter(n => !readyByTable[n] && !occupiedByOrder[n] && !manualOccupied.has(n)).length,
        [tablesCount, readyByTable, occupiedByOrder, manualOccupied]);
    const occupiedCount = tablesCount - availableCount;

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F1F3F6] p-4 md:p-6 text-right relative" dir="rtl">

            {/* Professional Order Ready Alert (Premium Notification) */}
            {activeReadyAlert && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-top fade-in duration-700">
                    <div className="bg-brand-dark/95 backdrop-blur-2xl text-white rounded-[2.8rem] p-2.5 pr-8 flex items-center gap-7 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border border-white/10 relative overflow-hidden group">
                        {/* Interactive Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        <div className="flex flex-col text-right relative z-10">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="w-2 h-2 bg-brand-accent rounded-full animate-ping" />
                                <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest leading-none">تحديث المطبخ المباشر</span>
                            </div>
                            <p className="text-base font-black tracking-tight">الطلب الخاص بـ <span className="text-brand-accent text-xl">{activeReadyAlert.tableName}</span> جاهز للتسليم الآن!</p>
                        </div>

                        <div className="w-16 h-16 bg-brand-accent text-brand-dark rounded-[1.8rem] flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(248,150,30,0.3)] relative z-10 animate-bounce">
                            <Bell size={28} className="fill-current opacity-80" />
                        </div>

                        <button
                            onClick={() => setActiveReadyAlert(null)}
                            className="bg-white/5 hover:bg-rose-500 hover:text-white p-3 rounded-full transition-all ml-1 relative z-10 border border-white/5"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Glossy Success Toast Container */}
            {completionSuccess?.isOpen && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="bg-white/80 backdrop-blur-xl border border-brand-primary/10 rounded-full px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-brand-dark font-black text-sm">تم استلام طلب <span className="text-emerald-600">{completionSuccess.tableName}</span> بنجاح!</p>
                    </div>
                </div>
            )}

            {/* Background Branding Decal */}
            <div className="absolute top-0 left-0 w-80 h-80 opacity-[0.02] pointer-events-none -translate-x-1/4 -translate-y-1/4">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            {/* ══════════════════════════════════════════════════════
                MODERN TABLE MANAGEMENT DASHBOARD
            ══════════════════════════════════════════════════════ */}
            <div className="mb-6 rounded-[3rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] bg-white border border-white transition-all duration-500">

                {/* Dashboard Control Bar */}
                <div className="px-8 py-5 border-b border-gray-50 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-dark rounded-2xl flex items-center justify-center text-brand-accent shadow-xl shadow-brand-dark/20">
                                <Monitor size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-brand-dark leading-tight tracking-tight uppercase">خريطة الطاولات</h2>
                                <p className="text-brand-dark/40 font-bold text-[10px] tracking-widest mt-0.5">INTERACTIVE TABLE GRID SYSTEM</p>
                            </div>
                        </div>
                        <div className="hidden md:flex gap-4">
                            <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100/50">
                                <p className="text-[9px] font-black text-emerald-800/40 uppercase mb-0.5">متاحة</p>
                                <p className="text-lg font-black text-emerald-700 leading-none">{availableCount}</p>
                            </div>
                            <div className="bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100/50">
                                <p className="text-[9px] font-black text-rose-800/40 uppercase mb-0.5">مشغولة</p>
                                <p className="text-lg font-black text-rose-700 leading-none">{occupiedCount}</p>
                            </div>
                            {readyOrders.length > 0 && (
                                <div className="bg-brand-accent/10 px-4 py-2 rounded-2xl border border-brand-accent/20 animate-pulse">
                                    <p className="text-[9px] font-black text-brand-accent uppercase mb-0.5">جاهزة</p>
                                    <p className="text-lg font-black text-brand-accent leading-none">{readyOrders.length}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        {/* Takeaway Quick Access */}
                        <button
                            onClick={() => onSelectTable('Takeaway')}
                            className={`
                                flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-xs transition-all duration-300
                                ${selectedTableNumber === 'Takeaway'
                                    ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/20 scale-105'
                                    : 'bg-white border-2 border-brand-primary/5 text-brand-dark/40 hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent/5'
                                }
                            `}
                        >
                            <ShoppingCart size={18} />
                            <span>سفري (Takeaway)</span>
                        </button>

                        <button
                            onClick={() => setTablesOpen(v => !v)}
                            className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-brand-dark hover:text-white transition-all shadow-sm"
                        >
                            {tablesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                </div>

                {/* The Interactive Grid Slider */}
                {tablesOpen && (
                    <div className="relative group/slider px-8 pb-10 bg-[#FAFBFF] animate-in slide-in-from-top-4 duration-700">
                        {/* Gradient Fades for Slider */}
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FAFBFF] to-transparent z-10 pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity" />
                        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FAFBFF] to-transparent z-10 pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity" />

                        {/* Control Buttons */}
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-white transition-all scale-0 group-hover/slider:scale-100 active:scale-90"
                        >
                            <ChevronRight size={24} />
                        </button>
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-brand-dark hover:bg-brand-dark hover:text-white transition-all scale-0 group-hover/slider:scale-100 active:scale-90"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div
                            ref={scrollContainerRef}
                            className="overflow-x-auto no-scrollbar scroll-smooth px-4"
                        >
                            <div className="flex gap-8 py-6 px-2">
                                {Array.from({ length: tablesCount }, (_, i) => {
                                    const num = String(i + 1);
                                    let status: 'available' | 'occupied' | 'ready' | 'manual' = 'available';
                                    if (readyByTable[num]) status = 'ready';
                                    else if (occupiedByOrder[num]) status = 'occupied';
                                    else if (manualOccupied.has(num)) status = 'manual';

                                    return (
                                        <TableItem
                                            key={`table-${num}`}
                                            num={num}
                                            isSelected={selectedTableNumber === num}
                                            status={status}
                                            readyOrder={readyByTable[num]}
                                            onClick={handleTableClick}
                                            onDoubleClick={handleTableDoubleClick}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Counter Indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 opacity-20">
                            {Array.from({ length: Math.ceil(tablesCount / 12) }).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-dark" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════
                PRODUCTS & CATEGORIES REFINED
            ══════════════════════════════════════════════════════ */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-8 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(45,106,79,0.3)]" />
                        <h1 className="text-3xl font-black text-brand-dark tracking-tight">قائمة المبيعات</h1>
                    </div>
                    <p className="text-brand-dark/40 font-bold text-[10px] uppercase tracking-[0.2em] px-5">
                        {selectedTableNumber ? (selectedTableNumber === 'Takeaway' ? '🥡 طلب سفري عاجل' : `📍 خدمة نشطة لطاولة ${selectedTableNumber}`) : '📍 اختر طاولة لبدء الطلب'}
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowActivityLog(true)}
                        className="bg-white h-14 px-6 rounded-2xl border border-white shadow-lg shadow-gray-200/50 font-black text-brand-dark flex items-center gap-3 hover:scale-105 transition-all text-xs active:scale-95"
                    >
                        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <History size={16} />
                        </div>
                        نشاطي
                    </button>
                    <div className="relative flex-1 md:w-96 group">
                        <Search size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-primary/30 group-focus-within:text-brand-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="ابحث عن مشروب، وجبة، أو عروض..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pr-14 pl-5 bg-white rounded-2xl border border-white shadow-lg shadow-gray-200/50 outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all font-bold text-brand-dark text-sm placeholder-brand-dark/20"
                        />
                    </div>
                </div>
            </div>

            {/* Professional Category Tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`
                            px-8 py-3 rounded-2xl font-black whitespace-nowrap transition-all shadow-md text-xs uppercase tracking-wider
                            ${selectedCategory === cat
                                ? 'bg-brand-dark text-brand-accent shadow-xl shadow-brand-dark/20 -translate-y-1'
                                : 'bg-white text-gray-400 hover:text-brand-primary hover:bg-brand-light/20'
                            }
                        `}
                    >
                        {cat === 'all' ? 'الكل' : cat}
                    </button>
                ))}
            </div>

            {/* Detailed Products Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredProducts.map(product => {
                            const isOutOfStock = product.stock <= 0;
                            const isLowStock = product.stock > 0 && product.stock <= (settings.lowStockThreshold || 5);

                            return (
                                <button
                                    key={product.id}
                                    onClick={() => !isOutOfStock && addToCart(product)}
                                    disabled={isOutOfStock}
                                    className={`
                                        bg-white p-6 rounded-[2.5rem] border border-white transition-all duration-500 
                                        flex flex-col items-center gap-4 group relative overflow-hidden text-right
                                        shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:-translate-y-2
                                        ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}
                                    `}
                                >
                                    {/* Stock Intelligence Overlay */}
                                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest z-10 shadow-sm ${isOutOfStock ? 'bg-rose-500 text-white' : isLowStock ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                                        {isOutOfStock ? 'نفذت' : `${product.stock} متوفر`}
                                    </div>

                                    {/* Item Visual */}
                                    <div className="relative">
                                        <div className={`
                                            w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl transition-all duration-500
                                            ${isOutOfStock ? 'bg-gray-100' : 'bg-[#F8F9FB] group-hover:bg-brand-accent/5 group-hover:scale-110 group-hover:rotate-6'}
                                        `}>
                                            <span>{isOutOfStock ? '🚫' : '🍽️'}</span>
                                        </div>
                                        {!isOutOfStock && (
                                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-dark text-brand-accent rounded-2xl flex items-center justify-center shadow-xl scale-0 group-hover:scale-100 transition-all duration-500">
                                                <Plus size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div className="text-center w-full">
                                        <h3 className={`font-black text-sm mb-1 leading-tight transition-colors ${isOutOfStock ? 'text-gray-400' : 'text-brand-dark group-hover:text-brand-primary'}`}>
                                            {product.name}
                                        </h3>
                                        <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${isOutOfStock ? 'bg-gray-100 text-gray-400' : 'bg-brand-primary/5 text-brand-primary group-hover:bg-brand-primary group-hover:text-white'}`}>
                                            {formatCurrency(product.price, settings.currency)}
                                        </div>
                                    </div>

                                    {isOutOfStock && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="bg-rose-600 text-white text-[10px] font-black px-6 py-2 rounded-full shadow-xl rotate-12 uppercase tracking-widest">غير متاح حالياً</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-brand-dark/10 py-32">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Coffee size={56} className="opacity-20" />
                        </div>
                        <p className="text-lg font-black uppercase tracking-[0.3em] text-gray-300">لا توجد أصناف تطابق بحثك</p>
                    </div>
                )}
            </div>

            {/* Modern Sidebar Activity Menu */}
            {
                showActivityLog && (
                    <div className="fixed inset-0 z-[600] flex justify-end animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md" onClick={() => setShowActivityLog(false)} />
                        <div className="relative w-full max-w-lg bg-white h-full shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-left duration-500">
                            <div className="p-10 bg-brand-dark text-white relative">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent">
                                        <History size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight uppercase">مركز النشاط</h2>
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Real-time Order Tracking</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowActivityLog(false)} className="absolute top-10 left-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
                                <div className="flex bg-gray-50 p-2 rounded-[2rem] mb-10 border border-gray-100">
                                    <button
                                        onClick={() => setActivityTab('active')}
                                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activityTab === 'active' ? 'bg-white text-brand-primary shadow-xl shadow-gray-200/50' : 'text-gray-400'}`}
                                    >
                                        النشطة
                                    </button>
                                    <button
                                        onClick={() => setActivityTab('completed')}
                                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activityTab === 'completed' ? 'bg-white text-emerald-600 shadow-xl shadow-gray-200/50' : 'text-gray-400'}`}
                                    >
                                        المنجزة ({transactions.filter(t => t.salesPerson === currentUser?.name && t.status === 'completed' && new Date(t.date).toDateString() === new Date().toDateString()).length})
                                    </button>
                                    <button
                                        onClick={() => setActivityTab('cancelled')}
                                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activityTab === 'cancelled' ? 'bg-white text-rose-500 shadow-xl shadow-gray-200/50' : 'text-gray-400'}`}
                                    >
                                        الملغاة
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {activityTab === 'active' ? (
                                        <>
                                            {readyOrders.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-2">
                                                        <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest">جاهز للتسليم الفوري 🔔</p>
                                                        <span className="w-2 h-2 bg-brand-accent rounded-full animate-ping" />
                                                    </div>
                                                    {readyOrders.map(order => (
                                                        <div key={order.id} className="bg-brand-accent/5 border-2 border-brand-accent/20 p-6 rounded-[2rem] flex justify-between items-center group hover:bg-brand-accent/10 transition-all">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-14 h-14 bg-brand-dark text-brand-accent rounded-2xl flex items-center justify-center font-black text-xl shadow-xl shadow-brand-accent/30">
                                                                    {order.tableNumber === 'Takeaway' ? 'SB' : order.tableNumber}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-brand-dark text-lg">{order.tableNumber === 'Takeaway' ? 'طلب سفري' : `طاولة ${order.tableNumber}`}</p>
                                                                    <p className="text-xs text-brand-accent font-black">تحضير المطبخ مكتمل!</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCompleteOrder(order.id, order.tableNumber === 'Takeaway' ? 'طلب سفري' : `طاولة ${order.tableNumber}`)}
                                                                className="bg-brand-accent text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-orange-500 active:scale-95 transition-all"
                                                            >
                                                                استلام
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="pt-6 border-t border-gray-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-4">قيد التحضير</p>
                                                <div className="space-y-4">
                                                    {transactions
                                                        .filter(t => t.salesPerson === currentUser?.name && ['pending', 'preparing'].includes(t.status))
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                        .map(order => (
                                                            <div key={order.id} className="bg-white border-2 border-gray-50 p-5 rounded-[2rem] flex justify-between items-center group hover:border-brand-primary/20 transition-all">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center font-black">
                                                                        {order.tableNumber === 'Takeaway' ? 'SB' : order.tableNumber}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-brand-dark text-sm">{order.tableNumber === 'Takeaway' ? 'طلب سفري' : `طاولة ${order.tableNumber}`}</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold">{new Date(order.date).toLocaleTimeString('ar-EG')}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                        {order.status === 'pending' ? 'في الانتظار' : 'جاري العمل'}
                                                                    </span>
                                                                    {order.status === 'pending' && (
                                                                        <button onClick={() => onCancelOrder?.(order.id)} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                                            <X size={18} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            {transactions.filter(t => t.salesPerson === currentUser?.name && ['pending', 'preparing'].includes(t.status)).length === 0 && readyOrders.length === 0 && (
                                                <div className="text-center py-24 opacity-20">
                                                    <Monitor size={48} className="mx-auto mb-4" />
                                                    <p className="text-sm font-black uppercase tracking-widest">لا توجد عمليات حالية</p>
                                                </div>
                                            )}
                                        </>
                                    ) : activityTab === 'completed' ? (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2">طلبات منجزة اليوم ✨</p>
                                            {transactions
                                                .filter(t => t.salesPerson === currentUser?.name && t.status === 'completed' && new Date(t.date).toDateString() === new Date().toDateString())
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(order => (
                                                    <div key={order.id} className="bg-emerald-50/30 p-6 rounded-[2.5rem] border border-emerald-100/50 flex justify-between items-center group hover:bg-emerald-50 transition-all cursor-pointer">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">
                                                                {order.tableNumber === 'Takeaway' ? 'SB' : order.tableNumber}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-brand-dark text-lg">{order.tableNumber === 'Takeaway' ? 'طلب سفري منجز' : `طاولة ${order.tableNumber}`}</p>
                                                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase">
                                                                    <CheckCircle size={12} />
                                                                    <span>تم التسليم بنجاح</span>
                                                                    <span className="text-gray-300 mx-1">|</span>
                                                                    <span className="text-gray-400">{new Date(order.date).toLocaleTimeString('ar-EG')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">القيمة</p>
                                                            <p className="font-black text-emerald-600">{formatCurrency(order.total, settings.currency)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            {transactions.filter(t => t.salesPerson === currentUser?.name && t.status === 'completed' && new Date(t.date).toDateString() === new Date().toDateString()).length === 0 && (
                                                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                                                    <PackageCheck size={48} className="mx-auto mb-4 text-gray-200" />
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">لم يتم إنجاز طلبات بعد</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {transactions.filter(t => t.salesPerson === currentUser?.name && t.status === 'cancelled').map(order => (
                                                <div key={order.id} className="bg-rose-50/50 p-5 rounded-[2rem] border border-rose-100 flex justify-between items-center">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center">
                                                            <Ban size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-brand-dark text-sm">{order.tableNumber === 'Takeaway' ? 'طلب سفري ملغي' : `طاولة ${order.tableNumber} (ملغي)`}</p>
                                                            <p className="text-[9px] text-rose-500 font-bold">تم إلغاء العملية بنجاح</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 px-4 py-1 bg-white rounded-lg border border-gray-100">#{order.id.slice(-4)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
});

// Internal Helper for Label Colors
function labelColor(status: string) {
    if (status === 'ready') return 'text-brand-accent';
    if (status === 'occupied') return 'text-rose-500';
    if (status === 'manual') return 'text-orange-500';
    return 'text-emerald-500';
}

export default SalesView;
