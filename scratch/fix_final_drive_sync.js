const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

const fnStart = code.indexOf('function handleSyncDrivePhotosDirectly() {');
if (fnStart !== -1) {
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
    const replacement = `function handleSyncDrivePhotosDirectly() {
      const driveInput = (document.getElementById("cfgDriveFolderId")?.value || document.getElementById("cfgDriveFolder")?.value || "").trim();
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

      const driveId = (typeof extractDriveFolderId === 'function' ? extractDriveFolderId(driveInput) : driveInput) || driveInput;

      fetch("/api/drive-folder?folderId=" + encodeURIComponent(driveId) + "&category=" + encodeURIComponent(allPhotosLabel))
        .then(function(r) { return r.json(); })
        .then(function(res) {
          if (btn) btn.disabled = false;
          if (btnText) btnText.innerText = "🔄 Sinkron Google Drive";
          if (btnIcon) btnIcon.classList.remove("spin");

          if (res && res.success) {
            state.activeConfig.DRIVE_FOLDER_ID = driveId;
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
          showToast("Gangguan koneksi: " + err.message);
        });
    }`;
    code = code.substring(0, fnStart) + replacement + code.substring(fnEnd);
    fs.writeFileSync('js/app.js', code, 'utf8');
    console.log("✓ handleSyncDrivePhotosDirectly successfully rewired to /api/drive-folder!");
  }
}

