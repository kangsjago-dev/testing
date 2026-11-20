const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');
const lines = app.split('\n');

lines.forEach((l, i) => {
  if (l.indexOf('renderAdminCategoriesManager') !== -1 || l.indexOf('Kategori Spesial: Photobooth') !== -1 || l.indexOf('Kategori "Semua Foto"') !== -1) {
    console.log((i+1) + ': ' + l);
  }
});

