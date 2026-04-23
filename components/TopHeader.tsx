
import React, { useState, useRef, useEffect } from 'react';
import { Bell, CircleUser, LogOut, PackageCheck, AlertTriangle, Wifi, WifiOff, Menu, ChefHat } from 'lucide-react';
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

    const profileRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

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

    const kitchenWarnings = notifications.filter(n => n.type === 'kitchen_warning' && !n.read).length;
    const notificationCount = readyOrders.length + lowStockItems.length + kitchenWarnings;

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-brand-primary/10 px-4 md:px-8 flex items-center justify-between z-40 sticky top-0" dir="rtl">

            {/* Title / Brand Section */}
            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-brand-dark/60 hover:text-brand-primary hover:bg-brand-light/20 rounded-xl transition-all"
                >
                    <Menu size={24} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{settings?.storeName || 'ألف عافية'}</h1>
                    <h2 className="text-lg md:text-xl font-black text-brand-dark leading-tight">{activeTabTitle}</h2>
                </div>
                <div className="w-1.5 h-10 bg-brand-accent rounded-full shadow-[0_0_10px_#F8961E]"></div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-6">

                {/* Connectivity Status */}
                <div className="hidden lg:flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    {isOnline ? (
                        <div className="flex items-center gap-2 text-[10px] font-black text-green-700">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            سحابة متصلة
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[10px] font-black text-red-600 animate-bounce">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            لا يوجد اتصال
                            <WifiOff size={10} />
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative ${showNotifications ? 'bg-brand-primary text-white shadow-xl scale-105' : 'bg-white border border-brand-primary/10 text-brand-dark/50 hover:bg-brand-light/20'}`}
                    >
                        <Bell size={20} />
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-accent text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white animate-bounce">
                                {notificationCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute top-16 left-0 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-brand-primary/10 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-left">
                            <div className="p-4 bg-brand-light/10 border-b border-brand-primary/5 flex justify-between items-center">
                                <span className="font-black text-brand-dark text-sm">التنبيهات السحابية</span>
                                <span className="text-[10px] font-bold text-brand-secondary">{notificationCount} تنبيهات</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto no-scrollbar">
                                {readyOrders.map(order => (
                                    <div
                                        key={order.id}
                                        onClick={() => {
                                            onNavigate('invoices');
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 border-b border-gray-50 bg-green-50/20 hover:bg-green-50 transition-colors flex items-start gap-3 cursor-pointer group"
                                    >
                                        <div className="p-2 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <PackageCheck size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-brand-dark group-hover:text-brand-primary transition-colors">الطلب #{order.id.slice(-4)} جاهز!</p>
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
                                            <p className="text-sm font-black text-brand-dark group-hover:text-amber-700 transition-colors">المخزون منخفض: {item.name}</p>
                                            <p className="text-[10px] text-amber-700 font-bold mb-1">يرجى تعبئة المخزون فوراً</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-gray-400">الكمية: {item.stock} وحدة</p>
                                                <span className="text-[9px] text-brand-primary font-black group-hover:translate-x-1 transition-transform">انتقال للمنتجات ←</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notifications.filter(n => n.type === 'kitchen_warning').map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            onNavigate('inventory', undefined, { productSearch: n.productName });
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 border-b border-gray-50 bg-red-50/20 hover:bg-red-50 transition-colors flex items-start gap-3 text-right cursor-pointer group"
                                    >
                                        <div className="p-2 bg-red-100 text-red-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                            <ChefHat size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-brand-dark group-hover:text-red-700 transition-colors">تنبيه حرج من المطبخ!</p>
                                            <p className="text-[10px] text-red-700 font-bold mb-1">{n.message}</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] text-gray-400 font-bold">{new Date(n.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                                <span className="text-[9px] text-red-600 font-black group-hover:translate-x-1 transition-transform">عرض المنتج ←</span>
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
                        className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white border border-brand-primary/10 hover:bg-brand-light/10 transition-all shadow-sm group"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-brand-dark leading-tight">{user?.name}</p>
                            <p className="text-[10px] text-brand-secondary font-bold">{getRoleLabel(user?.role || '')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black shadow-lg group-hover:scale-105 transition-transform">
                            {user ? getInitials(user.name) : <CircleUser size={24} />}
                        </div>
                    </button>

                    {showProfile && (
                        <div className="absolute top-16 left-0 w-72 bg-white p-6 rounded-3xl shadow-2xl border border-brand-primary/10 animate-in fade-in slide-in-from-top-2 origin-top-left">
                            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                                <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-brand-primary/20">
                                    {user ? getInitials(user.name) : <CircleUser size={24} />}
                                </div>
                                <div>
                                    <h4 className="font-black text-coffee-900">{user?.name}</h4>
                                    <p className="text-[10px] text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full inline-block font-black mt-1 uppercase leading-none">
                                        {getRoleLabel(user?.role || '')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                                    <span className="text-[10px] font-black text-gray-400">كود الموظف</span>
                                    <span className="font-bold text-coffee-900 text-xs">{user?.employeeId}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                                    <span className="text-[10px] font-black text-gray-400">البريد</span>
                                    <span className="font-bold text-coffee-900 text-[10px]">{user?.email}</span>
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

export default TopHeader;
