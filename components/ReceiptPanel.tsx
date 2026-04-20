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

        // If sales, just send to kitchen directly
        if (['sales', 'kitchen'].includes(userRole)) {
            onCheckout('cash', tableNumber, orderNote);
            return;
        }

        // If admin/manager/cashier, show payment modal for direct checkout
        setShowPaymentModal(true);
        setSelectedMethod(null);
        setCashReceived('');
        setIsProcessing(false);
    };

    const handleConfirmPayment = async () => {
        if (!selectedMethod) return;

        setIsProcessing(true);
        await onCheckout(selectedMethod, tableNumber, orderNote);
        setIsProcessing(false);
        setShowPaymentModal(false);
        setUpsellSuggestion("");
        setTableNumber('');
        setOrderNote('');
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
                : `bg-white border-gray-100 text-gray-400 hover:text-gray-800 hover:border-gold-300`
                }`}
        >
            <Icon size={32} />
            <span className="font-bold">{label}</span>
        </button>
    );

    return (
        <>
            <div className="w-[380px] bg-[#fbf8f3] h-full shadow-2xl flex flex-col border-r border-gold-200 relative z-10 transition-colors duration-500">

                {/* Header / Logo */}
                <div className="pt-10 pb-6 flex flex-col items-center justify-center border-b border-dashed border-gold-300 shrink-0">
                    <div className="bg-gradient-to-br from-gold-400 to-gold-600 w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-4 ring-4 ring-gold-100">
                        <Coffee size={40} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-coffee-900 tracking-wide font-sans mb-1">{settings.storeName}</h2>
                    <span className="text-gold-600 text-sm tracking-widest uppercase font-bold">Specialty Coffee House</span>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                            <Coffee size={48} />
                            <p>السلة فارغة</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="bg-white border-gold-100 p-3 rounded-xl shadow-sm border flex justify-between items-center group animate-in slide-in-from-right-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-coffee-900 text-sm">{item.name}</span>
                                    <span className="text-xs text-gray-500">{item.price.toFixed(2)} {currency}</span>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1">
                                    <button
                                        onClick={() => decreaseQuantity(item.id)}
                                        className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-coffee-900 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => addToCart(item)}
                                        className="w-6 h-6 rounded-full bg-coffee-900 text-white flex items-center justify-center hover:bg-gold-500 transition-colors"
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
                    <div className="mx-4 mb-2 p-3 bg-gold-100/50 border-gold-200 text-coffee-900 border rounded-xl text-xs flex items-start gap-2 animate-pulse">
                        <Sparkles size={14} className="mt-0.5 text-gold-600 shrink-0" />
                        <p>{upsellSuggestion}</p>
                    </div>
                )}



                {/* Table & Notes Selection */}
                <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                         <div className="relative">
                            <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                            <input 
                                type="text"
                                placeholder="رقم الطاولة"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full pr-10 pl-3 py-2.5 bg-white border border-gold-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none font-bold text-coffee-900"
                            />
                        </div>
                        <div className="relative">
                            <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-600" size={16} />
                            <input 
                                type="text"
                                placeholder="ملاحظة"
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                className="w-full pr-10 pl-3 py-2.5 bg-white border border-gold-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none font-bold text-coffee-900"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="bg-white p-6 rounded-t-[2.5rem] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] relative shrink-0">

                    {/* Decorative notch */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-gray-200 rounded-full"></div>

                    <div className="space-y-3 text-sm mb-6">
                        <div className="flex justify-between text-gray-600">
                            <span>المجموع الفرعي</span>
                            <span className="font-medium text-coffee-900">{subtotal.toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>الضريبة ({settings.taxRate}%)</span>
                            <span className="font-medium text-coffee-900">{tax.toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between text-red-400">
                            <span>الخصم</span>
                            <span>-{discount.toFixed(2)} {currency}</span>
                        </div>
                        <div className="h-px bg-dashed border-t border-gray-200 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-coffee-900">إجمالي</span>
                            <span className="text-2xl font-bold text-gold-600">{total.toFixed(2)} {currency}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={initiateCheckout}
                            disabled={cart.length === 0}
                            className={`w-full py-4 text-white rounded-xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${['sales', 'kitchen'].includes(userRole)
                                ? 'bg-gradient-to-r from-coffee-800 to-coffee-900 shadow-coffee-900/20'
                                : 'bg-gradient-to-r from-gold-500 to-gold-600 shadow-gold-500/30'
                                }`}
                        >
                            {['sales', 'kitchen'].includes(userRole) ? (
                                <>
                                    <Coffee size={20} />
                                    إرسال للمطبخ
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    تأكيد والدفع
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] bg-coffee-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="bg-coffee-900 text-white p-6 flex justify-between items-center">
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
                                <span className="text-4xl font-extrabold text-gold-600">{total.toFixed(2)} {currency}</span>
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
                                                    <h4 className="font-bold text-coffee-900">الدفع النقدي</h4>
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
                                                    className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 outline-none bg-gray-50 text-coffee-900 border-gold-200 focus:border-gold-500"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            {cashReceived && (
                                                <div className={`p-4 rounded-xl text-center border-2 ${change >= 0 ? 'bg-gold-50 border-gold-200' : 'bg-red-50 border-red-200'}`}>
                                                    <span className="block text-sm text-gray-500 mb-1">{change >= 0 ? 'الباقي للعميل' : 'المبلغ الناقص'}</span>
                                                    <span className={`text-2xl font-bold ${change >= 0 ? 'text-coffee-900' : 'text-red-600'}`}>
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
                                                <h4 className="font-bold text-xl text-coffee-900">بانتظار الدفع...</h4>
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
                                            className="flex-[2] py-4 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-coffee-900 hover:bg-gold-600"
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
