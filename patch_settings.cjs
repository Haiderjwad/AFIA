const fs = require('fs');

let content = fs.readFileSync('/home/al-ayada/Desktop/AFIA/components/SettingsView.tsx', 'utf8');
content = content.replace(
  '{/* Global Confirmation Modal */}',
  '      </div>\n      {/* Global Confirmation Modal */}'
);

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/components/SettingsView.tsx', content);

