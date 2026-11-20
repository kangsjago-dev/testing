const fs = require('fs');

console.log("=== EXECUTING FINAL AUDIT FIXES ===");

// 1. UPDATE config.json
const cfgPath = 'config.json';
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
cfg.DEFAULT_ADMIN_USERNAME = "";
cfg.ADMIN_USERNAME = "";
cfg.DEFAULT_ADMIN_PIN = "";
cfg.EVENTS = [];
cfg.ADMIN_ACCOUNTS = [];
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
console.log("✓ config.json cleaned of hardcoded credentials & fallbacks");

// 2. UPDATE js/cache-data.js comment
const cacheDataPath = 'js/cache-data.js';
let cacheData = fs.readFileSync(cacheDataPath, 'utf8');
cacheData = cacheData.replace('Google Spreadsheet Database', 'Supabase Realtime Database');
fs.writeFileSync(cacheDataPath, cacheData, 'utf8');
console.log("✓ js/cache-data.js updated");

// 3. UPDATE js/app.js
let appJs = fs.readFileSync('js/app.js', 'utf8');
console.log("Original js/app.js length:", appJs.length);

// A. Clean state.gasApiUrl
appJs = appJs.replace(/\s*gasApiUrl:\s*["'][^"']*["'],?/, '');
appJs = appJs.replace('state.gasApiUrl = "";', '');

// B. Remove apiStatusBadge block in populateConfigToUI
const apiBadgeTarget = /const apiBadge = document\.getElementById\("apiStatusBadge"\);[\s\S]*?updateSupabaseUIBadge/;
appJs = appJs.replace(apiBadgeTarget, 'updateSupabaseUIBadge');
console.log("✓ Removed dead apiStatusBadge block");

// C. Remove cfgGasApiUrlEl block in openAdminSettingsModal
const cfgGasElTarget = /const cfgGasApiUrlEl = document\.getElementById\("cfgGasApiUrl"\);\s*if \(cfgGasApiUrlEl\) cfgGasApiUrlEl\.value = state\.gasApiUrl \|\| "";\s*/;
appJs = appJs.replace(cfgGasElTarget, '');
console.log("✓ Removed dead cfgGasApiUrlEl block");

// D. Clean handleSaveAllSettings: remove newApiUrl and WEDDING_GAS_API_URL saving
const saveAllGasRegex = /const newApiUrl = \(document\.getElementById\("cfgGasApiUrl"\)\?\.value \|\| ""\)\.trim\(\);[\s\S]*?const newSupabaseUrl/;
appJs = appJs.replace(saveAllGasRegex, 'const newSupabaseUrl');

const saveAllGasSetRegex = /state\.gasApiUrl = newApiUrl;\s*if \(newApiUrl\) \{\s*localStorage\.setItem\("WEDDING_GAS_API_URL", newApiUrl\);\s*\}/;
appJs = appJs.replace(saveAllGasSetRegex, 'try { localStorage.removeItem("WEDDING_GAS_API_URL"); } catch(e) {}');
console.log("✓ Cleaned handleSaveAllSettings of GAS saving");

// E. Remove hardcoded fallback login bypass in handleAdminLogin
const oldLoginBypass1 = `            } else {
              // Jika belum ada user di tabel, periksa master admin default
              if (username === "admin" && (password === "123" || password === "111111")) {
                onLoginSuccess({ username: "admin", name: "Super Admin", role: "Super Admin" });
              } else {
                if (alertBox) {
                  alertBox.innerText = "Username '" + username + "' tidak ditemukan di Supabase.";
                  alertBox.style.display = "block";
                }
              }
            }`;

const newLoginBypass1 = `            } else {
              if (alertBox) {
                alertBox.innerText = "Username '" + username + "' tidak terdaftar di database Supabase.";
                alertBox.style.display = "block";
              }
            }`;

if (appJs.includes(oldLoginBypass1)) {
  appJs = appJs.replace(oldLoginBypass1, newLoginBypass1);
  console.log("✓ Removed login bypass 1 (hardcode fallback)");
}

const oldLoginBypass2 = `      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = \`<span>Masuk</span>\`;
        if (username === "admin" && (password === "123" || password === "111111")) {
          onLoginSuccess({ username: "admin", name: "Super Admin", role: "Super Admin" });
        } else {
          if (alertBox) {
            alertBox.innerText = "Klien Supabase belum terhubung. Periksa pengaturan di config.json.";
            alertBox.style.display = "block";
          }
        }
      }`;

const newLoginBypass2 = `      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = \`<span>Masuk</span>\`;
        if (alertBox) {
          alertBox.innerText = "Database Supabase belum terhubung. Periksa pengaturan di config.json.";
          alertBox.style.display = "block";
        }
      }`;

if (appJs.includes(oldLoginBypass2)) {
  appJs = appJs.replace(oldLoginBypass2, newLoginBypass2);
  console.log("✓ Removed login bypass 2 (hardcode fallback)");
}

// F. Remove pin === "123" check in getEffectiveAdminPin
appJs = appJs.replace(/if \(!pin \|\| pin === "123"\)/g, 'if (!pin)');

// G. Remove obsolete handleMigrateSpreadsheetToSupabase
const migrateFnStart = appJs.indexOf('function handleMigrateSpreadsheetToSupabase() {');
if (migrateFnStart !== -1) {
  let depth = 0;
  let migrateFnEnd = -1;
  for (let i = migrateFnStart; i < appJs.length; i++) {
    if (appJs[i] === '{') depth++;
    else if (appJs[i] === '}') {
      depth--;
      if (depth === 0) { migrateFnEnd = i + 1; break; }
    }
  }
  if (migrateFnEnd !== -1) {
    appJs = appJs.substring(0, migrateFnStart) + appJs.substring(migrateFnEnd);
    console.log("✓ Removed obsolete handleMigrateSpreadsheetToSupabase function");
  }
}
appJs = appJs.replace('window.handleMigrateSpreadsheetToSupabase = handleMigrateSpreadsheetToSupabase;', '');

// H. Remove obsolete syncFromSpreadsheetGViz function
const gvizFnStart = appJs.indexOf('function syncFromSpreadsheetGViz(callback) {');
if (gvizFnStart !== -1) {
  let depth = 0;
  let gvizFnEnd = -1;
  for (let i = gvizFnStart; i < appJs.length; i++) {
    if (appJs[i] === '{') depth++;
    else if (appJs[i] === '}') {
      depth--;
      if (depth === 0) { gvizFnEnd = i + 1; break; }
    }
  }
  if (gvizFnEnd !== -1) {
    appJs = appJs.substring(0, gvizFnStart) + appJs.substring(gvizFnEnd);
    console.log("✓ Removed obsolete syncFromSpreadsheetGViz function");
  }
}

// I. Clean remaining comment references
appJs = appJs.replace(
  'console.log("Event belum ada di config.json statis, melanjutkan ke sinkronisasi Google Spreadsheet...");',
  'console.log("Event belum ada di config.json statis, memuat dari database Supabase...");'
);
appJs = appJs.replace(
  '// Realtime Database Engine: Seluruh data diserap langsung dari Google Spreadsheet & Backend API',
  '// Realtime Database Engine: Seluruh data diserap langsung dari Supabase Realtime Database'
);
appJs = appJs.replace(
  '// 1. Kategori kustom dari database spreadsheet / admin / config (cek enabled flag)',
  '// 1. Kategori kustom dari database Supabase / admin / config (cek enabled flag)'
);

fs.writeFileSync('js/app.js', appJs, 'utf8');
console.log("✓ Successfully saved updated js/app.js. New length:", appJs.length);

