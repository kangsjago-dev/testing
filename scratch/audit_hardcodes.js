const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

console.log("=== SCANNING FOR HARDCODED CREDENTIALS & FALLBACKS IN js/app.js ===");

const patterns = [
  /admin['"]?\s*===?\s*['"]admin/gi,
  /111111/g,
  /123456/g,
  /fallback/gi,
  /mock/gi,
  /dummy/gi,
  /demo/gi,
  /hardcode/gi
];

patterns.forEach(p => {
  let match;
  let count = 0;
  while ((match = p.exec(code)) !== null) {
    count++;
    if (count <= 10) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      const snippet = code.substring(Math.max(0, match.index - 40), Math.min(code.length, match.index + 60)).replace(/\n/g, ' ');
      console.log(`[${p}] line ${lineNum}: ...${snippet}...`);
    }
  }
  console.log(`Pattern ${p} total matches: ${count}`);
});

