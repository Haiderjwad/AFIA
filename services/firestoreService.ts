import {
    collection,
    getDocs,
    setDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    getDoc,
    writeBatch,
    where,
    increment,
    runTransaction
} from "firebase/firestore";
import { db } from "../firebase";
import { MenuItem, Transaction, Supplier, AppSettings, Employee } from "../types";
import { PRODUCTS, MOCK_SUPPLIERS, DEFAULT_SETTINGS } from "../constants";

export const firestoreService = {
    // Products
    async getProducts(): Promise<MenuItem[]> {
        const snapshot = await getDocs(collection(db, "products"));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
    },

    async addProduct(product: MenuItem): Promise<string> {
        const docRef = await addDoc(collection(db, "products"), product);
        return docRef.id;
    },

    async updateProduct(id: string, product: Partial<MenuItem>): Promise<void> {
        const docRef = doc(db, "products", id);
        await updateDoc(docRef, product as any);
    },

    async decrementStock(id: string, quantity: number): Promise<void> {
        const docRef = doc(db, "products", id);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            await updateDoc(docRef, {
                stock: increment(-quantity)
            });
        } else {
            console.warn(`Attempted to decrement stock for non-existent product: ${id}`);
        }
    },

    async deleteProduct(id: string): Promise<void> {
        await deleteDoc(doc(db, "products", id));
    },

    // Transactions
    async getTransactions(): Promise<Transaction[]> {
        const q = query(collection(db, "transactions"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
    },

    async addTransaction(transaction: Transaction): Promise<string> {
        const docRef = await addDoc(collection(db, "transactions"), transaction);
        return docRef.id;
    },

    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
        const docRef = doc(db, "transactions", id);
        await updateDoc(docRef, updates as any);
    },

    async updateTransactionStatus(id: string, status: Transaction['status']): Promise<void> {
        const docRef = doc(db, "transactions", id);
        await updateDoc(docRef, { status });
    },
    async deleteTransaction(id: string): Promise<void> {
        await deleteDoc(doc(db, "transactions", id));
    },

    // Employees
    async getEmployee(uid: string): Promise<Employee | null> {
        const docRef = doc(db, "employees", uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as Employee;
        }
        return null;
    },

    async getEmployeeByEmail(email: string): Promise<Employee | null> {
        // Query both exact and lowercase to be safe
        const q = query(collection(db, "employees"), where("email", "in", [email, email.toLowerCase(), email.toUpperCase()]));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return { ...snapshot.docs[0].data(), uid: snapshot.docs[0].id } as Employee;
        }
        return null;
    },

    async syncEmployeeUid(email: string, uid: string): Promise<void> {
        const q = query(collection(db, "employees"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            await updateDoc(doc(db, "employees", docId), { uid });
            // Also move to doc with UID as ID for faster access next time
            const data = snapshot.docs[0].data();
            await setDoc(doc(db, "employees", uid), { ...data, uid });
        }
    },

    async getEmployees(): Promise<Employee[]> {
        const snapshot = await getDocs(collection(db, "employees"));
        // Deduplicate by email if necessary (since we might have both id-based and uid-based docs)
        const map = new Map<string, Employee>();
        snapshot.docs.forEach(doc => {
            const data = doc.data() as Employee;
            // Crucial fix: ensure UID is set to document ID if not present in data
            map.set(data.email, { ...data, uid: data.uid || doc.id });
        });
        return Array.from(map.values());
    },

    async addEmployee(employee: Employee): Promise<void> {
        // Use employeeId as doc ID initially if UID is not set
        const id = employee.uid || `temp-${employee.employeeId}`;
        await setDoc(doc(db, "employees", id), employee);
    },

    async updateEmployee(id: string, updates: Partial<Employee>): Promise<void> {
        if (!id) {
            throw new Error("Employee ID is required for update");
        }

        // Remove undefined fields to prevent Firestore update errors
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        const docRef = doc(db, "employees", id);
        await updateDoc(docRef, cleanUpdates);

        // If we updated by non-UID ID, we might need to sync with UID ID if it exists
        if (updates.uid && updates.uid !== id) {
            await setDoc(doc(db, "employees", updates.uid), cleanUpdates, { merge: true });
        }
    },

    async deleteEmployee(id: string): Promise<void> {
        await deleteDoc(doc(db, "employees", id));
    },

    // Suppliers
    async getSuppliers(): Promise<Supplier[]> {
        const snapshot = await getDocs(collection(db, "suppliers"));
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier));
    },

    async addSupplier(supplier: Supplier): Promise<string> {
        const docRef = await addDoc(collection(db, "suppliers"), supplier);
        return docRef.id;
    },

    async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<void> {
        const docRef = doc(db, "suppliers", id);
        await updateDoc(docRef, supplier as any);
    },

    async deleteSupplier(id: string): Promise<void> {
        await deleteDoc(doc(db, "suppliers", id));
    },

    // Settings
    async getSettings(): Promise<AppSettings | null> {
        const docRef = doc(db, "settings", "default");
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as AppSettings;
        }
        return null;
    },

    async updateSettings(settings: AppSettings): Promise<void> {
        await setDoc(doc(db, "settings", "default"), settings);
    },

    // Seeding Lock
    _isSeeding: false,

    // Seeding
    async seedDatabase(): Promise<void> {
        if (this._isSeeding) return;
        this._isSeeding = true;
        try {

            // Check if products exist
            const productsSnapshot = await getDocs(collection(db, "products"));
            if (productsSnapshot.empty) {
                const batch = writeBatch(db);
                PRODUCTS.forEach(product => {
                    const docRef = doc(collection(db, "products"));
                    batch.set(docRef, product);
                });
                await batch.commit();
                console.log("Firestore: Products seeded");
            }

            // Check if settings exist
            const settingsRef = doc(db, "settings", "default");
            const settingsSnapshot = await getDoc(settingsRef);
            if (!settingsSnapshot.exists()) {
                await setDoc(settingsRef, DEFAULT_SETTINGS);
                console.log("Firestore: Settings seeded");
            }

            // Check if suppliers exist
            const suppliersSnapshot = await getDocs(collection(db, "suppliers"));
            if (suppliersSnapshot.empty) {
                const batch = writeBatch(db);
                MOCK_SUPPLIERS.forEach(supplier => {
                    const docRef = doc(collection(db, "suppliers"));
                    batch.set(docRef, supplier);
                });
                await batch.commit();
                console.log("Firestore: Suppliers seeded");
            }

            // Check if employees exist
            const employeesSnapshot = await getDocs(collection(db, "employees"));
            if (employeesSnapshot.empty) {
                const adminData: Employee = {
                    uid: "default-admin", // This will be linked to auth user
                    name: "مدير النظام",
                    email: "admin@cafesun.com",
                    role: "admin",
                    permissions: ["all"],
                    employeeId: "EMP-001",
                    joinedAt: new Date().toISOString()
                };
                // Use a specific ID for seeding so we don't duplicate on multiple loads
                await setDoc(doc(db, "employees", "seed-admin-id"), adminData);
                console.log("Firestore: Default employee created");
            }
        } catch (error) {
            console.error("Firestore Seeding Failed:", error);
        } finally {
            this._isSeeding = false;
        }
    }
};

