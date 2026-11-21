const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
let match;
const buttons = [];
while ((match = regex.exec(html)) !== null) {
  const full = match[0];
  const inner = match[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  const onclickMatch = full.match(/onclick=['"]([^'"]+)['"]/i);
  const idMatch = full.match(/id=['"]([^'"]+)['"]/i);
  buttons.push({
    id: idMatch ? idMatch[1] : '(no-id)',
    onclick: onclickMatch ? onclickMatch[1] : '(no-onclick)',
    text: inner
  });
}
console.log('Total buttons in index.html:', buttons.length);
buttons.forEach((b, i) => {
  console.log(`${i+1}. ID: ${b.id.padEnd(25)} | Click: ${b.onclick.padEnd(35)} | Text: ${b.text.substring(0, 35)}`);
});

