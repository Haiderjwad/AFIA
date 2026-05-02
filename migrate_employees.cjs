const fs = require('fs');

// READ FILES
let appContent = fs.readFileSync('/home/al-ayada/Desktop/AFIA/App.tsx', 'utf8');
let performanceContent = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', 'utf8');
let settingsContent = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SettingsView.tsx', 'utf8');

// 1. UPDATE App.tsx
appContent = appContent.replace(
  "{ id: 'performance', icon: <TrendingUp size={24} />, label: 'أداء الموظفين', role: ['admin', 'manager'] }",
  "{ id: 'performance', icon: <TrendingUp size={24} />, label: 'قسم الموظفين', role: ['admin', 'manager'] }"
);
appContent = appContent.replace(
  "performance: 'أداء الموظفين'",
  "performance: 'الموظفين'"
);
appContent = appContent.replace(
  "case 'performance':\n        if (['admin', 'manager'].includes(role) || hasAll) {\n          return <EmployeePerformanceView employees={employees} transactions={transactions} settings={settings} />;\n        }",
  "case 'performance':\n        if (['admin', 'manager'].includes(role) || hasAll) {\n          return <EmployeePerformanceView employees={employees} transactions={transactions} settings={settings} />;\n        }"
);
fs.writeFileSync('/home/al-ayada/Desktop/AFIA/App.tsx', appContent);

// We need to extract the chunks from settings to performance
// and reconstruct settings. We will do this using manual string replacements
