
import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Package, ArrowRight } from 'lucide-react';
import { MenuItem } from '../types';

interface LowStockAlertProps {
    item: MenuItem;
    onClose: () => void;
    onNavigateToInventory: () => void;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ item, onClose, onNavigateToInventory }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500); // Wait for exit animation
        }, 6000);

        return () => clearTimeout(timer);
    }, [item, onClose]);

    return (
        <div
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-90'}`}
            dir="rtl"
        >
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-[2px] rounded-[2rem] shadow-2xl shadow-orange-500/20">
                <div className="bg-white rounded-[1.9rem] p-5 flex items-center gap-4 relative overflow-hidden group">
                    {/* Background Decorative patterns */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                    {/* Icon Section */}
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner shrink-0 relative z-10">
                        <AlertTriangle size={28} className="animate-pulse" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 relative z-10 text-right">
                        <h4 className="text-xs font-black text-orange-800 uppercase tracking-widest mb-1">تنبيه انخفاض المخزون</h4>
                        <p className="text-coffee-900 font-bold text-sm mb-1">العنصر "{item.name}" شارف على الانتهاء</p>
                        <p className="text-gray-400 text-[10px] font-bold">الكمية المتبقية حالياً: <span className="text-orange-600">{item.stock} وحدة</span> فقط.</p>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onNavigateToInventory}
                        className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm shrink-0"
                        title="انتقل للمخزون"
                    >
                        <ArrowRight size={20} className="rotate-180" />
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={() => { setIsVisible(false); setTimeout(onClose, 500); }}
                        className="absolute top-2 left-2 p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LowStockAlert;
