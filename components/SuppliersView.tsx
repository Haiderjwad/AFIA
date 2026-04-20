
import React, { useState, useEffect } from 'react';
import {
  Truck, Phone, Mail, Package,
  CreditCard, Calendar, Search, Plus,
  MoreVertical, Edit3, Trash2, Download,
  FileText, User, Users, Filter, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { Supplier } from '../types';
import { firestoreService } from '../services/firestoreService';
import { CURRENCY } from '../constants';

const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchSuppliers = async () => {
      const data = await firestoreService.getSuppliers();
      setSuppliers(data);
      setLoading(false);
    };
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(s =>
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.suppliedItem.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (activeCategory === 'All' || s.category === activeCategory)
  );

  const categories = ['All', ...new Set(suppliers.map(s => s.category))];

  const generateReport = (supplier?: Supplier) => {
    const title = supplier ? `تقرير المورد: ${supplier.name}` : 'تقرير الموردين العام';
    alert(`جاري استخراج ${title}...\n(في نظام حقيقي، سيتم تحميل ملف PDF أو Excel هنا)`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-[#fdfaf7] overflow-y-auto" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-coffee-900 mb-2">إدارة الموردين</h1>
          <p className="text-gray-500 font-medium">متابعة التوريدات، التكاليف، ومعلومات الاتصال</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => generateReport()}
            className="flex items-center gap-2 bg-white border border-gold-200 text-coffee-900 px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-gold-50 transition-all"
          >
            <FileText size={18} /> استخراج كشف عام
          </button>
          <button className="flex items-center gap-2 bg-coffee-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-black transition-all">
            <Plus size={18} /> إضافة مورد جديد
          </button>
        </div>
      </div>

      {/* Analytics Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gold-100 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">إجمالي الموردين</p>
            <h3 className="text-2xl font-black text-coffee-900">{suppliers.length} مورد</h3>
          </div>
          <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gold-100 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">إجمالي المدفوعات للموردين</p>
            <h3 className="text-2xl font-black text-coffee-900">
              {suppliers.reduce((acc, s) => acc + s.totalPaid, 0).toLocaleString()} {CURRENCY}
            </h3>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gold-100 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">أكثر تصنيف توريداً</p>
            <h3 className="text-2xl font-black text-coffee-900">البن والمخازن</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gold-100 mb-8 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن مورد، هاتف، أو سلعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 outline-none focus:ring-2 focus:ring-gold-500 transition-all font-bold text-coffee-900"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-coffee-900 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              {cat === 'All' ? 'الكل' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="group bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 hover:border-gold-300 transition-all hover:shadow-2xl relative overflow-hidden">
            {/* Decorative Background Icon */}
            <Truck className="absolute -left-4 -bottom-4 text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity" size={160} />

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-100 to-gold-200 rounded-3xl flex items-center justify-center text-gold-700 shadow-inner">
                  <Truck size={32} />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-coffee-900 line-clamp-1">{supplier.name}</h3>
                  <span className="bg-coffee-50 text-coffee-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    {supplier.category}
                  </span>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-3xl">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold mb-1 uppercase">
                  <Package size={12} /> السلعة الموردة
                </div>
                <p className="text-sm font-black text-coffee-900">{supplier.suppliedItem}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold mb-1 uppercase">
                  <CreditCard size={12} /> التكلفة / الوحدة
                </div>
                <p className="text-sm font-black text-coffee-900">{supplier.costPerUnit} {CURRENCY}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold mb-1 uppercase">
                  <ArrowUpRight size={12} /> الكمية الموردة
                </div>
                <p className="text-sm font-black text-coffee-900">{supplier.stockProvided} قطعة</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl">
                <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold mb-1 uppercase">
                  <Calendar size={12} /> آخر توريد
                </div>
                <p className="text-sm font-black text-coffee-900">{supplier.lastSupplyDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-50">
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[10px] text-gray-400 font-bold uppercase">إجمالي المسحوبات</span>
                <span className="text-2xl font-black text-coffee-900">{supplier.totalPaid.toLocaleString()} {CURRENCY}</span>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${supplier.phone}`} className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm">
                  <Phone size={20} />
                </a>
                <button className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Mail size={20} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => generateReport(supplier)}
                className="flex-1 py-4 bg-white border border-gray-100 text-coffee-900 rounded-2xl text-xs font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> استخراج كشف
              </button>
              <button className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-lg">
                <Edit3 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
            <Truck size={64} />
          </div>
          <h3 className="text-2xl font-black text-coffee-900 mb-2">لا يوجد موردين مطابقين</h3>
          <p className="text-gray-400">تأكد من كتابة الاسم بشكل صحيح أو جرب تصنيف آخـــر</p>
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
