
import React, { useState, useEffect } from 'react';
import { Transaction, MenuItem, Employee } from '../types';
import { onSnapshot, collection, query, where, orderBy, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ChefHat, Clock, CheckCircle2, AlertTriangle,
    UtensilsCrossed, Package, Bell, Search,
    Edit3, WifiOff, LayoutDashboard, History,
    CheckCircle, MessageSquare, Loader2
} from 'lucide-react';
import { CURRENCY } from '../constants';

interface KitchenViewProps {
    isOnline: boolean;
    user: Employee | null;
    lowStockThreshold?: number;
}

const KitchenView: React.FC<KitchenViewProps> = ({ isOnline, user, lowStockThreshold = 10 }) => {
    const [orders, setOrders] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch Orders
    useEffect(() => {
        const qOrders = query(
            collection(db, "transactions"),
            where("status", "in", ["pending", "preparing", "ready"])
        );

        const unsubOrders = onSnapshot(qOrders, (snapshot) => {
            const o = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
            // Sort in memory to avoid needing a composite index in Firestore
            o.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setOrders(o);
            setLoading(false);
        });

        return () => {
            unsubOrders();
        };
    }, []);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const updateStatus = async (orderId: string, newStatus: Transaction['status']) => {
        if (loadingOrderId) return;
        setLoadingOrderId(orderId);
        try {
            const orderRef = doc(db, "transactions", orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                kitchenPerson: user?.name || 'Kitchen'
            });

            // ════════════════════════════════════════════════════════════════
            // SAME-STAGE AUTO-MERGE LOGIC
            // ════════════════════════════════════════════════════════════════
            const currentOrder = orders.find(o => o.id === orderId);
            if (
                currentOrder?.tableNumber &&
                currentOrder.tableNumber !== 'Takeaway' &&
                (newStatus === 'ready' || newStatus === 'preparing')
            ) {
                const sameStageOrders = orders.filter(o =>
                    o.id !== orderId &&
                    o.tableNumber === currentOrder.tableNumber &&
                    o.status === newStatus
                );

                if (sameStageOrders.length > 0) {
                    const masterOrder = sameStageOrders.sort(
                        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                    )[0];

                    const merged = [...masterOrder.items];
                    currentOrder.items.forEach(item => {
                        const existing = merged.find(m => m.id === item.id);
                        if (existing) {
                            existing.quantity += item.quantity;
                        } else {
                            merged.push({ ...item });
                        }
                    });

                    await updateDoc(doc(db, "transactions", masterOrder.id), {
                        items: merged,
                        notes: currentOrder.notes
                            ? (masterOrder.notes ? `${masterOrder.notes} | ${currentOrder.notes}` : currentOrder.notes)
                            : masterOrder.notes,
                    });

                    await deleteDoc(doc(db, "transactions", orderId));
                    showToast(`تم دمج الطلبات المتشابهة للطاولة ${currentOrder.tableNumber} ✓`);
                    return;
                }
            }

            const statusLabels: Record<string, string> = {
                preparing: 'جاري العمل على الطلب 👨‍🍳',
                ready: 'الطلب جاهز للتسليم ✅',
                completed: 'تم تسليم الطلب',
            };
            showToast(statusLabels[newStatus] || 'تم تحديث الحالة');
        } catch (error) {
            console.error("Error updating order status:", error);
            showToast('حدث خطأ أثناء تحديث الحالة', 'error');
        } finally {
            setLoadingOrderId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-brand-cream">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                    <p className="text-brand-dark font-black animate-pulse">جاري تحميل شاشة المطبخ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 bg-brand-cream overflow-y-auto no-scrollbar relative flex flex-col h-screen" dir="rtl">
            {/* Background Patterns (Subtle) */}
            <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm transition-all animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success'
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary'
                    : 'bg-gradient-to-r from-brand-accent to-orange-600'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div className="flex items-center gap-4 text-right">
                    <div className="bg-brand-primary p-4 rounded-[2rem] text-white shadow-xl shadow-brand-primary/20">
                        <ChefHat size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark mb-1">مركز إدارة المطبخ</h1>
                        <p className="text-brand-dark/40 font-bold text-sm">التحكم في الطلبات المباشرة</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className={`px-6 py-3 rounded-2xl shadow-sm border border-brand-primary/10 bg-white flex items-center gap-3 transition-all ${isOnline ? '' : 'bg-red-50 border-red-200 animate-pulse'}`}>
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`font-bold text-sm ${isOnline ? 'text-brand-dark' : 'text-red-700'}`}>
                            {isOnline ? 'البث المباشر متصل' : 'أوفلاين'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Orders Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {['pending', 'preparing', 'ready'].map((status) => (
                    <div key={status} className="flex flex-col">
                        <div className={`p-5 rounded-2xl flex items-center justify-between mb-6 shadow-sm text-white ${status === 'pending' ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                            status === 'preparing' ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                                'bg-gradient-to-r from-green-600 to-green-500'
                            }`}>
                            <span className="bg-white/20 px-3 py-1 rounded-full font-bold text-sm">
                                {orders.filter(o => o.status === status).length}
                            </span>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg">
                                    {status === 'pending' ? 'بانتظار التحضير' :
                                        status === 'preparing' ? 'جاري العمل' :
                                            'جاهز للتسليم'}
                                </h3>
                                {status === 'pending' ? <Clock size={20} /> : status === 'preparing' ? <ChefHat size={20} /> : <CheckCircle2 size={20} />}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {orders.filter(o => o.status === status).map(order => (
                                <div key={order.id} className={`bg-white rounded-[2.5rem] p-6 shadow-md border-r-8 transition-all hover:shadow-xl ${status === 'pending' ? 'border-orange-500' :
                                    status === 'preparing' ? 'border-blue-500' :
                                        'border-green-500'
                                    }`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-brand-dark text-3xl">
                                                    {order.tableNumber === 'Takeaway' ? 'طلب سفري 🛍️' :
                                                        order.tableNumber ? `طاولة ${order.tableNumber}` :
                                                            `#${order.id.slice(-4)}`}
                                                </span>
                                            </div>
                                            <div className="text-brand-dark/30 text-xs font-black">{new Date(order.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="bg-brand-light/30 px-4 py-1 rounded-full text-[10px] font-black text-brand-primary uppercase">
                                                {order.paymentMethod === 'cash' ? 'نقد' : 'بطاقة'}
                                            </div>
                                            {order.notes && (
                                                <div className="flex items-center gap-1 text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-lg border border-brand-accent/10 animate-pulse">
                                                    <MessageSquare size={12} />
                                                    <span className="text-[10px] font-black tracking-widest uppercase">ملاحظة خاصة</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {order.notes && (
                                        <div className="mb-4 p-3 bg-brand-accent/5 border border-brand-accent/10 rounded-2xl text-xs text-brand-dark font-bold leading-relaxed">
                                            {order.notes}
                                        </div>
                                    )}

                                    <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-3 mb-6">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="bg-brand-dark text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold">{item.quantity}</span>
                                                <span className="text-brand-dark font-bold">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black uppercase ring-2 ring-white shadow-sm">
                                                {order.salesPerson?.charAt(0) || 'S'}
                                            </div>
                                            <span className="text-[10px] font-bold">بواسطة: {order.salesPerson || 'غير معروف'}</span>
                                        </div>
                                    </div>

                                    {status !== 'ready' && (
                                        <button
                                            onClick={() => updateStatus(order.id, status === 'pending' ? 'preparing' : 'ready')}
                                            disabled={loadingOrderId === order.id}
                                            className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed ${status === 'pending'
                                                ? 'bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-200'
                                                : 'bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200'
                                                }`}
                                        >
                                            {loadingOrderId === order.id ? (
                                                <><Loader2 size={20} className="animate-spin" /> جاري التحديث...</>
                                            ) : status === 'pending' ? (
                                                <><ChefHat size={20} /> ابدأ التحضير الآن</>
                                            ) : (
                                                <><CheckCircle size={20} /> جاهز للتسليم</>
                                            )}
                                        </button>
                                    )}
                                    {status === 'ready' && (
                                        <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 text-green-700 text-center py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                                            <CheckCircle2 size={20} className="text-green-500" /> جاهز — بانتظار استلام المبيعات
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KitchenView;
