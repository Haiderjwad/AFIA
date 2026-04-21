
import React, { useState } from 'react';
import { Search, Coffee, Sparkles, Filter, Bell, CheckCircle2, PackageCheck, Plus } from 'lucide-react';
import { MenuItem, AppSettings, Transaction } from '../types';

interface SalesViewProps {
    products: MenuItem[];
    addToCart: (product: MenuItem) => void;
    settings: AppSettings;
    readyOrders: Transaction[];
    onCompleteOrder: (id: string) => void;
}

const SalesView: React.FC<SalesViewProps> = ({ products, addToCart, settings, readyOrders, onCompleteOrder }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showReadyAlert, setShowReadyAlert] = useState(true);

    const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-brand-cream p-6 text-right relative" dir="rtl">
            {/* Background Leaf Patterns */}
            <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>



            {/* Ready Orders Notification */}
            {readyOrders.length > 0 && showReadyAlert && (
                <div className="mb-6 bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-5 rounded-3xl shadow-[0_10px_30px_rgba(45,106,79,0.2)] flex flex-col md:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-20deg] translate-x-1/2"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-white/20 p-2.5 rounded-2xl animate-bounce shadow-inner">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="font-extrabold text-base">لديك طلبات جاهزة للتسليم ({readyOrders.length})</p>
                            <p className="text-xs text-white/70">انقر على رقم الطلب لنقله إلى شاشة المحاسبة</p>
                        </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar max-w-full relative z-10">
                        {readyOrders.slice(0, 5).map(order => (
                            <button
                                key={order.id}
                                onClick={() => onCompleteOrder(order.id)}
                                className="bg-white/10 hover:bg-brand-accent px-4 py-2 rounded-xl text-xs font-black border border-white/20 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <PackageCheck size={14} />
                                {order.tableNumber === 'Takeaway' ? 'سفري 🛍️' :
                                    order.tableNumber ? `طاولة ${order.tableNumber}` :
                                        `#${order.id.slice(-4)}`}
                            </button>

                        ))}
                    </div>
                    <button
                        onClick={() => setShowReadyAlert(false)}
                        className="text-white/40 hover:text-white transition-colors relative z-10 p-2"
                    >
                        إخفاء
                    </button>
                </div>
            )}

            {/* Header / Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-brand-dark mb-1">نافذة المبيعات</h1>
                    <p className="text-brand-dark/40 font-bold text-sm tracking-wide">اختر الوجبات الصحية لإضافتها للسلة</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-96">
                        <Search size={22} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary" />
                        <input
                            type="text"
                            placeholder="ابحث عن وجبة أو صنف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-14 pl-4 py-4 bg-white rounded-2xl border border-brand-primary/10 outline-none focus:ring-[3px] focus:ring-brand-secondary/30 focus:border-brand-secondary transition-all font-black text-brand-dark placeholder-brand-dark/20 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-8 py-3 rounded-2xl font-black whitespace-nowrap transition-all shadow-sm border-2 ${selectedCategory === cat
                            ? 'bg-brand-primary text-white border-transparent scale-105 shadow-brand-primary/20'
                            : 'bg-white text-brand-dark/40 border-brand-primary/5 hover:border-brand-secondary hover:text-brand-primary'
                            }`}
                    >
                        {cat === 'all' ? 'جميع الأصناف' : cat}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-7">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-6 rounded-[3rem] border border-brand-primary/5 shadow-sm hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center gap-5 group relative overflow-hidden text-right"
                            >
                                <div className="absolute top-0 right-0 w-full h-2 bg-brand-light/20 group-hover:bg-brand-secondary transition-colors duration-500"></div>

                                <div className="w-24 h-24 bg-brand-light/10 rounded-full flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative">
                                    <div className="absolute inset-2 bg-white rounded-full opacity-50 group-hover:scale-0 transition-all duration-500"></div>
                                    <span className="relative z-10">🥗</span>
                                </div>

                                <div className="text-center w-full">
                                    <h3 className="font-extrabold text-brand-dark text-xl mb-1 leading-tight group-hover:text-brand-primary transition-colors">{product.name}</h3>
                                    <p className="text-xs font-bold text-brand-secondary mb-4 opacity-70">{product.category}</p>
                                    <div className="flex items-center justify-center gap-2 bg-brand-light/10 py-2 rounded-2xl group-hover:bg-brand-primary/5 transition-all">
                                        <span className="text-2xl font-black text-brand-accent">{product.price.toFixed(2)}</span>
                                        <span className="text-xs font-black text-brand-dark/40 uppercase">{settings.currency}</span>
                                    </div>
                                </div>

                                {/* Premium Accent */}
                                <div className="mt-2 w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-6 group-hover:translate-y-0 shadow-lg shadow-brand-primary/20">
                                    <Plus size={24} />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                        <Coffee size={80} className="mb-4 opacity-20" />
                        <p className="text-xl font-medium">لا توجد منتجات تطابق البحث</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesView;
