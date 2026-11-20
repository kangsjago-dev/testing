const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const idx = code.indexOf('function fetchEventsFromSupabase(');
console.log(code.substring(idx + 1800, idx + 3500));
