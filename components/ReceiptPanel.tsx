
import React, { useState, useEffect } from 'react';
import StatusModal from './StatusModal';
import { CartItem, MenuItem, AppSettings } from '../types';
import { formatCurrency } from '../utils/currencyUtils';
import { Plus, Minus, Sparkles, Coffee, CreditCard, Loader2, Banknote, Wifi, ArrowLeft, Check, AlertCircle, Hash, MessageSquare, X, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { suggestUpsell } from '../services/geminiService';

interface ReceiptPanelProps {
    cart: CartItem[];
    addToCart: (item: MenuItem) => void;
    removeFromCart: (itemId: string) => void;
    decreaseQuantity: (itemId: string) => void;
    onClear: () => void;
    onCheckout: (method: 'cash' | 'card' | 'online', tableNumber: string, orderNote: string) => Promise<void>;
    settings: AppSettings;
    userRole: string;
    onClose?: () => void;
    isOpen?: boolean;
    tableNumber: string;
    onTableChange: (num: string) => void;
    products: MenuItem[];
    guestCount?: number;
    onGuestCountChange?: (count: number) => void;
}

const ReceiptPanel: React.FC<ReceiptPanelProps> = ({
    cart,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    onClear,
    onCheckout,
    settings,
    userRole,
    onClose,
    isOpen,
    tableNumber,
    onTableChange,
    products,
    guestCount = 0,
    onGuestCountChange
}) => {
    const [upsellSuggestion, setUpsellSuggestion] = useState<string>("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'online' | null>(null);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderNote, setOrderNote] = useState<string>('');
    const [isNoteVisible, setIsNoteVisible] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    const isTakeaway = tableNumber === 'Takeaway';
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const discount = 0;
    const total = subtotal + tax - discount;

    const isIQD = settings.currency === 'د.ع' || settings.currency === 'IQD';
    const factor = isIQD ? 1000 : 1;
    const changeActual = cashReceived ? parseFloat(cashReceived) - (total * factor) : 0;
    const change = changeActual / factor;

    useEffect(() => {
        const fetchUpsell = async () => {
            if (cart.length > 0) {
                const itemNames = cart.map(c => c.name);
                const suggestion = await suggestUpsell(itemNames);
                setUpsellSuggestion(suggestion);
            } else {
                setUpsellSuggestion("");
            }
        }
        const timeout = setTimeout(fetchUpsell, 1500);
        return () => clearTimeout(timeout);
    }, [cart]);

    const initiateCheckout = async () => {
        if (cart.length === 0) return;
        if (!tableNumber) {
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        setIsSending(true);
        setSendError(null);

        try {
            await onCheckout('cash', tableNumber, orderNote);
            onTableChange('');
            setOrderNote('');
            setIsNoteVisible(false);
            if (window.innerWidth < 1280 && onClose) onClose();
        } catch (error) {
            console.error("Checkout failed:", error);
            setSendError("فشلت عملية إرسال الطلب. يرجى التأكد من الاتصال بالإنترنت والمحاولة مرة أخرى.");
        } finally {
            setIsSending(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!selectedMethod || !tableNumber) return;
        setIsProcessing(true);
        await onCheckout(selectedMethod, tableNumber, orderNote);
        setIsProcessing(false);
        setShowPaymentModal(false);
        onTableChange('');
        setOrderNote('');
        setIsNoteVisible(false);
        if (window.innerWidth < 1280 && onClose) onClose();
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[80] xl:hidden transition-opacity" onClick={onClose} />}

            <div className={`fixed xl:relative inset-y-0 left-0 z-[85] xl:z-10 w-full max-w-[400px] xl:w-[380px] bg-brand-cream h-full shadow-2xl flex flex-col border-r border-brand-primary/10 transition-all duration-500 transform ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}`}>

                <button onClick={onClose} className="xl:hidden absolute top-6 left-6 p-2 bg-brand-primary text-white rounded-full shadow-lg z-20"><X size={20} /></button>

                {/* Brand Header */}
                <div className="pt-10 pb-6 flex flex-col items-center justify-center border-b border-dashed border-brand-primary/10 shrink-0">
                    <div className="w-20 h-20 mb-3 drop-shadow-lg">
                        <img src="/branding/afia_logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-2xl font-black text-brand-dark tracking-tight mb-1">سوفتي كود</h2>
                    <span className="text-brand-accent text-[8px] tracking-[0.2em] uppercase font-black opacity-50">Expert POS Solutions</span>
                </div>

                {/* Table Context Bar - Professional Split Layout */}
                <div className="px-4 py-4 shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Right: Table Selection Card */}
                        <div className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm relative overflow-hidden ${tableNumber ? (isTakeaway ? 'bg-orange-50 border-orange-200' : 'bg-brand-primary/5 border-brand-primary/20 shadow-brand-primary/5') : 'bg-rose-50 border-rose-200 animate-pulse'}`}>
                            {tableNumber && (
                                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${isTakeaway ? 'bg-orange-500' : 'bg-brand-primary'} text-white shadow-md`}>
                                    <Check size={10} strokeWidth={4} />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${tableNumber ? (isTakeaway ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-brand-primary text-white shadow-brand-primary/30') : 'bg-rose-500 text-white shadow-rose-500/30'}`}>
                                {isTakeaway ? <ShoppingBag size={22} /> : <Hash size={22} />}
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mb-0.5">موقع الطلب</p>
                                <p className={`font-black text-xs ${!tableNumber ? 'text-rose-500' : 'text-brand-dark'}`}>
                                    {tableNumber ? (isTakeaway ? 'طلب سفري' : `طاولة ${tableNumber}`) : 'حدد الموقع'}
                                </p>
                            </div>
                        </div>

                        {/* Left: Guest Count Card */}
                        <div className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm ${!isTakeaway && tableNumber ? 'bg-white border-brand-primary/10' : 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'}`}>
                            <div className="flex items-center gap-2 bg-brand-light/30 rounded-xl px-2 py-1.5 border border-brand-primary/5">
                                <button
                                    onClick={() => onGuestCountChange && guestCount > 0 && onGuestCountChange(guestCount - 1)}
                                    disabled={isTakeaway || !tableNumber}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-brand-primary hover:text-white rounded-lg transition-all text-brand-dark disabled:opacity-30"
                                >
                                    <Minus size={14} />
                                </button>
                                <div className="w-8 text-center font-black text-brand-dark text-lg tabular-nums">
                                    {guestCount}
                                </div>
                                <button
                                    onClick={() => onGuestCountChange && guestCount < 30 && onGuestCountChange(guestCount + 1)}
                                    disabled={isTakeaway || !tableNumber}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-brand-primary hover:text-white rounded-lg transition-all text-brand-dark disabled:opacity-30"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mb-0.5">عدد الأشخاص</p>
                                <p className="font-black text-xs text-brand-dark">
                                    {guestCount > 0 ? `${guestCount} ضيوف` : 'غير محدد'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Notes Area */}
                <div className="px-4 pb-4 shrink-0">
                    <div className="relative group">
                        <MessageSquare size={16} className="absolute right-4 top-4 text-brand-primary/30" />
                        <textarea
                            placeholder="أي ملاحظات إضافية لهذا الطلب؟"
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            rows={1}
                            className="w-full pr-11 pl-4 py-4 bg-white border-brand-primary/5 rounded-2xl text-xs focus:ring-4 focus:ring-brand-primary/5 border-2 outline-none font-bold text-brand-dark resize-none transition-all"
                        />
                    </div>
                </div>

                {/* Scrollable Cart */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar h-0 min-h-0 bg-white/30">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-brand-dark/10 gap-2">
                            <Coffee size={48} className="opacity-20" />
                            <p className="font-black uppercase tracking-widest text-[10px]">ابدأ بإضافة الأصناف</p>
                        </div>
                    ) : (
                        cart.map((item) => {
                            const productInDb = products.find(p => p.id === item.id);
                            const maxStock = productInDb?.stock || 0;
                            const isAtLimit = item.quantity >= maxStock;

                            return (
                                <div key={item.id} className="bg-white p-4 rounded-3xl border border-brand-primary/5 shadow-sm flex flex-col gap-2 group animate-in slide-in-from-right-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-brand-dark text-xs">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-brand-primary font-black opacity-50">{formatCurrency(item.price, settings.currency)}</span>
                                                {isAtLimit && (
                                                    <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                                                        <AlertCircle size={8} /> تم الوصول للحد الأقصى
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-brand-light/10 rounded-xl p-1">
                                            <button onClick={() => decreaseQuantity(item.id)} className="w-8 h-8 rounded-lg bg-white border border-brand-primary/5 flex items-center justify-center text-brand-dark hover:bg-red-50 hover:text-red-500 duration-300"><Minus size={14} /></button>
                                            <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => addToCart(item)}
                                                disabled={isAtLimit}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isAtLimit ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-brand-primary text-white hover:shadow-lg'}`}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* AI & Summary */}
                <div className="bg-white p-6 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0 border-t border-brand-primary/5">
                    {upsellSuggestion && cart.length > 0 && (
                        <div className="mb-4 p-3 bg-brand-primary/5 border-brand-primary/10 text-brand-primary border rounded-2xl text-[10px] font-bold flex items-center gap-2 animate-pulse">
                            <Sparkles size={14} className="shrink-0" />
                            <p>{upsellSuggestion}</p>
                        </div>
                    )}

                    <div className="space-y-2 text-xs mb-5">
                        <div className="flex justify-between font-bold text-brand-dark/40">
                            <span>المجموع</span>
                            <span>{formatCurrency(subtotal, settings.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-y border-dashed border-brand-primary/10">
                            <span className="text-sm font-black text-brand-dark">الإجمالي النهائي</span>
                            <span className="text-2xl font-black text-brand-accent tracking-tighter">{formatCurrency(total, settings.currency)}</span>
                        </div>
                    </div>

                    <button
                        onClick={initiateCheckout}
                        disabled={cart.length === 0 || isSending || !tableNumber}
                        className={`w-full py-4 text-white rounded-2xl font-black text-base shadow-2xl flex items-center justify-center gap-3 transition-all ${isSending ? 'bg-brand-dark' : 'bg-gradient-to-r from-brand-primary to-brand-secondary active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed'}`}
                    >
                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                        <span>{isSending ? 'جاري الإرسال...' : 'إرسال الطلب للمطبخ'}</span>
                    </button>
                </div>
            </div>

            <StatusModal isOpen={!!sendError} onClose={() => setSendError(null)} type="error" title="فشل إرسال الطلب" message={sendError || ""} />
        </>
    );
};

export default ReceiptPanel;
