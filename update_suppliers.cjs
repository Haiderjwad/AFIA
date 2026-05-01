const fs = require('fs');
let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', 'utf8');

// 1. Add new state for the modals
content = content.replace(
  `const [isExporting, setIsExporting] = useState(false);`,
  `const [isExporting, setIsExporting] = useState(false);\n  const [supplierInfoModal, setSupplierInfoModal] = useState<Supplier | null>(null);\n  const [printIndividualModal, setPrintIndividualModal] = useState<Supplier | null>(null);`
);

// 2. Add Add Supplier modal close button styles
content = content.replace(
  `className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-white/10"`,
  `className="w-14 h-14 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all border border-transparent hover:border-red-500 hover:-translate-y-1 active:scale-90 shadow-lg group"`
);

// 3. Update the labels inside the add form
content = content.replace(/className="text-brand-dark\/60 text-xs font-black uppercase mr-2 tracking-widest"/g, `className="text-brand-dark dark:text-gray-200 text-sm font-black uppercase mr-2 tracking-widest mb-1 block"`);

// 4. Update the input field backgrounds for dark mode inside the add form
content = content.replace(/className="w-full py-4 px-6 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-\[1\.5rem\] outline-none transition-all font-black text-brand-dark/g, `className="w-full py-4 px-6 bg-gray-50 dark:bg-brand-dark/50 dark:border-white/10 dark:text-white dark:focus:border-brand-primary border border-transparent focus:border-brand-primary focus:bg-white rounded-[1.5rem] outline-none transition-all font-black text-brand-dark`);

// 5. Update Confirm Add Button
content = content.replace(
  `className="flex-[2] py-6 rounded-[2.2rem] bg-brand-primary text-white font-black shadow-2xl shadow-brand-primary/20 hover:bg-brand-dark transition-all active:scale-95 flex items-center justify-center gap-3"`,
  `className="flex-[2] py-6 rounded-[2.2rem] bg-emerald-500 text-white font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group"`
);

// 6. Update Cancel Button
content = content.replace(
  `className="flex-1 py-6 rounded-[2.2rem] bg-gray-50 text-brand-dark/40 font-black hover:bg-gray-100 transition-all active:scale-95 border-2 border-transparent"`,
  `className="flex-1 py-6 rounded-[2.2rem] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black hover:bg-gray-200 dark:hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg transition-all active:scale-95 border border-transparent hover:border-gray-300 dark:hover:border-white/10"`
);

// 7. Update Active Category Filter Buttons
content = content.replace(
  /activeFrequency === freq \? 'bg-brand-primary text-white shadow-xl shadow-brand-primary\/20 scale-105' : 'bg-gray-50 text-brand-dark\/40 hover:bg-brand-light\/30'/g,
  `activeFrequency === freq ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105 border-brand-primary' : 'bg-gray-50 dark:bg-brand-dark/40 text-brand-dark/60 dark:text-gray-300 border-transparent hover:bg-brand-primary/10 hover:text-brand-primary hover:-translate-y-1 border'`
);

// 8. Edit / Delete icons in supplier card
content = content.replace(
  `className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-brand-primary transition-all"`,
  `className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-500 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 active:scale-90 transition-all"`
);
content = content.replace(
  `className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 transition-all"`,
  `className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-500 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 active:scale-90 transition-all"`
);

// 9. Add Contact & Print Individual icon inside Card
content = content.replace(
  /<a href={`tel:\$\{supplier\.phone\}`} className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-50 text-green-600 rounded-2xl font-black hover:bg-green-600 hover:text-white transition-all">[\s\S]*?<Phone size={18} \/> اتصل بالمورد[\s\S]*?<\/a>/,
  `<button onClick={() => setSupplierInfoModal(supplier)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-2xl font-black hover:bg-emerald-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all">
                <Phone size={18} /> معلومات المورد
              </button>`
);
content = content.replace(
  /<button onClick={\(\) => generateReport\(\)} className="w-14 h-14 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl hover:bg-brand-primary hover:text-white transition-all">[\s\S]*?<FileText size={20} \/>[\s\S]*?<\/button>/,
  `<button onClick={() => setPrintIndividualModal(supplier)} className="w-14 h-14 flex items-center justify-center bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 rounded-2xl hover:bg-orange-500 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/20 active:scale-90 transition-all">
                <FileText size={20} />
              </button>`
);

// 10. Update header Add Supplier Button
content = content.replace(
  `className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-dark text-white px-6 md:px-10 py-3 md:py-4 rounded-2xl font-black shadow-xl shadow-brand-primary/20 active:scale-95 transition-all group text-sm md:text-base"`,
  `className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-6 md:px-10 py-3 md:py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all group text-sm md:text-base relative overflow-hidden"`
);

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', content);
