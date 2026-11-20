# STATUS REVISI SISTEM (revisi.md) - v4.31.0
================================================================================
STATUS: SELESAI DITERAPKAN (MERGED TO MASTER CONTEXT & PRD v4.31.0)
PERMINTAAN PENGGUNA:
1. "tidak bisa melakukan simpan perubahan, cek dan audit semua system"
2. Mengatasi NetworkError saat login admin ("Gagal memverifikasi ke Supabase: TypeError: NetworkError when attempting to fetch resource")
3. Audit dan perbaikan universal seluruh tab admin (Acara, Foto & Kategori, Akun Admin, Supabase)
4. Memastikan tombol "Simpan Perubahan" menyimpan ke Supabase secara asynchronous dengan UI feedback yang jelas
TANGGAL PENYELESAIAN: 21 November 2026
VERSI RILIS: v4.31.0-PROD
SUBDOMAIN RESMI: https://testing.runway.my.id
DATABASE SUPABASE: https://faszgrkwdlqxsbppownh.supabase.co
ARSITEK: ZettBOT by Zettbos (Universal System Architect & Mentor)
================================================================================

## 1. Hasil Audit & Investigasi Akar Masalah (Root Causes)

Berdasarkan audit teknis mendalam terhadap kode [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/index.html) dan [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/js/app.js), serta pengujian API langsung ke database live Supabase, ditemukan **5 akar masalah teknis**:

1. **Typo Hostname Supabase pada `GLOBAL_CONFIG` (Penyebab Utama NetworkError)**:
   - Pada `js/app.js` baris 414, URL Supabase tercatat sebagai `https://faszgrkwdlqxbppownh.supabase.co` (kurang huruf `'s'`).
   - Hostname tanpa `'s'` ini berstatus DNS `ENOTFOUND` sehingga browser (khususnya Firefox) seketika memunculkan pesan error: *"Gagal memverifikasi ke Supabase: TypeError: NetworkError when attempting to fetch resource"*.
   - Anon key pada `GLOBAL_CONFIG` sebelumnya kosong string `""`.

2. **Miskoneksi Input Password Admin pada Tombol "Simpan Perubahan"**:
   - Pada tab **Akun Admin**, input password bertuliskan:
     `<input type="password" id="cfgNewAdminPassword" placeholder="Password Baru (Min 4 karakter)">`
   - Namun fungsi `handleSaveAllSettings()` sebelumnya mencari elemen usang:
     `document.getElementById("cfgNewPin")` (yang sudah tidak ada lagi di HTML).
   - Akibatnya, ketika admin mengetik password baru lalu menekan tombol utama "Simpan Perubahan", password baru tersebut diabaikan.

3. **Terhapusnya Kredensial Supabase saat Menyimpan dari Tab Lain**:
   - Jika admin menekan tombol "Simpan Perubahan" saat berada di Tab 1 ("Acara & Event"), Tab 2 ("Foto & Kategori"), atau Tab 3 ("Akun Admin"), input `#cfgSupabaseUrl` dan `#cfgSupabaseAnonKey` di Tab 4 kosong string `""`.
   - String kosong tersebut menimpa konfigurasi Supabase di state dan `localStorage`, memutuskan koneksi Supabase seketika.

4. **Pencarian ID Event yang Terlalu Kaku**:
   - Di `handleSaveAllSettings()`, pencarian event hanya memakai `e.id === state.currentEventId` tanpa normalisasi slug (misal mengabaikan sufiks angka `-\d+`). Jika ada ketidaksesuaian kecil, event `curEv` menjadi `undefined` dan `saveEventToSupabase()` tidak dijalankan.

5. **Proses Simpan Bersifat Fire-and-Forget Tanpa Await**:
   - `saveEventToSupabase()` dipanggil tanpa `await` atau penanganan status response. Tombol langsung menutup modal sebelum database Supabase selesai merespons, dan jika terjadi error di jaringan, admin tidak mendapatkan umpan balik.

---

## 2. Tindakan Perbaikan yang Telah Diterapkan

1. **Koreksi Hostname Supabase & Sanitasi Otomatis**:
   - `GLOBAL_CONFIG.SUPABASE_URL` diperbarui menjadi `https://faszgrkwdlqxsbppownh.supabase.co`.
   - `GLOBAL_CONFIG.SUPABASE_ANON_KEY` disetel ke `sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA`.
   - Menambahkan sanitasi otomatis pada `DOMContentLoaded` dan `getSupabaseConfig()` agar cache `localStorage` yang menyimpan typo URL lama diperbaiki seketika menjadi URL yang valid.
   - Mengubah query login admin di `handleAdminLogin()` menggunakan `.ilike('username', username)` agar *case-insensitive*.

2. **Universal Asynchronous `handleSaveAllSettings()` dengan Visual State**:
   - Menjadikan fungsi `handleSaveAllSettings()` sebagai fungsi `async`.
   - Tombol berubah menjadi `[Menyimpan ke Supabase...]` dan didisable selama proses penyimpanan berlangsung.
   - Menggunakan `Promise.all` untuk menyimpan serentak:
     1. Data Event ke tabel `events` di Supabase (`saveEventToSupabase`).
     2. Pengaturan Global ke tabel `settings` di Supabase.
     3. Password admin baru ke tabel `admin_users` jika `#cfgNewAdminPassword` diisi $\ge 4$ karakter.
     4. Akun admin baru ke tabel `admin_users` jika form "Tambah Akun Admin Baru" diisi.
   - Jika semua operasi berhasil (HTTP 200/201), modal ditutup otomatis dengan toast sukses: *"✓ Pengaturan berhasil disimpan langsung ke Supabase Realtime Database!"*.
   - Jika terjadi kendala jaringan atau database, modal **TIDAK DITUTUP**, tombol kembali aktif, dan pesan error spesifik ditampilkan pada kotak peringatan `#saveAlertBox` dan toast.

3. **Proteksi Kredensial Supabase**:
   - `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dilindungi dengan rantai fallback:
     `newSupabaseUrl || state.supabaseUrl || state.activeConfig.SUPABASE_URL || "https://faszgrkwdlqxsbppownh.supabase.co"`
   - Kredensial tidak akan pernah tertimpa string kosong meskipun admin menyimpan dari Tab Foto, Tab Acara, atau Tab Akun Admin.

4. **Pencocokan Slug Event Fleksibel & Teruji**:
   - Menerapkan normalisasi slug cerdas pada `curEv` di `handleSaveAllSettings()`. Jika event belum ada di array, sistem otomatis membuat objek event aktif dan menyimpannya ke Supabase.

5. **Pembersihan Duplikasi Fungsi Admin**:
   - Menghapus blok fungsi admin lama yang duplikat (baris 3357-3489).
   - Memastikan `handleChangeAdminPassword()`, `handleAddAdminUser()`, dan `handleDeleteAdminUser()` beroperasi murni ke tabel `admin_users` tanpa kolom `updated_at` (menghindari error `PGRST204`).

---

## 3. Hasil Verifikasi & Pengujian Sistem (100% Passed)

- `node --check js/app.js`: **PASS (Sintaks valid tanpa error)**
- `scratch/verify_all_v431_features.js`:
  - Login query `ilham` ke Supabase: **PASS (Status 200)**
  - Event `wilson-felicia` upsert ke Supabase: **PASS (Status 200)**
  - Settings upsert ke Supabase: **PASS (Status 200)**
  - Verifikasi field: `Photostage`, Drive folder ID `1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5`, Photobooth URL `https://fotoshare.co/e/ZJGYcfWbttuEG8Q67ocZs`, Bingkai PNG Drive URL: **PASS (Semua field tersimpan akurat)**
- `scratch/test_test_gallery_button.js`: **4/4 PASS (100%)**
- `scratch/test_supabase_integration.js`: **9/9 PASS (100%)**
