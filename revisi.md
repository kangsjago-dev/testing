# RENCANA REVISI & PENYEMPURNAAN SISTEM (revisi.md)
# Projek: SnapEvent - Web App Disposable Camera & Live Event Gallery
================================================================================
VERSI TARGET: v2.6.0 (Desain "OurDay": Solid Flat Elegance - Zero Shadow, Zero Gradient, High Contrast)
STATUS: SELESAI DITERAPKAN & TERVERIFIKASI (v2.6.0)
AUTHOR: ZettBOT by Zettbos (Universal Product Architect & Lead Engineering Mentor)
TANGGAL: 19 November 2026
REFERENSI: Screenshot Pengguna (media_1795097804895_85d55c57.jpg - OurDay Wedding UI)
================================================================================

## 1. ANALISIS INSTRUKSI & DEKONSTRUKSI REFERENSI (OURDAY STYLE)
Pengguna menginstruksikan secara tegas:
> *"ganti uix ke desain yang saya tampilkan, dan solidkan sampai ke dalamnya, buat semuanya jelas terlihat jelas, tanpa ada bayang atau degradasi"*

Berdasarkan screenshot referensi **"OurDay"** dan instruksi di atas, berikut adalah aturan desain mutlak yang diterapkan:

1. **Eliminasi Total Bayangan & Gradasi (Zero Shadow & Zero Gradient):**
   - **Tanpa Bayangan (*No Box-Shadow / No Drop-Shadow*):** Semua elemen kartu, tombol, modal, dan bar navigasi dibuat **flat murni (0px shadow)**. Kedalaman visual dan struktur dibentuk murni oleh garis tepi tegas (*crisp border 1px solid*).
   - **Warna Solid Murni (*Zero Gradient / No Gradient Fills*):** Dilarang menggunakan gradasi warna (seperti `linear-gradient` atau `bg-gradient-to-*`). Seluruh latar belakang, kartu, dan tombol menggunakan warna datar padat (*solid flat color*).

2. **Palet Warna Solid "OurDay Olive & Warm Alabaster":**
   - **Latar Belakang Dasar:** Solid Cream Alabaster (`#F9F6F0`).
   - **Permukaan Kartu & Form:** Solid Pure White (`#FFFFFF`) dengan border tegas warna krem hangat (`1px solid #E5DFD5`).
   - **Warna Aksen Utama (Tombol Aksi Utama):** Solid Deep Olive / Forest Green (`#485A44`), teks putih kontras tinggi (`#FFFFFF`).
   - **Warna Tombol Sekunder:** Solid Dark Charcoal (`#222222`), atau Solid White dengan border tegas (`#E5DFD5`) dan teks gelap (`#2A2826`).
   - **Warna Teks Utama:** Solid Deep Espresso / Hampir Hitam (`#1F1E1D`), keterbacaan tajam dan 100% jelas.
   - **Warna Teks Sekunder:** Solid Warm Charcoal / Taupe (`#6E6862`).

3. **Tipografi Bersih & Elegan:**
   - Judul & Nama Pasangan: Serif klasik bersih (*Playfair Display*) dengan huruf kapital tegas dan ampersand ramping.
   - Label & Data: Sans-serif modern (*Plus Jakarta Sans*) dengan bobot tegas (*font-semibold* / *font-bold*) agar teks terbaca sangat jelas dan kontras di layar HP outdoor.

4. **Kamera & Shutter Solid:**
   - Viewfinder memiliki bingkai solid Alabaster Cream dengan border tipis tegas (`border-2 border-[#E5DFD5]`).
   - Tombol Shutter diubah menjadi **Solid Olive Shutter Button**: lingkaran solid hijau olive (`#485A44`) dengan ring putih solid ganda, tanpa bayangan blur.
   - Kontrol filter dan zoom berbentuk kapsul solid putih dengan border tegas.

5. **Navigasi Bawah Solid:**
   - Bilah navigasi bawah berbentuk dermaga solid putih (`#FFFFFF`) dengan border tegas (`1px solid #E5DFD5`) tanpa bayangan melayang, dengan tombol aktif berwarna Solid Olive Green (`#485A44`).

---

## 2. DAFTAR BERKAS YANG AKAN DIUBAH
1. **`style.css`**:
   - Menghapus seluruh efek bayangan (`box-shadow`, `drop-shadow`) dan gradasi (`linear-gradient`).
   - Mengganti seluruh utilitas warna dengan warna solid (`--bg-base: #F9F6F0;`, `--bg-card: #FFFFFF;`, `--color-primary: #485A44;`, `--color-dark: #222222;`, `--border-color: #E5DFD5;`).
   - Menyesuaikan animasi shutter button dengan gaya flat solid bertekanan tegas.
2. **`index.html`**:
   - Mengganti seluruh kelas Tailwind gradasi (`bg-gradient-to-*`, `shadow-*`, `drop-shadow-*`, `backdrop-blur-*`) menjadi kelas solid flat (`bg-[#F9F6F0]`, `bg-white`, `border border-[#E5DFD5]`, `bg-[#485A44] text-white`).
   - Menata ulang Layar Sambutan (`viewWelcome`) menyerupai layout kartu pada screenshot "OurDay" (Badge "YOU'RE INVITED", Judul Serif, Countdown/Details box, tombol solid "Buka Kamera").
   - Memastikan **100% dari 258 ID elemen DOM tetap utuh dan terhubung ke JavaScript** (Zero-Regression).
3. **`app.js`**:
   - Menyelaraskan kelas warna kartu galeri dinamis, tombol like, dan tab kategori agar konsisten dengan tema solid olive green tanpa gradasi/bayangan.

---

## 3. TABEL PERBANDINGAN TAMPILAN

| Elemen UI | Desain Sebelumnya | Desain Baru (OurDay Solid Flat) |
| :--- | :--- | :--- |
| **Gaya Visual** | Gradasi, bayangan lembut, blur | **100% Solid, Flat, Kontras Tinggi, Tanpa Bayang, Tanpa Gradasi** |
| **Warna Utama / Tombol** | Gradasi Rose Gold / Emas | **Solid Deep Olive Green (`#485A44`)** |
| **Latar Belakang** | Gradasi / Ivory lembut | **Solid Warm Cream Alabaster (`#F9F6F0`)** |
| **Permukaan Kartu** | Berbayang (*feather shadow*) | **Solid Pure White (`#FFFFFF`) dengan Border Tegas (`#E5DFD5`)** |
| **Tombol Shutter** | Cincin gradasi dengan bayangan glow | **Lingkaran Solid Olive Green dengan Ring Ganda Tegas** |
| **Navigasi Bawah** | Glassmorphism blur berbayang | **Solid White Dock dengan Border Tegas & Ikon Solid Olive** |

---

## 4. JAMINAN KEAMANAN & ZERO-REGRESSION
- Seluruh 258 ID elemen DOM dipertahankan 100% (Verifikasi script: 258/258 cocok, 0 missing).
- Alur kamera, canvas frame, Google Drive upload, dan backend GAS tetap 100% normal.
- Syntax JavaScript diverifikasi bebas error (`node -c app.js` keluar dengan exit code 0).
- Universal CSS override diterapkan untuk mengeliminasi seluruh `box-shadow`, `drop-shadow`, dan `backdrop-blur`.
- Elemen dinamis JavaScript (`renderGallery`, `renderCategoryTabs`, `renderWinnersPodium`, admin cards, dan toasts) diselaraskan ke gaya solid flat berkontras tinggi OurDay.
