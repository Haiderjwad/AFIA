
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ReceiptPanel from './components/ReceiptPanel';
import InventoryView from './components/InventoryView';
import InvoicesView from './components/InvoicesView';
import SuppliersView from './components/SuppliersView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import KitchenView from './components/KitchenView';
import SalesView from './components/SalesView';
import TopHeader from './components/TopHeader';
import LowStockAlert from './components/LowStockAlert';
import { CartItem, MenuItem, Transaction, AppSettings, Employee } from './types';
import { CURRENCY, DEFAULT_SETTINGS } from './constants';
import { X, CheckCircle, Wifi, WifiOff, Globe } from 'lucide-react';
import { firestoreService } from './services/firestoreService';
import { soundService } from './services/soundService';
import { onSnapshot, collection, query, orderBy, doc, updateDoc, limit } from 'firebase/firestore';
import { db as firestoreDb, auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Show splash for at least 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  const [showStatusToast, setShowStatusToast] = useState<'none' | 'online' | 'offline'>('none');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatusToast('online');
      setTimeout(() => setShowStatusToast('none'), 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatusToast('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState<'general' | 'payments' | 'employees' | 'printing'>('general');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeLowStockAlert, setActiveLowStockAlert] = useState<MenuItem | null>(null);
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set());

  // Data State (Loaded from DB)
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication & Initial Data
  useEffect(() => {
    // 1. Initial Seeding (Async)
    firestoreService.seedDatabase();

    // 2. Auth State Listener
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthLoading(true);
      if (firebaseUser) {
        let profile = await firestoreService.getEmployee(firebaseUser.uid);

        if (!profile && firebaseUser.email) {
          // Try fetching by email and sync UID
          profile = await firestoreService.getEmployeeByEmail(firebaseUser.email);
          if (profile) {
            await firestoreService.syncEmployeeUid(firebaseUser.email, firebaseUser.uid);
          }
        }

        if (profile) {
          setCurrentUser(profile);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // If logged in but no profile, maybe sign out
          if (!profile && firebaseUser.email !== 'admin@cafesun.com') {
            await signOut(auth);
          }
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setIsAuthLoading(false);
      setIsLoading(false); // Data is ready once auth is resolved
    });

    // 3. Setup real-time listeners (Only if authenticated)
    let unsubProducts: any, unsubTransactions: any, unsubSettings: any, unsubNotifications: any;

    const startListeners = () => {
      unsubProducts = onSnapshot(collection(firestoreDb, "products"), (snapshot) => {
        const p = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
        setProducts(p);
      });

      unsubTransactions = onSnapshot(
        query(collection(firestoreDb, "transactions")),
        (snapshot) => {
          const t = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
          // Sort in memory to avoid composite index requirement
          t.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(t);
        }
      );

      unsubSettings = onSnapshot(doc(firestoreDb, "settings", "default"), (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as AppSettings);
        }
      });

      unsubNotifications = onSnapshot(
        query(collection(firestoreDb, "notifications"), orderBy("timestamp", "desc"), limit(5)),
        (snapshot) => {
          const n = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          // Filter if not read or just keep them for display
          setNotifications(n);
        }
      );
    };

    if (isAuthenticated) {
      startListeners();
    }

    return () => {
      unsubAuth();
      if (unsubProducts) unsubProducts();
      if (unsubTransactions) unsubTransactions();
      if (unsubSettings) unsubSettings();
      if (unsubNotifications) unsubNotifications();
    };
  }, [isAuthenticated]);

  // Global Sound Control
  useEffect(() => {
    soundService.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('input[type="checkbox"]') ||
        target.closest('input[type="radio"]');

      if (isClickable) {
        soundService.playClick();
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Update Settings Handler
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    await firestoreService.updateSettings(newSettings);
    soundService.playSuccess();
  };

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCart([]);
    setActiveTab('dashboard');
  }

  const handleSendToKitchen = async (method: 'cash' | 'card' | 'online', tableNumber?: string, notes?: string) => {
    if (cart.length === 0) return;

    // Check if there's an active order for this table to append to
    const activeTableOrder = tableNumber
      ? transactions.find(t => t.tableNumber === tableNumber && !['completed', 'refunded'].includes(t.status))
      : null;

    if (activeTableOrder) {
      // Append items to existing order
      const updatedItems = [...activeTableOrder.items];
      cart.forEach(cartItem => {
        const existing = updatedItems.find(i => i.id === cartItem.id);
        if (existing) {
          existing.quantity += cartItem.quantity;
        } else {
          updatedItems.push({ ...cartItem });
        }
      });

      const totalValue = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = totalValue * (settings.taxRate / 100);

      await firestoreService.updateTransaction(activeTableOrder.id, {
        items: updatedItems,
        total: totalValue + taxAmount,
        status: 'pending',
        notes: notes ? (activeTableOrder.notes ? `${activeTableOrder.notes} | ${notes}` : notes) : activeTableOrder.notes
      });
    } else {
      // Create new order
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = subtotal * (settings.taxRate / 100);

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: [...cart],
        total: subtotal + taxAmount,
        status: 'pending',
        paymentMethod: method,
        tableNumber,
        notes
      };

      await firestoreService.addTransaction(newTransaction);
    }

    setCart([]);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  const handleSendToCashier = async (transactionId: string) => {
    await firestoreService.updateTransactionStatus(transactionId, 'waiting_payment');
  };

  const handleFinalizePayment = async (transactionId: string, paymentMethod: 'cash' | 'card' | 'online') => {
    // 1. Update stock
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      for (const cartItem of transaction.items) {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
          const newStock = Math.max(0, product.stock - cartItem.quantity);
          await firestoreService.updateProduct(product.id, { stock: newStock });
        }
      }
    }

    // 2. Finalize Transaction
    const transRef = doc(firestoreDb, "transactions", transactionId);
    await updateDoc(transRef, {
      status: 'completed',
      paymentMethod: paymentMethod
    });
  };

  const handleSidebarNavigation = (tab: string) => {
    setActiveTab(tab);
    setIsProductMenuOpen(false);
  };

  // Calculate Low Stock Items
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= settings.lowStockThreshold);
  }, [products, settings.lowStockThreshold]);

  // Monitor for new local stock alerts
  useEffect(() => {
    const newLowStockItem = products.find(p =>
      p.stock <= settings.lowStockThreshold && !alertedIds.has(p.id)
    );

    if (newLowStockItem) {
      setActiveLowStockAlert(newLowStockItem);
      setAlertedIds(prev => new Set(prev).add(newLowStockItem.id));
    }

    // Clear alerted flag if stock is replenished
    const replenishedIds = Array.from(alertedIds).filter(id => {
      const p = products.find(prod => prod.id === id);
      return p && p.stock > settings.lowStockThreshold;
    });

    if (replenishedIds.length > 0) {
      setAlertedIds(prev => {
        const next = new Set(prev);
        replenishedIds.forEach(id => next.delete(id));
        return next;
      });
    }
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

  const handleAddProduct = async (newProduct: MenuItem) => {
    await firestoreService.addProduct(newProduct);
  };

  const handleUpdateProduct = async (updatedProduct: MenuItem) => {
    const { id, ...data } = updatedProduct;
    await firestoreService.updateProduct(id, data);
  };

  const handleDeleteProduct = async (id: string) => {
    await firestoreService.deleteProduct(id);
  };

  const handleDashboardNavigate = (view: string, subTab?: string) => {
    setActiveTab(view);
    setIsProductMenuOpen(false);
    if (view === 'settings' && subTab) {
      setSettingsTab(subTab as 'general' | 'payments' | 'employees' | 'printing');
    } else {
      setSettingsTab('general');
    }
  };

  const getActiveTabTitle = () => {
    const titles: any = {
      dashboard: 'الرئيسة',
      sales: 'المبيعات',
      kitchen: 'المطبخ',
      invoices: 'الفواتير',
      inventory: 'المخزون',
      suppliers: 'الموردين',
      reports: 'التقارير المفصلة',
      settings: 'الإعدادات'
    };
    return titles[activeTab] || 'نظام نقطة البيع';
  };

  // View Routing based on Permissions
  const renderContent = () => {
    if (!currentUser) return null;

    const role = currentUser.role;

    switch (activeTab) {
      case 'dashboard':
        if (['admin', 'manager', 'cashier', 'sales'].includes(role)) {
          return <Dashboard
            onProductClick={() => setActiveTab('sales')}
            onNavigate={handleDashboardNavigate}
            lowStockItems={lowStockItems}
            readyOrders={transactions.filter(t => t.status === 'ready')}
            onCompleteOrder={handleSendToCashier}
            isOnline={isOnline}
            notifications={notifications}
          />;
        }
        break;
      case 'sales':
        if (['admin', 'manager', 'cashier', 'sales'].includes(role)) {
          return <SalesView
            products={products}
            addToCart={addToCart}
            settings={settings}
            readyOrders={transactions.filter(t => t.status === 'ready')}
            onCompleteOrder={handleSendToCashier}
          />;
        }
        break;
      case 'kitchen':
        if (['admin', 'manager', 'kitchen'].includes(role)) {
          return <KitchenView isOnline={isOnline} />;
        }
        break;
      case 'inventory':
        if (['admin', 'manager'].includes(role)) {
          return <InventoryView
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            lowStockThreshold={settings.lowStockThreshold}
            storeName={settings.storeName}
          />;
        }
        break;
      case 'invoices':
        if (['admin', 'manager', 'cashier', 'sales'].includes(role)) {
          return <InvoicesView
            transactions={transactions}
            onFinalizePayment={handleFinalizePayment}
            canFinalize={['admin', 'manager', 'cashier'].includes(role)}
            products={products}
            settings={settings}
          />;
        }
        break;
      case 'suppliers':
        if (['admin', 'manager'].includes(role)) {
          return <SuppliersView />;
        }
        break;
      case 'reports':
        if (['admin', 'manager'].includes(role)) {
          return <ReportsView transactions={transactions} />;
        }
        break;
      case 'settings':
        if (['admin', 'manager'].includes(role)) {
          return <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            initialTab={settingsTab}
          />;
        }
        break;
      default:
        break;
    }

    // Default Fallback
    if (role === 'kitchen') return <KitchenView isOnline={isOnline} />;
    return <Dashboard
      onProductClick={() => setActiveTab('sales')}
      onNavigate={handleDashboardNavigate}
      lowStockItems={lowStockItems}
      readyOrders={transactions.filter(t => t.status === 'ready')}
      onCompleteOrder={handleSendToCashier}
      isOnline={isOnline}
    />;
  };

  if (showSplash || isLoading || isAuthLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen w-full bg-brand-cream font-sans overflow-hidden transition-colors duration-500`}>
      <Sidebar
        activeItem={activeTab}
        setActiveItem={handleSidebarNavigation}
        user={currentUser}
        settings={settings}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">
        <TopHeader
          user={currentUser}
          onLogout={handleLogout}
          notifications={notifications}
          readyOrders={transactions.filter(t => t.status === 'ready')}
          lowStockItems={lowStockItems}
          onCompleteOrder={handleSendToCashier}
          onNavigate={handleDashboardNavigate}
          isOnline={isOnline}
          activeTabTitle={getActiveTabTitle()}
          settings={settings}
        />
        {renderContent()}

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

      {activeTab === 'sales' && (
        <ReceiptPanel
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          decreaseQuantity={decreaseQuantity}
          onClear={clearCart}
          onCheckout={handleSendToKitchen}
          settings={settings}
          userRole={currentUser?.role || 'sales'}
        />
      )}

      {showStatusToast !== 'none' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-10 duration-500">
          {showStatusToast === 'offline' ? (
            <div className="bg-red-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-red-500/50 backdrop-blur-xl">
              <div className="bg-white/20 p-2 rounded-full animate-pulse">
                <WifiOff size={24} />
              </div>
              <div className="text-right">
                <p className="font-bold">انقطع الاتصال بالإنترنت</p>
                <p className="text-xs opacity-80">أنت تعمل الآن في وضع عدم الاتصال، سيتم المزامنة عند العودة</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-blue-500/50 backdrop-blur-xl">
              <div className="bg-white/20 p-2 rounded-full">
                <Wifi size={24} />
              </div>
              <div className="text-right">
                <p className="font-bold">تم استعادة الاتصال</p>
                <p className="text-xs opacity-80">تمت العودة للوضع السحابي بنجاح، جاري مزامنة البيانات...</p>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Low Stock Alert Toast */}
      {activeLowStockAlert && (
        <LowStockAlert
          item={activeLowStockAlert}
          onClose={() => setActiveLowStockAlert(null)}
          onNavigateToInventory={() => {
            handleDashboardNavigate('inventory');
            setActiveLowStockAlert(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
