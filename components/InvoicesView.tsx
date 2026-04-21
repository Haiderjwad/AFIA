import React, { useState } from 'react';
import { soundService } from '../services/soundService';
import { Transaction, MenuItem, AppSettings, CartItem } from '../types';
import {
    FileText, Calendar, Clock, Printer, CreditCard, Banknote,
    Wifi, CheckCircle, Search, AlertCircle, Plus, Minus,
    Trash2, ShoppingCart, Coffee, Eye, X, Receipt,
    ChevronLeft, ListFilter, History, Check
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

    const handlePrint = (transaction: Transaction) => {
        const curr = settings?.currency || CURRENCY;
        const receiptType = settings?.receiptType || 'a4';
        const storeName = settings?.storeName || 'ألف عافية';
        const taxRate = settings?.taxRate || 11;

        const grandSubtotal = transaction.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const grandTaxAmount = grandSubtotal * (taxRate / 100);
        const grandTotalAmount = grandSubtotal + grandTaxAmount;
        const pmtText = transaction.paymentMethod === 'cash' ? 'نقداً' : transaction.paymentMethod === 'card' ? 'بطاقة بنكية' : 'إلكتروني';
        const dateStr = new Date(transaction.date).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeStr = new Date(transaction.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        // ════════════════════════════════════════════════════════════════════════
        // 1. THERMAL RECEIPT LAYOUT (80mm)
        // ════════════════════════════════════════════════════════════════════════
        const buildThermalHTML = (): string => {
            const itemRows = transaction.items.map((item, idx) => `
                <div class="t-row">
                    <div class="t-col-name">${item.name}</div>
                    <div class="t-col-qty">x${item.quantity}</div>
                    <div class="t-col-total">${(item.price * item.quantity).toFixed(0)}</div>
                </div>
            `).join('');

            return `
                <div class="thermal-receipt">
                    <div class="t-header">
                        <img src="${settings?.storeLogo || '/branding/afia_logo.png'}" style="max-width: 60px; max-height: 60px; margin-bottom: 8px; object-fit: contain" />

                        <h1 class="t-store-name">${storeName}</h1>
                        <p class="t-subtext">وصل مبيعات رقم #${transaction.id.slice(-6)}</p>
                    </div>

                    <div class="t-info">
                        <div class="t-info-row"><span>التاريخ:</span> <span>${dateStr}</span></div>
                        <div class="t-info-row"><span>الوقت:</span> <span>${timeStr}</span></div>
                        <div class="t-info-row"><span>الدفع:</span> <span>${pmtText}</span></div>
                        ${transaction.tableNumber ? `<div class="t-info-row"><span>الطاولة:</span> <span>${transaction.tableNumber}</span></div>` : ''}
                    </div>

                    <div class="t-divider"></div>
                    <div class="t-items-head">
                        <span>الصنف</span>
                        <span>الكمية</span>
                        <span>السعر</span>
                    </div>
                    <div class="t-divider-thin"></div>
                    <div class="t-items-list">${itemRows}</div>
                    <div class="t-divider"></div>

                    <div class="t-summary">
                        <div class="t-sum-row"><span>المجموع:</span> <span>${grandSubtotal.toFixed(0)} ${curr}</span></div>
                        <div class="t-sum-row"><span>الضريبة (%${taxRate}):</span> <span>${grandTaxAmount.toFixed(0)} ${curr}</span></div>
                        <div class="t-sum-row t-grand-total"><span>الإجمالي:</span> <span>${grandTotalAmount.toFixed(0)} ${curr}</span></div>
                    </div>

                    <div class="t-footer">
                        <p class="t-thanks">شكراً لزيارتكم</p>
                        <div class="t-qr-placeholder"></div>
                        <p class="t-system-info">نظام ألف عافية - Al-Afia POS</p>
                    </div>
                </div>
            `;
        };

        // ════════════════════════════════════════════════════════════════════════
        // 2. A4 INVOICE LAYOUT (Standard)
        // ════════════════════════════════════════════════════════════════════════
        const ITEMS_PER_PAGE_A4 = 10;
        const totalPagesA4 = Math.ceil(transaction.items.length / ITEMS_PER_PAGE_A4);

        const buildA4PageHTML = (pageItems: typeof transaction.items, pageIndex: number, totalPgs: number): string => {
            const isSubsequent = pageIndex > 0;
            const invLabel = `#${transaction.id.slice(-6)}${isSubsequent ? ` (${pageIndex + 1})` : ''}`;
            const emptyCount = ITEMS_PER_PAGE_A4 - pageItems.length;

            const itemRows = pageItems.map((item, idx) => {
                const n = (pageIndex * ITEMS_PER_PAGE_A4) + idx + 1;
                const bg = n % 2 === 0 ? '#f0f7f4' : '#ffffff';
                return `<tr style="background:${bg}">
                  <td class="td-idx">${n}</td>
                  <td class="td-name">${item.name}</td>
                  <td class="td-num">${item.price.toFixed(2)}</td>
                  <td class="td-num">${item.quantity}</td>
                  <td class="td-total">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>`;
            }).join('');

            const emptyRows = Array.from({ length: emptyCount }).map((_, i) => {
                const n = (pageIndex * ITEMS_PER_PAGE_A4) + pageItems.length + i + 1;
                const bg = n % 2 === 0 ? '#f0f7f4' : '#ffffff';
                return `<tr style="background:${bg}"><td class="td-empty" colspan="5"></td></tr>`;
            }).join('');

            return `<div class="invoice-page">
                <div class="a4-hdr">
                    <div class="a4-hdr-inner">
                        <div class="a4-hdr-left">
                            <img src="${settings?.storeLogo || '/branding/afia_logo.png'}" style="width: 70px; height: 70px; object-fit: contain; border-radius: 15px; background: #fff; padding: 5px; border: 1px solid rgba(45, 106, 79, 0.1)" />

                            <div>
                                <h1 class="a4-store-name">${storeName}</h1>
                                <p class="a4-sys-name">نظام ألف عافية لإدارة نقاط البيع</p>
                            </div>
                        </div>
                        <div class="a4-hdr-right">
                             <div class="a4-type-badge">فاتورة مبيعات ضريبية</div>
                             <div class="a4-inv-no">رقم: ${invLabel}</div>
                        </div>
                    </div>
                </div>

                <div class="a4-info-grid">
                    <div class="a4-info-box">
                        <span class="a4-info-lbl">التاريخ والوقت</span>
                        <span class="a4-info-val">${dateStr} - ${timeStr}</span>
                    </div>
                    <div class="a4-info-box">
                        <span class="a4-info-lbl">طريقة الدفع</span>
                        <span class="a4-info-val">${pmtText}</span>
                    </div>
                    <div class="a4-info-box">
                        <span class="a4-info-lbl">رقم الطاولة</span>
                        <span class="a4-info-val">${transaction.tableNumber || '---'}</span>
                    </div>
                </div>

                <div class="a4-table-container">
                    <table class="a4-tbl">
                        <thead>
                            <tr>
                                <th style="width: 50px">ت</th>
                                <th>اسم الصنف / المنتج</th>
                                <th style="width: 100px">سعر الوحدة</th>
                                <th style="width: 80px">الكمية</th>
                                <th style="width: 120px">المجموع</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}${emptyRows}</tbody>
                    </table>
                </div>

                <div class="a4-summary-container">
                    <div class="a4-summary-left">
                        <div class="a4-total-badge">
                            <span class="a4-tb-lbl">الإجمالي النهائي</span>
                            <span class="a4-tb-val">${grandTotalAmount.toFixed(2)} ${curr}</span>
                        </div>
                    </div>
                    <div class="a4-summary-right">
                        <div class="a4-sum-row"><span>المجموع الفرعي:</span> <span>${grandSubtotal.toFixed(2)}</span></div>
                        <div class="a4-sum-row"><span>ضريبة القيمة المضافة ${taxRate}%:</span> <span>${grandTaxAmount.toFixed(2)}</span></div>
                        <div class="a4-sum-row a4-sum-total"><span>الصافي:</span> <span>${grandTotalAmount.toFixed(2)} ${curr}</span></div>
                    </div>
                </div>

                <div class="a4-footer">
                    <p class="a4-footer-thanks">نسعد دائماً بخدمتكم في ${storeName}</p>
                    <div class="a4-footer-line"></div>
                    <div class="a4-footer-bottom">
                        <span>تم إصدارها إلكترونياً</span>
                        <span>www.alafia.iq</span>
                        <span>صفحة ${pageIndex + 1} من ${totalPgs}</span>
                    </div>
                </div>
            </div>`;
        };

        // ════════════════════════════════════════════════════════════════════════
        // 3. PREMIUM CUSTOM INVOICE LAYOUT (Luxury/Branded)
        // ════════════════════════════════════════════════════════════════════════
        const brandColor = settings?.brandColor || '#2d6a4f';
        const buildCustomPageHTML = (pageItems: typeof transaction.items, pageIndex: number, totalPgs: number): string => {
            const invLabel = `#${transaction.id.slice(-6)}${pageIndex > 0 ? ` (${pageIndex + 1})` : ''}`;
            const itemRows = pageItems.map((item, idx) => {
                const n = (pageIndex * ITEMS_PER_PAGE_A4) + idx + 1;
                return `<tr>
                  <td class="c-idx">${n}</td>
                  <td class="c-name">${item.name}</td>
                  <td class="c-price">${item.price.toFixed(2)}</td>
                  <td class="c-qty">${item.quantity}</td>
                  <td class="c-total">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>`;
            }).join('');

            return `<div class="custom-invoice">
                <!-- Branding Header -->
                <div class="c-header" style="border-left: 10px solid ${brandColor}">
                    <div class="c-header-main">
                        <div class="c-logos">
                            <img src="${settings?.storeLogo || '/branding/afia_logo.png'}" class="c-store-logo" />
                            ${settings?.storeLogo ? `
                                <div class="c-divider-v"></div>
                                <img src="/branding/afia_logo.png" class="c-system-logo" />
                            ` : ''}
                        </div>

                        <div class="c-store-info">
                            <h1 style="color:${brandColor}">${storeName}</h1>
                            <span>فاتورة مبيعات فارة &middot; Premium Invoice</span>
                        </div>
                    </div>
                    <div class="c-header-id" style="background:${brandColor}10">
                        <span style="color:${brandColor}">${invLabel}</span>
                        <small>${dateStr}</small>
                    </div>
                </div>

                <!-- Watermark -->
                <div class="c-watermark">
                    <img src="/branding/afia_logo.png" />
                </div>

                <!-- Transaction Details -->
                <div class="c-meta-grid">
                    <div class="c-meta-item"><strong>الوقت:</strong> ${timeStr}</div>
                    <div class="c-meta-item"><strong>طريقة الدفع:</strong> ${pmtText}</div>
                    <div class="c-meta-item"><strong>الموقع/الطاولة:</strong> ${transaction.tableNumber || '---'}</div>
                    <div class="c-meta-item"><strong>رقم العملية:</strong> ${transaction.id}</div>
                </div>

                <!-- Items Table -->
                <div class="c-table-wrapper">
                    <table class="c-table">
                        <thead style="background:${brandColor}">
                            <tr>
                                <th>ت</th>
                                <th style="text-align:right">الوصف</th>
                                <th>السعر</th>
                                <th>الكمية</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                    </table>
                </div>

                <!-- Summary -->
                <div class="c-summary">
                    <div class="c-summary-row">
                        <span>المجموع الفرعي</span>
                        <span>${grandSubtotal.toFixed(2)} ${curr}</span>
                    </div>
                    <div class="c-summary-row">
                        <span>الضريبة (${taxRate}%)</span>
                        <span>${grandTaxAmount.toFixed(2)} ${curr}</span>
                    </div>
                    <div class="c-summary-total" style="color:${brandColor}">
                        <span>الإجمالي النهائي</span>
                        <span>${grandTotalAmount.toFixed(2)} ${curr}</span>
                    </div>
                </div>

                <div class="c-footer">
                    <div class="c-footer-decoration" style="background: linear-gradient(to left, ${brandColor}, transparent)"></div>
                    <div class="c-footer-content">
                        <span>صدرت بواسطة نظام ألف عافية - AlAfia.iq</span>
                        <span>صفحة ${pageIndex + 1} من ${totalPgs}</span>
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
        body { font-family: 'Cairo', sans-serif; background: #eee; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        
        /* ═════════ A4 STYLES ═════════ */
        .invoice-page { 
            width: 210mm; height: 297mm; background: #fff; margin: 20px auto; 
            padding: 40px; display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .a4-hdr { border-bottom: 5px solid #2d6a4f; padding-bottom: 25px; margin-bottom: 30px; }
        .a4-hdr-inner { display: flex; justify-content: space-between; align-items: center; }
        .a4-hdr-left { display: flex; align-items: center; gap: 20px; }
        .a4-store-name { font-size: 32px; font-weight: 900; color: #1b4332; line-height: 1.2; }
        .a4-sys-name { font-size: 14px; color: #52b788; font-weight: 700; }
        .a4-hdr-right { text-align: left; }
        .a4-type-badge { background: #f8961e; color: #fff; padding: 6px 15px; border-radius: 10px; font-weight: 800; font-size: 14px; margin-bottom: 8px; }
        .a4-inv-no { font-size: 18px; font-weight: 900; color: #1b4332; }

        .a4-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .a4-info-box { background: #fcfdfc; border: 1px solid #e9ecef; padding: 15px; border-radius: 15px; border-right: 4px solid #2d6a4f; }
        .a4-info-lbl { display: block; font-size: 12px; font-weight: 800; color: #2d6a4f; text-transform: uppercase; margin-bottom: 5px; }
        .a4-info-val { display: block; font-size: 15px; font-weight: 900; color: #1b4332; }

        .a4-table-container { flex: 1; margin-bottom: 30px; }
        .a4-tbl { width: 100%; border-collapse: collapse; }
        .a4-tbl th { background: #1b4332; color: #fff; padding: 15px; text-align: right; font-size: 14px; font-weight: 900; }
        .a4-tbl td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; color: #1b4332; font-weight: 700; }
        .a4-tbl tr:nth-child(even) { background: #f9fbf9; }
        .td-idx { font-weight: 900; color: #2d6a4f; text-align: center; }
        .td-num, .td-total { text-align: center; }

        .a4-summary-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .a4-total-badge { background: #1b4332; padding: 30px; border-radius: 25px; color: #fff; text-align: center; min-width: 250px; box-shadow: 0 10px 20px rgba(27, 67, 50, 0.2); }
        .a4-tb-lbl { display: block; font-size: 14px; font-weight: 700; opacity: 0.8; margin-bottom: 10px; }
        .a4-tb-val { font-size: 36px; font-weight: 900; }
        .a4-summary-right { width: 300px; padding-top: 10px; }
        .a4-sum-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; font-weight: 700; color: #1b4332; }
        .a4-sum-total { font-size: 20px; font-weight: 900; border-top: 3px solid #2d6a4f; margin-top: 10px; padding-top: 15px; color: #2d6a4f; }

        .a4-footer { text-align: center; border-top: 1px solid #eee; padding-top: 30px; }
        .a4-footer-thanks { font-size: 22px; font-weight: 900; color: #1b4332; margin-bottom: 10px; }
        .a4-footer-line { height: 5px; background: #f8961e; width: 60px; margin: 0 auto 15px; border-radius: 3px; }
        .a4-footer-bottom { display: flex; justify-content: space-between; font-size: 12px; color: #aaa; font-weight: 700; }


        /* ═════════ CUSTOM PREMIUM STYLES ═════════ */
        .custom-invoice {
            width: 210mm; height: 297mm; background: #fff; margin: 20px auto; 
            padding: 50px; display: flex; flex-direction: column; overflow: hidden;
            position: relative; box-shadow: 0 0 30px rgba(0,0,0,0.15);
        }
        .c-header { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 50px; padding: 20px; background: #fcfcfc; border-radius: 20px; }
        .c-header-main { display: flex; flex-direction: column; gap: 20px; }
        .c-logos { display: flex; align-items: center; gap: 20px; }
        .c-store-logo { height: 80px; width: 80px; object-fit: contain; border-radius: 15px; }
        .c-system-logo { height: 40px; opacity: 0.8; }
        .c-divider-v { width: 2px; height: 30px; background: #ddd; }
        .c-logo-placeholder { width: 80px; height: 80px; display: flex; items-center justify-center; font-size: 40px; font-weight: 900; color: #fff; border-radius: 15px; }
        .c-store-info h1 { font-size: 36px; font-weight: 900; line-height: 1; }
        .c-store-info span { font-size: 14px; color: #666; font-weight: 700; margin-top: 5px; display: block; }
        .c-header-id { padding: 20px; border-radius: 15px; text-align: center; display: flex; flex-direction: column; justify-content: center; min-width: 180px; }
        .c-header-id span { font-size: 20px; font-weight: 900; display: block; }
        .c-header-id small { font-size: 12px; font-weight: 700; opacity: 0.6; }

        .c-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); opacity: 0.03; width: 500px; z-index: 0; pointer-events: none; }
        .c-watermark img { width: 100%; }

        .c-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px; position: relative; z-index: 1; }
        .c-meta-item { background: #fff; border: 1px solid #eee; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #444; }
        .c-meta-item strong { color: #888; display: block; font-size: 10px; margin-bottom: 3px; text-transform: uppercase; }

        .c-table-wrapper { flex: 1; position: relative; z-index: 1; background: rgba(255,255,255,0.8); backdrop-filter: blur(5px); }
        .c-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
        .c-table th { color: #fff; padding: 15px; text-align: center; font-size: 14px; font-weight: 900; }
        .c-table th:first-child { border-radius: 0 12px 12px 0; }
        .c-table th:last-child { border-radius: 12px 0 0 12px; }
        .c-table td { padding: 15px; background: #fafafa; font-weight: 800; color: #222; text-align: center; font-size: 14px; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; }
        .c-table td:first-child { border-right: 1px solid #f0f0f0; border-radius: 0 12px 12px 0; color: #888; font-size: 12px; }
        .c-table td:last-child { border-left: 1px solid #f0f0f0; border-radius: 12px 0 0 12px; font-weight: 900; }
        .c-name { text-align: right !important; }

        .c-summary { margin-top: 40px; padding: 30px; background: #fcfcfc; border-radius: 25px; border: 1px solid #eee; width: 400px; margin-right: auto; position: relative; z-index: 1; }
        .c-summary-row { display: flex; justify-content: space-between; padding: 10px 0; color: #666; font-weight: 700; font-size: 15px; }
        .c-summary-total { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #ddd; font-size: 24px; font-weight: 900; }

        .c-footer { margin-top: 50px; position: relative; z-index: 1; }
        .c-footer-decoration { height: 10px; border-radius: 5px; margin-bottom: 15px; }
        .c-footer-content { display: flex; justify-content: space-between; font-size: 12px; color: #aaa; font-weight: 800; }

        /* ═════════ THERMAL STYLES ═════════ */
        @page { margin: 0; }
        .thermal-receipt { 
            width: 80mm; background: #fff; margin: 10px auto; padding: 10mm 5mm; 
            border: 1px solid #ddd; display: flex; flex-direction: column; align-items: center; 
        }
        .t-header { text-align: center; margin-bottom: 15px; width: 100%; }
        .t-logo { width: 40px; height: 40px; background: #000; color: #fff; border-radius: 10px; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; }
        .t-store-name { font-size: 22px; font-weight: 900; margin-bottom: 3px; color: #000; }
        .t-subtext { font-size: 12px; font-weight: 600; color: #666; }
        .t-info { width: 100%; margin-bottom: 10px; font-size: 12px; font-weight: 700; color: #222; }
        .t-info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .t-divider { width: 100%; border-top: 2px dashed #000; margin: 10px 0; }
        .t-divider-thin { width: 100%; border-top: 1px solid #eee; margin: 5px 0; }
        .t-items-head { width: 100%; display: flex; justify-content: space-between; font-size: 11px; font-weight: 900; padding: 0 2px; }
        .t-items-list { width: 100%; }
        .t-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; padding: 5px 2px; border-bottom: 1px dotted #eee; }
        .t-col-name { flex: 1; text-align: right; }
        .t-col-qty { width: 40px; text-align: center; }
        .t-col-total { width: 60px; text-align: left; }
        .t-summary { width: 100%; margin: 10px 0; font-size: 14px; font-weight: 700; }
        .t-sum-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .t-grand-total { font-size: 18px; font-weight: 900; padding-top: 5px; border-top: 1px solid #000; }
        .t-footer { text-align: center; font-size: 10px; font-weight: 700; width: 100%; }
        .t-thanks { font-size: 14px; font-weight: 900; margin: 15px 0; }
        .t-qr-placeholder { width: 60px; height: 60px; border: 2px solid #000; background:Repeating-conic-gradient(#000 0% 25%,#fff 0% 50%) 50%/10% 10%; margin: 0 auto 10px; }
        .t-system-info { font-size: 8px; color: #999; }

        @media print {
            body { background: transparent; }
            .invoice-page, .thermal-receipt, .custom-invoice { margin: 0; box-shadow: none; border: none; }
            .page-break { page-break-after: always; break-after: page; }
            ${receiptType === 'thermal' ? '@page { size: 80mm auto; }' : '@page { size: A4 portrait; }'}
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
            }, 500);
        };
    </script>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) { alert('يرجى السماح للنوافذ المنبثقة لتشغيل الطباعة'); return; }
        printWindow.document.open();
        printWindow.document.write(fullHTML);
        printWindow.document.close();
    };

    const handleComplete = async (method: 'cash' | 'card' | 'online') => {
        if (!selectedForPayment || !onFinalizePayment) return;
        await onFinalizePayment(selectedForPayment.id, method);
        const updated = { ...selectedForPayment, status: 'completed' as const, paymentMethod: method };
        setSelectedForPayment(null);
        soundService.playSuccess();
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
        soundService.playSuccess();
        handlePrint(newTrans);
    };

    return (
        <div className="flex-1 p-8 bg-brand-cream overflow-y-auto no-scrollbar relative" dir="rtl">
            {/* Background Patterns (Subtle) */}
            <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
                <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
            </div>


            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-brand-dark mb-2">إدارة الفواتير المميزة</h1>
                    <p className="text-brand-dark/40 font-bold">نظام ذكي للتحصيل والطباعة المتعددة</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Log Button */}
                    <button
                        onClick={() => setIsLogOpen(true)}
                        className="group flex items-center gap-3 bg-white text-brand-dark border-2 border-brand-primary/10 px-8 py-3 rounded-2xl font-black shadow-sm hover:border-brand-primary active:scale-95 transition-all"
                    >
                        <History size={20} className="text-brand-primary group-hover:rotate-[-45deg] transition-transform" />
                        سجل الفواتير
                    </button>

                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        className="flex items-center gap-3 bg-brand-secondary hover:bg-brand-secondary/90 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-brand-secondary/20 active:scale-95 transition-all"
                    >
                        <Plus size={20} /> قيد يدوي
                    </button>

                    <div className="flex bg-white p-1 rounded-3xl shadow-sm border border-brand-primary/10">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-8 py-3 rounded-2xl font-black transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-brand-dark/40 hover:bg-brand-light/30'}`}
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
                            className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'all' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'text-brand-dark/40 hover:bg-brand-light/30'}`}
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
                                        <span className={`font-black text-3xl leading-none ${transaction.isManual ? 'text-red-600' : 'text-brand-dark'}`}>
                                            {transaction.total.toFixed(2)}
                                            <span className="text-xs mr-1 opacity-50">{settings?.currency || CURRENCY}</span>
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
                                                    <td className="px-6 py-4 font-black text-brand-dark text-left">{(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-dashed border-gray-200">
                                <div className="flex justify-between items-center text-2xl font-black">
                                    <span className="text-brand-dark">إجمالي القيمة</span>
                                    <span className="text-brand-primary">{viewingTransaction.total.toFixed(2)} {settings?.currency || CURRENCY}</span>
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
                                                    <p className="text-2xl font-black text-brand-dark">{t.total.toFixed(2)} {settings?.currency || CURRENCY}</p>
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
                                                <span className="text-brand-primary font-black text-sm">{p.price.toFixed(2)} {CURRENCY}</span>
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
                                                        <p className="text-[10px] text-gray-400 font-bold">{(i.price * i.quantity).toFixed(2)} IQD</p>
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
                                            <span>{manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase border-b border-dashed border-gray-200 pb-4">
                                            <span>Tax Flow</span>
                                            <span>{((manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0)) * (settings?.taxRate || 1) / 100).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-brand-dark/40 font-black uppercase text-xs">Total Amount</span>
                                            <span className="text-4xl font-black text-brand-dark">
                                                {(manualCart.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (1 + (settings?.taxRate || 0) / 100)).toFixed(2)}
                                                <small className="text-xs mr-2 text-brand-primary">{CURRENCY}</small>
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
                <div className="fixed inset-0 z-[120] bg-brand-dark/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className={`p-8 border-b border-gray-100 flex justify-between items-center ${selectedForPayment.isManual ? 'bg-red-50' : 'bg-brand-light/20'}`}>
                            <div>
                                <h2 className={`text-2xl font-bold ${selectedForPayment.isManual ? 'text-red-600' : 'text-brand-dark'}`}>
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
                            <span className={`text-5xl font-black mb-10 block ${selectedForPayment.isManual ? 'text-red-600' : 'text-brand-dark'}`}>
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
