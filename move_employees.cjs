const fs = require('fs');

let settings = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SettingsView.tsx', 'utf8');
let performance = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/EmployeePerformanceView.tsx', 'utf8');

// 1. Remove employee tab from settings
// Remove the state variables
settings = settings.replace(/\/\/ Employees State[\s\S]*?\/\/ New Employee Form State/m, '// Extracted Employees State');
settings = settings.replace(/\/\/ New Employee Form State[\s\S]*?const \[statusModal/m, 'const [statusModal');
settings = settings.replace(/useEffect\(\(\) => \{\s*if \(activeTab === 'employees'\) \{\s*fetchEmployees\(\);\s*\}\s*\}, \[activeTab\]\);/m, '');
settings = settings.replace(/const fetchEmployees = async \(\) => \{[\s\S]*?\};/m, '');
settings = settings.replace(/const handleAddEmployee = async \(\) => \{[\s\S]*?\}\s*\}\s*\};/m, '');
settings = settings.replace(/const handleDeleteEmployee = async \(id: string\) => \{[\s\S]*?\};/m, '');
settings = settings.replace(/const handleUpdateEmployee = async \(\) => \{[\s\S]*?\s*\}\s*\};/, '');

// Remove the tab buttons
settings = settings.replace(/<button\s*onClick=\{\(\) => setActiveTab\('employees'\)\}[\s\S]*?إدارة الموظفين\s*<\/button>/m, '');
// Change type of activeTab in component props
settings = settings.replace(/initialTab\?: 'general' \| 'payments' \| 'employees' \| 'printing'/g, "initialTab?: 'general' | 'payments' | 'printing'");
settings = settings.replace(/activeTab, setActiveTab\] = useState\<'general' \| 'payments' \| 'employees' \| 'printing'\>/g, "activeTab, setActiveTab] = useState<'general' | 'payments' | 'printing'>");

// Remove the Employees Management JSX
settings = settings.replace(/\{\/\* Employees Management \*\/\}[\s\S]*?\{\/\* Add\/Edit Employee Modal \*\/\}/m, '{/* Add/Edit Employee Modal */}');
settings = settings.replace(/\{\/\* Add\/Edit Employee Modal \*\/\}[\s\S]*?\{\/\* Global Confirmation Modal \*\/\}/m, '{/* Global Confirmation Modal */}');

// Remove itemToDelete usage in Settings ConfirmDeleteModal (since it was for employees only)
settings = settings.replace(/<ConfirmDeleteModal[\s\S]*?\/>\s*\{\/\* Status Notifications Modal \*\/\}/m, '{/* Status Notifications Modal */}');
settings = settings.replace(/const \[itemToDelete, setItemToDelete\] = useState<string \| null>\(null\);/g, '');


fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/SettingsView.tsx', settings);

