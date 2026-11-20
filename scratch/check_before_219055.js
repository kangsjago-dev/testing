const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');
const fnStart = code.indexOf('function handleSyncDrivePhotosDirectly() {');
let depth = 0;
let fnEnd = -1;
for (let i = fnStart; i < code.length; i++) {
  if (code[i] === '{') depth++;
  else if (code[i] === '}') {
    depth--;
    if (depth === 0) { fnEnd = i + 1; break; }
  }
}
console.log('fnStart:', fnStart, 'fnEnd:', fnEnd);
console.log(code.substring(fnStart, fnEnd));
