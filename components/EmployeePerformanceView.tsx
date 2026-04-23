
import React, { useMemo } from 'react';
import { Transaction, Employee } from '../types';
import {
    Users, TrendingUp, ShoppingBag, ChefHat,
    Truck, Banknote, Star, Award, Search,
    Filter, Download
} from 'lucide-react';

interface EmployeePerformanceViewProps {
    employees: Employee[];
    transactions: Transaction[];
}

const EmployeePerformanceView: React.FC<EmployeePerformanceViewProps> = ({ employees, transactions }) => {
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
                    <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white px-6 py-3 rounded-2xl font-bold text-brand-dark border border-brand-primary/10 shadow-sm hover:border-brand-primary transition-all text-sm md:text-base">
                        <Download size={18} /> تحميل التقرير
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
        </div>
    );
};

export default EmployeePerformanceView;
