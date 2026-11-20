const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');

// Build minimal DOM environment
const elements = {};

// Parse all IDs from index.html
const idRegex = /id=["']([^"']+)["']/g;
let m;
while ((m = idRegex.exec(html)) !== null) {
  elements[m[1]] = {
    id: m[1],
    value: '',
    checked: false,
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    appendChild: () => {},
    innerHTML: '',
    textContent: '',
    innerText: ''
  };
}

// Add elements dynamically added by app.js (like cfgDriveFolderId, cfgMainGalleryLabel, pbNameInput, pbUrlInput, pbVisibilityCheck)
const dynamicIds = ['cfgDriveFolderId', 'cfgMainGalleryLabel', 'pbNameInput', 'pbUrlInput', 'pbVisibilityCheck'];
dynamicIds.forEach(id => {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      value: '',
      checked: true,
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      querySelectorAll: () => [],
      querySelector: () => null,
      appendChild: () => {},
      innerHTML: '',
      textContent: '',
      innerText: ''
    };
  }
});

const mockDocument = {
  getElementById: (id) => elements[id] || null,
  querySelectorAll: (sel) => [],
  querySelector: (sel) => null,
  body: { style: {} },
  documentElement: { style: {} },
  addEventListener: (evt, fn) => { if (evt === 'DOMContentLoaded') setTimeout(fn, 10); }
};

const mockWindow = {
  addEventListener: (evt, fn) => {},
  document: mockDocument,
  location: {
    origin: 'https://testing.runway.my.id',
    pathname: '/',
    search: '?event=wilson-felicia',
    protocol: 'https:',
    host: 'testing.runway.my.id'
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  history: {
    replaceState: () => {}
  },
  supabase: {
    createClient: () => ({
      from: (tbl) => ({
        select: () => Promise.resolve({ data: [] }),
        upsert: () => Promise.resolve({ data: [] }),
        insert: () => Promise.resolve({ data: [] }),
        update: () => Promise.resolve({ data: [] }),
        delete: () => Promise.resolve({ data: [] }),
        order: () => ({ select: () => Promise.resolve({ data: [] }) }),
        eq: () => ({ then: (fn) => fn({ data: [] }) })
      }),
      channel: () => ({
        on: function() { return this; },
        subscribe: function() { return this; }
      })
    })
  }
};

// Now evaluate app.js in a controlled sandbox to execute handleSaveAllSettings
const vm = require('vm');
const sandbox = {
  window: mockWindow,
  document: mockDocument,
  localStorage: mockWindow.localStorage,
  sessionStorage: mockWindow.sessionStorage,
  history: mockWindow.history,
  location: mockWindow.location,
  navigator: { userAgent: 'node' },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  JSON: JSON,
  Math: Math,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Map: Map,
  Set: Set,
  Error: Error,
  TypeError: TypeError,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN
};

vm.createContext(sandbox);

try {
  vm.runInContext(app, sandbox);
  console.log('app.js executed in sandbox without top-level syntax error.');

  // Test calling handleSaveAllSettings
  console.log('Testing handleSaveAllSettings() call...');
  sandbox.handleSaveAllSettings();
  console.log('handleSaveAllSettings() completed successfully without exception!');
} catch (err) {
  console.error('EXCEPTION in handleSaveAllSettings():', err);
}
