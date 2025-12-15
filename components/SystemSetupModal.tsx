
import React, { useState } from 'react';
import { Coffee, ShoppingBasket, Utensils, Store, CheckCircle, ArrowRight } from 'lucide-react';
import { SystemMode } from '../types';

interface SystemSetupModalProps {
  onComplete: (mode: SystemMode) => void;
}

const SystemSetupModal: React.FC<SystemSetupModalProps> = ({ onComplete }) => {
  const [selectedMode, setSelectedMode] = useState<SystemMode | null>(null);

  const businessTypes = [
    {
      id: 'cafe' as SystemMode,
      title: 'نظام المقاهي',
      description: 'مثالي للمقاهي المختصة، المخابز، ومحلات العصير. يركز على سرعة الطلب وقوائم المشروبات.',
      icon: Coffee,
      color: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      id: 'market' as SystemMode,
      title: 'نظام السوبر ماركت',
      description: 'مخصص لمحلات البقالة والأسواق المركزية. يدعم إدارة آلاف المنتجات والباركود.',
      icon: ShoppingBasket,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      id: 'restaurant' as SystemMode,
      title: 'نظام المطاعم',
      description: 'مناسب للمطاعم الفاخرة والوجبات السريعة. إدارة الطاولات والمطبخ.',
      icon: Utensils,
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    {
      id: 'retail' as SystemMode,
      title: 'نظام المتاجر',
      description: 'للمحلات التجارية العامة، الملابس، الإلكترونيات. يركز على المخزون والفئات.',
      icon: Store,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-coffee-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 relative flex flex-col md:flex-row h-[80vh] md:h-[600px]">
        
        {/* Sidebar Info */}
        <div className="w-full md:w-1/3 bg-gold-500 p-8 text-white flex flex-col justify-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <Store size={32} className="text-white" />
             </div>
             <h2 className="text-3xl font-bold mb-4">إعداد النظام</h2>
             <p className="text-white/80 leading-relaxed mb-8">
               أهلاً بك في النظام الذهبي. لتقديم أفضل تجربة، يرجى تحديد طبيعة نشاطك التجاري لنقوم بتخصيص الواجهة والخصائص بما يتناسب مع احتياجاتك.
             </p>
             <div className="flex items-center gap-2 text-sm bg-black/10 p-3 rounded-lg">
                <CheckCircle size={16} />
                <span>يمكنك تغيير هذا لاحقاً من الإعدادات</span>
             </div>
           </div>
        </div>

        {/* Selection Area */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white">
           <h3 className="text-2xl font-bold text-coffee-900 mb-8 text-center md:text-right">اختر نوع النشاط</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {businessTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedMode(type.id)}
                  className={`p-6 rounded-2xl border-2 text-right transition-all duration-300 relative group ${
                    selectedMode === type.id 
                    ? 'border-gold-500 bg-gold-50 shadow-lg scale-[1.02]' 
                    : 'border-gray-100 hover:border-gold-200 hover:shadow-md'
                  }`}
                >
                  {selectedMode === type.id && (
                    <div className="absolute top-4 left-4 text-gold-600 bg-white rounded-full p-1 shadow-sm">
                        <CheckCircle size={20} fill="currentColor" className="text-white" />
                    </div>
                  )}
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${type.color}`}>
                     <type.icon size={24} />
                  </div>
                  <h4 className="font-bold text-lg text-coffee-900 mb-2">{type.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{type.description}</p>
                </button>
              ))}
           </div>

           <button
             onClick={() => selectedMode && onComplete(selectedMode)}
             disabled={!selectedMode}
             className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-coffee-900 text-white hover:bg-gold-600 shadow-xl"
           >
             بدء الاستخدام
             <ArrowRight size={20} />
           </button>
        </div>

      </div>
    </div>
  );
};

export default SystemSetupModal;
