
import React, { useState, useEffect } from 'react';
import { Settings, Bell, CreditCard, Save, Check, ChevronDown, Coins } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  initialTab?: 'general' | 'payments';
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
  const [activeTab, setActiveTab] = useState<'general' | 'payments'>(initialTab);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

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

  return (
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">إعدادات النظام</h1>
          <p className="text-gray-500">تخصيص الخيارات الأساسية، المدفوعات، ومعلومات المتجر</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${isSaved ? 'bg-green-600' : 'bg-coffee-900 hover:bg-gold-600'}`}
        >
          {isSaved ? <Check size={20} /> : <Save size={20} />}
          {isSaved ? 'تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'general' ? 'border-b-4 text-coffee-900 border-gold-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          عام
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-4 px-4 font-bold transition-all ${activeTab === 'payments' ? 'border-b-4 text-coffee-900 border-gold-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          وسائل الدفع
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
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">اسم المتجر</label>
                  <input
                    type="text"
                    value={localSettings.storeName}
                    onChange={(e) => handleChange('storeName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gold-400 outline-none text-coffee-900 font-bold"
                  />
                </div>

                <div className="space-y-2">
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
                  <p className="text-xs text-gray-400 px-1">سيتم استخدام الرمز المختار ({localSettings.currency}) في جميع الفواتير والتقارير.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">نسبة الضريبة (%)</label>
                  <input
                    type="number"
                    value={localSettings.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-gold-400 outline-none text-coffee-900 font-bold"
                  />
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
              {/* Cash Toggle */}
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

              {/* Card Toggle */}
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

              {/* Online Toggle */}
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
      </div>
    </div>
  );
};

export default SettingsView;
