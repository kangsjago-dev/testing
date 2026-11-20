const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const regex = /callBackend\s*\(\s*["']([^"']+)["']/g;
let match;
const actions = [];
while ((match = regex.exec(code)) !== null) {
  actions.push(match[1]);
}
console.log('Unique callBackend actions remaining in js/app.js:', [...new Set(actions)]);

// Let's also check for occurrences of script.google.com, SPREADSHEET, or AKfycb
const matches = [];
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('AKfycb') || line.includes('133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20') || line.includes('script.google.com')) {
    matches.push({ line: i + 1, content: line.trim() });
  }
});
console.log('Direct GAS/Sheet references in js/app.js:', matches);

