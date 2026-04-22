
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
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حوسبة التقرير المالي الموحد',
            message: 'نقوم الآن بتحليل تدفقات السيولة، الإيرادات، والمصروفات التشغيلية لإنشاء وثيقة محاسبية رسمية، يرجى الانتظار...'
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // 2x is plenty for a4 and more stable for memory
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 20000,
                onclone: (clonedDoc) => {
                    // Fix for brand colors and modern CSS
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach((el: any) => {
                        const style = el.style;
                        if (!style) return;
                        if (style.boxShadow) style.boxShadow = 'none';

                        ['backgroundColor', 'color', 'borderColor'].forEach(prop => {
                            const val = style[prop];
                            if (val && (val.includes('oklch') || val.includes('oklab'))) {
                                // Direct semantic mapping based on class or fallback
                                if (el.classList.contains('bg-brand-dark')) style[prop] = '#1B4332';
                                else if (el.classList.contains('bg-brand-primary')) style[prop] = '#2D6A4F';
                                else if (el.classList.contains('bg-brand-accent')) style[prop] = '#F8961E';
                                else style[prop] = '#2d6a4f';
                            }
                        });
                        style.fontFamily = "'Cairo', sans-serif";
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
                    <h1 className="text-3xl font-bold text-brand-dark mb-2">التقارير المحاسبية</h1>
                    <p className="text-gray-600">تحليل دقيق للإيرادات، المصروفات، وصافي الأرباح</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-lg border border-brand-light/50">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-8 py-2.5 rounded-xl font-bold transition-all text-sm ${period === p
                                ? 'bg-brand-primary text-white shadow-md scale-[1.02]'
                                : 'text-gray-400 hover:text-brand-primary hover:bg-brand-light/20'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Accounting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-dark rounded-2xl flex items-center justify-center text-brand-accent shadow-lg shadow-brand-dark/10">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-brand-dark">الكشف المحاسبي الموحد</h2>
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Unified Accounting Disclosure | {periodLabels[period]}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleExportPDF}
                        disabled={isGenerating}
                        className="flex items-center gap-3 px-8 py-4 bg-brand-accent hover:bg-orange-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50 group active:scale-95 text-sm"
                    >
                        {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />}
                        <span>تصدير التقرير المالي</span>
                    </button>
                </div>

                <div ref={reportRef} className="p-16 bg-white" dir="rtl">
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
