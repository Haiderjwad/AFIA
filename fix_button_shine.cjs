const fs = require('fs');
let code = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', 'utf8');

code = code.replace(
  /{isGenerating \? <RefreshCw size=\{20\} className=\"animate-spin\" \/> : <Download size=\{20\} \/>}\n(\s*)<span>تحميل/g,
  `{/* Shine effect */}\n$1<div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>\n$1{isGenerating ? <RefreshCw size={20} className="animate-spin relative z-10" /> : <Download size={20} className="relative z-10" />}\n$1<span className="relative z-10">تحميل`
);

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', code);
