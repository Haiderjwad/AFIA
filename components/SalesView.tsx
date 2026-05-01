import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Search, Coffee, Plus, History, X, Clock, PackageCheck,
    ShoppingCart, UtensilsCrossed, CheckCircle2, ChevronDown, ChevronUp,
    Table2, Layers, CheckCircle, Bell, AlertCircle, Ban, Utensils,
    ChefHat, Wallet, User, Monitor, ChevronRight, ChevronLeft,
    Pencil, RefreshCw, Trash2, MoveHorizontal, ArrowLeft, ArrowRight, Package
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
    onEditOrder?: (id: string) => void;
    onMoveTable?: (id: string, newTable: string) => void;
    onMoveOrderItem?: (sourceTransactionId: string, itemId: string, targetTable: string) => void;
    onRemoveOrderItem?: (transactionId: string, itemId: string) => void;
    isEditing?: boolean;
    onToggleReceiptPanel?: () => void;
    cartCount?: number;
    selectedTableNumber?: string;
    onSelectTable: (num: string) => void;
    tableGuestCounts: Map<string, number>;
    onGuestCountChange: (num: string, count: number) => void;
}

// ── TABLE ITEM COMPONENT (Standalone for Performance) ────────────────
interface TableItemProps {
    num: string;
    isSelected: boolean;
    status: 'available' | 'occupied' | 'ready';
    guestCount?: number;
    readyOrder?: Transaction;
    onClick: (num: string, readyOrderId?: string) => void;
    onLongPress: (num: string) => void;
}

const TableItem = React.memo<TableItemProps>(({ num, isSelected, status, guestCount, readyOrder, onClick, onLongPress }) => {
    const isAvailable = status === 'available';
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
    }

    const colors: any = {
        emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500", shadow: "shadow-emerald-500/10", accent: "bg-emerald-500" },
        rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500", shadow: "shadow-rose-500/10", accent: "bg-rose-500" },
        amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500", shadow: "shadow-amber-500/10", accent: "bg-amber-500" },
    };

    const c = colors[themeColor];
    let longPressTimer: NodeJS.Timeout | null = null;

    const handleMouseDown = () => {
        longPressTimer = setTimeout(() => {
            onLongPress(num);
        }, 600);
    };

    const handleMouseUp = () => {
        if (longPressTimer) clearTimeout(longPressTimer);
    };

    return (
        <div className="flex flex-col items-center group w-28 sm:w-32 lg:w-40">
            <button
                onClick={() => onClick(num, readyOrder?.id)}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
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
                    {guestCount && guestCount > 0 && (
                        <div className="w-6 h-6 rounded-full bg-brand-accent text-brand-dark flex items-center justify-center text-[10px] font-black shadow-md">
                            {guestCount}
                        </div>
                    )}
                    {!guestCount && (
                        <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${isSelected ? 'bg-brand-accent text-brand-dark' : `${c.accent} text-white`}`}>
                            {statusText}
                        </div>
                    )}
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
    selectedTableNumber, onSelectTable, tableGuestCounts, onGuestCountChange,
    onEditOrder, isEditing, onMoveTable, onMoveOrderItem, onRemoveOrderItem
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [activityTab, setActivityTab] = useState<'active' | 'completed' | 'cancelled'>('active');
    const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
    const [movingOrderId, setMovingOrderId] = useState<string | null>(null);
    const [tablesOpen, setTablesOpen] = useState(true);
    const [longPressTable, setLongPressTable] = useState<string | null>(null);
    const [guestCountInput, setGuestCountInput] = useState('');

    // Order Detail Modal — clicked from activity log
    const [selectedOrderDetail, setSelectedOrderDetail] = useState<import('../types').Transaction | null>(null);
    // Item transfer state
    const [tableMoveConfirm, setTableMoveConfirm] = useState<{ isOpen: boolean, orderId: string, fromTable: string, toTable: string } | null>(null);
    const [itemTransferTarget, setItemTransferTarget] = useState<{ itemId: string; itemName: string; orderId: string } | null>(null);
    const [itemTransferConfirm, setItemTransferConfirm] = useState<{ itemId: string; itemName: string; orderId: string; toTable: string } | null>(null);
    const [itemRemoveConfirm, setItemRemoveConfirm] = useState<{ orderId: string, itemId: string, itemName: string } | null>(null);

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
    const [moveSuccess, setMoveSuccess] = useState<{ isOpen: boolean, from: string, to: string } | null>(null);
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
            .filter(t =>
                t.tableNumber &&
                t.tableNumber !== 'Takeaway' &&
                (t.isTableClosed === false || (t.isTableClosed === undefined && !t.isPaid && !['completed', 'refunded', 'cancelled'].includes(t.status)))
            )
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
        }
    }, [onCompleteOrder, onSelectTable]);

    const handleTableLongPress = useCallback((num: string) => {
        setLongPressTable(num);
        setGuestCountInput(tableGuestCounts.get(num)?.toString() || '');
    }, [tableGuestCounts]);

    const handleSaveGuestCount = () => {
        const count = parseInt(guestCountInput) || 0;
        if (longPressTable) {
            onGuestCountChange(longPressTable, count);
        }
        setLongPressTable(null);
        setGuestCountInput('');
    };

    const availableCount = useMemo(() => Array.from({ length: tablesCount }, (_, i) => String(i + 1))
        .filter(n => !readyByTable[n] && !occupiedByOrder[n]).length,
        [tablesCount, readyByTable, occupiedByOrder]);
    const occupiedCount = tablesCount - availableCount;

    return (
        <div className="view-container" dir="rtl">

            {/* Professional Order Ready Alert (Premium Notification) */}
            {activeReadyAlert && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-top fade-in duration-700">
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
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-10 fade-in duration-500">
                    <div className="bg-white/80 backdrop-blur-xl border border-brand-primary/10 rounded-full px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-brand-dark font-black text-sm">تم استلام طلب <span className="text-emerald-600">{completionSuccess.tableName}</span> بنجاح!</p>
                    </div>
                </div>
            )}

            {/* Premium Move Table Success Toast — Brand Identity */}
            {moveSuccess?.isOpen && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="bg-brand-dark backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-brand-accent/20 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5)] flex items-center gap-6 relative overflow-hidden">
                        {/* Accent glow strip */}
                        <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b from-brand-accent via-brand-primary to-transparent rounded-l-full" />
                        {/* Icon */}
                        <div className="w-14 h-14 bg-brand-accent text-brand-dark rounded-2xl flex items-center justify-center shadow-xl shadow-brand-accent/30 relative z-10 shrink-0">
                            <MoveHorizontal size={24} />
                        </div>
                        {/* Content */}
                        <div className="flex flex-col relative z-10">
                            <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.25em] mb-1.5">تم تحويل الطاولة بنجاح</span>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-white/30 font-bold uppercase mb-0.5">من</span>
                                    <span className="text-white/60 font-bold text-sm">{moveSuccess.from === 'Takeaway' ? 'سفري' : `#${moveSuccess.from}`}</span>
                                </div>
                                <ArrowLeft size={18} className="text-brand-primary/60" />
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-white/30 font-bold uppercase mb-0.5">إلى</span>
                                    <span className="text-white font-black text-xl leading-none">{moveSuccess.to === 'Takeaway' ? 'سفري' : `#${moveSuccess.to}`}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Guest Count Modal for Long Press */}
            {longPressTable && (
                <div className="fixed inset-0 z-[500] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                        <div className="p-8 bg-gradient-to-br from-brand-primary to-brand-secondary text-white">
                            <h3 className="text-2xl font-black mb-2">عدد الأشخاص</h3>
                            <p className="text-sm text-white/80 font-bold">الطاولة #{longPressTable.padStart(2, '0')}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-brand-dark">أدخل عدد الأشخاص:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={guestCountInput}
                                    onChange={(e) => setGuestCountInput(e.target.value)}
                                    placeholder="0"
                                    autoFocus
                                    className="w-full px-4 py-3 text-center text-2xl font-black border-2 border-brand-primary/20 rounded-2xl focus:border-brand-primary outline-none transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveGuestCount();
                                        if (e.key === 'Escape') setLongPressTable(null);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setGuestCountInput(num.toString())}
                                        className="py-2 rounded-xl font-black text-sm transition-all bg-brand-light/50 text-brand-primary hover:bg-brand-primary hover:text-white"
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="px-8 pb-8 flex gap-3">
                            <button
                                onClick={handleSaveGuestCount}
                                className="flex-1 py-3.5 rounded-2xl font-black text-white bg-gradient-to-l from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary hover:shadow-xl hover:shadow-brand-primary/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                            >
                                حفظ
                            </button>
                            <button
                                onClick={() => setLongPressTable(null)}
                                className="flex-1 py-3.5 rounded-2xl font-black text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                            >
                                إلغاء
                            </button>
                        </div>
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
            <div className="mb-6 rounded-[3rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] bg-white dark:bg-slate-800 border border-white dark:border-slate-700 transition-all duration-500">

                {/* Dashboard Control Bar */}
                <div className="px-8 py-5 border-b border-gray-50 dark:border-slate-700 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-dark rounded-2xl flex items-center justify-center text-brand-accent shadow-xl shadow-brand-dark/20">
                                <Monitor size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-brand-dark dark:text-white leading-tight tracking-tight uppercase">خريطة الطاولات</h2>
                                <p className="text-gray-500 dark:text-gray-300 font-black text-[10px] tracking-widest mt-0.5">INTERACTIVE TABLE GRID SYSTEM</p>
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
                                flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-xs transition-all duration-300 active:scale-95
                                ${selectedTableNumber === 'Takeaway'
                                    ? 'bg-brand-accent text-white shadow-xl shadow-brand-accent/30 scale-105 ring-2 ring-brand-accent/30'
                                    : 'bg-gray-100 dark:bg-slate-700 border-2 border-brand-accent/20 text-brand-dark dark:text-gray-200 hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent/10 hover:shadow-lg hover:shadow-brand-accent/10'
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
                    <div className="relative group/slider px-8 pb-10 bg-[#FAFBFF] dark:bg-slate-900/60 animate-in slide-in-from-top-4 duration-700">
                        {/* Gradient Fades for Slider */}
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FAFBFF] dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity" />
                        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FAFBFF] dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity" />

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
                                    let status: 'available' | 'occupied' | 'ready' = 'available';
                                    if (readyByTable[num]) status = 'ready';
                                    else if (occupiedByOrder[num]) status = 'occupied';

                                    return (
                                        <TableItem
                                            key={`table-${num}`}
                                            num={num}
                                            isSelected={selectedTableNumber === num}
                                            status={status}
                                            guestCount={status === 'available' ? undefined : tableGuestCounts.get(num)}
                                            readyOrder={readyByTable[num]}
                                            onClick={handleTableClick}
                                            onLongPress={handleTableLongPress}
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
            {/* Activity Center Button — TOP SECTION */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={() => setShowActivityLog(true)}
                    className="group flex items-center gap-3 bg-gradient-to-l from-brand-accent to-orange-500 hover:from-orange-500 hover:to-brand-accent text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-brand-accent/30 hover:shadow-brand-accent/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                >
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <History size={16} />
                    </div>
                    مركز النشاط
                    {(transactions.filter(t => t.salesPerson === currentUser?.name && ['pending', 'preparing'].includes(t.status)).length > 0) && (
                        <span className="bg-white text-brand-accent text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                            {transactions.filter(t => t.salesPerson === currentUser?.name && ['pending', 'preparing'].includes(t.status)).length}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-8 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(45,106,79,0.3)]" />
                        <h1 className="text-3xl font-black text-brand-dark dark:text-white tracking-tight">قائمة المبيعات</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-300 font-black text-[10px] uppercase tracking-[0.2em] px-5">
                        {selectedTableNumber ? (selectedTableNumber === 'Takeaway' ? '🥡 طلب سفري عاجل' : `📍 خدمة نشطة لطاولة ${selectedTableNumber}`) : '📍 اختر طاولة لبدء الطلب'}
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
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
            <div className="pb-10">
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
                    <div className="fixed top-20 bottom-0 right-0 lg:right-28 left-0 z-[1000] flex justify-start animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-[2px]" onClick={() => setShowActivityLog(false)} />
                        <div className="relative w-full max-w-lg bg-white h-full shadow-[0_0_100px_rgba(0,0,0,0.3)] flex flex-col animate-in slide-in-from-right duration-500 rounded-tl-3xl lg:rounded-none overflow-hidden">
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
                                                            <div key={order.id} className="bg-white border-2 border-gray-50 p-5 rounded-[2rem] flex justify-between items-center group hover:border-brand-primary/20 hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedOrderDetail(order)}>
                                                                <div className="flex items-center gap-5 relative">
                                                                    <button
                                                                        onClick={e => { e.stopPropagation(); setMovingOrderId(order.id); }}
                                                                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black transition-all hover:scale-105 active:scale-95 shadow-lg group/title ${order.isMoved ? 'bg-brand-primary text-white shadow-brand-primary/25' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-brand-primary/30 hover:bg-white'}`}
                                                                    >
                                                                        <span className="text-[10px] opacity-60 uppercase leading-none mb-1">{order.isMoved ? 'محول' : 'رقم'}</span>
                                                                        <span className="text-xl leading-none">{order.tableNumber === 'Takeaway' ? 'SB' : order.tableNumber}</span>
                                                                        {order.isMoved && (
                                                                            <div className="absolute -top-1 -right-1 bg-brand-accent text-brand-dark rounded-full p-1 shadow-sm border border-brand-accent/30 animate-bounce">
                                                                                <MoveHorizontal size={10} />
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-black text-brand-dark text-lg whitespace-nowrap">{order.tableNumber === 'Takeaway' ? 'طلب سفري' : `طاولة ${order.tableNumber}`}</p>
                                                                            {order.isMoved && (
                                                                                <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 border border-brand-primary/20">
                                                                                    <RefreshCw size={8} className="animate-spin" /> من {order.previousTable}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-400 font-bold tracking-tight">{new Date(order.date).toLocaleTimeString('ar-EG')}</p>
                                                                    </div>

                                                                    {/* Inline Move Table Dropdown */}
                                                                    {movingOrderId === order.id && (
                                                                        <>
                                                                            {/* Transparent Overlay for outside click closing */}
                                                                            <div className="fixed inset-0 z-[690]" onClick={(e) => { e.stopPropagation(); setMovingOrderId(null); }} />

                                                                            <div
                                                                                className="absolute top-full right-0 mt-4 bg-white rounded-3xl shadow-4xl border border-gray-100 p-6 z-[700] w-72 animate-in zoom-in-95 slide-in-from-top-2 duration-300"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <div className="flex items-center justify-between mb-4 px-2">
                                                                                    <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest">اختر الطاولة الجديدة</p>
                                                                                    <button onClick={() => setMovingOrderId(null)} className="text-gray-300 hover:text-rose-500 transition-colors"><X size={16} /></button>
                                                                                </div>
                                                                                <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto no-scrollbar">
                                                                                    {Array.from({ length: settings.tablesCount || 24 }, (_, i) => String(i + 1)).map(num => (
                                                                                        <button
                                                                                            key={num}
                                                                                            onClick={() => {
                                                                                                const fromTable = order.tableNumber || 'Takeaway';
                                                                                                onMoveTable?.(order.id, num);
                                                                                                setMovingOrderId(null);
                                                                                                setMoveSuccess({ isOpen: true, from: fromTable, to: num });
                                                                                                setTimeout(() => setMoveSuccess(null), 3000);
                                                                                            }}
                                                                                            disabled={num === order.tableNumber}
                                                                                            className={`h-11 rounded-xl flex items-center justify-center font-black text-xs transition-all ${num === order.tableNumber ? 'bg-gray-50 text-gray-200 cursor-not-allowed' : 'bg-brand-primary/5 text-brand-primary hover:bg-brand-primary hover:text-white active:scale-95 shadow-sm'}`}
                                                                                        >
                                                                                            {num}
                                                                                        </button>
                                                                                    ))}
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const fromTable = order.tableNumber || 'Takeaway';
                                                                                            onMoveTable?.(order.id, 'Takeaway');
                                                                                            setMovingOrderId(null);
                                                                                            setMoveSuccess({ isOpen: true, from: fromTable, to: 'Takeaway' });
                                                                                            setTimeout(() => setMoveSuccess(null), 3000);
                                                                                        }}
                                                                                        className="col-span-4 h-11 rounded-xl bg-brand-accent/10 text-brand-accent font-black text-xs hover:bg-brand-accent hover:text-white transition-all flex items-center justify-center gap-2"
                                                                                    >
                                                                                        <ShoppingCart size={14} /> تحويل لسفري
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                        {order.status === 'pending' ? 'في الانتظار' : 'جاري العمل'}
                                                                    </span>
                                                                    {order.status === 'pending' && onEditOrder && (
                                                                        <button
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                onEditOrder(order.id);
                                                                                setShowActivityLog(false);
                                                                            }}
                                                                            className="w-10 h-10 flex items-center justify-center text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                                                                            title="تعديل الطلب"
                                                                        >
                                                                            <Pencil size={18} />
                                                                        </button>
                                                                    )}
                                                                    {(order.status === 'pending' || order.status === 'preparing') && (
                                                                        <button onClick={e => { e.stopPropagation(); setConfirmCancel(order.id); }} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="إلغاء الطلب">
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
                                                    <div
                                                        key={order.id}
                                                        onClick={() => setSelectedOrderDetail(order)}
                                                        className="bg-emerald-50/30 p-6 rounded-[2.5rem] border border-emerald-100/50 flex justify-between items-center group hover:bg-emerald-500 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-95"
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 bg-emerald-500 group-hover:bg-white text-white group-hover:text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20 transition-all">
                                                                {order.tableNumber === 'Takeaway' ? 'SB' : order.tableNumber}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-brand-dark group-hover:text-white text-lg transition-colors">{order.tableNumber === 'Takeaway' ? 'طلب سفري منجز' : `طاولة ${order.tableNumber}`}</p>
                                                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 group-hover:text-emerald-100 font-black uppercase transition-colors">
                                                                    <CheckCircle size={12} />
                                                                    <span>تم التسليم بنجاح</span>
                                                                    <span className="text-gray-300 group-hover:text-emerald-200 mx-1">|</span>
                                                                    <span className="text-gray-400 group-hover:text-emerald-100">{new Date(order.date).toLocaleTimeString('ar-EG')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-gray-400 group-hover:text-emerald-100 uppercase mb-1 transition-colors">القيمة</p>
                                                            <p className="font-black text-emerald-600 group-hover:text-white transition-colors">{formatCurrency(order.total, settings.currency)}</p>
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
            {/* ═══════════════════════════════════════════════════════════
                ORDER DETAIL MODAL — Full Item Breakdown
            ═══════════════════════════════════════════════════════════ */}
            {selectedOrderDetail && !itemTransferTarget && !itemTransferConfirm && !itemRemoveConfirm && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedOrderDetail(null)}>
                    <div
                        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 max-h-[85vh]"
                        onClick={e => e.stopPropagation()}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="bg-brand-dark text-white px-8 py-6 relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/30 to-transparent pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-brand-accent text-brand-dark rounded-2xl flex items-center justify-center font-black text-xl shadow-xl shadow-brand-accent/30">
                                        {selectedOrderDetail.tableNumber === 'Takeaway' ? 'SB' : selectedOrderDetail.tableNumber}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">
                                            {selectedOrderDetail.tableNumber === 'Takeaway' ? 'طلب سفري' : `طاولة ${selectedOrderDetail.tableNumber}`}
                                        </h3>
                                        <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-0.5">
                                            {new Date(selectedOrderDetail.date).toLocaleTimeString('ar-EG')} — #{selectedOrderDetail.id.slice(-5).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedOrderDetail(null)}
                                    className="w-10 h-10 bg-white/10 hover:bg-rose-500 rounded-full flex items-center justify-center transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {/* Status Badge */}
                            <div className="relative z-10 mt-4 flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedOrderDetail.status === 'pending' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                                    {selectedOrderDetail.status === 'pending' ? '⏳ في الانتظار' : '🔥 جاري التحضير'}
                                </span>
                                <span className="text-white/40 text-[10px] font-bold">|</span>
                                <span className="text-brand-accent font-black text-sm">{formatCurrency(selectedOrderDetail.total, settings.currency)}</span>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="px-8 pt-5 pb-2 shrink-0">
                            <div className="flex items-center gap-3 bg-brand-primary/5 rounded-2xl px-4 py-3 border border-brand-primary/10">
                                <ArrowRight size={16} className="text-brand-primary shrink-0" />
                                <p className="text-[11px] font-bold text-brand-dark/60 leading-relaxed">
                                    انقر على أيقونة السهم بجانب أي عنصر لنقله إلى طاولة أخرى
                                </p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-3 no-scrollbar">
                            {selectedOrderDetail.items.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className="flex items-center gap-4 bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100 hover:border-brand-primary/20 hover:bg-brand-primary/5 transition-all group/item"
                                >
                                    {/* Item Icon */}
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 border border-gray-100">
                                        🍽️
                                    </div>
                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-brand-dark text-sm leading-tight truncate">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-gray-400">x{item.quantity}</span>
                                            <span className="text-brand-accent font-black text-[11px]">{formatCurrency(item.price * item.quantity, settings.currency)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Transfer Arrow Button */}
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setItemTransferTarget({
                                                    itemId: item.id,
                                                    itemName: item.name,
                                                    orderId: selectedOrderDetail.id
                                                });
                                            }}
                                            className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90"
                                            title={`نقل ${item.name} إلى طاولة أخرى`}
                                        >
                                            <ArrowRight size={18} />
                                        </button>

                                        {/* Remove Item Button */}
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setItemRemoveConfirm({
                                                    itemId: item.id,
                                                    itemName: item.name,
                                                    orderId: selectedOrderDetail.id
                                                });
                                            }}
                                            className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90"
                                            title={`حذف ${item.name} من الطلب`}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-8 pb-6 pt-4 border-t border-gray-100 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">إجمالي الطلب</p>
                                    <p className="text-xl font-black text-brand-dark">{formatCurrency(selectedOrderDetail.total, settings.currency)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Package size={14} className="text-gray-300" />
                                    <span className="text-[11px] font-bold text-gray-400">{selectedOrderDetail.items.length} عنصر</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ITEM TABLE PICKER MODAL — Pick destination table
            ═══════════════════════════════════════════════════════════ */}
            {itemTransferTarget && !itemTransferConfirm && (
                <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4 bg-brand-dark/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setItemTransferTarget(null)}>
                    <div
                        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-400"
                        onClick={e => e.stopPropagation()}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="bg-brand-dark text-white px-7 py-5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-1">نقل عنصر</p>
                                    <h4 className="font-black text-base leading-tight">{itemTransferTarget.itemName}</h4>
                                </div>
                                <button onClick={() => setItemTransferTarget(null)} className="w-9 h-9 bg-white/10 hover:bg-rose-500 rounded-full flex items-center justify-center transition-all">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Table Grid */}
                        <div className="p-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">اختر الطاولة المستهدفة</p>
                            <div className="grid grid-cols-5 gap-2 max-h-52 overflow-y-auto no-scrollbar mb-3">
                                {Array.from({ length: settings.tablesCount || 24 }, (_, i) => String(i + 1)).map(num => {
                                    const sourceOrder = transactions.find(t => t.id === itemTransferTarget.orderId);
                                    const isSame = num === sourceOrder?.tableNumber;
                                    const isOccupied = !!occupiedByOrder[num];
                                    return (
                                        <button
                                            key={num}
                                            disabled={isSame}
                                            onClick={() => {
                                                setItemTransferConfirm({
                                                    ...itemTransferTarget,
                                                    toTable: num
                                                });
                                                setItemTransferTarget(null);
                                            }}
                                            className={`h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs transition-all active:scale-90 ${isSame
                                                ? 'bg-gray-50 text-gray-200 cursor-not-allowed border border-gray-100'
                                                : isOccupied
                                                    ? 'bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-500 hover:text-white shadow-sm'
                                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white shadow-sm'
                                                }`}
                                        >
                                            <span className="text-[8px] opacity-60 leading-none">{isOccupied && !isSame ? 'مشغول' : isSame ? 'حالي' : 'متاح'}</span>
                                            <span>{num}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Legend */}
                            <div className="flex items-center gap-4 px-1">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-400" /><span className="text-[9px] font-bold text-gray-400">متاحة</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-400" /><span className="text-[9px] font-bold text-gray-400">مشغولة (دمج)</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ITEM TRANSFER CONFIRM DIALOG
            ═══════════════════════════════════════════════════════════ */}
            {itemTransferConfirm && (
                <div className="fixed inset-0 z-[1700] flex items-center justify-center p-4 bg-brand-dark/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-400" dir="rtl">
                        {/* Header */}
                        <div className="bg-brand-dark text-white px-8 py-6 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-36 h-36 bg-brand-accent/20 rounded-full blur-3xl" />
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-14 h-14 bg-brand-accent text-brand-dark rounded-2xl flex items-center justify-center shadow-xl shadow-brand-accent/30">
                                    <MoveHorizontal size={26} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] mb-1">تأكيد نقل العنصر</p>
                                    <h3 className="text-xl font-black leading-tight">هل تريد نقل هذا العنصر؟</h3>
                                </div>
                            </div>
                        </div>

                        {/* Confirm Body */}
                        <div className="px-8 py-6 space-y-6">
                            {/* Item being moved */}
                            <div className="bg-brand-primary/5 rounded-[1.5rem] p-5 border border-brand-primary/10">
                                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">العنصر المراد نقله</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-brand-primary/10">🍽️</div>
                                    <p className="font-black text-brand-dark">{itemTransferConfirm.itemName}</p>
                                </div>
                            </div>

                            {/* Transfer Route */}
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center bg-gray-50 rounded-2xl px-6 py-3 border border-gray-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">من</span>
                                    <span className="font-black text-brand-dark text-lg">
                                        {(() => {
                                            const src = transactions.find(t => t.id === itemTransferConfirm.orderId);
                                            return src?.tableNumber === 'Takeaway' ? 'سفري' : `#${src?.tableNumber}`;
                                        })()}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <ArrowLeft size={24} className="text-brand-primary" />
                                </div>
                                <div className="flex flex-col items-center bg-brand-primary/10 rounded-2xl px-6 py-3 border border-brand-primary/20">
                                    <span className="text-[9px] font-bold text-brand-primary/60 uppercase mb-1">إلى</span>
                                    <span className="font-black text-brand-primary text-lg">
                                        {itemTransferConfirm.toTable === 'Takeaway' ? 'سفري' : `#${itemTransferConfirm.toTable}`}
                                    </span>
                                </div>
                            </div>

                            {/* Destination note */}
                            <p className="text-center text-xs text-gray-400 font-bold leading-relaxed">
                                {occupiedByOrder[itemTransferConfirm.toTable]
                                    ? '⚡ سيتم دمج هذا العنصر مع الطلب النشط الموجود على تلك الطاولة'
                                    : '✨ سيتم إنشاء طلب جديد على تلك الطاولة وستصبح مشغولة'}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setItemTransferConfirm(null)}
                                    className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm hover:bg-gray-100 active:scale-95 transition-all"
                                >
                                    تراجع
                                </button>
                                <button
                                    onClick={async () => {
                                        const { orderId, itemId, toTable } = itemTransferConfirm;
                                        setItemTransferConfirm(null);
                                        setSelectedOrderDetail(null);
                                        await onMoveOrderItem?.(orderId, itemId, toTable);
                                        setMoveSuccess({ isOpen: true, from: transactions.find(t => t.id === orderId)?.tableNumber || 'Takeaway', to: toTable });
                                        setTimeout(() => setMoveSuccess(null), 3000);
                                    }}
                                    className="flex-1 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-2xl font-black text-sm shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
                                >
                                    تأكيد النقل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog for Cancellation */}
            {confirmCancel && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-brand-dark text-white flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <AlertCircle size={32} className="text-brand-accent" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-black">إلغاء الطلب</h3>
                                <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest mt-1">تأكيد عملية الحذف</p>
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <p className="text-brand-dark font-black text-base mb-8 leading-loose">
                                هل أنت متأكد من رغبتك في <span className="text-brand-accent">إلغاء هذا الطلب</span>؟
                                <br /><span className="text-gray-500 text-sm">لا يمكن التراجع عن هذا الإجراء لاحقاً.</span>
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        onCancelOrder?.(confirmCancel);
                                        setConfirmCancel(null);
                                    }}
                                    className="flex-1 py-4 bg-brand-accent text-white rounded-2xl font-black shadow-xl shadow-brand-accent/20 active:scale-95 transition-all"
                                >
                                    تأكيد الإلغاء
                                </button>
                                <button
                                    onClick={() => setConfirmCancel(null)}
                                    className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black hover:bg-gray-100 active:scale-95 transition-all"
                                >
                                    تراجع
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ═══════════════════════════════════════════════════════════
                 ITEM REMOVAL CONFIRMATION MODAL
            ═══════════════════════════════════════════════════════════ */}
            {itemRemoveConfirm && (
                <div className="fixed inset-0 z-[1700] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-400 p-8 text-center border-2 border-rose-100" dir="rtl">
                        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-brand-dark mb-2">تأكيد حذف العنصر</h3>
                        <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">
                            هل أنت متأكد من رغبتك في إزالة <span className="text-rose-500 px-1">{itemRemoveConfirm.itemName}</span> من هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء وسيتم إرجاع كميته للمخزون.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    if (onRemoveOrderItem) {
                                        await onRemoveOrderItem(itemRemoveConfirm.orderId, itemRemoveConfirm.itemId);
                                    }

                                    // If this item was the last item in the order, we should close the order details overlay since it's cancelled
                                    const currentOrder = transactions.find(t => t.id === itemRemoveConfirm.orderId);
                                    if (currentOrder && currentOrder.items.length <= 1) {
                                        setSelectedOrderDetail(null);
                                    }

                                    setItemRemoveConfirm(null);
                                }}
                                className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95"
                            >
                                تأكيد الحذف
                            </button>
                            <button
                                onClick={() => setItemRemoveConfirm(null)}
                                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-brand-dark font-black rounded-2xl transition-all active:scale-95"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
