
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MenuItem, AppSettings } from '../types';
import { Package, Search, Filter, Plus, X, Tag, DollarSign, Coffee, Trash2, AlertTriangle, Edit, Layers, FileText, QrCode, ArrowLeft, Check, Coins } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import StatusModal from './StatusModal';

interface InventoryViewProps {
  products: MenuItem[];
  onAddProduct: (item: MenuItem) => Promise<void>;
  onUpdateProduct: (item: MenuItem) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  lowStockThreshold: number;
  storeName: string;
  settings: AppSettings;
  canManage?: boolean;
  initialSearchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  lowStockThreshold = 10,
  storeName,
  settings,
  canManage = true,
  initialSearchQuery = '',
  onSearchChange
}) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Status Modal State
  const [statusConfig, setStatusConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'loading';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('All');

  // Professional Sync: Only sync when initialSearchQuery actually changes from the outside
  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Professional cleanup: Reset search when leaving the section
  useEffect(() => {
    return () => {
      if (onSearchChange) onSearchChange('');
    };
  }, [onSearchChange]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    notes: ''
  });

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Memoized categories for filter dropdown - Prevents recalculation on every render
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  // Memoized Filtered Products - Optimizes search and filter performance
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Search Query
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category Filter
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

      // 3. Stock Status Filter
      const isLow = product.stock <= lowStockThreshold;
      const matchesStock = stockStatus === 'All' ||
        (stockStatus === 'Low' && isLow) ||
        (stockStatus === 'In Stock' && !isLow);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockStatus, lowStockThreshold]);

  const openAddModal = useCallback(() => {
    setEditingId(null);
    setFormData({ name: '', price: '', category: '', stock: '', notes: '' });
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((product: MenuItem) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      notes: product.notes || ''
    });
    setIsModalOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || !formData.stock) return;

    setIsProcessing(true);
    setStatusConfig({
      isOpen: true,
      type: 'loading',
      title: editingId ? 'جاري تحديث البيانات' : 'جاري إضافة المنتج',
      message: 'يتم الآن مزامنة البيانات سحابياً... في حال ضعف الإنترنت سيتم إتمام العملية تلقائياً عند استقرار الاتصال.'
    });

    const priceVal = parseFloat(formData.price);
    const stockVal = parseInt(formData.stock);

    try {
      if (editingId) {
        // Update existing
        await onUpdateProduct({
          id: editingId,
          name: formData.name,
          price: priceVal,
          category: formData.category,
          stock: stockVal,
          notes: formData.notes
        });
        setStatusConfig({
          isOpen: true,
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: `تم حفظ التعديلات على منتج "${formData.name}" في السحابة بنجاح.`
        });
      } else {
        // Add new
        await onAddProduct({
          id: '',
          name: formData.name,
          price: priceVal,
          category: formData.category,
          stock: stockVal,
          notes: formData.notes
        });
        setStatusConfig({
          isOpen: true,
          type: 'success',
          title: 'تم الإضافة بنجاح',
          message: `تم إدراج منتج "${formData.name}" في قائمة المنتجات بنجاح.`
        });
      }
      setIsModalOpen(false);
      setFormData({ name: '', price: '', category: '', stock: '', notes: '' });

      setTimeout(() => {
        setStatusConfig(prev => ({ ...prev, isOpen: false }));
      }, 2000);

    } catch (error) {
      console.error("Inventory error:", error);
      setStatusConfig({
        isOpen: true,
        type: 'error',
        title: 'فشلت العملية',
        message: 'حدث خطأ غير متوقع أثناء محاولة حفظ البيانات، يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      setIsProcessing(true);
      setStatusConfig({
        isOpen: true,
        type: 'loading',
        title: 'جاري حذف المنتج',
        message: 'يتم الآن إزالة السجل نهائياً من قاعدة البيانات السحابية، يرجى الانتظار...'
      });

      try {
        await onDeleteProduct(itemToDelete);
        setStatusConfig({
          isOpen: true,
          type: 'success',
          title: 'تم الحذف نهائياً',
          message: 'تمت إزالة المنتج من النظام ومن جميع الفروع والمزامنة السحابية.'
        });

        setTimeout(() => {
          setStatusConfig(prev => ({ ...prev, isOpen: false }));
        }, 2000);
      } catch (error) {
        setStatusConfig({
          isOpen: true,
          type: 'error',
          title: 'فشل الحذف',
          message: 'لم نتمكن من حذف المنتج حالياً، يرجى التأكد من اتصال الإنترنت.'
        });
      } finally {
        setIsProcessing(false);
        setItemToDelete(null);
      }
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

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 transition-all relative z-10">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-brand-dark mb-2 tracking-tighter flex items-center gap-3">
            <div className="w-2 h-10 bg-brand-primary rounded-full"></div>
            حوكمة الأصول والمخزون
          </h1>
          <p className="text-brand-dark/40 font-bold text-xs md:text-sm">نظام تتبع المنتجات الرقمية والمخزون السحابي</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          {canManage && (
            <button
              onClick={openAddModal}
              className="w-full lg:w-auto bg-brand-primary hover:bg-brand-secondary text-white px-10 py-3.5 rounded-[1.8rem] transition-all shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-3 font-black active:scale-95"
            >
              <Plus size={20} />
              إدراج أصل جديد
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[3.5rem] shadow-2xl border border-brand-primary/5 overflow-hidden transition-all duration-700 relative z-10">
        {/* Toolbar */}
        <div className="p-10 border-b border-gray-50 flex flex-col xl:flex-row gap-6 bg-gray-50/20">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
              <Search className="text-gray-300 group-focus-within:text-brand-primary transition-colors" size={24} />
            </div>
            <input
              type="text"
              placeholder="ابحث عن اسم المنتج، التصنيف، أو كود المعرف..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (onSearchChange) onSearchChange(val);
              }}
              className="w-full pr-16 pl-16 py-5 bg-white rounded-[2rem] border-2 border-transparent focus:border-brand-primary/20 focus:ring-8 focus:ring-brand-primary/5 outline-none transition-all text-brand-dark font-black placeholder-gray-200 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="absolute inset-y-0 left-0 pl-6 flex items-center text-gray-300 hover:text-red-500 transition-all hover:scale-110 active:scale-90 animate-in fade-in zoom-in duration-300"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="relative group">
              <Filter className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-primary/30 group-hover:text-brand-primary transition-colors pointer-events-none" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-full pr-14 pl-10 py-5 bg-white rounded-[1.8rem] text-brand-dark font-black border-2 border-transparent hover:border-brand-primary/10 outline-none focus:ring-8 focus:ring-brand-primary/5 appearance-none cursor-pointer min-w-[200px] shadow-sm transition-all"
              >
                <option value="All">جميع الأقسام</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <AlertTriangle className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-primary/30 group-hover:text-brand-primary transition-colors pointer-events-none" size={20} />
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="h-full pr-14 pl-10 py-5 bg-white rounded-[1.8rem] text-brand-dark font-black border-2 border-transparent hover:border-brand-primary/10 outline-none focus:ring-8 focus:ring-brand-primary/5 appearance-none cursor-pointer min-w-[200px] shadow-sm transition-all"
              >
                <option value="All">وضعية المخزون</option>
                <option value="Low">مخزون حرج ⚠️</option>
                <option value="In Stock">متوفر بالمخازن ✅</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto premium-scrollbar px-2">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-brand-dark/5 border-b border-brand-primary/10">
                <th className="px-8 py-6 text-[10px] font-black text-brand-secondary uppercase tracking-widest">المعرف</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-secondary uppercase tracking-widest">المنتج</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-secondary uppercase tracking-widest">التصنيف</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-secondary uppercase tracking-widest text-center">السعر</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-secondary uppercase tracking-widest text-center">المخزون</th>
                <th className="px-8 py-6 text-[10px] font-black text-brand-secondary uppercase tracking-widest text-center">الحالة</th>
                {canManage && <th className="px-8 py-6 text-[10px] font-black text-brand-secondary uppercase tracking-widest text-left">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={index}
                    lowStockThreshold={lowStockThreshold}
                    settings={settings}
                    canManage={canManage}
                    isHighlighted={!!(initialSearchQuery && product.name.toLowerCase().includes(initialSearchQuery.toLowerCase()))}
                    onEdit={openEditModal}
                    onDelete={setItemToDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center text-gray-300">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                        <Package size={48} className="opacity-20" />
                      </div>
                      <div>
                        <p className="font-black text-xl text-gray-400">لا توجد أصول مخزنية مطابقة</p>
                        <p className="text-sm font-bold opacity-60 mt-1">حاول استخدام كلمات بحث أخرى أو تصنيف مختلف</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] relative border border-white/20">
            <div className="px-10 py-8 border-b border-brand-primary/5 flex justify-between items-center bg-brand-light/20 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative">
                <h2 className="text-2xl font-black text-brand-dark">
                  {editingId ? 'تحديث بيانات المنتج' : 'إضافة منتج للسحابة'}
                </h2>
                <p className="text-[10px] text-brand-secondary font-black uppercase tracking-widest mt-1">Inventory Asset Intelligence</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center bg-white hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm text-brand-dark/20 relative z-10"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto premium-scrollbar">
              <div className="space-y-3">
                <label className="text-xs font-black text-brand-dark/40 uppercase tracking-tighter flex items-center gap-2">
                  <Coffee size={14} className="text-brand-primary" /> الاسم التجاري للمنتج
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-brand-dark"
                  placeholder="مثال: إسبريسو دوبل"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-brand-dark/40 uppercase tracking-tighter flex items-center gap-2">
                  <Tag size={14} className="text-brand-primary" /> تصنيف القائمة
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-brand-dark appearance-none"
                  >
                    <option value="">اختر التصنيف المناسب</option>
                    <option value="Coffee">☕ قهوة (Coffee)</option>
                    <option value="Tea">🍵 شاي (Tea)</option>
                    <option value="Dessert">🍰 حلى (Dessert)</option>
                    <option value="Bakery">🥐 مخبوزات (Bakery)</option>
                    <option value="Food">🍔 طعام (Food)</option>
                    <option value="Juice">🥤 عصائر (Juice)</option>
                  </select>
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                    <ArrowLeft size={16} className="-rotate-90" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-brand-dark/40 uppercase tracking-tighter flex items-center gap-2">
                    <DollarSign size={14} className="text-brand-primary" /> سعر البيع
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-brand-dark pr-12"
                      placeholder="0.00"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/30 font-black text-xs">{settings.currency}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-brand-dark/40 uppercase tracking-tighter flex items-center gap-2">
                    <Layers size={14} className="text-brand-primary" /> رصيد المخزن
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-brand-dark"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-brand-dark/40 uppercase tracking-tighter flex items-center gap-2">
                  <FileText size={14} className="text-brand-primary" /> تفاصيل إضافية
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-brand-dark resize-none h-24 no-scrollbar shadow-inner"
                  placeholder="أضف وصفاً تسويقياً أو ملاحظات للمطبخ..."
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="submit"
                  className="flex-[2] py-5 rounded-[1.5rem] text-white font-black text-lg hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 bg-brand-primary flex items-center justify-center gap-2 group"
                >
                  <Check size={24} className="group-hover:scale-125 transition-transform" />
                  {editingId ? 'تأكيد التعديلات' : 'إدراج المنتج للسحابة'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-gray-100 font-black text-gray-400 hover:text-brand-dark hover:bg-white hover:border-brand-primary/10 transition-all"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="حذف المنتج نهائياً؟"
        description="هل أنت متأكد من رغبتك في حذف هذا المنتج من المخزون؟ سيؤدي ذلك لإزالته من القائمة ومنيو العرض الإلكتروني فوراً."
      />

      <StatusModal
        isOpen={statusConfig.isOpen}
        onClose={() => setStatusConfig({ ...statusConfig, isOpen: false })}
        type={statusConfig.type}
        title={statusConfig.title}
        message={statusConfig.message}
      />

    </div>
  );
};

// Memoized row component for performance
interface ProductRowProps {
  product: MenuItem;
  index: number;
  lowStockThreshold: number;
  settings: AppSettings;
  canManage: boolean;
  isHighlighted: boolean;
  onEdit: (product: MenuItem) => void;
  onDelete: (id: string) => void;
}

const ProductRow = React.memo(({ product, index, lowStockThreshold, settings, canManage, isHighlighted, onEdit, onDelete }: ProductRowProps) => {
  const stock = product.stock;
  const isLowStock = stock <= lowStockThreshold;
  const statusLabel = isLowStock ? 'مخزون حرج' : 'متوفر بالمخزن';

  return (
    <tr
      style={{ animationDelay: `${Math.min(index, 20) * 0.05}s` }}
      className={`animate-row-entry group transition-all duration-300 hover:bg-brand-primary/5 ${isHighlighted ? 'bg-brand-primary/5 shadow-[inset_4px_0_0_0_#52B788]' : ''}`}
    >
      <td className="px-8 py-6">
        <span className="font-mono text-xs text-gray-400 opacity-50">#{product.id.slice(-6)}</span>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-6 bg-brand-light/30 text-brand-primary ${isHighlighted ? 'ring-4 ring-brand-primary/20' : ''}`}>
            {product.category === 'Coffee' ? '☕' : product.category === 'Tea' ? '🍵' : product.category === 'Dessert' ? '🍰' : product.category === 'Bakery' ? '🥐' : '🍔'}
          </div>
          <div>
            <div className="font-black text-brand-dark group-hover:text-brand-primary transition-colors">{product.name}</div>
            <div className="text-[10px] text-gray-400 font-bold opacity-60">أصول مخزنية معتمدة</div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">{product.category}</span>
      </td>
      <td className="px-8 py-6 text-center">
        <span className="font-black text-brand-dark text-lg">{formatCurrency(product.price, settings.currency)}</span>
      </td>
      <td className="px-8 py-6 text-center">
        <span className={`font-black text-md ${isLowStock ? 'text-red-500' : 'text-brand-primary'}`}>{stock} قطعة</span>
      </td>
      <td className="px-8 py-6">
        <div className="flex justify-center">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border shadow-sm ${isLowStock ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-green-50 text-green-700 border-green-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-red-600' : 'bg-green-600'}`}></div>
            {statusLabel}
          </span>
        </div>
      </td>
      {canManage && (
        <td className="px-8 py-6">
          <div className="flex justify-start gap-2 transition-opacity">
            <button
              onClick={() => onEdit(product)}
              className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
              title="تعديل"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
              title="حذف"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});

export default InventoryView;
