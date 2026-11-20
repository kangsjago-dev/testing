const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pos = 0;
while ((pos = html.indexOf('Lihat / Test Galeri', pos)) !== -1) {
  console.log(html.substring(pos - 300, pos + 100));
  console.log('==============================');
  pos += 20;
}

