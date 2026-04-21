import React, { useState, useEffect } from 'react';
import { Settings, Bell, CreditCard, Save, Check, ChevronDown, Coins, Users, UserPlus, Trash2, Edit, Shield, Mail, Key, User, ListChecks, X, Hash, Printer, FileText, Smartphone, Image, Upload, Trash, Sparkles, Palette } from 'lucide-react';
import { AppSettings, Employee, UserRole } from '../types';
import { firestoreService } from '../services/firestoreService';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  initialTab?: 'general' | 'payments' | 'employees' | 'printing';
}

const CURRENCY_OPTIONS = [
  { code: 'IQD', symbol: 'د.ع', name: 'دينار عراقي' },
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي' },
  { code: 'KWD', symbol: 'د.ك', name: 'دينار كويتي' },
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' },
  { code: 'JOD', symbol: 'د.أ', name: 'دينار أردني' },
];

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, initialTab = 'general' }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'employees' | 'printing'>(initialTab);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // New Employee Form State
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales' as UserRole,
    employeeId: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    const data = await firestoreService.getEmployees();
    setEmployees(data);
    setLoadingEmployees(false);
  };

  // Sync active tab if initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentToggle = (method: 'cash' | 'card' | 'online') => {
    setLocalSettings(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: !prev.paymentMethods[method]
      }
    }));
  };

  const handleAddEmployee = async () => {
    if (!empForm.email || !empForm.password || !empForm.name) {
      alert('يرجى ملء كافة البيانات الأساسية (الاسم، البريد، كلمة السر)');
      return;
    }

    let secondaryApp;
    try {
      setLoadingEmployees(true);

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };

      secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, empForm.email, empForm.password);
      const uid = userCredential.user.uid;

      const newEmployee: Employee = {
        uid: uid,
        name: empForm.name,
        email: empForm.email,
        role: empForm.role,
        permissions: empForm.permissions.length > 0 ? empForm.permissions : [empForm.role],
        employeeId: empForm.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        joinedAt: new Date().toISOString()
      };

      await firestoreService.addEmployee(newEmployee);

      setEmpForm({ name: '', email: '', password: '', role: 'sales', employeeId: '', permissions: [] });
      setIsEmployeeModalOpen(false);
      fetchEmployees();
      alert('تم إنشاء الموظف وافتتاح حساب رسمي له بنجاح');
    } catch (error: any) {
      console.error("Error adding employee:", error);
      alert(`فشل إنشاء الحساب: ${error.message}`);
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setLoadingEmployees(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      await firestoreService.deleteEmployee(id);
      fetchEmployees();
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 no-scrollbar" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">إعدادات النظام</h1>
          <p className="text-gray-500">تخصيص الخيارات الأساسية، المدفوعات، ومعلومات المتجر</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white shadow-xl transition-all transform active:scale-95 ${isSaved ? 'bg-green-600 shadow-green-200' : 'bg-brand-primary hover:bg-brand-secondary shadow-brand-primary/20'}`}
        >
          {isSaved ? <Check size={24} /> : <Save size={24} />}
          {isSaved ? 'تم حفظ التغييرات تماماً' : 'حفظ كافة التعديلات'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'general' ? 'border-b-4 text-brand-dark border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
        >
          عام
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'payments' ? 'border-b-4 text-brand-dark border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
        >
          وسائل الدفع
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'employees' ? 'border-b-4 text-brand-dark border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
        >
          إدارة الموظفين
        </button>
        <button
          onClick={() => setActiveTab('printing')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'printing' ? 'border-b-4 text-brand-dark border-brand-accent' : 'text-gray-400 hover:text-gray-600'}`}
        >
          إعدادات الطباعة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* General Settings */}
        {activeTab === 'general' && (
          <>
            <div className="bg-white rounded-3xl shadow-lg border border-gold-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg text-coffee-900 flex items-center gap-2">
                  <Settings size={20} /> معلومات المتجر
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700">اسم المتجر</label>
                  <input
                    type="text"
                    value={localSettings.storeName}
                    onChange={(e) => handleChange('storeName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gold-400 outline-none text-coffee-900 font-bold"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Image size={16} className="text-brand-primary" /> شعار المتجر (Brand Logo)
                  </label>
                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-dashed border-brand-primary/20">
                    <div className="w-20 h-20 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-100 relative group">
                      {localSettings.storeLogo ? (
                        <>
                          <img src={localSettings.storeLogo} alt="Store Logo" className="w-full h-full object-contain" />
                          <button
                            onClick={() => handleChange('storeLogo', '')}
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash size={16} />
                          </button>
                        </>
                      ) : (
                        <Upload size={24} className="text-brand-primary/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleChange('storeLogo', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/10"
                      >
                        <Upload size={16} /> رفع الشعار
                      </label>
                      <p className="text-[10px] text-gray-400 font-bold mt-2 leading-relaxed">يفضل استخدام صورة شفافة (PNG) بحجم 512x512 بكسل.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700">عملة النظام</label>
                  <div className="relative">
                    <select
                      value={localSettings.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-4 py-3 pl-10 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gold-400 outline-none text-coffee-900 font-bold appearance-none cursor-pointer"
                    >
                      {CURRENCY_OPTIONS.map((curr) => (
                        <option key={curr.code} value={curr.symbol}>
                          {curr.name} ({curr.code}) - {curr.symbol}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    <Coins className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none opacity-50" size={18} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700">نسبة الضريبة (%)</label>
                  <input
                    type="number"
                    value={localSettings.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gold-400 outline-none text-coffee-900 font-bold"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Hash size={16} className="text-brand-primary" /> عدد الطاولات في الصالة
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={localSettings.tablesCount}
                    onChange={(e) => handleChange('tablesCount', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gold-400 outline-none text-coffee-900 font-bold"
                  />
                  <p className="text-[10px] text-gray-400 font-bold px-1">سيتم توليد أرقام الطاولات تلقائياً في قائمة المبيعات بناءً على هذا الرقم.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gold-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg text-coffee-900 flex items-center gap-2">
                  <Bell size={20} /> التنبيهات والأصوات
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-coffee-900">تفعيل التنبيهات</span>
                  <input
                    type="checkbox"
                    checked={localSettings.enableNotifications}
                    onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                    className="accent-gold-500 w-6 h-6 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div>
                    <span className="font-medium text-coffee-900 block">أصوات النظام</span>
                    <span className="text-[10px] text-gray-400">إصدار صوت نقر احترافي عند التفاعل</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.enableSounds}
                    onChange={(e) => handleChange('enableSounds', e.target.checked)}
                    className="accent-gold-500 w-6 h-6 cursor-pointer"
                  />
                </div>

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-coffee-900">حد المخزون المنخفض</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={localSettings.lowStockThreshold}
                      onChange={(e) => handleChange('lowStockThreshold', Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center font-bold text-coffee-900"
                    />
                  </div>
                  <p className="text-xs text-gray-500">سيظهر إشعار عندما يقل الكمية عن هذا الرقم.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payment Settings */}
        {activeTab === 'payments' && (
          <div className="col-span-1 md:col-span-2 bg-white rounded-3xl shadow-lg border border-gold-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-coffee-900 flex items-center gap-2">
                <CreditCard size={20} /> خيارات الدفع المتاحة
              </h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => handlePaymentToggle('cash')}
                className={`cursor-pointer border-2 rounded-2xl p-6 flex flex-col items-center gap-4 transition-all ${localSettings.paymentMethods.cash ? 'border-green-500 bg-green-50' : 'border-gray-200 grayscale'}`}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-3xl">💵</div>
                <h4 className="font-bold text-xl text-coffee-900">نقد (Cash)</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${localSettings.paymentMethods.cash ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                  {localSettings.paymentMethods.cash ? 'مفعل' : 'معطل'}
                </span>
              </div>

              <div
                onClick={() => handlePaymentToggle('card')}
                className={`cursor-pointer border-2 rounded-2xl p-6 flex flex-col items-center gap-4 transition-all ${localSettings.paymentMethods.card ? 'border-blue-500 bg-blue-50' : 'border-gray-200 grayscale'}`}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-3xl">💳</div>
                <h4 className="font-bold text-xl text-coffee-900">بطاقة (Card)</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${localSettings.paymentMethods.card ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                  {localSettings.paymentMethods.card ? 'مفعل' : 'معطل'}
                </span>
              </div>

              <div
                onClick={() => handlePaymentToggle('online')}
                className={`cursor-pointer border-2 rounded-2xl p-6 flex flex-col items-center gap-4 transition-all ${localSettings.paymentMethods.online ? 'border-purple-500 bg-purple-50' : 'border-gray-200 grayscale'}`}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md text-3xl">🌐</div>
                <h4 className="font-bold text-xl text-coffee-900">دفع إلكتروني</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${localSettings.paymentMethods.online ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'}`}>
                  {localSettings.paymentMethods.online ? 'مفعل' : 'معطل'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Printing Settings */}
        {activeTab === 'printing' && (
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-brand-primary/5 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-brand-dark flex items-center gap-2">
                    <Printer size={24} className="text-brand-primary" /> خيارات تخطيط الفاتورة
                  </h3>
                  <p className="text-xs text-gray-400 font-bold tracking-widest mt-1">Receipt & Invoice Layout Intelligence</p>
                </div>
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* A4 Option */}
                <div
                  onClick={() => handleChange('receiptType', 'a4')}
                  className={`group relative cursor-pointer border-3 rounded-[2.5rem] p-6 transition-all duration-500 flex flex-col items-center gap-4 ${localSettings.receiptType === 'a4' ? 'border-brand-primary bg-brand-light/10 ring-4 ring-brand-primary/5' : 'border-gray-100 hover:border-brand-primary/30'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${localSettings.receiptType === 'a4' ? 'bg-brand-primary text-white rotate-6 scale-110' : 'bg-gray-100 text-gray-400 group-hover:rotate-6'}`}>
                    <FileText size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-black text-brand-dark mb-1">فاتورة A4</h4>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed">توثيق رسمي وشامل للمؤسسات.</p>
                  </div>
                  {localSettings.receiptType === 'a4' && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                      <Check size={14} />
                    </div>
                  )}
                </div>

                {/* Thermal Option */}
                <div
                  onClick={() => handleChange('receiptType', 'thermal')}
                  className={`group relative cursor-pointer border-3 rounded-[2.5rem] p-6 transition-all duration-500 flex flex-col items-center gap-4 ${localSettings.receiptType === 'thermal' ? 'border-brand-accent bg-brand-accent/5 ring-4 ring-brand-accent/5' : 'border-gray-100 hover:border-brand-accent/30'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${localSettings.receiptType === 'thermal' ? 'bg-brand-accent text-white -rotate-6 scale-110' : 'bg-gray-100 text-gray-400 group-hover:-rotate-6'}`}>
                    <Smartphone size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-black text-brand-dark mb-1">وصل حراري</h4>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed">سريع وموفر، مثالي للطلبات اليومية.</p>
                  </div>
                  {localSettings.receiptType === 'thermal' && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                      <Check size={14} />
                    </div>
                  )}
                </div>

                {/* Custom Premium Option */}
                <div
                  onClick={() => handleChange('receiptType', 'custom')}
                  className={`group relative cursor-pointer border-3 rounded-[2.5rem] p-6 transition-all duration-500 flex flex-col items-center gap-4 ${localSettings.receiptType === 'custom' ? 'border-brand-dark bg-brand-dark/5 ring-4 ring-brand-dark/5' : 'border-gray-100 hover:border-brand-dark/30'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${localSettings.receiptType === 'custom' ? 'bg-brand-dark text-white scale-110' : 'bg-gray-100 text-gray-400 group-hover:scale-110'}`}>
                    <Sparkles size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-black text-brand-dark mb-1">فاتورة فارهة</h4>
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed">تصميم فائق الدقة، شعارين، وعلامة مائية.</p>
                  </div>
                  {localSettings.receiptType === 'custom' && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-brand-dark text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Brand Color Picker (Only shown if custom is selected) */}
              {localSettings.receiptType === 'custom' && (
                <div className="mx-10 mb-8 p-8 bg-brand-dark/5 rounded-[2rem] border border-brand-dark/10 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all border-4 border-white"
                      style={{ backgroundColor: localSettings.brandColor }}
                    >
                      <ListChecks size={24} className="text-white drop-shadow-md" />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-dark text-lg">اللون المحوري للهوية (Identity Color)</h4>
                      <p className="text-xs text-gray-400 font-bold mt-1">سيتم استخدام هذا اللون في تخطيط الفاتورة الفارهة ليتناسب مع شعارك.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={localSettings.brandColor}
                      onChange={(e) => handleChange('brandColor', e.target.value)}
                      className="w-16 h-16 rounded-2xl cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    />
                    <span className="font-mono font-bold text-xs text-brand-dark opacity-40 uppercase tracking-widest">{localSettings.brandColor}</span>
                  </div>
                </div>
              )}

              {/* Show logo toggle */}
              <div className="mx-10 mb-8 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all ${localSettings.showLogoOnReceipt ? 'bg-brand-primary text-white' : 'bg-white text-gray-300'}`}>
                    <Image size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-brand-dark text-lg">إدراج شعار المتجر في الفواتير</h4>
                    <p className="text-xs text-gray-400 font-bold mt-1">تفعيل هذا الخيار سيقوم بوضع شعار علامتك التجارية في أعلى الفاتورة المطبوعة.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleChange('showLogoOnReceipt', !localSettings.showLogoOnReceipt)}
                  className={`group relative w-16 h-8 rounded-full transition-all duration-300 ${localSettings.showLogoOnReceipt ? 'bg-brand-primary' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${localSettings.showLogoOnReceipt ? 'right-1' : 'right-9'}`} />
                </button>
              </div>

              <div className="mx-10 mb-10 p-6 bg-brand-dark/5 rounded-3xl border border-dashed border-brand-dark/10 flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-brand-dark"><Printer size={20} /></div>
                <div>
                  <p className="text-sm font-black text-brand-dark">معاينة الطباعة</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">سيتم تطبيق التنسيق المختار تلقائياً عند طلب طباعة أي فاتورة من قسم الفواتير.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees Management */}
        {activeTab === 'employees' && (
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-brand-dark flex items-center gap-2">
                  <Users size={24} className="text-brand-primary" /> كادر العمل الذكي
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Personnel Management Intelligence</p>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(true)}
                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-black hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
              >
                <UserPlus size={20} /> إضافة موظف جديد
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-brand-primary/5 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-brand-light/20 border-b border-brand-primary/10">
                  <tr>
                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter">الموظف</th>
                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter">الدور الوظيفي</th>
                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter text-center">كود التعريف</th>
                    <th className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter text-left">التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingEmployees ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400">جاري تحميل البيانات السحابية...</td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic">لا يوجد موظفين مسجلين حالياً</td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-brand-light/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-lg">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-brand-dark">{emp.name}</p>
                              <p className="text-xs text-gray-400 font-bold">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${emp.role === 'admin' ? 'bg-red-50 text-red-600' :
                            emp.role === 'manager' ? 'bg-brand-accent/20 text-brand-accent' :
                              'bg-brand-light/50 text-brand-primary'
                            }`}>
                            {emp.role === 'admin' ? 'مدير' : emp.role === 'manager' ? 'مسؤول' : emp.role === 'cashier' ? 'كاشير' : 'مبيعات'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center font-bold text-brand-dark/40 text-sm">
                          {emp.employeeId}
                        </td>
                        <td className="px-8 py-5 text-left">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingEmployee(emp); setEmpForm({ ...emp, password: '' }); setIsEmployeeModalOpen(true); }}
                              className="p-2.5 bg-gray-50 text-gray-400 hover:bg-brand-primary hover:text-white rounded-xl transition-all"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.uid || emp.employeeId)}
                              className="p-2.5 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Employee Modal */}
        {isEmployeeModalOpen && (
          <div className="fixed inset-0 z-[110] bg-brand-dark/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
              <div className="p-8 bg-brand-dark text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm shadow-xl">
                    <UserPlus size={32} className="text-brand-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{editingEmployee ? 'تحديث بيانات الموظف' : 'تسجيل موظف جديد'}</h2>
                    <p className="text-brand-accent/60 text-xs font-bold uppercase tracking-widest mt-1">Staff Access Intelligence</p>
                  </div>
                </div>
                <button onClick={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }} className="bg-white/10 hover:bg-red-500 hover:text-white p-3 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                      <User size={14} /> اسم الموظف بالكامل
                    </label>
                    <input
                      type="text"
                      value={empForm.name}
                      onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                      placeholder="مثال: أحمد محمد"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                      <Hash size={14} /> الكود الوظيفي
                    </label>
                    <input
                      type="text"
                      value={empForm.employeeId}
                      onChange={(e) => setEmpForm({ ...empForm, employeeId: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                      placeholder="مثال: EMP-101"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                    <Mail size={14} /> البريد الإلكتروني (لتسجيل الدخول)
                  </label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                      <Shield size={14} /> الدور الوظيفي
                    </label>
                    <select
                      value={empForm.role}
                      onChange={(e) => setEmpForm({ ...empForm, role: e.target.value as UserRole })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark appearance-none"
                    >
                      <option value="sales">مندوب مبيعات</option>
                      <option value="cashier">كاشير / محاسب</option>
                      <option value="kitchen">شيف مطبخ</option>
                      <option value="manager">مدير فرع</option>
                      <option value="admin">مدير نظام</option>
                    </select>
                  </div>
                  {!editingEmployee && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase flex items-center gap-2">
                        <Key size={14} /> كلمة السر الأولية
                      </label>
                      <input
                        type="password"
                        value={empForm.password}
                        onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary/10 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-dark"
                        placeholder="******"
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 bg-brand-light/10 rounded-3xl border border-dashed border-brand-primary/20">
                  <h4 className="text-sm font-black text-brand-dark mb-4 flex items-center gap-2">
                    <ListChecks size={18} className="text-brand-primary" /> صلاحيات الوصول المخصصة
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['dashboard', 'sales', 'kitchen', 'invoices', 'inventory', 'suppliers', 'reports', 'settings'].map(perm => (
                      <label key={perm} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-brand-light/5 transition-all">
                        <input
                          type="checkbox"
                          checked={empForm.permissions.includes(perm)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEmpForm(prev => ({
                              ...prev,
                              permissions: checked
                                ? [...prev.permissions, perm]
                                : prev.permissions.filter(p => p !== perm)
                            }));
                          }}
                          className="w-5 h-5 accent-brand-primary"
                        />
                        <span className="text-xs font-bold text-brand-dark capitalize">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex gap-4">
                <button
                  onClick={editingEmployee ? () => { } : handleAddEmployee}
                  className="flex-1 bg-brand-primary text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
                >
                  {editingEmployee ? <Save size={20} /> : <UserPlus size={20} />}
                  {editingEmployee ? 'حفظ التعديلات' : 'إنشاء الموظف والحساب'}
                </button>
                <button
                  onClick={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}
                  className="px-8 bg-white text-gray-400 font-black py-5 rounded-[1.5rem] border-2 border-gray-100 hover:text-brand-dark transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
