
import React, { useState, useRef } from 'react';
import {
    X, QrCode, Download, Printer, Layout,
    CheckCircle2, Palette, Eye, Share2, FileText,
    Smartphone, Sparkles, Image as ImageIcon
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
    const [theme, setTheme] = useState<'gold' | 'dark' | 'minimal'>('gold');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [showPreview, setShowPreview] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const exportPDF = async () => {
        if (!previewRef.current) return;

        // Create a temporary container for the print view
        const canvas = await html2canvas(previewRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`${storeName}-Menu.pdf`);
    };

    const exportQRCode = async () => {
        if (!qrRef.current) return;
        const canvas = await html2canvas(qrRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        pdf.text('منيو المتجر الإلكتروني', 105, 40, { align: 'center' });
        pdf.addImage(imgData, 'PNG', 55, 60, 100, 100);
        pdf.text(storeName, 105, 170, { align: 'center' });
        pdf.save(`${storeName}-QR-Code.pdf`);
    };

    const filteredProducts = products.filter(p => selectedProducts.includes(p.id));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95">

                {/* Left Side: Configuration (40%) */}
                <div className="w-full md:w-[400px] bg-gray-50 border-l border-gray-100 p-8 overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-coffee-900 flex items-center gap-2">
                                <Sparkles className="text-gold-500" /> صانع المنيو الذكي
                            </h2>
                            <p className="text-gray-500 text-sm">صمم منيو خاص بمتجرك بثواني</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors md:hidden">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Theme Selection */}
                    <div className="mb-8">
                        <h3 className="text-sm font-black text-coffee-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <Palette size={16} /> اختيار طابع المنيو
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {(['gold', 'dark', 'minimal'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${theme === t ? 'border-gold-500 bg-gold-50 shadow-inner' : 'border-gray-100 bg-white hover:border-gold-200'}`}
                                >
                                    <div className={`w-full h-8 rounded-lg ${t === 'gold' ? 'bg-gradient-to-r from-gold-400 to-gold-600' : t === 'dark' ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
                                    <span className="text-[10px] font-bold">{t === 'gold' ? 'الذهبي' : t === 'dark' ? 'الاحترافي' : 'البسيط'}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Selection List */}
                    <div className="mb-8 flex-1 overflow-hidden flex flex-col">
                        <h3 className="text-sm font-black text-coffee-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <CheckCircle2 size={16} /> تحديد المنتجات ({selectedProducts.length})
                        </h3>
                        <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 no-scrollbar">
                            {products.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => toggleProduct(p.id)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedProducts.includes(p.id) ? 'bg-coffee-900 text-white shadow-md' : 'bg-white text-coffee-900 hover:bg-gray-100'}`}
                                >
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedProducts.includes(p.id) ? 'bg-gold-500 border-gold-500' : 'border-gray-200 bg-gray-50'}`}>
                                        {selectedProducts.includes(p.id) && <X size={12} className="text-coffee-900" />}
                                    </div>
                                    <span className="text-sm font-bold truncate">{p.name}</span>
                                    <span className="text-[10px] opacity-60 mr-auto">{p.category}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-3 pt-6 border-t border-gray-200">
                        <button
                            onClick={exportQRCode}
                            className="w-full bg-white border-2 border-coffee-900 text-coffee-900 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gold-50 transition-all"
                        >
                            <QrCode size={20} /> توليد كود QR و PDF
                        </button>
                        <button
                            onClick={exportPDF}
                            className="w-full bg-coffee-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all"
                        >
                            <Download size={20} /> تحميل المنيو (PDF)
                        </button>
                    </div>
                </div>

                {/* Right Side: Live Preview (60%) */}
                <div className="flex-1 bg-gray-200 p-8 flex flex-col relative overflow-hidden">
                    <div className="absolute top-8 left-8 z-10 flex gap-2">
                        <button onClick={onClose} className="hidden md:flex p-3 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-lg transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl flex items-center gap-3">
                            <Smartphone size={18} className="text-coffee-900" />
                            <span className="text-sm font-black text-coffee-900">معاينة مباشرة للمنيو</span>
                        </div>
                        <div className="flex bg-white rounded-xl p-1 shadow-sm">
                            <button onClick={() => setLayout('grid')} className={`p-2 rounded-lg ${layout === 'grid' ? 'bg-gold-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}><Layout size={18} /></button>
                            <button onClick={() => setLayout('list')} className={`p-2 rounded-lg ${layout === 'list' ? 'bg-gold-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}><FileText size={18} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar rounded-[2.5rem] shadow-2xl bg-white border-[10px] border-coffee-900 max-w-[400px] mx-auto w-full relative group">
                        {/* The Actual Menu Preview Content */}
                        <div
                            ref={previewRef}
                            className={`min-h-full p-8 transition-colors duration-500 ${theme === 'gold' ? 'bg-[#fdfaf5]' :
                                theme === 'dark' ? 'bg-[#1a1c1e] text-white' : 'bg-white'
                                }`}
                        >
                            {/* Header inside preview */}
                            <div className="text-center mb-10 pt-4">
                                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 shadow-xl ${theme === 'gold' ? 'bg-gold-600 text-white' :
                                    theme === 'dark' ? 'bg-white text-coffee-900' : 'bg-coffee-900 text-white'
                                    }`}>
                                    <Smartphone size={40} />
                                </div>
                                <h1 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-coffee-900'}`}>{storeName}</h1>
                                <div className={`w-16 h-1 mx-auto mt-2 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-gold-200'}`}></div>
                            </div>

                            {/* QR Code section for PDF output visibility */}
                            <div className="flex flex-col items-center mb-8 bg-white p-4 rounded-3xl">
                                <QRCodeCanvas value={`https://menu.goldenpos.com/${storeName.replace(/\s+/g, '-').toLowerCase()}`} size={100} />
                                <p className="mt-2 text-[10px] font-bold text-coffee-900 opacity-60">امسح الكود لفتح المنيو</p>
                            </div>

                            {/* Products in preview */}
                            <div className={layout === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}>
                                {filteredProducts.map(p => (
                                    <div
                                        key={p.id}
                                        className={`p-5 rounded-[2rem] border transition-all ${theme === 'gold' ? 'bg-white border-gold-100 hover:border-gold-300' :
                                            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-coffee-900'}`}>{p.name}</span>
                                            <span className={`text-lg font-black ${theme === 'gold' ? 'text-gold-600' : theme === 'dark' ? 'text-gold-400' : 'text-coffee-900'}`}>
                                                {p.price} $
                                            </span>
                                        </div>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'} line-clamp-2`}>
                                            {p.notes || "وصف شهي ومميز لهذه الوجبة الرائعة من متجرنا."}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${theme === 'gold' ? 'bg-gold-50 text-gold-600' :
                                                theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-coffee-100 text-coffee-800'
                                                }`}>
                                                {p.category}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer in preview */}
                            <div className="mt-12 text-center pb-8 opacity-40">
                                <p className="text-[10px] font-bold">بدعم من نظام POS الذهبي</p>
                            </div>
                        </div>

                        {/* Floating QR on Preview (UI ONLY) */}
                        <div
                            ref={qrRef}
                            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-2xl border border-white/20 flex flex-col items-center gap-2 group-hover:scale-110 transition-all duration-500"
                        >
                            <QRCodeCanvas
                                value={`https://menu.goldenpos.com/${storeName.replace(/\s+/g, '-').toLowerCase()}`}
                                size={80}
                                level="H"
                                includeMargin={true}
                            />
                            <span className="text-[8px] font-black text-coffee-900">مسح الكود للمنيو</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalMenuModal;
