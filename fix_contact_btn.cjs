const fs = require('fs');
let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', 'utf8');

const target1 = `<a href={\`tel:${'\\'}${'$'}{supplier.phone}\`} className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-50 text-green-600 rounded-2xl font-black hover:bg-green-600 hover:text-white transition-all">
                <Phone size={18} /> اتصل بالمورد
              </a>`;

const replacement1 = '<button onClick={() => setSupplierInfoModal(supplier)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 rounded-2xl font-black hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all">\n                <Phone size={18} /> معلومات المورد\n              </button>';

const target2 = '<button onClick={() => generateReport()} className="w-14 h-14 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl hover:bg-brand-primary hover:text-white transition-all">\n                <FileText size={20} />\n              </button>';

const replacement2 = '<button onClick={() => setPrintIndividualModal(supplier)} className="w-14 h-14 flex items-center justify-center bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 rounded-2xl hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/20 active:scale-90 transition-all group">\n                <FileText size={20} className="group-hover:scale-110 transition-transform" />\n              </button>';

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
content = content.replace('border-gray-100 flex gap-4', 'border-gray-100 dark:border-white/10 flex gap-4');

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', content);

