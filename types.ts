
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
  status: 'completed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'online';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  visits: number;
  lastVisit: string;
  loyaltyPoints: number;
}

export interface AppSettings {
  id: string; // usually 'default'
  storeName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  enableNotifications: boolean;
  paymentMethods: {
    cash: boolean;
    card: boolean;
    online: boolean;
  };
}

export type ThemeColor = 'gold' | 'brown' | 'teal' | 'light';

export type SystemMode = 'cafe' | 'market' | 'restaurant' | 'retail';
