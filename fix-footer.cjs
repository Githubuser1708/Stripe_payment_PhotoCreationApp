const fs = require('fs');

let c = fs.readFileSync('App.tsx', 'utf8');
c = c.replace(
  '<p>\n          &copy; {new Date().getFullYear()} Cinematic PhotoCreation. Powered by\n          Google Gemini.\n        </p>',
  '<p>\n          &copy; {new Date().getFullYear()} Cinematic PhotoCreation. Copyrights reserved. Powered by\n          Google Gemini.\n        </p>'
);
fs.writeFileSync('App.tsx', c);
