import React from 'react';
import { Truck, ShoppingCart, Home, UtensilsCrossed, Receipt, Box, FileText, Settings, Users } from 'lucide-react';
import { AppSettings, Employee } from '../types';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  user: Employee | null;
  settings?: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, user, settings }) => {
  const menuItems = [
    { id: 'dashboard', label: 'الرئيسة', icon: Home, roles: ['admin', 'manager'] },
    { id: 'sales', label: 'المبيعات', icon: ShoppingCart, roles: ['admin', 'manager', 'sales'] },
    { id: 'kitchen', label: 'المطبخ', icon: UtensilsCrossed, roles: ['admin', 'manager', 'kitchen', 'cook', 'chef'] },
    { id: 'invoices', label: 'الفواتير', icon: Receipt, roles: ['admin', 'manager', 'cashier'] },
    { id: 'inventory', label: 'المخزون', icon: Box, roles: ['admin', 'manager', 'sales'] },
    { id: 'suppliers', label: 'الموردين', icon: Truck, roles: ['admin', 'manager', 'cashier'] },
    { id: 'reports', label: 'التقارير المفصلة', icon: FileText, roles: ['admin', 'manager', 'cashier'] },
    { id: 'performance', label: 'أداء الموظفين', icon: Users, roles: ['admin', 'manager'] },
    { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin', 'manager'] },
  ];

  // Filter items based on user role and granular permissions
  const filteredItems = menuItems.filter(item => {
    if (!user) return true;
    const userRole = user.role.toLowerCase();
    const hasRole = item.roles.includes(userRole);
    const hasPermission = Array.isArray(user.permissions) && (
      user.permissions.includes(item.id) ||
      user.permissions.includes('all')
    );
    return hasRole || hasPermission;
  });

  return (
    <div className="w-28 bg-brand-primary h-full flex flex-col items-center py-8 rounded-l-[3.5rem] shadow-2xl z-20 transition-all duration-500 relative">
      <div className="mb-10 relative">
        <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md p-2 flex items-center justify-center shadow-2xl border border-white/10 hover:scale-110 transition-transform duration-300 overflow-hidden">
          {settings?.storeLogo ? (
            <img src={settings.storeLogo} alt="Store Logo" className="w-full h-full object-contain" />
          ) : (
            <img src="/branding/afia_logo.png" alt="Afia Logo" className="w-full h-full object-contain" />
          )}
        </div>
      </div>

      <nav
        className="flex-1 w-full overflow-y-auto pt-4 px-2"
        style={{ direction: 'ltr' }}
      >
        <div style={{ direction: 'rtl' }} className="flex flex-col gap-6 w-full items-center">
          {filteredItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[2rem] transition-all duration-500 group relative w-full max-w-[80px]
                  ${isActive
                    ? 'bg-brand-cream text-brand-primary shadow-2xl scale-110'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                {isActive && (
                  <div className="absolute right-[-0.5rem] w-2 h-12 bg-brand-accent rounded-l-full shadow-[0_0_15px_#F8961E]"></div>
                )}
                <Icon size={24} className={isActive ? 'text-brand-primary' : 'text-white/70 group-hover:text-brand-secondary group-hover:scale-110 transition-all shadow-sm'} />
                <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-tight ${isActive ? 'text-brand-primary' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto opacity-40 text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em] -rotate-90 pb-16">
        Alf Afia
      </div>
    </div>
  );
};

export default Sidebar;
