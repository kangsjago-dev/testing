const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');
const target = 'testAndSyncDriveFolder';
let pos = 0;
while ((pos = code.indexOf(target, pos)) !== -1) {
  console.log(`Found "${target}" at ${pos}:`);
  console.log(code.substring(Math.max(0, pos - 100), Math.min(code.length, pos + 100)));
  console.log('---');
  pos += target.length;
}

