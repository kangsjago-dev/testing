const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const targets = ['SPREADSHEET_ID', 'SPREADSHEET_URL', 'GAS_API_URL', 'setupSpreadsheetDatabase', 'btnSyncDatabaseToSheet'];

targets.forEach(t => {
  let idx = 0;
  console.log(`\n=== TARGET: ${t} ===`);
  while ((idx = code.indexOf(t, idx)) !== -1) {
    console.log(`Index ${idx}:`);
    console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 150)));
    console.log('---');
    idx += t.length;
  }
});

