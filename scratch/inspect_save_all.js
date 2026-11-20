const fs = require('fs');
const lines = fs.readFileSync('js/app.js', 'utf8').split('\n');

for (let i = 4700; i < 4820 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

