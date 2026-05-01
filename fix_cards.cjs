const fs = require('fs');
let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', 'utf8');

// fix cards background
content = content.replace(
  /className="bg-white rounded-\[4rem\] p-10 shadow-xl border border-transparent hover:border-brand-primary\/20 hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden"/g,
  'className="bg-white dark:bg-brand-dark/80 rounded-[4rem] p-10 shadow-xl border border-transparent dark:border-white/5 hover:border-brand-primary/20 hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden backdrop-blur-md"'
);

// fix empty state card
content = content.replace(
  /className="flex flex-col items-center justify-center p-32 text-center bg-white rounded-\[4rem\] border-2 border-dashed border-gold-100"/g,
  'className="flex flex-col items-center justify-center p-32 text-center bg-white dark:bg-brand-dark/50 rounded-[4rem] border-2 border-dashed border-gold-100 dark:border-white/10"'
);

// fix main modal container
content = content.replace(
  /className="bg-white w-full max-w-2xl rounded-\[4rem\] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500"/g,
  'className="bg-white dark:bg-brand-dark dark:border dark:border-white/10 w-full max-w-2xl rounded-[4rem] shadow-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500"'
);

// fix card titles and text
content = content.replace(
  /className="text-2xl font-black text-brand-dark tracking-tight"/g,
  'className="text-2xl font-black text-brand-dark dark:text-white tracking-tight"'
);

content = content.replace(
  /className="font-black text-brand-dark"/g,
  'className="font-black text-brand-dark dark:text-gray-100"'
);

// fix top cards
content = content.replace(
  /className="bg-white p-8 rounded-\[3rem\] shadow-xl border border-brand-primary\/5 group"/g,
  'className="bg-white dark:bg-brand-dark/80 p-8 rounded-[3rem] shadow-xl border border-brand-primary/5 dark:border-white/5 group backdrop-blur-md"'
);

// fix frequency search container
content = content.replace(
  /className="bg-white p-6 rounded-\[3\.5rem\] shadow-xl border border-brand-primary\/5 mb-10 flex flex-col lg:flex-row gap-6 items-center"/g,
  'className="bg-white dark:bg-brand-dark/80 p-6 rounded-[3.5rem] shadow-xl border border-brand-primary/5 dark:border-white/5 mb-10 flex flex-col lg:flex-row gap-6 items-center backdrop-blur-md"'
);

// fix inner card text
content = content.replace(
  /className="text-4xl font-black text-brand-dark tracking-tighter"/g,
  'className="text-4xl font-black text-brand-dark dark:text-white tracking-tighter"'
);

// fix search input
content = content.replace(
  /className="w-full bg-brand-cream\/30 border-2 border-brand-primary\/5 rounded-3xl py-5 pr-14 pl-6 outline-none focus:border-brand-primary\/20 transition-all font-black text-brand-dark"/g,
  'className="w-full bg-brand-cream/30 dark:bg-white/5 border-2 border-brand-primary/5 dark:border-transparent rounded-3xl py-5 pr-14 pl-6 outline-none focus:border-brand-primary/50 transition-all font-black text-brand-dark dark:text-white"'
);

// fix card specific details container
content = content.replace(
  /className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"/g,
  'className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl"'
);

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/SuppliersView.tsx', content);
