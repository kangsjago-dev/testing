const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const idx = code.indexOf('function handleSelectEventChange(');
console.log(code.substring(idx + 2200, idx + 3500));
