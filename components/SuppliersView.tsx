import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Truck, Phone, Mail, Package,
  CreditCard, Calendar, Search, Plus,
  MoreVertical, Edit3, Trash2, Download,
  FileText, Users, TrendingUp, X, Check,
  AlertCircle, ArrowRight
} from 'lucide-react';
import { Supplier } from '../types';
import { firestoreService } from '../services/firestoreService';
import { CURRENCY } from '../constants';
import { soundService } from '../services/soundService';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    const data = await firestoreService.getSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
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
        lastSupplyDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await firestoreService.updateSupplier(editingSupplier.id, formData);
      } else {
        await firestoreService.addSupplier(formData as Supplier);
      }
      soundService.playSuccess();
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      soundService.playError();
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    try {
      await firestoreService.deleteSupplier(id);
      soundService.playSuccess();
      fetchSuppliers();
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
    (activeCategory === 'All' || s.category === activeCategory)
  );

  const categories = ['All', ...new Set(suppliers.map(s => s.category))];

  const generateReport = async (supplier?: Supplier) => {
    setIsExporting(true);

    // Aesthetic delay for the professional dialog
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Afia_Suppliers_Report_${new Date().toISOString().split('T')[0]}.pdf`);

      setIsExporting(false);
      soundService.playSuccess();
    } catch (error) {
      console.error("Report generation failed:", error);
      setIsExporting(false);
      soundService.playError();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20 bg-brand-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <p className="text-brand-primary font-black animate-pulse">جاري تحميل بيانات الموردين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-brand-cream overflow-y-auto no-scrollbar relative" dir="rtl">
      {/* Background Patterns (Subtle) */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>


      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
              <Truck size={22} />
            </div>
            <h1 className="text-4xl font-black text-brand-dark">شركاء النجاح</h1>
          </div>
          <p className="text-brand-dark/40 font-bold pr-1">إدارة شاملة للموردين، التكاليف، وحركة التوريد</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => generateReport()}
            className="group flex items-center gap-3 bg-white text-brand-dark border-2 border-brand-primary/10 px-8 py-4 rounded-2xl font-black shadow-sm hover:border-brand-primary active:scale-95 transition-all"
          >
            <FileText size={20} className="text-brand-primary group-hover:rotate-6 transition-transform" />
            الكشف العام
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-3 bg-brand-primary hover:bg-brand-dark text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-brand-primary/20 active:scale-95 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> إضافة مورد جديد
          </button>
        </div>
      </div>

      {/* Modern Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-brand-primary/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">الموردين المسجلين</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-brand-dark">{suppliers.length}</h3>
                <span className="text-brand-dark/20 text-sm font-bold">مؤسسة</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-brand-light/30 text-brand-primary rounded-[1.5rem] flex items-center justify-center shadow-inner">
              <Users size={30} />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-brand-primary/5 border border-brand-primary/5 relative overflow-hidden group text-right">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-brand-accent/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">إجمالي المسحوبات</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-brand-dark">
                  {suppliers.reduce((acc, s) => acc + s.totalPaid, 0).toLocaleString()}
                </h3>
                <span className="text-brand-dark/20 text-sm font-bold">{CURRENCY}</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-brand-accent/10 text-brand-accent rounded-[1.5rem] flex items-center justify-center shadow-inner">
              <TrendingUp size={30} />
            </div>
          </div>
        </div>

        <div className="bg-brand-dark p-8 rounded-[3rem] shadow-xl shadow-brand-dark/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[5rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col text-white">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">توريد اللحظة</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black">{suppliers[0]?.suppliedItem || 'لا يوجد'}</h3>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/10 text-brand-accent rounded-[1.5rem] flex items-center justify-center backdrop-blur-md shadow-lg">
              <Package size={30} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Section */}
      <div className="bg-white p-6 rounded-[3.5rem] shadow-xl shadow-brand-primary/5 border border-brand-primary/5 mb-10 flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-primary/30" size={20} />
          <input
            type="text"
            placeholder="ابحث بالاسم، السلعة، أو التصنيف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-brand-primary/5 rounded-3xl py-5 pr-14 pl-6 outline-none focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all font-black text-brand-dark placeholder-brand-dark/20 shadow-sm"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-5 rounded-[1.5rem] font-black whitespace-nowrap transition-all flex items-center gap-2 ${activeCategory === cat ? 'bg-brand-primary text-white shadow-2xl shadow-brand-primary/20 scale-105' : 'bg-white border border-brand-primary/5 text-brand-dark/40 hover:bg-brand-light/30 shadow-sm'}`}
            >
              {cat === 'All' ? 'كل الموردين' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Premium Suppliers Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 pb-20">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-gold-100/50 hover:border-brand-primary transition-all hover:shadow-2xl hover:-translate-y-2 group relative overflow-hidden flex flex-col">

            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-primary/5 rounded-br-[5rem] -ml-8 -mt-8 group-hover:scale-125 transition-transform duration-500"></div>

            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-dark rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 transform group-hover:rotate-3 transition-transform">
                  <Truck size={36} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-brand-dark group-hover:text-brand-primary transition-colors">{supplier.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
                    <span className="text-brand-primary text-[10px] font-black uppercase tracking-widest">{supplier.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(supplier)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-brand-light/30 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteClick(supplier.id)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10 flex-1">
              <div className="bg-brand-cream/50 p-5 rounded-[2rem] border border-brand-primary/5 group-hover:border-brand-primary/10 transition-colors">
                <div className="flex items-center gap-2 text-brand-primary/40 text-[10px] font-black mb-2 uppercase tracking-tighter">
                  <Package size={14} /> السلعة الموردة
                </div>
                <p className="text-md font-black text-brand-dark pr-1">{supplier.suppliedItem}</p>
              </div>
              <div className="bg-brand-cream/50 p-5 rounded-[2rem] border border-brand-primary/5 group-hover:border-brand-primary/10 transition-colors">
                <div className="flex items-center gap-2 text-brand-primary/40 text-[10px] font-black mb-2 uppercase tracking-tighter">
                  <CreditCard size={14} /> سعر الوحدة
                </div>
                <p className="text-md font-black text-brand-dark pr-1">{supplier.costPerUnit} {CURRENCY}</p>
              </div>
              <div className="bg-brand-cream/50 p-5 rounded-[2rem] border border-brand-primary/5 group-hover:border-brand-primary/10 transition-colors">
                <div className="flex items-center gap-2 text-brand-primary/40 text-[10px] font-black mb-2 uppercase tracking-tighter">
                  <Calendar size={14} /> آخر توريد
                </div>
                <p className="text-md font-black text-brand-dark pr-1">{supplier.lastSupplyDate}</p>
              </div>
              <div className="bg-brand-cream/50 p-5 rounded-[2rem] border border-brand-primary/5 group-hover:border-brand-primary/10 transition-colors">
                <div className="flex items-center gap-2 text-brand-primary/40 text-[10px] font-black mb-2 uppercase tracking-tighter">
                  <TrendingUp size={14} /> الكمية الإجمالية
                </div>
                <p className="text-md font-black text-brand-dark pr-1">{supplier.stockProvided} قطعة</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 pb-8 border-b border-dashed border-gray-100">
              <div className="flex flex-col">
                <span className="text-[10px] text-brand-dark/30 font-black uppercase tracking-widest mb-1">صافي المدفوعات</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-brand-dark">{supplier.totalPaid.toLocaleString()}</span>
                  <span className="text-xs text-brand-primary font-black uppercase">{CURRENCY}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <a href={`tel:${supplier.phone}`} className="w-14 h-14 bg-green-50 text-green-600 rounded-[1.5rem] flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-xl shadow-green-600/5 group/btn">
                  <Phone size={22} className="group-hover/btn:scale-110 transition-transform" />
                </a>
                <a href={`mailto:${supplier.email}`} className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-600/5 group/btn">
                  <Mail size={22} className="group-hover/btn:scale-110 transition-transform" />
                </a>
              </div>
            </div>

            <button
              onClick={() => generateReport(supplier)}
              className="w-full py-5 bg-brand-cream border-2 border-brand-primary/5 text-brand-dark rounded-[1.8rem] font-black text-sm hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all flex items-center justify-center gap-3 group/report shadow-sm active:scale-95"
            >
              <Download size={18} className="group-hover/report:translate-y-1 transition-transform" /> استخراج الكشف الضريبي
            </button>
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
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">سعر الوحدة ({CURRENCY})</label>
                  <input
                    required
                    type="number"
                    value={formData.costPerUnit || 0}
                    onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                    className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-brand-dark/60 text-xs font-black uppercase mr-2 tracking-widest">إجمالي المسحوبات ({CURRENCY})</label>
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

      {/* Professional Export Dialog */}
      {isExporting && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-dark/60 backdrop-blur-xl animate-in fade-in duration-500 px-4">
          <div className="bg-white rounded-[4rem] p-16 shadow-5xl max-w-md w-full text-center space-y-10 animate-in zoom-in duration-700 border-[12px] border-brand-primary/5 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mt-32"></div>

            <div className="relative">
              <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
                <div className="absolute inset-0 border-[6px] border-brand-primary/10 rounded-[2.5rem]"></div>
                <div className="absolute inset-0 border-[6px] border-brand-primary rounded-[2.5rem] border-t-transparent animate-spin duration-1000"></div>
                <div className="bg-brand-primary w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-primary/40 animate-pulse">
                  <FileText size={40} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-black text-brand-dark tracking-tighter">جاري إعداد التقرير</h3>
              <p className="text-sm font-bold text-gray-500 leading-relaxed">
                نقوم الآن بذكاء عافية بتنظيم كشوفات الموردين وتدقيق البيانات للحصول على ملف PDF احترافي وعالي الدقة.
              </p>
            </div>

            <div className="flex gap-2 justify-center items-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full bg-brand-primary/20 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>

            <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest pt-4">
              Al Afia Enterprise Reporting Engine
            </div>
          </div>
        </div>
      )}

      {/* Hidden Report Template (For html2canvas) */}
      <div className="fixed -left-[2000px] top-0">
        <div
          ref={reportRef}
          className="w-[210mm] bg-white p-[20mm] font-sans"
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b-4 border-brand-dark pb-8 mb-10">
            <div className="flex items-center gap-6">
              <img src="/branding/afia_logo.png" className="w-20 h-20 object-contain" alt="Afia" />
              <div>
                <h1 className="text-4xl font-black text-brand-dark">نظام عافية الذكي</h1>
                <p className="text-brand-primary font-bold">كشف الموردين والشركات المعتمدة</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-400 font-bold">التاريخ: {new Date().toLocaleDateString('ar-IQ')}</p>
              <p className="text-sm text-gray-400 font-bold">الوقت: {new Date().toLocaleTimeString('ar-IQ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <p className="text-xs text-gray-400 font-black mb-1 uppercase">إجمالي عدد الموردين</p>
              <p className="text-3xl font-black text-brand-dark">{suppliers.length} مورد</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <p className="text-xs text-gray-400 font-black mb-1 uppercase">مجموع المستحقات المدفوعة</p>
              <p className="text-3xl font-black text-brand-dark">{suppliers.reduce((acc, s) => acc + s.totalPaid, 0).toLocaleString()} {CURRENCY}</p>
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-dark text-white">
                <th className="p-4 text-right rounded-tr-2xl">المورد</th>
                <th className="p-4 text-right">السلعة</th>
                <th className="p-4 text-right">سعر الوحدة</th>
                <th className="p-4 text-right">آخر توريد</th>
                <th className="p-4 text-right rounded-tl-2xl">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-4 border-b border-gray-100 font-bold">{s.name}</td>
                  <td className="p-4 border-b border-gray-100">{s.suppliedItem}</td>
                  <td className="p-4 border-b border-gray-100 font-bold">{s.costPerUnit.toLocaleString()}</td>
                  <td className="p-4 border-b border-gray-100">{s.lastSupplyDate}</td>
                  <td className="p-4 border-b border-gray-100 font-black text-brand-primary">{s.totalPaid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-20 pt-10 border-t border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-400 font-bold capitalize">Generated by Al Afia Smart Business Solutions - Management Report System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersView;
