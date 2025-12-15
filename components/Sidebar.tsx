
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Receipt, Box, FileText, Users, Settings, LogOut, CircleUser } from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'sales', label: 'المبيعات', icon: LayoutDashboard },
    { id: 'invoices', label: 'الفواتير', icon: Receipt },
    { id: 'inventory', label: 'المخزون', icon: Box },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'reports', label: 'التقارير', icon: FileText },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  return (
    <div className="w-24 bg-coffee-900 h-full flex flex-col items-center py-8 rounded-r-3xl shadow-2xl z-20 transition-colors duration-500">
      <div className="mb-10 text-gold-200">
        {/* Abstract Logo */}
        <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center text-coffee-900 font-bold text-xl shadow-lg shadow-gold-500/20 transition-colors">
          POS
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6 w-full px-2">
        {menuItems.map((item) => {
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

      {/* User & Logout Section */}
      <div className="mt-auto w-full px-2">
        <div className="pt-6 pb-2 border-t border-white/10 w-full flex flex-col items-center gap-6">
            {/* User Profile Trigger */}
            <div className="relative" ref={profileRef}>
                <button 
                    onClick={() => setShowProfile(!showProfile)}
                    className="w-10 h-10 rounded-full bg-gold-500/20 ring-gold-500/50 hover:bg-gold-500 text-white flex items-center justify-center hover:text-coffee-900 transition-all ring-1"
                    title="الملف الشخصي"
                >
                    <CircleUser size={24} className="text-white" />
                </button>
                
                {showProfile && (
                    <div className="absolute bottom-0 right-28 w-72 bg-white p-5 rounded-2xl shadow-2xl border border-gold-100 z-50 animate-in fade-in slide-in-from-right-4 text-right">
                        
                        <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 bg-coffee-900 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                MK
                            </div>
                            <div>
                                <h4 className="font-bold text-coffee-900 text-base">محمد خالد</h4>
                                <p className="text-xs text-gold-600 bg-gold-50 font-bold px-2 py-0.5 rounded-full w-fit mt-1">مدير النظام</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <span className="text-xs text-gray-400">الرقم الوظيفي</span>
                                <span className="font-bold text-coffee-900 font-mono">ID-8842</span>
                            </div>
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <span className="text-xs text-gray-400">الفرع الحالي</span>
                                <span className="font-bold text-coffee-900">الرياض - التحلية</span>
                            </div>
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <span className="text-xs text-gray-400">وقت الدخول</span>
                                <span className="font-bold text-coffee-900" dir="ltr">08:30 AM</span>
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
