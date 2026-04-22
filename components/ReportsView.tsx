
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Employee, Supplier, AppSettings } from '../types';
import {
    FileText, Download, Calendar, TrendingUp,
    ChevronLeft, ChevronRight, BarChart3,
    PieChart, Clock, DollarSign, Package,
    Sparkles, RefreshCw, ArrowDownRight, ArrowUpRight,
    Wallet, Users, ShoppingBag
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/currencyUtils';

interface ReportsViewProps {
    transactions: Transaction[];
    employees: Employee[];
    suppliers: Supplier[];
    settings: AppSettings;
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const ReportsView: React.FC<ReportsViewProps> = ({ transactions, employees, suppliers, settings }) => {
    const [period, setPeriod] = useState<ReportPeriod>('daily');
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Statistics Calculation logic
    const stats = useMemo(() => {
        const now = new Date();

        const filterByDate = (p: ReportPeriod) => {
            const start = new Date();
            if (p === 'daily') start.setHours(0, 0, 0, 0);
            else if (p === 'weekly') start.setDate(now.getDate() - 7);
            else if (p === 'monthly') start.setMonth(now.getMonth() - 1);
            else if (p === 'yearly') start.setFullYear(now.getFullYear() - 1);

            return transactions.filter(t => new Date(t.date) >= start);
        };

        const compute = (p: ReportPeriod) => {
            const periodTransactions = filterByDate(p);
            const revenue = periodTransactions.reduce((sum, t) => sum + t.total, 0);

            // Calculate Supplier Expenses for this period
            // (Assuming lastSupplyDate is the date of the full totalPaid for simplicity in this version, 
            // but filtering by period if date matches)
            const supplierExpenses = suppliers.reduce((sum, s) => {
                const supplyDate = new Date(s.lastSupplyDate);
                const periodStart = new Date();
                if (p === 'daily') periodStart.setHours(0, 0, 0, 0);
                else if (p === 'weekly') periodStart.setDate(now.getDate() - 7);
                else if (p === 'monthly') periodStart.setMonth(now.getMonth() - 1);
                else if (p === 'yearly') periodStart.setFullYear(now.getFullYear() - 1);

                if (supplyDate >= periodStart) {
                    return sum + (s.totalPaid || 0);
                }
                return sum;
            }, 0);

            // Calculate Employee Salaries
            const totalMonthlySalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
            let salaryExpense = 0;
            if (p === 'daily') salaryExpense = totalMonthlySalaries / 30;
            else if (p === 'weekly') salaryExpense = (totalMonthlySalaries / 30) * 7;
            else if (p === 'monthly') salaryExpense = totalMonthlySalaries;
            else if (p === 'yearly') salaryExpense = totalMonthlySalaries * 12;

            const totalExpenses = supplierExpenses + salaryExpense;
            const netProfit = revenue - totalExpenses;

            // Popular Items
            const itemMap: Record<string, number> = {};
            periodTransactions.forEach(t => {
                t.items.forEach(item => {
                    itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
                });
            });
            const topItem = Object.entries(itemMap).sort((a, b) => b[1] - a[1])[0] || ["لا يوجد", 0];

            return {
                revenue,
                supplierExpenses,
                salaryExpense,
                totalExpenses,
                netProfit,
                orderCount: periodTransactions.length,
                topItem: topItem[0],
                topItemCount: topItem[1],
                avgOrderValue: periodTransactions.length > 0 ? revenue / periodTransactions.length : 0
            };
        };

        return {
            daily: compute('daily'),
            weekly: compute('weekly'),
            monthly: compute('monthly'),
            yearly: compute('yearly')
        };
    }, [transactions, employees, suppliers]);

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
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`تثرير_محاسبي_${period}_${new Date().toLocaleDateString('ar-IQ')}.pdf`);
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
            {/* Header section with tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-coffee-900 mb-2">التقارير المحاسبية</h1>
                    <p className="text-gray-500">تحليل دقيق للإيرادات، المصروفات، وصافي الأرباح</p>
                </div>

                <div className="flex bg-white p-2 rounded-2xl shadow-xl border border-gold-200">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-8 py-3 rounded-xl font-black transition-all text-sm ${period === p
                                ? 'bg-coffee-900 text-gold-500 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-coffee-900'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Accounting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[3rem] border border-green-100 shadow-xl shadow-green-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[4rem] flex items-center justify-center -mr-8 -mt-8 transition-transform group-hover:scale-110">
                        <TrendingUp size={24} className="text-green-600 translate-x-2 translate-y-2" />
                    </div>
                    <span className="text-gray-400 text-xs font-bold mb-1 block">إجمالي الإيرادات</span>
                    <h3 className="text-3xl font-black text-coffee-900">{formatCurrency(currentStats.revenue, settings.currency)}</h3>
                    <div className="flex items-center gap-1 mt-4 text-green-600 font-bold text-[10px]">
                        <ArrowUpRight size={12} />
                        <span>نمو مستمر</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-red-100 shadow-xl shadow-red-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[4rem] flex items-center justify-center -mr-8 -mt-8 transition-transform group-hover:scale-110">
                        <ShoppingBag size={24} className="text-red-600 translate-x-2 translate-y-2" />
                    </div>
                    <span className="text-gray-400 text-xs font-bold mb-1 block">مصاريف الموردين</span>
                    <h3 className="text-3xl font-black text-red-600">{formatCurrency(currentStats.supplierExpenses, settings.currency)}</h3>
                    <div className="flex items-center gap-1 mt-4 text-red-400 font-bold text-[10px]">
                        <ArrowDownRight size={12} />
                        <span>من قسم الموردين</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-orange-100 shadow-xl shadow-orange-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[4rem] flex items-center justify-center -mr-8 -mt-8 transition-transform group-hover:scale-110">
                        <Users size={24} className="text-orange-600 translate-x-2 translate-y-2" />
                    </div>
                    <span className="text-gray-400 text-xs font-bold mb-1 block">مصاريف الرواتب</span>
                    <h3 className="text-3xl font-black text-orange-600">{formatCurrency(currentStats.salaryExpense, settings.currency)}</h3>
                    <div className="flex items-center gap-1 mt-4 text-orange-400 font-bold text-[10px]">
                        <Wallet size={12} />
                        <span>إدارة الموظفين</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-coffee-900 to-brand-dark p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl"></div>
                    <span className="text-gold-200/50 text-xs font-bold mb-1 block">صافي الربح</span>
                    <h3 className="text-3xl font-black text-gold-500">{formatCurrency(currentStats.netProfit, settings.currency)}</h3>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gold-500/10 text-gold-200 rounded-full text-[10px] font-black">
                        <Sparkles size={12} />
                        <span>الأرباح الصافية</span>
                    </div>
                </div>
            </div>

            {/* Detailed Preview Section */}
            <div className="bg-white rounded-[4rem] shadow-2xl border border-gold-100 overflow-hidden relative mb-20">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-coffee-900 rounded-[1.5rem] flex items-center justify-center text-gold-500 shadow-xl">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-brand-dark">الكشف المحاسبي الموحد</h2>
                            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Unified Accounting Disclosure | {periodLabels[period]}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleExportPDF}
                        disabled={isGenerating}
                        className="flex items-center gap-3 px-10 py-5 bg-gold-500 hover:bg-gold-600 text-coffee-900 font-black rounded-3xl transition-all shadow-xl shadow-gold-500/20 disabled:opacity-50 group active:scale-95"
                    >
                        {isGenerating ? <RefreshCw size={22} className="animate-spin" /> : <Download size={22} className="group-hover:translate-y-1 transition-transform" />}
                        <span>تصدير التقرير المالي</span>
                    </button>
                </div>

                <div ref={reportRef} className="p-16 bg-white" dir="rtl">
                    <div className="flex justify-between items-start border-b-8 border-coffee-900 pb-10 mb-12">
                        <div className="text-right">
                            <h1 className="text-5xl font-black text-coffee-900 mb-3">{settings.storeName}</h1>
                            <div className="flex items-center gap-2 text-gold-600">
                                <Sparkles size={20} />
                                <p className="text-xl font-bold uppercase tracking-[0.2em]">تقرير الأداء المالي والربحية</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-gray-400 font-black text-sm mb-1 uppercase tracking-widest">تاريخ الإصدار</p>
                            <p className="text-2xl font-black text-coffee-900">{new Date().toLocaleDateString('ar-IQ')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 mb-16 text-right">
                        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                            <p className="text-xs text-brand-primary font-black uppercase mb-3">إجمالي المدخول</p>
                            <p className="text-4xl font-black text-coffee-900">{formatCurrency(currentStats.revenue, settings.currency)}</p>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                            <p className="text-xs text-red-500 font-black uppercase mb-3">إجمالي المصاريف</p>
                            <p className="text-4xl font-black text-red-600">{formatCurrency(currentStats.totalExpenses, settings.currency)}</p>
                        </div>
                        <div className="bg-coffee-900 p-8 rounded-[2.5rem] shadow-xl">
                            <p className="text-xs text-gold-300 font-black uppercase mb-3">الفائض الربحي</p>
                            <p className="text-4xl font-black text-gold-500">{formatCurrency(currentStats.netProfit, settings.currency)}</p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div>
                            <h3 className="text-2xl font-black text-brand-dark mb-6 flex items-center gap-3">
                                <div className="w-2 h-8 bg-brand-primary rounded-full"></div>
                                تحليل بنود المصروفات
                            </h3>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="p-8 rounded-3xl border-2 border-dashed border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-black text-gray-500">مشتريات الموردين</span>
                                        <span className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black">قطاع التوريد</span>
                                    </div>
                                    <p className="text-3xl font-black text-brand-dark">{formatCurrency(currentStats.supplierExpenses, settings.currency)}</p>
                                    <p className="text-[10px] text-gray-400 mt-4 font-bold leading-relaxed">تشمل هذه القيمة كافة المبالغ المدفوعة لموردي البن والحليب والمواد التكميلية خلال الفترة المختارة.</p>
                                </div>
                                <div className="p-8 rounded-3xl border-2 border-dashed border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="font-black text-gray-500">رواتب وأجور الموظفين</span>
                                        <span className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-black">الموارد البشرية</span>
                                    </div>
                                    <p className="text-3xl font-black text-brand-dark">{formatCurrency(currentStats.salaryExpense, settings.currency)}</p>
                                    <p className="text-[10px] text-gray-400 mt-4 font-bold leading-relaxed">تقدير دقيق للتكلفة التشغيلية للعمالة المحسوبة بناءً على الرواتب الشهرية والمدة الزمنية للتقرير.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-black text-brand-dark mb-6 flex items-center gap-3">
                                <div className="w-2 h-8 bg-brand-primary rounded-full"></div>
                                مؤشرات الأداء والبيع
                            </h3>
                            <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 flex justify-between items-center">
                                <div className="flex flex-col gap-2">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">المنتج النجم (Star Product)</span>
                                    <p className="text-2xl font-black text-coffee-900">{currentStats.topItem}</p>
                                    <span className="text-xs text-brand-primary font-black">بإجمالي مبيعات: {currentStats.topItemCount} قطعة</span>
                                </div>
                                <div className="w-px h-20 bg-gray-200"></div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">متوسط قيمة العملية (AOV)</span>
                                    <p className="text-2xl font-black text-coffee-900">{formatCurrency(currentStats.avgOrderValue, settings.currency)}</p>
                                    <span className="text-xs text-brand-primary font-black">عبر {currentStats.orderCount} معاملة ناجحة</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center opacity-40">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">© Al Afia Business Intelligence - Confidential Financial Report</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Generated Securely via Golden POS Cloud</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
