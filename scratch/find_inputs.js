const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const modalStart = html.indexOf('adminSettingsModal');
const modalHtml = html.slice(modalStart);
const inputRegex = /<input[^>]+>/gi;
let m;
while ((m = inputRegex.exec(modalHtml)) !== null) {
  console.log(m[0]);
}

