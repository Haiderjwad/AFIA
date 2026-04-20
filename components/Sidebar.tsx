
import React from 'react';
import { Truck, ShoppingCart, Home, UtensilsCrossed, Receipt, Box, FileText, Settings } from 'lucide-react';
import { Employee } from '../types';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  user: Employee | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, user }) => {
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

  return (
    <div className="w-24 bg-coffee-900 h-full flex flex-col items-center py-8 rounded-r-[3rem] shadow-2xl z-20 transition-all duration-500">
      <div className="mb-12">
        <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center text-coffee-900 font-black text-xl shadow-xl shadow-gold-500/20">
          G
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-8 w-full px-3 overflow-y-auto no-scrollbar">
        {filteredItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 group relative
                ${isActive
                  ? 'bg-white text-coffee-900 shadow-xl scale-110'
                  : 'text-gold-200 hover:text-white hover:bg-white/10'
                }`}
            >
              {isActive && (
                <div className="absolute right-0 w-1 h-10 bg-gold-500 rounded-l-full"></div>
              )}
              <Icon size={24} className={isActive ? 'text-coffee-900' : 'text-gold-400 group-hover:text-gold-300'} />
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-coffee-900' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto opacity-20 text-[10px] font-black text-gold-500 uppercase tracking-widest -rotate-90 pb-10">
        Golden POS
      </div>
    </div>
  );
};

export default Sidebar;
