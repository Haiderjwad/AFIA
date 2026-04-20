
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
    const [theme, setTheme] = useState<'gold' | 'dark' | 'coffee' | 'modern'>('gold');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [storeDescription, setStoreDescription] = useState('أهلاً بكم في متجرنا، نقدّم لكم أجود أنواع المأكولات والمشروبات المحضّرة بحب.');
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
        pdf.save(`Menu_Poster_${storeName}.pdf`);
    };

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const filteredProducts = products.filter(p => selectedProducts.includes(p.id));

    const themeConfig = {
        gold: { bg: 'bg-[#fdfaf5]', text: 'text-coffee-900', accent: 'bg-gold-500', card: 'bg-white border-gold-100', secondary: 'text-gold-600' },
        dark: { bg: 'bg-[#0f172a]', text: 'text-white', accent: 'bg-blue-500', card: 'bg-white/5 border-white/10', secondary: 'text-blue-400' },
        coffee: { bg: 'bg-[#faf7f2]', text: 'text-[#4a3728]', accent: 'bg-[#8c6d46]', card: 'bg-white border-[#e0d6cc]', secondary: 'text-[#8c6d46]' },
        modern: { bg: 'bg-white', text: 'text-gray-900', accent: 'bg-black', card: 'bg-gray-50 border-gray-100', secondary: 'text-gray-500' }
    };

    const currentTheme = themeConfig[theme];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" dir="rtl">
            <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">

                {/* 1. Control Panel (Sidebar) */}
                <div className="w-full md:w-[450px] bg-[#f8f9fa] border-l border-gray-200 flex flex-col h-full relative">
                    <div className="p-8 border-b border-gray-200 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <div className="w-12 h-12 bg-gold-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gold-500/20">
                                <MonitorSmartphone size={24} />
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <h2 className="text-2xl font-black text-coffee-900 mb-1">استوديو المنيو الرقمي</h2>
                        <p className="text-gray-500 text-sm">خصص تجربة الطلب الرقمي لعملائك</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-8 py-4 bg-white border-b border-gray-100 gap-4">
                        <button
                            onClick={() => setActiveTab('design')}
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'design' ? 'bg-coffee-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <Brush size={18} /> التصميم والعرض
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'content' ? 'bg-coffee-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <CheckCircle2 size={18} /> قائمة المنتجات
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-10">
                        {activeTab === 'design' ? (
                            <>
                                {/* Theme Selection */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 pointer-events-none">
                                        <div className="w-1.5 h-6 bg-gold-500 rounded-full"></div>
                                        <h3 className="font-black text-coffee-900 uppercase tracking-widest text-sm">طابع الهاتف المحمول</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.keys(themeConfig).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t as any)}
                                                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${theme === t ? 'border-coffee-900 bg-white shadow-xl scale-105' : 'border-transparent bg-white/50 hover:bg-white'}`}
                                            >
                                                <div className={`w-full h-12 rounded-xl shadow-inner ${themeConfig[t as keyof typeof themeConfig].bg}`}></div>
                                                <span className="text-xs font-black capitalize">{t === 'gold' ? 'الملكي الذهبي' : t === 'dark' ? 'الليلي الاحترافي' : t === 'coffee' ? 'الكلاسيكي' : 'العصري'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Branding Info */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 pointer-events-none">
                                        <div className="w-1.5 h-6 bg-gold-500 rounded-full"></div>
                                        <h3 className="font-black text-coffee-900 uppercase tracking-widest text-sm">معلومات العلامة التجارية</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase">وصف المتجر (يظهر في المنيو)</label>
                                            <textarea
                                                value={storeDescription}
                                                onChange={(e) => setStoreDescription(e.target.value)}
                                                className="w-full p-4 bg-white rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-gold-500 text-sm font-bold min-h-[100px] resize-none"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </>
                        ) : (
                            /* Product Selection */
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-gold-500 rounded-full"></div>
                                        <h3 className="font-black text-coffee-900 uppercase tracking-widest text-sm">اختيار الأصناف</h3>
                                    </div>
                                    <span className="text-[10px] font-black bg-gold-100 text-gold-700 px-3 py-1 rounded-full">{selectedProducts.length} مختار</span>
                                </div>
                                <div className="space-y-3">
                                    {products.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleProduct(p.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedProducts.includes(p.id) ? 'border-coffee-900 bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedProducts.includes(p.id) ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-400'}`}>☕</div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-coffee-900">{p.name}</p>
                                                    <p className="text-[10px] text-gray-400">{p.category}</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selectedProducts.includes(p.id) ? 'bg-coffee-900 border-coffee-900 text-white' : 'border-gray-200'}`}>
                                                {selectedProducts.includes(p.id) && <CheckCircle2 size={14} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-8 bg-white border-t border-gray-200">
                        <button
                            onClick={exportProfessionalPDF}
                            className="w-full bg-gold-500 hover:bg-gold-600 text-coffee-900 py-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl shadow-gold-500/20 transition-all scale-100 hover:scale-[1.02]"
                        >
                            <QrCode size={24} />
                            إنشاء ملصق QR الموحد (PDF)
                        </button>
                    </div>
                </div>

                {/* 2. Preview Canvas (Main Area) */}
                <div className="flex-1 bg-[#121212] p-12 overflow-y-auto no-scrollbar flex flex-col lg:flex-row gap-12">

                    {/* Mobile Preview View */}
                    <div className="flex flex-col gap-6 items-center">
                        <div className="flex items-center gap-2 text-white/40 uppercase tracking-[0.2em] text-[10px] font-black">
                            <Smartphone size={14} /> معاينة واجهة العميل
                        </div>
                        <div className="w-[360px] h-[720px] bg-coffee-900 rounded-[3rem] p-4 shadow-2xl relative border-[8px] border-[#222] ring-[12px] ring-white/5 overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#222] rounded-b-3xl z-30"></div>
                            <div
                                ref={previewRef}
                                className={`w-full h-full overflow-y-auto no-scrollbar rounded-[2rem] transition-colors duration-700 ${currentTheme.bg} ${currentTheme.text}`}
                                dir="rtl">
                                {/* Preview Content */}
                                <div className="p-8">
                                    <div className="text-center mt-10 mb-12">
                                        <div className={`w-20 h-20 mx-auto rounded-3xl shadow-2xl flex items-center justify-center mb-6 text-3xl ${currentTheme.accent} text-white`}>☕</div>
                                        <h1 className="text-3xl font-black mb-2">{storeName}</h1>
                                        <p className="text-xs opacity-60 leading-relaxed px-4">{storeDescription}</p>
                                    </div>

                                    <div className="space-y-4">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} className={`p-5 rounded-[2.5rem] border ${currentTheme.card} transition-all`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-base">{p.name}</h4>
                                                    <span className={`text-lg font-black ${currentTheme.secondary}`}>{p.price} $</span>
                                                </div>
                                                <p className="text-[10px] opacity-50 line-clamp-2">{p.notes || "وصف هذا المنتج الرائع متوفر هنا لزيادة الرغبة في الطلب."}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-20 text-center opacity-30 text-[8px] font-black uppercase tracking-widest pb-10">
                                        Powered by Golden POS System
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Poster Export Preview */}
                    <div className="flex-1 flex flex-col gap-6 items-center">
                        <div className="flex items-center gap-2 text-white/40 uppercase tracking-[0.2em] text-[10px] font-black">
                            <Printer size={14} /> معاينة الملصق المطبوع (QR)
                        </div>
                        <div
                            ref={posterRef}
                            className="w-[450px] aspect-[1/1.4] bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center justify-between text-center overflow-hidden"
                            style={{ direction: 'rtl' }}
                        >
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-coffee-900 rounded-[2rem] flex items-center justify-center text-white text-3xl mx-auto shadow-xl">☕</div>
                                <h2 className="text-4xl font-black text-coffee-900">{storeName}</h2>
                                <div className="w-20 h-1.5 bg-gold-500 mx-auto rounded-full"></div>
                                <p className="text-xl font-bold text-gray-400">انضم إلينا في تجربة رقمية فريدة</p>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-gold-500 blur-3xl opacity-10 group-hover:opacity-20 transition-all"></div>
                                <div className="p-8 bg-white rounded-[4rem] border-4 border-coffee-900 shadow-2xl relative z-10 transition-transform group-hover:scale-105 duration-500">
                                    <QRCodeCanvas
                                        value={`https://menu.goldenpos.com/${storeName.replace(/\s+/g, '-').toLowerCase()}`}
                                        size={220}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-2xl font-black text-coffee-900 uppercase tracking-tighter">امسح الكود لفتح القائمة</p>
                                <p className="text-xs text-gray-400 font-bold">بإمكانك طلب كل ما تحب مباشرة من بريدك</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalMenuModal;
