
import React, { useState } from 'react';
import { MenuItem } from '../types';
import { Package, Search, Filter, Plus, X, Tag, DollarSign, Coffee, Trash2, AlertTriangle, Edit, Layers, FileText, QrCode } from 'lucide-react';
import DigitalMenuModal from './DigitalMenuModal';

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
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">إدارة المخزون</h1>
          <p className="text-gray-500">متابعة المنتجات وحالة المخزون</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-coffee-900 hover:bg-coffee-800 text-white px-6 py-3 rounded-xl transition-colors shadow-lg flex items-center gap-2"
        >
          <Plus size={20} />
          إضافة منتج جديد
        </button>
        <button
          onClick={() => setIsMenuModalOpen(true)}
          className="bg-white border-2 border-coffee-900 text-coffee-900 px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 font-bold hover:bg-gold-50"
        >
          <QrCode size={20} />
          إنشاء منيو إلكتروني
        </button>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gold-50 shrink-0">
              <h2 className="text-xl font-bold text-coffee-900">
                {editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Coffee size={16} className="text-gold-600" />
                  اسم المنتج
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-coffee-800 text-white placeholder-gray-400 border border-coffee-900 focus:border-transparent focus:ring-2 focus:ring-gold-400 outline-none transition-all"
                  placeholder="مثال: لاتيه فانيلا"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Tag size={16} className="text-gold-600" /> التصنيف
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-coffee-800 text-white border border-coffee-900 focus:border-transparent focus:ring-2 focus:ring-gold-400 outline-none transition-all"
                >
                  <option value="">اختر التصنيف</option>
                  <option value="Coffee">قهوة (Coffee)</option>
                  <option value="Tea">شاي (Tea)</option>
                  <option value="Dessert">حلى (Dessert)</option>
                  <option value="Bakery">مخبوزات (Bakery)</option>
                  <option value="Food">طعام (Food)</option>
                  <option value="Juice">عصائر (Juice)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <DollarSign size={16} className="text-gold-600" /> السعر
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-coffee-800 text-white placeholder-gray-400 border border-coffee-900 focus:border-transparent focus:ring-2 focus:ring-gold-400 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Layers size={16} className="text-gold-600" /> المخزون
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-coffee-800 text-white placeholder-gray-400 border border-coffee-900 focus:border-transparent focus:ring-2 focus:ring-gold-400 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText size={16} className="text-gold-600" /> ملاحظات المنتج
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-coffee-800 text-white placeholder-gray-400 border border-coffee-900 focus:border-transparent focus:ring-2 focus:ring-gold-400 outline-none transition-all resize-none h-24"
                  placeholder="أضف وصفاً أو ملاحظات حول المنتج..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-colors shadow-lg bg-coffee-900 hover:bg-coffee-800"
                >
                  {editingId ? 'حفظ التغييرات' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">حذف المنتج؟</h3>
            <p className="text-gray-500 mb-6">هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

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
