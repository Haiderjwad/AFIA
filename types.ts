
import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  notes?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  colorClass: string;
  onClick?: () => void;
}

export interface SalesData {
  name: string;
  value: number;
}

export interface BarData {
  name: string;
  uv: number;
  pv: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'waiting_payment' | 'completed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'online';
  tableNumber?: string;
  isPaid?: boolean;
  notes?: string;
  isManual?: boolean;
  salesPerson?: string;     // Who took the order
  kitchenPerson?: string;   // Who prepared the order
  deliveredBy?: string;     // Who delivered it to table
  cashierPerson?: string;   // Who finalized payment
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  suppliedItem: string; // The item they supply
  category: string;
  stockProvided: number;
  costPerUnit: number;
  totalPaid: number;
  lastSupplyDate: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface AppSettings {
  id: string; // usually 'default'
  storeName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  enableNotifications: boolean;
  enableSounds: boolean;
  receiptType: 'a4' | 'thermal' | 'custom';
  brandColor?: string;
  storeLogo?: string; // base64 or URL
  showLogoOnReceipt: boolean;
  tablesCount: number;
  paymentMethods: {
    cash: boolean;
    card: boolean;
    online: boolean;
  };
  digitalMenu: {
    theme: 'modern' | 'classic' | 'minimal' | 'dark';
    primaryColor: string;
    layout: 'grid' | 'list';
    showIngredients: boolean;
    heroBanner?: string;
    foodIcon?: string;
    drinkIcon?: string;
    fontSize?: 'small' | 'medium' | 'large';
    cardStyle?: 'flat' | 'elevated' | 'glass';
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  };
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen' | 'sales';

export interface Employee {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  employeeId: string;
  joinedAt: string;
  salary?: number;
}

export interface SystemNotification {
  id: string;
  type: 'kitchen_warning' | 'low_stock_auto' | 'order_ready' | 'system_update';
  message: string;
  productName?: string;
  timestamp: string;
  read: boolean;
  sender?: string;
}
