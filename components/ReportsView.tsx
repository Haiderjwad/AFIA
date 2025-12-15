
import React, { useState } from 'react';
import { Transaction } from '../types';
import { generateDailyReport } from '../services/geminiService';
import { Bot, Sparkles, Loader2, BarChart2 } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateDailyReport(transactions);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">التقارير الذكية</h1>
          <p className="text-gray-500">تحليل الأداء اليومي باستخدام الذكاء الاصطناعي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-coffee-900 to-coffee-800 p-8 rounded-3xl text-white shadow-xl">
                <Bot size={48} className="text-gold-400 mb-6" />
                <h2 className="text-2xl font-bold mb-4">المحلل الذكي</h2>
                <p className="text-white/70 mb-8 leading-relaxed">
                    يقوم الذكاء الاصطناعي بتحليل جميع عمليات البيع اليومية، وتحديد الأصناف الأكثر مبيعاً، وتقديم توصيات لزيادة الأرباح غداً.
                </p>
                <button 
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-coffee-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" />
                            جاري التحليل...
                        </>
                    ) : (
                        <>
                            <Sparkles />
                            إنشاء تقرير اليوم
                        </>
                    )}
                </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gold-100">
                <h3 className="font-bold text-coffee-900 mb-4 flex items-center gap-2">
                    <BarChart2 size={20} className="text-teal-800" />
                    إحصائيات سريعة
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">عمليات اليوم</span>
                        <span className="font-bold">{transactions.length}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">متوسط السلة</span>
                        <span className="font-bold">
                            {transactions.length > 0 
                                ? (transactions.reduce((a,b) => a + b.total, 0) / transactions.length).toFixed(2) 
                                : 0} $
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Report Display */}
        <div className="lg:col-span-2">
            <div className="bg-white min-h-[500px] rounded-3xl shadow-xl border border-gold-100 p-8 relative">
                {!report ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-4">
                        <Sparkles size={64} className="opacity-20" />
                        <p>اضغط على "إنشاء تقرير اليوم" للبدء</p>
                    </div>
                ) : (
                    <div className="prose prose-lg max-w-none text-right" dir="rtl">
                        <div className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                            {report}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
