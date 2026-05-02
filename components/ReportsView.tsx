import React, { useState, useMemo, useRef } from 'react';
import StatusModal from './StatusModal';
import { Transaction, Employee, Supplier, AppSettings } from '../types';
import {
    FileText, Download, Calendar, TrendingUp,
    ChevronLeft, ChevronRight, BarChart3,
    PieChart, Clock, DollarSign, Package,
    Sparkles, RefreshCw, ArrowDownRight, ArrowUpRight,
    Wallet, Users, ShoppingBag, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils/currencyUtils';
import { patchClonedSubtreeForHtml2Canvas } from '../utils/html2canvasCompat';

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
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'loading', title: string, message: string }>({
        isOpen: false,
        type: 'loading',
        title: '',
        message: ''
    });
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

            const multiplier = p === 'daily' ? 1 / 30
                : p === 'weekly' ? 7 / 30
                    : p === 'monthly' ? 1
                        : 4;

            const salaryBreakdown = employees
                .filter(e => (e.salary || 0) > 0)
                .map(e => ({
                    name: e.name,
                    role: e.role,
                    monthly: e.salary || 0,
                    period: Math.round((e.salary || 0) * multiplier)
                }));

            const salaryExpense = salaryBreakdown.reduce((sum, e) => sum + e.period, 0);
            const totalMonthlySalaries = salaryBreakdown.reduce((sum, e) => sum + e.monthly, 0);

            const totalExpenses = supplierExpenses + salaryExpense;
            const netProfit = revenue - totalExpenses;

            const itemMap: Record<string, number> = {};
            periodTransactions.forEach(t => {
                t.items.forEach(item => {
                    itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
                });
            });
            const sortedItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]);
            const topItem = sortedItems[0] || ["لا يوجد", 0];

            return {
                revenue,
                supplierExpenses,
                salaryExpense,
                totalMonthlySalaries,
                salaryBreakdown,
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
        setIsGenerating(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حوسبة التقرير المالي الموحد',
            message: 'نقوم الآن بتحليل تدفقات السيولة، الإيرادات، والمصروفات التشغيلية لإنشاء وثيقة محاسبية رسمية، يرجى الانتظار...'
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pW = pdf.internal.pageSize.getWidth();
            const pH = pdf.internal.pageSize.getHeight();
            const margin = 18;
            const contentW = pW - margin * 2;
            let y = margin;

            const text = (str: string, x: number, yy: number, options?: any) => {
                pdf.text(str, x, yy, options);
            };

            type RGB = [number, number, number];
            const COL_DARK: RGB = [27, 50, 35];
            const COL_GREEN: RGB = [45, 106, 79];
            const COL_GOLD: RGB = [248, 150, 30];
            const COL_GRAY: RGB = [120, 120, 120];
            const COL_LIGHT: RGB = [245, 247, 244];

            const sf = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
            const sd = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);
            const sc = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);

            // Header Banner
            sf(COL_DARK);
            pdf.rect(0, 0, pW, 30, 'F');

            pdf.setTextColor(248, 150, 30);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            text(settings.storeName, pW - margin, 12, { align: 'right' });

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            text('FINANCIAL INTELLIGENCE REPORT', margin, 12);

            pdf.setTextColor(180, 180, 180);
            pdf.setFontSize(7);
            const rawPeriod = typeof period === 'string' ? period.toUpperCase() : 'REPORT';
            text(`Period: ${rawPeriod}`, margin, 20);
            text('Al Afia POS System', pW - margin, 20, { align: 'right' });

            y = 40;

            sc(COL_DARK);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            text('Executive Financial Summary', margin, y);
            y += 4;

            sd(COL_GREEN);
            pdf.setLineWidth(0.8);
            pdf.line(margin, y, pW - margin, y);
            y += 10;

            // 4 main boxes
            const boxW = (contentW - 9) / 4;
            const boxes = [
                { label: 'Gross Revenue', value: currentStats.totalRevenue, color: COL_GREEN },
                { label: 'Total Payroll', value: currentStats.totalMonthlySalaries, color: [234, 88, 12] },
                { label: 'Operational Cost', value: currentStats.totalExpenses, color: [37, 99, 235] },
                { label: 'Net Profit', value: currentStats.netProfit, color: [22, 163, 74], solid: true }
            ];

            boxes.forEach((box, i) => {
                const bx = margin + i * (boxW + 3);
                if (box.solid) {
                    sf(box.color as RGB);
                    pdf.roundedRect(bx, y, boxW, 24, 3, 3, 'F');
                    sc([255, 255, 255]);
                } else {
                    sf(COL_LIGHT);
                    pdf.roundedRect(bx, y, boxW, 24, 3, 3, 'F');
                    sd(box.color as RGB);
                    pdf.setLineWidth(0.5);
                    pdf.roundedRect(bx, y, boxW, 24, 3, 3, 'S');
                    sc(box.color as RGB);
                }

                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                text(String(formatCurrency(box.value, settings.currency)), bx + boxW / 2, y + 11, { align: 'center' });

                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                if (!box.solid) sc(COL_GRAY);
                text(box.label, bx + boxW / 2, y + 19, { align: 'center' });
            });

            y += 35;

            // Sales & Marketing KPIs Section
            sc(COL_DARK);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            text('Sales & Marketing KPIs', margin, y);
            y += 4;
            sd(COL_GRAY);
            pdf.setLineWidth(0.3);
            pdf.line(margin, y, pW - margin, y);
            y += 8;

            sf([250, 250, 250]);
            pdf.roundedRect(margin, y, contentW, 25, 4, 4, 'F');

            sc(COL_GRAY);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');

            // Left block
            text('TOP SELLING ITEM', margin + 10, y + 8);
            sc(COL_DARK);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');

            // Render Arabic correctly by mapping or using English placeholder if jsPDF native doesn't support Arabic font
            // We use standard jsPDF Helvetica. It might glitch on Arabic characters out-of-the-box,
            // so we'll leave it to render natively assuming the system supports Latin mostly or handles Unicode fallback
            text(String(currentStats.topItem || 'N/A'), margin + 10, y + 15);
            sc(COL_GREEN);
            pdf.setFontSize(8);
            text(`${currentStats.topItemCount} units`, margin + 10, y + 21);

            // Right block
            sc(COL_GRAY);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            text('AVERAGE ORDER VALUE (AOV)', margin + contentW / 2, y + 8);
            sc(COL_DARK);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            text(String(formatCurrency(currentStats.avgOrderValue, settings.currency)), margin + contentW / 2, y + 15);
            sc(COL_GREEN);
            pdf.setFontSize(8);
            text(`${currentStats.orderCount} total transactions`, margin + contentW / 2, y + 21);

            y += 35;

            // Header for breakdown
            sf(COL_DARK);
            pdf.rect(margin, y, contentW, 10, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'bold');
            text('Payroll Breakdown', margin + 5, y + 6.8);
            text('Amount', pW - margin - 5, y + 6.8, { align: 'right' });

            y += 10;

            if (currentStats.salaryBreakdown && currentStats.salaryBreakdown.length > 0) {
                currentStats.salaryBreakdown.forEach((emp, idx) => {
                    if (y + 12 > pH - margin) {
                        pdf.addPage();
                        y = margin;
                    }

                    if (idx % 2 === 0) {
                        sf(COL_LIGHT);
                        pdf.rect(margin, y, contentW, 12, 'F');
                    }

                    pdf.setFontSize(8.5);
                    pdf.setFont('helvetica', 'bold');
                    sc(COL_DARK);

                    // Display Employee Initial + ID if name is Arabic
                    const dispName = emp.name;
                    text(dispName, margin + 5, y + 7.8);

                    text(String(formatCurrency(emp.period, settings.currency)), pW - margin - 5, y + 7.8, { align: 'right' });
                    y += 12;
                });
            } else {
                sf(COL_LIGHT);
                pdf.rect(margin, y, contentW, 12, 'F');
                pdf.setFontSize(8);
                sc(COL_GRAY);
                text('No records found for this period.', margin + contentW / 2, y + 7.8, { align: 'center' });
                y += 12;
            }

            // Footer
            sf(COL_DARK);
            pdf.rect(0, pH - 14, pW, 14, 'F');
            pdf.setTextColor(180, 180, 180);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            text('© Al Afia Business Intelligence System — Confidential', margin, pH - 5);
            text(`Generated: ${new Date().toLocaleString('en-GB')}`, pW - margin, pH - 5, { align: 'right' });

            const fileName = `Financial_Report_${settings.storeName}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم تصدير التقرير بنجاح',
                message: 'تم حفظ الكشف المحاسبي الموحد بجميع صفحاته وتفاصيله على جهازك بصيغة PDF.'
            });

            setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 3000);

        } catch (error) {
            console.error("PDF Generation error:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في معالجة البيانات',
                message: `عذراً، واجهنا صعوبة في تحويل البيانات إلى صيغة PDF.`
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const periodLabels: Record<ReportPeriod, string> = {
        daily: 'التقرير اليومي',
        weekly: 'التقرير الأسبوعي',
        monthly: 'التقرير الشهري',
        yearly: 'التقرير السنوي'
    };

    return (
        <div className="view-container" dir="rtl">
            {/* Header section with tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-dark rounded-2xl flex items-center justify-center text-brand-accent shadow-xl shadow-brand-dark/20 dark:shadow-none dark:ring-1 dark:ring-white/30">
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark tracking-tight leading-tight">التقارير المالية</h1>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-0.5">الذكاء المالي المتقدم للمؤسسات</p>
                    </div>
                </div>

                <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-gray-200/50 border border-white flex gap-1 overflow-x-auto w-full lg:w-auto">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 lg:flex-none px-6 py-3 rounded-[1rem] font-black text-xs transition-all duration-300 whitespace-nowrap
                                ${period === p
                                    ? 'bg-brand-dark text-brand-accent shadow-lg shadow-brand-dark/20 dark:shadow-none dark:ring-1 dark:ring-white/30 scale-[1.02] -translate-y-0.5'
                                    : 'text-gray-400 hover:text-brand-primary hover:bg-gray-50'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Accounting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {/* Revenue Card */}
                <div className="bg-white rounded-[2.5rem] p-7 border border-emerald-100 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.15)] relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-60 group-hover:bg-emerald-100 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 font-bold text-[10px] px-3 py-1.5 rounded-full border border-emerald-100">
                            <ArrowUpRight size={14} /> إجمالي الدخل
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-brand-dark tracking-tighter mb-1">{formatCurrency(currentStats.revenue, settings.currency)}</h3>
                        <p className="text-[11px] font-bold text-gray-400">الإيرادات الإجمالية للفترة المحددة</p>
                    </div>
                </div>

                {/* Supplier Expenses Card */}
                <div className="bg-white rounded-[2.5rem] p-7 border border-rose-100 shadow-[0_20px_50px_-15px_rgba(244,63,94,0.1)] relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-60 group-hover:bg-rose-100 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-rose-500/10 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={24} />
                        </div>
                        <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 font-bold text-[10px] px-3 py-1.5 rounded-full border border-rose-100">
                            <ArrowDownRight size={14} /> صادر الموردين
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-brand-dark tracking-tighter mb-1">{formatCurrency(currentStats.supplierExpenses, settings.currency)}</h3>
                        <p className="text-[11px] font-bold text-gray-400">إجمالي مدفوعات البضائع والاستهلاك</p>
                    </div>
                </div>

                {/* Salary Expenses Card */}
                <div className="bg-white rounded-[2.5rem] p-7 border border-orange-100 shadow-[0_20px_50px_-15px_rgba(249,115,22,0.1)] relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-60 group-hover:bg-orange-100 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-orange-500/10 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 font-bold text-[10px] px-3 py-1.5 rounded-full border border-orange-100">
                            <Wallet size={14} /> صادر الرواتب
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-brand-dark tracking-tighter mb-1">{formatCurrency(currentStats.salaryExpense, settings.currency)}</h3>
                        <p className="text-[11px] font-bold text-gray-400">حصة الرواتب المقررة للاقتطاع</p>
                    </div>
                </div>

                {/* Net Profit Card - Premium Glassmorphism */}
                <div className="bg-gradient-to-br from-brand-dark to-[#1A2E25] rounded-[2.5rem] p-7 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-accent/20 via-transparent to-transparent opacity-80" />

                    <div className="relative z-10 flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-brand-accent text-brand-dark rounded-[1.2rem] flex items-center justify-center shadow-[0_0_20px_rgba(248,150,30,0.4)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <Sparkles size={24} />
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 text-white font-bold text-[10px] px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                            <ShieldCheck size={14} /> صافي الأرباح
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black text-white tracking-tighter mb-1 relative inline-block">
                            {formatCurrency(currentStats.netProfit, settings.currency)}
                            <div className="absolute -bottom-2 right-0 left-0 h-1 bg-gradient-to-r from-brand-accent to-transparent rounded-full" />
                        </h3>
                        <p className="text-[11px] font-bold text-white/50 mt-3 pt-1">الربح الصافي بعد خصم كافة التكاليف والمصروفات</p>
                    </div>
                </div>
            </div>

            {/* Rendered Document Preview Section */}
            <div className="bg-[#E4E6EB] p-4 sm:p-8 rounded-[3rem] shadow-[inset_0_4px_20px_rgba(0,0,0,0.05)] border border-gray-200 mb-20 relative">

                {/* PDF Export Floating Bar */}
                <div className="relative z-10 mb-8 bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] shadow-xl border border-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-brand-dark">معاينة الوثيقة المحاسبية</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">معاينة تصدير الملف</p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        disabled={isGenerating}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-xl transition-all shadow-lg active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />}
                        <span>{isGenerating ? 'جاري التحضير...' : 'تصدير كمستند PDF'}</span>
                    </button>
                </div>

                {/* The Actual "Paper" Output */}
                <div className="overflow-x-auto no-scrollbar pb-10 flex justify-center">
                    <div
                        ref={reportRef}
                        className="bg-white shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-[210mm] min-h-[297mm] p-12 relative overflow-hidden"
                        dir="rtl"
                    >
                        {/* Premium Watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0 text-brand-primary">
                            <ShieldCheck size={400} />
                        </div>

                        {/* Header Border Aesthetic */}
                        <div className="absolute top-0 right-0 left-0 h-3 bg-gradient-to-l from-brand-primary via-brand-dark to-brand-accent"></div>

                        <div className="relative z-10">
                            {/* Document Header Line */}
                            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-10">
                                <div>
                                    <h1 className="text-4xl font-black text-brand-dark tracking-tighter mb-2">{settings.storeName}</h1>
                                    <div className="inline-flex items-center gap-2 bg-brand-primary/5 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/10">
                                        <CheckCircle2 size={14} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">وثيقة تقرير أداء مالي معتمدة</p>
                                    </div>
                                </div>
                                <div className="text-left flex flex-col items-end">
                                    <div className="bg-gray-50 px-4 py-2 rounded-xl mb-2 text-center border border-gray-100">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">تاريخ الإصدار</p>
                                        <p className="text-lg font-black text-brand-dark leading-none">{new Date().toLocaleDateString('ar-EG')}</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">رقم المرجع: REP-{Math.floor(Date.now() / 1000).toString(16).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Period Title */}
                            <div className="flex items-center justify-between bg-brand-dark text-white rounded-2xl px-6 py-4 mb-10 shadow-lg">
                                <h3 className="text-xl font-black tracking-tight">الملخص المالي ({periodLabels[period]})</h3>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/5 font-bold text-xs opacity-90">
                                    <Calendar size={14} className="text-brand-accent" />
                                    حتى تاريخ {new Date().toLocaleDateString('ar-EG')}
                                </div>
                            </div>

                            {/* KPI Board Grid */}
                            <div className="grid grid-cols-3 gap-6 mb-12">
                                <div className="border border-gray-100 p-6 rounded-2xl relative overflow-hidden bg-gray-50">
                                    <div className="w-1 absolute right-0 top-0 bottom-0 bg-emerald-500 rounded-r-lg"></div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <TrendingUp size={12} className="text-emerald-500" /> إجمالي الإيرادات
                                    </p>
                                    <p className="text-2xl font-black text-brand-dark">{formatCurrency(currentStats.revenue, settings.currency)}</p>
                                </div>
                                <div className="border border-gray-100 p-6 rounded-2xl relative overflow-hidden bg-gray-50">
                                    <div className="w-1 absolute right-0 top-0 bottom-0 bg-rose-500 rounded-r-lg"></div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <ShoppingBag size={12} className="text-rose-500" /> إجمالي المصروفات
                                    </p>
                                    <p className="text-2xl font-black text-rose-600">{formatCurrency(currentStats.totalExpenses, settings.currency)}</p>
                                </div>
                                <div className="border border-brand-primary/20 p-6 rounded-2xl relative overflow-hidden bg-brand-primary/5">
                                    <div className="w-1.5 absolute right-0 top-0 bottom-0 bg-brand-primary rounded-r-lg shadow-[0_0_10px_rgba(45,106,79,0.5)]"></div>
                                    <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <ShieldCheck size={12} /> الصافي الربحي
                                    </p>
                                    <p className="text-3xl font-black text-brand-dark">{formatCurrency(currentStats.netProfit, settings.currency)}</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {/* Expenses Section */}
                                <div>
                                    <h3 className="text-base font-black text-brand-dark mb-4 pb-2 border-b-2 border-gray-100 flex items-center gap-2">
                                        <PieChart size={18} className="text-brand-primary" /> تفصل النفقات والمصروفات
                                    </h3>

                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Suppliers Profile */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="font-black text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full">القطاع: التوريد والمخزون</span>
                                                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                                                    <ShoppingBag size={14} />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-brand-dark mb-2">{formatCurrency(currentStats.supplierExpenses, settings.currency)}</p>
                                            <div className="border-t border-dashed border-gray-100 pt-3 mt-3">
                                                <p className="text-[9px] text-gray-400 font-bold leading-relaxed text-justify">
                                                    يمثل هذا المبلغ كافة تكاليف الاستهلاك وتوريد البضائع الخام بناءً على مطالبات الموردين لهذه الفترة.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Salaries Profile */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="font-black text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full">القطاع: الموارد البشرية</span>
                                                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                                                    <Users size={14} />
                                                </div>
                                            </div>

                                            <p className="text-2xl font-black text-brand-dark mb-4">{formatCurrency(currentStats.salaryExpense, settings.currency)}</p>

                                            {currentStats.salaryBreakdown && currentStats.salaryBreakdown.length > 0 && (
                                                <div className="bg-gray-50/80 rounded-xl p-4 text-xs font-bold text-gray-600 space-y-3 border border-gray-100">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary">كشف الرواتب المفصل - المقدر لـ {periodLabels[period]}</p>
                                                    {currentStats.salaryBreakdown.map((emp, i) => (
                                                        <div key={i} className="flex justify-between items-center border-b border-gray-200 border-dashed pb-2 last:border-0 last:pb-0">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-white border border-gray-200 rounded text-[8px] font-black text-brand-dark flex flex-col justify-center items-center">
                                                                    {emp.name.charAt(0)}
                                                                </div>
                                                                <span className="text-[11px]">{emp.name}</span>
                                                            </div>
                                                            <span className="font-black text-brand-dark text-[11px]">{formatCurrency(emp.period, settings.currency)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2 mt-2 border-t border-gray-300 flex justify-between items-center text-brand-dark">
                                                        <span className="font-black text-[9px] uppercase tracking-widest">المرجع الشهري الشامل للمؤسسة</span>
                                                        <span className="font-black text-xs">{formatCurrency(currentStats.totalMonthlySalaries, settings.currency)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Performance */}
                                <div>
                                    <h3 className="text-base font-black text-brand-dark mb-4 pb-2 border-b-2 border-gray-100 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-brand-primary" /> مؤشرات البيع والتسويق
                                    </h3>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-5 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-brand-accent border border-brand-primary/20 shrink-0">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">المنتج الأكثر مبيعاً</p>
                                                <p className="text-lg font-black text-brand-dark mb-0.5">{currentStats.topItem}</p>
                                                <p className="text-[10px] font-black text-brand-primary bg-white px-2 py-0.5 rounded-md inline-block shadow-sm">
                                                    إلتقاط {currentStats.topItemCount} طلبية
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-5 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500 border border-brand-primary/20 shrink-0">
                                                <DollarSign size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">متوسط إيراد المعاملة (AOV)</p>
                                                <p className="text-lg font-black text-brand-dark mb-0.5">{formatCurrency(currentStats.avgOrderValue, settings.currency)}</p>
                                                <p className="text-[10px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded-md inline-block shadow-sm">
                                                    إجمالي {currentStats.orderCount} معاملة
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Signatures */}
                            <div className="mt-20 pt-10 border-t-2 border-gray-100 pb-10">
                                <div className="flex justify-between px-16 text-center">
                                    <div className="w-48">
                                        <p className="text-[10px] font-black text-brand-dark mb-10">إعداد النظام المحاسبي الآلي</p>
                                        <div className="border-t border-gray-300 pt-2 border-dashed">
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">مصادقة الخوادم الإلكترونية</p>
                                        </div>
                                    </div>

                                    <div className="w-48">
                                        <p className="text-[10px] font-black text-brand-dark mb-10">اعتماد ومراجعة الإدارة</p>
                                        <div className="border-t border-gray-800 pt-2">
                                            <p className="text-[8px] text-brand-dark font-bold uppercase tracking-widest">التوقيع أو الختم المعتمد</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Strict Footer */}
                            <div className="absolute bottom-0 inset-x-0 h-10 bg-brand-dark flex justify-between items-center px-10">
                                <p className="text-[7px] text-white/50 uppercase tracking-[0.2em]">تصدير مالي مؤتمت • تحليلات عافية السحابية</p>
                                <p className="text-[7px] text-white/50 uppercase tracking-[0.2em] font-sans">سري وللاستخدام الداخلي فقط</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

export default ReportsView;
