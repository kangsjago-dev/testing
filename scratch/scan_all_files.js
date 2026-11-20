const fs = require('fs');
const path = require('path');

const patterns = [
  'script.google.com',
  '133_po_',
  'AKfycb',
  'google.script',
  'SPREADSHEET_ID',
  'SPREADSHEET_URL',
  'GAS_API_URL',
  'setupSpreadsheetDatabase',
  'btnSyncDatabaseToSheet'
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.startsWith('.') || f === 'node_modules' || f === 'scratch') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.json') || f.endsWith('.md')) {
      const content = fs.readFileSync(full, 'utf8');
      patterns.forEach(pat => {
        if (content.includes(pat)) {
          let count = 0;
          let idx = 0;
          while ((idx = content.indexOf(pat, idx)) !== -1) { count++; idx += pat.length; }
          console.log(`[${pat}] found ${count}x in ${full}`);
        }
      });
    }
  }
}

scanDir('.');

