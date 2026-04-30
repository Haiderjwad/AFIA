
import React, { useState, useRef, useEffect } from 'react';
import { Bell, CircleUser, LogOut, PackageCheck, AlertTriangle, Wifi, WifiOff, Menu, ChefHat, Moon, Sun } from 'lucide-react';
import { Employee, Transaction, MenuItem, AppSettings } from '../types';

interface TopHeaderProps {
    user: Employee | null;
    onLogout: () => void;
    notifications: any[];
    readyOrders: Transaction[];
    lowStockItems: MenuItem[];
    onCompleteOrder: (id: string) => void;
    onNavigate: (view: string, subTab?: string, data?: any) => void;
    isOnline: boolean;
    activeTabTitle: string;
    settings?: AppSettings;
    onToggleSidebar?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({
    user, onLogout, notifications, readyOrders, lowStockItems,
    onCompleteOrder, onNavigate, isOnline, activeTabTitle, settings,
    onToggleSidebar
}) => {
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const profileRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const getRoleLabel = (role: string) => {
        const roles: any = {
            admin: 'مدير النظام',
            manager: 'المدير',
            cashier: 'الكاشير',
            kitchen: 'طباخ المطبخ',
            cook: 'طباخ المطبخ',
            chef: 'طباخ المطبخ',
            sales: 'المبيعات'
        };
        return roles[role] || role;
    };

    const notificationCount = readyOrders.length + lowStockItems.length;

    return (
        <header className="h-20 bg-white/90 backdrop-blur-xl border-b border-brand-primary/10 px-4 md:px-8 flex items-center justify-between z-40 sticky top-0 transition-colors duration-300" style={isDarkMode ? { backgroundColor: 'rgba(22,27,34,0.95)', borderBottomColor: 'rgba(45,52,72,0.8)' } : {}} dir="rtl">

            {/* Title / Brand Section */}
            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-brand-dark/60 hover:text-brand-primary hover:bg-brand-light/20 rounded-xl transition-all" style={isDarkMode ? { color: 'var(--dm-text-2)' } : {}}
                >
                    <Menu size={24} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-[10px] font-black uppercase tracking-widest transition-colors" style={{ color: isDarkMode ? 'var(--dm-green-glow)' : '#2D6A4F' }}>{settings?.storeName || 'سوفتي كود'}</h1>
                    <h2 className="text-lg md:text-xl font-black leading-tight transition-colors" style={{ color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332' }}>{activeTabTitle}</h2>
                </div>
                <div className="w-1.5 h-10 bg-brand-accent rounded-full shadow-[0_0_10px_#F8961E]"></div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-6">

                {/* Connectivity Status */}
                <div className="hidden lg:flex items-center px-4 py-2 rounded-2xl border transition-colors" style={isDarkMode ? { backgroundColor: 'var(--dm-muted)', borderColor: 'var(--dm-border)' } : { backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }}>
                    {isOnline ? (
                        <div className="flex items-center gap-2 text-[10px] font-black" style={{ color: isDarkMode ? 'var(--dm-green-glow)' : '#166534' }}>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            سحابة متصلة
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[10px] font-black animate-bounce" style={{ color: isDarkMode ? 'var(--dm-red)' : '#dc2626' }}>
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            لا يوجد اتصال
                            <WifiOff size={10} />
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    title={isDarkMode ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all border"
                    style={isDarkMode
                        ? { backgroundColor: 'var(--dm-muted)', borderColor: 'var(--dm-border)' }
                        : { backgroundColor: '#fff', borderColor: 'rgba(45,106,79,0.1)' }
                    }
                >
                    {isDarkMode
                        ? <Sun size={19} style={{ color: 'var(--dm-amber)' }} />
                        : <Moon size={19} className="text-slate-500" />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative border ${showNotifications ? 'bg-brand-primary text-white shadow-xl scale-105 border-transparent' : ''}`}
                        style={!showNotifications ? (isDarkMode
                            ? { backgroundColor: 'var(--dm-muted)', borderColor: 'var(--dm-border)', color: 'var(--dm-text-2)' }
                            : { backgroundColor: '#fff', borderColor: 'rgba(45,106,79,0.1)', color: 'rgba(27,67,50,0.5)' }
                        ) : {}}
                    >
                        <Bell size={20} />
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-accent text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white animate-bounce">
                                {notificationCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div
                            className="absolute top-16 left-0 w-80 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-left"
                            style={isDarkMode ? {
                                backgroundColor: 'var(--dm-surface)',
                                border: '1px solid var(--dm-border)',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
                            } : {
                                backgroundColor: '#fff',
                                border: '1px solid rgba(45,106,79,0.08)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div className="p-4 border-b flex justify-between items-center" style={isDarkMode ? { backgroundColor: 'var(--dm-muted)', borderColor: 'var(--dm-border)' } : { backgroundColor: 'rgba(216,243,220,0.2)', borderColor: 'rgba(45,106,79,0.05)' }}>
                                <span className="font-black text-sm" style={{ color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332' }}>التنبيهات السحابية</span>
                                <span className="text-[10px] font-bold" style={{ color: isDarkMode ? 'var(--dm-green-glow)' : '#52B788' }}>{notificationCount} تنبيهات</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto no-scrollbar">
                                {readyOrders.map(order => (
                                    <div
                                        key={order.id}
                                        onClick={() => {
                                            onNavigate('invoices');
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 flex items-start gap-3 cursor-pointer group transition-colors"
                                        style={{ borderBottom: `1px solid ${isDarkMode ? 'var(--dm-border)' : '#f8f9fa'}` }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--dm-overlay)' : '#f0fdf4')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <div className="p-2 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform" style={isDarkMode ? { backgroundColor: 'var(--dm-green-soft)', color: 'var(--dm-green-glow)' } : {}}>
                                            <PackageCheck size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold group-hover:text-brand-primary transition-colors" style={{ color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332' }}>الطلب #{order.id.slice(-4)} جاهز!</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCompleteOrder(order.id);
                                                        setShowNotifications(false);
                                                    }}
                                                    className="text-[10px] font-black bg-brand-primary text-white px-3 py-1 rounded-full hover:bg-brand-secondary transition-all"
                                                >
                                                    إرسال للمحاسبة
                                                </button>
                                                <span className="text-[9px] text-gray-400 font-bold">عرض الفواتير</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {lowStockItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            onNavigate('inventory', undefined, { productSearch: item.name });
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 border-b border-gray-50 bg-amber-50/30 hover:bg-amber-50 transition-colors flex items-start gap-3 text-right cursor-pointer group"
                                    >
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-brand-dark dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">المخزون منخفض: {item.name}</p>
                                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mb-1">يرجى تعبئة المخزون فوراً</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-gray-400 dark:text-gray-300">الكمية: {item.stock} وحدة</p>
                                                <span className="text-[9px] text-brand-primary dark:text-brand-light font-black group-hover:translate-x-1 transition-transform">انتقال للمنتجات ←</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notificationCount === 0 && (
                                    <div className="p-10 text-center text-gray-300 italic text-sm">لا توجد تنبيهات جديدة</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl border transition-all shadow-sm group"
                        style={isDarkMode
                            ? { backgroundColor: 'var(--dm-surface)', borderColor: 'var(--dm-border)' }
                            : { backgroundColor: '#fff', borderColor: 'rgba(45,106,79,0.1)' }
                        }
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black leading-tight" style={{ color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332' }}>{user?.name}</p>
                            <p className="text-[10px] font-bold" style={{ color: isDarkMode ? 'var(--dm-green-glow)' : '#52B788' }}>{getRoleLabel(user?.role || '')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black shadow-lg group-hover:scale-105 transition-transform">
                            {user ? getInitials(user.name) : <CircleUser size={24} />}
                        </div>
                    </button>

                    {showProfile && (
                        <div
                            className="absolute top-16 left-0 w-72 p-6 rounded-3xl animate-in fade-in slide-in-from-top-2 origin-top-left"
                            style={isDarkMode ? {
                                backgroundColor: 'var(--dm-surface)',
                                border: '1px solid var(--dm-border)',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
                            } : {
                                backgroundColor: '#fff',
                                border: '1px solid rgba(45,106,79,0.08)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.12)'
                            }}
                        >
                            <div className="flex items-center gap-4 mb-6 pb-4" style={{ borderBottom: `1px solid ${isDarkMode ? 'var(--dm-border)' : '#f1f3f5'}` }}>
                                <div className="w-14 h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl shadow-brand-primary/20" style={isDarkMode ? { background: 'linear-gradient(135deg, #2D6A4F, #1A4532)' } : {}}>
                                    {user ? getInitials(user.name) : <CircleUser size={24} />}
                                </div>
                                <div>
                                    <h4 className="font-black" style={{ color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332' }}>{user?.name}</h4>
                                    <p className="text-[10px] px-2 py-0.5 rounded-full inline-block font-black mt-1 uppercase leading-none"
                                        style={isDarkMode
                                            ? { backgroundColor: 'var(--dm-green-soft)', color: 'var(--dm-green-glow)' }
                                            : { backgroundColor: '#f0fdf4', color: '#16a34a' }
                                        }>
                                        {getRoleLabel(user?.role || '')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <div className="flex justify-between items-center p-3 rounded-2xl transition-colors"
                                    style={{ cursor: 'default' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--dm-overlay)' : '#f8f9fa')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <span className="text-[10px] font-black" style={{ color: isDarkMode ? 'var(--dm-text-3)' : '#9ca3af' }}>كود الموظف</span>
                                    <span className="font-bold text-xs" style={{ color: isDarkMode ? 'var(--dm-text-1)' : '#1B4332' }}>{user?.employeeId}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-2xl transition-colors"
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--dm-overlay)' : '#f8f9fa')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <span className="text-[10px] font-black" style={{ color: isDarkMode ? 'var(--dm-text-3)' : '#9ca3af' }}>البريد</span>
                                    <span className="font-bold text-[10px]" style={{ color: isDarkMode ? 'var(--dm-text-2)' : '#1B4332' }}>{user?.email}</span>
                                </div>
                            </div>

                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all group"
                            >
                                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> خروج آمن
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default React.memo(TopHeader);
