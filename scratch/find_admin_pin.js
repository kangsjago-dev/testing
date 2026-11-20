const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

let pos = 0;
while ((pos = code.indexOf('DEFAULT_ADMIN_PIN', pos)) !== -1) {
  console.log(`Match at ${pos}:`);
  console.log(code.substring(Math.max(0, pos - 100), Math.min(code.length, pos + 100)));
  console.log('---');
  pos += 'DEFAULT_ADMIN_PIN'.length;
}

