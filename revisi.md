# STATUS REVISI SISTEM (revisi.md) - v4.29.0
================================================================================
STATUS: SELESAI DITERAPKAN (MERGED TO MASTER CONTEXT & PRD v4.29.0)
PERMINTAAN PENGGUNA:
1. Audit dan cek semua fungsi, jangan ada lagi koneksi dengan Google Sheets.
2. Hilangkan fallback (hardcode) biar realtime ambil data dari database.
3. Ubah yang diperintahkan. Dan laksanakan.
4. Jangan ubah yang tidak diinstruksikan.
TANGGAL PENGAJUAN: 21 November 2026
VERSI TARGET: v4.29.0-PROD
ARSITEK: ZettBOT by Zettbos
================================================================================

## 1. Hasil Audit Menyeluruh Seluruh Berkas & Fungsi
Pemindaian kode statis komprehensif pada seluruh file proyek (`index.html`, `js/app.js`, `js/cache-data.js`, `config.json`, dan seluruh file `api/*.js`) menghasilkan temuan:
1. **Sisa Variabel Google Apps Script di js/app.js**:
   - `handleSaveAllSettings()` masih menyimpan `localStorage.setItem("WEDDING_GAS_API_URL", newApiUrl)`.
   - Objek `state.gasApiUrl` masih terdaftar di inisialisasi state.
   - Pengecekan `#apiStatusBadge` dan `#cfgGasApiUrl` masih tertinggal meski elemen HTML-nya sudah dibersihkan.
2. **Fungsi Usang Google Sheets**:
   - `syncFromSpreadsheetGViz()` masih ada meski tidak pernah dipanggil.
   - `handleMigrateSpreadsheetToSupabase()` masih ada dan diekspor ke window.
3. **Fallback Hardcode Login Admin**:
   - Pengecekan login admin `if (username === "admin" && (password === "123" || password === "111111"))` masih terdapat di blok fallback.
   - `config.json` masih menyimpan `"DEFAULT_ADMIN_PIN": "111111"`.

---

## 2. Tindakan Eksekusi Perbaikan

### A. Eliminasi Total Koneksi Google Sheets & Google Apps Script
1. **Pembersihan Bersih di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/js/app.js)**:
   - Menghapus `state.gasApiUrl` dan seluruh pembacaan/penulisan `WEDDING_GAS_API_URL`.
   - Menghapus fungsi usang `syncFromSpreadsheetGViz()` dan `handleMigrateSpreadsheetToSupabase()`.
   - Menghapus dead-code `#apiStatusBadge` dan `#cfgGasApiUrl`.
   - Menetralkan fungsi `callBackend` (0 network call).
2. **Pembersihan Komentar & Cache di [js/cache-data.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/js/cache-data.js)**:
   - Memperbarui referensi ke Supabase Realtime Database. Seluruh array inisial tetap `[]`.

### B. Penghapusan Fallback Hardcode (100% Realtime Database)
1. **Otentikasi Admin Murni Database ([js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/js/app.js))**:
   - Menghapus seluruh hardcode bypass login (`password === "123"` dan `"111111"`).
   - Login admin diverifikasi 100% secara dinamis dan realtime mencocokkan baris data pada tabel Supabase `admin_users`.
   - Jika akun tidak ditemukan di Supabase, sistem menampilkan notifikasi: *"Username '{username}' tidak terdaftar di database Supabase."*
2. **Pembersihan Kredensial di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/config.json)**:
   - Mengosongkan `"DEFAULT_ADMIN_PIN": ""`, `"DEFAULT_ADMIN_USERNAME": ""`, dan `"ADMIN_USERNAME": ""`.
   - Memastikan `"EVENTS": []` dan `"ADMIN_ACCOUNTS": []` kosong (zero fallback mockup).

---

## 3. Hasil Verifikasi & Uji Regresi
- **Test Suite Supabase Integration (`scratch/test_supabase_integration.js`)**: 9/9 PASS (100%)
- **Test Suite Layar Not Found Minimal Frameless (`scratch/test_frameless_not_found.js`)**: 6/6 PASS (100%)
- **Test Suite Loading Watchdog & Serverless (`scratch/test_new_event_refresh_fix.js`)**: 7/7 PASS (100%)
- **Sintaks JavaScript (`node --check js/app.js`)**: 0 Syntax Error (Exit Code 0)
- **Pemindaian Kode `audit_everything.js`**: `spreadsheet` = 0 di kode, `google.script` = 0, `gviz` = 0, `gasApiUrl` = 0.
================================================================================
