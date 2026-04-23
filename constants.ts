
import { SalesData, BarData, MenuItem, Supplier, AppSettings } from './types';

export const SALES_DATA: SalesData[] = [
  { name: 'السبت', value: 400 },
  { name: 'الأحد', value: 600 },
  { name: 'الاثنين', value: 550 },
  { name: 'الثلاثاء', value: 800 },
  { name: 'الأربعاء', value: 650 },
  { name: 'الخميس', value: 1100 },
  { name: 'الجمعة', value: 950 },
];

export const BAR_DATA: BarData[] = [
  { name: 'MT', uv: 400, pv: 240 },
  { name: 'FZO', uv: 300, pv: 139 },
  { name: 'Y3II', uv: 200, pv: 980 },
  { name: 'H7', uv: 278, pv: 390 },
  { name: 'JK', uv: 189, pv: 480 },
];

export const PRODUCTS: MenuItem[] = [
  { id: '1', name: 'إسبريسو Solani', price: 12.50, category: 'Coffee', stock: 50 },
  { id: '2', name: 'لاتيه كراميل', price: 16.00, category: 'Coffee', stock: 45 },
  { id: '3', name: 'كعكة الشوكولاتة', price: 22.00, category: 'Dessert', stock: 20 },
  { id: '4', name: 'شاي أخضر فاخر', price: 10.00, category: 'Tea', stock: 100 },
  { id: '5', name: 'عصير برتقال', price: 14.50, category: 'Juice', stock: 30 },
  { id: '6', name: 'ساندوتش دجاج', price: 25.00, category: 'Food', stock: 15 },
  { id: '7', name: 'كرواسون زبدة', price: 8.00, category: 'Bakery', stock: 25 },
  { id: '8', name: 'موكا مثلج', price: 18.00, category: 'Coffee', stock: 40 },
  { id: '9', name: 'سلطة سيزر', price: 20.00, category: 'Food', stock: 12 },
  { id: '10', name: 'كوكيز شوفان', price: 6.00, category: 'Dessert', stock: 60 },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'شركة هرفي للمخبوزات',
    phone: '0112223334',
    suppliedItem: 'كرواسون وخبز',
    category: 'Bakery',
    stockProvided: 200,
    costPerUnit: 5.50,
    totalPaid: 1100,
    lastSupplyDate: '2023-11-20'
  },
  {
    id: '2',
    name: 'محامص بن العالمية',
    phone: '0119998887',
    suppliedItem: 'حبوب بن إسبريسو',
    category: 'Coffee',
    stockProvided: 50,
    costPerUnit: 85.00,
    totalPaid: 4250,
    lastSupplyDate: '2023-11-18'
  },
  {
    id: '3',
    name: 'شركة نادك للألبان',
    phone: '0566655544',
    suppliedItem: 'حليب كامل الدسم',
    category: 'Milk',
    stockProvided: 150,
    costPerUnit: 12.00,
    totalPaid: 1800,
    lastSupplyDate: '2023-11-22'
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  storeName: 'Cafe Sun',
  currency: '$',
  taxRate: 15,
  lowStockThreshold: 10,
  enableNotifications: true,
  enableSounds: true,
  receiptType: 'a4',
  brandColor: '#2d6a4f',
  showLogoOnReceipt: true,
  tablesCount: 15,
  paymentMethods: {
    cash: true,
    card: true,
    online: false
  },
  digitalMenu: {
    theme: 'modern',
    primaryColor: '#2d6a4f',
    layout: 'grid',
    showIngredients: true,
    heroBanner: '',
    foodIcon: '🍔',
    drinkIcon: '☕',
    fontSize: 'medium',
    cardStyle: 'elevated',
    borderRadius: 'lg'
  }
};

export const CURRENCY = '$';
