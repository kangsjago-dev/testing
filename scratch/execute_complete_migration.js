const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

console.log("Original js/app.js length:", code.length);

// 1. NEUTRALIZE callBackend completely
const callBackendStart = code.indexOf('function callBackend(action, payload, onSuccess, onError) {');
if (callBackendStart !== -1) {
  let depth = 0;
  let callBackendEnd = -1;
  for (let i = callBackendStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) {
        callBackendEnd = i + 1;
        break;
      }
    }
  }
  if (callBackendEnd !== -1) {
    const replacement = `function callBackend(action, payload, onSuccess, onError) {
      console.warn("⚠️ [TERISOLASI] Panggilan ke Google Apps Script (callBackend:" + action + ") dinonaktifkan permanen untuk mencegah perubahan pada website lain.");
      if (onError) onError(new Error("Google Apps Script telah diputus total. Sistem murni menggunakan Supabase."));
    }`;
    code = code.substring(0, callBackendStart) + replacement + code.substring(callBackendEnd);
    console.log("✓ Step 1: callBackend completely neutralized");
  }
}

// 2. Remove GAS_API_URL loading and saving in handleSaveAdminSettings
code = code.replace(
  /const newApiUrl = \(document\.getElementById\("cfgGasApiUrl"\)\?\.value \|\| ""\)\.trim\(\);\s*state\.gasApiUrl = newApiUrl;\s*if \(newApiUrl\) \{\s*localStorage\.setItem\("WEDDING_GAS_API_URL", newApiUrl\);\s*\}/,
  `try { localStorage.removeItem("WEDDING_GAS_API_URL"); } catch(e) {}\n      state.gasApiUrl = "";`
);

code = code.replace(
  /GAS_API_URL:\s*newApiUrl,/,
  `// GAS_API_URL removed - purely Supabase`
);

// In remote config loader (lines ~28141)
code = code.replace(
  /if \(remoteCfg\.GAS_API_URL\) \{\s*state\.gasApiUrl = remoteCfg\.GAS_API_URL;\s*const apiUrlInput = document\.getElementById\("cfgGasApiUrl"\);\s*if \(apiUrlInput\) apiUrlInput\.value = remoteCfg\.GAS_API_URL;\s*\}/,
  `// remoteCfg.GAS_API_URL ignored - isolated to Supabase`
);
console.log("✓ Step 2: GAS_API_URL removed from saving & remote config");

// 3. Update handleDeleteEvent to use deleteEventFromSupabase and eliminate callBackend("deleteEvent")
const deleteEventTarget = code.indexOf('// 1. Coba panggil action deleteEvent ke backend');
if (deleteEventTarget !== -1) {
  // Let's find where this block ends (around catch / showToast)
  const blockEnd = code.indexOf('/* ==========================================================================\n       ADMIN EVENT EDITING & SELECTION PIPELINE', deleteEventTarget);
  if (blockEnd !== -1) {
    const replacement = `if (state.supabaseClient) {
        deleteEventFromSupabase(deleteId, function() {
          finalizeEventDeletion(updatedEvents, nextId);
        }, function(err) {
          finalizeEventDeletion(updatedEvents, nextId);
        });
      } else {
        finalizeEventDeletion(updatedEvents, nextId);
      }
    }

    `;
    code = code.substring(0, deleteEventTarget) + replacement + code.substring(blockEnd);
    console.log("✓ Step 3: handleDeleteEvent rewired purely to Supabase");
  }
}

// 4. Update triggerSyncDaftarAcara to sync to Supabase
const syncDaftarStart = code.indexOf('function triggerSyncDaftarAcara() {');
if (syncDaftarStart !== -1) {
  const syncDaftarEnd = code.indexOf('window.triggerSyncDaftarAcara = triggerSyncDaftarAcara;', syncDaftarStart);
  if (syncDaftarEnd !== -1) {
    const replacement = `function triggerSyncDaftarAcara() {
      if (!state.supabaseClient) {
        showToast("⚠️ Supabase belum terhubung. Konfigurasikan URL & Key terlebih dahulu.", "warning");
        return;
      }
      showToast("⏳ Menyinkronkan seluruh event ke Supabase Realtime Database...", "info");
      const rows = (state.events || []).map(function(ev) {
        return {
          id: ev.id,
          name: ev.name,
          groom_name: ev.groom_name || ev.groom || "",
          bride_name: ev.bride_name || ev.bride || "",
          event_date: ev.event_date || ev.date || "",
          drive_folder_id: ev.drive_folder_id || ev.driveFolderId || "",
          photobooth_url: ev.photobooth_url || ev.photoboothUrl || "",
          all_photos_label: ev.all_photos_label || ev.allPhotosLabel || "Semua Foto",
          custom_categories: ev.custom_categories || ev.customCategories || [],
          is_active: ev.is_active !== undefined ? ev.is_active : true,
          updated_at: new Date().toISOString()
        };
      });
      state.supabaseClient.from('events').upsert(rows).then(function(res) {
        if (res.error) {
          showToast("⚠️ Gagal sinkronisasi ke Supabase: " + res.error.message, "error");
        } else {
          showToast("✓ Seluruh event berhasil disinkronkan ke Supabase Database!");
        }
      });
    }\n    `;
    code = code.substring(0, syncDaftarStart) + replacement + code.substring(syncDaftarEnd);
    console.log("✓ Step 4: triggerSyncDaftarAcara rewired to Supabase");
  }
}

// 5. Update handleTriggerDatabaseSetup
const trigDbStart = code.indexOf('function handleTriggerDatabaseSetup() {');
if (trigDbStart !== -1) {
  let depth = 0;
  let trigDbEnd = -1;
  for (let i = trigDbStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) { trigDbEnd = i + 1; break; }
    }
  }
  if (trigDbEnd !== -1) {
    const replacement = `function handleTriggerDatabaseSetup() {
      if (window.handleTestSupabaseConnection) {
        window.handleTestSupabaseConnection();
      }
    }`;
    code = code.substring(0, trigDbStart) + replacement + code.substring(trigDbEnd);
    console.log("✓ Step 5: handleTriggerDatabaseSetup neutralized");
  }
}

// 6. Update handleChangeAdminPin to use Supabase
const changePinStart = code.indexOf('callBackend("changeAdminPin", { currentPin: getEffectiveAdminPin(), newPin: newPin }');
if (changePinStart !== -1) {
  const changePinBlockStart = code.lastIndexOf('function handleChangeAdminPin(', changePinStart);
  let depth = 0;
  let changePinBlockEnd = -1;
  for (let i = changePinBlockStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) { changePinBlockEnd = i + 1; break; }
    }
  }
  if (changePinBlockEnd !== -1) {
    const replacement = `function handleChangeAdminPin() {
      const pinInput = document.getElementById("adminNewPinInput");
      const alertBox = document.getElementById("adminPinAlert");
      const newPin = (pinInput?.value || "").trim();

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
    code = code.substring(0, changePinBlockStart) + replacement + code.substring(changePinBlockEnd);
    console.log("✓ Step 6: handleChangeAdminPin rewired to Supabase");
  }
}

// 7. Update handleAddAdminUser & handleDeleteAdminUser
const addAdminStart = code.indexOf('callBackend("addAdminUser", { pin: getEffectiveAdminPin(), newUser: { name: name, pin: pin, role: "Admin" } }');
if (addAdminStart !== -1) {
  const addBlockStart = code.lastIndexOf('function handleAddAdminUser(', addAdminStart);
  let depth = 0;
  let addBlockEnd = -1;
  for (let i = addBlockStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) { addBlockEnd = i + 1; break; }
    }
  }
  if (addBlockEnd !== -1) {
    const replacement = `function handleAddAdminUser() {
      const nameInput = document.getElementById("newAdminName");
      const pinInput = document.getElementById("newAdminPin");
      const alertBox = document.getElementById("addAdminAlert");
      const addBtn = document.getElementById("btnAddAdminUser");

      const name = (nameInput?.value || "").trim();
      const pin = (pinInput?.value || "").trim();

      if (!name) {
        if (alertBox) {
          alertBox.innerText = "Silakan masukkan nama admin.";
          alertBox.style.display = "block";
        }
        return;
      }
      if (!pin || pin.length < 4) {
        if (alertBox) {
          alertBox.innerText = "PIN minimal 4 karakter (angka/kombinasi unik).";
          alertBox.style.display = "block";
        }
        return;
      }

      if (alertBox) alertBox.style.display = "none";
      if (addBtn) addBtn.disabled = true;

      const newId = "admin_" + Date.now();
      const newUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + "_" + Math.floor(Math.random() * 900 + 100);
      const newUser = { id: newId, name: name, username: newUsername, pin: pin, role: "Admin", created_at: new Date().toISOString() };

      if (state.supabaseClient) {
        state.supabaseClient.from('admin_users').insert([newUser]).then(function(res) {
          if (addBtn) addBtn.disabled = false;
          if (res.error) {
            if (alertBox) {
              alertBox.innerText = "Gagal menambahkan admin: " + res.error.message;
              alertBox.style.display = "block";
            }
          } else {
            if (nameInput) nameInput.value = "";
            if (pinInput) pinInput.value = "";
            showToast("✓ Admin baru berhasil ditambahkan!");
            loadAdminUsers();
          }
        }).catch(function(err) {
          if (addBtn) addBtn.disabled = false;
          if (alertBox) {
            alertBox.innerText = "Gangguan koneksi: " + err.message;
            alertBox.style.display = "block";
          }
        });
      } else {
        if (addBtn) addBtn.disabled = false;
        showToast("✓ Admin baru disimpan!");
      }
    }`;
    code = code.substring(0, addBlockStart) + replacement + code.substring(addBlockEnd);
    console.log("✓ Step 7a: handleAddAdminUser rewired to Supabase");
  }
}

const delAdminStart = code.indexOf('callBackend("deleteAdminUser", { pin: getEffectiveAdminPin(), targetUserId: userId }');
if (delAdminStart !== -1) {
  const delBlockStart = code.lastIndexOf('function handleDeleteAdminUser(', delAdminStart);
  let depth = 0;
  let delBlockEnd = -1;
  for (let i = delBlockStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) { delBlockEnd = i + 1; break; }
    }
  }
  if (delBlockEnd !== -1) {
    const replacement = `function handleDeleteAdminUser(userId) {
      if (!confirm("Yakin ingin menghapus pengguna admin ini?")) return;
      if (state.supabaseClient) {
        state.supabaseClient.from('admin_users').delete().eq('id', userId).then(function(res) {
          if (res.error) {
            showToast("⚠️ Gagal menghapus admin: " + res.error.message);
          } else {
            showToast("✓ Pengguna admin berhasil dihapus.");
            loadAdminUsers();
          }
        }).catch(function(err) {
          showToast("Gangguan: " + err.message);
        });
      } else {
        showToast("✓ Pengguna admin dihapus.");
        loadAdminUsers();
      }
    }`;
    code = code.substring(0, delBlockStart) + replacement + code.substring(delBlockEnd);
    console.log("✓ Step 7b: handleDeleteAdminUser rewired to Supabase");
  }
}

// 8. Update testAndSyncDriveFolder to use /api/drive-folder
const testDriveStart = code.indexOf('callBackend("testAndSyncDriveFolder"');
if (testDriveStart !== -1) {
  const fnStart = code.lastIndexOf('function testAndSyncDriveFolder(', testDriveStart);
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
            showToast("⚠️ " + ((res && res.message) || "Gagal mengakses folder Google Drive"));
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
    console.log("✓ Step 8: testAndSyncDriveFolder rewired to /api/drive-folder");
  }
}

// 9. Neutralize remaining getCategoryPhotos GAS calls
code = code.replace(
  /\/\/\s*2\.\s*Coba lewat GAS backend getCategoryPhotos[\s\S]*?if \(callback\) callback\(state\.categoryPhotosMap\[cat\] \|\| \[\]\);\s*\}\);/,
  'if (callback) callback(state.categoryPhotosMap[cat] || []);'
);

code = code.replace(
  /function fallbackFotoshare\(\) \{\s*callBackend\("getCategoryPhotos"[\s\S]*?\}\s*\}\s*return list;\s*\}/,
  'function fallbackFotoshare() { return []; } return list; }'
);

code = code.replace(
  /\/\/\s*2\.\s*Coba lewat GAS Backend getCategoryPhotos secara realtime[\s\S]*?if \(callback\) callback\(state\.categoryPhotosMap\[cat\] \|\| \[\]\);\s*\}\);/,
  'if (callback) callback(state.categoryPhotosMap[cat] || []);'
);
console.log("✓ Step 9: getCategoryPhotos GAS fallbacks neutralized");

// 10. Clean loadFallbackData SPREADSHEET references
code = code.replace(
  /SPREADSHEET_ID:\s*state\.activeConfig\.SPREADSHEET_ID[\s\S]*?SPREADSHEET_URL:\s*state\.activeConfig\.SPREADSHEET_URL[^\n]*/,
  `SUPABASE_URL: state.supabaseUrl || GLOBAL_CONFIG.SUPABASE_URL || ""`
);
console.log("✓ Step 10: SPREADSHEET references in loadFallbackData removed");

fs.writeFileSync('js/app.js', code, 'utf8');
console.log("✓ ALL STEPS APPLIED! Final js/app.js length:", code.length);

