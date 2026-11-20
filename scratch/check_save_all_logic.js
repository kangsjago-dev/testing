const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const idx = code.indexOf('function handleSaveAllSettings(');
console.log(code.substring(idx + 8500, idx + 10200));
