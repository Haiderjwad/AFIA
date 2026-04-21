
import React, { useState, useMemo, useRef } from 'react';
import { Transaction } from '../types';
import {
    FileText, Download, Calendar, TrendingUp,
    ChevronLeft, ChevronRight, BarChart3,
    PieChart, Clock, DollarSign, Package,
    Sparkles, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportsViewProps {
    transactions: Transaction[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
    const [period, setPeriod] = useState<ReportPeriod>('daily');
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Statistics Calculation
    const stats = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const filterByDate = (start: Date) =>
            transactions.filter(t => new Date(t.date) >= start);

        const compute = (data: Transaction[]) => {
            const totalSales = data.reduce((sum, t) => sum + t.total, 0);
            const orderCount = data.length;
            const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

            // Find most popular item
            const itemMap: Record<string, number> = {};
            data.forEach(t => {
                t.items.forEach(item => {
                    itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
                });
            });

            const topItem = Object.entries(itemMap).sort((a, b) => b[1] - a[1])[0] || ["لا يوجد", 0];

            return { totalSales, orderCount, avgOrderValue, topItem: topItem[0], topItemCount: topItem[1] };
        };

        return {
            daily: compute(filterByDate(startOfToday)),
            weekly: compute(filterByDate(startOfWeek)),
            monthly: compute(filterByDate(startOfMonth)),
            yearly: compute(filterByDate(startOfYear))
        };
    }, [transactions]);

    const currentStats = stats[period];

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);

        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`تقرير_المبيعات_${period}_${new Date().toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const periodLabels: Record<ReportPeriod, string> = {
        daily: 'يومي',
        weekly: 'أسبوعي',
        monthly: 'شهري',
        yearly: 'سنوي'
    };

    return (
        <div className="flex-1 p-8 bg-brand-cream overflow-y-auto no-scrollbar relative" dir="rtl">
            {/* Background Patterns (Subtle) */}
            <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-coffee-900 mb-2">التقارير المفصلة</h1>
                    <p className="text-gray-500">تحليل المبيعات والنمو المالي للفترات الزمنية</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gold-100 w-full md:w-auto">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold transition-all ${period === p
                                ? 'bg-coffee-900 text-gold-200 shadow-lg'
                                : 'text-gray-400 hover:text-coffee-900'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                {/* Main Stats Cards */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gold-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-gold-50 text-gold-600 rounded-2xl flex items-center justify-center mb-4">
                        <TrendingUp size={28} />
                    </div>
                    <span className="text-gray-400 text-xs font-bold mb-1">إجمالي المبيعات</span>
                    <h3 className="text-3xl font-black text-coffee-900">{currentStats.totalSales.toFixed(2)} $</h3>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gold-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <FileText size={28} />
                    </div>
                    <span className="text-gray-400 text-xs font-bold mb-1">عدد الطلبات</span>
                    <h3 className="text-3xl font-black text-coffee-900">{currentStats.orderCount}</h3>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gold-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                        <BarChart3 size={28} />
                    </div>
                    <span className="text-gray-400 text-xs font-bold mb-1">متوسط السلة</span>
                    <h3 className="text-3xl font-black text-coffee-900">{currentStats.avgOrderValue.toFixed(2)} $</h3>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gold-100 shadow-sm flex flex-col items-center justify-center text-center group">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                        <Sparkles size={28} />
                    </div>
                    <span className="text-gray-400 text-xs font-bold mb-1">الأكثر مبيعاً</span>
                    <h3 className="text-xl font-black text-coffee-900 truncate w-full">{currentStats.topItem}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 capitalize">الكمية: {currentStats.topItemCount}</p>
                </div>
            </div>

            {/* Printable Report Content */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-gold-100 overflow-hidden relative">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="bg-coffee-900 p-2.5 rounded-xl text-white">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-coffee-900">معاينة تقرير المبيعات ال{periodLabels[period]}</h2>
                    </div>

                    <button
                        onClick={handleExportPDF}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-coffee-900 font-bold rounded-2xl transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50"
                    >
                        {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                        <span>تصدير PDF</span>
                    </button>
                </div>

                <div ref={reportRef} className="p-10 bg-white">
                    {/* PDF Header (Hidden from screen if needed, but here we show it in preview) */}
                    <div className="border-b-4 border-gold-500 pb-8 mb-10 flex justify-between items-end">
                        <div className="text-right">
                            <h1 className="text-4xl font-black text-coffee-900 mb-2">نظام فلة POS الذهبي</h1>
                            <p className="text-gray-500 text-lg uppercase tracking-widest font-bold">تقرير المبيعات ال{periodLabels[period]}</p>
                        </div>
                        <div className="text-left text-sm text-gray-400">
                            <p>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
                            <p>الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mb-10">
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                                <TrendingUp size={20} className="text-gold-600" />
                                ملخص الأداء
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between py-3 border-b border-gray-50">
                                    <span className="text-gray-500">إجمالي الإيرادات</span>
                                    <span className="font-bold text-coffee-900">{currentStats.totalSales.toFixed(2)} $</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-50">
                                    <span className="text-gray-500">عدد العمليات الناجحة</span>
                                    <span className="font-bold text-coffee-900">{currentStats.orderCount} عملية</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-50">
                                    <span className="text-gray-500">متوسط قيمة العملية</span>
                                    <span className="font-bold text-coffee-900">{currentStats.avgOrderValue.toFixed(2)} $</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-coffee-900 flex items-center gap-2">
                                <Package size={20} className="text-gold-600" />
                                تحليل المخزون
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between py-3 border-b border-gray-50">
                                    <span className="text-gray-500">المنتج الأكثر طلباً</span>
                                    <span className="font-bold text-coffee-900">{currentStats.topItem}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-50">
                                    <span className="text-gray-500">الكمية المباعة من المنتج</span>
                                    <span className="font-bold text-coffee-900">{currentStats.topItemCount} وحدة</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-50">
                                    <span className="text-gray-500">حالة الربحية</span>
                                    <span className="px-3 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-black">ممتازة</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Preview */}
                    <div className="mt-10">
                        <h4 className="text-lg font-bold text-coffee-900 mb-6">سجل العمليات الأخير لهذه الفترة</h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50">
                                    <tr className="text-coffee-900 font-bold border-b border-gray-100">
                                        <th className="px-6 py-4">معرف الطلب</th>
                                        <th className="px-6 py-4">التاريخ</th>
                                        <th className="px-6 py-4">طريقة الدفع</th>
                                        <th className="px-6 py-4">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.slice(0, 5).map(t => (
                                        <tr key={t.id}>
                                            <td className="px-6 py-4 font-mono text-sm">#{t.id.slice(-6)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${t.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {t.paymentMethod === 'cash' ? 'نقدي' : 'بطاقة'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-coffee-900">{t.total.toFixed(2)} $</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4 text-[10px] text-gray-400 text-center">** هذه النسخة الإلكترونية معتمدة من نظام Golden POS **</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
