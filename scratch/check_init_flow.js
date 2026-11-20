const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');
const pos = 34500;
console.log(code.substring(pos, pos + 1000));
