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
    where
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
        const q = query(collection(db, "employees"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return { ...snapshot.docs[0].data() } as Employee;
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

    // Seeding
    async seedDatabase(): Promise<void> {
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
    }
};
