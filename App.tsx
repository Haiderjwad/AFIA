
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ReceiptPanel from './components/ReceiptPanel';
import InventoryView from './components/InventoryView';
import InvoicesView from './components/InvoicesView';
import CustomersView from './components/CustomersView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import { CartItem, MenuItem, Transaction, AppSettings } from './types';
import { CURRENCY, DEFAULT_SETTINGS } from './constants';
import { X, CheckCircle } from 'lucide-react';
import { db, seedDatabase } from './db';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [activeTab, setActiveTab] = useState('sales');
  const [settingsTab, setSettingsTab] = useState<'general' | 'payments'>('general');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Data State (Loaded from DB)
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Initialize DB and Load Data
  useEffect(() => {
    const initData = async () => {
        await seedDatabase();
        
        const allProducts = await db.products.toArray();
        const allTransactions = await db.transactions.toArray();
        const savedSettings = await db.settings.get('default');

        setProducts(allProducts);
        setTransactions(allTransactions.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        if (savedSettings) {
            setSettings(savedSettings);
        }
    };
    initData();
  }, []);

  // Update Settings Handler
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    // Save to DB
    await db.settings.put(newSettings);
    // Update State
    setSettings(newSettings);
  };

  // Authentication Logic
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    // Simple mock authentication
    if (email === 'admin@cafesun.com' && pass === 'admin123') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCart([]); // Clear cart on logout
    setActiveTab('sales'); // Reset tab
  };

  const handleSidebarNavigation = (tab: string) => {
    setActiveTab(tab);
    setIsProductMenuOpen(false); // Ensure product menu closes when navigating
  };

  // Calculate Low Stock Items
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= settings.lowStockThreshold);
  }, [products, settings.lowStockThreshold]);

  // Cart Logic
  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const decreaseQuantity = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const clearCart = () => setCart([]);

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'online') => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = total * (settings.taxRate / 100);
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      total: total + tax,
      status: 'completed',
      paymentMethod: paymentMethod
    };

    // 1. Save Transaction to DB
    await db.transactions.add(newTransaction);
    
    // 2. Update Stock in DB
    const updatedProducts = [...products];
    for (const cartItem of cart) {
        const product = updatedProducts.find(p => p.id === cartItem.id);
        if (product) {
            const newStock = Math.max(0, product.stock - cartItem.quantity);
            product.stock = newStock;
            await db.products.update(product.id, { stock: newStock });
        }
    }

    // 3. Update State
    setTransactions(prev => [newTransaction, ...prev]);
    setProducts(updatedProducts);
    setCart([]);
    setShowSuccessModal(true);

    // Hide success modal after 3 seconds
    setTimeout(() => {
        setShowSuccessModal(false);
    }, 3000);
  };

  const handleAddProduct = async (newProduct: MenuItem) => {
    // Save to DB
    await db.products.add(newProduct);
    // Update State
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
  };

  const handleUpdateProduct = async (updatedProduct: MenuItem) => {
    // Update DB
    await db.products.put(updatedProduct);
    // Update State
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
  };

  const handleDeleteProduct = async (id: string) => {
    // Delete from DB
    await db.products.delete(id);
    // Update State
    const allProducts = await db.products.toArray();
    setProducts(allProducts);
  };

  const handleDashboardNavigate = (view: string, subTab?: string) => {
      setActiveTab(view);
      setIsProductMenuOpen(false); // Also close menu when navigating from dashboard cards
      if (view === 'settings' && subTab) {
          setSettingsTab(subTab as 'general' | 'payments');
      } else {
          setSettingsTab('general');
      }
  };

  // View Routing
  const renderContent = () => {
    switch(activeTab) {
        case 'sales':
            return <Dashboard 
                      onProductClick={() => setIsProductMenuOpen(true)} 
                      onNavigate={handleDashboardNavigate} 
                      lowStockItems={lowStockItems}
                   />;
        case 'inventory':
            return <InventoryView 
                      products={products} 
                      onAddProduct={handleAddProduct} 
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct} 
                      lowStockThreshold={settings.lowStockThreshold}
                   />;
        case 'invoices': 
            return <InvoicesView transactions={transactions} />;
        case 'customers':
            return <CustomersView />;
        case 'reports':
            return <ReportsView transactions={transactions} />;
        case 'settings':
            return <SettingsView 
                      settings={settings}
                      onUpdateSettings={handleUpdateSettings}
                      initialTab={settingsTab}
                   />;
        default:
            return <Dashboard 
                      onProductClick={() => setIsProductMenuOpen(true)} 
                      onNavigate={handleDashboardNavigate} 
                      lowStockItems={lowStockItems}
                   />;
    }
  };

  // If not authenticated, show login
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Authenticated App Layout
  return (
    <div className={`flex h-screen w-full bg-[#f8f5f2] font-sans overflow-hidden transition-colors duration-500`}>
      
      {/* Navigation */}
      <Sidebar 
        activeItem={activeTab} 
        setActiveItem={handleSidebarNavigation} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">
         {renderContent()}

         {/* Product Selection Modal */}
         {isProductMenuOpen && (
            <div 
                className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-10 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setIsProductMenuOpen(false)}
            >
                <div 
                    className="bg-white rounded-3xl p-8 w-full max-w-5xl h-[85%] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-2xl font-bold text-coffee-900">قائمة المنتجات</h2>
                        <button onClick={() => setIsProductMenuOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                            <X size={28} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto p-2 pb-10">
                        {products.map(product => (
                            <button 
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className={`bg-white border p-6 rounded-2xl transition-all flex flex-col items-center gap-3 group text-right relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 border-gold-100 hover:border-gold-400`}
                            >
                                <div className={`absolute top-0 left-0 w-full h-1 transition-colors bg-gold-200 group-hover:bg-gold-500`}></div>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-2 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-inner bg-gold-100`}>
                                   ☕
                                </div>
                                <h3 className="font-bold text-lg text-coffee-900">{product.name}</h3>
                                <span className="px-3 py-1 rounded-full text-sm font-bold shadow-sm text-white bg-gold-500">{product.price} {settings.currency}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
         )}

         {/* Success Payment Modal */}
         {showSuccessModal && (
            <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-2 bg-green-100 text-green-600">
                        <CheckCircle size={60} />
                    </div>
                    <h2 className="text-2xl font-bold text-coffee-900">تمت العملية بنجاح!</h2>
                    <p className="text-gray-500">تم تسجيل الفاتورة في النظام.</p>
                </div>
            </div>
         )}
      </div>

      {/* Right Sidebar (Receipt) */}
      <ReceiptPanel 
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        decreaseQuantity={decreaseQuantity}
        onClear={clearCart}
        onCheckout={handleCheckout}
        settings={settings}
      />

    </div>
  );
};

export default App;
