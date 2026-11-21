const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');

function extractFunction(name) {
  const startIdx = content.indexOf('function ' + name);
  if (startIdx === -1) return null;
  // find closing brace
  let openBraces = 0;
  let bodyStart = content.indexOf('{', startIdx);
  let idx = bodyStart;
  while (idx < content.length) {
    if (content[idx] === '{') openBraces++;
    else if (content[idx] === '}') {
      openBraces--;
      if (openBraces === 0) {
        return content.substring(startIdx, idx + 1);
      }
    }
    idx++;
  }
  return null;
}

const fns = [
  'syncCategoriesAndDisplayLinks',
  'handleSyncDrivePhotosDirectly',
  'syncSingleCategory',
  'confirmAddNewEvent',
  'handleDeleteCurrentEvent',
  'handleTestSupabaseConnection',
  'handleRefreshFromSupabase'
];

fns.forEach(fn => {
  const code = extractFunction(fn);
  console.log('=================================================================');
  console.log('FUNCTION: ' + fn);
  console.log('=================================================================');
  if (code) {
    console.log(code.substring(0, 500) + '...\n');
  } else {
    console.log('NOT FOUND!');
  }
});

