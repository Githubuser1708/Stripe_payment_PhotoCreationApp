const fs = require('fs');

let c = fs.readFileSync('App.tsx', 'utf8');
c = c.replace(
  /bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900/g,
  'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500'
);
fs.writeFileSync('App.tsx', c);
