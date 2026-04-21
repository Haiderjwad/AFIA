
import React, { useState, useRef } from 'react';
import {
    X, QrCode, Download, Printer, Layout,
    CheckCircle2, Palette, Eye, Share2, FileText,
    Smartphone, Sparkles, Image as ImageIcon,
    Brush, Type, Settings2, Languages,
    ArrowRightCircle, MonitorSmartphone
} from 'lucide-react';
import { MenuItem } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DigitalMenuModalProps {
    products: MenuItem[];
    isOpen: boolean;
    onClose: () => void;
    storeName: string;
}

const DigitalMenuModal: React.FC<DigitalMenuModalProps> = ({ products, isOpen, onClose, storeName }) => {
    const [selectedProducts, setSelectedProducts] = useState<string[]>(products.map(p => p.id));
    const [theme, setTheme] = useState<'afia' | 'dark' | 'coffee' | 'modern'>('afia');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [storeDescription, setStoreDescription] = useState('نرحب بكم في تجربتنا الرقمية المتميزة. نهدف لتقديم أفضل جودة وأرقى خدمة تليق بذائقتكم.');
    const [activeTab, setActiveTab] = useState<'design' | 'content'>('design');

    const previewRef = useRef<HTMLDivElement>(null);
    const posterRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const exportProfessionalPDF = async () => {
        if (!posterRef.current) return;

        const canvas = await html2canvas(posterRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Menu_Poster_Afia_${storeName}.pdf`);
    };

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const filteredProducts = products.filter(p => selectedProducts.includes(p.id));

    const themeConfig = {
        afia: {
            bg: 'bg-brand-cream',
            text: 'text-brand-dark',
            accent: 'bg-brand-primary',
            card: 'bg-white border-brand-primary/10 shadow-sm',
            secondary: 'text-brand-secondary',
            label: 'عافية الفخم'
        },
        dark: {
            bg: 'bg-[#0a0a0a]',
            text: 'text-white',
            accent: 'bg-orange-500',
            card: 'bg-white/5 border-white/10 backdrop-blur-sm',
            secondary: 'text-orange-400',
            label: 'الاحترافي المعتم'
        },
        coffee: {
            bg: 'bg-[#faf7f2]',
            text: 'text-[#4a3728]',
            accent: 'bg-[#8c6d46]',
            card: 'bg-white border-[#e0d6cc]',
            secondary: 'text-[#8c6d46]',
            label: 'القهوة الكلاسيكي'
        },
        modern: {
            bg: 'bg-white',
            text: 'text-gray-900',
            accent: 'bg-brand-dark',
            card: 'bg-gray-50 border-gray-100',
            secondary: 'text-gray-500',
            label: 'العصري الأنيق'
        }
    };

    const currentTheme = themeConfig[theme];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-dark/90 backdrop-blur-2xl animate-in fade-in duration-500" dir="rtl">
            <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-700 border-4 border-white/20">

                {/* 1. Control Panel (Sidebar) */}
                <div className="w-full md:w-[450px] bg-gray-50/50 border-l border-brand-primary/5 flex flex-col h-full relative">
                    <div className="p-10 border-b border-brand-primary/5 bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
                                <Sparkles size={28} />
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-red-500 hover:text-white rounded-xl transition-all text-brand-dark/20"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="text-3xl font-black text-brand-dark mb-1">سمارت منيو</h2>
                        <p className="text-[10px] text-brand-secondary font-black uppercase tracking-[0.2em]">Digital Menu Visual Studio</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-10 py-4 bg-white border-b border-brand-primary/5 gap-4">
                        <button
                            onClick={() => setActiveTab('design')}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all ${activeTab === 'design' ? 'bg-brand-dark text-white shadow-2xl' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <Palette size={16} /> المظهر والهوية
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all ${activeTab === 'content' ? 'bg-brand-dark text-white shadow-2xl' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <Layout size={16} /> محتوى القائمة
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-12">
                        {activeTab === 'design' ? (
                            <>
                                {/* Theme Selection */}
                                <section className="space-y-6">
                                    <h3 className="text-[10px] items-center gap-2 flex font-black text-brand-secondary uppercase tracking-widest">
                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                                        اختيار طابع التصميم (Theme)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(themeConfig).map(([id, config]) => (
                                            <button
                                                key={id}
                                                onClick={() => setTheme(id as any)}
                                                className={`p-1 rounded-3xl border-3 transition-all ${theme === id ? 'border-brand-primary ring-4 ring-brand-primary/10 scale-105' : 'border-transparent hover:border-brand-primary/30'}`}
                                            >
                                                <div className="bg-white rounded-[1.5rem] p-3 flex flex-col items-center gap-3 shadow-sm">
                                                    <div className={`w-full h-12 rounded-xl shadow-inner ${config.bg} border border-black/5`}></div>
                                                    <span className="text-[10px] font-black text-brand-dark">{config.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Branding Info */}
                                <section className="space-y-6">
                                    <h3 className="text-[10px] items-center gap-2 flex font-black text-brand-secondary uppercase tracking-widest">
                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                                        نص الواجهة الترحيبي
                                    </h3>
                                    <div className="relative group">
                                        <textarea
                                            value={storeDescription}
                                            onChange={(e) => setStoreDescription(e.target.value)}
                                            className="w-full p-6 bg-white rounded-3xl border-2 border-brand-primary/5 outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 text-sm font-bold min-h-[120px] resize-none shadow-inner transition-all no-scrollbar"
                                            placeholder="اكتب شيئاً جميلاً لعملائك..."
                                        />
                                        <div className="absolute bottom-4 left-4 text-[8px] font-black opacity-20 uppercase tracking-widest">Description</div>
                                    </div>
                                </section>
                            </>
                        ) : (
                            /* Product Selection */
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] items-center gap-2 flex font-black text-brand-secondary uppercase tracking-widest">
                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                                        تحديد الأصناف المتاحة
                                    </h3>
                                    <span className="text-[10px] font-black bg-brand-primary text-white px-3 py-1 rounded-full shadow-lg shadow-brand-primary/30">
                                        {selectedProducts.length} صنف مفعّل
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {products.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleProduct(p.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedProducts.includes(p.id) ? 'border-brand-primary bg-brand-primary/5 shadow-md scale-[1.02]' : 'border-gray-50 bg-white hover:border-brand-primary/20'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm transition-all ${selectedProducts.includes(p.id) ? 'bg-brand-primary text-white rotate-6' : 'bg-gray-100 text-gray-400'}`}>
                                                    {p.category === 'Coffee' ? '☕' : p.category === 'Tea' ? '🍵' : '🍔'}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-brand-dark">{p.name}</p>
                                                    <p className="text-[10px] text-brand-secondary font-bold">{p.category}</p>
                                                </div>
                                            </div>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${selectedProducts.includes(p.id) ? 'bg-brand-primary border-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20' : 'border-gray-200'}`}>
                                                {selectedProducts.includes(p.id) && <CheckCircle2 size={16} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-10 bg-white border-t border-brand-primary/5">
                        <button
                            onClick={exportProfessionalPDF}
                            className="w-full bg-brand-dark hover:bg-brand-primary text-white py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 shadow-3xl shadow-brand-dark/20 transition-all active:scale-95 group"
                        >
                            <QrCode size={28} className="group-hover:rotate-12 transition-transform" />
                            توليد ملصق QR فخيم (PDF)
                        </button>
                    </div>
                </div>

                {/* 2. Preview Canvas (Main Area) */}
                <div className="flex-1 bg-[#0a0a0a] p-12 overflow-y-auto no-scrollbar flex flex-col lg:flex-row gap-12 items-start justify-center relative">

                    {/* Decorative Elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Mobile Preview View */}
                    <div className="flex flex-col gap-8 items-center relative z-10 shrink-0">
                        <div className="flex items-center gap-3 text-white/30 uppercase tracking-[0.3em] text-[8px] font-black px-4 py-2 bg-white/5 rounded-full backdrop-blur-md border border-white/5 shadow-2xl">
                            <Smartphone size={12} className="text-brand-primary" /> Live Mobile Preview
                        </div>
                        <div className="w-[340px] h-[680px] bg-brand-dark rounded-[3.5rem] p-3 shadow-4xl relative border-[12px] border-white/5 ring-[1px] ring-white/10 overflow-hidden group">
                            {/* Phone Speaker/Camera Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/5 rounded-b-3xl z-30 shadow-inner"></div>

                            <div
                                ref={previewRef}
                                className={`w-full h-full overflow-y-auto no-scrollbar rounded-[2.8rem] transition-all duration-700 ${currentTheme.bg} ${currentTheme.text} relative`}
                                dir="rtl">

                                {/* Inner Shadow for depth */}
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.05)] rounded-[2.8rem]"></div>

                                {/* Preview Content */}
                                <div className="p-10">
                                    <div className="text-center mt-12 mb-12">
                                        <div className={`w-24 h-24 mx-auto rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-6 text-4xl transition-all duration-1000 ${currentTheme.accent} text-white border-4 border-white/20 rotate-3`}>
                                            {storeName.charAt(0)}
                                        </div>
                                        <h1 className="text-3xl font-black mb-3 tracking-tighter">{storeName}</h1>
                                        <div className={`w-12 h-1 bg-current opacity-10 mx-auto rounded-full mb-4`}></div>
                                        <p className="text-[11px] opacity-60 leading-relaxed font-bold px-4">{storeDescription}</p>
                                    </div>

                                    <div className="space-y-5">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} className={`p-6 rounded-[2.5rem] border transition-all duration-500 hover:scale-[1.03] ${currentTheme.card}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-sm">{p.name}</h4>
                                                    <span className={`text-base font-black ${currentTheme.secondary}`}>{p.price.toFixed(2)} IQD</span>
                                                </div>
                                                <p className="text-[9px] opacity-50 line-clamp-2 leading-relaxed font-bold">{p.notes || "تذوق الطعم الأصيل والمكونات الطازجة في كل لقمة. محضّر بكل فخر لأصحاب الذوق الرفيع."}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-20 text-center opacity-20 text-[7px] font-black uppercase tracking-[0.4em] pb-10">
                                        &bull; Powered by Al Afia Cloud &bull;
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Poster Export Preview */}
                    <div className="flex flex-col gap-8 items-center relative z-10 flex-1">
                        <div className="flex items-center gap-3 text-white/30 uppercase tracking-[0.3em] text-[8px] font-black px-4 py-2 bg-white/5 rounded-full backdrop-blur-md border border-white/5 shadow-2xl">
                            <Printer size={12} className="text-brand-secondary" /> Print-Ready Poster Preview (A4)
                        </div>
                        <div
                            ref={posterRef}
                            className="w-[480px] aspect-[1/1.414] bg-white rounded-[3rem] shadow-4xl p-16 flex flex-col items-center justify-between text-center overflow-hidden relative group/poster"
                            style={{ direction: 'rtl' }}
                        >
                            {/* Luxury Border Box inside */}
                            <div className="absolute inset-10 border-2 border-brand-primary/5 rounded-[2rem] pointer-events-none"></div>

                            <div className="space-y-6 relative z-10">
                                <div className="w-24 h-24 bg-brand-dark rounded-[2.5rem] flex items-center justify-center text-white text-4xl mx-auto shadow-2xl border-4 border-white transform -rotate-12 transition-transform group-hover/poster:rotate-0 duration-700">
                                    {storeName.charAt(0)}
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-5xl font-black text-brand-dark tracking-tighter">{storeName}</h2>
                                    <div className="w-24 h-2 bg-brand-secondary mx-auto rounded-full shadow-lg shadow-brand-secondary/20"></div>
                                    <p className="text-xl font-black text-brand-secondary/60 mt-4 tracking-widest uppercase">Digital Ordering Experience</p>
                                </div>
                            </div>

                            <div className="relative group p-10">
                                <div className="absolute inset-0 bg-brand-primary/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="p-10 bg-white rounded-[5rem] border-8 border-brand-dark shadow-4xl relative z-10 transition-all hover:scale-105 duration-700">
                                    <QRCodeCanvas
                                        value={`https://menu.alafia.iq/${storeName.replace(/\s+/g, '-').toLowerCase()}`}
                                        size={220}
                                        level="H"
                                        includeMargin={false}
                                        fgColor="#1a1a1a"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <p className="text-3xl font-black text-brand-dark uppercase tracking-tighter">امسح الكود واستمتع بالطلب الذكي</p>
                                <p className="text-sm text-brand-secondary/40 font-black tracking-widest uppercase">Scan to access the full digital menu</p>
                            </div>

                            {/* Watermark Logo */}
                            <div className="absolute -bottom-10 -right-10 opacity-5">
                                <img src="/branding/afia_logo.png" className="w-64" alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalMenuModal;
