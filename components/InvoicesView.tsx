
import React from 'react';
import { Transaction } from '../types';
import { FileText, Calendar, Clock, Printer } from 'lucide-react';
import { CURRENCY } from '../constants';

interface InvoicesViewProps {
  transactions: Transaction[];
}

const InvoicesView: React.FC<InvoicesViewProps> = ({ transactions }) => {
  const handlePrint = (transaction: Transaction) => {
    const printWindow = window.open('', '', 'width=360,height=600');
    if (!printWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>فاتورة #${transaction.id.slice(-6)}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; color: #000; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .info { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .items { margin-bottom: 15px; font-size: 12px; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .totals { border-top: 1px dashed #000; padding-top: 10px; font-size: 14px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px; }
          .footer { margin-top: 20px; font-size: 10px; color: #555; }
        </style>
      </head>
      <body>
        <div class="logo">Cafe Sun</div>
        <div class="info">
          <div>رقم الفاتورة: #${transaction.id.slice(-6)}</div>
          <div>${new Date(transaction.date).toLocaleDateString('ar-EG')} - ${new Date(transaction.date).toLocaleTimeString('ar-EG')}</div>
        </div>
        
        <div class="items">
          ${transaction.items.map(item => 
            `<div class="item-row">
              <span>${item.name} x${item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
             </div>`
          ).join('')}
        </div>
        
        <div class="totals">
          <div class="total-row">
            <span>الإجمالي</span>
            <span>${transaction.total.toFixed(2)} ${CURRENCY}</span>
          </div>
        </div>
        
        <div class="footer">
          شكراً لزيارتكم<br/>
          نتمنى لكم يوماً سعيداً
        </div>
        <script>
          window.print();
          window.onafterprint = function() { window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">سجل الفواتير</h1>
          <p className="text-gray-500">عرض تفاصيل العمليات السابقة وطباعة الإيصالات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transactions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText size={48} className="mb-4 opacity-50" />
            <p>لا توجد فواتير مسجلة حتى الآن</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white p-6 rounded-3xl shadow-lg border border-gold-100 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center text-gold-600 font-bold group-hover:bg-gold-500 group-hover:text-white transition-colors">
                   #{transaction.id.slice(-4)}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {transaction.status === 'completed' ? 'مكتمل' : 'مسترجع'}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                 <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar size={14} />
                    {new Date(transaction.date).toLocaleDateString('ar-EG')}
                 </div>
                 <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock size={14} />
                    {new Date(transaction.date).toLocaleTimeString('ar-EG')}
                 </div>
                 <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                    <span className="text-gray-600 text-sm">{transaction.items.length} عناصر</span>
                    <span className="font-bold text-coffee-900 text-lg">{transaction.total.toFixed(2)} {CURRENCY}</span>
                 </div>
              </div>
              
              <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl bg-gray-50 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors">
                      التفاصيل
                  </button>
                  <button 
                    onClick={() => handlePrint(transaction)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-coffee-900 text-white hover:bg-gold-600 transition-colors"
                    title="طباعة الفاتورة"
                  >
                      <Printer size={18} />
                  </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InvoicesView;
