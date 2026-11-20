const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const idx = code.indexOf('function handleAdminLogin(');
console.log(code.substring(idx + 1000, idx + 2600));
