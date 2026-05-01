import React from 'react';
import { Trash2, AlertTriangle, X, ArrowRight } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, title, description }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed top-20 right-0 lg:right-28 left-0 bottom-0 z-[150] bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20 dark:border-slate-700">

                {/* Glow Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl"></div>

                <div className="p-10 flex flex-col items-center text-center relative z-10">
                    {/* Warning Icon Container */}
                    <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-[2.5rem] animate-ping opacity-20"></div>
                        <Trash2 size={48} className="text-red-500 relative z-10" />
                    </div>

                    <h2 className="text-3xl font-black text-brand-dark dark:text-white mb-4">{title}</h2>

                    <div className="bg-gray-50 dark:bg-white/5 w-full rounded-2xl p-6 mb-10 border border-gray-100 dark:border-white/10 shadow-inner">
                        <p className="text-gray-700 dark:text-gray-200 text-base font-extrabold leading-relaxed text-center">
                            {description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="py-5 px-6 bg-red-600 text-white rounded-[1.8rem] font-black shadow-xl shadow-red-600/20 hover:bg-red-500 hover:shadow-red-600/40 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Trash2 size={20} />
                            تأكيد الحذف
                        </button>
                        <button
                            onClick={onClose}
                            className="py-5 px-6 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300 rounded-[1.8rem] font-black hover:text-brand-dark dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 border-2 border-transparent"
                        >
                            تراجع
                        </button>
                    </div>
                </div>

                {/* Top Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-red-500/30 hover:rotate-90 active:scale-95 z-20"
                    title="إغلاق"
                >
                    <X size={24} />
                </button>

                <div className="px-10 py-5 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex justify-center sticky bottom-0">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em]">Golden POS Security Protocol</span>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
