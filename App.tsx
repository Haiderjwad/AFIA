
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ReceiptPanel from './components/ReceiptPanel';
import InventoryView from './components/InventoryView';
import InvoicesView from './components/InvoicesView';
import SuppliersView from './components/SuppliersView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import EmployeePerformanceView from './components/EmployeePerformanceView';
import LoginView from './components/LoginView';
import KitchenView from './components/KitchenView';
import SalesView from './components/SalesView';
import TopHeader from './components/TopHeader';
import LowStockAlert from './components/LowStockAlert';
import KitchenAlert from './components/KitchenAlert';
import { CartItem, MenuItem, Transaction, AppSettings, Employee, Supplier, SystemNotification } from './types';
import { CURRENCY, DEFAULT_SETTINGS } from './constants';
import { X, CheckCircle, Wifi, WifiOff, Globe, ShoppingCart, QrCode } from 'lucide-react';
import { firestoreService } from './services/firestoreService';
import { soundService } from './services/soundService';
import { onSnapshot, collection, query, orderBy, doc, updateDoc, limit } from 'firebase/firestore';
import { db as firestoreDb, auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import SplashScreen from './components/SplashScreen';
import PublicMenuView from './components/PublicMenuView';
import DigitalMenuView from './components/DigitalMenuView';
import StatusModal from './components/StatusModal';


const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSplashDone, setIsSplashDone] = useState(false); // tracks splash bar completion
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPublicMenu, setIsPublicMenu] = useState(false);

  useEffect(() => {
    // Basic route detection without react-router
    const path = window.location.pathname;
    if (path.includes('/menu') || window.location.search.includes('view=menu')) {
      setIsPublicMenu(true);
    }
  }, []);


  useEffect(() => {
    // Auth State Listener
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsAuthLoading(true);
      try {
        if (firebaseUser) {
          let profile = null;
          try {
            profile = await firestoreService.getEmployee(firebaseUser.uid);
            if (!profile && firebaseUser.email) {
              profile = await firestoreService.getEmployeeByEmail(firebaseUser.email);
              if (profile) {
                await firestoreService.syncEmployeeUid(firebaseUser.email, firebaseUser.uid);
              }
            }
          } catch (profileError) {
            console.error("Error fetching employee profile:", profileError);
            // Fallback for admin if offline
            if (firebaseUser.email === 'admin@cafesun.com') {
              profile = {
                uid: firebaseUser.uid,
                name: "مدير النظام (وضع عدم الاتصال)",
                email: firebaseUser.email,
                role: "admin",
                permissions: ["all"],
                employeeId: "EMP-001",
                joinedAt: new Date().toISOString()
              };
            }
          }

          if (profile) {
            setCurrentUser(profile);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            if (firebaseUser.email !== 'admin@cafesun.com') await signOut(auth);
          }
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth transformation error:", error);
      } finally {
        setIsAuthLoading(false);
        // Minimum aesthetic delay — splash will control its own lifetime via onComplete
        setTimeout(() => setIsInitializing(false), 300);
      }
    });

    return () => unsubAuth();
  }, []);
  // 3. Role-based Navigation
  useEffect(() => {
    if (currentUser && isAuthenticated) {
      const role = currentUser.role.toLowerCase();
      const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];

      const canKitchen = role === 'kitchen' || role === 'cook' || role === 'chef' || perms.includes('kitchen');
      const canSales = role === 'sales' || perms.includes('sales');
      const canCashier = role === 'cashier' || perms.includes('invoices');

      if (canKitchen) setActiveTab('kitchen');
      else if (canSales) setActiveTab('sales');
      else if (canCashier) setActiveTab('invoices');
      else setActiveTab('dashboard');
    }
  }, [currentUser, isAuthenticated]);

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
  const [activeKitchenAlert, setActiveKitchenAlert] = useState<SystemNotification | null>(null);
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set());
  const [sessionAlertedIds, setSessionAlertedIds] = useState<Set<string>>(new Set());

  // Data State (Loaded from DB)
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReceiptPanelOpen, setIsReceiptPanelOpen] = useState(false);
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('');

  useEffect(() => {
    let unsubProducts: any, unsubTransactions: any, unsubSettings: any, unsubNotifications: any, unsubEmployees: any, unsubSuppliers: any;

    if (isAuthenticated) {
      unsubProducts = onSnapshot(collection(firestoreDb, "products"), (snapshot) => {
        const p = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
        setProducts(p);
      }, (error) => console.error("Products Snapshot Error:", error));

      unsubTransactions = onSnapshot(
        query(collection(firestoreDb, "transactions")),
        (snapshot) => {
          const t = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
          t.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(t);
        },
        (error) => console.error("Transactions Snapshot Error:", error)
      );

      unsubSettings = onSnapshot(doc(firestoreDb, "settings", "default"), (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as AppSettings);
        }
      }, (error) => console.error("Settings Snapshot Error:", error));

      unsubNotifications = onSnapshot(
        query(collection(firestoreDb, "notifications"), orderBy("timestamp", "desc"), limit(10)),
        (snapshot) => {
          const n = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SystemNotification));
          setNotifications(n);

          // Check for low stock alerts (only)
          if (currentUser) {
            const role = currentUser.role.toLowerCase();
            if (['admin', 'manager', 'cashier', 'sales'].includes(role)) {
              // Kitchen warnings removed as per request
            }
          }
        },
        (error) => console.error("Notifications Snapshot Error:", error)
      );

      unsubEmployees = onSnapshot(collection(firestoreDb, "employees"), (snapshot) => {
        const e = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Employee));
        setEmployees(e);
      }, (error) => console.error("Employees Snapshot Error:", error));

      unsubSuppliers = onSnapshot(collection(firestoreDb, "suppliers"), (snapshot) => {
        const s = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier));
        setSuppliers(s);
      }, (error) => console.error("Suppliers Snapshot Error:", error));

      // 4. Initial Seeding and Settings Check (Only when authenticated)
      const initSettings = async () => {
        try {
          // Attempt seeding/defaults if auth is present
          firestoreService.seedDatabase().catch(() => { /* silent in dev */ });
          const sessSettings = await firestoreService.getSettings();
          if (sessSettings) setSettings(sessSettings);
        } catch (e) {
          // Silent fallback
        }
      };
      initSettings();
    }

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubTransactions) unsubTransactions();
      if (unsubSettings) unsubSettings();
      if (unsubNotifications) unsubNotifications();
      if (unsubEmployees) unsubEmployees();
      if (unsubSuppliers) unsubSuppliers();
    };
  }, [isAuthenticated]);

  // Global Sound Control
  useEffect(() => {
    soundService.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Professional Interaction Detection
      const isClickable =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('input[type="checkbox"]') ||
        target.closest('input[type="radio"]') ||
        target.closest('.cursor-pointer') ||
        target.closest('[data-clickable="true"]') ||
        (target.onclick !== null) ||
        (window.getComputedStyle(target).cursor === 'pointer');

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
      soundService.playSuccess();
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      soundService.playError();
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

    // ════════════════════════════════════════════════════════════════
    // SMART TABLE ORDER MANAGEMENT — Stage-Aware Merging
    //
    // Rules:
    //   1. Find active (non-completed, non-paid) orders for this table.
    //   2. Among those, find orders that are STILL IN EARLY STAGES
    //      (pending / preparing) — these can absorb new items without
    //      disrupting the kitchen flow.
    //   3. If a "mergeable" early-stage order exists → append cart items
    //      to it and update. The kitchen sees updated items instantly.
    //   4. If all existing orders are in ADVANCED stages (ready, waiting_payment)
    //      → create a brand-new independent transaction. Those advanced
    //      orders are NOT touched, so they keep their current status.
    //   5. Takeaway orders always create a fresh transaction (no merging).
    // ════════════════════════════════════════════════════════════════

    const EARLY_STAGES = ['pending', 'preparing'];
    const ADVANCED_STAGES = ['ready', 'waiting_payment'];

    const activeTableOrders = (tableNumber && tableNumber !== 'Takeaway')
      ? transactions.filter(t =>
        t.tableNumber === tableNumber &&
        !['completed', 'refunded'].includes(t.status) &&
        !t.isPaid
      )
      : [];

    // Find an early-stage order we can safely merge into
    const mergeCandidates = activeTableOrders.filter(t => EARLY_STAGES.includes(t.status));

    if (mergeCandidates.length > 0) {
      // ── PATH A: Merge into the earliest in-kitchen order ──────────
      // Pick the one closest to completion within early stages (prefer 'preparing')
      const masterOrder = mergeCandidates.find(t => t.status === 'preparing') || mergeCandidates[0];

      // Merge cart into master
      const consolidatedItems = [...masterOrder.items];
      cart.forEach(cartItem => {
        const existing = consolidatedItems.find(ci => ci.id === cartItem.id);
        if (existing) {
          existing.quantity += cartItem.quantity;
        } else {
          consolidatedItems.push({ ...cartItem });
        }
      });

      const subtotal = consolidatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = subtotal * (settings.taxRate / 100);

      // Preserve existing status: a 'preparing' order stays 'preparing'
      // A 'pending' order stays 'pending' — kitchen picks it naturally
      await firestoreService.updateTransaction(masterOrder.id, {
        items: consolidatedItems,
        total: subtotal + taxAmount,
        isUpdated: true, // Mark as updated for kitchen notification
        notes: notes
          ? (masterOrder.notes ? `${masterOrder.notes} | ${notes}` : notes)
          : masterOrder.notes,
        salesPerson: currentUser?.name || 'Unknown'
      });

      // Update Stock for new items!
      for (const cartItem of cart) {
        await firestoreService.decrementStock(cartItem.id, cartItem.quantity);
      }

      // Clean up any OTHER early-stage duplicates for the same table
      // (edge case: multiple pending orders for same table)
      const otherEarlyOrders = mergeCandidates.filter(t => t.id !== masterOrder.id);
      for (const dup of otherEarlyOrders) {
        const dupItems = dup.items;
        dupItems.forEach(dupItem => {
          const existing = consolidatedItems.find(ci => ci.id === dupItem.id);
          if (!existing) consolidatedItems.push({ ...dupItem }); // already merged above
        });
        await firestoreService.deleteTransaction(dup.id);
      }

    } else {
      // ── PATH B: All existing orders are advanced (ready/waiting_payment)
      //    OR there are no existing orders at all.
      //    → Create an independent new transaction. Advanced orders are untouched.
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = subtotal * (settings.taxRate / 100);

      const newTransaction: Transaction = {
        id: `TR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        date: new Date().toISOString(),
        items: [...cart],
        total: subtotal + taxAmount,
        status: 'pending',
        paymentMethod: method,
        tableNumber,
        notes,
        salesPerson: currentUser?.name || 'Unknown'
      };

      await firestoreService.addTransaction(newTransaction);

      // Update Stock for new transaction!
      for (const cartItem of cart) {
        await firestoreService.decrementStock(cartItem.id, cartItem.quantity);
      }
    }

    setCart([]);
    setShowSuccessModal(true);
    soundService.playSuccess();
    setTimeout(() => setShowSuccessModal(false), 2000);
  };


  const handleSendToCashier = async (transactionId: string) => {
    await firestoreService.updateTransaction(transactionId, {
      status: 'waiting_payment',
      deliveredBy: currentUser?.name || 'Unknown'
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    // 1. Get the transaction to replenish stock
    const transaction = transactions.find(t => t.id === orderId);
    if (transaction) {
      // 2. Replenish stock
      for (const item of transaction.items) {
        // Use decrement with negative quantity to increment
        await firestoreService.decrementStock(item.id, -item.quantity);
      }

      // 3. Update status to cancelled
      await firestoreService.updateTransaction(orderId, {
        status: 'cancelled',
        notes: transaction.notes ? `${transaction.notes} | [ملغي]` : '[طلب ملغي]'
      });

      soundService.playSuccess();
    }
  };

  const handleFinalizePayment = async (transactionIds: string | string[], paymentMethod: 'cash' | 'card' | 'online') => {
    const ids = Array.isArray(transactionIds) ? transactionIds : [transactionIds];

    for (const transactionId of ids) {
      // Finalize Transaction (Smart Logic)
      const currentTrans = transactions.find(t => t.id === transactionId);
      if (currentTrans) {
        // If order is ready or waiting, it's fully done. 
        // If it's still pending/preparing, it's paid but stays in kitchen.
        let finalStatus = currentTrans.status;
        if (currentTrans.status === 'ready' || currentTrans.status === 'waiting_payment') {
          finalStatus = 'completed';
        }

        await firestoreService.updateTransaction(transactionId, {
          status: finalStatus,
          paymentMethod: paymentMethod,
          isPaid: true,
          cashierPerson: currentUser?.name || 'Unknown'
        });
      }
    }
  };

  const handleSidebarNavigation = (tab: string) => {
    setActiveTab(tab);
    setIsProductMenuOpen(false);

    // Professional cleanup: Clear inventory search when navigating away
    if (tab !== 'inventory') {
      setInventorySearchQuery('');
    }
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
    // 1. Get the latest product state to ensure we have the most recent stock count
    const currentProduct = products.find(p => p.id === product.id);

    if (!currentProduct || currentProduct.stock <= 0) {
      soundService.playError();
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      // 2. Prevent adding more than what's available in stock
      if (existing) {
        if (existing.quantity >= currentProduct.stock) {
          soundService.playError();
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    // Optional: Open panel on mobile when adding first item
    if (cart.length === 0 && window.innerWidth < 1280) {
      setIsReceiptPanelOpen(true);
    }
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

  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  const handleDashboardNavigate = (view: string, subTab?: string, data?: any) => {
    setActiveTab(view);
    setIsProductMenuOpen(false);

    if (view === 'settings' && subTab) {
      setSettingsTab(subTab as 'general' | 'payments' | 'employees' | 'printing');
    } else {
      setSettingsTab('general');
    }

    // Handle professional navigation data
    if (view === 'inventory' && data?.productSearch) {
      setInventorySearchQuery(data.productSearch);
    } else if (view !== 'inventory') {
      // Clear search when leaving inventory or navigating normally
      setInventorySearchQuery('');
    }
  };

  const getActiveTabTitle = () => {
    const titles: any = {
      dashboard: 'الرئيسة',
      sales: 'المبيعات',
      kitchen: 'المطبخ',
      invoices: 'الفواتير',
      inventory: 'المخزون',
      digital_menu: 'المنيو الإلكتروني',
      suppliers: 'الموردين',
      reports: 'التقارير المفصلة',
      settings: 'الإعدادات'
    };
    return titles[activeTab] || 'نظام نقطة البيع';
  };

  // View Routing based on Permissions
  const renderContent = () => {
    if (!currentUser) return null;

    const role = currentUser.role.toLowerCase();
    const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
    const hasAll = perms.includes('all');

    switch (activeTab) {
      case 'dashboard':
        if (['admin', 'manager'].includes(role) || hasAll) {
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
        if (['admin', 'manager', 'sales'].includes(role)) {
          return <SalesView
            products={products}
            addToCart={addToCart}
            settings={settings}
            readyOrders={transactions.filter(t => t.status === 'ready')}
            transactions={transactions}
            currentUser={currentUser}
            onCompleteOrder={handleSendToCashier}
            onCancelOrder={handleCancelOrder}
            onToggleReceiptPanel={() => setIsReceiptPanelOpen(!isReceiptPanelOpen)}
            cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
            selectedTableNumber={selectedTableNumber}
            onSelectTable={setSelectedTableNumber}
          />;

        }
        break;
      case 'kitchen':
        if (['admin', 'manager', 'kitchen', 'cook', 'chef'].includes(role) || perms.includes('kitchen') || hasAll) {
          return <KitchenView isOnline={isOnline} user={currentUser} onCancelOrder={handleCancelOrder} transactions={transactions} />;
        }
        break;
      case 'inventory':
        if (['admin', 'manager', 'sales'].includes(role) || perms.includes('inventory') || hasAll) {
          return <InventoryView
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            lowStockThreshold={settings.lowStockThreshold}
            storeName={settings.storeName}
            settings={settings}
            canManage={['admin', 'manager'].includes(role) || hasAll}
            initialSearchQuery={inventorySearchQuery}
            onSearchChange={setInventorySearchQuery}
          />;
        }
        break;
      case 'digital_menu':
        if (['admin', 'manager'].includes(role) || hasAll) {
          return <DigitalMenuView
            products={products}
            storeName={settings.storeName}
            settings={settings}
          />;
        }
        break;
      case 'invoices':
        if (['admin', 'manager', 'cashier'].includes(role) || perms.includes('invoices') || hasAll) {
          return <InvoicesView
            transactions={transactions}
            onFinalizePayment={handleFinalizePayment}
            canFinalize={['admin', 'manager', 'cashier'].includes(role) || hasAll}
            products={products}
            settings={settings}
            currentUser={currentUser}
          />;
        }
        break;
      case 'suppliers':
        if (['admin', 'manager', 'cashier'].includes(role) || perms.includes('suppliers') || hasAll) {
          return <SuppliersView suppliers={suppliers} settings={settings} />;
        }
        break;
      case 'reports':
        if (['admin', 'manager', 'cashier'].includes(role) || perms.includes('reports') || hasAll) {
          return <ReportsView
            transactions={transactions}
            employees={employees}
            suppliers={suppliers}
            settings={settings}
          />;
        }
        break;
      case 'performance':
        if (['admin', 'manager'].includes(role) || hasAll) {
          return <EmployeePerformanceView employees={employees} transactions={transactions} />;
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

    // Default Fallback based on role
    if (['kitchen', 'cook', 'chef'].includes(role)) return <KitchenView isOnline={isOnline} user={currentUser} />;
    if (role === 'sales') return <SalesView
      products={products}
      addToCart={addToCart}
      settings={settings}
      readyOrders={transactions.filter(t => t.status === 'ready')}
      transactions={transactions}
      currentUser={currentUser}
      onCompleteOrder={handleSendToCashier}
      onToggleReceiptPanel={() => setIsReceiptPanelOpen(!isReceiptPanelOpen)}
      cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
      selectedTableNumber={selectedTableNumber}
      onSelectTable={setSelectedTableNumber}
    />;
    if (role === 'cashier') return <InvoicesView
      transactions={transactions}
      onFinalizePayment={handleFinalizePayment}
      canFinalize={true}
      products={products}
      settings={settings}
    />;

    return <Dashboard
      onProductClick={() => setActiveTab('sales')}
      onNavigate={handleDashboardNavigate}
      lowStockItems={lowStockItems}
      readyOrders={transactions.filter(t => t.status === 'ready')}
      onCompleteOrder={handleSendToCashier}
      isOnline={isOnline}
      notifications={notifications}
    />;
  };

  // Show splash while: auth hasn't resolved OR splash bar isn't done yet
  if (isInitializing || isAuthLoading || !isSplashDone) {
    return <SplashScreen onComplete={() => setIsSplashDone(true)} />;
  }

  // Digital Menu Public View (Bypass Auth)
  if (isPublicMenu) {
    return <PublicMenuView />;
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
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
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
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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

        <StatusModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          type="success"
          title="تم إرسال الطلب بنجاح!"
          message="تم تسجيل طلبات الطاولة وإرسال التنبيهات للمطبخ بنجاح، العملية مؤمنة ومسجلة في النظام."
        />
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
          isOpen={isReceiptPanelOpen}
          onClose={() => setIsReceiptPanelOpen(false)}
          tableNumber={selectedTableNumber}
          onTableChange={setSelectedTableNumber}
          products={products}
        />
      )}

      {/* Floating Cart Button for Mobile/Tablet */}
      {activeTab === 'sales' && !isReceiptPanelOpen && cart.length > 0 && (
        <button
          onClick={() => setIsReceiptPanelOpen(true)}
          className="fixed bottom-6 left-6 z-[70] xl:hidden bg-brand-primary text-white p-5 rounded-full shadow-2xl animate-in slide-in-from-bottom-10 flex items-center gap-3 active:scale-90 transition-transform"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-3 -right-3 w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center text-[10px] font-black ring-2 ring-white">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <span className="font-black text-sm">عرض السلة</span>
        </button>
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
            handleDashboardNavigate('inventory', undefined, { productSearch: activeLowStockAlert.name });
            setActiveLowStockAlert(null);
          }}
        />
      )}

      {/* Kitchen Warning Removed */}
    </div>
  );
};

export default App;
