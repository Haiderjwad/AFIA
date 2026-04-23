import React, { useState, useEffect, useRef } from 'react';
import StatusModal from './StatusModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Truck, Phone, Mail, Package,
  CreditCard, Calendar, Search, Plus,
  MoreVertical, Edit3, Trash2, Download,
  FileText, Users, TrendingUp, X, Check,
  AlertCircle, ArrowRight, DollarSign
} from 'lucide-react';
import { Supplier, AppSettings } from '../types';
import { firestoreService } from '../services/firestoreService';
import { CURRENCY } from '../constants';
import { soundService } from '../services/soundService';
import { formatCurrency } from '../utils/currencyUtils';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { patchClonedSubtreeForHtml2Canvas } from '../utils/html2canvasCompat';

interface SuppliersViewProps {
  suppliers: Supplier[];
  settings: AppSettings;
}

const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, settings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFrequency, setActiveFrequency] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean, type: 'success' | 'error' | 'loading', title: string, message: string }>({
    isOpen: false,
    type: 'loading',
    title: '',
    message: ''
  });
  const reportRef = useRef<HTMLDivElement>(null);

  // Removed internal fetchSuppliers as we use props for real-time sync

  const handleOpenModal = (supplier?: Supplier) => {
    const isIQD = settings.currency === 'د.ع' || settings.currency === 'IQD';
    const factor = isIQD ? 1000 : 1;

    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        ...supplier,
        costPerUnit: supplier.costPerUnit * factor,
        totalPaid: supplier.totalPaid * factor,
        frequency: supplier.frequency || 'monthly'
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        suppliedItem: '',
        category: 'قهوة',
        stockProvided: 0,
        costPerUnit: 0,
        totalPaid: 0,
        frequency: 'monthly',
        lastSupplyDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isIQD = settings.currency === 'د.ع' || settings.currency === 'IQD';
    const factor = isIQD ? 1000 : 1;

    const submissionData = {
      ...formData,
      costPerUnit: (formData.costPerUnit || 0) / factor,
      totalPaid: (formData.totalPaid || 0) / factor
    };

    try {
      if (editingSupplier) {
        await firestoreService.updateSupplier(editingSupplier.id, submissionData);
      } else {
        await firestoreService.addSupplier(submissionData as Supplier);
      }
      soundService.playSuccess();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
      soundService.playError();
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    try {
      await firestoreService.deleteSupplier(id);
      soundService.playSuccess();
    } catch (error) {
      soundService.playError();
    }
  };

  const handleDeleteClick = (id: string) => {
    setIsDeleting(id);
  };

  const filteredSuppliers = suppliers.filter(s =>
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.suppliedItem.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (activeFrequency === 'all' || s.frequency === activeFrequency)
  );

  const totalExpenses = suppliers.reduce((acc, s) => acc + s.totalPaid, 0);
  const filteredExpenses = filteredSuppliers.reduce((acc, s) => acc + s.totalPaid, 0);

  const generateReport = async () => {
    setIsExporting(true);
    setStatusModal({
      isOpen: true,
      type: 'loading',
      title: 'جاري إعداد كشف الموردين الموحد',
      message: 'نقوم الآن بمعالجة كافة البيانات المالية وتنظيمها في كشف محاسبي رسمي متعدد الصفحات، يرجى الانتظار...'
    });

    try {
      // Chunk suppliers for multi-page support (e.g. 15 per page)
      const chunkSize = 15;
      const chunks = [];
      for (let i = 0; i < suppliers.length; i += chunkSize) {
        chunks.push(suppliers.slice(i, i + chunkSize));
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < chunks.length; i++) {
        // Create a temporary container for this page's capture
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-5000px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '210mm';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.dir = 'rtl';
        document.body.appendChild(tempContainer);

        const chunk = chunks[i];
        const isFirstPage = i === 0;
        const totalPages = chunks.length;

        // Render the professional template into the container
        tempContainer.innerHTML = `
          <div style="width: 210mm; height: 297mm; padding: 15mm; font-family: 'Cairo', sans-serif; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; background-color: white; position: relative; overflow: hidden;">
            <!-- Background Watermark -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); opacity: 0.03; font-size: 150pt; font-weight: 950; pointer-events: none; white-space: nowrap; width: 100%; text-align: center; color: #1B4332;">
              AFIA POS
            </div>

            <div style="flex-grow: 1;">
              <!-- Header -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #1B4332; padding-bottom: 20px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                  <div style="width: 80px; height: 80px; background-color: #1B4332; border-radius: 20px; display: flex; items-center; justify-content: center; padding: 10px;">
                    <img src="/branding/afia_logo.png" style="width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1);" />
                  </div>
                  <div>
                    <h1 style="margin: 0; color: #1B4332; font-size: 26pt; font-weight: 900; letter-spacing: -1px;">${settings.storeName}</h1>
                    <p style="margin: 5px 0 0; color: #2D6A4F; font-weight: 800; font-size: 11pt; text-transform: uppercase; letter-spacing: 1px;">كشف الإفصاح المالي والمحاسبي للموردين</p>
                  </div>
                </div>
                <div style="text-align: left; background-color: #f8f9fa; padding: 15px 25px; border-radius: 20px; border: 1px solid #eee;">
                  <div style="font-weight: 900; color: #1B4332; font-size: 10pt; margin-bottom: 5px;">تقرير رسمي رقم: #SUP-${new Date().getTime().toString().slice(-6)}</div>
                  <div style="color: #666; font-size: 9pt; font-weight: 700;">التاريخ: ${new Date().toLocaleDateString('ar-IQ')}</div>
                  <div style="color: #666; font-size: 9pt; font-weight: 700;">الصفحة: ${i + 1} / ${totalPages}</div>
                </div>
              </div>

              ${isFirstPage ? `
                <!-- Summary Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 35px;">
                  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 25px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <span style="color: #666; font-size: 10pt; font-weight: 900; display: block; margin-bottom: 8px;">إجمالي الموردين النشطين</span>
                      <span style="color: #1B4332; font-size: 28pt; font-weight: 900;">${suppliers.length}</span>
                    </div>
                    <div style="width: 60px; height: 60px; background-color: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 20pt;">👥</div>
                  </div>
                  <div style="background-color: #1B4332; padding: 30px; border-radius: 25px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 20px 40px rgba(27, 67, 50, 0.15);">
                    <div>
                      <span style="color: rgba(255,255,255,0.6); font-size: 10pt; font-weight: 900; display: block; margin-bottom: 8px;">صافي المصروفات الكلي</span>
                      <span style="color: #F8961E; font-size: 26pt; font-weight: 900;">${formatCurrency(totalExpenses, settings.currency)}</span>
                    </div>
                    <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.1); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 20pt;">💰</div>
                  </div>
                </div>
              ` : ''}

              <!-- Main Table -->
              <table style="width: 100%; border-collapse: separate; border-spacing: 0 10px;">
                <thead>
                  <tr style="background-color: #1B4332; color: white;">
                    <th style="padding: 20px 15px; text-align: right; border-radius: 0 15px 15px 0; font-size: 10pt; text-transform: uppercase;">اسم الجهة الموردة</th>
                    <th style="padding: 20px 15px; text-align: right; font-size: 10pt;">السلعة الموردة</th>
                    <th style="padding: 20px 15px; text-align: right; font-size: 10pt;">الفئة</th>
                    <th style="padding: 20px 15px; text-align: right; font-size: 10pt;">آخر معاملة</th>
                    <th style="padding: 20px 15px; text-align: right; border-radius: 15px 0 0 15px; font-size: 10pt;">إجمالي الاستحقاق</th>
                  </tr>
                </thead>
                <tbody>
                  ${chunk.map(s => `
                    <tr style="background-color: #fff; border: 1px solid #eee;">
                      <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; font-weight: 900; color: #1B4332; font-size: 11pt;">${s.name}</td>
                      <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; color: #444; font-weight: 700;">${s.suppliedItem}</td>
                      <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1;">
                        <span style="background: ${s.frequency === 'daily' ? '#D1FAE5' : s.frequency === 'weekly' ? '#DBEAFE' : s.frequency === 'monthly' ? '#FFEDD5' : '#F3F4F6'}; color: ${s.frequency === 'daily' ? '#065F46' : s.frequency === 'weekly' ? '#1E40AF' : s.frequency === 'monthly' ? '#9A3412' : '#374151'}; padding: 6px 12px; border-radius: 10px; font-size: 8.5pt; font-weight: 800;">
                          ${s.frequency === 'daily' ? 'توريد يومي' : s.frequency === 'weekly' ? 'توريد أسبوعي' : s.frequency === 'monthly' ? 'توريد شهري' : 'توريد سنوي'}
                        </span>
                      </td>
                      <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; color: #777; font-size: 9.5pt; font-weight: 700;">${s.lastSupplyDate}</td>
                      <td style="padding: 22px 15px; border-bottom: 1.5px solid #f1f1f1; font-weight: 900; color: #1B4332; font-size: 12pt;">${formatCurrency(s.totalPaid, settings.currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Footer Section -->
            <div style="margin-top: 30px; border-top: 2px solid #1B4332;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 10px; height: 10px; background-color: #F8961E; border-radius: 50%;"></div>
                  <span style="color: #1B4332; font-weight: 900; font-size: 10pt;">نظام عافية - لإدارة المؤسسات</span>
                </div>
                <div style="color: #999; font-size: 8pt; font-weight: 700;">تم التوليد بواسطة: حوسبة عافية السحابية (Afia Cloud)</div>
              </div>
              <div style="background-color: #1B4332; padding: 10px 20px; border-radius: 12px; display: flex; justify-content: space-between; color: white; font-size: 8pt; font-weight: 700;">
                <span>الموقع: ${window.location.origin}</span>
                <span>المعرّف الرقمي الصادر: AF-${Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                <span>الصفحة ${i + 1} من ${totalPages}</span>
              </div>
            </div>
          </div>
        `;

        // Wait for potential font rendering
        await new Promise(resolve => setTimeout(resolve, 300));

        const exportId = `suppliers-report-${i}`;
        tempContainer.setAttribute('data-export-capture', exportId);

        const canvas = await html2canvas(tempContainer, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            patchClonedSubtreeForHtml2Canvas(clonedDoc, {
              exportId,
              attributeName: 'data-export-capture',
              fallbackColor: '#1B4332'
            });
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

        // Cleanup
        document.body.removeChild(tempContainer);
      }

      pdf.save(`كشف_الموردين_${settings.storeName}_${new Date().toISOString().split('T')[0]}.pdf`);

      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'اكتمل التقرير بنجاح',
        message: 'تم توليد كشف الموردين الموحد بجميع الصفحات وحفظه على جهازك.'
      });

      setTimeout(() => {
        setStatusModal(prev => ({ ...prev, isOpen: false }));
      }, 3000);

    } catch (error) {
      console.error("Report generation failed:", error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'فشل تصدير التقرير',
        message: 'عذراً، حدث خطأ فني أثناء محاولة توليد الكشف الموحد. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Loading state handled globally in App.tsx or implicitly by being an empty array initially

  return (
    <div className="view-container">
      {/* Background Patterns (Subtle) */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>


      {/* Premium Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 transition-all relative z-10 text-right">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 shrink-0">
              <Truck size={20} className="md:w-[22px] md:h-[22px]" />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-brand-dark">شركاء النجاح</h1>
          </div>
          <p className="text-brand-dark/40 font-bold pr-1 text-xs md:text-sm">إدارة شاملة للموردين، التكاليف، وحركة التوريد</p>
        </div>

        <div className="grid grid-cols-1 sm:flex items-center gap-4 w-full xl:w-auto">
          <button
            onClick={() => generateReport()}
            className="group flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-brand-dark border-2 border-brand-primary/10 px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black shadow-sm hover:border-brand-primary active:scale-95 transition-all text-sm md:text-base"
          >
            <FileText size={20} className="text-brand-primary group-hover:rotate-6 transition-transform" />
            الكشف العام
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-dark text-white px-6 md:px-10 py-3 md:py-4 rounded-2xl font-black shadow-xl shadow-brand-primary/20 active:scale-95 transition-all group text-sm md:text-base"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> إضافة مورد جديد
          </button>
        </div>
      </div>

      {/* Top Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-brand-dark to-brand-primary p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-125"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-white/60 text-xs font-black uppercase tracking-widest block mb-2">إجمالي المصروفات على الموردين</span>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {formatCurrency(totalExpenses, settings.currency)}
              </h3>
              <div className="flex items-center gap-2 mt-4 px-3 py-1 bg-white/10 w-fit rounded-full border border-white/5">
                <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
                <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">ميزانية المشتريات الكلية</span>
              </div>
            </div>
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-brand-accent shadow-2xl">
              <DollarSign size={40} />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-brand-primary/5 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-brand-dark/30 text-xs font-black uppercase tracking-widest block mb-2">عدد الشركاء المعتمدين</span>
              <h3 className="text-4xl font-black text-brand-dark tracking-tighter">{suppliers.length}</h3>
              <p className="text-brand-primary font-bold text-xs mt-2">علاقات توريد نشطة</p>
            </div>
            <div className="w-20 h-20 bg-brand-light/30 rounded-3xl flex items-center justify-center text-brand-primary">
              <Users size={40} />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-brand-primary/5 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-brand-dark/30 text-xs font-black uppercase tracking-widest block mb-2">مصاريف الفلتر المختار</span>
              <h3 className="text-4xl font-black text-brand-primary tracking-tighter">{formatCurrency(filteredExpenses, settings.currency)}</h3>
              <p className="text-orange-500 font-bold text-xs mt-2">بناءً على التصنيف الحالي</p>
            </div>
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500">
              <TrendingUp size={40} />
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Filter & Search */}
      <div className="bg-white p-6 rounded-[3.5rem] shadow-xl border border-brand-primary/5 mb-10 flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-primary/30" size={20} />
          <input
            type="text"
            placeholder="البحث عن مورد، سلعة، أو شركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-cream/30 border-2 border-brand-primary/5 rounded-3xl py-5 pr-14 pl-6 outline-none focus:border-brand-primary/20 transition-all font-black text-brand-dark"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
            <button
              key={freq}
              onClick={() => setActiveFrequency(freq)}
              className={`px-8 py-5 rounded-[1.8rem] font-black whitespace-nowrap transition-all flex items-center gap-2 ${activeFrequency === freq ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105' : 'bg-gray-50 text-brand-dark/40 hover:bg-brand-light/30'}`}
            >
              {freq === 'all' ? 'جميع الموردين' : freq === 'daily' ? 'موردين يوميين' : freq === 'weekly' ? 'موردين أسبوعيين' : freq === 'monthly' ? 'موردين شهريين' : 'موردين سنويين'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-[4rem] p-10 shadow-xl border border-transparent hover:border-brand-primary/20 hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${supplier.frequency === 'daily' ? 'bg-green-500' : supplier.frequency === 'weekly' ? 'bg-blue-500' : supplier.frequency === 'monthly' ? 'bg-orange-500' : 'bg-brand-dark'}`}></div>

            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-brand-cream rounded-3xl flex items-center justify-center text-brand-primary shadow-inner">
                  <Truck size={36} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-dark tracking-tight">{supplier.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-full">
                      {supplier.category}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full">
                      {supplier.frequency === 'daily' ? 'توريد يومي' : supplier.frequency === 'weekly' ? 'توريد أسبوعي' : supplier.frequency === 'monthly' ? 'توريد شهري' : 'توريد سنوي'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(supplier)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-brand-primary transition-all">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => handleDeleteClick(supplier.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-400 font-bold text-xs">السلعة الموردة:</span>
                <span className="font-black text-brand-dark">{supplier.suppliedItem}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-400 font-bold text-xs">آخر تاريخ توريد:</span>
                <span className="font-black text-brand-dark">{supplier.lastSupplyDate}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-400 font-bold text-xs">سعر الوحدة:</span>
                <span className="font-black text-brand-primary">{formatCurrency(supplier.costPerUnit, settings.currency)}</span>
              </div>
            </div>

            <div className="bg-brand-dark text-white p-8 rounded-[2.5rem] relative overflow-hidden group/card shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[4rem] transition-transform group-hover/card:scale-110"></div>
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest block mb-2">إجمالي قيمة البضائع الموردة منه</span>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black text-brand-accent tracking-tighter">
                  {formatCurrency(supplier.totalPaid, settings.currency)}
                </h4>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-dashed border-gray-100 flex gap-4">
              <a href={`tel:${supplier.phone}`} className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-50 text-green-600 rounded-2xl font-black hover:bg-green-600 hover:text-white transition-all">
                <Phone size={18} /> اتصل بالمورد
              </a>
              <button onClick={() => generateReport()} className="w-14 h-14 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl hover:bg-brand-primary hover:text-white transition-all">
                <FileText size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="flex flex-col items-center justify-center p-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-gold-100">
          <div className="w-40 h-40 bg-brand-light/20 rounded-full flex items-center justify-center text-brand-primary/20 mb-8 animate-pulse">
            <Truck size={80} />
          </div>
          <h3 className="text-3xl font-black text-brand-dark mb-4">لا يوجد موردين بهذا الاسم</h3>
          <p className="text-brand-dark/40 font-bold max-w-md">يرجى التأكد من كتابة الاسم بشكل صحيح أو تغيير تصنيف البحث المختار</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[500] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="p-10 bg-brand-primary text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md border border-white/10">
                  <Truck size={40} />
                </div>
                <div>
                  <h2 className="text-3xl font-black mb-1">{editingSupplier ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}</h2>
                  <p className="text-white/60 font-black text-xs uppercase tracking-widest">{editingSupplier ? 'Update Existing Partner' : 'Onboard New Supply Partner'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-white/10"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">اسم المورد / الشركة</label>
                  <input
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                    placeholder="أدخل الاسم الرباعي أو اسم الشركة..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">تصنيف التوريد</label>
                  <select
                    value={formData.category || 'قهوة'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark appearance-none"
                  >
                    <option value="قهوة">قهوة وبن</option>
                    <option value="البان">ألبان ومشتقاتها</option>
                    <option value="مخبوزات">مخبوزات وحلويات</option>
                    <option value="تعبئة">مواد تعبئة وتغليف</option>
                    <option value="محاصيل">محاصيل زراعية</option>
                    <option value="أخرى">تصنيفات أخرى</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">رقم الهاتف</label>
                  <input
                    required
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                    placeholder="07XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">البريد الإلكتروني</label>
                  <input
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                    placeholder="example@mail.com"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">السلعة الرئيسية</label>
                  <input
                    required
                    value={formData.suppliedItem || ''}
                    onChange={e => setFormData({ ...formData, suppliedItem: e.target.value })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                    placeholder="مثال: حبيبات بن كولومبي"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">سعر الوحدة ({settings.currency})</label>
                  <input
                    required
                    type="number"
                    value={formData.costPerUnit || 0}
                    onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">إجمالي المسحوبات ({settings.currency})</label>
                  <input
                    type="number"
                    value={formData.totalPaid || 0}
                    onChange={e => setFormData({ ...formData, totalPaid: Number(e.target.value) })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">تاريخ آخر توريد</label>
                  <input
                    type="date"
                    value={formData.lastSupplyDate || ''}
                    onChange={e => setFormData({ ...formData, lastSupplyDate: e.target.value })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">وتيرة التوريد</label>
                  <select
                    value={formData.frequency || 'monthly'}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark appearance-none"
                  >
                    <option value="daily">توريد يومي</option>
                    <option value="weekly">توريد أسبوعي</option>
                    <option value="monthly">توريد شهري</option>
                    <option value="yearly">توريد سنوي</option>
                  </select>
                </div>
              </div>

              <div className="pt-10 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-6 rounded-[2.2rem] bg-gray-50 text-brand-dark/40 font-black hover:bg-gray-100 transition-all active:scale-95 border-2 border-transparent"
                >
                  إلغاء التوريد
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-6 rounded-[2.2rem] bg-brand-primary text-white font-black shadow-2xl shadow-brand-primary/20 hover:bg-brand-dark transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Check size={24} /> {editingSupplier ? 'حفظ التعديلات' : 'تأكيد الإضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={() => isDeleting && handleDeleteConfirmed(isDeleting)}
        title="هل أنت متأكد من حذف المورد؟"
        description="سيتم حذف كافة بيانات هذا المورد وتاريخ التوريد الخاص به بشكل نهائي من النظام، ولا يمكن التراجع عن هذا الإجراء."
      />

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

export default SuppliersView;
