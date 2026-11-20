const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');
const lines = app.split('\n');
console.log(lines.slice(4435, 4455).join('\n'));

