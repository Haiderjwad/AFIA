const fs = require('fs');

let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', 'utf8');

// 1. Fix Performance Table Headers
content = content.replace(
  /<tr className="bg-gray-50\/50 dark:bg-brand-light\/5">/g,
  '<tr className="bg-brand-light/20 dark:bg-white/5 border-b border-brand-primary/10 dark:border-white/10">'
);
content = content.replace(
  /className="px-8 py-5 text-\[10px\] font-black text-gray-400 uppercase"/g,
  'className="px-8 py-5 text-[11px] font-black text-brand-dark dark:text-gray-300 uppercase tracking-widest"'
);
content = content.replace(
  /className="px-8 py-5 text-\[10px\] font-black text-gray-400 uppercase text-center"/g,
  'className="px-8 py-5 text-[11px] font-black text-brand-dark dark:text-gray-300 uppercase tracking-widest text-center"'
);
content = content.replace(
  /className="px-8 py-5 text-\[10px\] font-black text-gray-400 uppercase text-left"/g,
  'className="px-8 py-5 text-[11px] font-black text-brand-dark dark:text-gray-300 uppercase tracking-widest text-left"'
);

// 2. Fix Management Table Headers
content = content.replace(
  /<thead className="bg-brand-light\/20 border-b border-brand-primary\/10">/g,
  '<thead className="bg-brand-light/20 dark:bg-white/5 border-b border-brand-primary/10 dark:border-white/10">'
);

content = content.replace(
  /className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter text-center"/g,
  'className="px-8 py-5 text-[11px] font-black text-brand-dark dark:text-gray-300 uppercase tracking-widest text-center"'
);
content = content.replace(
  /className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter text-left"/g,
  'className="px-8 py-5 text-[11px] font-black text-brand-dark dark:text-gray-300 uppercase tracking-widest text-left"'
);
content = content.replace(
  /className="px-8 py-5 text-sm font-black text-brand-dark dark:text-white uppercase tracking-tighter"/g,
  'className="px-8 py-5 text-[11px] font-black text-brand-dark dark:text-gray-300 uppercase tracking-widest"'
);

// Management table sub elements like divide
content = content.replace(
  /className="divide-y divide-gray-50"/g,
  'className="divide-y divide-gray-50 dark:divide-white/5"'
);

// 3. Fix Buton Hover and active animations
// "className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-secondary px-8 py-4 rounded-[1.5rem] font-black text-white shadow-xl shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
content = content.replace(
  /className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-secondary px-8 py-4 rounded-\[1.5rem\] font-black text-white shadow-xl shadow-brand-primary\/20 transition-all active:scale-95 disabled:opacity-50"/g,
  'className="group relative overflow-hidden flex-1 lg:flex-none flex items-center justify-center gap-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary px-8 py-4 rounded-[1.5rem] font-black text-white shadow-xl shadow-brand-primary/30 dark:shadow-brand-primary/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-primary/40 active:scale-[0.97] disabled:opacity-50 border border-white/10"'
);

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', content);

