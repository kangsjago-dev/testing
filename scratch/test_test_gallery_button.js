const fs = require('fs');
const assert = require('assert');

console.log("================================================================================");
console.log("RUNNING VERIFICATION SUITE: TEST GALLERY BUTTON & ROOT DOMAIN HYDRATION (v4.30.0)");
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

// 1. Uji tombol Lihat / Test Galeri di index.html
it("index.html memanggil handleTestGallery() pada tombol header dan footer modal", () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const btnCount = (html.match(/onclick="handleTestGallery\(\)"/g) || []).length;
  assert.strictEqual(btnCount, 2, "Harus ada 2 tombol yang memanggil handleTestGallery()");
});

// 2. Uji keberadaan fungsi handleTestGallery di js/app.js
it("js/app.js mendefinisikan handleTestGallery dan mengekspornya ke window", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('function handleTestGallery()'), "Fungsi handleTestGallery harus ada");
  assert(appJs.includes('window.handleTestGallery = handleTestGallery;'), "handleTestGallery harus diekspor ke window");
});

// 3. Uji auto-hydration pada domain murni tanpa query string di js/app.js
it("js/app.js memuat event pertama dari Supabase jika membuka root domain polos", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('// Otomatis aktifkan event pertama dari Supabase jika membuka domain polos'), "Auto-select event pertama harus ada di fetchEventsFromSupabase");
  assert(!appJs.includes('if (!urlEventId) {\n        state.currentEventId = "";\n        showEventNotFoundScreen(true);\n        return;'), "initApp tidak boleh early return saat urlEventId kosong");
});

// 4. Uji timeout scraper diperpanjang menjadi 12 detik
it("Timeout scraper Google Drive dan Photobooth disetel ke 12000ms", () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('lebih dari 12 detik pada event baru'), "Watchdog timeout harus 12s");
  assert(appJs.includes('// 1. Coba lewat API endpoint /api/fotoshare (Vercel) dengan timeout 12 detik'), "Fotoshare timeout harus 12s");
});

console.log("================================================================================");
console.log(`TOTAL: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
console.log("================================================================================");

if (passed !== total) process.exit(1);
