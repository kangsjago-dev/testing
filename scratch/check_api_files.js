const fs = require('fs');
const files = [
  'api/download-proxy.js',
  'api/drive-folder.js',
  'api/fotoshare.js',
  'api/google-photos.js',
  'api/kingphotobooth.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const code = fs.readFileSync(f, 'utf8');
    const hasSheet = /sheet/i.test(code);
    const hasGas = /script\.google/i.test(code) || /macros/i.test(code);
    console.log(`[${f}] hasSheet: ${hasSheet}, hasGas: ${hasGas}`);
  }
});

