const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const idx = code.indexOf('function initSupabaseClient()');
console.log(code.substring(idx, idx + 1000));
