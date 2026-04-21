import React, { useState, useEffect } from 'react';
import { CartItem, MenuItem, AppSettings } from '../types';
import { Plus, Minus, Sparkles, Coffee, CreditCard, Loader2, Banknote, Wifi, ArrowLeft, Check, AlertCircle, Hash, MessageSquare } from 'lucide-react';
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
}

const ReceiptPanel: React.FC<ReceiptPanelProps> = ({
    cart,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    onClear,
    onCheckout,
    settings,
    userRole
}) => {
    const [upsellSuggestion, setUpsellSuggestion] = useState<string>("");

    // Payment Logic States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'online' | null>(null);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [tableNumber, setTableNumber] = useState<string>('');
    const [orderNote, setOrderNote] = useState<string>('');
    const [isNoteVisible, setIsNoteVisible] = useState(false);
    const [isTakeaway, setIsTakeaway] = useState(false);
    const [showError, setShowError] = useState(false);


    const currency = settings.currency;
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * (settings.taxRate / 100);
    const discount = 0; // Placeholder
    const total = subtotal + tax - discount;
    const change = cashReceived ? parseFloat(cashReceived) - total : 0;

    // AI Upsell Hook
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
        // Debounce slightly to avoid too many calls
        const timeout = setTimeout(fetchUpsell, 1500);
        return () => clearTimeout(timeout);
    }, [cart]);

    const initiateCheckout = () => {
        if (cart.length === 0) return;

        if (!isTakeaway && !tableNumber) {
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        // Bypass payment selection and send directly to kitchen/system
        onCheckout('cash', isTakeaway ? 'Takeaway' : tableNumber, orderNote);
        setTableNumber('');
        setOrderNote('');
        setIsNoteVisible(false);
        setIsTakeaway(false);
    };


    const handleConfirmPayment = async () => {
        if (!selectedMethod) return;

        if (!isTakeaway && !tableNumber) {
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            return;
        }

        setIsProcessing(true);
        await onCheckout(selectedMethod, isTakeaway ? 'Takeaway' : tableNumber, orderNote);
        setIsProcessing(false);
        setShowPaymentModal(false);
        setUpsellSuggestion("");
        setTableNumber('');
        setOrderNote('');
        setIsNoteVisible(false);
        setIsTakeaway(false);
    };


    // Helper to render payment method button
    const PaymentMethodButton = ({
        method,
        label,
        icon: Icon,
        colorClass
    }: {
        method: 'cash' | 'card' | 'online',
        label: string,
        icon: React.ElementType,
        colorClass: string
    }) => (
        <button
            onClick={() => setSelectedMethod(method)}
            className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${selectedMethod === method
                ? `${colorClass} border-transparent text-white shadow-lg scale-105`
                : `bg-white border-gray-100 text-gray-400 hover:text-brand-dark hover:border-brand-secondary`
                }`}
        >
            <Icon size={32} />
            <span className="font-bold">{label}</span>
        </button>
    );

    return (
        <>
            <div className="w-[380px] bg-brand-cream h-full shadow-2xl flex flex-col border-r border-brand-primary/10 relative z-10 transition-colors duration-500">

                {/* Header / Logo */}
                <div className="pt-10 pb-6 flex flex-col items-center justify-center border-b border-dashed border-brand-primary/10 shrink-0">
                    <div className="w-24 h-24 mb-4 drop-shadow-xl hover:scale-110 transition-transform duration-300">
                        <img src="/branding/afia_logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-3xl font-black text-brand-dark tracking-tight mb-1">{"ألف عافية"}</h2>
                    <span className="text-brand-accent text-xs tracking-[0.2em] uppercase font-black">Digital POS System</span>
                </div>

                {/* Takeaway Toggle */}
                <div className="px-4 py-2 shrink-0">
                    <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${isTakeaway ? 'bg-brand-primary/10 border-brand-primary' : 'bg-white border-brand-primary/5 hover:border-brand-primary/20'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isTakeaway ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-primary/10 text-brand-primary'}`}>
                                <Coffee size={20} />
                            </div>
                            <span className={`font-black text-sm ${isTakeaway ? 'text-brand-dark' : 'text-brand-dark/40'}`}>طلب سفري (Takeaway)</span>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={isTakeaway}
                                onChange={(e) => {
                                    setIsTakeaway(e.target.checked);
                                    if (e.target.checked) setTableNumber('');
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                        </div>
                    </label>
                </div>

                {/* Table & Notes Selection */}
                <div className="px-4 py-4 border-b border-brand-primary/5 bg-white/50 space-y-3 shrink-0">
                    <div className="flex items-center gap-2">
                        {/* Table Selection Dropdown */}
                        <div className={`flex-1 relative group transition-all ${isTakeaway ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-brand-secondary transition-colors">
                                <Hash size={18} className="text-brand-primary" />
                            </div>
                            <select
                                disabled={isTakeaway}
                                value={isTakeaway ? "" : tableNumber}
                                onChange={(e) => {
                                    setTableNumber(e.target.value);
                                    setShowError(false);
                                }}
                                className={`w-full pr-10 pl-10 py-3 bg-white border-2 rounded-2xl text-sm outline-none font-bold text-brand-dark appearance-none transition-all shadow-sm ${!isTakeaway && showError ? 'border-red-500 ring-4 ring-red-500/10' : 'border-brand-primary/10 focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary'} ${isTakeaway ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <option value="" disabled>{isTakeaway ? 'طلب سفري نشط' : 'اختر رقم الطاولة (إجباري)'}</option>
                                {Array.from({ length: settings.tablesCount || 0 }).map((_, i) => (
                                    <option key={i + 1} value={`${i + 1}`}>طاولة {i + 1}</option>
                                ))}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <ArrowLeft size={16} className="-rotate-90" />
                            </div>
                        </div>


                        {/* Note Toggle Button */}
                        <button
                            onClick={() => setIsNoteVisible(!isNoteVisible)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isNoteVisible || orderNote ? 'bg-brand-primary text-white shadow-lg' : 'bg-white border-2 border-brand-primary/10 text-brand-primary/40 hover:border-brand-primary/40 hover:text-brand-primary'}`}
                            title="إضافة ملاحظة للطلب"
                        >
                            <MessageSquare size={20} />
                        </button>
                    </div>

                    {/* Expandable Note Area */}
                    {isNoteVisible && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <div className="relative">
                                <textarea
                                    placeholder="اكتب ملاحظة الطلب هنا (مثال: بدون سكر، زيادة ثلج...)"
                                    value={orderNote}
                                    onChange={(e) => setOrderNote(e.target.value)}
                                    rows={2}
                                    className="w-full p-4 bg-white border-2 border-brand-primary/10 rounded-2xl text-xs focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold text-brand-dark resize-none shadow-inner"
                                />
                                <div className="absolute bottom-3 left-3 text-[10px] text-brand-primary/30 font-black">NOTE</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Items Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar h-0 min-h-0">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-brand-dark/20 gap-4 opacity-50">
                            <div className="w-20 h-20 opacity-20 grayscale">
                                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
                            </div>
                            <p className="font-bold uppercase tracking-widest text-xs">السلة فارغة</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="bg-white border-brand-primary/5 p-4 rounded-2xl shadow-sm border flex justify-between items-center group animate-in slide-in-from-right-2 hover:shadow-md transition-all">
                                <div className="flex flex-col">
                                    <span className="font-bold text-brand-dark text-sm">{item.name}</span>
                                    <span className="text-xs text-brand-dark/40">{item.price.toFixed(2)} {currency}</span>
                                </div>

                                <div className="flex items-center gap-3 bg-brand-light/20 rounded-xl px-2 py-1">
                                    <button
                                        onClick={() => decreaseQuantity(item.id)}
                                        className="w-7 h-7 rounded-lg bg-white border border-brand-primary/10 flex items-center justify-center text-brand-dark hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => addToCart(item)}
                                        className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center hover:bg-brand-secondary transition-colors shadow-md"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* AI Suggestion Area */}
                {upsellSuggestion && cart.length > 0 && (
                    <div className="mx-4 mb-2 p-3 bg-brand-light/20 border-brand-primary/10 text-brand-dark border rounded-xl text-xs flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <Sparkles size={14} className="mt-0.5 text-brand-secondary shrink-0" />
                        <p>{upsellSuggestion}</p>
                    </div>
                )}

                {/* Summary Section */}
                <div className="bg-white p-6 rounded-t-[2.5rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] relative shrink-0">

                    {/* Decorative notch */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-gray-200 rounded-full"></div>

                    <div className="space-y-3 text-sm mb-6">
                        <div className="flex justify-between text-brand-dark/60">
                            <span>المجموع الفرعي</span>
                            <span className="font-bold text-brand-dark">{subtotal.toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-brand-dark/60">
                            <span>الضريبة ({settings.taxRate}%)</span>
                            <span className="font-bold text-brand-dark">{tax.toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-red-500 font-bold">
                            <span>الخصم</span>
                            <span>-{discount.toFixed(2)} {currency}</span>
                        </div>
                        <div className="h-px bg-dashed border-t border-brand-primary/10 my-4"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-black text-brand-dark">إجمالي</span>
                            <span className="text-3xl font-black text-brand-accent drop-shadow-sm">{total.toFixed(2)} {currency}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={initiateCheckout}
                            disabled={cart.length === 0}
                            className={`w-full py-5 text-white rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-gradient-to-r from-brand-primary to-brand-secondary shadow-brand-primary/30`}
                        >
                            <Coffee size={22} />
                            ارسال الطلب
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                {isProcessing ? 'جاري المعالجة...' : 'اختيار طريقة الدفع'}
                            </h2>
                            <button onClick={() => !isProcessing && setShowPaymentModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                        </div>

                        <div className="p-8">

                            {/* Amount Display */}
                            <div className="text-center mb-8">
                                <span className="text-gray-500 block text-sm mb-1">المبلغ الإجمالي المستحق</span>
                                <span className="text-4xl font-extrabold text-brand-primary">{total.toFixed(2)} {currency}</span>
                            </div>

                            {!selectedMethod ? (
                                // Method Selection
                                <div className="grid grid-cols-2 gap-4">
                                    {settings.paymentMethods.cash && (
                                        <PaymentMethodButton
                                            method="cash"
                                            label="نقد (Cash)"
                                            icon={Banknote}
                                            colorClass="bg-green-600"
                                        />
                                    )}
                                    {settings.paymentMethods.card && (
                                        <PaymentMethodButton
                                            method="card"
                                            label="بطاقة (Card)"
                                            icon={CreditCard}
                                            colorClass="bg-blue-600"
                                        />
                                    )}
                                    {settings.paymentMethods.online && (
                                        <PaymentMethodButton
                                            method="online"
                                            label="دفع إلكتروني"
                                            icon={Wifi}
                                            colorClass="bg-purple-600"
                                        />
                                    )}
                                    {(!settings.paymentMethods.cash && !settings.paymentMethods.card && !settings.paymentMethods.online) && (
                                        <div className="col-span-2 text-center text-gray-400 py-8 border-2 border-dashed rounded-2xl">
                                            <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                                            <p>لا توجد طرق دفع مفعلة في الإعدادات</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Specific Method Interface
                                <div className="space-y-6 animate-in slide-in-from-right-4">

                                    {/* CASH INTERFACE */}
                                    {selectedMethod === 'cash' && (
                                        <div className="space-y-4">
                                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-4">
                                                <div className="bg-green-500 text-white p-3 rounded-full">
                                                    <Banknote size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-brand-dark">الدفع النقدي</h4>
                                                    <p className="text-xs text-gray-500">أدخل المبلغ المستلم من العميل</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">المبلغ المستلم</label>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={cashReceived}
                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                    className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 outline-none bg-gray-50 text-brand-dark border-brand-primary/20 focus:border-brand-primary"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            {cashReceived && (
                                                <div className={`p-4 rounded-xl text-center border-2 ${change >= 0 ? 'bg-brand-light/30 border-brand-primary/20' : 'bg-red-50 border-red-200'}`}>
                                                    <span className="block text-sm text-gray-500 mb-1">{change >= 0 ? 'الباقي للعميل' : 'المبلغ الناقص'}</span>
                                                    <span className={`text-2xl font-bold ${change >= 0 ? 'text-brand-dark' : 'text-red-600'}`}>
                                                        {Math.abs(change).toFixed(2)} {currency}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* CARD / ONLINE INTERFACE */}
                                    {(selectedMethod === 'card' || selectedMethod === 'online') && (
                                        <div className="text-center py-8 space-y-4">
                                            <div className="relative w-24 h-24 mx-auto">
                                                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                                <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${selectedMethod === 'card' ? 'border-blue-500' : 'border-purple-500'}`}></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    {selectedMethod === 'card' ? <CreditCard size={32} className="text-blue-500" /> : <Wifi size={32} className="text-purple-500" />}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xl text-brand-dark">بانتظار الدفع...</h4>
                                                <p className="text-gray-500 text-sm">يرجى توجيه العميل لجهاز الدفع</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setSelectedMethod(null)}
                                            disabled={isProcessing}
                                            className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            تغيير الطريقة
                                        </button>
                                        <button
                                            onClick={handleConfirmPayment}
                                            disabled={isProcessing || (selectedMethod === 'cash' && change < 0)}
                                            className="flex-[2] py-4 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-primary"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" /> : <Check />}
                                            {selectedMethod === 'cash' ? 'إتمام العملية' : 'تأكيد الاستلام'}
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReceiptPanel;
