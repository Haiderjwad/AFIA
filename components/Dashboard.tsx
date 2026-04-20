
import React, { useState } from 'react';
import {
  Grid,
  FileText,
  CreditCard,
  Calendar,
  Users,
  Settings,
  Sparkles,
  Bell,
  AlertTriangle,
  Box,
  Receipt,
  CheckCircle,
  PackageCheck,
  WifiOff,
  Truck
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
  onNavigate,
  lowStockItems,
  readyOrders,
  onCompleteOrder,
  isOnline,
  notifications = []
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReadyAlert, setShowReadyAlert] = useState(true);

  return (
    <div className="flex-1 p-6 overflow-y-auto pb-20 animate-in fade-in duration-500 relative z-0">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8 bg-white/50 p-4 rounded-2xl backdrop-blur-sm shadow-sm border border-gold-200 relative z-50">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">نظام نقطة البيع الذهبي</h1>
          <p className="text-coffee-800/60 text-sm">أهلاً بك، المدير العام</p>
        </div>
        <div className="flex items-center gap-4">

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-white rounded-full text-coffee-900 hover:bg-gold-100 transition-colors relative"
            >
              <Bell size={24} />
              {(lowStockItems.length > 0 || readyOrders.length > 0 || notifications.length > 0) && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute left-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in zoom-in-95">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-coffee-900">التنبيهات</h3>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{lowStockItems.length + readyOrders.length + notifications.length} جديد</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {/* Manual Kitchen Notifications */}
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-3 border-b border-red-50 bg-red-50/20 hover:bg-red-50 transition-colors flex items-start gap-3 text-right">
                      <div className={`p-2 rounded-lg shrink-0 ${notif.type === 'kitchen_warning' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        {notif.type === 'kitchen_warning' ? <AlertTriangle size={16} /> : <Box size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-coffee-900">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleTimeString('ar-EG')}</p>
                      </div>
                    </div>
                  ))}

                  {/* Ready Orders in Notification */}
                  {readyOrders.map(order => (
                    <div key={order.id} className="p-3 border-b border-green-50 bg-green-50/30 hover:bg-green-100 transition-colors flex items-start gap-3 text-right">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg shrink-0">
                        <PackageCheck size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-coffee-900">الطلب #{order.id.slice(-4)} جاهز!</p>
                        <p className="text-xs text-gray-500">قم باستلامه الآن</p>
                        <button
                          onClick={() => {
                            onCompleteOrder(order.id);
                            setShowNotifications(false);
                          }}
                          className="mt-2 text-xs font-bold bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors"
                        >
                          إرسال للمحاسبة
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Low Stock Notifications */}
                  {lowStockItems.map(item => (
                    <div key={item.id} className="p-3 border-b border-orange-50 bg-orange-50/30 hover:bg-orange-100 transition-colors flex items-start gap-3 text-right">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-coffee-900">انخفاض المخزون: {item.name}</p>
                        <p className="text-xs text-gray-500">الكمية المتبقية: {item.stock}</p>
                      </div>
                    </div>
                  ))}

                  {lowStockItems.length === 0 && readyOrders.length === 0 && notifications.length === 0 && (
                    <div className="p-10 text-center text-gray-400 italic">لا توجد تنبيهات جديدة</div>
                  )}
                </div>
                {(lowStockItems.length > 0 || readyOrders.length > 0 || notifications.length > 0) && (
                  <button
                    onClick={() => {
                      onNavigate('inventory');
                      setShowNotifications(false);
                    }}
                    className="w-full p-3 text-center text-xs font-bold text-coffee-900 hover:bg-gold-50 transition-all border-t border-gray-100"
                  >
                    عرض جميع التنبيهات
                  </button>
                )}
              </div>
            )}
          </div>

          {isOnline ? (
            <span className="bg-green-100 text-green-800 border-green-200 text-xs px-3 py-1 rounded-full border flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              متصل بالسحابة
            </span>
          ) : (
            <span className="bg-red-100 text-red-800 border-red-200 text-xs px-3 py-1 rounded-full border flex items-center gap-2 animate-bounce">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              غير متصل
              <WifiOff size={12} />
            </span>
          )}
        </div>
      </div>



      {/* Main Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-0">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-0">
        {/* Line Chart */}
        <div className="bg-[#fcfaf7] p-6 rounded-3xl shadow-lg border border-gold-100 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-coffee-900">توجهات المبيعات اليومي</h3>
            <button className="text-sm px-3 py-1 rounded-lg text-gold-600 bg-gold-100 hover:bg-gold-200">تصدير</button>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#865f33' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#865f33' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#c59d5f" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-[#fcfaf7] p-6 rounded-3xl shadow-lg border border-gold-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-coffee-900">أداء الموظفين</h3>
            <button className="text-sm px-3 py-1 rounded-lg text-gold-600 bg-gold-100 hover:bg-gold-200">تفاصيل</button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BAR_DATA}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#865f33' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#865f33' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="uv" fill="#2c4c54" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
