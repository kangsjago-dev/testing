const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const regex = /callBackend\s*\(/g;
let match;
let count = 0;
while ((match = regex.exec(code)) !== null) {
  // Check if it's in a comment
  const lineStart = code.lastIndexOf('\n', match.index);
  const lineEnd = code.indexOf('\n', match.index);
  const line = code.substring(lineStart, lineEnd);
  console.log(`Match at ${match.index}:`, line.trim());
  count++;
}
console.log('Total callBackend invocations found:', count);

