
import React, { useEffect, useState } from 'react';
import { ChefHat, X, AlertCircle, ArrowRight, BellRing } from 'lucide-react';
import { SystemNotification } from '../types';

interface KitchenAlertProps {
    notification: SystemNotification;
    onClose: () => void;
    onNavigateToInventory: (productName: string) => void;
}

const KitchenAlert: React.FC<KitchenAlertProps> = ({ notification, onClose, onNavigateToInventory }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        // Automatic hide after 8 seconds if not dismissed
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500);
        }, 8000);

        return () => clearTimeout(timer);
    }, [notification, onClose]);

    return (
        <div
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[350] w-full max-w-lg transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90'}`}
            dir="rtl"
        >
            <div className="bg-gradient-to-br from-red-600 via-rose-500 to-crimson-700 p-1.5 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(220,38,38,0.4)]">
                <div className="bg-white rounded-[2.2rem] p-6 flex items-center gap-6 relative overflow-hidden group">

                    {/* Pulsing Aura Background */}
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-red-100/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

                    {/* Badge/Icon Section */}
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-rose-700 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-red-600/30 ring-8 ring-red-50 group-hover:rotate-12 transition-transform duration-500">
                            <ChefHat size={40} className="animate-bounce" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-600 shadow-lg ring-4 ring-white">
                            <BellRing size={16} />
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">تحذير من المطبخ</span>
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                        </div>
                        <h4 className="text-xl font-black text-brand-dark mb-1">المخزون ينفد تماماً!</h4>
                        <p className="text-gray-500 font-bold text-sm leading-relaxed">
                            الشيف يخبركم بأن <span className="text-red-600 font-black">"{notification.productName}"</span> على وشك النفاد ولا يمكن استقبال طلبات جديدة قريباً.
                        </p>
                    </div>

                    {/* Action Side */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onNavigateToInventory(notification.productName || '')}
                            className="w-14 h-14 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-md group/btn"
                        >
                            <ArrowRight size={24} className="group-hover/btn:scale-110 transition-transform rotate-180" />
                        </button>
                    </div>

                    {/* Manual Close Overlay */}
                    <button
                        onClick={() => { setIsVisible(false); setTimeout(onClose, 500); }}
                        className="absolute top-4 left-4 p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KitchenAlert;
