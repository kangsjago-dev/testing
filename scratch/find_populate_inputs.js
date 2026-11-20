const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');
const lines = app.split('\n');

lines.forEach((l, i) => {
  if (l.indexOf('function populateAdminInputsForActiveEvent') !== -1) {
    console.log((i+1) + ': ' + l);
    console.log(lines.slice(i, i+50).join('\n'));
  }
});

