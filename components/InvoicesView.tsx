
import React, { useState } from 'react';
import { Transaction, MenuItem, AppSettings, CartItem } from '../types';
import {
    FileText, Calendar, Clock, Printer, CreditCard, Banknote,
    Wifi, CheckCircle, Search, AlertCircle, Plus, Minus,
    Trash2, ShoppingCart, Coffee, Eye, X, Receipt,
    ChevronLeft, ListFilter, History
} from 'lucide-react';
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
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [manualCart, setManualCart] = useState<CartItem[]>([]);

    const filteredTransactions = transactions.filter(t => {
        // Tab filter
        if (activeTab === 'pending' && t.status !== 'waiting_payment') return false;
        if (activeTab === 'all' && !['completed', 'refunded'].includes(t.status)) return false;

        // Search filter
        const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (t.tableNumber && t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSearch;
    });

const completedTransactions = transactions.filter(t => ['completed', 'refunded'].includes(t.status));

    const handlePrint = (transaction: Transaction) => {
        // ═══ ITEMS PER PAGE: 8 items max for premium large-font design ═══
        const ITEMS_PER_PAGE = 8;
        const totalPages = Math.ceil(transaction.items.length / ITEMS_PER_PAGE);

        const grandSubtotal = transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const grandTaxAmount = grandSubtotal * ((settings?.taxRate || 11) / 100);
        const grandTotalAmount = grandSubtotal + grandTaxAmount;
        const curr = settings?.currency || CURRENCY;

        const buildPageHTML = (pageItems: typeof transaction.items, pageIndex: number, totalPgs: number): string => {
            const isSubsequent = pageIndex > 0;
            const invLabel = `#${transaction.id.slice(-6)}${isSubsequent ? ` (${pageIndex + 1})` : ''}`;
            const pmtText = transaction.paymentMethod === 'cash' ? 'نقداً' : transaction.paymentMethod === 'card' ? 'بطاقة بنكية' : 'إلكتروني';
            const dateStr = new Date(transaction.date).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const emptyCount = ITEMS_PER_PAGE - pageItems.length;

            const itemRows = pageItems.map((item, idx) => {
                const n = (pageIndex * ITEMS_PER_PAGE) + idx + 1;
                const bg = n % 2 === 0 ? '#f5efe0' : '#ffffff';
                return `<tr style="background:${bg}">
                  <td class="td-idx">${n}</td>
                  <td class="td-name">${item.name}</td>
                  <td class="td-num">${item.price.toFixed(2)}</td>
                  <td class="td-num">${item.quantity}</td>
                  <td class="td-total">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>`;
            }).join('');

            const emptyRows = Array.from({ length: emptyCount }).map((_, i) => {
                const n = (pageIndex * ITEMS_PER_PAGE) + pageItems.length + i + 1;
                const bg = n % 2 === 0 ? '#f5efe0' : '#ffffff';
                return `<tr style="background:${bg}"><td class="td-empty" colspan="5"></td></tr>`;
            }).join('');

            return `<div class="invoice-page">

  <!-- HEADER BANNER -->
  <div class="hdr">
    <div class="hdr-inner">
      <div class="hdr-titles">
        <div class="hdr-store">${settings?.storeName || 'SO CAFE'}</div>
        <div class="hdr-sub">النظام الذهبي - Golden POS</div>
      </div>
      <div class="g-badge">G</div>
    </div>
    <div class="hdr-gold-line"></div>
    <div class="hdr-ornament">
      <div class="orn-line"></div>
      <span class="orn-dia">&#10022;</span>
      <div class="orn-line orn-line-r"></div>
    </div>
  </div>

  ${isSubsequent ? `<div class="cont-bar"><span>&#8227; تكملة الفاتورة &mdash; صفحة ${pageIndex + 1} من ${totalPgs} &bull;</span></div>` : ''}

  <!-- INFO CARDS -->
  <div class="info-sec">
    <div class="ic">
      <div class="ic-lbl">رقم الفاتورة:</div>
      <div class="ic-val">${invLabel}</div>
    </div>
    <div class="ic">
      <div class="ic-lbl">التاريخ:</div>
      <div class="ic-val">${dateStr}</div>
    </div>
    <div class="ic">
      <div class="ic-lbl">طريقة الدفع:</div>
      <div class="ic-val">${pmtText}</div>
    </div>
    ${totalPgs > 1 ? `<div class="ic"><div class="ic-lbl">الصفحة:</div><div class="ic-val">${pageIndex + 1} / ${totalPgs}</div></div>` : ''}
  </div>

  <!-- ITEMS TABLE -->
  <table class="tbl">
    <thead>
      <tr class="tbl-hdr">
        <th class="th th-idx">ت</th>
        <th class="th th-name">اسم المنتج</th>
        <th class="th th-num">السعر</th>
        <th class="th th-num">الكمية</th>
        <th class="th th-total">الإجمالي</th>
      </tr>
    </thead>
    <tbody>${itemRows}${emptyRows}</tbody>
  </table>

  <!-- SUMMARY -->
  <div class="summary-sec">
    <div class="total-badge">
      <span class="tb-val">${grandTotalAmount.toFixed(2)}</span>
      <span class="tb-cur">${curr}</span>
    </div>
    <div class="sum-box">
      <div class="sum-row">
        <span class="sr-lbl">استحتائج</span>
        <span class="sr-val">${grandSubtotal.toFixed(2)}</span>
      </div>
      <div class="sum-div"></div>
      <div class="sum-row">
        <span class="sr-lbl">الضريبة %${settings?.taxRate || 11}</span>
        <span class="sr-val">${grandTaxAmount.toFixed(2)}</span>
      </div>
      <div class="sum-div"></div>
      <div class="sum-row sum-bold">
        <span class="sr-lbl-b">الإجمالي</span>
        <span class="sr-val-b">${grandTotalAmount.toFixed(2)} ${curr}</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="ftr-inner">
      <div class="ftr-center">
        <p class="ftr-thanks">شكراً لثقتكم</p>
        <div class="ftr-orn">
          <div class="fo-line"></div>
          <span class="fo-dia">&#10022;</span>
          <div class="fo-line fo-line-r"></div>
        </div>
      </div>
      <div class="ftr-qr">
        <div class="qr-box"></div>
        <span class="qr-lbl">امسح للتحقق</span>
      </div>
    </div>
  </div>

</div>`;
        };

        let pagesHTML = '';
        for (let p = 0; p < totalPages; p++) {
            const slice = transaction.items.slice(p * ITEMS_PER_PAGE, (p + 1) * ITEMS_PER_PAGE);
            pagesHTML += buildPageHTML(slice, p, totalPages);
            if (p < totalPages - 1) pagesHTML += `<div class="page-break"></div>`;
        }

        const receiptHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>&#1601;&#1575;&#1578;&#1608;&#1585;&#1577; ${settings?.storeName || 'SO CAFE'} &middot; ${transaction.id.slice(-6)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
@page{size:A4 portrait;margin:0;}

body{
  font-family:'Cairo','Arial',sans-serif;
  background:#e4dcd2;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
  color:#3e2723;
}

/* ═════ A4 PAGE ════════════════════════════════════════════ */
.invoice-page{
  width:210mm; height:297mm;
  margin:0 auto 20px;
  background:#fdfaf5;
  display:flex; flex-direction:column;
  overflow:hidden;
}
@media print{
  body{background:#fff;}
  .invoice-page{margin:0;page-break-after:always;break-after:page;}
  .page-break{page-break-after:always;break-after:page;height:0;display:block;}
}

/* ═════ HEADER ══════════════════════════════════════════════
   Dark brown (#3e2723) full-width banner
   Centered large store name, italic gold subtitle
   Gold G badge (italic, gradient) on the left (RTL right)
══════════════════════════════════════════════════════════════ */
.hdr{background:#3e2723;flex-shrink:0;}
.hdr-inner{
  display:flex; align-items:center;
  justify-content:space-between;
  padding:22px 26px 16px;
}
.hdr-titles{display:flex;flex-direction:column;gap:5px;}
.hdr-store{
  font-size:30px; font-weight:900; color:#fff;
  line-height:1; letter-spacing:0.5px;
}
.hdr-sub{
  font-size:13px; font-weight:600;
  color:#c9a84c; font-style:italic;
}

/* Gold G badge */
.g-badge{
  width:70px; height:70px;
  background:linear-gradient(145deg,#ecd06e 0%,#c9a84c 45%,#9e7530 100%);
  color:#3e2723; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  font-size:36px; font-weight:900; font-style:italic;
  box-shadow:0 6px 20px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.18);
  border:2px solid rgba(255,255,255,.12);
  flex-shrink:0;
}

/* Thin gold line */
.hdr-gold-line{
  height:2px; margin:0 22px;
  background:linear-gradient(90deg,transparent,#c9a84c 20%,#ecd06e 50%,#c9a84c 80%,transparent);
}

/* Diamond ornament row */
.hdr-ornament{
  display:flex; align-items:center;
  justify-content:center; padding:5px 0 7px;
}
.orn-line{
  flex:1; height:1px; margin:0 10px;
  background:linear-gradient(90deg,transparent,#c9a84c 80%);
}
.orn-line-r{background:linear-gradient(90deg,#c9a84c 20%,transparent);}
.orn-dia{font-size:13px;color:#c9a84c;line-height:1;}

/* ═════ CONTINUATION BAR ═══════════════════════════════════ */
.cont-bar{
  background:#3e2723; padding:3px 26px;
  font-size:10px; font-weight:800;
  color:#c9a84c; letter-spacing:1px;
  flex-shrink:0;
}

/* ═════ INFO CARDS ══════════════════════════════════════════
   Separate rounded boxes, matching image exactly
══════════════════════════════════════════════════════════════ */
.info-sec{
  display:flex; gap:10px;
  padding:14px 18px 12px;
  flex-shrink:0; background:#fdfaf5;
}
.ic{
  flex:1; background:#fff;
  border:1.5px solid #cba97a;
  border-radius:10px;
  padding:10px 13px;
  display:flex; flex-direction:column; gap:4px;
}
.ic-lbl{font-size:11px;font-weight:700;color:#7a5230;}
.ic-val{font-size:15px;font-weight:900;color:#3e2723;}

/* ═════ TABLE ═══════════════════════════════════════════════
   Coffee-900 dark header, alternating white/warm-cream rows
   Larger padding + font for premium feel
══════════════════════════════════════════════════════════════ */
.tbl{
  width:100%; border-collapse:collapse;
  flex:1; min-height:0; table-layout:fixed;
}
.th-idx  {width:8%;}
.th-name {width:42%;}
.th-num  {width:16%;}
.th-total{width:18%;}

.tbl-hdr{background:#3e2723;}
.th{
  padding:13px 12px; color:#fff;
  font-size:14px; font-weight:800;
  text-align:right; border:none;
}
.th.th-num  {text-align:center;}
.th.th-total{text-align:center; border-radius:12px 0 0 0;}
.th.th-idx  {border-radius:0 12px 0 0;}

.tbl td{
  padding:0 12px; height:50px;
  font-size:14px; vertical-align:middle;
  border-bottom:1.5px solid #ddc9a8;
}
.td-idx  {text-align:center;color:#7a4f26;font-weight:800;font-size:15px;}
.td-name {font-weight:700;color:#3e2723;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.td-num  {text-align:center;color:#4e342e;font-weight:600;}
.td-total{text-align:center;font-weight:900;color:#3e2723;font-size:15px;}
.td-empty{height:50px;border-bottom:1px solid #ecddc4;}

/* ═════ SUMMARY ════════════════════════════════════════════
   Gold pill badge + breakdown boxcard
══════════════════════════════════════════════════════════════ */
.summary-sec{
  flex-shrink:0;
  padding:12px 18px 10px;
  background:#fdfaf5;
}

/* Gold pill badge — matches reference image */
.total-badge{
  display:inline-flex; align-items:center; gap:6px;
  background:linear-gradient(135deg,#ecd06e 0%,#c9a84c 50%,#9e7530 100%);
  color:#3e2723; border-radius:30px;
  padding:7px 20px 7px 14px;
  margin-bottom:10px;
  box-shadow:0 3px 10px rgba(158,117,48,.38);
}
.tb-val{font-size:19px;font-weight:900;color:#3e2723;}
.tb-cur{font-size:11px;font-weight:800;color:#3e2723;margin-top:2px;}

/* Breakdown card */
.sum-box{
  background:#fff; border:1.5px solid #d4b896;
  border-radius:10px; overflow:hidden;
}
.sum-row{
  display:flex; justify-content:space-between;
  align-items:center; padding:9px 15px;
  font-size:13px; font-weight:600; color:#5a3e28;
}
.sum-bold{background:#faf3e0;}
.sum-div{height:1px;background:#d4b896;}
.sr-lbl {color:#5a3e28; font-weight:700;}
.sr-val {color:#3e2723; font-weight:700;}
.sr-lbl-b{color:#3e2723;font-weight:900;font-size:14px;}
.sr-val-b{color:#3e2723;font-weight:900;font-size:14px;}

/* ═════ FOOTER ══════════════════════════════════════════════
   "شكراً لثقتكم" large bold centered + diamond + QR
══════════════════════════════════════════════════════════════ */
.footer{
  flex-shrink:0; margin-top:auto;
  padding:10px 18px 14px; background:#fdfaf5;
}
.ftr-inner{
  display:flex; align-items:center;
  justify-content:space-between;
}
.ftr-center{
  flex:1; display:flex; flex-direction:column;
  align-items:center; gap:6px;
}
.ftr-thanks{
  font-size:24px; font-weight:900;
  color:#3e2723;
}
.ftr-orn{
  display:flex; align-items:center; width:200px;
}
.fo-line{
  flex:1; height:1px; margin:0 8px;
  background:linear-gradient(90deg,transparent,#c9a84c 70%);
}
.fo-line-r{background:linear-gradient(90deg,#c9a84c 30%,transparent);}
.fo-dia{font-size:11px;color:#c9a84c;line-height:1;}

/* QR code */
.ftr-qr{display:flex;flex-direction:column;align-items:center;gap:4px;}
.qr-box{
  width:52px; height:52px;
  border:3px solid #3e2723;
  background:repeating-conic-gradient(#3e2723 0% 25%,#fff 0% 50%) 50%/9px 9px;
}
.qr-lbl{font-size:7px;font-weight:800;color:#7a5230;letter-spacing:.4px;}
</style>
</head>
<body>
  ${pagesHTML}
  <script>
    window.onload=function(){
      setTimeout(function(){
        window.print();
        window.onafterprint=function(){window.close();};
      },950);
    };
  </script>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) { alert('يرجى السماح للنوافذ المنبثقة لتشغيل الطباعة'); return; }
        printWindow.document.open();
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
    };

    const handleComplete = async (method: 'cash' | 'card' | 'online') => {
        if (!selectedForPayment || !onFinalizePayment) return;
        await onFinalizePayment(selectedForPayment.id, method);
        const updated = { ...selectedForPayment, status: 'completed' as const, paymentMethod: method };
        setSelectedForPayment(null);
        handlePrint(updated);
    };

    const addToManualCart = (p: MenuItem) => {
        setManualCart(prev => {
            const existing = prev.find(i => i.id === p.id);
            if (existing) {
                return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...p, quantity: 1 }];
        });
    };

    const removeFromManualCart = (id: string) => {
        setManualCart(prev => prev.filter(i => i.id !== id));
    };

    const createManualTransaction = async () => {
        if (manualCart.length === 0) return;

        const subtotal = manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        const tax = subtotal * ((settings?.taxRate || 11) / 100);

        const newTrans: Transaction = {
            id: `manual-${Date.now()}`,
            date: new Date().toISOString(),
            items: [...manualCart],
            total: subtotal + tax,
            status: 'completed',
            paymentMethod: 'cash',
            isManual: true
        };

        await firestoreService.addTransaction(newTrans);
        setManualCart([]);
        setIsManualModalOpen(false);
        handlePrint(newTrans);
    };

    return (
        <div className="flex-1 p-8 bg-[#fdfaf7] overflow-y-auto no-scrollbar" dir="rtl">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-coffee-900 mb-2">إدارة الفواتير المميزة</h1>
                    <p className="text-gray-500">نظام ذكي للتحصيل والطباعة المتعددة</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Log Button */}
                    <button
                        onClick={() => setIsLogOpen(true)}
                        className="flex items-center gap-2 bg-white text-coffee-900 border-2 border-gold-200 px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-gold-50 transition-all"
                    >
                        <History size={20} className="text-gold-600" />
                        سجل الفواتير
                    </button>

                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-200 transition-all"
                    >
                        <Plus size={20} /> طلب طارئ
                    </button>

                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gold-100">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-coffee-900 text-white shadow-lg' : 'text-coffee-900 hover:bg-gold-50'}`}
                        >
                            <ListFilter size={18} /> العالقة
                            {transactions.filter(t => t.status === 'waiting_payment').length > 0 && (
                                <span className="bg-red-500 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                                    {transactions.filter(t => t.status === 'waiting_payment').length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'all' ? 'bg-coffee-900 text-white shadow-lg' : 'text-coffee-900 hover:bg-gold-50'}`}
                        >
                            الكل
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="بحث عن فاتورة، منتج، أو سعر..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-gold-200 outline-none focus:ring-2 focus:ring-gold-500 transition-all font-bold placeholder-gray-300 shadow-sm"
                />
            </div>

            {/* Transactions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {filteredTransactions.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400 bg-white/50 rounded-[3rem] border-2 border-dashed border-gold-100">
                        <Coffee size={80} className="mb-4 opacity-10" />
                        <p className="font-bold text-xl">لا توجد سجلات مطابقة لهذا البحث</p>
                    </div>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            onClick={() => setViewingTransaction(transaction)}
                            className={`bg-white p-7 rounded-[3rem] shadow-xl border cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden flex flex-col h-full ${transaction.isManual ? 'ring-2 ring-red-100 border-red-100' : 'border-gold-100'}`}
                        >

                            {/* Print Button (External) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(transaction);
                                }}
                                className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-gold-50 text-gold-600 hover:bg-gold-500 hover:text-white transition-all shadow-sm z-10"
                                title="طباعة فورية"
                            >
                                <Printer size={22} />
                            </button>

                            {transaction.isManual && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-tighter">
                                    Manual / يدوي
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-bold transition-all transform group-hover:rotate-3 ${transaction.isManual ? 'bg-red-50 text-red-600' : 'bg-coffee-50 text-coffee-900 group-hover:bg-gold-500 group-hover:text-white'}`}>
                                    <span className="text-[10px] opacity-60 uppercase">Invoice</span>
                                    <span className="text-xl">#{transaction.id.slice(-4)}</span>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    {transaction.status === 'waiting_payment' ? (
                                        <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-2xl text-xs font-black animate-pulse border border-orange-100">
                                            <Clock size={14} /> بانتظار الدفع
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-2xl text-xs font-black border border-green-100">
                                            <CheckCircle size={14} /> {transaction.status === 'completed' ? 'مكتملة' : 'تم الاسترجاع'}
                                        </div>
                                    )}
                                    <div className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded-lg">
                                        {transaction.paymentMethod === 'cash' ? 'نقدي' : transaction.paymentMethod === 'card' ? 'بطاقة' : 'إلكتروني'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 text-gray-500 text-sm font-bold">
                                        <Calendar size={16} className="text-gold-500" />
                                        {new Date(transaction.date).toLocaleDateString('ar-EG')}
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500 text-sm font-bold">
                                        <Clock size={16} className="text-gold-500" />
                                        {new Date(transaction.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-[2rem] p-5 space-y-3 border border-gray-100">
                                    {transaction.items.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="text-coffee-900 font-black flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-gold-400 rounded-full"></div>
                                                {item.name}
                                                <span className="text-gray-400 text-xs font-bold">x{item.quantity}</span>
                                            </span>
                                            <span className="text-gray-500 font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {transaction.items.length > 2 && (
                                        <div className="text-[10px] text-center text-gold-600 font-black uppercase tracking-widest pt-1 border-t border-dashed border-gold-200">
                                            + {transaction.items.length - 2} عناصر إضافية
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between pt-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">الإجمالي الكلي</span>
                                        <span className={`font-black text-3xl leading-none ${transaction.isManual ? 'text-red-600' : 'text-coffee-900'}`}>
                                            {transaction.total.toFixed(2)}
                                            <span className="text-xs mr-1 opacity-50">{settings?.currency || CURRENCY}</span>
                                        </span>
                                    </div>
                                    <div className="bg-gold-50 p-2 rounded-xl text-gold-600 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <Eye size={20} />
                                    </div>
                                </div>
                            </div>

                            {transaction.status === 'waiting_payment' && canFinalize && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedForPayment(transaction);
                                    }}
                                    className={`mt-6 w-full py-5 rounded-[1.5rem] text-white text-md font-black transition-all shadow-xl flex items-center justify-center gap-3 ${transaction.isManual ? 'bg-red-600 hover:bg-red-700' : 'bg-coffee-900 hover:bg-gold-600'}`}
                                >
                                    <CreditCard size={20} /> تحصيل الفاتورة
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Order Details Modal */}
            {viewingTransaction && (
                <div className="fixed inset-0 z-[200] bg-coffee-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-8 bg-coffee-900 text-white flex justify-between items-center relative">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm">
                                    <Receipt size={32} className="text-gold-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">تفاصيل العملية #{viewingTransaction.id.slice(-6)}</h2>
                                    <p className="text-gold-400/60 text-sm font-bold uppercase tracking-widest">Transaction Intelligence Report</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingTransaction(null)}
                                className="bg-white/10 hover:bg-red-500 hover:text-white p-3 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                                    <span className="text-gray-400 text-[10px] font-black block mb-2 uppercase">الحالة الرقمية</span>
                                    <span className={`font-black text-sm ${viewingTransaction.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {viewingTransaction.status === 'completed' ? 'مكتملة' : 'قيد الانتظار'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                                    <span className="text-gray-400 text-[10px] font-black block mb-2 uppercase">طريقة الدفع</span>
                                    <span className="font-black text-sm text-coffee-900">
                                        {viewingTransaction.paymentMethod === 'cash' ? 'نقداً' : viewingTransaction.paymentMethod === 'card' ? 'بطاقة' : 'إلكتروني'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                                    <span className="text-gray-400 text-[10px] font-black block mb-2 uppercase">نوع الطلب</span>
                                    <span className="font-black text-sm text-coffee-900">
                                        {viewingTransaction.isManual ? 'يدوي' : 'نظامي'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-6 bg-gold-400 rounded-full"></div>
                                    <h3 className="font-black text-coffee-900 text-lg">قائمة المشتريات</h3>
                                </div>
                                <div className="border border-gray-100 rounded-[2.5rem] overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">المنتج</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">الكمية</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-left">المجموع</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {viewingTransaction.items.map((item, i) => (
                                                <tr key={i} className="hover:bg-gold-50/10 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-coffee-900">{item.name}</td>
                                                    <td className="px-6 py-4 font-black text-gold-600">x{item.quantity}</td>
                                                    <td className="px-6 py-4 font-black text-coffee-900 text-left">{(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center text-2xl font-black">
                                    <span className="text-coffee-900">إجمالي القيمة</span>
                                    <span className="text-gold-600">{viewingTransaction.total.toFixed(2)} {settings?.currency || CURRENCY}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 flex gap-4">
                            <button
                                onClick={() => handlePrint(viewingTransaction)}
                                className="flex-1 bg-coffee-900 text-white font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-gold-600 transition-all shadow-xl shadow-coffee-900/10"
                            >
                                <Printer size={20} /> طباعة الفاتورة الفورية
                            </button>
                            <button
                                onClick={() => setViewingTransaction(null)}
                                className="flex-1 bg-white text-gray-400 font-black py-4 rounded-[1.5rem] border-2 border-gray-100 hover:text-coffee-900 transition-all"
                            >
                                إغلاق المعاينة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoices Log Modal */}
            {isLogOpen && (
                <div className="fixed inset-0 z-[250] bg-coffee-900/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#fdfaf7] w-full max-w-5xl h-[90vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-10 border-b border-gold-200 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-gold-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-gold-500/20">
                                    <History size={40} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-coffee-900 mb-1">سجل الفواتير المؤرشفة</h2>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">ARCHIVED FINANCIAL INTELLIGENCE</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsLogOpen(false)}
                                className="w-14 h-14 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"
                            >
                                <X size={32} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                            {completedTransactions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-30">
                                    <FileText size={120} />
                                    <p className="text-2xl font-black mt-4 uppercase">No History Found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {completedTransactions.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => { setViewingTransaction(t); setIsLogOpen(false); }}
                                            className="bg-white p-6 rounded-[2.5rem] border border-gold-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-gold-50 rounded-2xl flex flex-col items-center justify-center font-black text-gold-600 group-hover:bg-coffee-900 group-hover:text-white transition-all">
                                                    <span className="text-[10px] opacity-60">ID</span>
                                                    <span>#{t.id.slice(-4)}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-coffee-900 text-lg uppercase tracking-tighter">Order Processing Complete</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.date).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(t.date).toLocaleTimeString()}</span>
                                                        <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[8px]">{t.paymentMethod}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Final Amount</p>
                                                    <p className="text-2xl font-black text-coffee-900">{t.total.toFixed(2)} {settings?.currency || CURRENCY}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePrint(t); }}
                                                    className="w-14 h-14 bg-gold-100 text-gold-700 rounded-3xl flex items-center justify-center hover:bg-coffee-900 hover:text-white transition-all"
                                                >
                                                    <Printer size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-white border-t border-gold-100 flex justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                            Golden POS Intelligence System - Secure Financial Log
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="flex-[2] p-8 overflow-y-auto bg-gray-50 no-scrollbar">
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
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
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
