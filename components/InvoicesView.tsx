import React, { useState } from 'react';
import { Transaction, MenuItem, AppSettings, CartItem } from '../types';
import { FileText, Calendar, Clock, Printer, CreditCard, Banknote, Wifi, CheckCircle, Search, AlertCircle, Plus, Minus, Trash2, ShoppingCart, Coffee } from 'lucide-react';
import { CURRENCY } from '../constants';
import { firestoreService } from '../services/firestoreService';

interface InvoicesViewProps {
  transactions: Transaction[];
  onFinalizePayment?: (id: string, method: 'cash' | 'card' | 'online') => Promise<void>;
  canFinalize?: boolean;
  products?: MenuItem[];
  settings?: AppSettings;
}

const InvoicesView: React.FC<InvoicesViewProps> = ({ transactions, onFinalizePayment, canFinalize, products = [], settings }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForPayment, setSelectedForPayment] = useState<Transaction | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCart, setManualCart] = useState<CartItem[]>([]);

  const filteredTransactions = transactions.filter(t => {
    // Tab filter
    if (activeTab === 'pending' && t.status !== 'waiting_payment') return false;
    if (activeTab === 'all' && !['completed', 'refunded'].includes(t.status)) return false;

    // Search filter
    const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const handlePrint = (transaction: Transaction) => {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(transaction.items.length / itemsPerPage);

    const printWindow = window.open('', '', 'width=800,height=1000');
    if (!printWindow) return;

    let content = '';

    for (let page = 0; page < totalPages; page++) {
      const pageItems = transaction.items.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
      const isSubsequent = page > 0;
      const invoiceNumber = transaction.id.slice(-6) + (isSubsequent ? `-${page + 1}` : '');

      const grandSubtotal = transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const grandTaxAmount = grandSubtotal * ((settings?.taxRate || 11) / 100);
      const grandTotalAmount = grandSubtotal + grandTaxAmount;

      content += `
        <div class="invoice-page">
          <div class="header">
            <div class="logo-container">
              <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #8c6d46;">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
            </div>
            <h1>SO CAFE SYSTEM</h1>
            <p class="subtitle uppercase tracking-widest">POS SYSTEM</p>
          </div>

          <div class="dashed-line"></div>

          <div class="info-box">
            <div class="info-col left">
              <div class="info-row">
                <span class="label">رقم الفاتورة</span>
                <span class="value font-bold">#${invoiceNumber}</span>
              </div>
              <div class="info-row">
                <span class="label">تاريخ الفاتورة</span>
                <span class="value">${new Date(transaction.date).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
            <div class="info-col center">
              <div class="info-row">
                <span class="label">حالة الفاتورة</span>
                <span class="value status-tag">مكتمل</span>
              </div>
              <div class="info-row">
                <span class="label">الوقت</span>
                <span class="value">${new Date(transaction.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div class="info-col right">
              <div class="info-row">
                <span class="label">طريقة الدفع</span>
                <span class="value">دفع ${transaction.paymentMethod === 'cash' ? 'نقداً' : transaction.paymentMethod === 'card' ? 'بالبطاقة' : 'إلكتروني'}</span>
              </div>
              <div class="info-row">
                <span class="label">رقم الطاولة</span>
                <span class="value font-bold">طاولة 2</span>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%">ت</th>
                <th style="width: 50%">اسم المنتج</th>
                <th style="width: 15%">سعر المفرد</th>
                <th style="width: 10%">الكمية</th>
                <th style="width: 20%">السعر الكلي</th>
              </tr>
            </thead>
            <tbody>
              ${pageItems.map((item, index) => `
                <tr>
                  <td>${(page * itemsPerPage) + index + 1}</td>
                  <td class="font-bold">${item.name}</td>
                  <td>${settings?.currency || '$'} ${item.price.toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td class="font-bold">${settings?.currency || '$'} ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              ${Array.from({ length: 10 - pageItems.length }).map(() => `
                <tr class="empty-row"><td colspan="5">&nbsp;</td></tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-line">
              <span class="label">المجموع الفرعي:</span>
              <span class="value">${settings?.currency || '$'} ${grandSubtotal.toFixed(2)}</span>
            </div>
            <div class="summary-line tax">
              <span class="label">الضريبة (${settings?.taxRate || 11}%):</span>
              <span class="value">${settings?.currency || '$'} ${grandTaxAmount.toFixed(2)}</span>
            </div>
            <div class="total-section">
              <p class="total-label">الإجمالي النهائي</p>
              <h2 class="total-value">${settings?.currency || '$'} ${grandTotalAmount.toFixed(2)}</h2>
            </div>
          </div>

          <div class="dashed-line"></div>

          <div class="footer">
            <p class="font-bold">شكراً لزيارتكم SO CAFE</p>
            <p>نتمنى لكم يوماً سعيداً وحافلاً بالإنتاجية</p>
          </div>
        </div>
        ${page < totalPages - 1 ? '<div class="page-break"></div>' : ''}
      `;
    }

    const receiptHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة SO CAFE</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          
          body { 
            font-family: 'Cairo', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #f0f0f0; 
            color: #333;
          }
          
          .invoice-page {
            width: 800px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            box-sizing: border-box;
            border-radius: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
          }

          .header { text-align: center; margin-bottom: 20px; }
          .logo-container { margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 900; color: #1a1a1a; letter-spacing: 1px; }
          .subtitle { margin: 0; font-size: 14px; font-weight: 700; color: #8c6d46; }

          .dashed-line { 
            border-top: 2px dashed #d4c4b5; 
            margin: 30px 0; 
          }

          .info-box {
            background: #fff;
            border: 1px solid #eee;
            border-radius: 20px;
            display: flex;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          
          .info-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
          .info-col.center { border-left: 1px solid #f0f0f0; border-right: 1px solid #f0f0f0; padding: 0 20px; text-align: center;}
          .info-col.left { text-align: right; }
          .info-col.right { text-align: left; }
          
          .info-row { display: flex; flex-direction: column; }
          .info-row .label { font-size: 11px; color: #999; font-weight: 700; }
          .info-row .value { font-size: 14px; color: #1a1a1a; }
          
          .status-tag { color: #22c55e; font-weight: 900; }
          .font-bold { font-weight: 700; }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th {
            padding: 12px;
            background: #fafafa;
            border-bottom: 2px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: right;
          }
          
          .items-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #f9f9f9;
            font-size: 13px;
          }
          
          .empty-row td { border-bottom: none; height: 40px; }

          .summary {
            text-align: left;
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          
          .summary-line { 
            width: 100%;
            max-width: 300px;
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px;
            font-size: 16px;
            font-weight: 700;
          }
          .tax { color: #f59e0b; }
          
          .total-section {
            width: 100%;
            text-align: center;
            margin-top: 30px;
            padding-top: 30px;
          }
          
          .total-label { font-size: 14px; font-weight: 700; color: #999; margin: 0; }
          .total-value { font-size: 48px; font-weight: 900; color: #b08d57; margin: 5px 0; }

          .footer { text-align: center; padding-top: 20px; }
          .footer p { margin: 5px 0; font-size: 12px; color: #666; }

          .page-break { page-break-after: always; }
          
          @media print {
            body { background: white; }
            .invoice-page { 
              margin: 0; 
              box-shadow: none; 
              border-radius: 0; 
              width: 100%;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          setTimeout(() => {
            window.print();
            window.onafterprint = function() { window.close(); }
          }, 500);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleComplete = async (method: 'cash' | 'card' | 'online') => {
    if (!selectedForPayment || !onFinalizePayment) return;
    await onFinalizePayment(selectedForPayment.id, method);
    setSelectedForPayment(null);
  };

  const addToManualCart = (p: MenuItem) => {
    setManualCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const removeFromManualCart = (id: string) => {
    setManualCart(prev => prev.filter(i => i.id !== id));
  };

  const createManualTransaction = async () => {
    if (manualCart.length === 0 || !settings) return;

    const subtotal = manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const tax = subtotal * (settings.taxRate / 100);

    const newTrans: Transaction = {
      id: "MAN-" + Date.now(),
      date: new Date().toISOString(),
      items: [...manualCart],
      total: subtotal + tax,
      status: 'waiting_payment',
      paymentMethod: 'cash',
      isManual: true
    };

    await firestoreService.addTransaction(newTrans);
    setManualCart([]);
    setIsManualModalOpen(false);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 bg-[#fcfaf7]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">منصة المحاسبة والفواتير</h1>
          <p className="text-gray-500">متابعة الفواتير المعلقة وإتمام عمليات الدفع</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="bg-coffee-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gold-600 transition-all shadow-xl shadow-gold-900/10"
          >
            <Plus size={20} />
            طلب يدوي طارئ
          </button>

          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gold-100 ring-4 ring-gold-50">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'pending' ? 'bg-coffee-900 text-white shadow-lg' : 'text-coffee-900 hover:bg-gold-50'}`}
            >
              بانتظار الدفع
              {transactions.filter(t => t.status === 'waiting_payment').length > 0 && (
                <span className="mr-2 bg-red-500 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                  {transactions.filter(t => t.status === 'waiting_payment').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'all' ? 'bg-coffee-900 text-white shadow-lg' : 'text-coffee-900 hover:bg-gold-50'}`}
            >
              سجل العمليات
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8 relative max-w-md">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="بحث عن فاتورة أو منتج..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-gold-200 outline-none focus:ring-2 focus:ring-gold-500 transition-all font-bold placeholder-gray-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {filteredTransactions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 bg-white/50 rounded-[3rem] border-2 border-dashed border-gold-100">
            <FileText size={64} className="mb-4 opacity-20" />
            <p className="font-bold">لا توجد عمليات {activeTab === 'pending' ? 'معلقة حالياً' : 'في السجل'}</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className={`bg-white p-6 rounded-[2.5rem] shadow-xl border transition-all group relative overflow-hidden flex flex-col h-full ${transaction.isManual ? 'ring-2 ring-red-100 border-red-100' : 'border-gold-100'}`}>

              {transaction.isManual && (
                <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-br-xl uppercase tracking-tighter">
                  Manual / طارئ
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold transition-all transform group-hover:rotate-6 ${transaction.isManual ? 'bg-red-50 text-red-600' : 'bg-gold-50 text-gold-600 group-hover:bg-gold-500 group-hover:text-white'}`}>
                  <span className="text-[10px] opacity-70">رقم</span>
                  <span className="text-lg">#{transaction.id.slice(-4)}</span>
                </div>
                {transaction.status === 'waiting_payment' ? (
                  <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
                    <Clock size={14} /> بانتظار الدفع
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold">
                    <CheckCircle size={14} /> {transaction.status === 'completed' ? 'مكتمل' : 'مسترجع'}
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar size={14} className="text-gold-500" />
                    {new Date(transaction.date).toLocaleDateString('ar-EG')}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Clock size={14} className="text-gold-500" />
                    {new Date(transaction.date).toLocaleTimeString('ar-EG')}
                  </div>
                </div>

                <div className={`p-4 rounded-3xl border border-gray-100 space-y-2 ${transaction.isManual ? 'bg-red-50/20' : 'bg-gray-50/50'}`}>
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-coffee-900 font-bold">{item.name} x{item.quantity}</span>
                      <span className="text-gray-400">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                  <span className="text-gray-500 text-sm">المجموع النهائي</span>
                  <span className={`font-extrabold text-2xl ${transaction.isManual ? 'text-red-600' : 'text-coffee-900'}`}>{transaction.total.toFixed(2)} {CURRENCY}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {transaction.status === 'waiting_payment' && canFinalize ? (
                  <button
                    onClick={() => setSelectedForPayment(transaction)}
                    className={`flex-1 py-4 rounded-2xl text-white text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-3 ${transaction.isManual ? 'bg-red-600 hover:bg-red-700' : 'bg-coffee-900 hover:bg-gold-600'}`}
                  >
                    <CreditCard size={20} /> إتمام المحاسبة
                  </button>
                ) : (
                  <>
                    <button className="flex-1 py-3 rounded-2xl bg-gray-50 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors">
                      التفاصيل
                    </button>
                    <button
                      onClick={() => handlePrint(transaction)}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl bg-coffee-900 text-white hover:bg-gold-600 transition-colors shadow-lg"
                    >
                      <Printer size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Order Emergency Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 bg-red-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">إنشاء طلب يدوي طارئ</h2>
                  <p className="text-white/70 text-sm">يتم استخدام هذه الواجهة في حال وجود خلل في حساب المبيعات فقط</p>
                </div>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="text-white/60 hover:text-white p-2">إغلاق</button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Products list for manual selection */}
              <div className="flex-[2] p-8 overflow-y-auto bg-gray-50">
                <div className="grid grid-cols-3 gap-4">
                  {products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToManualCart(p)}
                      className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-red-400 hover:shadow-lg transition-all text-right flex flex-col gap-2 group"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">☕</div>
                      <h4 className="font-bold text-coffee-900">{p.name}</h4>
                      <span className="text-red-600 font-bold text-sm">{p.price} {CURRENCY}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Cart */}
              <div className="w-[380px] border-r border-gray-100 flex flex-col bg-white">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-gray-400" />
                  <span className="font-bold text-coffee-900">سلة الطوارئ</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {manualCart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                      <Coffee size={48} opacity={0.3} />
                      <p>السلة فارغة</p>
                    </div>
                  ) : (
                    manualCart.map(i => (
                      <div key={i.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <div>
                          <p className="font-bold text-sm text-coffee-900">{i.name}</p>
                          <p className="text-xs text-gray-500">{i.quantity} × {i.price}</p>
                        </div>
                        <button onClick={() => removeFromManualCart(i.id)} className="text-red-400 hover:text-red-600 p-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 font-bold">الإجمالي</span>
                    <span className="text-3xl font-black text-red-600">
                      {(manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (1 + (settings?.taxRate || 0) / 100)).toFixed(2)} {CURRENCY}
                    </span>
                  </div>
                  <button
                    onClick={createManualTransaction}
                    disabled={manualCart.length === 0}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    إصدار الفاتورة فوراً
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Selection Modal for Cashier */}
      {selectedForPayment && (
        <div className="fixed inset-0 z-[120] bg-coffee-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className={`p-8 border-b border-gray-100 flex justify-between items-center ${selectedForPayment.isManual ? 'bg-red-50' : 'bg-gold-50'}`}>
              <div>
                <h2 className={`text-2xl font-bold ${selectedForPayment.isManual ? 'text-red-600' : 'text-coffee-900'}`}>
                  {selectedForPayment.isManual ? 'تحصيل طلب يدوي' : 'تحصيل الفاتورة'}
                </h2>
                <p className="text-gray-500 text-sm">فاتورة رقم #{selectedForPayment.id.slice(-4)}</p>
              </div>
              <button onClick={() => setSelectedForPayment(null)} className="p-3 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm transition-all">
                <AlertCircle size={24} />
              </button>
            </div>
            <div className="p-10 text-center">
              <span className="text-gray-400 block text-sm mb-2 font-bold uppercase tracking-widest">إجمالي المبلغ المطلوب</span>
              <span className={`text-5xl font-black mb-10 block ${selectedForPayment.isManual ? 'text-red-600' : 'text-coffee-900'}`}>
                {selectedForPayment.total.toFixed(2)} {CURRENCY}
              </span>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleComplete('cash')}
                  className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-green-50 border-2 border-green-100 text-green-700 hover:bg-green-600 hover:text-white hover:border-transparent transition-all group"
                >
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-green-600 group-hover:bg-white/20 group-hover:text-white transition-all">
                    <Banknote size={32} />
                  </div>
                  <span className="font-bold text-sm">نقد</span>
                </button>
                <button
                  onClick={() => handleComplete('card')}
                  className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-blue-50 border-2 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all group"
                >
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:bg-white/20 group-hover:text-white transition-all">
                    <CreditCard size={32} />
                  </div>
                  <span className="font-bold text-sm">بطاقة</span>
                </button>
                <button
                  onClick={() => handleComplete('online')}
                  className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-purple-50 border-2 border-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white hover:border-transparent transition-all group"
                >
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-purple-600 group-hover:bg-white/20 group-hover:text-white transition-all">
                    <Wifi size={32} />
                  </div>
                  <span className="font-bold text-sm">إلكتروني</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesView;
