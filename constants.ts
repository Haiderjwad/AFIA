
import { SalesData, BarData, MenuItem, Customer, AppSettings } from './types';

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

export const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'أحمد محمد', phone: '0501234567', visits: 12, lastVisit: '2023-10-25', loyaltyPoints: 150 },
  { id: '2', name: 'سارة علي', phone: '0559876543', visits: 8, lastVisit: '2023-10-24', loyaltyPoints: 80 },
  { id: '3', name: 'خالد عبدالله', phone: '0543332211', visits: 25, lastVisit: '2023-10-26', loyaltyPoints: 320 },
  { id: '4', name: 'نورة السعيد', phone: '0567778899', visits: 3, lastVisit: '2023-10-20', loyaltyPoints: 30 },
  { id: '5', name: 'فهد العمري', phone: '0591112233', visits: 18, lastVisit: '2023-10-26', loyaltyPoints: 210 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  storeName: 'Cafe Sun',
  currency: '$',
  taxRate: 15,
  lowStockThreshold: 10,
  enableNotifications: true,
  paymentMethods: {
    cash: true,
    card: true,
    online: false
  }
};

export const CURRENCY = '$';
