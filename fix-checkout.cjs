const fs = require('fs');

function fixFile(file) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Replace window.top check with safe window.open
  const topRegex = /if\s*\(window\.top\)\s*\{\s*window\.top\.location\.href\s*=\s*data\.url;\s*\}\s*else\s*\{\s*window\.location\.href\s*=\s*data\.url;\s*\}/g;
  c = c.replace(topRegex, 'window.open(data.url, "_blank");');
  
  // Also pass the real error if any
  const catchRegex = /} catch \(error\) \{\s*console\.error\("Checkout error:", error\);\s*set(Archive)?CheckoutError\(\s*"Failed to start checkout\."\s*\);\s*\}/g;
  
  c = c.replace(catchRegex, (match, p1) => {
    return `} catch (error: any) {\n                          console.error("Checkout error:", error);\n                          set${p1 || ''}CheckoutError(error?.message || "Failed to start checkout.");\n                        }`;
  });

  fs.writeFileSync(file, c);
}

fixFile('components/PreWeddingGen.tsx');
fixFile('App.tsx');
