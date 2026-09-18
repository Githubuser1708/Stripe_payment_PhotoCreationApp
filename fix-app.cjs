const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

c = c.replace(
  'import { Camera, X } from "lucide-react";',
  'import { Camera, X } from "lucide-react";\nimport bgImage from "./assets/images/studio_bg_1787479509390.jpg";'
);

c = c.replace(
  '<div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4">',
  '<div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat text-stone-900 flex flex-col items-center justify-center p-4" style={{ backgroundImage: `url(${bgImage})` }}>'
);

c = c.replace(
  '<div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">',
  '<div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat text-stone-900 flex flex-col" style={{ backgroundImage: `url(${bgImage})` }}>'
);

c = c.replace(
  /bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 via-cyan-400 via-blue-500 to-fuchsia-500/g,
  'bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900'
);

c = c.replace(
  /from-rose-500 via-amber-400 via-emerald-400 to-cyan-400/g,
  'from-stone-900 via-stone-700 to-stone-900'
);

c = c.replace(
  /bg-stone-900\/90 backdrop-blur-md border-b border-stone-800\/80/g,
  'bg-white\/70 backdrop-blur-md border-b border-stone-200\/80 shadow-sm'
);

c = c.replace(
  /bg-stone-950 p-1 rounded-xl border border-stone-800/g,
  'bg-white\/60 p-1 rounded-xl border border-stone-200\/50 shadow-sm backdrop-blur-sm'
);

c = c.replace(
  /bg-stone-800 text-stone-100/g,
  'bg-white text-stone-900 shadow-sm'
);

c = c.replace(
  /text-stone-400 hover:text-stone-200/g,
  'text-stone-500 hover:text-stone-800'
);

c = c.replace(
  /border-t border-stone-900 py-6 text-center text-stone-500 text-sm/g,
  'border-t border-stone-200\/80 py-6 text-center text-stone-600 text-sm backdrop-blur-sm bg-white\/30'
);

c = c.replace(
  /bg-stone-900\/50 rounded-3xl border border-stone-800\/50/g,
  'bg-white\/60 backdrop-blur-sm rounded-3xl border border-stone-200\/50 shadow-sm'
);

c = c.replace(
  /<p className="text-stone-500">/g,
  '<p className="text-stone-600">'
);

c = c.replace(
  /<p className="text-stone-400 max-w-2xl mx-auto">/g,
  '<p className="text-stone-600 max-w-2xl mx-auto">'
);

c = c.replace(
  /border border-stone-800 bg-stone-900/g,
  'border border-stone-200 bg-white shadow-md'
);

c = c.replace(
  /<p className="text-stone-400">/g,
  '<p className="text-stone-700">'
);

fs.writeFileSync('App.tsx', c);
