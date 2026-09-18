const fs = require('fs');

// APP.TSX
let c = fs.readFileSync('App.tsx', 'utf8');

c = c.replace(
  'bg-white/70 backdrop-blur-md border-b',
  'bg-white/40 backdrop-blur-lg border-b'
);

c = c.replace(
  'bg-white/60 p-1 rounded-xl border',
  'bg-white/30 p-1 rounded-xl border'
);

c = c.replace(
  /bg-white text-stone-900 shadow-sm/g,
  'bg-white/50 text-stone-900 shadow-sm backdrop-blur-sm'
);

c = c.replace(
  'bg-white/60 backdrop-blur-sm rounded-3xl border',
  'bg-white/30 backdrop-blur-md rounded-3xl border'
);

c = c.replace(
  'bg-white shadow-md aspect-[3/4]',
  'bg-white/30 backdrop-blur-md shadow-md aspect-[3/4]'
);

c = c.replace(
  'bg-white/30">',
  'bg-white/20">'
);

fs.writeFileSync('App.tsx', c);

// PREWEDDINGGEN.TSX
let p = fs.readFileSync('components/PreWeddingGen.tsx', 'utf8');

p = p.replace(
  /bg-white\/80 backdrop-blur-md/g,
  'bg-white/30 backdrop-blur-lg'
);

p = p.replace(
  /bg-white\/50 flex flex-col/g,
  'bg-white/20 backdrop-blur-sm flex flex-col'
);

p = p.replace(
  /"bg-white border-stone-200 text-stone-600/g,
  '"bg-white/40 backdrop-blur-sm border-stone-200 text-stone-600'
);

p = p.replace(
  /bg-white border border-stone-300 rounded-xl p-3/g,
  'bg-white/40 backdrop-blur-sm border border-stone-300 rounded-xl p-3'
);

p = p.replace(
  /bg-white\/60 rounded-2xl border border-stone-200/g,
  'bg-white/20 backdrop-blur-sm rounded-2xl border border-stone-200'
);

p = p.replace(
  /bg-white rounded-full mx-auto/g,
  'bg-white/40 backdrop-blur-sm rounded-full mx-auto'
);

// One more check in PreWeddingGen: text-amber-200 (was from dark mode, needs to be updated)
p = p.replace(
  /text-amber-200/g,
  'text-stone-800'
);
p = p.replace(
  /bg-amber-950\/60 border-amber-500 text-stone-800/g,
  'bg-amber-100/60 border-amber-500 text-amber-900' // updated selected vibe state
);

fs.writeFileSync('components/PreWeddingGen.tsx', p);

