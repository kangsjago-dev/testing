const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const idx = code.indexOf('function closeAdminSettingsModal(');
console.log(code.substring(idx, idx + 800));

