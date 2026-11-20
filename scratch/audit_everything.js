const fs = require('fs');
const path = require('path');

const keywords = [
  'spreadsheet',
  'googlesheet',
  'google sheet',
  'gviz',
  'script.google.com',
  'google.script',
  'gasApiUrl',
  'GAS_API_URL',
  'setupSpreadsheet',
  'syncSpreadsheet',
  'SpreadsheetApp'
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file.startsWith('.') || file === 'scratch') return;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  });
  return results;
}

const allFiles = walk('.');
console.log('Scanning files:', allFiles);

const findings = {};

keywords.forEach(kw => {
  findings[kw] = [];
  const regex = new RegExp(kw, 'gi');
  allFiles.forEach(file => {
    // Only text files
    if (!/\.(js|html|json|css|md|txt)$/i.test(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    let match;
    let count = 0;
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
      if (regex.test(l)) {
        findings[kw].push({ file, line: idx + 1, snippet: l.trim().substring(0, 140) });
      }
    });
  });
});

Object.keys(findings).forEach(kw => {
  if (findings[kw].length > 0) {
    console.log(`\n=== Keyword: "${kw}" (${findings[kw].length} matches) ===`);
    findings[kw].forEach(f => {
      console.log(`  [${f.file}:${f.line}] ${f.snippet}`);
    });
  } else {
    console.log(`Keyword: "${kw}" -> 0 matches (CLEAN)`);
  }
});

