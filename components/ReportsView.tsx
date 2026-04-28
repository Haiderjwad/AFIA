
import React, { useState, useMemo, useRef } from 'react';
import StatusModal from './StatusModal';
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

            // ─── حساب رواتب الموظفين لكل فترة ───────────────────────
            // القاعدة: الراتب المخزّن هو الراتب الشهري لكل موظف
            //   يومي   = الشهري ÷ 30
            //   أسبوعي = اليومي × 7    (= الشهري ÷ 30 × 7)
            //   شهري   = الشهري كما هو
            //   سنوي   = الشهري × 4
            const multiplier = p === 'daily' ? 1 / 30
                : p === 'weekly' ? 7 / 30
                    : p === 'monthly' ? 1
                        : /* yearly */     4;

            // حساب لكل موظف على حدة ثم الجمع (أدق وأوضح للتقرير)
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
        if (!reportRef.current) return;

        setIsGenerating(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حوسبة التقرير المالي الموحد',
            message: 'نقوم الآن بتحليل تدفقات السيولة، الإيرادات، والمصروفات التشغيلية لإنشاء وثيقة محاسبية رسمية، يرجى الانتظار...'
        });

        const exportId = 'financial-report';
        reportRef.current.setAttribute('data-export-capture', exportId);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // 2x is plenty for a4 and more stable for memory
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 20000,
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

            // Calculate height of the captured content in PDF mm
            const imgHeightInPDF = (canvas.height * contentWidth) / canvas.width;

            let heightLeft = imgHeightInPDF;
            let position = margin;
            const pageContentHeight = pageHeight - (margin * 2);

            // First page
            pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeightInPDF);
            heightLeft -= pageContentHeight;

            // Add new pages if content is longer than one A4
            while (heightLeft > 0) {
                position = heightLeft - imgHeightInPDF + margin; // Offset for next page
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeightInPDF);
                heightLeft -= pageContentHeight;
            }

            pdf.save(`التقرير_المالي_${settings.storeName}_${new Date().toISOString().split('T')[0]}.pdf`);

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم تصدير التقرير بنجاح',
                message: 'تم حفظ الكشف المحاسبي الموحد بجميع صفحاته وتفاصيله على جهازك.'
            });

            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 3000);

        } catch (error) {
            console.error("PDF Generation error:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في معالجة البيانات',
                message: 'عذراً، واجهنا صعوبة في تحويل البيانات إلى صيغة PDF. يرجى المحاولة مرة أخرى أو تقليل الفترة الزمنية للتقرير.'
            });
        } finally {
            setIsGenerating(false);
            reportRef.current?.removeAttribute('data-export-capture');
        }
    };

    const periodLabels: Record<ReportPeriod, string> = {
        daily: 'يومي',
        weekly: 'أسبوعي',
        monthly: 'شهري',
        yearly: 'سنوي'
    };

    return (
        <div className="view-container">
            {/* Header section with tabs */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">التقارير المحاسبية</h1>
                    <p className="text-xs md:text-sm text-gray-600">تحليل دقيق للإيرادات، المصروفات، وصافي الأرباح</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-lg border border-brand-light/50 w-full xl:w-auto overflow-x-auto no-scrollbar">
                    <div className="flex min-w-max gap-1">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 md:px-8 py-2 md:py-2.5 rounded-xl font-bold transition-all text-[10px] md:text-sm ${period === p
                                    ? 'bg-brand-primary text-white shadow-md scale-[1.02]'
                                    : 'text-gray-400 hover:text-brand-primary hover:bg-brand-light/20'
                                    }`}
                            >
                                {periodLabels[p]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Accounting Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-green-100 shadow-xl shadow-green-500/5 relative overflow-hidden group hover:border-green-200 transition-all">
                    <div className="absolute top-0 left-0 w-20 h-20 bg-green-50 rounded-br-[3rem] flex items-center justify-center -ml-4 -mt-4 transition-transform group-hover:scale-110">
                        <TrendingUp size={22} className="text-green-600 -translate-x-1 -translate-y-1" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-gray-400 text-xs font-bold mb-2 block">إجمالي الإيرادات</span>
                        <h3 className="text-2xl font-black text-brand-dark tracking-tight">{formatCurrency(currentStats.revenue, settings.currency)}</h3>
                        <div className="flex items-center gap-1.5 mt-3 text-green-600 font-bold text-[10px] bg-green-50 w-fit px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} />
                            <span>نمو مستمر</span>
                        </div>
                    </div>
                </div>

                {/* Supplier Expenses Card */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-red-100 shadow-xl shadow-red-500/5 relative overflow-hidden group hover:border-red-200 transition-all">
                    <div className="absolute top-0 left-0 w-20 h-20 bg-red-50 rounded-br-[3rem] flex items-center justify-center -ml-4 -mt-4 transition-transform group-hover:scale-110">
                        <ShoppingBag size={22} className="text-red-600 -translate-x-1 -translate-y-1" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-gray-400 text-xs font-bold mb-2 block">مصاريف الموردين</span>
                        <h3 className="text-2xl font-black text-red-600 tracking-tight">{formatCurrency(currentStats.supplierExpenses, settings.currency)}</h3>
                        <div className="flex items-center gap-1.5 mt-3 text-red-500 font-bold text-[10px] bg-red-50 w-fit px-2 py-1 rounded-full">
                            <ArrowDownRight size={12} />
                            <span>من قسم الموردين</span>
                        </div>
                    </div>
                </div>

                {/* Salary Expenses Card */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-orange-100 shadow-xl shadow-orange-500/5 relative overflow-hidden group hover:border-orange-200 transition-all">
                    <div className="absolute top-0 left-0 w-20 h-20 bg-orange-50 rounded-br-[3rem] flex items-center justify-center -ml-4 -mt-4 transition-transform group-hover:scale-110">
                        <Users size={22} className="text-orange-600 -translate-x-1 -translate-y-1" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-gray-400 text-xs font-bold mb-2 block">مصاريف الرواتب</span>
                        <h3 className="text-2xl font-black text-orange-600 tracking-tight">{formatCurrency(currentStats.salaryExpense, settings.currency)}</h3>
                        <div className="flex items-center gap-1.5 mt-3 text-orange-500 font-bold text-[10px] bg-orange-50 w-fit px-2 py-1 rounded-full">
                            <Wallet size={12} />
                            <span>إدارة الموظفين</span>
                        </div>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-gradient-to-br from-brand-dark to-brand-primary p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-br-[3rem] transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <span className="text-brand-light/60 text-xs font-bold mb-2 block">صافي الربح</span>
                        <h3 className="text-2xl font-black text-white tracking-tight">{formatCurrency(currentStats.netProfit, settings.currency)}</h3>
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-brand-light rounded-full text-[10px] font-black border border-white/5">
                            <Sparkles size={12} />
                            <span>الأرباح الصافية</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Preview Section */}
            <div className="bg-white rounded-[3.5rem] shadow-2xl border border-brand-light/30 overflow-hidden relative mb-20">
                <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/30 backdrop-blur-sm gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-dark rounded-2xl flex items-center justify-center text-brand-accent shadow-lg shadow-brand-dark/10">
                            <FileText size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-brand-dark">الكشف المحاسبي الموحد</h2>
                            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-widest uppercase">Unified Accounting Disclosure | {periodLabels[period]}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleExportPDF}
                        disabled={isGenerating}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-brand-accent hover:bg-orange-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50 group active:scale-95 text-sm"
                    >
                        {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />}
                        <span>تصدير التقرير المالي</span>
                    </button>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <div ref={reportRef} className="p-8 md:p-16 bg-white min-w-[700px] xl:min-w-0" dir="rtl">
                        <div className="flex justify-between items-start border-b-8 border-brand-dark pb-10 mb-12">
                            <div className="text-right">
                                <h1 className="text-5xl font-black text-brand-dark mb-3">{settings.storeName}</h1>
                                <div className="flex items-center gap-2 text-brand-accent">
                                    <Sparkles size={20} />
                                    <p className="text-xl font-bold uppercase tracking-[0.2em]">تقرير الأداء المالي والربحية</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-gray-400 font-black text-sm mb-1 uppercase tracking-widest">تاريخ الإصدار</p>
                                <p className="text-2xl font-black text-brand-dark">{new Date().toLocaleDateString('ar-IQ')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mb-16 text-right">
                            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                                <p className="text-xs text-brand-primary font-black uppercase mb-3">إجمالي المدخول</p>
                                <p className="text-4xl font-black text-brand-dark">{formatCurrency(currentStats.revenue, settings.currency)}</p>
                            </div>
                            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                                <p className="text-xs text-red-500 font-black uppercase mb-3">إجمالي المصاريف</p>
                                <p className="text-4xl font-black text-red-600">{formatCurrency(currentStats.totalExpenses, settings.currency)}</p>
                            </div>
                            <div className="bg-brand-dark p-8 rounded-[2.5rem] shadow-xl shadow-brand-dark/20">
                                <p className="text-xs text-brand-light font-black uppercase mb-3">الفائض الربحي</p>
                                <p className="text-4xl font-black text-brand-accent">{formatCurrency(currentStats.netProfit, settings.currency)}</p>
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
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-black text-gray-500">رواتب وأجور الموظفين</span>
                                            <span className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-black">الموارد البشرية</span>
                                        </div>

                                        {/* إجمالي الفترة */}
                                        <p className="text-3xl font-black text-brand-dark mb-1">{formatCurrency(currentStats.salaryExpense, settings.currency)}</p>
                                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-5">
                                            {period === 'daily' ? 'إجمالي رواتب اليوم  (الشهري ÷ 30)' :
                                                period === 'weekly' ? 'إجمالي رواتب الأسبوع  (الشهري ÷ 30 × 7)' :
                                                    period === 'monthly' ? 'إجمالي الرواتب الشهرية' :
                                                        'إجمالي رواتب الموسم  (الشهري × 4)'}
                                        </p>

                                        {/* تفصيل لكل موظف */}
                                        {currentStats.salaryBreakdown && currentStats.salaryBreakdown.length > 0 && (
                                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">كشف راتب كل موظف</p>
                                                {currentStats.salaryBreakdown.map((emp, i) => (
                                                    <div key={i} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-orange-50/50 transition-colors border-b border-dashed border-gray-50 last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs shrink-0">
                                                                {emp.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-brand-dark leading-none">{emp.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                                    شهري: {formatCurrency(emp.monthly, settings.currency)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-sm text-brand-dark">{formatCurrency(emp.period, settings.currency)}</p>
                                                            <p className="text-[10px] text-orange-500 font-bold">
                                                                {period === 'daily' ? 'اليوم' :
                                                                    period === 'weekly' ? 'الأسبوع' :
                                                                        period === 'monthly' ? 'الشهر' :
                                                                            'الموسم'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center pt-3 mt-1 border-t border-orange-100">
                                                    <div>
                                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">إجمالي الرواتب الشهرية</span>
                                                        <span className="text-[9px] text-gray-400 font-bold">القاعدة المرجعية للحساب</span>
                                                    </div>
                                                    <span className="font-black text-orange-600 text-lg">{formatCurrency(currentStats.totalMonthlySalaries, settings.currency)}</span>
                                                </div>
                                            </div>
                                        )}
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
                                        <p className="text-2xl font-black text-brand-dark">{currentStats.topItem}</p>
                                        <span className="text-xs text-brand-primary font-black">بإجمالي مبيعات: {currentStats.topItemCount} قطعة</span>
                                    </div>
                                    <div className="w-px h-20 bg-gray-200"></div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">متوسط قيمة العملية (AOV)</span>
                                        <p className="text-2xl font-black text-brand-dark">{formatCurrency(currentStats.avgOrderValue, settings.currency)}</p>
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
