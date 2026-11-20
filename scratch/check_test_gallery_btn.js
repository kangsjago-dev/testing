const fs = require('fs');
const appJs = fs.readFileSync('js/app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

console.log("=== In index.html ===");
let pos = 0;
while ((pos = indexHtml.indexOf('Lihat / Test Galeri', pos)) !== -1) {
  console.log(indexHtml.substring(pos - 120, pos + 100));
  console.log('---');
  pos += 20;
}

console.log("=== In js/app.js ===");
pos = 0;
while ((pos = appJs.indexOf('Lihat / Test Galeri', pos)) !== -1) {
  console.log(appJs.substring(pos - 120, pos + 100));
  console.log('---');
  pos += 20;
}

