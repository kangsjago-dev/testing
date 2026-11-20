const fs = require('fs');
const assert = require('assert');

console.log("================================================================================");
console.log("RUNNING COMPREHENSIVE SUPABASE SINGLE-DATABASE & SEPARATION TEST SUITE (v4.29.0)");
console.log("================================================================================");

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
  }
}

// 1. Uji index.html
it("index.html memuat library CDN Supabase JS v2", () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'), "Script CDN Supabase v2 harus ada");
});

it("index.html bersih dari komponen database ganda Google Sheets di Tab 4", () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(!html.includes('Database Google Sheets (ERP Master Data)'), "Modul Google Sheets harus bersih dari Tab 4");
  assert(!html.includes('btnSyncDatabaseToSheet'), "Tombol sync sheets harus bersih");
  assert(!html.includes('cfgGasApiUrl'), "Input cfgGasApiUrl harus bersih");
  assert(html.includes('id="cfgSupabaseUrl"'), "Input #cfgSupabaseUrl harus ada");
  assert(html.includes('id="cfgSupabaseAnonKey"'), "Input #cfgSupabaseAnonKey harus ada");
  assert(html.includes('id="supabaseStatusBadge"'), "Badge #supabaseStatusBadge harus ada");
  assert(html.includes('id="btnTestSupabase"'), "Tombol #btnTestSupabase harus ada");
  assert(html.includes('id="btnRefreshSupabase"'), "Tombol #btnRefreshSupabase harus ada");
});

// 2. Uji config.json
it("config.json memiliki konfigurasi Supabase murni tanpa parameter spreadsheet lama", () => {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  assert.strictEqual(cfg.DATABASE_ENGINE, "supabase");
  assert.strictEqual(cfg.SUPABASE_URL, "https://faszgrkwdlqxbppownh.supabase.co");
  assert(!cfg.hasOwnProperty('SPREADSHEET_ID'), "SPREADSHEET_ID harus dibersihkan");
  assert(!cfg.hasOwnProperty('SPREADSHEET_URL'), "SPREADSHEET_URL harus dibersihkan");
  assert(!cfg.hasOwnProperty('GAS_API_URL'), "GAS_API_URL harus dibersihkan");
});

it("config.json tidak memiliki data fallback / hardcode (EVENTS & ADMIN_ACCOUNTS kosong)", () => {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  assert(Array.isArray(cfg.EVENTS) && cfg.EVENTS.length === 0, "EVENTS fallback di config.json harus kosong");
  assert(Array.isArray(cfg.ADMIN_ACCOUNTS) && cfg.ADMIN_ACCOUNTS.length === 0, "ADMIN_ACCOUNTS fallback di config.json harus kosong");
  assert(!cfg.DEFAULT_ADMIN_PIN, "DEFAULT_ADMIN_PIN harus kosong (tidak ada hardcode PIN)");
});

// 3. Uji penghapusan setup.gs & code.gs
it("setup.gs dan code.gs telah dihapus dari repositori", () => {
  assert(!fs.existsSync('setup.gs'), "setup.gs harus terhapus");
  assert(!fs.existsSync('code.gs'), "code.gs harus terhapus");
});

// 4. Uji js/app.js
it("js/app.js beroperasi murni dengan Supabase sebagai Single Source of Truth", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('function initSupabaseClient()'), "Fungsi initSupabaseClient harus ada");
  assert(appJs.includes('function setupSupabaseRealtime()'), "Fungsi setupSupabaseRealtime harus ada");
  assert(appJs.includes('function fetchEventsFromSupabase('), "Fungsi fetchEventsFromSupabase harus ada");
  assert(appJs.includes('function saveEventToSupabase('), "Fungsi saveEventToSupabase harus ada");
  assert(appJs.includes('function deleteEventFromSupabase('), "Fungsi deleteEventFromSupabase harus ada");
  assert(appJs.includes('window.handleRefreshFromSupabase = handleRefreshFromSupabase;'), "window.handleRefreshFromSupabase harus diekspos");
});

it("callBackend dinonaktifkan total sehingga tidak ada request ke Google Apps Script website lain", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('[TERISOLASI] Panggilan ke Google Apps Script'), "callBackend harus terisolasi");
  assert(!appJs.includes('google.script.run'), "google.script.run harus 0 occurrence di app.js");
});

it("Sinkronisasi Google Drive menggunakan serverless Vercel /api/drive-folder bukan GAS", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('/api/drive-folder?folderId='), "/api/drive-folder harus digunakan untuk sinkronisasi");
});

it("Tidak ada bypass login admin hardcode dan fungsi spreadsheet usang di js/app.js", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(!appJs.includes('password === "111111"'), "Hardcoded PIN 111111 bypass harus bersih");
  assert(!appJs.includes('syncFromSpreadsheetGViz'), "syncFromSpreadsheetGViz harus dihapus");
  assert(!appJs.includes('handleMigrateSpreadsheetToSupabase'), "handleMigrateSpreadsheetToSupabase harus dihapus");
  assert(!appJs.includes('state.gasApiUrl'), "state.gasApiUrl harus bersih");
});

console.log("================================================================================");
console.log(`TOTAL: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
console.log("================================================================================");

if (passed !== total) {
  process.exit(1);
}
