const fs = require('fs');
let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/ReportsView.tsx', 'utf8');

content = content.replace(
  'Ref: REP-',
  'رقم المرجع: REP-'
);

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/ReportsView.tsx', content);
