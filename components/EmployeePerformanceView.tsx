
import React, { useMemo, useState, useRef } from 'react';
import { Transaction, Employee, AppSettings } from '../types';
import {
    Users, TrendingUp, ShoppingBag, ChefHat,
    Truck, Banknote, Star, Award, Search,
    Filter, Download, RefreshCw, Sparkles, FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { patchClonedSubtreeForHtml2Canvas } from '../utils/html2canvasCompat';
import StatusModal from './StatusModal';

interface EmployeePerformanceViewProps {
    employees: Employee[];
    transactions: Transaction[];
    settings: AppSettings;
}

const EmployeePerformanceView: React.FC<EmployeePerformanceViewProps> = ({ employees, transactions, settings }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'loading', title: string, message: string }>({
        isOpen: false,
        type: 'loading',
        title: '',
        message: ''
    });
    const reportRef = useRef<HTMLDivElement>(null);

    const performanceData = useMemo(() => {
        return employees.map(emp => {
            const salesCount = transactions.filter(t => t.salesPerson === emp.name).length;
            const kitchenCount = transactions.filter(t => t.kitchenPerson === emp.name).length;
            const deliveryCount = transactions.filter(t => t.deliveredBy === emp.name).length;
            const cashierCount = transactions.filter(t => t.cashierPerson === emp.name).length;

            const totalActions = salesCount + kitchenCount + deliveryCount + cashierCount;

            return {
                ...emp,
                stats: {
                    sales: salesCount,
                    kitchen: kitchenCount,
                    delivery: deliveryCount,
                    cashier: cashierCount,
                    total: totalActions
                }
            };
        }).sort((a, b) => b.stats.total - a.stats.total);
    }, [employees, transactions]);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setIsGenerating(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حوسبة تقارير الأداء الفردية',
            message: 'نقوم الآن بتحليل إنتاجية الموظفين وتوليد حصيلة العمليات لكل قسم، يرجى الانتظار...'
        });

        const exportId = 'employee-performance-report';
        reportRef.current.setAttribute('data-export-capture', exportId);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    patchClonedSubtreeForHtml2Canvas(clonedDoc, {
                        exportId,
                        attributeName: 'data-export-capture',
                        fallbackColor: '#2D6A4F'
                    });
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);
            const imgHeightInPDF = (canvas.height * contentWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, imgHeightInPDF);

            pdf.save(`تقرير_أداء_الموظفين_${settings.storeName}_${new Date().toISOString().split('T')[0]}.pdf`);

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم تصدير تقرير الأداء بنجاح',
                message: 'تم حفظ الكشف التفصيلي لإنتاجية الكادر بنجاح.'
            });

            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 3000);

        } catch (error) {
            console.error("PDF Generation error:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في معالجة التقرير',
                message: 'عذراً، واجهنا صعوبة في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.'
            });
        } finally {
            setIsGenerating(false);
            reportRef.current?.removeAttribute('data-export-capture');
        }
    };

    return (
        <div className="view-container">
            {/* Background Patterns */}
            <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 relative z-10 transition-all">
                <div className="flex items-center gap-4 text-right">
                    <div className="bg-brand-primary p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-xl shadow-brand-primary/20 shrink-0">
                        <Users size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black text-brand-dark mb-1">حوكمة أداء الموظفين</h1>
                        <p className="text-brand-dark/40 font-bold text-[10px] md:text-sm">تتبع الإنتاجية والمسؤولية لكل حساب</p>
                    </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    <button
                        onClick={handleExportPDF}
                        disabled={isGenerating}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-secondary px-8 py-4 rounded-[1.5rem] font-black text-white shadow-xl shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isGenerating ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                        <span>تحميل تقرير الأداء</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 relative z-10">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-primary/5 flex items-center gap-5 transition-all hover:border-brand-primary/20">
                    <div className="bg-brand-primary/10 p-4 rounded-2xl text-brand-primary">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase">مبيعات</p>
                        <p className="text-2xl font-black text-brand-dark">{transactions.filter(t => t.salesPerson).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-primary/5 flex items-center gap-5 transition-all hover:border-orange-500/20">
                    <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-500">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase">تحضيرات</p>
                        <p className="text-2xl font-black text-brand-dark">{transactions.filter(t => t.kitchenPerson).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-primary/5 flex items-center gap-5 transition-all hover:border-blue-500/20">
                    <div className="bg-blue-500/10 p-4 rounded-2xl text-blue-500">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase">استلام</p>
                        <p className="text-2xl font-black text-brand-dark">{transactions.filter(t => t.deliveredBy).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-primary/5 flex items-center gap-5 transition-all hover:border-green-600/20">
                    <div className="bg-green-600/10 p-4 rounded-2xl text-green-600">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase">فواتير</p>
                        <p className="text-2xl font-black text-brand-dark">{transactions.filter(t => t.cashierPerson).length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl border border-brand-primary/5 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h2 className="text-xl font-black text-brand-dark flex items-center gap-3">
                        <Award className="text-brand-accent truncate" /> ترتيب الموظفين حسب الأداء
                    </h2>
                    <div className="relative w-64">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="بحث عن موظف..."
                            className="w-full pr-12 pl-4 py-2.5 bg-white rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">الموظف</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">الدور الوظيفي</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-center">مبيعات</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-center">مطبخ</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-center">استلام</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-center">كاشير</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-left">مجموع العمليات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {performanceData.map((emp, idx) => (
                                <tr key={emp.uid} className="hover:bg-brand-primary/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-light/20 flex items-center justify-center font-black text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-brand-dark">{emp.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-1.5 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center font-black text-brand-primary bg-brand-primary/5">{emp.stats.sales}</td>
                                    <td className="px-8 py-6 text-center font-black text-orange-500">{emp.stats.kitchen}</td>
                                    <td className="px-8 py-6 text-center font-black text-blue-500 bg-blue-50/30">{emp.stats.delivery}</td>
                                    <td className="px-8 py-6 text-center font-black text-green-600">{emp.stats.cashier}</td>
                                    <td className="px-8 py-6 text-left">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="font-black text-xl text-brand-dark">{emp.stats.total}</span>
                                            {idx === 0 && <Star className="text-brand-accent fill-brand-accent" size={18} />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Report Container for PDF Export */}
            <div className="fixed left-[-9999px] top-[-9999px]">
                <div
                    ref={reportRef}
                    className="w-[210mm] bg-white p-16"
                    dir="rtl"
                >
                    <div className="flex justify-between items-start border-b-8 border-brand-dark pb-10 mb-12">
                        <div className="text-right">
                            <h1 className="text-5xl font-black text-brand-dark mb-3">{settings.storeName}</h1>
                            <div className="flex items-center gap-2 text-brand-accent">
                                <Sparkles size={20} />
                                <p className="text-xl font-bold uppercase tracking-[0.2em]">كشف إنتاجية وأداء الكادر الوظيفي</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-gray-400 font-black text-sm mb-1 uppercase tracking-widest">تاريخ الإصدار</p>
                            <p className="text-2xl font-black text-brand-dark">{new Date().toLocaleDateString('ar-IQ')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6 mb-16">
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <ShoppingBag className="text-brand-primary mb-2" size={24} />
                            <p className="text-[10px] font-black text-gray-400 uppercase">مبيعات</p>
                            <p className="text-2xl font-black text-brand-dark">{transactions.filter(t => t.salesPerson).length}</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <ChefHat className="text-orange-500 mb-2" size={24} />
                            <p className="text-[10px] font-black text-gray-400 uppercase">تحضير</p>
                            <p className="text-2xl font-black text-brand-dark">{transactions.filter(t => t.kitchenPerson).length}</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Truck className="text-blue-500 mb-2" size={24} />
                            <p className="text-[10px] font-black text-gray-400 uppercase">استلام</p>
                            <p className="text-2xl font-black text-brand-dark">{transactions.filter(t => t.deliveredBy).length}</p>
                        </div>
                        <div className="bg-brand-dark p-6 rounded-3xl flex flex-col items-center text-white">
                            <Banknote className="text-brand-accent mb-2" size={24} />
                            <p className="text-[10px] font-black opacity-60 uppercase">فواتير</p>
                            <p className="text-2xl font-black">{transactions.filter(t => t.cashierPerson).length}</p>
                        </div>
                    </div>

                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b-2 border-brand-dark">
                                <th className="py-4 font-black text-sm">الموظف</th>
                                <th className="py-4 font-black text-sm">الدور</th>
                                <th className="py-4 font-black text-sm text-center">مبيعات</th>
                                <th className="py-4 font-black text-sm text-center">مطبخ</th>
                                <th className="py-4 font-black text-sm text-center">كاشير</th>
                                <th className="py-4 font-black text-sm text-left">المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performanceData.map((emp) => (
                                <tr key={emp.uid} className="border-b border-gray-100">
                                    <td className="py-6 font-black text-brand-dark">{emp.name}</td>
                                    <td className="py-6 text-sm font-bold text-gray-500">{emp.role}</td>
                                    <td className="py-6 text-center font-black">{emp.stats.sales}</td>
                                    <td className="py-6 text-center font-black">{emp.stats.kitchen}</td>
                                    <td className="py-6 text-center font-black">{emp.stats.cashier}</td>
                                    <td className="py-6 text-left font-black text-brand-primary">{emp.stats.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center opacity-40">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">© Al Afia Performance Intelligence - Official Document</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Generated via AFIA POS Cloud</p>
                    </div>
                </div>
            </div>

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

export default EmployeePerformanceView;
