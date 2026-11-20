const fs = require('fs');
const lines = fs.readFileSync('js/app.js', 'utf8').split('\n');

function printLines(lineNum, radius) {
  console.log(`\n=== Around line ${lineNum} ===`);
  const start = Math.max(0, lineNum - radius - 1);
  const end = Math.min(lines.length, lineNum + radius);
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

printLines(1396, 15);
printLines(2910, 20);
printLines(3114, 15);
printLines(4681, 20);

