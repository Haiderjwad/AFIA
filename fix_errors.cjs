const fs = require('fs');

// Fix EmployeePerformanceView
let ev = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', 'utf8');
ev = ev.replace(
  /Users, ShoppingBag, ChefHat, UserPlus, Trash2, Edit, Save,/,
  'User, Users, ShoppingBag, ChefHat, UserPlus, Trash2, Edit, Save,'
);
fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', ev);

// Fix SettingsView
let sv = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SettingsView.tsx', 'utf8');

// I'll manually remove handleAddEmployee entirely since my regex missed some nested blocks
sv = sv.replace(/const handleAddEmployee = async \(\) => \{[\s\S]*?\s*\}\s*\};\s*/, '');

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/SettingsView.tsx', sv);
