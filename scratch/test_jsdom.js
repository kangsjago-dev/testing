const fs = require('fs');

// Read app.js and index.html
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

// Let's create a mock DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html, {
  url: 'https://testing.runway.my.id/?event=wilson-felicia',
  runScripts: 'outside-only'
});

const window = dom.window;
const document = window.document;

// Mock localStorage and sessionStorage
const storage = {};
window.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
window.sessionStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

// Mock fetch
window.fetch = async (url) => {
  return {
    ok: true,
    json: async () => ({}),
    text: async () => ""
  };
};

console.log('JSDOM loaded successfully with index.html.');

