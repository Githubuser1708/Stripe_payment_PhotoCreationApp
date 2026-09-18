const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
c = c.replace(
  'import bgImage from "./assets/images/studio_bg_1787479509390.jpg";',
  'import bgImage from "./src/assets/images/studio_bg_1787479509390.jpg";'
);
fs.writeFileSync('App.tsx', c);
