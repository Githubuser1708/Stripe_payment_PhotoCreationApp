const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

const splitPoint = c.lastIndexOf('))}');
c = c.substring(0, splitPoint + 3) + `
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="border-t border-stone-900 py-6 text-center text-stone-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Cinematic PhotoCreation. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};
export default App;
`;
fs.writeFileSync('App.tsx', c);
