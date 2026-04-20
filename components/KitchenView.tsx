import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { onSnapshot, collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ChefHat, Clock, CheckCircle2, AlertCircle, UtensilsCrossed, ArrowLeftRight, BellRing } from 'lucide-react';

interface OrderCardProps {
    order: Transaction;
    onUpdateStatus: (id: string, status: Transaction['status']) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
    const timeAgo = Math.floor((new Date().getTime() - new Date(order.date).getTime()) / 60000);
    const isLate = timeAgo > 15 && order.status !== 'ready';

    return (
        <div className={`bg-white rounded-2xl p-5 shadow-md border-r-4 mb-4 animate-in slide-in-from-right-4 transition-all hover:shadow-lg
      ${order.status === 'pending' ? 'border-orange-500' :
                order.status === 'preparing' ? 'border-blue-500' : 'border-green-500'}
    `}>
            <div className="flex justify-between items-start mb-4">
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        {isLate && <AlertCircle size={16} className="text-red-500 animate-pulse" />}
                        <span className="font-bold text-coffee-900 text-lg">#{order.id.slice(-4)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-1 justify-end">
                        منذ {timeAgo} دقيقة
                        <Clock size={12} />
                    </div>
                </div>
                <div className="text-left font-bold text-gold-600">
                    {order.paymentMethod === 'cash' ? 'كاش' : 'بطاقة'}
                </div>
            </div>

            <div className="space-y-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100 text-right">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="bg-coffee-800 text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold">
                            {item.quantity}
                        </span>
                        <span className="text-coffee-900 font-bold">{item.name}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                {order.status === 'pending' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <ChefHat size={18} /> بدأ التحضير
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button
                        onClick={() => onUpdateStatus(order.id, 'ready')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} /> جاهز للاستلام
                    </button>
                )}
                {order.status === 'ready' && (
                    <div className="flex-1 flex flex-col items-center gap-1 text-green-600 font-bold text-sm bg-green-50 py-2 rounded-xl border border-green-100 italic text-center">
                        <BellRing size={18} className="animate-bounce" /> تم إخطار المبيعات
                    </div>
                )}
            </div>
        </div>
    );
};

const ColumnHeader = ({ title, icon: Icon, colorClass, count }: any) => (
    <div className={`p-4 rounded-2xl flex items-center justify-between mb-6 shadow-sm ${colorClass} text-right`}>
        <span className="bg-white/20 px-3 py-1 rounded-full font-bold text-sm">
            {count}
        </span>
        <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg">{title}</h3>
            <div className="p-2 bg-white/20 rounded-lg">
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const KitchenView: React.FC = () => {
    const [orders, setOrders] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "transactions"),
            where("status", "in", ["pending", "preparing", "ready"]),
            orderBy("date", "asc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const o = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setOrders(o);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const updateStatus = async (orderId: string, newStatus: Transaction['status']) => {
        try {
            const orderRef = doc(db, "transactions", orderId);
            await updateDoc(orderRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    };

    const getStatusColumn = (status: Transaction['status']) => {
        return orders.filter(o => o.status === status);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin"></div>
                    <p className="text-coffee-900 font-bold">جاري تحميل طلبات المطبخ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 bg-[#fdfaf7] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4 text-right">
                    <div className="bg-coffee-900 p-3 rounded-2xl text-white shadow-xl">
                        <UtensilsCrossed size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-coffee-900">شاشة التحضير الذكية</h1>
                        <p className="text-gray-500">متابعة طلبات المطبخ في الوقت الفعلي</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gold-100 flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-coffee-900 text-sm">متصل بالخدمة السحابية</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-fit pb-20">
                {/* Pending Column */}
                <div className="flex flex-col">
                    <ColumnHeader
                        title="قيد الانتظار"
                        icon={Clock}
                        colorClass="bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-orange-200"
                        count={getStatusColumn('pending').length}
                    />
                    <div className="flex-1">
                        {getStatusColumn('pending').map(order => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                        ))}
                        {getStatusColumn('pending').length === 0 && (
                            <div className="text-center py-10 text-gray-300 italic border-2 border-dashed border-gray-100 rounded-3xl">لا توجد طلبات جديدة</div>
                        )}
                    </div>
                </div>

                {/* Preparing Column */}
                <div className="flex flex-col">
                    <ColumnHeader
                        title="جاري التحضير"
                        icon={ChefHat}
                        colorClass="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-200"
                        count={getStatusColumn('preparing').length}
                    />
                    <div className="flex-1">
                        {getStatusColumn('preparing').map(order => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                        ))}
                        {getStatusColumn('preparing').length === 0 && (
                            <div className="text-center py-10 text-gray-300 italic border-2 border-dashed border-gray-100 rounded-3xl">لا يوجد شيء قيد التحضير</div>
                        )}
                    </div>
                </div>

                {/* Ready Column */}
                <div className="flex flex-col">
                    <ColumnHeader
                        title="طلبات جاهزة"
                        icon={CheckCircle2}
                        colorClass="bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-200"
                        count={getStatusColumn('ready').length}
                    />
                    <div className="flex-1">
                        {getStatusColumn('ready').map(order => (
                            <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                        ))}
                        {getStatusColumn('ready').length === 0 && (
                            <div className="text-center py-10 text-gray-300 italic border-2 border-dashed border-gray-100 rounded-3xl">في انتظار اكتمال الطلبات</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenView;
