
import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
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
  const [selectedTableNumber, setSelectedTableNumber] = useState<string | null>(null);
  const [tableGuestCounts, setTableGuestCounts] = useState<Map<string, number>>(new Map());
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  // 4. Memoized Handlers for Performance
  const handleUpdateSettings = useCallback(async (newSettings: AppSettings) => {
    await firestoreService.updateSettings(newSettings);
    soundService.playSuccess();
  }, []);

  const handleLogin = useCallback(async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      soundService.playSuccess();
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      soundService.playError();
      return false;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    setCart([]);
    setActiveTab('dashboard');
  }, []);

  const handleSidebarNavigation = useCallback((tab: string) => {
    setActiveTab(tab);
    setIsProductMenuOpen(false);
    if (tab !== 'inventory') {
      setInventorySearchQuery('');
    }
  }, []);

  const handleDashboardNavigate = useCallback((view: string, subTab?: string, data?: any) => {
    setActiveTab(view);
    setIsProductMenuOpen(false);
    if (view === 'settings' && subTab) {
      setSettingsTab(subTab as 'general' | 'payments' | 'employees' | 'printing');
    } else {
      setSettingsTab('general');
    }
    if (view === 'inventory' && data?.productSearch) {
      setInventorySearchQuery(data.productSearch);
    } else if (view !== 'inventory') {
      setInventorySearchQuery('');
    }
  }, []);

  // Memoized Cart Handlers
  const addToCart = useCallback((product: MenuItem) => {
    setProducts(currentProducts => {
      const prod = currentProducts.find(p => p.id === product.id);
      if (!prod || prod.stock <= 0) {
        soundService.playError();
        return currentProducts;
      }

      setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          if (existing.quantity >= prod.stock) {
            soundService.playError();
            return prev;
          }
          return prev.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        if (prev.length === 0 && window.innerWidth < 1280) {
          setIsReceiptPanelOpen(true);
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      return currentProducts;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const decreaseQuantity = useCallback((id: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== id);
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // Memoized Transaction Handlers
  const handleSendToCashier = useCallback(async (transactionId: string) => {
    await firestoreService.updateTransaction(transactionId, {
      status: 'waiting_payment',
      deliveredBy: currentUser?.name || 'Unknown'
    });
  }, [currentUser?.name]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    // Note: this should be careful with transactions dependency
    // but transactions is needed to find the one to cancel.
    // To optimize, we could pass the transaction object directly.
    const transaction = transactions.find(t => t.id === orderId);
    if (transaction) {
      for (const item of transaction.items) {
        await firestoreService.decrementStock(item.id, -item.quantity);
      }
      await firestoreService.updateTransaction(orderId, {
        status: 'cancelled',
        notes: transaction.notes ? `${transaction.notes} | [ملغي]` : '[طلب ملغي]'
      });
      soundService.playSuccess();
    }
  }, [transactions]);

  const handleEditOrder = useCallback(async (orderId: string) => {
    const transaction = transactions.find(t => t.id === orderId);
    if (!transaction) return;

    // Load items into cart
    setCart(transaction.items.map(item => ({ ...item })));
    setEditingTransactionId(orderId);
    if (transaction.tableNumber && transaction.tableNumber !== 'Takeaway') {
      setSelectedTableNumber(transaction.tableNumber);
    } else {
      setSelectedTableNumber(null);
    }

    // Provisionally restore stock while editing
    for (const item of transaction.items) {
      await firestoreService.decrementStock(item.id, -item.quantity);
    }

    setIsReceiptPanelOpen(true);
    soundService.playClick();
  }, [transactions]);

  const handleMoveTable = useCallback(async (transactionId: string, newTable: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      await firestoreService.updateTransaction(transactionId, {
        tableNumber: newTable,
        isMoved: true,
        previousTable: transaction.tableNumber || 'Takeaway'
      });
      soundService.playSuccess();
    }
  }, [transactions]);

  const handleFinalizePayment = useCallback(async (transactionIds: string | string[], paymentMethod: 'cash' | 'card' | 'online') => {
    const ids = Array.isArray(transactionIds) ? transactionIds : [transactionIds];
    setTransactions(currentTransactions => {
      for (const transactionId of ids) {
        const currentTrans = currentTransactions.find(t => t.id === transactionId);
        if (currentTrans) {
          let finalStatus = currentTrans.status;
          if (currentTrans.status === 'ready' || currentTrans.status === 'waiting_payment') {
            finalStatus = 'completed';
          }
          firestoreService.updateTransaction(transactionId, {
            status: finalStatus,
            paymentMethod: paymentMethod,
            isPaid: true,
            isTableClosed: false, // Keep table occupied until manually closed
            cashierPerson: currentUser?.name || 'Unknown'
          });
        }
      }
      return currentTransactions;
    });
  }, [currentUser?.name]);

  const handleCloseTable = useCallback(async (transactionIds: string | string[]) => {
    const ids = Array.isArray(transactionIds) ? transactionIds : [transactionIds];
    for (const id of ids) {
      await firestoreService.updateTransaction(id, {
        isTableClosed: true
      });
    }
    soundService.playSuccess();
  }, []);

  // Derived Data Memoization
  const readyOrders = useMemo(() => transactions.filter(t => t.status === 'ready'), [transactions]);
  const lowStockItems = useMemo(() => products.filter(p => p.stock <= settings.lowStockThreshold), [products, settings.lowStockThreshold]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

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

          // Sync guest counts from active transactions while preserving local changes for new orders
          setTableGuestCounts(prev => {
            const next = new Map(prev);
            // Transactions are the source of truth for guest counts of occupied tables
            [...t].reverse().forEach(trans => {
              if (trans.tableNumber && trans.tableNumber !== 'Takeaway' &&
                (trans.isTableClosed === false || (trans.isTableClosed === undefined && !trans.isPaid && !['completed', 'refunded', 'cancelled'].includes(trans.status)))) {
                if (trans.guestCount !== undefined && trans.guestCount > 0) {
                  next.set(trans.tableNumber, trans.guestCount);
                }
              }
            });

            // Clean up guest counts ONLY for tables that have just been closed or are confirmed empty
            const occupiedOrReady = new Set(t.filter(trans =>
              trans.tableNumber &&
              trans.tableNumber !== 'Takeaway' &&
              (trans.isTableClosed === false || (trans.isTableClosed === undefined && !trans.isPaid && !['completed', 'refunded', 'cancelled'].includes(trans.status)))
            ).map(tr => tr.tableNumber!));

            Array.from(next.keys()).forEach(tableNum => {
              // If a table is no longer in transactions AND its latest transaction was closed, remove it
              const tableTrans = t.filter(tr => tr.tableNumber === tableNum);
              if (!occupiedOrReady.has(tableNum) && tableTrans.length > 0 && tableTrans[0].isTableClosed === true) {
                next.delete(tableNum);
              }
            });

            return next;
          });
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
        },
        (error) => console.error("Notifications Snapshot Error:", error)
      );

      unsubEmployees = onSnapshot(collection(firestoreDb, "employees"), (snapshot) => {
        // Deduplicate by email — a single employee may have both a legacy doc (employeeId-based)
        // and a new doc (uid-based). Without dedup, salary/count calculations in Reports
        // will count them twice and produce inflated totals.
        const emailMap = new Map<string, Employee>();
        snapshot.docs.forEach(d => {
          const data = d.data() as Employee;
          const emp = { ...data, uid: data.uid || d.id };
          const key = (emp.email || '').toLowerCase().trim();
          if (key) {
            // Prefer the doc whose ID matches the uid (the newer, canonical doc)
            if (!emailMap.has(key) || d.id === emp.uid) {
              emailMap.set(key, emp);
            }
          }
        });
        setEmployees(Array.from(emailMap.values()));
      }, (error) => console.error("Employees Snapshot Error:", error));

      unsubSuppliers = onSnapshot(collection(firestoreDb, "suppliers"), (snapshot) => {
        const s = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier));
        setSuppliers(s);
      }, (error) => console.error("Suppliers Snapshot Error:", error));

      const initSettings = async () => {
        try {
          firestoreService.seedDatabase().catch(() => { });
          const sessSettings = await firestoreService.getSettings();
          if (sessSettings) setSettings(sessSettings);
        } catch (e) { }
      };
      initSettings();
    }

    return () => {
      unsubProducts?.();
      unsubTransactions?.();
      unsubSettings?.();
      unsubNotifications?.();
      unsubEmployees?.();
      unsubSuppliers?.();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    soundService.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest('button') || target.closest('a') || target.closest('[role="button"]') ||
        target.closest('input[type="checkbox"]') || target.closest('input[type="radio"]') ||
        target.closest('.cursor-pointer') || target.closest('[data-clickable="true"]') ||
        (target.onclick !== null) || (window.getComputedStyle(target).cursor === 'pointer');
      if (isClickable) soundService.playClick();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleSendToKitchen = useCallback(async (method: 'cash' | 'card' | 'online', tableNumber?: string, notes?: string) => {
    if (cart.length === 0) return;
    const EARLY_STAGES = ['pending', 'preparing'];
    if (editingTransactionId) {
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = subtotal * (settings.taxRate / 100);

      await firestoreService.updateTransaction(editingTransactionId, {
        items: cart,
        total: subtotal + taxAmount,
        status: 'pending', // Reset to pending when edited
        isUpdated: true,
        salesPerson: currentUser?.name || 'Unknown',
        guestCount: (tableNumber ? tableGuestCounts.get(tableNumber) : 0) ?? 0
      });

      for (const cartItem of cart) await firestoreService.decrementStock(cartItem.id, cartItem.quantity);

      setEditingTransactionId(null);
      setCart([]);
      soundService.playSuccess();
      return;
    }

    const activeTableOrders = (tableNumber && tableNumber !== 'Takeaway')
      ? transactions.filter(t => t.tableNumber === tableNumber && !['completed', 'refunded'].includes(t.status) && !t.isPaid)
      : [];
    const mergeCandidates = activeTableOrders.filter(t => EARLY_STAGES.includes(t.status));

    if (mergeCandidates.length > 0) {
      const masterOrder = mergeCandidates.find(t => t.status === 'preparing') || mergeCandidates[0];
      const consolidatedItems = [...masterOrder.items];
      cart.forEach(cartItem => {
        const existing = consolidatedItems.find(ci => ci.id === cartItem.id);
        if (existing) existing.quantity += cartItem.quantity;
        else consolidatedItems.push({ ...cartItem });
      });
      const subtotal = consolidatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = subtotal * (settings.taxRate / 100);
      await firestoreService.updateTransaction(masterOrder.id, {
        items: consolidatedItems,
        total: subtotal + taxAmount,
        isUpdated: true,
        notes: notes ? (masterOrder.notes ? `${masterOrder.notes} | ${notes}` : notes) : masterOrder.notes,
        salesPerson: currentUser?.name || 'Unknown',
        guestCount: (tableNumber ? tableGuestCounts.get(tableNumber) : masterOrder.guestCount) ?? 0
      });
      for (const cartItem of cart) await firestoreService.decrementStock(cartItem.id, cartItem.quantity);
    } else {
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = subtotal * (settings.taxRate / 100);
      const newTransaction: Transaction = {
        id: `TR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        date: new Date().toISOString(),
        items: [...cart],
        total: subtotal + taxAmount,
        status: 'pending',
        paymentMethod: method,
        tableNumber: tableNumber || "Takeaway",
        notes: notes || "",
        salesPerson: currentUser?.name || 'Unknown',
        guestCount: (tableNumber ? tableGuestCounts.get(tableNumber) : 0) ?? 0
      };
      await firestoreService.addTransaction(newTransaction);
      for (const cartItem of cart) await firestoreService.decrementStock(cartItem.id, cartItem.quantity);
    }
    setCart([]);
    setShowSuccessModal(true);
    soundService.playSuccess();
    setTimeout(() => setShowSuccessModal(false), 2000);
  }, [cart, transactions, settings.taxRate, currentUser?.name]);

  const handleAddProduct = useCallback(async (p: MenuItem) => await firestoreService.addProduct(p), []);
  const handleUpdateProduct = useCallback(async (p: MenuItem) => {
    const { id, ...data } = p;
    await firestoreService.updateProduct(id, data);
  }, []);
  const handleDeleteProduct = useCallback(async (id: string) => await firestoreService.deleteProduct(id), []);

  const getActiveTabTitle = useCallback(() => {
    const titles: any = {
      dashboard: 'الرئيسة', sales: 'المبيعات', kitchen: 'المطبخ', invoices: 'الفواتير',
      inventory: 'المخزون', digital_menu: 'المنيو الإلكتروني', suppliers: 'الموردين',
      reports: 'التقارير المفصلة', settings: 'الإعدادات'
    };
    return titles[activeTab] || 'نظام نقطة البيع';
  }, [activeTab]);

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
            readyOrders={readyOrders}
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
            readyOrders={readyOrders}
            transactions={transactions}
            currentUser={currentUser}
            onCompleteOrder={handleSendToCashier}
            onCancelOrder={handleCancelOrder}
            onEditOrder={handleEditOrder}
            onMoveTable={handleMoveTable}
            isEditing={!!editingTransactionId}
            onToggleReceiptPanel={() => setIsReceiptPanelOpen(!isReceiptPanelOpen)}
            cartCount={cartCount}
            selectedTableNumber={selectedTableNumber}
            onSelectTable={setSelectedTableNumber}
            tableGuestCounts={tableGuestCounts}
            onGuestCountChange={(num, count) => {
              setTableGuestCounts(prev => new Map(prev).set(num, count));
            }}
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
          return <DigitalMenuView products={products} storeName={settings.storeName} settings={settings} />;
        }
        break;
      case 'invoices':
        if (['admin', 'manager', 'cashier'].includes(role) || perms.includes('invoices') || hasAll) {
          return <InvoicesView
            transactions={transactions}
            onFinalizePayment={handleFinalizePayment}
            onCloseTable={handleCloseTable}
            onCancelOrder={handleCancelOrder}
            canFinalize={['admin', 'manager', 'cashier'].includes(role) || hasAll}
            products={products}
            settings={settings}
            currentUser={currentUser}
            onMoveTable={handleMoveTable}
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
          return <ReportsView transactions={transactions} employees={employees} suppliers={suppliers} settings={settings} />;
        }
        break;
      case 'performance':
        if (['admin', 'manager'].includes(role) || hasAll) {
          return <EmployeePerformanceView employees={employees} transactions={transactions} settings={settings} />;
        }
        break;
      case 'settings':
        if (['admin', 'manager'].includes(role)) {
          return <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} initialTab={settingsTab} />;
        }
        break;
      default: break;
    }
    return null;
  };


  // Connectivity Monitoring
  const [showStatusToast, setShowStatusToast] = useState<'none' | 'offline' | 'online'>('none');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatusToast('online');
      setTimeout(() => setShowStatusToast('none'), 3000);
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
          isEditing={!!editingTransactionId}
          guestCount={selectedTableNumber ? tableGuestCounts.get(selectedTableNumber) : 0}
          onGuestCountChange={(count) => {
            if (selectedTableNumber) {
              setTableGuestCounts(prev => new Map(prev).set(selectedTableNumber, count));
            }
          }}
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
