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
        <div className="fixed inset-0 z-[9999] bg-brand-dark/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
            <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 relative border border-white/20">

                {/* Glow Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl"></div>

                <div className="p-10 flex flex-col items-center text-center relative z-10">
                    {/* Warning Icon Container */}
                    <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-[2.5rem] animate-ping opacity-20"></div>
                        <Trash2 size={48} className="text-red-500 relative z-10" />
                    </div>

                    <h2 className="text-3xl font-black text-brand-dark mb-4">{title}</h2>
                    <p className="text-brand-dark/40 font-bold leading-relaxed mb-10 px-4">
                        {description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="py-5 px-6 bg-red-600 text-white rounded-[1.8rem] font-black shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Trash2 size={20} />
                            تأكيد الحذف
                        </button>
                        <button
                            onClick={onClose}
                            className="py-5 px-6 bg-brand-light/20 text-brand-primary rounded-[1.8rem] font-black hover:bg-brand-primary hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            تراجع
                        </button>
                    </div>
                </div>

                {/* Top Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 p-3 bg-gray-50 text-gray-400 hover:text-brand-primary rounded-2xl transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="px-10 py-5 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <span className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em]">Golden POS Security Protocol</span>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
