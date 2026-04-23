
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
        heroText: settings?.digitalMenu?.heroBanner || 'نرحب بكم في تجربتنا الرقمية المتميزة.',
        foodIcon: settings?.digitalMenu?.foodIcon || '🍔',
        drinkIcon: settings?.digitalMenu?.drinkIcon || '☕',
        fontSize: settings?.digitalMenu?.fontSize || 'medium',
        cardStyle: settings?.digitalMenu?.cardStyle || 'elevated',
        borderRadius: settings?.digitalMenu?.borderRadius || 'lg'
    }), [settings]);

    const themes = {
        modern: {
            bg: 'bg-brand-cream',
            text: 'text-brand-dark',
            accent: config.primaryColor,
            card: 'bg-white border-brand-primary/10 shadow-sm',
            secondary: 'text-brand-secondary'
        },
        dark: {
            bg: 'bg-[#0a0a0a]',
            text: 'text-white',
            accent: config.primaryColor,
            card: 'bg-white/5 border-white/10 backdrop-blur-sm',
            secondary: 'text-orange-400'
        },
        classic: {
            bg: 'bg-[#faf7f2]',
            text: 'text-[#4a3728]',
            accent: config.primaryColor,
            card: 'bg-white border-[#e0d6cc]',
            secondary: 'text-[#8c6d46]'
        },
        minimal: {
            bg: 'bg-white',
            text: 'text-gray-900',
            accent: config.primaryColor,
            card: 'bg-gray-50 border-gray-100',
            secondary: 'text-gray-500'
        }
    };

    const currentTheme = themes[config.theme as keyof typeof themes] || themes.modern;

    const categories = useMemo(() => ['الكل', ...new Set(products.map(p => p.category))], [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = activeCategory === 'الكل' || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchQuery]);

    const selectedProductsIds = useMemo(() => {
        // If selectedProducts is not defined or empty in settings, we default to all products being selected
        // to avoid a blank menu on first setup.
        if (!settings?.digitalMenu?.selectedProducts || settings.digitalMenu.selectedProducts.length === 0) {
            return products.map(p => p.id);
        }
        return settings.digitalMenu.selectedProducts;
    }, [settings, products]);

    const getRadiusClass = (radius: string) => {
        switch (radius) {
            case 'none': return 'rounded-none';
            case 'sm': return 'rounded-xl';
            case 'md': return 'rounded-2xl';
            case 'lg': return 'rounded-[2rem]';
            case 'full': return 'rounded-full';
            default: return 'rounded-3xl';
        }
    };

    const getFontSizeClass = (size: string) => {
        switch (size) {
            case 'small': return 'text-xs';
            case 'medium': return 'text-sm';
            case 'large': return 'text-lg';
            default: return 'text-sm';
        }
    };

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
            className={`min-h-screen font-sans pb-10 transition-colors duration-700 no-scrollbar ${currentTheme.bg} ${currentTheme.text}`}
            dir="rtl"
        >
            {/* Brand Header (Professional Studio Design) */}
            <div className="px-6 pt-16 pb-12 flex flex-col items-center relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-64 bg-gradient-to-b from-brand-primary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                <div className={`w-28 h-28 mx-auto rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 overflow-hidden transition-all duration-1000 bg-white ring-8 ring-white/10 relative z-10 animate-in zoom-in duration-700`}>
                    {settings?.storeLogo ? (
                        <img src={settings.storeLogo} alt={settings.storeName} className="w-full h-full object-cover" />
                    ) : (
                        <img src="/branding/afia_logo.png" alt="Afia" className="w-full h-full object-contain p-5" />
                    )}
                </div>

                <h1 className="text-3xl font-black mb-4 tracking-tighter relative z-10">{settings?.storeName}</h1>
                <div className={`w-12 h-1.5 bg-current opacity-10 mx-auto rounded-full mb-6 relative z-10`}></div>
                <p className="text-xs opacity-60 leading-relaxed font-bold px-10 text-center relative z-10">{config.heroText}</p>
            </div>

            {/* Sticky Filters (Integrated Style) */}
            <div className="sticky top-0 z-40 bg-inherit/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="max-w-md mx-auto px-6 space-y-4">
                    <div className="relative group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input
                            type="text"
                            placeholder="البحث عن صنف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-xs font-bold focus:ring-2 transition-all text-right outline-none placeholder:text-current placeholder:opacity-30"
                            style={{ ringColor: `${config.primaryColor}33` }}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" dir="rtl">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    backgroundColor: activeCategory === cat ? config.primaryColor : 'rgba(255,255,255,0.05)',
                                    color: activeCategory === cat ? '#fff' : 'inherit'
                                }}
                                className={`flex-shrink-0 px-6 py-2.5 rounded-xl font-black text-[10px] transition-all duration-300 border border-white/5 ${activeCategory === cat ? 'shadow-lg scale-105' : 'opacity-60 hover:opacity-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product List (Studio Layout) */}
            <div className="max-w-md mx-auto px-6 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                    <h2 className="text-xl font-black">{activeCategory === 'الكل' ? 'القائمة الرئيسية' : activeCategory}</h2>
                </div>

                <div className={config.layout === 'grid' ? 'grid grid-cols-1 gap-5' : 'flex flex-col gap-4'}>
                    {filteredProducts.map((product, idx) => {
                        const isSelected = selectedProductsIds.includes(product.id);
                        const hasStock = (product.stock ?? 0) > 0;
                        const isAvailable = isSelected && hasStock;

                        return (
                            <div
                                key={product.id}
                                onClick={() => isAvailable && setSelectedProduct(product)}
                                className={`${currentTheme.card} ${getRadiusClass(config.borderRadius)} group relative cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 p-5 transition-all duration-500 overflow-hidden ${!isAvailable ? 'opacity-60 grayscale-[0.5] cursor-not-allowed contrast-[0.8]' : 'hover:-translate-y-1'} ${config.cardStyle === 'elevated' ? (isAvailable ? 'shadow-xl hover:shadow-2xl' : 'shadow-sm') :
                                    config.cardStyle === 'glass' ? 'backdrop-blur-md bg-white/10 border-white/20 shadow-none' : 'shadow-sm'
                                    }`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {!isAvailable && (
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-500/20 flex items-center gap-1">
                                            <Flame size={12} fill="currentColor" /> غير متوفر حالياً
                                        </span>
                                    </div>
                                )}

                                <div className={`${config.layout === 'grid' ? 'flex flex-col' : 'flex items-center gap-5'}`}>
                                    <div
                                        style={{ backgroundColor: isAvailable ? config.primaryColor : '#9ca3af' }}
                                        className={`shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-lg text-white/90 backdrop-blur-sm border border-white/10 transition-transform ${isAvailable ? 'group-hover:rotate-6' : ''} ${config.layout === 'grid' ? 'w-16 h-16 mb-5' : 'w-14 h-14'}`}
                                    >
                                        {['Coffee', 'Tea', 'Juice', 'Drink'].some(c => product.category.includes(c)) ? config.drinkIcon : config.foodIcon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1 text-right">
                                            <h3 className={`font-black truncate ${getFontSizeClass(config.fontSize)}`}>{product.name}</h3>
                                            {isAvailable && (
                                                <span
                                                    style={{ color: config.primaryColor }}
                                                    className={`font-black shrink-0 ${config.fontSize === 'small' ? 'text-[10px]' : 'text-xs'}`}
                                                >
                                                    {formatCurrency(product.price, settings?.currency || '$')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] opacity-40 line-clamp-1 font-bold group-hover:opacity-100 transition-opacity">
                                            {isAvailable ? (product.notes || "تذوق الطعم الأصيل والمكونات الطازجة.") : "سيتوفر هذا المنتج قريباً، شكراً لتفهمكم."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-20 text-center opacity-10 text-[8px] font-black uppercase tracking-[0.5em] pb-10">
                    &bull; Powered by Al Afia Smart Cloud &bull;
                </div>
            </div>

            {/* Product Details Modal (Unified Design) */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setSelectedProduct(null)}></div>
                    <div
                        className={`relative w-full rounded-t-[3.5rem] p-10 max-w-xl mx-auto shadow-5xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[92vh] transition-all border-t border-white/10 ${currentTheme.bg} ${currentTheme.text}`}
                        dir="rtl"
                    >
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-8 left-8 w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-50 backdrop-blur-md"
                        >
                            <X size={24} />
                        </button>

                        <div className="mt-4 space-y-10 pb-10 text-center sm:text-right">
                            <div className={`relative w-32 h-32 mx-auto sm:mx-0 ${getRadiusClass(config.borderRadius)} overflow-hidden shadow-2xl flex items-center justify-center ring-8 ring-black/5`}>
                                <div
                                    className="w-full h-full flex items-center justify-center text-6xl shadow-inner"
                                    style={{ backgroundColor: `${config.primaryColor}10`, color: config.primaryColor }}
                                >
                                    {['Coffee', 'Tea', 'Juice', 'Drink'].some(c => selectedProduct.category.includes(c)) ? config.drinkIcon : config.foodIcon}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-center sm:justify-start gap-3">
                                    <span className="px-5 py-1.5 rounded-full bg-black/5 text-[10px] font-black uppercase tracking-widest opacity-60">{selectedProduct.category}</span>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Star size={16} fill="currentColor" />
                                        <span className="text-xs font-black">4.9</span>
                                    </div>
                                </div>
                                <h2 className="text-4xl font-black leading-tight tracking-tighter">{selectedProduct.name}</h2>
                                <div className="text-3xl font-black mt-2" style={{ color: config.primaryColor }}>
                                    {formatCurrency(selectedProduct.price, settings?.currency || '$')}
                                </div>
                                <p className="text-sm font-bold opacity-60 leading-relaxed max-w-md mx-auto sm:mx-0">
                                    {selectedProduct.notes || "استمتع بمذاق فريد محضر بعناية من أجود المكونات الطازجة لتقديم تجربة لا تُنسى في كل لقمة."}
                                </p>
                            </div>

                            {config.showIngredients && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-center sm:justify-start gap-3">
                                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                                        <h4 className="text-xl font-black">تفاصيل الطلب</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/5 p-6 rounded-[2.5rem] flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm" style={{ color: config.primaryColor }}>
                                                <ChefHat size={24} />
                                            </div>
                                            <span className="text-[11px] font-black opacity-70">تحضير طازج</span>
                                        </div>
                                        <div className="bg-black/5 p-6 rounded-[2.5rem] flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm text-green-500">
                                                <Leaf size={24} />
                                            </div>
                                            <span className="text-[11px] font-black opacity-70">طبيعي 100%</span>
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
