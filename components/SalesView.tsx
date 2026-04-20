
import React, { useState } from 'react';
import { Search, Coffee, Sparkles, Filter, Bell, CheckCircle2, PackageCheck } from 'lucide-react';
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
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#fdfaf7] p-6 text-right relative" dir="rtl">

            {/* Ready Orders Notification */}
            {readyOrders.length > 0 && showReadyAlert && (
                <div className="mb-6 bg-gradient-to-r from-green-600 to-emerald-500 text-white p-4 rounded-2xl shadow-xl shadow-green-100 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl animate-bounce">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">طلبات جاهزة للتسليم ({readyOrders.length})</p>
                            <p className="text-[10px] text-white/80">انقر على الطلب أدناه لإرساله للفواتير</p>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                        {readyOrders.slice(0, 3).map(order => (
                            <button
                                key={order.id}
                                onClick={() => onCompleteOrder(order.id)}
                                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-black border border-white/20 transition-all flex items-center gap-2"
                            >
                                <PackageCheck size={14} />
                                #{order.id.slice(-4)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowReadyAlert(false)}
                        className="text-white/50 hover:text-white transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            )}

            {/* Header / Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-coffee-900">نافذة المبيعات</h1>
                    <p className="text-gray-500">اختر المنتجات لإضافتها للطلب</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث عن منتج..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-gold-100 outline-none focus:ring-2 focus:ring-gold-500 transition-all font-bold placeholder-gray-300 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm border ${selectedCategory === cat
                            ? 'bg-coffee-900 text-white border-transparent scale-105 shadow-coffee-900/20'
                            : 'bg-white text-gray-500 border-gold-100 hover:border-gold-300 hover:text-coffee-900'
                            }`}
                    >
                        {cat === 'all' ? 'الكل' : cat}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-5 rounded-[2.5rem] border border-gold-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center gap-4 group relative overflow-hidden text-right"
                            >
                                <div className="absolute top-0 right-0 w-full h-1.5 bg-gold-200 group-hover:bg-gold-500 transition-colors"></div>

                                <div className="w-20 h-20 bg-gold-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    ☕
                                </div>

                                <div className="text-center w-full">
                                    <h3 className="font-bold text-coffee-900 text-lg mb-1 leading-tight">{product.name}</h3>
                                    <p className="text-xs text-gray-400 mb-3">{product.category}</p>
                                    <div className="flex items-center justify-center gap-2 mt-auto">
                                        <span className="text-xl font-black text-gold-600">{product.price.toFixed(2)}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{settings.currency}</span>
                                    </div>
                                </div>

                                {/* Hover Add Button Accent */}
                                <div className="absolute inset-0 bg-gold-500/0 group-hover:bg-gold-500/5 transition-all pointer-events-none"></div>
                                <div className="mt-2 w-10 h-10 bg-coffee-900 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-lg">
                                    <Sparkles size={18} />
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
