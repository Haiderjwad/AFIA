const fs = require('fs');
let code = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/DigitalMenuView.tsx', 'utf8');

const target = "previewMode === 'mobile' ? 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-brand-primary/20' : 'bg-brand-dark hover:bg-brand-primary text-white shadow-brand-dark/20'";
const replacement = "previewMode === 'mobile' ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.4)] hover:-translate-y-1 border border-white/20' : 'bg-brand-dark hover:bg-brand-primary text-white shadow-brand-dark/20'";

code = code.replace(target, replacement);
fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/DigitalMenuView.tsx', code);
