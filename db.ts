
import Dexie from 'dexie';
import { MenuItem, Transaction, Customer, AppSettings } from './types';
import { PRODUCTS, MOCK_CUSTOMERS, DEFAULT_SETTINGS } from './constants';

export class GoldenPOSDatabase extends Dexie {
  // Use any for table properties to avoid strict type issues with some ESM builds
  products!: any;
  transactions!: any;
  customers!: any;
  settings!: any;

  constructor() {
    super('GoldenPOSDB');
    // Define schema
    (this as any).version(1).stores({
      products: 'id, name, category, stock',
      transactions: 'id, date, status',
      customers: 'id, name, phone',
      settings: 'id' // Singleton store usually, or key-value
    });
  }
}

export const db = new GoldenPOSDatabase();

// Function to seed initial data if DB is empty
export const seedDatabase = async () => {
    try {
        if (!db.products) return; 
        
        const productCount = await db.products.count();
        if (productCount === 0) {
            await db.products.bulkAdd(PRODUCTS);
            console.log("Products seeded");
        }

        const customerCount = await db.customers.count();
        if (customerCount === 0) {
            await db.customers.bulkAdd(MOCK_CUSTOMERS);
            console.log("Customers seeded");
        }

        const settingsCount = await db.settings.count();
        if (settingsCount === 0) {
            await db.settings.add(DEFAULT_SETTINGS);
            console.log("Settings seeded");
        }

    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
