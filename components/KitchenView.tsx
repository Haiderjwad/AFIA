
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
    const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
    const [orders, setOrders] = useState<Transaction[]>([]);
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
    const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch Orders & Products
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

        const qProducts = query(collection(db, "products"), orderBy("name", "asc"));
        const unsubProducts = onSnapshot(qProducts, (snapshot) => {
            const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
            setProducts(p);
        });

        return () => {
            unsubOrders();
            unsubProducts();
        };
    }, []);


    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const updateStatus = async (orderId: string, newStatus: Transaction['status']) => {
        if (loadingOrderId) return; // prevent double clicks
        setLoadingOrderId(orderId);
        try {
            const orderRef = doc(db, "transactions", orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                kitchenPerson: user?.name || 'Kitchen'
            });

            // ════════════════════════════════════════════════════════════════
            // SAME-STAGE AUTO-MERGE LOGIC
            //
            // After updating this order's status, check if another order for
            // the SAME table is already sitting in the SAME new stage.
            // If yes → merge both into the older one and delete this newer one.
            // This handles the case: Order A is 'ready', new Order B reaches
            // 'ready' → they belong to the same table → merge cleanly.
            // ════════════════════════════════════════════════════════════════
            const currentOrder = orders.find(o => o.id === orderId);
            if (
                currentOrder?.tableNumber &&
                currentOrder.tableNumber !== 'Takeaway' &&
                (newStatus === 'ready' || newStatus === 'preparing')
            ) {
                // Find other orders for the same table that are ALREADY in this exact stage
                const sameStageOrders = orders.filter(o =>
                    o.id !== orderId &&
                    o.tableNumber === currentOrder.tableNumber &&
                    o.status === newStatus // already there — same stage
                );

                if (sameStageOrders.length > 0) {
                    // Pick the oldest as master (the one that arrived first)
                    const masterOrder = sameStageOrders.sort(
                        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                    )[0];

                    // Merge current order's items into master
                    const merged = [...masterOrder.items];
                    currentOrder.items.forEach(item => {
                        const existing = merged.find(m => m.id === item.id);
                        if (existing) {
                            existing.quantity += item.quantity;
                        } else {
                            merged.push({ ...item });
                        }
                    });

                    // Update master with merged items
                    await updateDoc(doc(db, "transactions", masterOrder.id), {
                        items: merged,
                        notes: currentOrder.notes
                            ? (masterOrder.notes ? `${masterOrder.notes} | ${currentOrder.notes}` : currentOrder.notes)
                            : masterOrder.notes,
                    });

                    // Delete the current order (it's been absorbed into master)
                    await deleteDoc(doc(db, "transactions", orderId));

                    showToast(`تم دمج الطلبات المتشابهة للطاولة ${currentOrder.tableNumber} ✓`);
                    return; // Exit early — status already updated above, then merged
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



    const handleUpdateStock = async (id: string, newStock: number) => {
        try {
            const productRef = doc(db, "products", id);
            await updateDoc(productRef, { stock: newStock });

            // If stock is very low, send an automatic notification (simulated here)
            if (newStock <= lowStockThreshold) {
                await addDoc(collection(db, "notifications"), {
                    type: 'low_stock_auto',
                    message: `تنبيه تلقائي: المنتج ${products.find(p => p.id === id)?.name} وصل لمستوى منخفض (${newStock})`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }

            setEditingProduct(null);
        } catch (error) {
            console.error("Error updating stock:", error);
        }
    };

    const handleManualWarning = async (p: MenuItem) => {
        try {
            await addDoc(collection(db, "notifications"), {
                type: 'kitchen_warning',
                message: `تنبيه حرج من المطبخ: المنتج ${p.name} شارف على الانتهاء!`,
                productName: p.name,
                timestamp: new Date().toISOString(),
                read: false,
                sender: 'الشيف: ' + (user?.name || 'المطبخ')
            });
            showToast(`تم إرسال تنذير عاجل بخصوص ${p.name}`, 'success');
        } catch (error) {
            console.error("Error sending warning:", error);
            showToast('فشل في إرسال التنبيه', 'error');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
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
                        <p className="text-brand-dark/40 font-bold text-sm">التحكم في الطلبات والمخزون الحي</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex bg-white p-2 rounded-[2rem] shadow-sm border border-brand-primary/5">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-8 py-3 rounded-[1.5rem] font-black transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-brand-primary text-white shadow-brand-primary/20 shadow-xl' : 'text-brand-dark/30 hover:text-brand-primary'}`}
                        >
                            <LayoutDashboard size={18} /> الطلبات
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-8 py-3 rounded-[1.5rem] font-black transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-brand-primary text-white shadow-brand-primary/20 shadow-xl' : 'text-brand-dark/30 hover:text-brand-primary'}`}
                        >
                            <Package size={18} /> المخزون
                        </button>
                    </div>

                    <div className={`px-6 py-3 rounded-2xl shadow-sm border flex items-center gap-3 transition-all ${isOnline ? 'bg-white border-gold-100' : 'bg-red-50 border-red-200 animate-pulse'}`}>
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`font-bold text-sm ${isOnline ? 'text-coffee-900' : 'text-red-700'}`}>
                            {isOnline ? 'متصل' : 'أوفلاين'}
                        </span>
                    </div>
                </div>
            </div>

            {activeTab === 'orders' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
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
                                                        <span className="text-[10px] font-black tracking-widest uppercase">Special Note</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {order.notes && (
                                            <div className="mb-4 p-3 bg-gold-50 border border-gold-100 rounded-2xl text-xs text-coffee-800 font-bold leading-relaxed">
                                                {order.notes}
                                            </div>
                                        )}

                                        <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 space-y-3 mb-6">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="bg-coffee-900 text-white w-7 h-7 rounded-lg flex items-center justify-center font-bold">{item.quantity}</span>
                                                    <span className="text-coffee-900 font-bold">{item.name}</span>
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
                                            <div className="text-[10px] font-black text-brand-dark/20 uppercase tracking-widest">
                                                Sales Dept
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
            ) : (
                /* Inventory Tab for Kitchen */
                <div className="flex-1 flex flex-col bg-white rounded-[3rem] shadow-xl border border-gold-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
                        <div>
                            <h2 className="text-2xl font-bold text-coffee-900">إدارة توفر الوجبات</h2>
                            <p className="text-gray-500 text-sm">تعديل كمية المكونات والوجبات المتوفرة حالياً</p>
                        </div>
                        <div className="relative w-full max-w-md">
                            <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث عن وجبة أو مكون..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-gold-500 transition-all font-bold placeholder-gray-300 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 premium-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                            {filteredProducts.map(p => {
                                const isLow = p.stock <= lowStockThreshold;
                                return (
                                    <div key={p.id} className={`group bg-white rounded-[3rem] p-8 shadow-xl border border-transparent hover:border-brand-primary/20 transition-all hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col justify-between ${isLow ? 'ring-2 ring-red-500/20 bg-red-50/10' : ''}`}>

                                        {/* Decorative Background for Urgency */}
                                        {isLow && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-[5rem] -mr-8 -mt-8 animate-pulse"></div>
                                        )}

                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-2xl shadow-lg transform group-hover:rotate-6 transition-transform ${isLow ? 'bg-red-500 text-white' : 'bg-brand-light/30 text-brand-primary'}`}>
                                                    {p.category.toLowerCase().includes('قهوة') ? '☕' :
                                                        p.category.toLowerCase().includes('حلا') ? '🍰' :
                                                            p.category.toLowerCase().includes('مشروب') ? '🥤' : '🥗'}
                                                </div>
                                                {isLow && (
                                                    <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black shadow-lg shadow-red-500/20 animate-bounce">
                                                        <AlertTriangle size={12} /> نفاد وشيك
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-black text-brand-dark mb-1 group-hover:text-brand-primary transition-colors">{p.name}</h3>
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full"></div>
                                                <span className="text-[10px] font-black text-brand-dark/20 uppercase tracking-widest">{p.category}</span>
                                            </div>

                                            <div className={`p-6 rounded-3xl flex justify-between items-center mb-8 border transition-colors ${isLow ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">المخزون المتوفر</span>
                                                    <span className={`text-3xl font-black ${isLow ? 'text-red-600' : 'text-brand-dark'}`}>{p.stock}</span>
                                                </div>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLow ? 'bg-red-200 text-red-600' : 'bg-brand-primary/10 text-brand-primary'}`}>
                                                    <Package size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-3">
                                            <button
                                                onClick={() => setEditingProduct(p)}
                                                className="col-span-2 py-4 bg-brand-dark text-white rounded-2xl text-[10px] font-black hover:bg-brand-primary transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                                            >
                                                <Edit3 size={14} /> تحديث
                                            </button>
                                            <button
                                                onClick={() => handleManualWarning(p)}
                                                className={`col-span-3 py-4 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-2 border-2 active:scale-95 shadow-lg ${isLow
                                                    ? 'bg-red-600 text-white border-red-600 shadow-red-200 animate-pulse'
                                                    : 'bg-white text-brand-dark border-brand-dark/10 hover:border-brand-primary hover:text-brand-primary'
                                                    }`}
                                            >
                                                <Bell size={14} /> تنبيه الإدارة للمبيعات
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Stock Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-[200] bg-coffee-900/40 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-coffee-50 text-coffee-900 rounded-3xl mx-auto flex items-center justify-center mb-6">
                                <Package size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-coffee-900 mb-1">{editingProduct.name}</h2>
                            <p className="text-gray-400 text-sm mb-8">تحديث توفر المنتج في المطبخ</p>

                            <div className="flex items-center justify-center gap-6 mb-10">
                                <button
                                    onClick={() => setEditingProduct({ ...editingProduct, stock: Math.max(0, editingProduct.stock - 1) })}
                                    className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-2xl font-bold"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={editingProduct.stock}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                                    className="w-24 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-center text-3xl font-black text-coffee-900 focus:border-gold-500 outline-none"
                                />
                                <button
                                    onClick={() => setEditingProduct({ ...editingProduct, stock: editingProduct.stock + 1 })}
                                    className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all text-2xl font-bold"
                                >
                                    +
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-200 transition-all">إلغاء</button>
                                <button
                                    onClick={() => handleUpdateStock(editingProduct.id, editingProduct.stock)}
                                    className="flex-1 py-4 bg-coffee-900 text-white rounded-2xl font-bold shadow-lg shadow-coffee-900/20 hover:bg-gold-600 transition-all"
                                >
                                    حفظ التحديث
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KitchenView;
