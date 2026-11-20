const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const idx = code.indexOf('function applyCategoryFilter(');
console.log(code.substring(idx + 5000, idx + 6500));
