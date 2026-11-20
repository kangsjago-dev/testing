const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

// Extract all document.getElementById calls inside handleSaveAllSettings
const startIdx = app.indexOf('function handleSaveAllSettings()');
const endIdx = app.indexOf('function handleAdminLogout()', startIdx);
const saveFnText = app.slice(startIdx, endIdx);

const getElRegex = /document\.getElementById\("([^"]+)"\)/g;
let m;
const ids = new Set();
while ((m = getElRegex.exec(saveFnText)) !== null) {
  ids.add(m[1]);
}

console.log('IDs queried in handleSaveAllSettings:');
ids.forEach(id => {
  const exists = html.indexOf('id="' + id + '"') !== -1 || html.indexOf("id='" + id + "'") !== -1;
  console.log(`  - ${id}: ${exists ? 'EXISTS in index.html' : 'MISSING FROM index.html'}`);
});

