
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { firestoreService } from '../services/firestoreService';
import { onSnapshot, collection } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { Users, Phone, Calendar, Star, MoreVertical } from 'lucide-react';

const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestoreDb, "customers"), (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(c);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-2">قاعدة بيانات العملاء</h1>
          <p className="text-gray-500">إدارة ولاء العملاء والبيانات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-3xl shadow-lg border border-gold-100 hover:-translate-y-1 transition-transform duration-300 relative group">

            <button className="absolute top-6 left-6 text-gray-400 hover:text-coffee-900">
              <MoreVertical size={20} />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gold-100 to-gold-200 rounded-full flex items-center justify-center text-2xl font-bold text-coffee-900 mb-4 shadow-inner">
                {customer.name?.charAt(0) || '?'}
              </div>
              <h3 className="font-bold text-xl text-coffee-900">{customer.name}</h3>
              <span className="flex items-center gap-1 text-gray-500 text-sm mt-1" dir="ltr">
                {customer.phone} <Phone size={12} />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <span className="block text-xs text-gray-500 mb-1">عدد الزيارات</span>
                <span className="font-bold text-coffee-900">{customer.visits}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <span className="block text-xs text-gray-500 mb-1">نقاط الولاء</span>
                <span className="font-bold text-gold-600 flex items-center justify-center gap-1">
                  {customer.loyaltyPoints} <Star size={12} fill="currentColor" />
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} /> آخر زيارة:
              </span>
              <span>{customer.lastVisit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomersView;
