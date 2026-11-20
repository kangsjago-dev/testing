const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

// 1. handleStandaloneChangePin
const pinBlockStart = code.indexOf('function handleStandaloneChangePin() {');
if (pinBlockStart !== -1) {
  let depth = 0;
  let pinBlockEnd = -1;
  for (let i = pinBlockStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) { pinBlockEnd = i + 1; break; }
    }
  }
  if (pinBlockEnd !== -1) {
    const replacement = `function handleStandaloneChangePin() {
      const pinInput = document.getElementById("cfgNewPin");
      const alertBox = document.getElementById("changePinAlertBox");
      const newPin = (pinInput ? pinInput.value : "").trim();

      if (!newPin || newPin.length < 4) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "PIN baru minimal 4 digit.";
          alertBox.style.display = "block";
        }
        return;
      }

      state.adminPin = newPin;
      try {
        sessionStorage.setItem("WEDDING_ADMIN_PIN", newPin);
        localStorage.setItem("WEDDING_ADMIN_PIN", newPin);
      } catch(e) {}

      if (state.supabaseClient) {
        const username = (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin";
        state.supabaseClient.from('admin_users').update({ pin: newPin, updated_at: new Date().toISOString() }).eq('username', username).then(function() {});
      }

      if (pinInput) pinInput.value = "";
      if (alertBox) {
        alertBox.className = "admin-alert-box success";
        alertBox.innerText = "✓ PIN berhasil diperbarui!";
        alertBox.style.display = "block";
      }
      showToast("✓ PIN Admin berhasil diganti!");
      loadAdminUsers();
    }`;
    code = code.substring(0, pinBlockStart) + replacement + code.substring(pinBlockEnd);
    console.log("✓ 1. handleStandaloneChangePin cleaned");
  }
}

// 2. deleteEvent block in event manager
const delEventStart = code.indexOf('// 1. Coba panggil action deleteEvent ke backend');
const copyUrlStart = code.indexOf('function copyActiveEventUrl() {');
if (delEventStart !== -1 && copyUrlStart !== -1 && delEventStart < copyUrlStart) {
  const replacement = `if (state.supabaseClient) {
        deleteEventFromSupabase(deleteId, function() {
          finalizeEventDeletion(updatedEvents, nextId);
        }, function() {
          finalizeEventDeletion(updatedEvents, nextId);
        });
      } else {
        finalizeEventDeletion(updatedEvents, nextId);
      }
    }\n\n    `;
  code = code.substring(0, delEventStart) + replacement + code.substring(copyUrlStart);
  console.log("✓ 2. deleteEvent cleaned");
}

// 3. testAndSyncDriveFolder
const testDriveStart = code.indexOf('function testAndSyncDriveFolder() {');
if (testDriveStart !== -1) {
  let depth = 0;
  let testDriveEnd = -1;
  for (let i = testDriveStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) { testDriveEnd = i + 1; break; }
    }
  }
  if (testDriveEnd !== -1) {
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
    code = code.substring(0, testDriveStart) + replacement + code.substring(testDriveEnd);
    console.log("✓ 3. testAndSyncDriveFolder cleaned");
  }
}

// 4. Clean the 3 getCategoryPhotos occurrences
// Replace any callBackend("getCategoryPhotos", ...) with cached photos callback
while (code.includes('callBackend("getCategoryPhotos"')) {
  const idx = code.indexOf('callBackend("getCategoryPhotos"');
  // Find opening of callBackend call
  const callStart = code.lastIndexOf('callBackend(', idx);
  // Find closing of callBackend call
  let depth = 0;
  let callEnd = -1;
  for (let i = callStart; i < code.length; i++) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') {
      depth--;
      if (depth === 0) { callEnd = i + 1; break; }
    }
  }
  if (callEnd !== -1) {
    const replacement = `(function() { if (typeof callback === 'function') callback((state.categoryPhotosMap && state.categoryPhotosMap[cat]) || []); })()`;
    code = code.substring(0, callStart) + replacement + code.substring(callEnd);
    console.log("✓ Replaced a callBackend('getCategoryPhotos') at index", idx);
  } else {
    break;
  }
}

fs.writeFileSync('js/app.js', code, 'utf8');
console.log("✓ Saved js/app.js. Length:", code.length);

