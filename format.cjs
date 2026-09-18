const fs = require('fs');
const code = fs.readFileSync('App.tsx', 'utf8');
const prettier = require('prettier');
prettier.format(code, { parser: "typescript" }).then(res => {
  fs.writeFileSync('App.tsx', res);
}).catch(err => {
  console.error("Prettier error:", err.message);
});
