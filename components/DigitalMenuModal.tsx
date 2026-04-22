
import React, { useState, useRef } from 'react';
import StatusModal from './StatusModal';
import {
    X, QrCode, Download, Printer, Layout,
    CheckCircle2, Palette, Eye, Share2, FileText,
    Smartphone, Sparkles, Image as ImageIcon,
    Brush, Type, Settings2, Languages,
    ArrowRightCircle, MonitorSmartphone,
    LayoutGrid, List as ListIcon
} from 'lucide-react';
import { MenuItem, AppSettings } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/currencyUtils';
import { patchClonedSubtreeForHtml2Canvas } from '../utils/html2canvasCompat';
import { firestoreService } from '../services/firestoreService';

interface DigitalMenuModalProps {
    products: MenuItem[];
    isOpen: boolean;
    onClose: () => void;
    storeName: string;
    settings: AppSettings;
}

const DigitalMenuModal: React.FC<DigitalMenuModalProps> = ({ products, isOpen, onClose, storeName, settings }) => {

    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [theme, setTheme] = useState<'modern' | 'classic' | 'minimal' | 'dark'>(settings?.digitalMenu?.theme || 'modern');
    const [layout, setLayout] = useState<'grid' | 'list'>(settings?.digitalMenu?.layout || 'grid');
    const [primaryColor, setPrimaryColor] = useState(settings?.digitalMenu?.primaryColor || '#2d6a4f');
    const [showIngredients, setShowIngredients] = useState(settings?.digitalMenu?.showIngredients !== false);
    const [storeDescription, setStoreDescription] = useState(settings?.digitalMenu?.heroBanner || 'نرحب بكم في تجربتنا الرقمية المتميزة. نهدف لتقديم أفضل جودة وأرقى خدمة تليق بذائقتكم.');
    const [activeTab, setActiveTab] = useState<'design' | 'content'>('design');
    const [previewMode, setPreviewMode] = useState<'mobile' | 'poster'>('mobile');
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'loading', title: string, message: string }>({
        isOpen: false,
        type: 'loading',
        title: '',
        message: ''
    });

    const previewRef = useRef<HTMLDivElement>(null);
    const posterRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    // Synchronize selected products when modal opens or products data changes
    React.useEffect(() => {
        if (isOpen && products.length > 0 && selectedProducts.length === 0) {
            setSelectedProducts(products.map(p => p.id));
        }
    }, [isOpen, products]);

    if (!isOpen) return null;

    const exportProfessionalPDF = async () => {
        if (!exportRef.current || isExporting) return;

        setIsExporting(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري إنشاء المنيو الذكي',
            message: 'نستخدم تقنيات عافية المتقدمة لضغط البيانات وتوليد ملصق QR عالي الدقة، يرجى الانتظار...'
        });

        // Stage 1: UI Update and Preparation
        await new Promise(resolve => setTimeout(resolve, 800));

        const exportId = 'digital-menu-export';
        exportRef.current.setAttribute('data-export-capture', exportId);

        try {
            // Stage 2: Capture the hidden export div (exact A4 px dimensions)
            const canvas = await html2canvas(exportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 20000,
                width: 794,
                height: 1123,
                onclone: (clonedDoc) => {
                    patchClonedSubtreeForHtml2Canvas(clonedDoc, {
                        exportId,
                        attributeName: 'data-export-capture',
                        fallbackColor: '#2D6A4F'
                    });
                }
            });

            // Stage 3: PDF Assembly
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            // Stage 4: Saving and cleanup
            pdf.save(`Al_Afia_QR_Menu_${settings.storeName.replace(/\s+/g, '_')}.pdf`);

            setIsExporting(false);
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم التوليد بنجاح',
                message: 'ملصق الـ QR جاهز الآن وتم حفظه على جهازك بجودة مطبعية فائقة.'
            });

            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
                onClose();
            }, 3000);

        } catch (error) {
            console.error("QR Export Failure:", error);
            setIsExporting(false);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'فشل في توليد الملصق',
                message: 'حدث خطأ تقني غير متوقع. قد يكون ذلك بسبب حجم البيانات أو قيود أمنية في المتصفح، يرجى إعادة المحاولة.'
            });
        } finally {
            exportRef.current?.removeAttribute('data-export-capture');
        }
    };

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSaveMenuConfig = async () => {
        setIsSaving(true);
        try {
            const updatedSettings: AppSettings = {
                ...settings,
                digitalMenu: {
                    theme,
                    layout,
                    primaryColor,
                    showIngredients,
                    heroBanner: storeDescription
                }
            };
            await firestoreService.updateSettings(updatedSettings);
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم الحفظ بنجاح',
                message: 'تم تحديث مظهر المنيو الإلكتروني واعتماده للزبائن فوراً.'
            });
            setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 2000);
        } catch (error) {
            console.error("Save Menu Config Error:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'فشل الحفظ',
                message: 'حدث خطأ أثناء محاولة حفظ الإعدادات، يرجى المحاولة لاحقاً.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter(p => selectedProducts.includes(p.id));

    const themeConfig = {
        modern: {
            bg: 'bg-brand-cream',
            text: 'text-brand-dark',
            accent: primaryColor,
            card: 'bg-white border-brand-primary/10 shadow-sm',
            secondary: 'text-brand-secondary',
            label: 'العصري الأنيق'
        },
        dark: {
            bg: 'bg-[#0a0a0a]',
            text: 'text-white',
            accent: primaryColor,
            card: 'bg-white/5 border-white/10 backdrop-blur-sm',
            secondary: 'text-orange-400',
            label: 'الاحترافي المعتم'
        },
        classic: {
            bg: 'bg-[#faf7f2]',
            text: 'text-[#4a3728]',
            accent: primaryColor,
            card: 'bg-white border-[#e0d6cc]',
            secondary: 'text-[#8c6d46]',
            label: 'الكلاسيكي الفخم'
        },
        minimal: {
            bg: 'bg-white',
            text: 'text-gray-900',
            accent: primaryColor,
            card: 'bg-gray-50 border-gray-100',
            secondary: 'text-gray-500',
            label: 'بسيط وهادئ'
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

                                {/* Color and Layout Control */}
                                <section className="space-y-6">
                                    <h3 className="text-[10px] items-center gap-2 flex font-black text-brand-secondary uppercase tracking-widest">
                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                                        تخصيص الألوان والنمط
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border-2 border-brand-primary/5">
                                            <div className="w-10 h-10 rounded-xl shadow-inner border border-gray-100 shrink-0 overflow-hidden relative">
                                                <input
                                                    type="color"
                                                    value={primaryColor}
                                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                                    className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-brand-dark">لون الهوية الأساسي</p>
                                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{primaryColor}</p>
                                            </div>
                                        </div>

                                        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2">
                                            <button
                                                onClick={() => setLayout('grid')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] ${layout === 'grid' ? 'bg-white shadow-md text-brand-primary active:scale-95' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <LayoutGrid size={14} /> شبكة
                                            </button>
                                            <button
                                                onClick={() => setLayout('list')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] ${layout === 'list' ? 'bg-white shadow-md text-brand-primary active:scale-95' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <ListIcon size={14} /> قائمة
                                            </button>
                                        </div>
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
                        <div className="flex-1"></div>
                        {previewMode === 'mobile' && (
                            <button
                                onClick={handleSaveMenuConfig}
                                disabled={isSaving}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] flex items-center gap-2 shadow-xl shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle2 size={14} />}
                                اعتماد وحفظ تصميم المنيو
                            </button>
                        )}
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
                                                    <div key={p.id} className={`p-4 rounded-[1.8rem] border transition-all duration-500 hover:scale-[1.03] ${currentTheme.card} ${layout === 'list' ? 'flex gap-3 items-center' : ''}`}>
                                                        <div
                                                            style={{ backgroundColor: currentTheme.accent }}
                                                            className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xl shadow-sm text-white/90 backdrop-blur-sm border border-white/10 ${layout === 'grid' ? 'mb-3' : ''}`}
                                                        >
                                                            {p.category === 'Coffee' ? '☕' : p.category === 'Tea' ? '🍵' : '🍔'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <h4 className="font-black text-[11px] truncate">{p.name}</h4>
                                                                <span
                                                                    style={{ color: currentTheme.accent }}
                                                                    className={`text-[11px] font-black shrink-0`}
                                                                >
                                                                    {formatCurrency(p.price, settings.currency)}
                                                                </span>
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
                                {/* ── SCALED PREVIEW (visual only, no ref used for export) ── */}
                                <div style={{
                                    width: '397px',   /* 794px / 2  — half A4 for preview */
                                    height: '561px',  /* 1123px / 2 */
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '1.25rem',
                                    boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
                                    border: '5px solid #1a3a2a',
                                    flexShrink: 0,
                                }}>
                                    {/* inner poster scaled at 50% from top-left */}
                                    <div
                                        ref={posterRef}
                                        style={{
                                            width: '794px',
                                            height: '1123px',
                                            transformOrigin: 'top left',
                                            transform: 'scale(0.5)',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            direction: 'rtl',
                                        }}
                                    >
                                        {/* ── POSTER CONTENT (shared between preview & export) ── */}
                                        {/* TOP ACCENT BAND */}
                                        <div style={{ width: '100%', height: '18px', background: 'linear-gradient(90deg, #1a3a2a 0%, #2d6a4f 55%, #f4a261 100%)', flexShrink: 0 }} />

                                        {/* LOGO ZONE */}
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 60px 36px', background: '#ffffff', borderBottom: '1px solid rgba(45,106,79,0.12)', flexShrink: 0 }}>
                                            {/* Logo */}
                                            <div style={{ width: '180px', height: '180px', borderRadius: '40px', background: '#ffffff', border: '6px solid rgba(45,106,79,0.15)', boxShadow: '0 20px 60px rgba(45,106,79,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '30px', flexShrink: 0 }}>
                                                {settings?.storeLogo ? (
                                                    <img src={settings.storeLogo} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <img src="/branding/afia_logo.png" alt="Afia" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                                                )}
                                            </div>
                                            {/* Store Name */}
                                            <h1 style={{ fontFamily: 'inherit', fontWeight: 900, fontSize: storeName.length > 16 ? '56px' : storeName.length > 10 ? '72px' : '88px', color: '#1a3a2a', lineHeight: 1.05, letterSpacing: '0', margin: '0 0 24px 0', textAlign: 'center', wordBreak: 'break-word', direction: 'rtl' }}>{storeName}</h1>
                                            {/* System Badge */}
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#2d6a4f', color: '#ffffff', padding: '12px 28px', borderRadius: '100px', boxShadow: '0 8px 24px rgba(45,106,79,0.3)', direction: 'ltr' }}>
                                                <img src="/branding/afia_logo.png" alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                                                <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0', direction: 'rtl', textAlign: 'right', whiteSpace: 'nowrap' }}>نظام ألف عافية للأعمال</span>
                                            </div>
                                        </div>

                                        {/* TAGLINE */}
                                        <div style={{ padding: '28px 0', flexShrink: 0, textAlign: 'center' }}>
                                            <p style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '6px', color: 'rgba(45,106,79,0.6)', textTransform: 'uppercase', margin: 0 }}>DIGITAL ORDERING EXPERIENCE</p>
                                        </div>

                                        {/* DIVIDER */}
                                        <div style={{ width: '70%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(45,106,79,0.25), transparent)', flexShrink: 0, margin: '0 auto' }} />

                                        {/* QR CODE ZONE — fixed height, no flex:1 */}
                                        <div style={{ width: '100%', height: '580px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 80px', flexShrink: 0 }}>
                                            {/* QR Card */}
                                            <div style={{ width: '100%', maxWidth: '500px', background: '#ffffff', border: '12px solid #1a3a2a', borderRadius: '48px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', boxShadow: '0 24px 80px rgba(26,58,42,0.15)' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '6px', color: 'rgba(45,106,79,0.55)', textTransform: 'uppercase' }}>SCAN THE MENU</div>
                                                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid rgba(45,106,79,0.1)' }}>
                                                    <QRCodeCanvas
                                                        value={`${window.location.origin}/menu`}
                                                        size={320}
                                                        level="H"
                                                        includeMargin={false}
                                                        fgColor="#1a3a2a"
                                                        bgColor="#ffffff"
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>
                                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#1a3a2a', direction: 'rtl', letterSpacing: '0', display: 'inline-block' }}>امسح الـ QR لفتح المنيو مباشرة</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* FOOTER BAND */}
                                        <div style={{ width: '100%', background: '#1a3a2a', padding: '28px 60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', flexShrink: 0, marginTop: 'auto', direction: 'ltr' }}>
                                            <img src="/branding/afia_logo.png" alt="Afia" style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                                            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Powered by Al Afia Smart Systems</div>
                                        </div>
                                    </div>{/* end posterRef inner */}
                                </div>{/* end preview wrapper */}

                                {/* ── HIDDEN EXPORT DIV (exact A4 = 794×1123px, captured by html2canvas) ── */}
                                <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
                                    <div
                                        ref={exportRef}
                                        style={{ width: '794px', height: '1123px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', overflow: 'hidden', direction: 'rtl', position: 'relative' }}
                                    >
                                        {/* TOP ACCENT BAND */}
                                        <div style={{ width: '100%', height: '18px', background: 'linear-gradient(90deg, #1a3a2a 0%, #2d6a4f 55%, #f4a261 100%)', flexShrink: 0 }} />

                                        {/* LOGO ZONE */}
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 60px 36px', background: '#ffffff', borderBottom: '1px solid rgba(45,106,79,0.12)', flexShrink: 0 }}>
                                            <div style={{ width: '180px', height: '180px', borderRadius: '40px', background: '#ffffff', border: '6px solid rgba(45,106,79,0.15)', boxShadow: '0 20px 60px rgba(45,106,79,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '30px', flexShrink: 0 }}>
                                                {settings?.storeLogo ? (
                                                    <img src={settings.storeLogo} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <img src="/branding/afia_logo.png" alt="Afia" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                                                )}
                                            </div>
                                            <h1 style={{ fontFamily: 'inherit', fontWeight: 900, fontSize: storeName.length > 16 ? '56px' : storeName.length > 10 ? '72px' : '88px', color: '#1a3a2a', lineHeight: 1.05, letterSpacing: '0', margin: '0 0 24px 0', textAlign: 'center', wordBreak: 'break-word', direction: 'rtl' }}>{storeName}</h1>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#2d6a4f', color: '#ffffff', padding: '12px 28px', borderRadius: '100px', boxShadow: '0 8px 24px rgba(45,106,79,0.3)', direction: 'ltr' }}>
                                                <img src="/branding/afia_logo.png" alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                                                <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0', direction: 'rtl', textAlign: 'right', whiteSpace: 'nowrap' }}>نظام ألف عافية للأعمال</span>
                                            </div>
                                        </div>

                                        {/* TAGLINE */}
                                        <div style={{ padding: '28px 0', flexShrink: 0, textAlign: 'center' }}>
                                            <p style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '6px', color: 'rgba(45,106,79,0.6)', textTransform: 'uppercase', margin: 0 }}>DIGITAL ORDERING EXPERIENCE</p>
                                        </div>

                                        {/* DIVIDER */}
                                        <div style={{ width: '70%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(45,106,79,0.25), transparent)', flexShrink: 0, margin: '0 auto' }} />

                                        {/* QR CODE ZONE — hardcoded height */}
                                        <div style={{ width: '100%', height: '580px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 80px', flexShrink: 0 }}>
                                            <div style={{ width: '100%', maxWidth: '500px', background: '#ffffff', border: '12px solid #1a3a2a', borderRadius: '48px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', boxShadow: '0 24px 80px rgba(26,58,42,0.15)' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '6px', color: 'rgba(45,106,79,0.55)', textTransform: 'uppercase' }}>SCAN THE MENU</div>
                                                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid rgba(45,106,79,0.1)' }}>
                                                    <QRCodeCanvas
                                                        value={`${window.location.origin}/menu`}
                                                        size={320}
                                                        level="H"
                                                        includeMargin={false}
                                                        fgColor="#1a3a2a"
                                                        bgColor="#ffffff"
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>
                                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#1a3a2a', direction: 'rtl', letterSpacing: '0', display: 'inline-block' }}>امسح الـ QR لفتح المنيو مباشرة</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* FOOTER BAND */}
                                        <div style={{ width: '100%', background: '#1a3a2a', padding: '28px 60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', flexShrink: 0, marginTop: 'auto', direction: 'ltr' }}>
                                            <img src="/branding/afia_logo.png" alt="Afia" style={{ width: '44px', height: '44px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                                            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Powered by Al Afia Smart Systems</div>
                                        </div>
                                    </div>
                                </div>{/* end hidden export div */}
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
