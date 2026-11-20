const fs = require('fs');
const assert = require('assert');

console.log("================================================================================");
console.log("RUNNING COMPREHENSIVE SUPABASE INTEGRATION TEST SUITE");
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

it("index.html memiliki elemen konfigurasi Supabase di Tab Cloud (Tab 4)", () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(html.includes('id="cfgSupabaseUrl"'), "Input #cfgSupabaseUrl harus ada");
  assert(html.includes('id="cfgSupabaseAnonKey"'), "Input #cfgSupabaseAnonKey harus ada");
  assert(html.includes('id="supabaseStatusBadge"'), "Badge #supabaseStatusBadge harus ada");
  assert(html.includes('id="btnTestSupabase"'), "Tombol #btnTestSupabase harus ada");
  assert(html.includes('id="btnMigrateSpreadsheetToSupabase"'), "Tombol #btnMigrateSpreadsheetToSupabase harus ada");
  assert(html.includes('id="supabaseSyncStatusText"'), "Status text #supabaseSyncStatusText harus ada");
});

// 2. Uji config.json
it("config.json memiliki konfigurasi DATABASE_ENGINE, SUPABASE_URL, dan SUPABASE_ANON_KEY", () => {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  assert.strictEqual(cfg.DATABASE_ENGINE, "supabase");
  assert(cfg.hasOwnProperty('SUPABASE_URL'), "Harus memiliki key SUPABASE_URL");
  assert(cfg.hasOwnProperty('SUPABASE_ANON_KEY'), "Harus memiliki key SUPABASE_ANON_KEY");
  assert(Array.isArray(cfg.EVENTS) && cfg.EVENTS.length === 3, "Harus mempertahankan ke-3 event aktif");
});

// 3. Uji scratch/supabase_schema.sql
it("scratch/supabase_schema.sql berisi skrip DDL lengkap dan seed data", () => {
  const sql = fs.readFileSync('scratch/supabase_schema.sql', 'utf8');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.events'), "Tabel events harus ada");
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.settings'), "Tabel settings harus ada");
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.admin_users'), "Tabel admin_users harus ada");
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.activity_logs'), "Tabel activity_logs harus ada");
  assert(sql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.events'), "Realtime events harus aktif");
  assert(sql.includes('andre-fayola-281'), "Seed data andre-fayola-281 harus ada");
  assert(sql.includes('wilson-felicia-133'), "Seed data wilson-felicia-133 harus ada");
  assert(sql.includes('tommy-natasha-594'), "Seed data tommy-natasha-594 harus ada");
});

// 4. Uji js/app.js
it("js/app.js mendefinisikan modul Supabase lengkap dan Dual-Engine", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('function initSupabaseClient()'), "Fungsi initSupabaseClient harus ada");
  assert(appJs.includes('function setupSupabaseRealtime()'), "Fungsi setupSupabaseRealtime harus ada");
  assert(appJs.includes('function fetchEventsFromSupabase('), "Fungsi fetchEventsFromSupabase harus ada");
  assert(appJs.includes('function saveEventToSupabase('), "Fungsi saveEventToSupabase harus ada");
  assert(appJs.includes('function deleteEventFromSupabase('), "Fungsi deleteEventFromSupabase harus ada");
  assert(appJs.includes('function handleTestSupabaseConnection()'), "Fungsi handleTestSupabaseConnection harus ada");
  assert(appJs.includes('function handleMigrateSpreadsheetToSupabase()'), "Fungsi handleMigrateSpreadsheetToSupabase harus ada");
  assert(appJs.includes('window.handleTestSupabaseConnection = handleTestSupabaseConnection;'), "window.handleTestSupabaseConnection harus diekspos");
  assert(appJs.includes('window.handleMigrateSpreadsheetToSupabase = handleMigrateSpreadsheetToSupabase;'), "window.handleMigrateSpreadsheetToSupabase harus diekspos");
  assert(appJs.includes('syncFromSpreadsheetGViz'), "Fallback syncFromSpreadsheetGViz harus tetap terjaga");
});

console.log("================================================================================");
console.log(`TOTAL: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
console.log("================================================================================");

if (passed !== total) {
  process.exit(1);
}

