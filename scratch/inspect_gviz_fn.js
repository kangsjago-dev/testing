const fs = require('fs');
const lines = fs.readFileSync('js/app.js', 'utf8').split('\n');

for (let i = 800; i < 860 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

