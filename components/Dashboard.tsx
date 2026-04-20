
import React from 'react';
import {
  Grid,
  FileText,
  CreditCard,
  Calendar,
  Settings,
  Sparkles,
  Box,
  Receipt,
  Truck,
  Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SALES_DATA, BAR_DATA } from '../constants';
import { DashboardCardProps, MenuItem, Transaction } from '../types';

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon: Icon, colorClass, onClick }) => (
  <button
    onClick={onClick}
    className={`${colorClass} p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform duration-300 text-white min-h-[140px] group cursor-pointer relative z-0`}
  >
    <div className="bg-white/20 p-4 rounded-2xl group-hover:bg-white/30 transition-colors backdrop-blur-sm">
      <Icon size={32} className="text-white" />
    </div>
    <span className="font-bold text-lg">{title}</span>
  </button>
);

interface DashboardProps {
  onProductClick: () => void;
  onNavigate: (view: string, subTab?: string) => void;
  lowStockItems: MenuItem[];
  readyOrders: Transaction[];
  onCompleteOrder: (id: string) => void;
  isOnline: boolean;
  notifications?: any[];
}

const Dashboard: React.FC<DashboardProps> = ({
  onProductClick,
  onNavigate
}) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 bg-[#fcfaf7] pb-20">

      {/* Search Bar */}
      <div className="mb-10 relative max-w-md" dir="rtl">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="بحث سريع في النظام..."
          className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-gold-200 outline-none focus:ring-2 focus:ring-gold-500 transition-all font-bold placeholder-gray-300 shadow-sm"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-0" dir="rtl">
        <DashboardCard
          title="قائمة المنتجات"
          icon={Grid}
          colorClass="bg-gradient-to-br from-gold-400 to-gold-600"
          onClick={onProductClick}
        />
        <DashboardCard
          title="الفواتير السابقة"
          icon={Receipt}
          colorClass="bg-gradient-to-br from-coffee-800 to-coffee-900"
          onClick={() => onNavigate('invoices')}
        />
        <DashboardCard
          title="طرق الدفع"
          icon={CreditCard}
          colorClass="bg-gradient-to-br from-coffee-900 to-black"
          onClick={() => onNavigate('settings', 'payments')}
        />
        <DashboardCard
          title="الموردين"
          icon={Truck}
          colorClass="bg-gradient-to-br from-gold-50 to-gold-600"
          onClick={() => onNavigate('suppliers')}
        />
        <DashboardCard
          title="التقارير المفصلة"
          icon={Sparkles}
          colorClass="bg-gradient-to-br from-teal-600 to-teal-800"
          onClick={() => onNavigate('reports')}
        />
        <DashboardCard
          title="تاريخ الضمان"
          icon={Calendar}
          colorClass="bg-gradient-to-br from-gold-600 to-gold-700"
          onClick={() => onNavigate('invoices')}
        />
        <DashboardCard
          title="المخزون"
          icon={Box}
          colorClass="bg-teal-800"
          onClick={() => onNavigate('inventory')}
        />
        <DashboardCard
          title="الإعدادات"
          icon={Settings}
          colorClass="bg-teal-900"
          onClick={() => onNavigate('settings')}
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-0" dir="rtl">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gold-100 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-coffee-900">توجهات المبيعات اليومي</h3>
            <div className="flex gap-2">
              <button className="text-[10px] font-black px-3 py-1 rounded-lg text-gold-600 bg-gold-50 hover:bg-gold-100">تحميل</button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c59d5f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c59d5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#865f33', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#865f33', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontFamily: 'Cairo' }}
                />
                <Area type="monotone" dataKey="value" stroke="#c59d5f" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gold-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-coffee-900">أداء الموظفين</h3>
            <button className="text-[10px] font-black px-3 py-1 rounded-lg text-gold-600 bg-gold-50 hover:bg-gold-100">تفاصيل</button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#865f33', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#865f33', fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="uv" fill="#1e293b" radius={[10, 10, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
