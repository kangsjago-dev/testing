const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const regex = /FALLBACK[A-Z0-9_]*/gi;
let match;
const set = new Set();
while ((match = regex.exec(code)) !== null) {
  set.add(match[0]);
}
console.log('Fallback tokens in js/app.js:', [...set]);

const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('FALLBACK_EVENTS') || l.includes('loadFallbackData') || l.includes('mockEvents') || l.includes('dummy')) {
    console.log(`Line ${i+1}: ${l.trim().substring(0, 100)}`);
  }
});

