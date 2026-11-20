# PRD - Wedding Photo Gallery & Live Slideshow Platform
**Sistem**: Multi-Event Wedding Gallery with Supabase Cloud Realtime Architecture  
**Versi**: v4.29.0-PROD  
**Arsitektur Database**: Supabase Cloud PostgreSQL (Single Source of Truth) + WebSocket Realtime + Google Drive Live Photo Catalog  
**Terakhir Diperbarui**: 21 November 2026

---

## 1. Ringkasan Eksekutif & Arsitektur Database Terisolasi Penuh
Platform Galeri Foto Pernikahan & Slideshow Interaktif mendukung Multi-Event terisolasi penuh dengan arsitektur **Supabase Cloud PostgreSQL** sebagai Single Source of Truth murni. Seluruh ketergantungan pada Google Apps Script dan Google Spreadsheet telah diputus total untuk menjamin bahwa penyalinan (cloning) website tidak akan saling mempengaruhi atau menimpa pengaturan antar-website.

### 1.1 Skema Tabel Supabase (PostgreSQL)
1. **`events`**:
   - `id` (VARCHAR/TEXT PRIMARY KEY): ID unik berbasis slug (contoh: `andre-fayola-281`, `wilson-felicia-133`)
   - `name` (VARCHAR): Nama pasangan pengantin / judul acara
   - `groom_name`, `bride_name`: Nama mempelai pria dan wanita
   - `event_date` (VARCHAR/DATE): Tanggal pelaksanaan acara
   - `venue` (TEXT): Lokasi gedung / ballroom pelaksanaan
   - `drive_folder_id` (TEXT): ID atau URL folder katalog foto utama di Google Drive
   - `photobooth_url` (TEXT): Tautan khusus vendor photobooth (Fotoshare, Google Photos, dsb.)
   - `custom_categories` (JSONB): Array kategori kustom beserta link folder masing-masing
   - `frame_image_url` (TEXT): Tautan file bingkai PNG transparan download otomatis
   - `logo_url` (TEXT): Tautan monogram/logo spesifik acara
   - `all_photos_label` (VARCHAR): Label tab galeri utama (default: "Semua Foto")
   - `is_active` (BOOLEAN): Status keaktifan acara
   - `created_at`, `updated_at` (TIMESTAMPTZ)
2. **`settings`**:
   - `key` (VARCHAR PRIMARY KEY), `value` (TEXT), `updated_at` (TIMESTAMPTZ)
3. **`admin_users`**:
   - `id` (VARCHAR PRIMARY KEY), `username` (VARCHAR UNIQUE), `name` (VARCHAR), `pin` (VARCHAR), `role` (VARCHAR), `created_at` (TIMESTAMPTZ)
4. **`activity_logs`**:
   - `id` (BIGSERIAL PRIMARY KEY), `action` (VARCHAR), `details` (JSONB), `created_at` (TIMESTAMPTZ)

### 1.2 Isolasi Penuh Website & Eliminasi Hardcode/Fallback
- **Pencegahan Cross-Website Mutation**: Berkas `code.gs` dan `setup.gs` telah dihapus. Fungsi `callBackend` dinonaktifkan total (0 network call).
- **Zero Fallback Mockup**: Array `EVENTS` dan `ADMIN_ACCOUNTS` di `config.json` dikosongkan total (`[]`). Data dimuat 100% dinamis dan realtime via Supabase Client SDK `@supabase/supabase-js@2` dan WebSocket channel `wedding-realtime-channel`.
- **Google Drive Photo Fetching**: Ditangani langsung secara serverless oleh Vercel endpoint `/api/drive-folder`, `/api/fotoshare`, dan `/api/kingphotobooth`.

---

## 2. Fitur & Penanganan Masalah Terkini (v4.1.0)

### 2.1 Navigasi Tab Admin Terkunci (Pinned / Sticky)
- Bilah navigasi tab (`💍 Acara & Event`, `🖼️ Foto & Kategori`, `👥 Akun Admin`, `☁️ Cloud & API`) diletakkan di dalam `.admin-tabs-sticky-wrapper` yang menempel di bagian atas modal dengan `position: sticky; top: 0; z-index: 25; background: #FFFFFF;`.
- Saat pengguna men-scroll konten formulir ke bawah, bilah navigasi **tetap terkunci rapi di atas** dan tidak tertutup.

### 2.2 Inisialisasi Database ERP Google Sheets
- Berkas `setup.gs` menempatkan fungsi `setupTargetSpreadsheetDatabase()` pada posisi paling atas sehingga otomatis menjadi fungsi default saat file dibuka di Google Apps Script.
- Eksekusi fungsi tersebut secara otomatis membuat dan menyusun ke-5 sheet database lengkap dengan styling header emas dan data aktual.
- Disediakan tombol inisialisasi langsung pada antarmuka admin (Tab Cloud & API).

### 2.3 Format Tanggal Halaman Depan dengan Nama Hari Otomatis (v4.4.0)
- Tanggal acara pada badge hero halaman depan (`#eventDate`), subtitle slideshow, dan kartu pratinjau bagikan kini otomatis menampilkan nama hari berbahasa Indonesia di depannya:
  - Contoh: `Minggu, 22 November 2026` atau `Senin, 16 November 2026`.
- Fungsi `formatIndonesianDateWithDay()` menghitung hari secara matematis dari tanggal kalender (`Date.getDay()`), menghindari duplikasi jika nama hari sudah ada, dan tetap memetakan nilai input kalender `YYYY-MM-DD` secara aman ke elemen `<input type="date">`.

### 2.4 Realtime Murni Tanpa Hardcode (Anti-Fallback)
- Seluruh data dibaca secara dinamis dari database tanpa data mockup.

### 2.5 Proteksi Halaman Tidak Ditemukan untuk URL Manual
- Mengetik link manual tanpa parameter event (`https://gallery.runway.my.id/`) menampilkan layar khusus **Halaman Tidak Ditemukan / Acara Tidak Ditemukan** (`#eventNotFoundScreen`).
- Galeri foto, banner sambutan, identitas pengantin, tab filter kategori ("Semua Foto"), dan grup tombol aksi bawah (share, refresh, gembok admin) disembunyikan total guna mencegah kebocoran data antar event dan menjaga privasi masing-masing pasangan.
- Tampilan dirancang bersih dan minimalis tanpa frame kaku serta tanpa tombol masuk panel admin bagi pengunjung publik.

### 2.6 Kustom Logo / Monogram Acara (v4.5.0)
- Logo atau monogram pernikahan (`#heroLogoContainer`) ditampilkan tepat di atas divider dan nama pasangan pengantin sesuai layout kartu mewah.
- Input logo ditempatkan di Tab 1 Admin (Acara & Event) di bawah nama event (`#cfgEventLogoUrl`) dengan kotak pratinjau live (`#adminLogoPreviewBox`).
- Mendukung link Google Drive yang otomatis dinormalisasi menjadi direct image view. Ukuran logo dibatasi proporsional (`max-height: 72px;`) agar menarik dan tidak terlalu besar.

### 2.7 Pembersihan Seketika & Penghapusan Fallback Foto Kategori (v4.6.0)
- Mengeliminasi bug tampilan foto lama saat link kategori diubah ("Muncul gambar sebelumnya baru berubah"):
  - `fallbackDrive` tidak lagi mengambil foto dari `state.allPhotos`. Jika folder kategori belum memiliki foto atau masih dalam proses pemanggilan, sistem mengembalikan array kosong `[]` sehingga tidak ada foto kategori lain yang bocor.
  - Saat berpindah kategori atau mengubah tautan, `state.filteredPhotos` seketika dikosongkan (`[]`) dan grid menampilkan animasi skeleton shimmer (`showGridSkeleton()`), menjamin foto lama langsung hilang seketika.
  - Setiap perubahan tautan pada formulir admin (`onCategoryRowInput` & `handleSaveAllSettings`) langsung menghapus cache foto lama (`state.categoryPhotosMap` & `state.categoryPhotosUrlMap`).

### 2.8 QR Code Berlogo Monogram dengan Latar Belakang Putih Solid (v4.6.0)
- Modal Bagikan & QR Code (`#shareQrModal`) menghasilkan QR Code beresolusi tinggi dengan logo monogram di bagian tengahnya:
  - Menggunakan tingkat koreksi galat tinggi (**`ecc=H`** / toleransi 30%) agar QR code tetap 100% terbaca dan discan oleh ponsel.
  - Bidang tengah di balik logo diberi badge **warna putih solid (`#FFFFFF`)** berukuran 24% dari QR code dengan sudut membulat (*rounded rectangle*) dan border halus. Hal ini menjamin logo berformat transparan (PNG) memiliki latar belakang putih pekat sehingga modul QR code di belakangnya tidak menembus dan merusak scan.
  - Logo diambil otomatis dari menu konfigurasi event aktif (`EVENT_LOGO_URL` / `logoUrl`).
  - Tombol unduh QR Code mendukung pengunduhan instan hasil komposit kanvas ke format PNG.

### 2.9 Pengurutan Kronologis Foto Terbaru di Paling Atas & Eliminasi Total Fallback Hardcode Semua Menu (v4.7.0)
- **Pengurutan Waktu Terbaru di Paling Atas (Newest First Across All Photos, Categories & Events)**:
  - Seluruh foto pada semua kategori (Semua Foto, Photobooth, Akad, Resepsi, Kategori Kustom), semua event, slideshow, dan lightbox diurutkan secara kronologis dengan foto yang paling baru di posisi paling atas.
  - Menggunakan komparator terpadu `sortPhotosNewestFirst` dan `getPhotoTimestamp` yang mengevaluasi epoch timestamp, ISO string, creation/update date, pola nama file ber-timestamp, dan pemecah seri (*tie-breaking*) descending alphanumeric natural filename (`b.name.localeCompare(a.name, undefined, { numeric: true })`) untuk file foto sekuensial kamera.
  - Diterapkan pada client-side (`js/app.js`), instant hydration, pergantian event, filter kategori, seluruh API endpoint (`api/drive-folder.js`, `api/fotoshare.js`, `api/google-photos.js`, `api/kingphotobooth.js`), dan backend Google Apps Script (`code.gs`).
- **Eliminasi Total Fallback Hardcode pada Semua Menu (100% Realtime Database)**:
  - Membersihkan seluruh hardcoded ID/URL fallback (folder Drive, album Fotoshare, event Kingphotobooth) dari seluruh API serverless.
  - Membersihkan akun admin dummy (`usr_superadmin / password: 123 / pin: 123456`) dan fallback list admin; autentikasi dan daftar admin murni divalidasi dan diambil 100% dari spreadsheet Google Sheets (`Akun_Admin` / ERP).
  - Tautan kategori dan photobooth murni terhubung realtime dengan data event aktif di spreadsheet tanpa data tiruan.

### 2.10 QR Share Logo Borderless & Bidang Proporsional Mengikuti Objek (v4.8.0)
- **Logo QR Share Tanpa Border**: Menghilangkan garis tepi (`border/stroke`) di sekeliling logo monogram pada QR Code, sehingga logo tampil bersih dan menyatu alami dengan modul kode QR.
- **Bidang Latar Belakang Putih Menyesuaikan Objek Logo**:
  - Ukuran bidang putih solid tidak lagi statis persegi (`144px x 144px`).
  - Sistem mendeteksi batas transparan gambar (*transparent trimming*) dan menyesuaikan lebar (`bw`) dan tinggi (`bh`) secara dinamis mengikuti rasio aspek logo sebenarnya dengan padding ringkas (`padX: 6px`, `padY: 4px`).
  - Menghilangkan ruang putih kosong yang terlalu besar di bagian atas dan bawah pada logo berbentuk memanjang (seperti logo teks RUNWAY).
- **Audit Backend Realtime**: Menghapus bypass login dan mock demo di `code.gs`. Autentikasi dan data murni 100% realtime dari database Google Sheets.

### 2.11 Pemulihan Mesin Preview, Lightbox & Download Serta Audit 3x Realtime (v4.9.0)
- **Pemulihan Mesin Preview Lightbox**:
  - Memperbaiki deklarasi `photo` yang hilang di `openLightbox` yang sebelumnya memicu `ReferenceError: photo is not defined`.
  - Memprioritaskan eksekusi `updateLightboxContent()` sehingga judul foto, penomoran urut, gambar beresolusi penuh, dan tombol aksi terpasang seketika (0ms).
  - Menyempurnakan pemetaan resolusi `getSharpPreviewUrl`: memisahkan protokol vendor Fotoshare, Kingphotobooth, Google Photos, dan Google Drive secara ketat sehingga URL Fotoshare tidak terdistorsi ke domain Google Drive (mencegah error 404 broken preview).
- **Pemulihan Mesin Download**:
  - Mendeteksi ketersediaan bingkai PNG secara dinamis. Jika acara tidak menggunakan bingkai, tombol unduh langsung berlabel *"⬇️ Unduh Foto Asli (Ukuran Penuh)"* dan memicu pengunduhan instan berkas master asli.
  - Jika berbingkai, sistem menggunakan pra-komposit Blob instan dari memori peramban atau antrean terencana dengan notifikasi progres.
- **Audit 3x Bebas Fallback**:
  - Putaran 1 (Frontend): Menghapus seluruh konstanta fallback folder dan kategori di `DEFAULT_CONFIG`.
  - Putaran 2 (API): Seluruh fungsi serverless 100% bergantung pada parameter dinamis.
  - Putaran 3 (Backend): Menghapus mock akun admin dan password bypass di `code.gs`. Autentikasi murni memvalidasi sheet `Pengguna_Admin`.

### 2.12 Pengunduhan Berkas Asli Tanpa Kompresi (Uncompressed Direct Master Download) (v4.10.0)
- **Streaming Master Biner Byte-for-Byte**:
  - Pengunduhan berkas Google Drive dialihkan dari thumbnail terkompresi `lh3.googleusercontent.com/d/{id}=w3200` ke endpoint stream berkas asli `https://drive.usercontent.google.com/download?id={id}&export=download`.
  - Berkas master diunduh dengan ukuran byte asli fotografer secara utuh 100% tanpa kompresi algoritma gambar, menjaga kejernihan piksel asli dan mempertahankan seluruh metadata EXIF kamera.
- **Bypass Kompresi Canvas pada Foto Polos**:
  - Untuk acara tanpa bingkai foto (`FRAME_IMAGE_URL` kosong), sistem langsung menyalurkan URL unduhan master asli (`executeDirectPhotoDownload`) tanpa melalui canvas re-encoding (`canvas.toBlob("image/jpeg", 0.94)`).
  - Fotoshare dibersihkan dari query pembatas resolusi (`?w=...`) menuju CDN master `cdn-bz-op.fotoshare.co`, dan Google Photos menggunakan flag `=d` untuk master download langsung.
- **Audit 3x Realtime Bebas Fallback**:
  - Pembersihan total fallback gambar cover Unsplash di `renderCoverSection()`, pembersihan fallback event di admin, dan penegasan arsitektur 100% realtime database.

### 2.13 Pengunduhan Berkas Fisik Seluler (Mobile Blob Streaming) & Eliminasi Total Fallback Realtime (v4.11.0)
- **Asynchronous Physical Blob Streaming pada Perangkat Seluler (HP)**:
  - Mengeliminasi kegagalan unduh pada perangkat seluler di mana tautan server langsung (`/api/download-proxy?...`) diblokir oleh peramban HP (Android Chrome, iOS Safari, Samsung Internet, Webview).
  - Alur pengunduhan kini mengambil *physical binary blob* terlebih dahulu ke memori lokal peramban via `fetch(proxyUrl)`, memvalidasi ukuran berkas riil (`blob.size > 0`), dan menyimpannya melalui `saveBlobToDevice` menggunakan `URL.createObjectURL(blob)`.
  - Status widget hanya diperbarui ke 100% ("✓ Berhasil Disimpan!") setelah berkas fisik berhasil disimpan ke penyimpanan HP, mencegah status berhasil semu (*false positive*).
- **Eliminasi Total Fallback Hardcode Master (Realtime Database)**:
  - Seluruh nilai `GLOBAL_CONFIG.EVENTS` dan `GLOBAL_CONFIG.ACTIVE_EVENT_ID` pada sisi klien dikosongkan (`[]` dan `""`).
  - Seluruh nilai `WEDDING_CONFIG` pada sisi backend Google Apps Script dikosongkan.
  - Menghapus fallback array event statis, fallback PIN default, dan fallback ID event dari `code.gs`.
  - Seluruh data event, konfigurasi, dan pengguna admin beroperasi 100% realtime membaca database Google Sheets (`Daftar_Acara`, `Pengaturan`, `Pengguna_Admin`, `Daftar_Foto`).

### 2.14 Konsolidasi Kendali Folder Google Drive & Eliminasi Duplikasi Bidang Admin (v4.12.0)
- **Eliminasi Duplikasi Bidang Folder Drive pada Tab 1**:
  - Menghapus input `#cfgEventDriveFolderId` dari Tab 1 (Acara & Event).
  - Tab 1 dikhususkan murni untuk parameter identitas acara: nama pasangan/event, logo acara monogram, tanggal, venue, pesan sambutan, dan pesan penutup.
- **Konsolidasi Single Source of Truth pada Tab 2 (Foto & Kategori)**:
  - Seluruh konfigurasi folder Google Drive untuk kategori utama "Semua Foto" event aktif dikelola terpadu pada Tab 2 via `#cfgDriveFolderId` yang dilengkapi tombol sinkronisasi instan (`#btnSyncDrivePhotos`) dan pengurutan kronologis.

### 2.15 Redesain Antarmuka & Tipografi Elegan Kategori Tanpa Foto (v4.13.0)
- **Komponen Luxury Wedding Empty State**:
  - Wadah kartu `.empty-gallery-card` dengan palet warna ivory dan aksen emas lembut (`rgba(197, 168, 128, 0.35)`), border-radius 24px, dan bayangan lembut.
  - Menggantikan raw emoji `🖼️` dan `🔄` dengan ikon vektor SVG kustom beresolusi tajam (`.empty-gallery-icon-wrap`).
  - Badge kategori elegan dengan uppercase tracking: `Kategori • [Nama Kategori]`.
  - Judul bernuansa puitis: *"Momen Indah Sedang Disiapkan"* menggunakan font serif *Cormorant Garamond*.
  - Narasi ramah dan puitis yang menjelaskan foto sedang dipersiapkan oleh fotografer.
  - Tombol aksi terpadu: *Segarkan Kategori Ini* dan *Buka Album Sumber* dengan SVG icon inline.

### 2.16 Perbaikan Fallback Photostage (Mode Panggung) & Audit 3x Eliminasi Total Hardcode Database (v4.14.0)
- **Graceful Fallback & Ketahanan Photostage (Mode Panggung Layar Penuh)**:
  - Pada `openSlideshow(startIndex)`, jika kategori yang sedang dilihat kosong (`state.filteredPhotos.length === 0`), sistem secara cerdas dan anggun beralih memutar seluruh foto aktif acara (`state.allPhotos`), sehingga proyeksi layar panggung tidak pernah terhenti atau macet. Jika seluruh foto event belum ada, sistem menampilkan toast peringatan elegan.
  - Pada `showSlide(index)`, seluruh gambar diproses melalui `getSharpPreviewUrl(photo)` untuk memastikan proyeksi layar lebar panggung beresolusi maksimal (Google Drive, Fotoshare, Kingphotobooth, Google Photos).
  - Dilengkapi penangan kegagalan bertingkat (`onerror` fallback) pada elemen slide panggung (`#slideshowImgA` dan `#slideshowImgB`): jika resolusi tinggi gagal termuat, otomatis beralih ke `photo.previewUrl`, lalu ke `photo.thumbnailUrl`, menghilangkan risiko tampilan ikon gambar rusak (*broken image*).
  - Teks watermark pasangan (`#slideshowCouple`) dan info kategori/tanggal/venue (`#slideshowCategory`) tersinkronisasi murni dari `state.activeConfig` secara dinamis pada setiap transisi slide.
  - Menambahkan tombol aksi pemicu Mode Panggung (`.lightbox-action-btn`) pada bilah atas Lightbox modal untuk kemudahan aktivasi langsung dari foto aktif.
  - **Eliminasi Label Kaku 'Kategori • Photostage'**: Menghapus pill badge `.empty-gallery-badge` dan teks penyebutan kategori pada notifikasi kategori tanpa foto, menyajikan narasi hangat yang bersih dan profesional.
- **Audit 3x Eliminasi Total Hardcode Database (Murni Realtime 100%)**:
  - **Frontend (`js/app.js`)**: Menghapus sisa fallback hardcode PIN `"111111"` pada fungsi otentikasi login admin (baris 986 dan 2619). Otentikasi dan PIN murni 100% membaca database Google Sheets.
  - **Serverless API (`api/*.js`)**: Seluruh endpoint terverifikasi bebas hardcode ID dan beroperasi 100% dinamis.
  - **Backend GAS (`code.gs` & `setup.gs`)**: Menghapus parameter usang `WEDDING_FOLDER_URL` ("Tautan Folder Google Drive Kategori Wedding Panggung"), menghapus hardcoded ID folder `1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5` dan `1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI`, menghapus hardcoded event `andre-fayola-281` dan `wilson-felicia-133`, serta menghapus hardcoded admin `usr_superadmin / 111111` dari fungsi inisialisasi database.
  - **Safe Non-Destructive Migration**: Inisialisasi database pada `code.gs` dan `setup.gs` tidak lagi menghapus (*clear*) sheet yang sudah ada, menjamin seluruh data riil pengguna tidak pernah tertimpa.

### 2.17 Isolasi Logo Monogram Acara & Penanganan Gambar Rusak (v4.15.0)
- **Isolasi Monogram/Logo Tiap Acara (Multi-Event Logo Isolation)**:
  - Setiap acara memiliki kolom monogram sendiri (`Logo_Acara`) pada tabel `Daftar_Acara` di Google Spreadsheet.
  - Jika suatu acara tidak memiliki monogram/logo, kontainer `#heroLogoContainer` disembunyikan secara bersih tanpa mewarisi logo global vendor Runway.
  - Atribut `#heroLogoImg` dilengkapi penanganan kegagalan otomatis (`onerror`) untuk menyembunyikan kontainer jika URL logo tidak dapat diakses, mencegah ikon gambar rusak.

### 2.18 Perbaikan Kendala Pembukaan Acara Lainnya & Eliminasi Deadlock Kartu Skeleton (v4.16.0)
- **Resolusi Dini Tanpa Pemblokiran 404**:
  - Mengeliminasi penghentian dini (*early abort*) pada pembacaan `config.json` di `initApp()`, menjamin proses inisialisasi terus berjalan menuju `syncFromSpreadsheetGViz()` yang membaca data acara live dari Google Sheets database.
- **Penerimaan Respons Folder Kosong Secara Anggun**:
  - Endpoint `/api/drive-folder` yang mengembalikan array foto kosong (`photos: []`) diterima sebagai status sukses yang valid tanpa memicu pengecualian `throw new Error("Folder kosong")`.
- **Eliminasi Total Deadlock Kartu Skeleton**:
  - Menyediakan blok `else` pada pemeriksaan folder `activeDriveId !== respDriveId` dan penyaringan foto `sortedIncoming.length === 0` di `handleGalleryResponse()`. DOM kartu skeleton selalu dibersihkan dan digantikan secara seketika oleh kartu mewah `.empty-gallery-card`.
- **Penyelarasan Multi-Event Registry**:
  - Menyelaraskan seluruh entri acara (`andre-fayola-281`, `wilson-felicia-133`, `wilson-felicia`) di `config.json` lengkap dengan ID folder Google Drive yang akurat sesuai Google Sheets.
- **Perpindahan Acara Dinamis & Mulus**:
  - Pemilihan acara via `handleSelectEventChange()` seketika memperbarui `state.activeCategory`, memanggil `renderPhotoGrid()`, memperbarui address bar browser secara dinamis, dan memicu sinkronisasi foto murni acara yang dipilih tanpa kebocoran cache lintas acara.

### 2.20 Proteksi Tautan Domain Utama: Notifikasi 'Halaman Tidak Ditemukan' Saat URL Root Diakses Tanpa Parameter Acara (v4.20.0)
- **Kewajiban Parameter Acara Eksplisit (Strict Event Requirement)**:
  - Akses langsung ke root domain murni (`https://gallery.runway.my.id/`) tanpa menyertakan parameter acara (`?event=...` atau `?e=...`) diwajibkan menampilkan layar notifikasi **"Halaman Tidak Ditemukan"** (`#eventNotFoundScreen`).
  - Menghapus seluruh mekanisme auto-fallback (ke `localStorage`, `ACTIVE_EVENT_ID`, `andre-fayola-281`, atau `state.events[0]`) yang sebelumnya secara otomatis memuat acara pengantin pada URL root.
  - Seluruh elemen galeri (nama pasangan pengantin, banner sambutan, logo monogram, filter kategori, kartu foto, dan footer) disembunyikan seketika untuk melindungi kerahasiaan dan privasi masing-masing pasangan pengantin.

### 2.21 Redesain Layar 'Halaman Tidak Ditemukan': Tampilan Minimal Frameless, Eliminasi Tombol Admin & Isolasi Kontrol Galeri (v4.21.0)
- **Tampilan Minimal Frameless**:
  - Menghilangkan `border`, `box-shadow`, dan `background: #FFFFFF` kaku pada `.event-not-found-card` di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css). Wadah notifikasi menyatu bersih dengan latar belakang halaman.
- **Penghapusan Kalimat Contoh Tautan**:
  - Menghapus teks `"atau buka link khusus acara (contoh: ?event=nama-acara)."` dari [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) dan [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
  - Teks deskripsi tersisa hanya arahan ramah: *"Tautan galeri tidak menyertakan kode acara yang valid.<br>Silakan periksa kembali tautan undangan Anda."*
- **Penghapusan Tombol Masuk Panel Admin**:
  - Tombol *"Masuk Panel Admin"* di dalam kartu `#eventNotFoundScreen` dihapus sepenuhnya dari [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) agar pengunjung publik pada URL root tidak memiliki akses tombol admin.
- **Penyembunyian Menyeluruh Bilah Filter Bawah & Grup Kontrol Aksi (Share, Refresh, Gembok Admin)**:
  - Memperbaiki selektor penyembunyian pada hidrasi awal [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) dan fungsi `showEventNotFoundScreen()` di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) untuk secara akurat menargetkan `#gallerySection` (`.filter-wrapper`) dan `#adminActiveFloatingBar`.
  - Memasang aturan CSS fail-safe `#eventNotFoundScreen:not([style*="display: none"]) ~ #gallerySection` sehingga tab "Semua Foto" dan ikon aksi bawah terjamin 100% tersembunyi tanpa risiko keterlambatan eksekusi JavaScript.

### 2.22 Redesain Galeri Frameless, Eliminasi Tombol Photobooth & Pembersihan Total Hardcoded Fallback (v4.22.0)
- **Galeri Frameless & Borderless**:
  - Menghapus border, box-shadow, dan background kaku pada kartu status kosong foto `.empty-gallery-card` di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css) sehingga tampil bersih menyatu dengan latar belakang (*minimalist aesthetic*).
  - Menghapus border pada kartu foto individual `.photo-card` sehingga seluruh foto tampil bersih, elegan, dan *edge-to-edge* (borderless).
- **Penghapusan Tombol Pintas Photobooth**:
  - Menghapus tombol pintas `Buka Foto Photobooth (... Foto) →` dari `renderPhotoGrid()` di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js). Area kategori kosong hanya menyajikan tombol *"Segarkan Kategori Ini"*.
- **Pembersihan Total Fallback Hardcode (100% Realtime Database Murni)**:
  - Mengosongkan seluruh parameter fallback root di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json) (`FRAME_IMAGE_URL: ""`, `DRIVE_FOLDER_ID: ""`, `ACTIVE_EVENT_ID: ""`, `EVENT_NAME: ""`, `PHOTOBOOTH_URL: ""`, `CUSTOM_CATEGORIES: []`).
  - Mengisolasi pembacaan frame per acara di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) murni dari `matchedEv.frameImageUrl`, mencegah pewarisan frame global yang tidak diinginkan.

### 2.23 Resolusi Masalah Refresh Event Baru & Eliminasi Total Infinite Skeleton Loading (v4.23.0)
- **Pembersihan Skeleton Instan di Awal (`initApp`)**:
  - Pada event baru yang baru dibuat (di mana cache foto lokal masih kosong/belum ada foto tersimpan), `initApp()` seketika mengeksekusi `renderPhotoGrid()` dalam 0 milidetik.
  - Kartu skeleton bawaan HTML segera dibersihkan dan digantikan secara langsung oleh status elegan *"Momen Indah Sedang Disiapkan"* tanpa menunggu seluruh rangkaian request jaringan.
- **Pencegahan Abort Prematur di `config.json`**:
  - Menghapus pemanggilan `showEventNotFoundScreen(true)` di dalam `fetch("config.json")`.
  - Jika ID event belum terdaftar di file statis `config.json`, proses inisialisasi dialirkan secara mulus menuju `syncFromSpreadsheetGViz()` untuk membaca database realtime Google Spreadsheet tanpa tertahan notifikasi 404 keliru.
- **Fail-Safe Watchdog Timer (3.5 Detik)**:
  - Memasang watchdog timer 3.5 detik pada `fetchGalleryData()` dan `showGridSkeleton()`. Jika proses pembacaan backend Google Apps Script atau vendor eksternal mengalami latensi atau pending jaringan, kartu skeleton otomatis dihentikan dan `#photosGrid` segera dirender menggunakan `renderPhotoGrid()`.
  - Menambahkan `AbortController` dengan timeout 4 detik pada pemanggilan `/api/drive-folder` sehingga otomatis beralih ke backend GAS jika serverless scrape tidak merespons.
- **Jaminan Konsistensi Metadata Multi-Event pada Backend Google Apps Script (`code.gs`)**:
  - Memastikan seluruh cabang pengembalian pada `getGalleryData()` (termasuk folder kosong dan folder baru) selalu menyertakan `events: eventsList` dan `activeEventId: selectedEventId` agar frontend selalu menerima registry acara lengkap.

### 2.24 Resolusi Infinite Onerror Logo Loop & Penuntasan Tab Spinner Loading (v4.24.0)
- **Eliminasi Infinite Onerror Loop pada Elemen Logo (`#heroLogoImg` & `#adminLogoPreviewImg`)**:
  - Menghapus atribut kosong `src=""` pada tag `<img>` di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) yang secara otomatis di-resolve browser ke URL halaman dan memicu loop penugasan error tak berujung.
  - Memperbarui event handler `onerror` menjadi self-detaching: `this.onerror=null; this.removeAttribute('src'); if (this.parentElement) this.parentElement.style.display='none';`.
  - Mengubah seluruh logika reset logo pada inline micro-loader [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) dan [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) dari `img.src = ""` menjadi `img.removeAttribute('src')`.
- **Watchdog Timeout pada Koneksi Backend Apps Script (`callBackend`)**:
  - Memasang `AbortController` dengan batas timeout 8 detik pada fungsi `callBackend()` di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) guna mencegah koneksi pending permanen dari pemanggilan macro GAS.
- **Penyelarasan Pre-Hydration Event Tommy & Natasha di `config.json`**:
  - Mendaftarkan `tommy-natasha-594` ke array `EVENTS` statis di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json) untuk memastikan hidrasi instan 0ms saat halaman di-refresh.

### 2.25 Sinkronisasi Total Multi-Event ke Sheet 'Daftar_Acara' & Penambahan Baris Realtime (v4.25.0)
- **Fungsi Setup Mandiri 1-Klik (`populateDaftarAcara`) pada `setup.gs`**:
  - Menempatkan fungsi `populateDaftarAcara()` pada baris teratas [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) sebagai fungsi default saat berkas dibuka di Google Apps Script. Sekali klik **Run (▶️)**, ke-3 event aktif (`andre-fayola-281`, `wilson-felicia-133`, `tommy-natasha-594`) langsung dimasukkan dan diformat rapi dengan header emas 11 kolom pada spreadsheet `133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`.
  - Memperbarui `setupTargetSpreadsheetDatabase()` agar secara otomatis mengisikan ke-3 event tersebut jika baris data masih kosong ($row \le 1$).
- **Fungsi Append Baris Realtime & Endpoint Backend (`code.gs`)**:
  - Menambahkan fungsi `addEventToSheet(ss, ev)` dan `syncAllEventsToSheet()` pada [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) untuk menggaransi bahwa setiap penambahan event baru langsung menyisipkan baris fisik ke sheet `Daftar_Acara`.
  - Menambahkan action API `addEvent` dan `syncDaftarAcara` pada `handleApiRequest()` untuk melayani instruksi sinkronisasi langsung dari Web Admin.
  - Menyelaraskan ukuran 11 kolom penuh termasuk `Logo_Acara` (260px) dan `Status` (100px).
- **Integrasi Dua Arah Web Admin & GViz Realtime Sync (`js/app.js` & `index.html`)**:
  - Pada penambahan event baru (`handleAddNewEvent`), selain menyimpan konfigurasi global, frontend langsung memicu `callBackend("addEvent", ...)` untuk append baris ke sheet `Daftar_Acara`.
  - Pada `syncFromSpreadsheetGViz()`, menambahkan pembacaan berkala dari `sheet=Daftar_Acara` sehingga penambahan atau perubahan baris event yang dilakukan langsung di Google Sheets secara realtime otomatis terbaca dan tersinkronisasi ke aplikasi web.
  - Menambahkan tombol *"📊 Sinkronkan ke Sheets"* pada antarmuka admin Tab Acara di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/index.html) yang memanggil `triggerSyncDaftarAcara()`.

### 2.26 Migrasi Arsitektur Database ke Supabase & Realtime Engine (v4.26.0)
- **Implementasi Supabase Cloud Database (PostgreSQL + Realtime WebSocket)**:
  - Mengintegrasikan library resmi `@supabase/supabase-js@2` pada [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/index.html).
  - Menyiapkan cetak biru SQL DDL di [scratch/supabase_schema.sql](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/scratch/supabase_schema.sql) (tabel `events`, `settings`, `admin_users`, `activity_logs`, Row Level Security / RLS, dan seed data 3 event aktif).
  - Menyediakan konfigurasi `DATABASE_ENGINE: "supabase"`, `SUPABASE_URL`, dan `SUPABASE_ANON_KEY` di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/config.json) dan antarmuka Admin Tab Cloud & API (`#cfgSupabaseUrl`, `#cfgSupabaseAnonKey`).
- **Sistem Dual-Engine Fail-Safe (Zero Downtime)**:
  - Memasang logika transisi cerdas di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/js/app.js): jika kredensial Supabase terisi, sistem membaca dan menulis data ke Supabase (<50ms). Jika belum diisi atau mengalami kendala jaringan, sistem secara otomatis beralih (*fallback*) ke Google Sheets GViz dan Google Apps Script tanpa downtime.
- **Koneksi WebSocket Realtime 0 Detik**:
  - Mengaktifkan subscription kanal `supabase.channel('wedding-realtime-channel')` pada tabel `events` dan `settings`.
  - Pembaruan nama acara, logo, kategori, atau penambahan event baru oleh admin langsung tersebar secara instan (0 milidetik) ke seluruh layar proyektor slideshow dan tamu tanpa memerlukan refresh halaman atau polling 20 detik.
- **Fitur 1-Klik Salin Data dari Google Sheets ke Supabase**:
  - Menyediakan tombol `handleMigrateSpreadsheetToSupabase()` pada UI Admin untuk memindahkan seluruh data event aktif dari spreadsheet ke Supabase dalam 1 kali klik.
  - Menyediakan tombol `handleTestSupabaseConnection()` untuk verifikasi status koneksi instan.

### 2.27 Eliminasi Total Database Ganda & Konsolidasi Supabase Single Source of Truth (v4.27.0)
- **Pembersihan Database Google Sheets & Google Apps Script**:
  - Menghapus berkas `setup.gs` dari repositori proyek karena inisialisasi tabel spreadsheet sudah tidak lagi terpakai.
  - Menghapus modul tampilan *'Database Google Sheets (ERP Master Data)'* dan input *'URL Google Apps Script'* dari Tab 4 Admin di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/index.html).
  - Menghapus tombol *'Sinkronkan ke Sheets'* pada Tab Acara di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/index.html).
  - Tab 4 Admin resmi berubah menjadi **⚡ Database Supabase** yang bersih, elegan, dan fokus.
- **Konsolidasi Single Source of Truth di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/js/app.js)**:
  - Menghapus polling berkala GViz Google Sheets (`syncFromSpreadsheetGViz`) dan dual-write sinkronisasi ke GAS.
  - Operasi Create (tambah event), Read (ambil registry acara & settings), Update (simpan pengaturan), dan Delete (hapus event) dieksekusi 100% murni langsung ke Supabase PostgreSQL dengan latensi <50ms dan WebSocket realtime 0 detik.
  - Menambahkan tombol *"🔄 Segarkan Data Realtime"* (`handleRefreshFromSupabase()`) pada panel admin.
- **Pembaruan Konfigurasi di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-test/config.json)**:
  - Menetapkan `"SUPABASE_URL": "https://faszgrkwdlqxbppownh.supabase.co"`.
  - Membersihkan parameter usang: `"SPREADSHEET_ID"`, `"SPREADSHEET_URL"`, dan `"GAS_API_URL"`.
