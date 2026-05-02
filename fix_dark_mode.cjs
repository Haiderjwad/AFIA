const fs = require('fs');

let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', 'utf8');

// Tab buttons
content = content.replace(
  /'bg-brand-dark text-brand-accent shadow-lg shadow-brand-dark\/20 scale-\[1.02\] -translate-y-0.5'/g,
  "'bg-brand-dark text-brand-accent shadow-lg shadow-brand-dark/20 scale-[1.02] -translate-y-0.5 dark:bg-brand-primary dark:text-white'"
);

// Tab inactive state text
content = content.replace(
  /'text-gray-400 hover:text-brand-primary hover:bg-gray-50'/g,
  "'text-gray-400 hover:text-brand-primary hover:bg-gray-50 dark:hover:bg-brand-primary/10 dark:text-gray-300'"
);

// Tab button container background
content = content.replace(
  /className="bg-white p-1.5 rounded-2xl shadow-xl shadow-gray-200\/50 border border-white flex gap-1 overflow-x-auto w-full lg:w-auto"/,
  'className="bg-white dark:bg-brand-dark/40 dark:border-brand-primary/10 p-1.5 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-white flex gap-1 overflow-x-auto w-full lg:w-auto"'
);

// management tab containers
content = content.replace(
  /className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-brand-primary\/10 shadow-sm mb-6"/,
  'className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-brand-dark p-6 rounded-3xl border border-brand-primary/10 dark:border-white/5 shadow-sm mb-6"'
);

content = content.replace(
  /className="text-xl font-black text-brand-dark flex items-center gap-2"/g,
  'className="text-xl font-black text-brand-dark dark:text-white flex items-center gap-2"'
);

content = content.replace(
  /className="bg-white rounded-\[2.5rem\] shadow-xl border border-brand-primary\/5 overflow-hidden relative z-10"/g,
  'className="bg-white dark:bg-brand-dark rounded-[2.5rem] shadow-xl border border-brand-primary/5 dark:border-white/5 overflow-hidden relative z-10"'
);

// Tables text and rows in management mode
content = content.replace(
  /className="px-8 py-5 text-sm font-black text-brand-dark uppercase tracking-tighter"/g,
  'className="px-8 py-5 text-sm font-black text-brand-dark dark:text-white uppercase tracking-tighter"'
);
content = content.replace(
  /className="font-black text-brand-dark"/g,
  'className="font-black text-brand-dark dark:text-white"'
);

// Search bars
content = content.replace(
  /bg-gray-50 border border-brand-primary\/5/g,
  'bg-gray-50 dark:bg-brand-light/5 border border-brand-primary/5 dark:border-white/5 dark:text-white'
);
content = content.replace(
  /bg-white rounded-xl border border-gray-100/g,
  'bg-white dark:bg-brand-light/5 rounded-xl border border-gray-100 dark:border-white/5 dark:text-white'
);

// Modal container 
content = content.replace(
  /className="bg-white w-full max-w-2xl rounded-\[3rem\] shadow-4xl/g,
  'className="bg-white dark:bg-brand-dark w-full max-w-2xl rounded-[3rem] shadow-4xl'
);
content = content.replace(
  /className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-brand-primary\/10 focus:ring-2/g,
  'className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-brand-light/5 border border-brand-primary/10 dark:border-white/5 focus:ring-2 dark:text-white'
);
content = content.replace(
  /className="p-8 bg-gray-50 flex gap-4"/g,
  'className="p-8 bg-gray-50 dark:bg-brand-dark flex gap-4 border-t dark:border-white/5"'
);

content = content.replace(
  /className="bg-gray-50\/50"/g,
  'className="bg-gray-50/50 dark:bg-brand-light/5"'
);

// P-8 modal bottom buttons
content = content.replace(
  /className="px-8 bg-white text-gray-400 font-black py-5 rounded-\[1.5rem\] border-2 border-gray-100 hover:text-brand-dark transition-all"/g,
  'className="px-8 bg-white dark:bg-brand-dark text-gray-400 font-black py-5 rounded-[1.5rem] border-2 border-gray-100 dark:border-white/10 hover:text-brand-dark dark:hover:text-white transition-all"'
);

// Modal permission box
content = content.replace(
  /className="p-6 bg-brand-light\/10 rounded-3xl border border-dashed border-brand-primary\/20"/g,
  'className="p-6 bg-brand-light/10 dark:bg-brand-dark/50 rounded-3xl border border-dashed border-brand-primary/20 dark:border-white/10"'
);

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', content);

