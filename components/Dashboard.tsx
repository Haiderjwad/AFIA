
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
  Search,
  ShoppingCart,
  ChefHat,
  Package,
  Users,
  BarChart3,
  PieChart,
  TrendingUp
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
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 bg-brand-cream pb-20 relative">
      {/* Background Leaf Patterns (Subtle) */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-0" dir="rtl">
        <DashboardCard
          title="المبيعات"
          icon={ShoppingCart}
          colorClass="bg-gradient-to-br from-brand-primary to-brand-secondary shadow-brand-primary/20"
          onClick={() => onNavigate('sales')}
        />
        <DashboardCard
          title="المطبخ"
          icon={ChefHat}
          colorClass="bg-gradient-to-br from-brand-dark to-brand-primary shadow-brand-dark/20"
          onClick={() => onNavigate('kitchen')}
        />
        <DashboardCard
          title="الفواتير"
          icon={Receipt}
          colorClass="bg-gradient-to-br from-brand-accent to-orange-600 shadow-brand-accent/20"
          onClick={() => onNavigate('invoices')}
        />
        <DashboardCard
          title="المخزون"
          icon={Package}
          colorClass="bg-gradient-to-br from-brand-secondary to-green-700 shadow-brand-secondary/20"
          onClick={() => onNavigate('inventory')}
        />
        <DashboardCard
          title="الموردين"
          icon={Truck}
          colorClass="bg-gradient-to-br from-emerald-600 to-brand-primary shadow-emerald-500/20"
          onClick={() => onNavigate('suppliers')}
        />
        <DashboardCard
          title="التقارير المفصلة"
          icon={PieChart}
          colorClass="bg-gradient-to-br from-orange-400 to-brand-accent shadow-orange-400/20"
          onClick={() => onNavigate('reports')}
        />
        <DashboardCard
          title="اداء الموظفين"
          icon={TrendingUp}
          colorClass="bg-gradient-to-br from-brand-secondary to-brand-primary shadow-brand-secondary/20"
          onClick={() => onNavigate('performance')}
        />
        <DashboardCard
          title="الاعدادات"
          icon={Settings}
          colorClass="bg-gradient-to-br from-brand-dark to-black shadow-brand-dark/20"
          onClick={() => onNavigate('settings')}
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-0" dir="rtl">
        {/* Line Chart */}
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-[3rem] shadow-xl border border-brand-primary/5 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="font-black text-2xl text-brand-dark">توجهات المبيعات اليومي</h3>
            <div className="flex gap-2">
              <button className="text-[10px] uppercase tracking-widest font-black px-6 py-2.5 rounded-xl text-brand-primary bg-brand-primary/5 hover:bg-brand-primary hover:text-white transition-all shadow-sm">تحميل التقرير الكامل</button>
            </div>
          </div>
          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50} style={{ minWidth: 0, minHeight: 0 }}>
              <AreaChart data={SALES_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52B788" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#52B788" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#2D6A4F', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#2D6A4F', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'Cairo', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#2D6A4F" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Decorative watermark inside chart area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-[3rem] shadow-xl border border-brand-primary/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-2xl text-brand-dark">أداء الموظفين</h3>
            <button
              onClick={() => onNavigate('performance')}
              className="text-[10px] uppercase tracking-widest font-black px-6 py-2.5 rounded-xl text-brand-accent bg-brand-accent/5 hover:bg-brand-accent hover:text-white transition-all shadow-sm"
            >
              كشف التفاصيل
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50} style={{ minWidth: 0, minHeight: 0 }}>
              <BarChart data={BAR_DATA}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#2D6A4F', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#2D6A4F', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: 'rgba(82, 183, 136, 0.1)' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                <Bar dataKey="uv" fill="#F8961E" radius={[12, 12, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
