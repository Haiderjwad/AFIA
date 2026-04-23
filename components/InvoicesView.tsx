import React, { useState } from 'react';
import StatusModal from './StatusModal';
import { soundService } from '../services/soundService';
import { Transaction, MenuItem, AppSettings, CartItem } from '../types';
import {
    FileText, Calendar, Clock, Printer, CreditCard, Banknote,
    Wifi, CheckCircle, Search, AlertCircle, Plus, Minus,
    Trash2, ShoppingCart, Coffee, Eye, X, Receipt,
    ChevronLeft, ListFilter, History, Check, UtensilsCrossed, PackageCheck
} from 'lucide-react';
import { CURRENCY } from '../constants';
import { firestoreService } from '../services/firestoreService';
import { formatCurrency } from '../utils/currencyUtils';

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
    const [autoPrint, setAutoPrint] = useState(false);
    const [paymentStep, setPaymentStep] = useState<1 | 2>(1);
    const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'online' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'loading', title: string, message: string }>({
        isOpen: false,
        type: 'loading',
        title: '',
        message: ''
    });

    const filteredTransactions = transactions.filter(t => {
        // Tab filter
        // Tab filter: Pending shows all active orders that are NOT yet paid
        if (activeTab === 'pending' && (['completed', 'refunded'].includes(t.status) || t.isPaid)) return false;

        // All tab shows historical (completed/refunded/paid)
        if (activeTab === 'all' && !(['completed', 'refunded'].includes(t.status) || t.isPaid)) return false;

        // Search filter
        const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (t.tableNumber && t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSearch;
    });

    const completedTransactions = transactions.filter(t => ['completed', 'refunded'].includes(t.status) || t.isPaid);

    const handlePrint = async (transaction: Transaction) => {
        setIsProcessing(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري تجهيز الفاتورة',
            message: 'نحن نقوم الآن بتحضير بيانات الفاتورة وتنسيقها للطباعة، يرجى الانتظار...'
        });

        // Aesthetic delay for professional feel
        await new Promise(resolve => setTimeout(resolve, 1200));

        const curr = settings?.currency || CURRENCY;
        const receiptType = settings?.receiptType || 'a4';
        const storeName = settings?.storeName || 'سوفتي كود';
        const taxRate = settings?.taxRate || 11;

        const grandSubtotal = transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const grandTaxAmount = grandSubtotal * (taxRate / 100);
        const grandTotalAmount = grandSubtotal + grandTaxAmount;
        const pmtText = transaction.paymentMethod === 'cash' ? 'نقداً' : transaction.paymentMethod === 'card' ? 'بطاقة بنكية' : 'إلكتروني';
        const dateStr = new Date(transaction.date).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeStr = new Date(transaction.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        // ════════════════════════════════════════════════════════════════════════
        // 1. THERMAL RECEIPT LAYOUT (High Fidelity 80mm)
        // ════════════════════════════════════════════════════════════════════════
        const buildThermalHTML = (): string => {
            const itemRows = transaction.items.map((item) => `
                    <div class="t-row">
                        <div class="t-col-name">${item.name}</div>
                        <div class="t-col-qty">x${item.quantity}</div>
                        <div class="t-col-total">${formatCurrency(item.price * item.quantity, curr)}</div>
                    </div>
                `).join('');

            return `
                <div class="thermal-receipt">
                    <div class="t-header">
                        <img src="${settings?.storeLogo || '/branding/afia_logo.png'}" class="t-logo" />
                        <h1 class="t-store-name">${storeName}</h1>
                        <div class="t-badge">وصل مبيعات رقم #${transaction.id.slice(-6)}</div>
                        <div class="t-date-time">${dateStr} &nbsp; | &nbsp; ${timeStr}</div>
                    </div>

                    <div class="t-meta">
                        <div class="t-meta-row"><span>طريقة الدفع:</span> <strong>${pmtText}</strong></div>
                        ${transaction.tableNumber ? `<div class="t-meta-row"><span>رقم الطاولة:</span> <strong>${transaction.tableNumber}</strong></div>` : ''}
                        <div class="t-meta-row"><span>الموظف:</span> <span>${transaction.salesPerson || 'نظام سوفتي كود'}</span></div>
                    </div>

                    <div class="t-divider"></div>
                    <div class="t-items">
                        <div class="t-items-head">
                            <span style="flex:2">الصنف</span>
                            <span style="flex:0.5; text-align:center">كمية</span>
                            <span style="flex:1; text-align:left">المجموع</span>
                        </div>
                        <div class="t-items-list">${itemRows}</div>
                    </div>
                    <div class="t-divider"></div>

                    <div class="t-summary">
                        <div class="t-sum-row"><span>المجموع:</span> <span>${formatCurrency(grandSubtotal, curr)}</span></div>
                        <div class="t-sum-row"><span>الضريبة (%${taxRate}):</span> <span>${formatCurrency(grandTaxAmount, curr)}</span></div>
                        <div class="t-sum-row t-grand-total">
                           <span>الإجمالي النهائي</span>
                           <span>${formatCurrency(grandTotalAmount, curr)}</span>
                        </div>
                    </div>

                    <div class="t-footer">
                        <svg class="t-barcode" viewBox="0 0 100 20">
                            <rect x="0" y="0" width="2" height="20" fill="black" />
                            <rect x="5" y="0" width="1" height="20" fill="black" />
                            <rect x="8" y="0" width="3" height="20" fill="black" />
                            <rect x="15" y="0" width="2" height="20" fill="black" />
                            <rect x="20" y="0" width="1" height="20" fill="black" />
                            <rect x="25" y="0" width="4" height="20" fill="black" />
                            <rect x="35" y="0" width="1" height="20" fill="black" />
                            <rect x="40" y="0" width="2" height="20" fill="black" />
                            <rect x="45" y="0" width="3" height="20" fill="black" />
                            <rect x="55" y="0" width="2" height="20" fill="black" />
                            <rect x="62" y="0" width="1" height="20" fill="black" />
                            <rect x="68" y="0" width="3" height="20" fill="black" />
                            <rect x="75" y="0" width="4" height="20" fill="black" />
                            <rect x="85" y="0" width="1" height="20" fill="black" />
                            <rect x="92" y="0" width="3" height="20" fill="black" />
                            <rect x="98" y="0" width="2" height="20" fill="black" />
                        </svg>
                        <p class="t-thanks text-bold">نسعد دائماً بخدمتكم</p>
                        <p class="t-sys-info">Powered by <strong>SoftyCode POS</strong></p>
                        <p class="t-web">www.softycode.com</p>
                    </div>
                </div>
            `;
        };

        // ════════════════════════════════════════════════════════════════════════
        // 2. A4 PROFESSIONAL INVOICE LAYOUT — REBUILT
        // ════════════════════════════════════════════════════════════════════════
        const ITEMS_PER_PAGE_A4 = 10;
        const totalPagesA4 = Math.ceil(transaction.items.length / ITEMS_PER_PAGE_A4);

        const buildA4PageHTML = (pageItems: typeof transaction.items, pageIndex: number, totalPgs: number): string => {
            const isSubsequent = pageIndex > 0;
            const invLabel = `INV-${transaction.id.slice(-8).toUpperCase()}${isSubsequent ? `-P${pageIndex + 1}` : ''}`;
            const emptyCount = ITEMS_PER_PAGE_A4 - pageItems.length;

            const itemRows = pageItems.map((item, idx) => {
                const n = (pageIndex * ITEMS_PER_PAGE_A4) + idx + 1;
                const bg = n % 2 === 0 ? '#f0f7f4' : '#ffffff';
                return `<tr style="background:${bg}">
                  <td style="text-align:center;color:#f8961e;font-weight:900;width:40px">${n}</td>
                  <td style="text-align:right;font-weight:700;color:#1b4332">${item.name}</td>
                  <td style="text-align:center;color:#555">${formatCurrency(item.price, curr)}</td>
                  <td style="text-align:center;font-weight:800;color:#2d6a4f">${item.quantity}</td>
                  <td style="text-align:center;font-weight:900;color:#1b4332">${formatCurrency(item.price * item.quantity, curr)}</td>
                </tr>`;
            }).join('');

            const emptyRows = Array.from({ length: emptyCount }).map((_, i) => {
                const n = (pageIndex * ITEMS_PER_PAGE_A4) + pageItems.length + i + 1;
                const bg = n % 2 === 0 ? '#f0f7f4' : '#ffffff';
                return `<tr style="background:${bg};height:28px"><td colspan="5"></td></tr>`;
            }).join('');

            return `<div class="a4-page">

  <!-- ░░ WATERMARK ░░ -->
  <div class="a4-wm"><img src="/branding/afia_logo.png"/></div>

  <!-- ░░ HEADER ░░ -->
  <div class="a4-hdr">
    <div class="a4-hdr-left">
      <img src="${settings?.storeLogo || '/branding/afia_logo.png'}" class="a4-logo" />
      <div>
        <div class="a4-biz-name">${storeName}</div>
        <div class="a4-biz-sub">سوفتي كود للحلول الرقمية &nbsp;|&nbsp; SoftyCode Digital Solutions</div>
      </div>
    </div>
    <div class="a4-hdr-right">
      <div class="a4-inv-badge">فاتورة ضريبية رسمية</div>
      <div class="a4-inv-id">${invLabel}</div>
      <div class="a4-inv-date">${dateStr}</div>
    </div>
  </div>

  <!-- ░░ META BAR ░░ -->
  <div class="a4-meta">
    <div class="a4-meta-cell">
      <span class="a4-meta-k">التاريخ</span>
      <span class="a4-meta-v">${dateStr}</span>
    </div>
    <div class="a4-meta-sep"></div>
    <div class="a4-meta-cell">
      <span class="a4-meta-k">الوقت</span>
      <span class="a4-meta-v">${timeStr}</span>
    </div>
    <div class="a4-meta-sep"></div>
    <div class="a4-meta-cell">
      <span class="a4-meta-k">طريقة الدفع</span>
      <span class="a4-meta-v">${pmtText}</span>
    </div>
    <div class="a4-meta-sep"></div>
    <div class="a4-meta-cell">
      <span class="a4-meta-k">الطاولة / الموقع</span>
      <span class="a4-meta-v">${transaction.tableNumber || 'سفري / Takeaway'}</span>
    </div>
    <div class="a4-meta-sep"></div>
    <div class="a4-meta-cell">
      <span class="a4-meta-k">الموظف</span>
      <span class="a4-meta-v">${transaction.salesPerson || 'سوفتي كود'}</span>
    </div>
  </div>

  <!-- ░░ TABLE SECTION LABEL ░░ -->
  <div class="a4-tbl-label">
    <span class="a4-tbl-label-bar"></span>
    تفاصيل المشتريات
  </div>

  <!-- ░░ ITEMS TABLE ░░ -->
  <table class="a4-tbl">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th style="text-align:right">اسم الصنف / المنتج</th>
        <th style="width:110px">سعر الوحدة</th>
        <th style="width:70px">الكمية</th>
        <th style="width:120px">الإجمالي</th>
      </tr>
    </thead>
    <tbody>${itemRows}${emptyRows}</tbody>
  </table>

  <!-- ░░ BOTTOM SECTION ░░ -->
  <div class="a4-bottom">

    <!-- Signature + notes -->
    <div class="a4-bottom-left">
      <div class="a4-note-box">
        <div class="a4-note-title">ملاحظات:</div>
        <div class="a4-note-lines">
          <div class="a4-note-line"></div>
          <div class="a4-note-line"></div>
          <div class="a4-note-line"></div>
        </div>
      </div>
      <div class="a4-sig-area">
        <div class="a4-sig-line"></div>
        <div class="a4-sig-label">توقيع المستلم</div>
      </div>
    </div>

    <!-- Financial summary -->
    <div class="a4-summary">
      <div class="a4-sum-row">
        <span>المجموع الفرعي (قبل الضريبة)</span>
        <span>${formatCurrency(grandSubtotal, curr)}</span>
      </div>
      <div class="a4-sum-row">
        <span>الضريبة (%${taxRate})</span>
        <span>${formatCurrency(grandTaxAmount, curr)}</span>
      </div>
      <div class="a4-sum-divider"></div>
      <div class="a4-sum-total-row">
        <span>الإجمالي النهائي</span>
        <span>${formatCurrency(grandTotalAmount, curr)}</span>
      </div>
      <div class="a4-sum-words">فقط: ${formatCurrency(grandTotalAmount, curr)} لا غير</div>
    </div>

  </div>

  <!-- ░░ FOOTER ░░ -->
  <div class="a4-footer">
    <div class="a4-footer-bar"></div>
    <div class="a4-footer-content">
      <span>نظام سوفتي كود للمطاعم &middot; SoftyCode POS &middot; www.softycode.com</span>
      <span>صفحة ${pageIndex + 1} من ${totalPgs} &nbsp;&mdash;&nbsp; تم الإصدار إلكترونياً</span>
    </div>
  </div>

</div>`;
        };

        // ════════════════════════════════════════════════════════════════════════
        // 3. LUXURY BRANDED INVOICE LAYOUT
        // ════════════════════════════════════════════════════════════════════════
        const brandColor = settings?.brandColor || '#2d6a4f';
        const buildCustomPageHTML = (pageItems: typeof transaction.items, pageIndex: number, totalPgs: number): string => {
            const invLabel = `#${transaction.id.slice(-6)}${pageIndex > 0 ? ` (${pageIndex + 1})` : ''}`;
            const itemRows = pageItems.map((item, idx) => {
                const n = (pageIndex * ITEMS_PER_PAGE_A4) + idx + 1;
                return `<tr>
                  <td class="c-idx">${n}</td>
                  <td class="c-name">
                    <strong>${item.name}</strong>
                    <small>أصل مالي رقم #${item.id.slice(-4)}</small>
                  </td>
                  <td class="c-price">${formatCurrency(item.price, curr)}</td>
                  <td class="c-qty">${item.quantity}</td>
                  <td class="c-total">${formatCurrency(item.price * item.quantity, curr)}</td>
                </tr>`;
            }).join('');

            return `<div class="luxury-invoice">
                <div class="l-accent-bar" style="background:${brandColor}"></div>
                
                <div class="l-header">
                    <div class="l-brand-info">
                        <img src="${settings?.storeLogo || '/branding/afia_logo.png'}" class="l-logo" />
                        <h1 style="color:${brandColor}">${storeName}</h1>
                        <p>فاتورة مبيعات فخمة - Luxury Sales Record</p>
                    </div>
                    <div class="l-invoice-meta">
                        <div class="l-id-box" style="background:${brandColor}10; border-right: 5px solid ${brandColor}">
                            <span class="l-id-lbl">رقم القيد</span>
                            <span class="l-id-val" style="color:${brandColor}">${invLabel}</span>
                        </div>
                        <div class="l-date-box">
                            <span>${dateStr}</span>
                            <span>${timeStr}</span>
                        </div>
                    </div>
                </div>

                <div class="l-divider-dashed"></div>

                <div class="l-customer-panel">
                    <div class="l-panel-item"><strong>مكان الطلب:</strong> <span>${transaction.tableNumber || 'توصيل / سفري'}</span></div>
                    <div class="l-panel-item"><strong>الموظف:</strong> <span>${transaction.salesPerson || 'نظام سوفتي كود'}</span></div>
                    <div class="l-panel-item"><strong>طريقة السداد:</strong> <span>${pmtText}</span></div>
                    <div class="l-panel-item"><strong>حالة القيد:</strong> <span style="color:${brandColor}">مكتمل ومرحل</span></div>
                </div>

                <div class="l-items-section">
                    <table class="l-table">
                        <thead style="background:${brandColor}">
                            <tr>
                                <th>ت</th>
                                <th style="text-align:right">وصف الصنف</th>
                                <th>سعر الوحدة</th>
                                <th>الكمية</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                    </table>
                </div>

                <div class="l-bottom-area">
                    <div class="l-notes">
                        <h4>ملاحظات هامة:</h4>
                        <p>يرجى الاحتفاظ بهذه الفاتورة في حال الرغبة في الاستبدال أو الاسترجاع خلال المدة المحددة من قبل إدارة الموقع.</p>
                    </div>
                    <div class="l-summary-luxury" style="border-top: 2px solid ${brandColor}">
                        <div class="l-sum-row"><span>المجموع الفرعي</span> <span>${formatCurrency(grandSubtotal, curr)}</span></div>
                        <div class="l-sum-row"><span>الضريبة (%${taxRate})</span> <span>${formatCurrency(grandTaxAmount, curr)}</span></div>
                        <div class="l-total-row" style="color:${brandColor}">
                            <span>المبلغ المستحق</span>
                            <span>${formatCurrency(grandTotalAmount, curr)}</span>
                        </div>
                    </div>
                </div>

                <div class="l-footer">
                    <div class="l-footer-inner">
                        <div class="l-qr-sim">
                            <div class="l-qr-sq"></div>
                            <span>التحقق الرقمي</span>
                        </div>
                        <div class="l-thanks-msg">شكراً لكم لاختياركم ${storeName}</div>
                        <div class="l-sys-tag">صفحة ${pageIndex + 1} &middot; سوفتي كود</div>
                    </div>
                </div>
            </div>`;
        };

        let finalPagesHTML = '';
        if (receiptType === 'thermal') {
            finalPagesHTML = buildThermalHTML();
        } else if (receiptType === 'custom') {
            for (let p = 0; p < totalPagesA4; p++) {
                const slice = transaction.items.slice(p * ITEMS_PER_PAGE_A4, (p + 1) * ITEMS_PER_PAGE_A4);
                finalPagesHTML += buildCustomPageHTML(slice, p, totalPagesA4);
                if (p < totalPagesA4 - 1) finalPagesHTML += `<div class="page-break"></div>`;
            }
        } else {
            for (let p = 0; p < totalPagesA4; p++) {
                const slice = transaction.items.slice(p * ITEMS_PER_PAGE_A4, (p + 1) * ITEMS_PER_PAGE_A4);
                finalPagesHTML += buildA4PageHTML(slice, p, totalPagesA4);
                if (p < totalPagesA4 - 1) finalPagesHTML += `<div class="page-break"></div>`;
            }
        }

        const fullHTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>فاتورة ${storeName} &middot; ${transaction.id.slice(-6)}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
            font-family: 'Cairo', sans-serif; 
            background: #f0f0f0; 
            color: #1a1c1e;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
        }

        .page-break { page-break-after: always; }

        /* ════════════════════════════════════════════════
           THERMAL RECEIPT STYLES
           ════════════════════════════════════════════════ */
        .thermal-receipt {
            background: #fff;
            width: 80mm;
            padding: 10mm 5mm;
            margin: 0 auto;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .t-header { text-align: center; margin-bottom: 8mm; }
        .t-logo { max-width: 65px; height: auto; margin-bottom: 4mm; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
        .t-store-name { font-size: 18pt; font-weight: 900; color: #2d6a4f; margin-bottom: 2mm; text-transform: uppercase; }
        .t-badge { background: #f8961e; color: #fff; display: inline-block; padding: 1mm 4mm; border-radius: 4mm; font-size: 8pt; font-weight: 800; margin-bottom: 3mm; }
        .t-date-time { font-size: 8pt; color: #666; font-weight: 600; }

        .t-meta { font-size: 9pt; margin-bottom: 6mm; color: #333; }
        .t-meta-row { display: flex; justify-content: space-between; margin-bottom: 1mm; border-bottom: 0.1mm dashed #eee; padding-bottom: 1mm; }
        
        .t-divider { height: 1.5mm; border-top: 0.5mm solid #333; border-bottom: 0.2mm solid #333; margin: 4mm 0; }
        
        .t-items-head { display: flex; font-weight: 900; font-size: 9pt; color: #2d6a4f; padding-bottom: 2mm; border-bottom: 0.1mm solid #eee; }
        .t-items-list { font-size: 9pt; margin-top: 2mm; }
        .t-row { display: flex; align-items: start; margin-bottom: 2.5mm; line-height: 1.2; }
        .t-col-name { flex: 2; font-weight: 700; }
        .t-col-qty { flex: 0.5; text-align: center; font-weight: 800; }
        .t-col-total { flex: 1; text-align: left; font-weight: 800; }

        .t-summary { margin-top: 6mm; }
        .t-sum-row { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 1.5mm; }
        .t-grand-total { border-top: 0.5mm double #eee; padding-top: 3mm; font-size: 13pt; font-weight: 900; color: #1b4332; }

        .t-footer { text-align: center; margin-top: 10mm; }
        .t-barcode { width: 40mm; height: 10mm; margin: 4mm auto; opacity: 0.3; }
        .t-thanks { font-size: 10pt; font-weight: 800; color: #2d6a4f; margin-bottom: 2mm; }
        .t-sys-info { font-size: 7pt; color: #aaa; margin-top: 5mm; }
        .t-web { font-size: 7pt; color: #f8961e; font-weight: 700; }

        /* ════════════════════════════════════════════════
           A4 PROFESSIONAL INVOICE — REBUILT CSS
           ════════════════════════════════════════════════ */

        /* PAGE SHELL */
        .a4-page {
            width: 210mm;
            height: 297mm;
            background: #fff;
            margin: 8mm auto;
            padding: 12mm 14mm;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 0;
            box-shadow: 0 4px 40px rgba(0,0,0,0.15);
            border-top: 8px solid #2d6a4f;
            font-size: 9pt;
            line-height: 1.4;
        }

        /* WATERMARK */
        .a4-wm {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%,-50%) rotate(-25deg);
            width: 130mm;
            opacity: 0.025;
            pointer-events: none;
            z-index: 0;
        }
        .a4-wm img { width: 100%; }

        /* HEADER */
        .a4-hdr {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 6mm;
            border-bottom: 2px solid #2d6a4f;
            margin-bottom: 5mm;
            position: relative;
            z-index: 1;
        }
        .a4-hdr-left { display: flex; align-items: center; gap: 5mm; }
        .a4-logo {
            width: 60px; height: 60px;
            object-fit: contain;
            border-radius: 12px;
            border: 1.5px solid #d8f3dc;
            padding: 3px;
            background: #fff;
        }
        .a4-biz-name { font-size: 18pt; font-weight: 900; color: #1b4332; line-height: 1; }
        .a4-biz-sub { font-size: 7.5pt; color: #888; margin-top: 1.5mm; font-weight: 600; }

        .a4-hdr-right { text-align: left; }
        .a4-inv-badge {
            background: #2d6a4f; color: #fff;
            font-size: 8pt; font-weight: 800;
            padding: 1mm 5mm;
            border-radius: 20px;
            display: inline-block;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
        }
        .a4-inv-id { font-size: 14pt; font-weight: 900; color: #1b4332; direction: ltr; text-align: left; }
        .a4-inv-date { font-size: 8pt; color: #888; font-weight: 600; }

        /* META BAR */
        .a4-meta {
            display: flex;
            align-items: stretch;
            background: #f5f9f7;
            border: 1px solid #d8f3dc;
            border-radius: 5mm;
            margin-bottom: 5mm;
            padding: 3mm 0;
            position: relative;
            z-index: 1;
        }
        .a4-meta-cell { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2mm 3mm; }
        .a4-meta-sep { width: 1px; background: #d8f3dc; margin: 1mm 0; flex-shrink: 0; }
        .a4-meta-k { font-size: 7pt; font-weight: 800; color: #2d6a4f; opacity: 0.6; text-transform: uppercase; margin-bottom: 1mm; }
        .a4-meta-v { font-size: 9pt; font-weight: 800; color: #1b4332; }

        /* TABLE SECTION LABEL */
        .a4-tbl-label {
            display: flex;
            align-items: center;
            gap: 3mm;
            font-size: 9pt;
            font-weight: 900;
            color: #1b4332;
            margin-bottom: 2mm;
            position: relative;
            z-index: 1;
        }
        .a4-tbl-label-bar {
            display: inline-block;
            width: 4px; height: 16px;
            background: #f8961e;
            border-radius: 2px;
        }

        /* ITEMS TABLE */
        .a4-tbl {
            width: 100%;
            border-collapse: collapse;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
        }
        .a4-tbl thead tr {
            background: #1b4332;
        }
        .a4-tbl thead th {
            color: #fff;
            padding: 3mm 4mm;
            font-size: 8.5pt;
            font-weight: 800;
            text-align: center;
            border: none;
        }
        .a4-tbl thead th:nth-child(2) { text-align: right; }
        .a4-tbl tbody td {
            padding: 2.8mm 4mm;
            font-size: 9pt;
            border-bottom: 1px solid #e8f4ee;
            vertical-align: middle;
        }
        .a4-tbl tbody tr:last-child td { border-bottom: 2px solid #2d6a4f; }

        /* BOTTOM AREA */
        .a4-bottom {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 5mm;
            gap: 6mm;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
            flex: 1;
        }

        /* NOTES + SIGNATURE */
        .a4-bottom-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4mm;
        }
        .a4-note-box {
            border: 1px dashed #ccc;
            border-radius: 3mm;
            padding: 3mm 4mm;
        }
        .a4-note-title { font-size: 8pt; font-weight: 800; color: #aaa; margin-bottom: 3mm; }
        .a4-note-line { height: 1px; background: #eee; margin-bottom: 4mm; }

        .a4-sig-area { margin-top: auto; }
        .a4-sig-line {
            width: 70%;
            border-top: 1.5px dashed #bbb;
            margin-bottom: 2mm;
        }
        .a4-sig-label { font-size: 8pt; color: #888; font-weight: 700; }

        /* FINANCIAL SUMMARY BOX */
        .a4-summary {
            width: 80mm;
            background: #1b4332;
            color: #fff;
            border-radius: 5mm;
            padding: 5mm 6mm;
            flex-shrink: 0;
            box-shadow: 0 8px 24px rgba(27,67,50,0.25);
        }
        .a4-sum-row {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            padding: 2mm 0;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            opacity: 0.85;
        }
        .a4-sum-divider {
            height: 1.5px;
            background: rgba(255,255,255,0.25);
            margin: 3mm 0;
        }
        .a4-sum-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14pt;
            font-weight: 900;
            color: #edca76;
            padding: 2mm 0;
        }
        .a4-sum-words {
            font-size: 7.5pt;
            color: rgba(255,255,255,0.4);
            margin-top: 3mm;
            font-style: italic;
            text-align: left;
        }

        /* FOOTER */
        .a4-footer {
            margin-top: auto;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
        }
        .a4-footer-bar {
            height: 3px;
            background: linear-gradient(to left, #2d6a4f 0%, #f8961e 50%, #2d6a4f 100%);
            border-radius: 2px;
            margin-bottom: 3mm;
        }
        .a4-footer-content {
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            color: #888;
            font-weight: 600;
        }

        /* ════════════════════════════════════════════════
           LUXURY/CUSTOM BRANDED STYLES
           ════════════════════════════════════════════════ */
        .luxury-invoice {
            width: 210mm;
            height: 297mm;
            background: #fff;
            padding: 15mm;
            margin: 10mm auto;
            position: relative;
            background: linear-gradient(135deg, #fff, #fdfaf7);
            border: 1px solid #eee;
        }

        .l-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 10px; }
        .l-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12mm; }
        .l-logo { width: 90px; height: auto; margin-bottom: 4mm; }
        .l-brand-info h1 { font-size: 26pt; font-weight: 900; line-height: 1; }
        .l-brand-info p { font-size: 10pt; color: #666; font-weight: 700; margin-top: 1mm; }

        .l-invoice-meta { display: flex; gap: 6mm; }
        .l-id-box { padding: 5mm 8mm; text-align: left; }
        .l-id-lbl { display: block; font-size: 9pt; font-weight: 800; opacity: 0.5; text-transform: uppercase; }
        .l-id-val { font-size: 16pt; font-weight: 900; }
        .l-date-box { display: flex; flex-direction: column; justify-content: center; font-size: 9pt; font-weight: 700; color: #aaa; text-align: right; }

        .l-divider-dashed { height: 1px; border-top: 1px dashed #ddd; margin: 8mm 0; }

        .l-customer-panel { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 5mm; 
            margin-bottom: 12mm; 
            background: white; 
            padding: 8mm; 
            border-radius: 4mm; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.03); 
        }
        .l-panel-item { font-size: 9pt; display: flex; flex-direction: column; gap: 1mm; }
        .l-panel-item strong { color: #aaa; font-weight: 800; font-size: 8pt; text-transform: uppercase; }
        .l-panel-item span { font-weight: 800; color: #333; }

        .l-table { width: 100%; border-collapse: collapse; }
        .l-table thead th { color: #fff; padding: 5mm; font-size: 10pt; text-align: center; }
        .l-table tbody td { padding: 8mm 5mm; border-bottom: 1px solid #f0f0f0; font-size: 11pt; text-align: center; }
        .l-idx { font-family: monospace; font-weight: 900; color: #ccc; }
        .l-name { text-align: right !important; }
        .l-name strong { display: block; font-size: 12pt; color: #1b4332; }
        .l-name small { display: block; font-size: 8pt; color: #aaa; font-weight: 800; margin-top: 1mm; }
        .l-qty, .l-price { font-weight: 800; color: #777; }
        .l-total { font-weight: 900; color: #1b4332; }

        .l-bottom-area { margin-top: 10mm; display: flex; justify-content: space-between; }
        .l-notes { width: 50%; }
        .l-notes h4 { font-size: 10pt; font-weight: 900; margin-bottom: 3mm; color: #aaa; }
        .l-notes p { font-size: 9pt; color: #888; font-weight: 700; line-height: 1.6; }
        
        .l-summary-luxury { width: 40%; padding-top: 5mm; }
        .l-sum-row { display: flex; justify-content: space-between; padding: 2mm 0; font-size: 11pt; font-weight: 800; color: #666; }
        .l-total-row { display: flex; justify-content: space-between; margin-top: 4mm; padding-top: 4mm; font-size: 20pt; font-weight: 900; }

        .l-footer { margin-top: auto; padding-top: 20mm; }
        .l-footer-inner { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 10mm; }
        .l-qr-sim { display: flex; align-items: center; gap: 3mm; }
        .l-qr-sq { width: 12mm; height: 12mm; border: 3px solid #eee; border-radius: 2mm; }
        .l-qr-sim span { font-size: 8pt; font-weight: 800; color: #aaa; text-transform: uppercase; }
        .l-thanks-msg { font-size: 13pt; font-weight: 900; font-style: italic; color: #ddd; }
        .l-sys-tag { font-size: 8pt; font-weight: 800; color: #aaa; }


        @media print {
            body { background: none; }
            .a4-page { margin: 0; box-shadow: none; border-top: 8px solid #2d6a4f !important; }
            .luxury-invoice, .thermal-receipt { margin: 0; box-shadow: none; }
            .luxury-invoice .l-accent-bar { display: block !important; }
            .no-print { display: none; }
            header, footer, nav { display: none !important; }
            @page { size: A4 portrait; margin: 0; }
        }
    </style>
</head>
<body>
    ${finalPagesHTML}
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.onafterprint = function() { window.close(); };
            }, 800);
        };
    </script>
</body>
</html>`;

        try {
            const printWindow = window.open('', '_blank', 'width=900,height=700');
            if (!printWindow) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    title: 'تم حظر النافذة المنبثقة',
                    message: 'يرجى السماح للنوافذ المنبثقة في متصفحك لتتمكن من طباعة الفواتير.'
                });
                return;
            }
            printWindow.document.open();
            printWindow.document.write(fullHTML);
            printWindow.document.close();

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'جاهز للطباعة',
                message: 'تم فتح نافذة الطباعة بنجاح، يمكنك الآن تأكيد العملية.'
            });

            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 2000);

        } catch (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في الطباعة',
                message: 'حدث خطأ غير متوقع أثناء محاولة فتح نافذة الطباعة.'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleComplete = async () => {
        if (!selectedForPayment || !onFinalizePayment || !selectedMethod) return;

        setIsProcessing(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري إتمام الدفع',
            message: 'نحن نقوم الآن بمعالجة العملية المالية، يرجى الانتظار قليلاً...'
        });

        try {
            await onFinalizePayment(selectedForPayment.id, selectedMethod);
            const updated = { ...selectedForPayment, status: 'completed' as const, paymentMethod: selectedMethod };

            setSelectedForPayment(null);
            setPaymentStep(1);
            setSelectedMethod(null);
            soundService.playSuccess();

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم الدفع بنجاح',
                message: 'تمت العملية بنجاح وتم تحديث حالة الفاتورة، شكراً لك.'
            });

            if (autoPrint) {
                handlePrint(updated);
            }

            // Auto-close success modal after 2 seconds
            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 2500);

        } catch (error) {
            console.error("Payment failed:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'فشلت معالجة الدفع',
                message: 'حدث خطأ غير متوقع أثناء محاولة إتمام الدفع. يرجى مراجعة الاتصال وإعادة المحاولة.'
            });
        } finally {
            setIsProcessing(false);
        }
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

        setIsProcessing(true);
        setStatusModal({
            isOpen: true,
            type: 'loading',
            title: 'جاري حفظ القيد اليدوي',
            message: 'يتم الآن تأمين البيانات ومزامنتها مع قاعدة البيانات السحابية...'
        });

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

        try {
            await firestoreService.addTransaction(newTrans);
            setManualCart([]);
            setIsManualModalOpen(false);
            soundService.playSuccess();
            handlePrint(newTrans);

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'تم الحفظ والمزامنة',
                message: 'تم تسجيل الفاتورة اليدوية بنجاح في السجل المالي.'
            });

            setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 2000);
        } catch (error) {
            console.error("Manual transaction failed:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'خطأ في الحفظ',
                message: 'لم نتمكن من حفظ العملية، يرجى المحاولة مرة أخرى.'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="view-container">
            {/* Background Patterns (Subtle) */}
            <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>


            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 transition-all relative z-10">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-brand-dark mb-2">إدارة الفواتير المميزة</h1>
                    <p className="text-brand-dark/40 font-bold text-xs md:text-base">نظام ذكي للتحصيل والطباعة المتعددة</p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 w-full xl:w-auto">
                    <div className="grid grid-cols-2 sm:flex gap-3">
                        {/* Log Button */}
                        <button
                            onClick={() => setIsLogOpen(true)}
                            className="group flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-brand-dark border-2 border-brand-primary/10 px-4 md:px-8 py-3 rounded-2xl font-black shadow-sm hover:border-brand-primary active:scale-95 transition-all text-xs md:text-sm"
                        >
                            <History size={18} className="text-brand-primary group-hover:rotate-[-45deg] transition-transform" />
                            سجل الفواتير
                        </button>

                        <button
                            onClick={() => setIsManualModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-secondary/90 text-white px-4 md:px-8 py-3 rounded-2xl font-black shadow-xl shadow-brand-secondary/20 active:scale-95 transition-all text-xs md:text-sm"
                        >
                            <Plus size={18} /> قيد يدوي
                        </button>
                    </div>

                    <div className="flex bg-white p-1 rounded-3xl shadow-sm border border-brand-primary/10 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 sm:flex-none px-4 md:px-8 py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-xs md:text-sm ${activeTab === 'pending' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-brand-dark/40 hover:bg-brand-light/30'}`}
                        >
                            <ListFilter size={18} /> العالقة
                            {transactions.filter(t => t.status === 'waiting_payment').length > 0 && (
                                <span className="bg-brand-accent px-2 py-0.5 rounded-full text-[10px] animate-bounce">
                                    {transactions.filter(t => t.status === 'waiting_payment').length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 sm:flex-none px-4 md:px-8 py-3 rounded-2xl font-black transition-all text-xs md:text-sm ${activeTab === 'all' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-brand-dark/40 hover:bg-brand-light/30'}`}
                        >
                            الكل
                        </button>
                    </div>

                    <div
                        onClick={() => setAutoPrint(!autoPrint)}
                        className="flex items-center justify-center gap-3 bg-white px-6 py-3 rounded-2xl border border-brand-primary/10 cursor-pointer hover:bg-brand-light/5 transition-all shadow-sm"
                    >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border-2 shrink-0 ${autoPrint ? 'bg-brand-primary border-transparent' : 'bg-transparent border-gray-200'}`}>
                            {autoPrint && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-brand-dark whitespace-nowrap">طباعة فورية</span>
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
                    className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-brand-primary/10 outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold placeholder-gray-300 shadow-sm"
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

                            {transaction.isManual && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-tighter z-20">
                                    Manual / يدوي
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-8">
                                <div className={`h-16 px-5 rounded-[1.5rem] flex flex-col items-center justify-center font-bold transition-all transform group-hover:scale-105 ${transaction.isManual || !transaction.tableNumber ? 'bg-red-50 text-red-600' : 'bg-brand-light/20 text-brand-dark group-hover:bg-brand-primary group-hover:text-white'}`}>
                                    <span className="text-[10px] opacity-60 uppercase mb-0.5">
                                        {transaction.tableNumber === 'Takeaway' ? 'طريقة الاستلام' : transaction.tableNumber ? 'رقم الطاولة' : 'نوع الطلب'}
                                    </span>
                                    <span className="text-lg whitespace-nowrap font-black">
                                        {transaction.tableNumber === 'Takeaway' ? 'طلب سفري 🛍️' : transaction.tableNumber ? `طاولة ${transaction.tableNumber}` : 'يدوي طوارئ'}
                                    </span>

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
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div className="flex items-center gap-2 text-gray-500 text-[13px] font-bold bg-gray-50/50 p-2 rounded-xl border border-gray-100/30">
                                        <Calendar size={14} className="text-brand-primary" />
                                        {new Date(transaction.date).toLocaleDateString('ar-EG')}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-[13px] font-bold bg-gray-50/50 p-2 rounded-xl border border-gray-100/30">
                                        <Clock size={14} className="text-brand-primary" />
                                        {new Date(transaction.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-[11px] font-black col-span-2 px-1">
                                        <FileText size={14} className="text-brand-primary/40" />
                                        <span>رقم الفاتورة: #{transaction.id.slice(-12)}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 rounded-[2rem] p-5 space-y-3 border border-gray-100/50">
                                    {transaction.items.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <span className="text-brand-dark font-black flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                                                {item.name}
                                                <span className="text-gray-400 text-xs font-bold">x{item.quantity}</span>
                                            </span>
                                            <span className="text-gray-500 font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {transaction.items.length > 2 && (
                                        <div className="text-[10px] text-center text-brand-primary font-black uppercase tracking-widest pt-1 border-t border-dashed border-brand-primary/10">
                                            + {transaction.items.length - 2} عناصر إضافية
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between pt-4 border-t border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">الإجمالي الكلي</span>
                                        <span className={`font-black text-2xl leading-none ${transaction.isManual ? 'text-red-600' : 'text-brand-dark'}`}>
                                            {formatCurrency(transaction.total, settings?.currency || CURRENCY)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePrint(transaction);
                                            }}
                                            className="group/print w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-orange-100 hover:scale-110 active:scale-95"
                                            title="طباعة"
                                        >
                                            <Printer size={20} className="group-hover/print:rotate-[-12deg] transition-transform" />
                                        </button>
                                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-brand-light/30 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                                            <Eye size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!['completed', 'refunded'].includes(transaction.status) && canFinalize && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedForPayment(transaction);
                                    }}
                                    className={`mt-6 w-full py-5 rounded-[1.5rem] text-white text-md font-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${transaction.isManual
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                        : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary shadow-brand-primary/20'
                                        }`}
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
                <div className="fixed inset-0 z-[200] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-8 bg-brand-dark text-white flex justify-between items-center relative">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm">
                                    <Receipt size={32} className="text-brand-accent" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">
                                        {viewingTransaction.tableNumber ? `طاولة ${viewingTransaction.tableNumber}` : 'طلب يدوي طوارئ'}
                                    </h2>
                                    <p className="text-brand-accent/60 text-[10px] font-black uppercase tracking-widest">
                                        معرف العملية: #{viewingTransaction.id}
                                    </p>
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
                                    <h3 className="font-black text-brand-dark text-lg">قائمة المشتريات</h3>
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
                                                    <td className="px-6 py-4 font-bold text-brand-dark">{item.name}</td>
                                                    <td className="px-6 py-4 font-black text-brand-primary">x{item.quantity}</td>
                                                    <td className="px-6 py-4 font-black text-brand-dark text-left">{formatCurrency(item.price * item.quantity, settings?.currency || CURRENCY)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-6 bg-brand-primary rounded-full"></div>
                                    <h3 className="font-black text-brand-dark text-lg">حوكمة العملية (مسار الطلب)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-primary shadow-sm">
                                            <ShoppingCart size={20} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">بواسطة المبيعات</p>
                                            <p className="text-sm font-black text-brand-dark">{viewingTransaction.salesPerson || '---'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                                            <UtensilsCrossed size={20} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">بواسطة المطبخ</p>
                                            <p className="text-sm font-black text-brand-dark">{viewingTransaction.kitchenPerson || '---'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                            <PackageCheck size={20} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">استلام الطلب</p>
                                            <p className="text-sm font-black text-brand-dark">{viewingTransaction.deliveredBy || '---'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                            <Banknote size={20} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-0.5">بواسطة الكاشير</p>
                                            <p className="text-sm font-black text-brand-dark">{viewingTransaction.cashierPerson || '---'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center text-2xl font-black">
                                    <span className="text-brand-dark">إجمالي القيمة</span>
                                    <span className="text-brand-primary">{formatCurrency(viewingTransaction.total, settings?.currency || CURRENCY)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 flex gap-4">
                            <button
                                onClick={() => handlePrint(viewingTransaction)}
                                className="flex-1 bg-brand-dark text-white font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-brand-primary transition-all shadow-xl shadow-brand-dark/10"
                            >
                                <Printer size={20} /> طباعة الفاتورة الفورية
                            </button>
                            <button
                                onClick={() => setViewingTransaction(null)}
                                className="flex-1 bg-white text-gray-400 font-black py-4 rounded-[1.5rem] border-2 border-gray-100 hover:text-brand-dark transition-all"
                            >
                                إغلاق المعاينة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoices Log Modal */}
            {isLogOpen && (
                <div className="fixed inset-0 z-[250] bg-brand-dark/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#fdfaf7] w-full max-w-5xl h-[90vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-10 border-b border-brand-primary/10 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-brand-accent text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-brand-accent/20">
                                    <History size={40} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-brand-dark mb-1">سجل الفواتير المؤرشفة</h2>
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
                                            className="bg-white p-6 rounded-[2.5rem] border border-brand-primary/10 shadow-sm hover:shadow-xl transition-all flex items-center justify-between cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`h-16 px-4 rounded-2xl flex flex-col items-center justify-center font-black transition-all ${t.isManual || !t.tableNumber ? 'bg-red-50 text-red-600' : 'bg-brand-light/30 text-brand-primary group-hover:bg-brand-primary group-hover:text-white'}`}>
                                                    <span className="text-[10px] opacity-60 uppercase mb-0.5">{t.tableNumber === 'Takeaway' ? 'استلام' : t.tableNumber ? 'طاولة' : 'نوع'}</span>
                                                    <span className="text-lg">{t.tableNumber === 'Takeaway' ? 'سفري 🛍️' : t.tableNumber ? `#${t.tableNumber}` : 'يدوي'}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-coffee-900 text-lg uppercase tracking-tighter">
                                                        {t.tableNumber === 'Takeaway' ? 'طلب سفري خارجي' : t.tableNumber ? `طلب الطاولة ${t.tableNumber}` : 'طلب يدوي طوارئ'}
                                                    </p>

                                                    <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.date).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(t.date).toLocaleTimeString()}</span>
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-[10px]">#{t.id.slice(-8)}</span>
                                                        <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md text-[10px]">{t.paymentMethod === 'cash' ? 'نقدي' : t.paymentMethod === 'card' ? 'بطاقة' : 'إلكتروني'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Final Amount</p>
                                                    <p className="text-2xl font-black text-brand-dark">{formatCurrency(t.total, settings?.currency || CURRENCY)}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePrint(t); }}
                                                    className="w-14 h-14 bg-brand-light/40 text-brand-primary rounded-3xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"
                                                >
                                                    <Printer size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-white border-t border-brand-primary/10 flex justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                            Golden POS Intelligence System - Secure Financial Log
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Order Emergency Modal */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-[300] bg-brand-dark/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-6xl h-[88vh] rounded-[4rem] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-700 border-4 border-white/20">
                        <div className="p-10 bg-brand-primary text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md shadow-inner">
                                    <AlertCircle size={40} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black mb-1">واجهة القيد اليدوي</h2>
                                    <p className="text-white/60 font-black text-xs uppercase tracking-[0.3em]">Direct Transaction Engine</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsManualModalOpen(false)}
                                className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-black/20 rounded-2xl transition-all text-white relative z-10 border border-white/10"
                            >
                                <X size={32} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Products list for manual selection */}
                            <div className="flex-[2] p-10 overflow-y-auto bg-gray-50/50 no-scrollbar relative">
                                <div className="absolute inset-0 bg-brand-primary/5 opacity-30 pointer-events-none"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                                    {products.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addToManualCart(p)}
                                            className="bg-white p-6 rounded-[2.5rem] border-2 border-transparent hover:border-brand-primary hover:shadow-2xl transition-all text-right flex items-center gap-4 group active:scale-95"
                                        >
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-brand-primary/10 group-hover:rotate-12 transition-all">
                                                {p.category === 'Coffee' ? '☕' : p.category === 'Tea' ? '🍵' : '🍰'}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-brand-dark mb-1">{p.name}</h4>
                                                <span className="text-brand-primary font-black text-sm">{formatCurrency(p.price, settings?.currency || CURRENCY)}</span>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-all">
                                                <Plus className="text-brand-primary" size={20} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Manual Cart */}
                            <div className="w-[420px] border-r border-brand-primary/5 flex flex-col bg-white shadow-2xl relative z-20">
                                <div className="p-8 border-b border-brand-primary/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                                            <ShoppingCart size={20} />
                                        </div>
                                        <span className="font-black text-brand-dark">سلة القيد السريع</span>
                                    </div>
                                    <span className="text-[10px] font-black bg-brand-primary/5 text-brand-primary px-3 py-1 rounded-full uppercase">Queue</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                                    {manualCart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-30">
                                            <div className="w-24 h-24 border-4 border-dashed border-gray-200 rounded-full flex items-center justify-center">
                                                <Coffee size={40} />
                                            </div>
                                            <p className="font-black text-xs uppercase tracking-widest">Cart is empty</p>
                                        </div>
                                    ) : (
                                        manualCart.map(i => (
                                            <div key={i.id} className="flex justify-between items-center bg-gray-50 p-5 rounded-[2rem] border border-brand-primary/5 hover:border-brand-primary transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-brand-primary shadow-sm">
                                                        {i.quantity}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-brand-dark">{i.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold">{formatCurrency(i.price * i.quantity, settings?.currency || CURRENCY)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromManualCart(i.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white text-gray-300 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-10 border-t border-brand-primary/5 bg-gray-50/50">
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0), settings?.currency || CURRENCY)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase border-b border-dashed border-gray-200 pb-4">
                                            <span>Tax Flow</span>
                                            <span>{formatCurrency((manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0)) * (settings?.taxRate || 1) / 100, settings?.currency || CURRENCY)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-brand-dark/40 font-black uppercase text-xs">Total Amount</span>
                                            <span className="text-4xl font-black text-brand-dark">
                                                {formatCurrency(manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (1 + (settings?.taxRate || 0) / 100), settings?.currency || CURRENCY)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={createManualTransaction}
                                        disabled={manualCart.length === 0}
                                        className="w-full bg-brand-primary hover:bg-brand-secondary disabled:opacity-30 disabled:hover:bg-brand-primary text-white py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 shadow-3xl shadow-brand-primary/20 transition-all active:scale-95 group"
                                    >
                                        <Check size={28} className="group-hover:scale-125 transition-transform" />
                                        تأكيد القيد اليدوي
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Selection Modal for Cashier */}
            {selectedForPayment && (
                <div className="fixed inset-0 z-[400] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 border-4 border-white/20">
                        <div className={`p-8 border-b border-gray-100 flex justify-between items-center ${selectedForPayment.isManual ? 'bg-red-50' : 'bg-brand-light/20'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${selectedForPayment.isManual ? 'bg-red-500 text-white' : 'bg-brand-primary text-white'}`}>
                                    {paymentStep === 1 ? <Banknote size={24} /> : <CheckCircle size={24} />}
                                </div>
                                <div>
                                    <h2 className={`text-xl font-black ${selectedForPayment.isManual ? 'text-red-600' : 'text-brand-dark'}`}>
                                        {paymentStep === 1 ? (selectedForPayment.isManual ? 'تحصيل يدوي' : 'طريقة الدفع') : 'تأكيد العملية'}
                                    </h2>
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">
                                        فاتورة رقم #{selectedForPayment.id.slice(-6)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedForPayment(null);
                                    setPaymentStep(1);
                                    setSelectedMethod(null);
                                }}
                                className="p-3 bg-white/50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-10">
                            {paymentStep === 1 ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="text-center">
                                        <span className="text-gray-400 block text-[10px] mb-2 font-black uppercase tracking-[0.2em]">اختيار الوسيلة</span>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button
                                                onClick={() => { setSelectedMethod('cash'); setPaymentStep(2); }}
                                                className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-gray-50 border-2 border-transparent hover:border-green-500 hover:bg-green-50 text-brand-dark transition-all group active:scale-95"
                                            >
                                                <div className="p-4 bg-white rounded-2xl shadow-sm text-green-600 group-hover:scale-110 transition-all">
                                                    <Banknote size={32} />
                                                </div>
                                                <span className="font-black text-xs">نقد</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedMethod('card'); setPaymentStep(2); }}
                                                className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-gray-50 border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 text-brand-dark transition-all group active:scale-95"
                                            >
                                                <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:scale-110 transition-all">
                                                    <CreditCard size={32} />
                                                </div>
                                                <span className="font-black text-xs">بطاقة</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedMethod('online'); setPaymentStep(2); }}
                                                className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-gray-50 border-2 border-transparent hover:border-purple-500 hover:bg-purple-50 text-brand-dark transition-all group active:scale-95"
                                            >
                                                <div className="p-4 bg-white rounded-2xl shadow-sm text-purple-600 group-hover:scale-110 transition-all">
                                                    <Wifi size={32} />
                                                </div>
                                                <span className="font-black text-xs">إلكتروني</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="text-center">
                                        <div className="inline-flex items-center gap-2 bg-brand-primary/10 px-6 py-2 rounded-full text-brand-primary text-xs font-black uppercase tracking-widest mb-6">
                                            {selectedMethod === 'cash' ? '💵 دفع نقدي' : selectedMethod === 'card' ? '💳 بطاقة بنكية' : '📱 دفع إلكتروني'}
                                        </div>
                                        <span className="text-gray-400 block text-[10px] mb-2 font-black uppercase tracking-[0.3em]">المبلغ المطلوب تحصيله</span>
                                        <span className={`text-6xl font-black block tracking-tighter ${selectedForPayment.isManual ? 'text-red-600' : 'text-brand-dark'}`}>
                                            {formatCurrency(selectedForPayment.total, settings?.currency || CURRENCY)}
                                        </span>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setPaymentStep(1)}
                                            className="flex-1 py-5 rounded-[2rem] bg-gray-100 text-gray-400 font-black text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ChevronLeft size={18} /> تراجع
                                        </button>
                                        <button
                                            onClick={handleComplete}
                                            className="flex-[2] py-5 rounded-[2rem] bg-brand-primary text-white font-black text-lg hover:bg-brand-secondary transition-all shadow-2xl shadow-brand-primary/30 flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <CheckCircle size={24} /> تم استلام المبلغ
                                        </button>
                                    </div>

                                    {autoPrint && (
                                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                                            <Printer size={12} /> سيتم إجراء الطباعة فور الحفظ
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Unified Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    );
};

export default InvoicesView;
