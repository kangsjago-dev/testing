const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

let pos = 0;
while ((pos = code.indexOf('syncFromSpreadsheetGViz', pos)) !== -1) {
  console.log(`Found syncFromSpreadsheetGViz at ${pos}:`);
  console.log(code.substring(Math.max(0, pos - 80), Math.min(code.length, pos + 100)));
  console.log('---');
  pos += 'syncFromSpreadsheetGViz'.length;
}

