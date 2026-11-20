const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, i) => {
  if (l.indexOf('Perbarui Password') !== -1 || l.indexOf('Tambahkan Akun Admin') !== -1 || l.indexOf('tabPane-admin') !== -1 || l.indexOf('tabPane-accounts') !== -1) {
    console.log('Line ' + (i+1) + ': ' + l);
    console.log(lines.slice(Math.max(0, i-5), Math.min(lines.length, i+15)).join('\n'));
  }
});

