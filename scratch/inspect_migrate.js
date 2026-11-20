const fs = require('fs');
const lines = fs.readFileSync('js/app.js', 'utf8').split('\n');

for (let i = 2909; i < 3000 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

