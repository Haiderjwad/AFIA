import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Receipt, Box, FileText, Users, Settings, LogOut, CircleUser, UtensilsCrossed, Truck, ShoppingCart, Home } from 'lucide-react';
import { Employee } from '../types';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  onLogout: () => void;
  user: Employee | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, onLogout, user }) => {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسة', icon: Home, roles: ['admin', 'manager', 'cashier', 'sales'] },
    { id: 'sales', label: 'المبيعات', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier', 'sales'] },
    { id: 'kitchen', label: 'المطبخ', icon: UtensilsCrossed, roles: ['admin', 'manager', 'kitchen'] },
    { id: 'invoices', label: 'الفواتير', icon: Receipt, roles: ['admin', 'manager', 'cashier'] },
    { id: 'inventory', label: 'المخزون', icon: Box, roles: ['admin', 'manager'] },
    { id: 'suppliers', label: 'الموردين', icon: Truck, roles: ['admin', 'manager'] },
    { id: 'reports', label: 'التقارير المفصلة', icon: FileText, roles: ['admin', 'manager'] },
    { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin', 'manager'] },
  ];

  // Filter items based on user role
  const filteredItems = menuItems.filter(item =>
    !user || item.roles.includes(user.role)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    if (showProfile) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roles: any = {
      admin: 'مدير النظام',
      manager: 'مدير فرع',
      cashier: 'كاشير',
      kitchen: 'شيف المطبخ'
    };
    return roles[role] || role;
  };

  return (
    <div className="w-24 bg-coffee-900 h-full flex flex-col items-center py-8 rounded-r-3xl shadow-2xl z-20 transition-colors duration-500">
      <div className="mb-10 text-gold-200">
        <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center text-coffee-900 font-bold text-xl shadow-lg shadow-gold-500/20 transition-colors">
          POS
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full px-2 overflow-y-auto no-scrollbar">
        {filteredItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 group relative
                ${isActive
                  ? 'bg-gold-100 text-coffee-900 shadow-lg translate-x-1'
                  : 'text-gold-200 hover:text-white hover:bg-white/10'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-coffee-900 rounded-r-full -ml-3"></div>
              )}
              <Icon size={24} className={isActive ? 'text-coffee-900' : 'text-gold-400 group-hover:text-white'} />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-coffee-900' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto w-full px-2">
        <div className="pt-6 pb-2 border-t border-white/10 w-full flex flex-col items-center gap-6">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-10 h-10 rounded-full bg-gold-500/20 ring-gold-500/50 hover:bg-gold-500 text-white flex items-center justify-center hover:text-coffee-900 transition-all ring-1 overflow-hidden"
              title="الملف الشخصي"
            >
              {user ? (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                  {getInitials(user.name)}
                </div>
              ) : (
                <CircleUser size={24} />
              )}
            </button>

            {showProfile && user && (
              <div className="absolute bottom-0 right-28 w-72 bg-white p-5 rounded-2xl shadow-2xl border border-gold-100 z-50 animate-in fade-in slide-in-from-right-4 text-right">
                <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                  <div className="w-12 h-12 bg-coffee-900 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-coffee-900 text-base">{user.name}</h4>
                    <p className="text-xs text-gold-600 bg-gold-50 font-bold px-2 py-0.5 rounded-full w-fit mt-1">
                      {getRoleLabel(user.role)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-xs text-gray-400">الرقم الوظيفي</span>
                    <span className="font-bold text-coffee-900 font-mono">{user.employeeId}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-xs text-gray-400">البريد الإلكتروني</span>
                    <span className="font-bold text-coffee-900 text-xs">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-xs text-gray-400">تاريخ الانضمام</span>
                    <span className="font-bold text-coffee-900">{new Date(user.joinedAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="text-gold-400 hover:text-white hover:bg-white/10 w-full py-2 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-semibold">خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
