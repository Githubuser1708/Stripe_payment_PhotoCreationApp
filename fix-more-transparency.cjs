const fs = require('fs');

let c = fs.readFileSync('App.tsx', 'utf8');
c = c.replace(/bg-white\/40 backdrop-blur-lg/g, 'bg-white/10 backdrop-blur-md');
c = c.replace(/bg-white\/30/g, 'bg-white/10');
c = c.replace(/bg-white\/50/g, 'bg-white/20');
c = c.replace(/bg-white\/20/g, 'bg-white/5');
fs.writeFileSync('App.tsx', c);

let p = fs.readFileSync('components/PreWeddingGen.tsx', 'utf8');
p = p.replace(/bg-white\/30 backdrop-blur-lg/g, 'bg-white/10 backdrop-blur-md');
p = p.replace(/bg-white\/40/g, 'bg-white/20');
p = p.replace(/bg-white\/20/g, 'bg-white/5');
p = p.replace(/bg-amber-100\/60/g, 'bg-amber-100/30');
fs.writeFileSync('components/PreWeddingGen.tsx', p);
