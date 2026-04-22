import React from 'react';
import { CheckCircle2, AlertCircle, X, Sparkles, RefreshCw } from 'lucide-react';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'success' | 'error' | 'warning' | 'loading';
    title: string;
    message: string;
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, type, title, message }) => {
    if (!isOpen) return null;

    const colors = {
        success: {
            bg: 'bg-green-50',
            text: 'text-green-600',
            icon: <CheckCircle2 size={48} className="text-green-500" />,
            button: 'bg-green-600 shadow-green-600/20 hover:bg-green-700',
            glow: 'bg-green-500/10'
        },
        error: {
            bg: 'bg-red-50',
            text: 'text-red-600',
            icon: <AlertCircle size={48} className="text-red-500" />,
            button: 'bg-red-600 shadow-red-600/20 hover:bg-red-700',
            glow: 'bg-red-500/10'
        },
        warning: {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            icon: <AlertCircle size={48} className="text-orange-500" />,
            button: 'bg-orange-600 shadow-orange-600/20 hover:bg-orange-700',
            glow: 'bg-orange-500/10'
        },
        loading: {
            bg: 'bg-brand-light/30',
            text: 'text-brand-primary',
            icon: <RefreshCw size={48} className="text-brand-primary animate-spin" />,
            button: 'hidden',
            glow: 'bg-brand-primary/10'
        }
    };

    const config = colors[type];

    return (
        <div className="fixed inset-0 z-[2000] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20">

                {/* Visual Elements */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 ${config.glow} rounded-full blur-3xl`}></div>
                <div className={`absolute -bottom-24 -left-24 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl`}></div>

                <div className="p-10 flex flex-col items-center text-center relative z-10">
                    {/* Icon Container */}
                    <div className={`w-24 h-24 ${config.bg} rounded-[2.5rem] flex items-center justify-center mb-8 relative`}>
                        <div className={`absolute inset-0 ${config.bg} animate-ping opacity-20 rounded-[2.5rem]`}></div>
                        {config.icon}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-brand-accent animate-pulse" />
                        <h2 className={`text-2xl font-black text-brand-dark`}>{title}</h2>
                        <Sparkles size={16} className="text-brand-accent animate-pulse" />
                    </div>

                    <p className="text-brand-dark/60 font-bold leading-relaxed mb-10 px-2 text-sm italic">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-5 px-6 ${config.button} text-white rounded-[1.8rem] font-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2`}
                    >
                        فهمت ذلك
                    </button>
                </div>

                {/* Top Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 p-2 bg-gray-50 text-gray-400 hover:text-brand-dark rounded-xl transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="px-10 py-5 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <span className="text-[10px] text-gray-300 font-extrabold uppercase tracking-[0.2em]">{type === 'success' ? 'Operation Completed' : 'System Notification'}</span>
                </div>
            </div>
        </div>
    );
};

export default StatusModal;
