const fs = require('fs');

const code = `
import React, { useMemo, useState } from 'react';
import { Transaction, Employee, AppSettings, UserRole } from '../types';
import {
    Users, ShoppingBag, ChefHat, UserPlus, Trash2, Edit, Save,
    Truck, Banknote, Star, Award, Search, Hash, Mail, Key, Shield, DollarSign,
    ListChecks, X, Download, RefreshCw, Sparkles, TrendingUp
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import StatusModal from './StatusModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { firestoreService } from '../services/firestoreService';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '../firebase';
import { formatCurrency } from '../utils/currencyUtils';

interface EmployeePerformanceViewProps {
    employees: Employee[];
    transactions: Transaction[];
    settings: AppSettings;
}

const EmployeePerformanceView: React.FC<EmployeePerformanceViewProps> = ({ employees, transactions, settings }) => {
    // ─── TABS ──────────────────────────────────────────
    const [mainTab, setMainTab] = useState<'performance' | 'management'>('performance');

    // ─── PERFORMANCE TAB STATE ──────────────────────────────────
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'loading' | 'warning', title: string, message: string }>({
        isOpen: false,
        type: 'loading',
        title: '',
        message: ''
    });
    const reportRef = React.useRef<HTMLDivElement>(null);

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
        setIsGenerating(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حوسبة تقارير الأداء الفردية',
            message: 'نقوم الآن بتحليل إنتاجية الموظفين وتوليد حصيلة العمليات لكل قسم، يرجى الانتظار...'
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pW = pdf.internal.pageSize.getWidth();   
            const pH = pdf.internal.pageSize.getHeight();  
            const margin = 18;
            const contentW = pW - margin * 2;
            let y = margin;

            const checkNewPage = (neededHeight: number) => {
                if (y + neededHeight > pH - margin) {
                    pdf.addPage();
                    y = margin;
                }
            };

            const text = (
                str: string,
                x: number,
                yy: number,
                opts?: Parameters<typeof pdf.text>[3]
            ) => {
                pdf.text(str, x, yy, opts);
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

            sf(COL_DARK);
            pdf.rect(0, 0, pW, 30, 'F');

            pdf.setTextColor(248, 150, 30);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            text(settings.storeName, pW - margin, 12, { align: 'right' });

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            text('EMPLOYEE PERFORMANCE INTELLIGENCE REPORT', margin, 12);

            pdf.setTextColor(180, 180, 180);
            pdf.setFontSize(7);
            text(new Date().toLocaleDateString('en-GB'), margin, 20);
            text(\`Al Afia POS System\`, pW - margin, 20, { align: 'right' });

            y = 40;

            sc(COL_DARK);
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            text('Staff Performance Summary', margin, y);
            y += 4;

            sd(COL_GREEN);
            pdf.setLineWidth(0.8);
            pdf.line(margin, y, pW - margin, y);
            y += 8;

            const boxW = (contentW - 9) / 4;
            const boxes: { label: string; value: number; color: RGB }[] = [
                { label: 'Sales Orders', value: transactions.filter(t => t.salesPerson).length, color: COL_GREEN },
                { label: 'Kitchen Prep', value: transactions.filter(t => t.kitchenPerson).length, color: [234, 88, 12] },
                { label: 'Deliveries', value: transactions.filter(t => t.deliveredBy).length, color: [37, 99, 235] },
                { label: 'Invoices Paid', value: transactions.filter(t => t.cashierPerson).length, color: [22, 163, 74] }
            ];

            boxes.forEach((box, i) => {
                const bx = margin + i * (boxW + 3);
                pdf.setFillColor(246, 248, 246);
                pdf.roundedRect(bx, y, boxW, 22, 3, 3, 'F');
                sd(box.color);
                pdf.setLineWidth(0.5);
                pdf.roundedRect(bx, y, boxW, 22, 3, 3, 'S');

                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                sc(box.color);
                text(String(box.value), bx + boxW / 2, y + 11, { align: 'center' });

                pdf.setFontSize(6.5);
                pdf.setFont('helvetica', 'normal');
                sc(COL_GRAY);
                text(box.label, bx + boxW / 2, y + 18, { align: 'center' });
            });
            y += 30;

            sf(COL_DARK);
            pdf.rect(margin, y, contentW, 10, 'F');

            const cols = [
                { label: 'Employee Name', x: pW - margin, align: 'right' as const, w: 55 },
                { label: 'Role', x: pW - margin - 55, align: 'right' as const, w: 35 },
                { label: 'Sales', x: margin + 65, align: 'center' as const, w: 20 },
                { label: 'Kitchen', x: margin + 47, align: 'center' as const, w: 20 },
                { label: 'Cashier', x: margin + 29, align: 'center' as const, w: 20 },
                { label: 'Total', x: margin + 10, align: 'center' as const, w: 20 },
            ];

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'bold');
            cols.forEach(c => text(c.label, c.x, y + 6.8, { align: c.align }));
            y += 10;

            performanceData.forEach((emp, idx) => {
                checkNewPage(14);

                if (idx % 2 === 0) {
                    sf(COL_LIGHT);
                    pdf.rect(margin, y, contentW, 12, 'F');
                }

                if (idx === 0) {
                    sf(COL_GOLD);
                    pdf.circle(margin + 5, y + 6, 3.5, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFontSize(6);
                    text('1', margin + 5, y + 7.5, { align: 'center' });
                }

                pdf.setFontSize(8.5);
                pdf.setFont('helvetica', 'bold');
                sc(COL_DARK);
                text(emp.name, pW - margin, y + 7.8, { align: 'right' });

                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                sc(COL_GRAY);
                text(emp.role.toUpperCase(), pW - margin - 55, y + 7.8, { align: 'right' });

                const statColor = (v: number): RGB => v > 0 ? COL_GREEN : COL_GRAY;
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');

                sc(statColor(emp.stats.sales));
                text(String(emp.stats.sales), margin + 65, y + 7.8, { align: 'center' });

                pdf.setTextColor(234, 88, 12);
                text(String(emp.stats.kitchen), margin + 47, y + 7.8, { align: 'center' });

                pdf.setTextColor(22, 163, 74);
                text(String(emp.stats.cashier), margin + 29, y + 7.8, { align: 'center' });

                const totalVal = emp.stats.total;
                if (totalVal > 0) {
                    sf(COL_GREEN);
                    pdf.roundedRect(margin + 4, y + 2, 14, 8, 2, 2, 'F');
                    pdf.setTextColor(255, 255, 255);
                } else {
                    sc(COL_GRAY);
                }
                text(String(totalVal), margin + 11, y + 7.8, { align: 'center' });

                y += 12;
            });

            checkNewPage(20);
            y += 4;
            sd(COL_GREEN);
            pdf.setLineWidth(0.4);
            pdf.line(margin, y, pW - margin, y);
            y += 8;

            sf(COL_DARK);
            pdf.rect(0, pH - 14, pW, 14, 'F');
            pdf.setTextColor(180, 180, 180);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            text('© Al Afia Business Intelligence System — Confidential', margin, pH - 5);
            text(\`Generated: \${new Date().toLocaleString('en-GB')}\`, pW - margin, pH - 5, { align: 'right' });

            pdf.save(\`تقرير_أداء_الموظفين_\${settings.storeName}_\${new Date().toISOString().split('T')[0]}.pdf\`);

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم تصدير تقرير الأداء بنجاح',
                message: 'تم حفظ الكشف التفصيلي لإنتاجية الكادر بنجاح في ملف PDF احترافي.'
            });

            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 3000);

        } catch (error) {
            console.error('PDF Generation error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في معالجة التقرير',
                message: \`تعذّر إنشاء الملف. تفاصيل الخطأ: \${String(error)}\`
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // ─── MANAGEMENT TAB STATE ──────────────────────────────────
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [empForm, setEmpForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'sales' as UserRole,
        employeeId: '',
        permissions: [] as string[],
        salary: ''
    });

    const handleAddEmployee = async () => {
        if (!empForm.email || !empForm.password || !empForm.name) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'بيانات غير مكتملة',
                message: 'يرجى ملء كافة البيانات الأساسية (الاسم، البريد، كلمة السر) للمتابعة في إنشاء حساب الموظف.'
            });
            return;
        }

        let secondaryApp;
        try {
            setLoadingEmployees(true);
            secondaryApp = initializeApp(firebaseConfig, \`SecondaryApp-\${Date.now()}\`);
            const secondaryAuth = getAuth(secondaryApp);
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, empForm.email, empForm.password);
            const uid = userCredential.user.uid;

            const newEmployee: Employee = {
                uid: uid,
                name: empForm.name,
                email: empForm.email,
                role: empForm.role,
                permissions: empForm.permissions.length > 0 ? empForm.permissions : [empForm.role],
                employeeId: empForm.employeeId || \`EMP-\${Date.now().toString().slice(-4)}\`,
                joinedAt: new Date().toISOString(),
                salary: parseFloat(empForm.salary) || 0
            };

            await firestoreService.addEmployee(newEmployee);

            setEmpForm({ name: '', email: '', password: '', role: 'sales', employeeId: '', permissions: [], salary: '' });
            setIsEmployeeModalOpen(false);
            
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم إنشاء الموظف',
                message: 'تم إعداد حساب جديد وإرسال الصلاحيات للسحابة بنجاح.'
            });
            setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 2000);
        } catch (error: any) {
            console.error("Error adding employee:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'فشل الإنشاء',
                message: \`تأكد من اتصالك بالإنترنت وصحة البيانات: \${error.message}\`
            });
        } finally {
            if (secondaryApp) {
                try {
                    await deleteApp(secondaryApp);
                } catch (e) {
                    console.debug("Secondary app cleanup:", e);
                }
            }
            setLoadingEmployees(false);
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        await firestoreService.deleteEmployee(id);
    };

    const handleUpdateEmployee = async () => {
        if (!editingEmployee) return;

        try {
            setLoadingEmployees(true);
            await firestoreService.updateEmployee(editingEmployee.uid || editingEmployee.employeeId, {
                name: empForm.name,
                email: empForm.email,
                role: empForm.role,
                employeeId: empForm.employeeId,
                permissions: empForm.permissions,
                salary: parseFloat(empForm.salary) || 0
            });

            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
            setEmpForm({ name: '', email: '', password: '', role: 'sales', employeeId: '', permissions: [], salary: '' });

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم تحديث البيانات',
                message: 'تم حفظ كافة التعديلات على حساب الموظف في النظام بنجاح.'
            });
            setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 2000);
        } catch (error: any) {
            console.error("Error updating employee:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'فشل التحديث',
                message: \`حدث خطأ تقني: \${error.message}\`
            });
        } finally {
            setLoadingEmployees(false);
        }
    };

    return (
        <div className="view-container relative min-h-screen" dir="rtl">
            {/* Background Branding */}
            <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>

            {/* Header Content */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 relative z-10 transition-all">
                <div className="flex items-center gap-4 text-right">
                    <div className="bg-brand-primary p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-xl shadow-brand-primary/20 shrink-0">
                        <Users size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black text-brand-dark dark:text-white mb-1">قسم الموظفين</h1>
                        <p className="text-gray-500 dark:text-gray-300 font-black text-[10px] md:text-sm tracking-wide">
                            الإدارة الشاملة وتتبع الإنتاجية לכل حساب
                        </p>
                    </div>
                </div>

                <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-gray-200/50 border border-white flex gap-1 overflow-x-auto w-full lg:w-auto">
                    <button
                        onClick={() => setMainTab('performance')}
                        className={\`flex-1 lg:flex-none px-6 py-3 rounded-[1rem] font-black text-xs transition-all duration-300 whitespace-nowrap
                            \${mainTab === 'performance'
                                ? 'bg-brand-dark text-brand-accent shadow-lg shadow-brand-dark/20 scale-[1.02] -translate-y-0.5'
                                : 'text-gray-400 hover:text-brand-primary hover:bg-gray-50'
                            }\`}
                    >
                        أداء الموظفين
                    </button>
                    <button
                        onClick={() => setMainTab('management')}
                        className={\`flex-1 lg:flex-none px-6 py-3 rounded-[1rem] font-black text-xs transition-all duration-300 whitespace-nowrap
                            \${mainTab === 'management'
                                ? 'bg-brand-dark text-brand-accent shadow-lg shadow-brand-dark/20 scale-[1.02] -translate-y-0.5'
                                : 'text-gray-400 hover:text-brand-primary hover:bg-gray-50'
                            }\`}
                    >
                        إدارة الموظفين
                    </button>
                </div>
            </div>

            {mainTab === 'performance' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-end w-full mb-8 relative z-10">
                        <button
                            onClick={handleExportPDF}
                            disabled={isGenerating}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-secondary px-8 py-4 rounded-[1.5rem] font-black text-white shadow-xl shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                            <span>تحميل تقرير الأداء</span>
                        </button>
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

                    <div className="bg-white rounded-[3rem] shadow-xl border border-brand-primary/5 overflow-hidden relative z-10">
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
                </div>
            )}

            {mainTab === 'management' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-sm mb-6">
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-brand-dark flex items-center gap-2">
                                <Users size={24} className="text-brand-primary" /> كادر العمل الذكي
                            </h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Personnel Management Intelligence</p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <input
                                    type="text"
                                    placeholder="بحث عن موظف..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-brand-primary/5 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-sm font-bold"
                                />
                                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>

                            <button
                                onClick={() => {
                                    setEditingEmployee(null);
                                    setEmpForm({ name: '', email: '', password: '', role: 'sales', employeeId: '', permissions: [], salary: '' });
                                    setIsEmployeeModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-black hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 shrink-0"
                            >
                                <UserPlus size={20} /> إضافة موظف
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-brand-primary/5 overflow-hidden relative z-10">
                        <table className="w-full text-right">
                            <thead className="bg-brand-light/20 border-b border-brand-primary/10">
                                <tr>
                                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter">الموظف</th>
                                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter">الدور الوظيفي</th>
                                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter text-center">كود التعريف</th>
                                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter text-center">الراتب</th>
                                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter text-left">التحكم</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loadingEmployees ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400">جاري المعالجة...</td>
                                    </tr>
                                ) : employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 italic">
                                            {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد موظفين مسجلين حالياً'}
                                        </td>
                                    </tr>
                                ) : (
                                    employees
                                        .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((emp) => (
                                            <tr key={emp.uid || emp.email || emp.employeeId} className="hover:bg-brand-light/5 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-lg">
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-brand-dark">{emp.name}</p>
                                                            <p className="text-xs text-gray-400 font-bold">{emp.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={\`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest \${emp.role.toLowerCase() === 'admin' ? 'bg-red-50 text-red-600' :
                                                        emp.role.toLowerCase() === 'manager' ? 'bg-brand-accent/20 text-brand-accent' :
                                                            'bg-brand-light/50 text-brand-primary'
                                                        }\`}>
                                                        {['kitchen', 'cook', 'chef'].includes(emp.role.toLowerCase()) ? 'طباخ' :
                                                            emp.role.toLowerCase() === 'admin' ? 'مدير النظام' :
                                                                emp.role.toLowerCase() === 'manager' ? 'المدير' :
                                                                    emp.role.toLowerCase() === 'cashier' ? 'الكاشير' : 'المبيعات'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center font-bold text-brand-dark/40 text-sm">
                                                    {emp.employeeId}
                                                </td>
                                                <td className="px-8 py-5 text-center font-bold text-green-600 text-sm">
                                                    {formatCurrency(emp.salary || 0, settings.currency)}
                                                </td>
                                                <td className="px-8 py-5 text-left">
                                                    <div className="flex items-center justify-end gap-2 opacity-100 transition-all">
                                                        <button
                                                            onClick={() => {
                                                                setEditingEmployee(emp);
                                                                setEmpForm({
                                                                    name: emp.name || '',
                                                                    email: emp.email || '',
                                                                    role: emp.role || 'sales',
                                                                    employeeId: emp.employeeId || '',
                                                                    password: '',
                                                                    permissions: Array.isArray(emp.permissions) ? emp.permissions : [],
                                                                    salary: (emp.salary || 0).toString()
                                                                });
                                                                setIsEmployeeModalOpen(true);
                                                            }}
                                                            className="p-2.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl transition-all duration-300 font-bold shadow-sm"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setItemToDelete(emp.uid || emp.employeeId)}
                                                            className="p-2.5 bg-red-100/50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 font-bold shadow-sm"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Add/Edit Employee Modal */}
                    {isEmployeeModalOpen && (
                        <div className="fixed top-0 right-0 left-0 bottom-0 z-[150] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                                <div className="p-8 bg-brand-dark text-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm shadow-xl">
                                            <UserPlus size={32} className="text-brand-accent" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black">{editingEmployee ? 'تحديث بيانات الموظف' : 'تسجيل موظف جديد'}</h2>
                                            <p className="text-brand-accent/60 text-xs font-bold uppercase tracking-widest mt-1">Staff Access Intelligence</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }} className="bg-white/10 hover:bg-red-500 hover:text-white p-3 rounded-full transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto premium-scrollbar">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                                                <User size={14} /> اسم الموظف بالكامل
                                            </label>
                                            <input
                                                type="text"
                                                value={empForm.name}
                                                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                                                placeholder="مثال: أحمد محمد"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                                                <Hash size={14} /> الكود الوظيفي
                                            </label>
                                            <input
                                                type="text"
                                                value={empForm.employeeId}
                                                onChange={(e) => setEmpForm({ ...empForm, employeeId: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                                                placeholder="مثال: EMP-101"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                                            <Mail size={14} /> البريد الإلكتروني (لتسجيل الدخول)
                                        </label>
                                        <input
                                            type="email"
                                            value={empForm.email}
                                            onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                                            placeholder="name@company.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                                                <Shield size={14} /> الدور الوظيفي
                                            </label>
                                            <select
                                                value={empForm.role}
                                                onChange={(e) => setEmpForm({ ...empForm, role: e.target.value as UserRole })}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark appearance-none"
                                            >
                                                <option value="sales">المبيعات</option>
                                                <option value="cashier">الكاشير</option>
                                                <option value="kitchen">طباخ</option>
                                                <option value="manager">المدير</option>
                                                <option value="admin">مدير النظام</option>
                                            </select>
                                        </div>
                                        {!editingEmployee && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                                                    <Key size={14} /> كلمة السر الأولية
                                                </label>
                                                <input
                                                    type="password"
                                                    value={empForm.password}
                                                    onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                                                    placeholder="******"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                                                <DollarSign size={14} /> الراتب الشهري ({settings.currency})
                                            </label>
                                            <input
                                                type="number"
                                                value={empForm.salary}
                                                onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-brand-light/10 rounded-3xl border border-dashed border-brand-primary/20">
                                        <h4 className="text-sm font-black text-brand-dark mb-4 flex items-center gap-2">
                                            <ListChecks size={18} className="text-brand-primary" /> صلاحيات الوصول المخصصة
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'dashboard', label: 'الرئيسة', icon: '📊' },
                                                { id: 'sales', label: 'المبيعات', icon: '💰' },
                                                { id: 'kitchen', label: 'المطبخ', icon: '👨‍🍳' },
                                                { id: 'invoices', label: 'الفواتير', icon: '📄' },
                                                { id: 'inventory', label: 'المخزون', icon: '📦' },
                                                { id: 'suppliers', label: 'الموردين', icon: '🚚' },
                                                { id: 'digital_menu', label: 'المنيو الرقمي', icon: '📱' },
                                                { id: 'reports', label: 'التقارير', icon: '📈' },
                                                { id: 'settings', label: 'الإعدادات', icon: '⚙️' }
                                            ].map(perm => (
                                                <label
                                                    key={perm.id}
                                                    className={\`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer \${Array.isArray(empForm.permissions) && empForm.permissions.includes(perm.id)
                                                        ? 'bg-brand-primary/10 border-brand-primary/30 shadow-sm'
                                                        : 'bg-white border-gray-100 hover:bg-gray-50'
                                                        }\`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={Array.isArray(empForm.permissions) && empForm.permissions.includes(perm.id)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setEmpForm(prev => ({
                                                                ...prev,
                                                                permissions: checked
                                                                    ? [...(Array.isArray(prev.permissions) ? prev.permissions : []), perm.id]
                                                                    : (Array.isArray(prev.permissions) ? prev.permissions : []).filter(p => p !== perm.id)
                                                            }));
                                                        }}
                                                        className="w-5 h-5 accent-brand-primary rounded-md"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-brand-dark flex items-center gap-1">
                                                            <span>{perm.icon}</span> {perm.label}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-gray-50 flex gap-4">
                                    <button
                                        onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                                        disabled={loadingEmployees}
                                        className="flex-1 bg-brand-primary text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                                    >
                                        {loadingEmployees ? (
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                {editingEmployee ? <Save size={20} /> : <UserPlus size={20} />}
                                                {editingEmployee ? 'حفظ التعديلات' : 'إنشاء الموظف والحساب'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}
                                        className="px-8 bg-white text-gray-400 font-black py-5 rounded-[1.5rem] border-2 border-gray-100 hover:text-brand-dark transition-all"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Global Modals */}
            <ConfirmDeleteModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => itemToDelete && handleDeleteEmployee(itemToDelete)}
                title="إنهاء صلاحيات الموظف؟"
                description="هل أنت متأكد من رغبتك في حذف هذا الموظف من النظام؟ سيؤدي ذلك لإيقاف قدرته على تسجيل الدخول وإزالة كافة صلاحياته فوراً."
            />

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
`;

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', code);
