const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

function searchPattern(title, pattern) {
  console.log(`=== ${title} ===`);
  let idx = 0;
  while ((idx = code.indexOf(pattern, idx)) !== -1) {
    console.log(`Found at index ${idx}:`);
    console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 300)));
    console.log('----------------------------');
    idx += pattern.length;
  }
}

searchPattern("saveAdminSettings", "saveAdminSettings");
searchPattern("btnSaveAdminSettings or save buttons", "Simpan Perubahan");

