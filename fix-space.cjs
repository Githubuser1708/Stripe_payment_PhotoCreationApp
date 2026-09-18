const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
c = c.replace(/<div className="space-y-6">/g, '<div className="space-y-12">');
fs.writeFileSync('App.tsx', c);
