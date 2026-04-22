
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, AppSettings } from '../types';
import {
    Search,
    X,
    ChevronRight,
    Star,
    Clock,
    LayoutGrid,
    List as ListIcon,
    ChefHat,
    Leaf,
    Flame,
    Info
} from 'lucide-react';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { formatCurrency } from '../utils/currencyUtils';

const PublicMenuView: React.FC = () => {
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('الكل');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const unsubSettings = onSnapshot(doc(firestoreDb, "settings", "default"), (snapshot) => {
            if (snapshot.exists()) setSettings(snapshot.data() as AppSettings);
        });
        const unsubProducts = onSnapshot(collection(firestoreDb, "products"), (snapshot) => {
            const p = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
            setProducts(p);
            setIsLoading(false);
        });
        return () => { unsubSettings(); unsubProducts(); };
    }, []);

    const config = useMemo(() => ({
        theme: settings?.digitalMenu?.theme || 'modern',
        primaryColor: settings?.digitalMenu?.primaryColor || '#2d6a4f',
        layout: settings?.digitalMenu?.layout || 'grid',
        showIngredients: settings?.digitalMenu?.showIngredients !== false,
        heroText: settings?.digitalMenu?.heroBanner || 'نرحب بكم في تجربتنا الرقمية المتميزة.'
    }), [settings]);

    const themes = {
        modern: { bg: '#FDFCF8', card: 'bg-white', text: '#1a3a2a' },
        classic: { bg: '#faf7f2', card: 'bg-white', text: '#4a3728' },
        minimal: { bg: '#ffffff', card: 'bg-gray-50', text: '#111827' },
        dark: { bg: '#0a0a0a', card: 'bg-white/5', text: '#ffffff' }
    };

    const currentTheme = themes[config.theme as keyof typeof themes] || themes.modern;

    const categories = useMemo(() => ['الكل', ...new Set(products.map(p => p.category))], [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = activeCategory === 'الكل' || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchQuery]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-brand-cream flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-brand-primary font-black animate-pulse">جاري تحضير التجربة...</div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen font-sans pb-10 transition-colors duration-700"
            style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
        >
            {/* Brand Header */}
            <div className="px-6 py-10 flex flex-col items-center bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm">
                <div
                    style={{ backgroundColor: config.primaryColor }}
                    className="w-20 h-20 rounded-3xl flex items-center justify-center p-3 shadow-xl mb-4 animate-in zoom-in duration-700"
                >
                    <img src="/branding/afia_logo.png" alt="Afia Logo" className="w-full h-full object-contain filter brightness-0 invert" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter mb-1">{settings?.storeName}</h1>
                <p className="text-[10px] font-bold opacity-60 px-10 text-center leading-relaxed italic">{config.heroText}</p>
            </div>

            {/* Sticky Filters */}
            <div className="sticky top-0 z-40 bg-inherit/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-md mx-auto px-4 py-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="البحث عن صنف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border-none rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold focus:ring-2 transition-all text-right outline-none placeholder:text-gray-400"
                            style={{ ringColor: `${config.primaryColor}33` }}
                            dir="rtl"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4" dir="rtl">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    backgroundColor: activeCategory === cat ? config.primaryColor : 'transparent',
                                    color: activeCategory === cat ? '#fff' : 'inherit',
                                    borderColor: activeCategory === cat ? config.primaryColor : 'rgba(0,0,0,0.1)'
                                }}
                                className={`flex-shrink-0 px-6 py-2 rounded-xl font-black text-[12px] transition-all duration-300 border ${activeCategory === cat ? 'shadow-lg scale-105' : 'opacity-60'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="max-w-md mx-auto px-4 py-8" dir="rtl">
                <h2 className="text-xl font-black mb-6">{activeCategory === 'الكل' ? 'القائمة الرئيسية' : activeCategory}</h2>

                <div className={config.layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
                    {filteredProducts.map((product, idx) => (
                        <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className={`${currentTheme.card} group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-[2rem] border border-white/5 p-2 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden hover:-translate-y-1`}
                            style={{ animationDelay: `${idx * 40}ms` }}
                        >
                            <div className={`${config.layout === 'grid' ? 'flex flex-col' : 'flex items-center gap-4 p-2'}`}>
                                <div className={`relative ${config.layout === 'grid' ? 'w-full aspect-square mb-3' : 'w-20 h-20 shrink-0'} rounded-[1.5rem] bg-gray-50/5 overflow-hidden flex items-center justify-center`}>
                                    {product.image ? (
                                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                    ) : (
                                        <span className="text-3xl">🥘</span>
                                    )}
                                </div>
                                <div className="px-2 pb-2 text-right flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-black text-sm truncate">{product.name}</h3>
                                        <p className="text-[10px] font-bold opacity-40 line-clamp-1 mb-2">{product.category}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-xs tracking-tight" style={{ color: config.primaryColor }}>
                                            {formatCurrency(product.price, settings?.currency || '$')}
                                        </span>
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                                            style={{ backgroundColor: `${config.primaryColor}15`, color: config.primaryColor }}
                                        >
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedProduct(null)}></div>
                    <div className="relative w-full bg-white rounded-t-[3.5rem] p-8 max-w-xl mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[92vh] text-brand-dark" dir="rtl">
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-6 left-6 p-3 rounded-2xl bg-gray-100/80 text-brand-dark hover:bg-brand-primary active:scale-90 transition-all"
                        >
                            <X size={24} />
                        </button>

                        <div className="mt-8 space-y-8 pb-10">
                            <div className="relative w-full aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl">
                                {selectedProduct.image ? (
                                    <img src={selectedProduct.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-8xl">🥗</div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-5 py-2 rounded-2xl shadow-lg border border-white/20">
                                    <span className="font-black text-lg tracking-tight" style={{ color: config.primaryColor }}>
                                        {formatCurrency(selectedProduct.price, settings?.currency || '$')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-4 py-1 rounded-full bg-gray-100 text-[10px] font-black uppercase tracking-widest">{selectedProduct.category}</span>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-xs font-black">4.9</span>
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-brand-dark leading-tight">{selectedProduct.name}</h2>
                                <p className="text-sm font-bold text-gray-500 leading-relaxed text-justify opacity-80">
                                    {selectedProduct.description || "استمتع بمذاق فريد محضر بعناية من أجود المكونات الطازجة لتقديم تجربة لا تُنسى في كل لقمة."}
                                </p>
                            </div>

                            {config.showIngredients && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                                        <h4 className="text-lg font-black text-brand-dark">تفاصيل الطبق</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 p-4 rounded-3xl flex items-center gap-3 border border-gray-100/50">
                                            <ChefHat size={20} style={{ color: config.primaryColor }} />
                                            <span className="text-[11px] font-bold text-gray-600">محضر طازجاً</span>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-3xl flex items-center gap-3 border border-gray-100/50">
                                            <Leaf size={20} className="text-brand-primary" />
                                            <span className="text-[11px] font-bold text-gray-600">مكونات عضوية</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicMenuView;
