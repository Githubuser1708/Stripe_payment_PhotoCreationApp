const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

const regex = /\}\)\)\}\s+<\/div>\s+<\/div>\s+\)\}\s+<\/div>\s+\)\}\s+<\/main>/g;
c = c.replace(regex, `
                 ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
`);
fs.writeFileSync('App.tsx', c);
