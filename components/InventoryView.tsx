
import React, { useState } from 'react';
import { MenuItem } from '../types';
import { Package, Search, Filter, Plus, X, Tag, DollarSign, Coffee, Trash2, AlertTriangle, Edit, Layers, FileText, QrCode, ArrowLeft, Check } from 'lucide-react';
import DigitalMenuModal from './DigitalMenuModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface InventoryViewProps {
  products: MenuItem[];
  onAddProduct: (item: MenuItem) => void;
  onUpdateProduct: (item: MenuItem) => void;
  onDeleteProduct: (id: string) => void;
  lowStockThreshold: number;
  storeName: string;
}

const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  lowStockThreshold = 10,
  storeName
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    notes: ''
  });

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter products based on search query, category, and stock status
  const filteredProducts = products.filter(product => {
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

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', category: '', stock: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: MenuItem) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      notes: product.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category || !formData.stock) return;

    const priceVal = parseFloat(formData.price);
    const stockVal = parseInt(formData.stock);

    if (editingId) {
      // Update existing
      onUpdateProduct({
        id: editingId,
        name: formData.name,
        price: priceVal,
        category: formData.category,
        stock: stockVal,
        notes: formData.notes
      });
    } else {
      // Add new
      onAddProduct({
        id: Date.now().toString(),
        name: formData.name,
        price: priceVal,
        category: formData.category,
        stock: stockVal,
        notes: formData.notes
      });
    }

    setFormData({ name: '', price: '', category: '', stock: '', notes: '' });
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteProduct(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex-1 p-8 bg-brand-cream overflow-y-auto animate-in fade-in slide-in-from-bottom-4 relative no-scrollbar">
      {/* Background Patterns (Subtle) */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-5 pointer-events-none -translate-x-1/2 -translate-y-1/2">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4 rotate-45">
        <img src="/branding/afia_logo.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">إدارة المخزون</h1>
          <p className="text-gray-500">متابعة المنتجات وحالة المخزون</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsMenuModalOpen(true)}
            className="bg-white border-2 border-brand-primary/20 text-brand-primary px-6 py-3 rounded-2xl transition-all shadow-sm flex items-center gap-2 font-black hover:border-brand-primary hover:bg-brand-primary/5 active:scale-95"
          >
            <QrCode size={20} />
            إنشاء منيو إلكتروني
          </button>
          <button
            onClick={openAddModal}
            className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-2xl transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-2 font-black active:scale-95"
          >
            <Plus size={20} />
            إضافة منتج جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gold-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="بحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gold-400 outline-none transition-all text-coffee-900 font-medium placeholder-gray-400"
            />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-1 md:pb-0">
            {/* Category Filter */}
            <div className="relative shrink-0">
              <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-full pl-4 pr-10 py-3 bg-gray-50 rounded-xl text-coffee-900 font-bold border-none outline-none focus:ring-2 focus:ring-gold-400 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="All">جميع التصنيفات</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div className="relative shrink-0">
              <AlertTriangle className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="h-full pl-4 pr-10 py-3 bg-gray-50 rounded-xl text-coffee-900 font-bold border-none outline-none focus:ring-2 focus:ring-gold-400 appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="All">جميع الحالات</option>
                <option value="Low">مخزون منخفض</option>
                <option value="In Stock">متوفر</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gold-50 text-coffee-900">
              <tr>
                <th className="px-6 py-4 text-right">المعرف</th>
                <th className="px-6 py-4 text-right">المنتج</th>
                <th className="px-6 py-4 text-right">التصنيف</th>
                <th className="px-6 py-4 text-right">السعر</th>
                <th className="px-6 py-4 text-right">المخزون</th>
                <th className="px-6 py-4 text-right">الحالة</th>
                <th className="px-6 py-4 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-5">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const stock = product.stock;
                  const isLowStock = stock <= lowStockThreshold;
                  const status = isLowStock ? 'منخفض' : 'متوفر';
                  const statusColor = isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">#{product.id.slice(-4)}</td>
                      <td className="px-6 py-4 font-bold text-coffee-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold-100 text-gold-800 rounded-lg flex items-center justify-center text-lg">
                          ☕
                        </div>
                        <div>
                          <div>{product.name}</div>
                          {product.notes && <div className="text-xs text-gray-400 font-normal truncate max-w-[150px]">{product.notes}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold">{product.category}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-coffee-900">{product.price.toFixed(2)} $</td>
                      <td className="px-6 py-4 font-bold text-coffee-900">{stock} وحدة</td>
                      <td className="px-6 py-4">
                        <span className={`${statusColor} px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1`}>
                          {isLowStock && <AlertTriangle size={12} />}
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="تعديل المنتج"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setItemToDelete(product.id)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="opacity-30" />
                      <p>لا توجد نتائج مطابقة لبحثك</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
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

            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto no-scrollbar">
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/30 font-black text-xs">IQD</div>
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

      <DigitalMenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        products={products}
        storeName={storeName}
      />
    </div>
  );
};

export default InventoryView;
