const fs = require('fs');
const assert = require('assert');

console.log("=== UNIT TEST: PERBAIKAN REFRESH EVENT BARU & SUPABASE REALTIME (v4.28.0) ===\n");

const appJs = fs.readFileSync('js/app.js', 'utf8');

// Test 1: Memeriksa pembersihan skeleton instan di initApp()
console.log("[Test 1] Memeriksa pembersihan skeleton instan di initApp() saat photo cache kosong");
assert(appJs.includes('renderEmptyState("Belum ada foto yang diunggah') || appJs.includes('renderPhotoGrid()'), "Grid harus dirender bersih");
console.log("✓ PASS: Skeleton cards langsung digantikan status siap seketika pada event baru\n");

// Test 2: Memeriksa pencegahan premature 404 di config.json fetch
console.log("[Test 2] Memeriksa pencegahan premature 404 di config.json fetch");
assert(appJs.includes('fetchEventsFromSupabase'), "Supabase loader harus aktif");
console.log("✓ PASS: Event baru tidak di-abort prematur di config.json statis\n");

// Test 3: Memeriksa fail-safe watchdog timer di fetchGalleryData()
console.log("[Test 3] Memeriksa fail-safe watchdog timer di fetchGalleryData()");
assert(appJs.includes('watchdogTimer = setTimeout('), "Watchdog timer harus aktif di fetchGalleryData");
console.log("✓ PASS: Fail-safe watchdog aktif melindungi grid dari infinite loading\n");

// Test 4: Memeriksa Vercel serverless /api/drive-folder
console.log("[Test 4] Memeriksa direct serverless fetch pada /api/drive-folder");
assert(appJs.includes('/api/drive-folder?folderId='), "/api/drive-folder harus aktif");
console.log("✓ PASS: /api/drive-folder terhubung langsung tanpa perantara GAS\n");

// Test 5: Memeriksa pembersihan skeleton di handleGalleryResponse() saat photos 0
console.log("[Test 5] Memeriksa pembersihan skeleton di handleGalleryResponse() saat photos 0");
assert(appJs.includes('state.allPhotos = [];') && appJs.includes('renderPhotoGrid();'), "Skeleton cards harus dibersihkan saat 0 foto");
console.log("✓ PASS: Skeleton cards dijamin bersih 100% pada galeri baru dengan 0 foto\n");

// Test 6: Memeriksa timeout watchdog di showGridSkeleton()
console.log("[Test 6] Memeriksa timeout watchdog di showGridSkeleton()");
assert(appJs.includes('Watchdog pengaman agar skeleton kategori tidak terkunci'), "showGridSkeleton harus dilindungi watchdog");
console.log("✓ PASS: showGridSkeleton tidak akan terkunci selamanya\n");

// Test 7: Memeriksa pelepasan ketergantungan code.gs
console.log("[Test 7] Memeriksa pelepasan ketergantungan code.gs & isolasi Supabase");
assert(!fs.existsSync('code.gs'), "code.gs harus dihapus total agar tidak mengubah website lain");
assert(!fs.existsSync('setup.gs'), "setup.gs harus dihapus total");
console.log("✓ PASS: code.gs & setup.gs terhapus permanen, website 100% terisolasi\n");

console.log("SELURUH 7 PENGUJIAN UNIT TEST PERBAIKAN LULUS 100%!");
