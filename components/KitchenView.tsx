
import React, { useState, useEffect } from 'react';
import { Transaction, MenuItem, AppSettings } from '../types';
import { onSnapshot, collection, query, where, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
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
    lowStockThreshold?: number;
}

const KitchenView: React.FC<KitchenViewProps> = ({ isOnline, lowStockThreshold = 10 }) => {
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
            await updateDoc(orderRef, { status: newStatus });
            const statusLabels: Record<string, string> = {
                preparing: 'جاري العمل على الطلب',
                ready: 'الطلب جاهز للتسليم ✓',
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
                message: `تنبيه من المطبخ: المنتج ${p.name} على وشك النفاد!`,
                productName: p.name,
                timestamp: new Date().toISOString(),
                read: false,
                sender: 'المطبخ'
            });
            alert(`تم إرسال تنبيه لقسم المبيعات بخصوص: ${p.name}`);
        } catch (error) {
            console.error("Error sending warning:", error);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#fdfaf7]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="text-coffee-900 font-bold">جاري تحميل شاشة المطبخ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 bg-[#fdfaf7] overflow-y-auto flex flex-col h-screen" dir="rtl">

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm transition-all animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-500'
                    : 'bg-gradient-to-r from-red-600 to-rose-500'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div className="flex items-center gap-4 text-right">
                    <div className="bg-coffee-900 p-3 rounded-2xl text-white shadow-xl">
                        <ChefHat size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-coffee-900">مركز إدارة المطبخ</h1>
                        <p className="text-gray-500">التحكم في الطلبات والمخزون الحي</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gold-100">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-coffee-900 text-white shadow-lg' : 'text-gray-400 hover:text-coffee-900'}`}
                        >
                            <LayoutDashboard size={18} /> الطلبات
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-coffee-900 text-white shadow-lg' : 'text-gray-400 hover:text-coffee-900'}`}
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
                                                    <span className="font-black text-coffee-900 text-2xl">
                                                        {order.tableNumber ? `طاولة ${order.tableNumber}` : `#${order.id.slice(-4)}`}
                                                    </span>
                                                </div>
                                                <div className="text-gray-400 text-xs font-bold">{new Date(order.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="bg-gray-100 px-4 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase">
                                                    {order.paymentMethod === 'cash' ? 'نقد' : 'بطاقة'}
                                                </div>
                                                {order.notes && (
                                                    <div className="flex items-center gap-1 text-gold-600 bg-gold-50 px-3 py-1 rounded-lg border border-gold-100 animate-pulse">
                                                        <MessageSquare size={12} />
                                                        <span className="text-[10px] font-bold">ملاحظة</span>
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

                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {filteredProducts.map(p => {
                                const isLow = p.stock <= lowStockThreshold;
                                return (
                                    <div key={p.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between ${isLow ? 'bg-red-50/30 border-red-100' : 'bg-white border-gray-50 hover:border-gold-200'}`}>
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-coffee-50 rounded-2xl flex items-center justify-center text-xl">🥗</div>
                                                {isLow && (
                                                    <div className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                                                        <AlertTriangle size={12} /> منخفض
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-coffee-900 mb-1">{p.name}</h3>
                                            <span className="text-xs text-gray-400 mb-5 block">{p.category}</span>

                                            <div className="bg-gray-100 p-4 rounded-2xl flex justify-between items-center mb-6">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">المخزون الحالي</span>
                                                <span className={`text-2xl font-black ${isLow ? 'text-red-600' : 'text-coffee-900'}`}>{p.stock}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setEditingProduct(p)}
                                                className="w-full py-3 bg-coffee-900 text-white rounded-xl text-xs font-bold hover:bg-gold-600 transition-all flex items-center justify-center gap-2 shadow-md"
                                            >
                                                <Edit3 size={14} /> تعديل الكمية
                                            </button>
                                            <button
                                                onClick={() => handleManualWarning(p)}
                                                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 ${isLow ? 'bg-red-600 text-white border-red-600 shadow-red-200 shadow-lg' : 'bg-white text-coffee-900 border-coffee-900 hover:bg-coffee-900 hover:text-white'
                                                    }`}
                                            >
                                                <Bell size={14} /> تنبيه المبيعات
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
