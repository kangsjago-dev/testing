const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const regex = /btnSaveSettings/g;
let m;
while ((m = regex.exec(code)) !== null) {
  console.log('Match at', m.index);
  console.log(code.substring(m.index - 50, m.index + 200));
}
