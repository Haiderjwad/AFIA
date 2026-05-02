const fs = require('fs');

let tw = fs.readFileSync('/home/al-ayada/Desktop/AFIA/tailwind.config.js', 'utf8');

if (!tw.includes('shimmer')) {
  tw = tw.replace(/keyframes: \{/, "keyframes: {\n        shimmer: {\n          '100%': { transform: 'translateX(100%)' },\n        },");
}

fs.writeFileSync('/home/al-ayada/Desktop/AFIA/tailwind.config.js', tw);

