const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const dclStart = app.indexOf('DOMContentLoaded');
const saveIdx = app.indexOf('function handleSaveAllSettings()');

console.log('DOMContentLoaded starts at index:', dclStart);
console.log('handleSaveAllSettings is at index:', saveIdx);
console.log('Is handleSaveAllSettings after DOMContentLoaded?', saveIdx > dclStart);

// Let's find where DOMContentLoaded ends!
// Let's count open and close braces from dclStart
let depth = 0;
let dclEnd = -1;
for (let i = dclStart; i < app.length; i++) {
  if (app[i] === '{') depth++;
  else if (app[i] === '}') {
    depth--;
    if (depth === 0) {
      dclEnd = i;
      break;
    }
  }
}

console.log('DOMContentLoaded ends at index:', dclEnd);
console.log('Total app length:', app.length);
console.log('Is handleSaveAllSettings INSIDE DOMContentLoaded callback?', saveIdx > dclStart && saveIdx < dclEnd);

