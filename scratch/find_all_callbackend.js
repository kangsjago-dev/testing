const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const regex = /callBackend\s*\(\s*["']([^"']+)["']/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const idx = match.index;
  const start = Math.max(0, idx - 150);
  const end = Math.min(code.length, idx + 250);
  console.log(`\n--- Action: ${match[1]} (index: ${idx}) ---`);
  console.log(code.substring(start, end));
}

