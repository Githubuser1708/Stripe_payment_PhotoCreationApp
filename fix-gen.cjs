const fs = require('fs');
let c = fs.readFileSync('components/PreWeddingGen.tsx', 'utf8');

c = c.replace(
  /bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-xl/g,
  'bg-white\/80 backdrop-blur-md p-6 rounded-2xl border border-stone-200\/50 shadow-xl'
);

c = c.replace(
  /border-stone-700 hover:border-amber-500 hover:bg-stone-800\/50/g,
  'border-stone-300 hover:border-amber-500 hover:bg-stone-50 transition-all bg-white\/50'
);

c = c.replace(
  /text-stone-400 max-w-2xl mx-auto/g,
  'text-stone-600 max-w-2xl mx-auto'
);

c = c.replace(
  /<Plus className="w-6 h-6 text-stone-500" \/>/g,
  '<Plus className="w-6 h-6 text-stone-400" \/>'
);

c = c.replace(
  /text-\[10px\] text-stone-400 mt-1/g,
  'text-\[10px\] text-stone-500 mt-1'
);

c = c.replace(
  /text-xs text-stone-500 mt-2/g,
  'text-xs text-stone-600 mt-2'
);

c = c.replace(
  /text-sm text-stone-400/g,
  'text-sm text-stone-600'
);

c = c.replace(
  /"bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-300"/g,
  '"bg-white border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 shadow-sm"'
);

c = c.replace(
  /className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-sm text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-stone-600"/g,
  'className="w-full bg-white border border-stone-300 rounded-xl p-3 text-sm text-stone-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-stone-400 shadow-sm"'
);

c = c.replace(
  /h-full bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl p-2 md:p-6 flex flex-col min-h-\[500px\]/g,
  'h-full bg-white\/80 backdrop-blur-md rounded-3xl border border-stone-200\/50 shadow-2xl p-2 md:p-6 flex flex-col min-h-\[500px\]'
);

c = c.replace(
  /flex-1 bg-stone-950 rounded-2xl border border-stone-800 flex items-center justify-center overflow-hidden relative/g,
  'flex-1 bg-white\/60 rounded-2xl border border-stone-200 flex items-center justify-center overflow-hidden relative shadow-inner'
);

c = c.replace(
  /absolute inset-0 border-4 border-stone-800 rounded-full/g,
  'absolute inset-0 border-4 border-stone-200 rounded-full'
);

c = c.replace(
  /w-24 h-24 bg-stone-900 rounded-full mx-auto flex items-center justify-center border border-stone-800/g,
  'w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center border border-stone-200 shadow-sm'
);

c = c.replace(
  /text-lg font-serif text-stone-300/g,
  'text-lg font-serif text-stone-700'
);

c = c.replace(
  /<Camera className="w-10 h-10 text-stone-500" \/>/g,
  '<Camera className="w-10 h-10 text-stone-400" \/>'
);

c = c.replace(
  /text-stone-300 font-medium tracking-wide uppercase/g,
  'text-stone-100 font-medium tracking-wide uppercase'
); // Keep some text readable if it's on a dark image

// We also have to fix some text inside empty state
c = c.replace(
  /<p className="text-stone-400 text-sm">/g,
  '<p className="text-stone-500 text-sm">'
);

fs.writeFileSync('components/PreWeddingGen.tsx', c);
