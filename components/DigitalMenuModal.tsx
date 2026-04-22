
import React, { useState, useRef } from 'react';
import StatusModal from './StatusModal';
import {
    X, QrCode, Download, Printer, Layout,
    CheckCircle2, Palette, Eye, Share2, FileText,
    Smartphone, Sparkles, Image as ImageIcon,
    Brush, Type, Settings2, Languages,
    ArrowRightCircle, MonitorSmartphone
} from 'lucide-react';
import { MenuItem, AppSettings } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/currencyUtils';

interface DigitalMenuModalProps {
    products: MenuItem[];
    isOpen: boolean;
    onClose: () => void;
    storeName: string;
    settings: AppSettings;
}

const DigitalMenuModal: React.FC<DigitalMenuModalProps> = ({ products, isOpen, onClose, storeName, settings }) => {

    const [selectedProducts, setSelectedProducts] = useState<string[]>(products.map(p => p.id));
    const [theme, setTheme] = useState<'afia' | 'dark' | 'coffee' | 'modern'>('afia');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [storeDescription, setStoreDescription] = useState('نرحب بكم في تجربتنا الرقمية المتميزة. نهدف لتقديم أفضل جودة وأرقى خدمة تليق بذائقتكم.');
    const [activeTab, setActiveTab] = useState<'design' | 'content'>('design');
    const [previewMode, setPreviewMode] = useState<'mobile' | 'poster'>('mobile');
    const [isExporting, setIsExporting] = useState(false);
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'loading', title: string, message: string }>({
        isOpen: false,
        type: 'loading',
        title: '',
        message: ''
    });

    const previewRef = useRef<HTMLDivElement>(null);
    const posterRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const exportProfessionalPDF = async () => {
        if (!posterRef.current || isExporting) return;

        setIsExporting(true);

        // Stage 1: UI Update and Preparation
        // We use a double requestAnimationFrame to ensure the browser has painted the loading dialog
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Stage 2: Heavy Lifting (html2canvas)
            const canvas = await html2canvas(posterRef.current, {
                scale: 1.8, // Balanced scale for speed and A4 quality
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: true,
                imageTimeout: 15000,
                removeContainer: true,
                onclone: (clonedDoc) => {
                    // Fix for html2canvas oklch/oklab unsupported error
                    const elementsWithModernColors = clonedDoc.querySelectorAll('*');
                    elementsWithModernColors.forEach((el: any) => {
                        const style = window.getComputedStyle(el);
                        ['backgroundColor', 'color', 'borderColor', 'outlineColor'].forEach(prop => {
                            const value = style[prop as any];
                            if (value && (value.includes('oklch') || value.includes('oklab'))) {
                                // Fallback to a safe color if modern color functions are detected
                                el.style[prop] = 'rgb(45, 106, 79)'; // Default to brand primary
                            }
                        });
                    });
                }
            });

            // Stage 3: PDF Assembly
            const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG is faster and lighter for posters
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

            // Stage 4: Saving and cleanup
            pdf.save(`Al_Afia_Menu_${storeName.replace(/\s+/g, '_')}.pdf`);

            setIsExporting(false);
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'اكتمل التوليد بنجاح',
                message: 'تم إنشاء نسخة الـ PDF وحفظها على جهازك بنجاح. جاهزة للطباعة الآن.'
            });

            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
                onClose();
            }, 3000);

        } catch (error) {
            console.error("Critical Export Error:", error);
            setIsExporting(false);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'فشل التوليد',
                message: 'عذراً، حدث خطأ تقني أثناء محاولة توليد رمز الـ QR. يرجى المحاولة مرة أخرى لاحقاً.'
            });
        }
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
            <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-700 border-4 border-white/20 relative">

                {/* Global Close Button - Moved to corner for better accessibility */}
                {/* Global Close Button - Moved for better visibility */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 z-[250] w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-red-500 text-white rounded-[1.2rem] backdrop-blur-xl border border-white/20 transition-all shadow-2xl group"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>

                {/* 1. Control Panel (Sidebar) */}
                <div className="w-full md:w-[400px] bg-gray-50/50 border-l border-brand-primary/5 flex flex-col h-full relative shrink-0">
                    <div className="p-8 border-b border-brand-primary/5 bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
                                <Sparkles size={24} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-brand-dark mb-1">سمارت منيو</h2>
                        <p className="text-[9px] text-brand-secondary font-black uppercase tracking-[0.2em]">Digital Menu Visual Studio</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-8 py-3 bg-white border-b border-brand-primary/5 gap-3">
                        <button
                            onClick={() => setActiveTab('design')}
                            className={`flex-1 py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 transition-all ${activeTab === 'design' ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <Palette size={14} /> المظهر
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 transition-all ${activeTab === 'content' ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <Layout size={14} /> المحتوى
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 premium-scrollbar space-y-12">
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
                            disabled={previewMode !== 'poster' || isExporting}
                            className={`w-full py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-95 group shadow-3xl ${previewMode === 'poster'
                                ? 'bg-brand-dark hover:bg-brand-primary text-white shadow-brand-dark/20 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-80 shadow-none'
                                }`}
                        >
                            <QrCode size={28} className={`${previewMode === 'poster' ? 'group-hover:rotate-12' : ''} transition-transform`} />
                            {previewMode === 'poster' ? 'توليد ملصق QR فخيم (PDF)' : 'شاهد الملصق لتفعيل التنزيل'}
                        </button>
                    </div>
                </div>

                {/* 2. Preview Canvas (Main Area) */}
                <div className="flex-1 bg-[#0a0a0a] overflow-hidden flex flex-col relative">

                    {/* Preview Navbar/Toggle */}
                    <div className="h-20 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-center gap-6 px-12 shrink-0">
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${previewMode === 'mobile' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <Smartphone size={14} /> Live Mobile View
                        </button>
                        <div className="w-px h-4 bg-white/10"></div>
                        <button
                            onClick={() => setPreviewMode('poster')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${previewMode === 'poster' ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/20 scale-110' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <Printer size={14} /> A4 Poster Preview
                        </button>
                    </div>

                    <div className="flex-1 p-8 md:p-16 overflow-y-auto premium-scrollbar flex items-start justify-center relative">

                        {/* Decorative Elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                        {previewMode === 'mobile' && (
                            <div className="flex flex-col gap-8 items-center relative z-10 animate-in fade-in zoom-in duration-500">
                                <div className="w-[320px] h-[640px] bg-brand-dark rounded-[3.5rem] p-3 shadow-4xl relative border-[12px] border-white/5 ring-[1px] ring-white/10 overflow-hidden group">
                                    {/* Phone Speaker/Camera Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/5 rounded-b-3xl z-30 shadow-inner"></div>

                                    <div
                                        ref={previewRef}
                                        className={`w-full h-full overflow-y-auto phone-scrollbar rounded-[2.8rem] transition-all duration-700 ${currentTheme.bg} ${currentTheme.text} relative pb-12`}
                                        dir="rtl">

                                        {/* Inner Shadow for depth */}
                                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.05)] rounded-[2.8rem]"></div>

                                        {/* Preview Content */}
                                        <div className="p-8">
                                            <div className="text-center mt-10 mb-10">
                                                <div className={`w-24 h-24 mx-auto rounded-3xl shadow-xl flex items-center justify-center mb-6 overflow-hidden transition-all duration-1000 bg-white`}>
                                                    {settings?.storeLogo ? (
                                                        <img src={settings.storeLogo} alt={storeName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src="/branding/afia_logo.png" alt="Afia" className="w-full h-full object-contain p-4" />
                                                    )}
                                                </div>
                                                <h1 className="text-2xl font-black mb-3 tracking-tighter">{storeName}</h1>

                                                <div className={`w-10 h-1 bg-current opacity-10 mx-auto rounded-full mb-4`}></div>
                                                <p className="text-[10px] opacity-60 leading-relaxed font-bold px-2">{storeDescription}</p>
                                            </div>

                                            <div className="space-y-4">
                                                {filteredProducts.map(p => (
                                                    <div key={p.id} className={`p-4 rounded-[1.8rem] border transition-all duration-500 hover:scale-[1.03] ${currentTheme.card} flex gap-3 items-center`}>
                                                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xl shadow-sm ${currentTheme.accent} bg-white/20 backdrop-blur-sm border border-white/10`}>
                                                            {p.category === 'Coffee' ? '☕' : p.category === 'Tea' ? '🍵' : '🍔'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <h4 className="font-black text-[11px] truncate">{p.name}</h4>
                                                                <span className={`text-[11px] font-black shrink-0 ${currentTheme.secondary}`}>{formatCurrency(p.price, settings.currency)}</span>
                                                            </div>
                                                            <p className="text-[7px] opacity-50 line-clamp-1 font-bold">{p.notes || "تذوق الطعم الأصيل"}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-16 text-center opacity-20 text-[6px] font-black uppercase tracking-[0.4em] pb-10">
                                                &bull; Powered by Al Afia Cloud &bull;
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {previewMode === 'poster' && (
                            <div className="flex flex-col gap-8 items-center relative z-10 animate-in fade-in zoom-in duration-500">
                                <div
                                    ref={posterRef}
                                    className="w-[480px] md:w-[600px] aspect-[1/1.414] bg-white rounded-[4rem] shadow-4xl p-12 md:p-20 flex flex-col items-center justify-between text-center overflow-hidden relative group/poster border-8 border-white/10"
                                    style={{ direction: 'rtl' }}
                                >
                                    {/* Luxury Border Box inside */}
                                    <div className="absolute inset-10 border-2 border-brand-primary/5 rounded-[2rem] pointer-events-none"></div>

                                    <div className="space-y-8 relative z-10">
                                        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl transition-transform duration-700 overflow-hidden">
                                            {settings?.storeLogo ? (
                                                <img src={settings?.storeLogo} alt={storeName} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src="/branding/afia_logo.png" alt="Afia" className="w-full h-full object-contain p-4" />
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h2 className="text-6xl font-black text-brand-dark tracking-tighter">{storeName}</h2>
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="h-0.5 w-12 bg-brand-primary/20"></div>
                                                <div className="px-4 py-1 bg-brand-primary text-white text-xs font-black rounded-full shadow-lg shadow-brand-primary/20">نظام ألف عافية للأعمال</div>
                                                <div className="h-0.5 w-12 bg-brand-primary/20"></div>
                                            </div>
                                            <p className="text-xl font-black text-brand-secondary mt-2 tracking-widest uppercase opacity-60">Digital Ordering Experience</p>
                                        </div>
                                    </div>

                                    <div className="relative group p-12">
                                        <div className="absolute inset-0 bg-brand-primary/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                        <div className="p-12 bg-white rounded-[5rem] border-[12px] border-brand-dark shadow-4xl relative z-10 transition-all hover:scale-105 duration-700">
                                            <QRCodeCanvas
                                                value={`https://menu.alafia.iq/${storeName.replace(/\s+/g, '-').toLowerCase()}`}
                                                size={280}
                                                level="H"
                                                includeMargin={false}
                                                fgColor="#1a1a1a"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-5 relative z-10">
                                        <p className="text-4xl font-black text-brand-dark uppercase tracking-tighter">امسح الكود واستمتع بالطلب الذكي</p>
                                        <p className="text-lg text-brand-secondary/40 font-black tracking-widest uppercase">Scan to access the full digital menu</p>
                                    </div>

                                    {/* Professional Watermark Logo */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-12">
                                        <img src="/branding/afia_logo.png" className="w-[500px]" alt="" />
                                    </div>
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                                        <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Powered by Al Afia Smart Systems</p>
                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ultra-Premium Export Progress Overlay */}
            {isExporting && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-brand-dark/60 backdrop-blur-2xl animate-in fade-in duration-500 px-4">
                    <div className="bg-white rounded-[4rem] p-16 shadow-5xl max-w-md w-full text-center space-y-10 animate-in zoom-in slide-in-from-bottom-10 duration-700 border-[12px] border-brand-primary/5 relative overflow-hidden">

                        {/* Animated Background Pulse */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl animate-pulse -mt-32"></div>

                        <div className="relative">
                            <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
                                <div className="absolute inset-0 border-[6px] border-brand-primary/10 rounded-[2.5rem]"></div>
                                <div className="absolute inset-0 border-[6px] border-brand-primary rounded-[2.5rem] border-t-transparent border-l-transparent animate-spin duration-1000"></div>
                                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-primary/40 group animate-bounce">
                                    <Sparkles size={40} className="animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <h3 className="text-3xl font-black text-brand-dark tracking-tighter">جاري الابتكار الرقمي</h3>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-1 w-8 bg-brand-primary/20 rounded-full"></div>
                                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Processing Your Menu</span>
                                <div className="h-1 w-8 bg-brand-primary/20 rounded-full"></div>
                            </div>
                            <p className="text-xs font-bold text-gray-500/80 leading-relaxed max-w-[280px] mx-auto">
                                نحن الآن بصدد تحويل بيانات متجر <span className="text-brand-primary font-black">{storeName}</span> إلى ملصق QR فخيم جاهز للطباعة بدقة عالية.
                            </p>
                        </div>

                        {/* Modern Progress Dots */}
                        <div className="flex gap-2 justify-center items-center h-4">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full bg-brand-primary opacity-20 animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                ></div>
                            ))}
                        </div>

                        <div className="text-[8px] font-black text-gray-300 uppercase tracking-widest pt-4">
                            Al Afia Intelligence Engine &bull; System v2.0
                        </div>
                    </div>
                </div>
            )}

            {/* Unified Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    );
};

export default DigitalMenuModal;
