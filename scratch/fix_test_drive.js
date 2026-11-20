const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

// 1. Remove the accidentally prepended text at the very top (before MULTI-DEVICE SYNC)
const multiSyncIdx = code.indexOf('/* ==========================================================================\n       MULTI-DEVICE SYNC & CATEGORY SYNC UTILITIES');
if (multiSyncIdx > 0) {
  const cleanTop = `function isGooglePhotosUrl(url) {
      if (!url) return false;
      const s = String(url).toLowerCase().trim();
      return s.includes("photos.google.com") || s.includes("photos.app.goo.gl");
    }\n\n    `;
  code = cleanTop + code.substring(multiSyncIdx);
  console.log("✓ Restored clean top of js/app.js");
}

// 2. Now find the real testAndSyncDriveFolder that still has callBackend("testAndSyncDriveFolder"
const idx = code.indexOf('callBackend("testAndSyncDriveFolder"');
if (idx !== -1) {
  const fnStart = code.lastIndexOf('function testAndSyncDriveFolder(', idx);
  let depth = 0;
  let fnEnd = -1;
  for (let i = fnStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) { fnEnd = i + 1; break; }
    }
  }
  if (fnEnd !== -1) {
    const replacement = `function testAndSyncDriveFolder() {
      const driveInput = (document.getElementById("cfgDriveFolder")?.value || "").trim();
      const allPhotosLabel = (document.getElementById("cfgMainGalleryLabel")?.value || document.getElementById("cfgAllPhotosLabel")?.value || state.allPhotosLabel || "Semua Foto").trim();
      if (!driveInput) {
        showToast("⚠️ Masukkan Tautan atau ID Folder Google Drive terlebih dahulu.");
        return;
      }

      const btn = document.getElementById("btnSyncDrivePhotos");
      const btnText = document.getElementById("syncDriveBtnText");
      const btnIcon = document.getElementById("syncDriveBtnIcon");

      if (btn) btn.disabled = true;
      if (btnText) btnText.innerText = "Memindai & Menyinkronkan...";
      if (btnIcon) btnIcon.classList.add("spin");

      fetch("/api/drive-folder?folderId=" + encodeURIComponent(driveInput) + "&category=" + encodeURIComponent(allPhotosLabel))
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (btn) btn.disabled = false;
          if (btnText) btnText.innerText = "🔄 Sinkron Google Drive";
          if (btnIcon) btnIcon.classList.remove("spin");

          if (res && res.success) {
            state.activeConfig.DRIVE_FOLDER_ID = driveInput;
            state.activeConfig.ALL_PHOTOS_LABEL = allPhotosLabel;
            state.allPhotosLabel = allPhotosLabel;
            try {
              localStorage.setItem("WEDDING_ALL_PHOTOS_LABEL", allPhotosLabel);
              localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
            } catch(e) {}
            renderCategoryTabs();
            showToast("✓ " + (res.count || 0) + " foto Google Drive berhasil disinkronkan!");
            fetchGalleryData(true);
          } else {
            showToast("⚠️ " + ((res && res.message) || "Gagal mengakses folder Google Drive."));
          }
        })
        .catch(function(err) {
          if (btn) btn.disabled = false;
          if (btnText) btnText.innerText = "🔄 Sinkron Google Drive";
          if (btnIcon) btnIcon.classList.remove("spin");
          showToast("⚠️ Gangguan koneksi saat memindai Google Drive: " + err.message);
        });
    }`;
    code = code.substring(0, fnStart) + replacement + code.substring(fnEnd);
    console.log("✓ Successfully replaced testAndSyncDriveFolder at index", fnStart);
  }
}

fs.writeFileSync('js/app.js', code, 'utf8');
console.log("✓ Done! Final length:", code.length);

