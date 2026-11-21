const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

// 1. Replace testAndSyncDriveFolder (lines 1-46)
const oldTestAndSync = `function testAndSyncDriveFolder() {
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

const newTestAndSync = `function testAndSyncDriveFolder() {
      const driveInput = (document.getElementById("cfgDriveFolderId")?.value || document.getElementById("cfgDriveFolder")?.value || (state.activeConfig && state.activeConfig.DRIVE_FOLDER_ID) || "").trim();
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
            state.allPhotos = res.photos || [];
            state.filteredPhotos = res.photos || [];

            // Persist ke Supabase row event aktif
            if (state.supabaseClient && state.currentEventId) {
              const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
              if (curEv) {
                curEv.driveFolderId = driveId;
                curEv.allPhotosLabel = allPhotosLabel;
                saveEventToSupabase(curEv);
              }
            }

            try {
              localStorage.setItem("WEDDING_ALL_PHOTOS_LABEL", allPhotosLabel);
              localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
              localStorage.setItem("WEDDING_EVENT_PHOTOS_" + state.currentEventId, JSON.stringify(res.photos || []));
              localStorage.setItem("WEDDING_EVENT_PHOTOS_COUNT_" + state.currentEventId, String((res.photos || []).length));
              localStorage.setItem("WEDDING_ALL_PHOTOS_COUNT", String((res.photos || []).length));
            } catch(e) {}
            renderCategoryTabs();
            renderPhotoGrid();
            showToast("✓ " + (res.count || 0) + " foto Google Drive berhasil disinkronkan & disimpan ke database!");
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
    }
    window.testAndSyncDriveFolder = testAndSyncDriveFolder;
    window.handleSyncDrivePhotosDirectly = testAndSyncDriveFolder;`;

if (code.includes(oldTestAndSync)) {
  code = code.replace(oldTestAndSync, newTestAndSync);
  console.log("✓ testAndSyncDriveFolder updated");
} else {
  console.warn("⚠️ oldTestAndSync not found exactly, applying fallback search");
}

// 2. Fix syncSingleCategory line 267: allPhotosLabelInput undefined error
const oldSyncSingle = `      // SIMPAN PERMANEN KE SCRIPT PROPERTIES & SHEET AGAR TIDAK TER-RESET
      if (state.supabaseClient) {
        const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
        if (curEv) {
          saveEventToSupabase(curEv);
        }
        state.supabaseClient.from('settings').upsert([
          { key: 'ALL_PHOTOS_LABEL', value: allPhotosLabelInput, updated_at: new Date().toISOString() },
          { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
        ]).then(function() {});
      }`;

const newSyncSingle = `      // SIMPAN PERMANEN KE SUPABASE AGAR TIDAK TER-RESET
      const mainLabelVal = state.allPhotosLabel || "Semua Foto";
      if (state.supabaseClient) {
        const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
        if (curEv) {
          if (isPbCat && targetUrl) curEv.photoboothUrl = targetUrl;
          curEv.customCategories = getCategoriesFromAdminInputs();
          saveEventToSupabase(curEv);
        }
        state.supabaseClient.from('settings').upsert([
          { key: 'ALL_PHOTOS_LABEL', value: mainLabelVal, updated_at: new Date().toISOString() },
          { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
        ], { onConflict: 'key' }).then(function() {});
      }`;

if (code.includes(oldSyncSingle)) {
  code = code.replace(oldSyncSingle, newSyncSingle);
  console.log("✓ syncSingleCategory fixed");
} else {
  console.warn("⚠️ oldSyncSingle not found exactly");
}

// 3. Fix DOMContentLoaded URL detection & isolation (lines 635-655)
const oldDomLoaded = `      let urlEventId = getActiveEventIdFromUrl();
      if (!urlEventId) {
        try {
          const savedLast = localStorage.getItem("WEDDING_LAST_ACTIVE_EVENT");
          if (savedLast) urlEventId = savedLast.trim();
        } catch(e) {}
      }

      if (urlEventId) {
        state.currentEventId = urlEventId;
        showEventNotFoundScreen(false);
        try {
          const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
          const curPath = window.location.pathname || "/";
          const fullTargetUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);
          window.history.replaceState({ eventId: state.currentEventId }, "", fullTargetUrl);
        } catch(e) {}
      } else {
        state.currentEventId = "";
      }`;

const newDomLoaded = `      let urlEventId = getActiveEventIdFromUrl();
      if (!urlEventId) {
        // Isolasi Mutlak: Link polos tanpa parameter ?event= wajib menampilkan Halaman Tidak Ditemukan
        state.currentEventId = "";
        showEventNotFoundScreen(true);
        return;
      }

      state.currentEventId = urlEventId;
      showEventNotFoundScreen(false);`;

if (code.includes(oldDomLoaded)) {
  code = code.replace(oldDomLoaded, newDomLoaded);
  console.log("✓ DOMContentLoaded isolation updated");
} else {
  console.warn("⚠️ oldDomLoaded not found exactly");
}

// 4. Fix fetchEventsFromSupabase auto-activating first event when URL is empty (lines 2697-2708)
const oldAutoActivate = `            // Cari event yang aktif
            let curSlug = state.currentEventId || getActiveEventIdFromUrl();
            if (!curSlug && state.events && state.events.length > 0 && state.events[0].id) {
              // Otomatis aktifkan event pertama dari Supabase jika membuka domain polos
              curSlug = state.events[0].id;
              state.currentEventId = curSlug;
              try {
                localStorage.setItem("WEDDING_LAST_ACTIVE_EVENT", curSlug);
                const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
                const curPath = window.location.pathname || "/";
                const fullTargetUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);
                window.history.replaceState({ eventId: state.currentEventId }, "", fullTargetUrl);
              } catch(e) {}
            }`;

const newAutoActivate = `            // Cari event yang aktif
            let curSlug = state.currentEventId || getActiveEventIdFromUrl();
            if (!curSlug) {
              // Isolasi Mutlak: Link polos tanpa ?event= TIDAK membuka event apapun, tampilkan layar error
              showEventNotFoundScreen(true);
              if (callback) callback(false);
              return;
            }`;

if (code.includes(oldAutoActivate)) {
  code = code.replace(oldAutoActivate, newAutoActivate);
  console.log("✓ fetchEventsFromSupabase auto-activate removed");
} else {
  console.warn("⚠️ oldAutoActivate not found exactly");
}

// 5. Fix admin login NetworkError handling with auto fallback to /api/supabase-proxy
const oldLoginVerify = `      initSupabaseClient();
      if (state.supabaseClient) {
        state.supabaseClient
          .from('admin_users')
          .select('*')
          .ilike('username', username)
          .then(function(res) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            if (res.error) {
              if (alertBox) {
                let msg = res.error.message || "";
                if (msg.includes("NetworkError") || msg.includes("Failed to fetch") || msg.includes("fetch")) {
                  msg = "Koneksi ke Supabase gagal (NetworkError). Periksa apakah Project URL & Anon Key Supabase sudah benar dan project Supabase aktif.";
                }
                alertBox.innerText = "Gagal memverifikasi ke Supabase: " + msg;
                alertBox.style.display = "block";
              }
              return;
            }
            const rows = res.data || [];
            if (rows.length > 0) {
              const u = rows[0];
              if (String(u.pin).trim() === String(password).trim()) {
                onLoginSuccess(u);
              } else {
                if (alertBox) {
                  alertBox.innerText = "Password tidak sesuai. Silakan coba kembali.";
                  alertBox.style.display = "block";
                }
              }
            } else {
              if (alertBox) {
                alertBox.innerText = "Username '" + username + "' tidak terdaftar di database Supabase.";
                alertBox.style.display = "block";
              }
            }
          })
          .catch(function(err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            if (alertBox) {
              let msg = (err && err.message) || String(err);
              if (msg.includes("NetworkError") || msg.includes("Failed to fetch") || msg.includes("fetch")) {
                msg = "Koneksi ke Supabase gagal (NetworkError). Periksa apakah Project URL & Anon Key Supabase sudah benar dan project Supabase aktif.";
              }
              alertBox.innerText = "Koneksi Supabase gagal: " + msg;
              alertBox.style.display = "block";
            }
          });`;

const newLoginVerify = `      function tryProxyFallback() {
        fetch("/api/supabase-proxy?path=rest/v1/admin_users&select=*&username=ilike." + encodeURIComponent(username))
          .then(function(r) { return r.json(); })
          .then(function(data) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            const rows = Array.isArray(data) ? data : [];
            if (rows.length > 0) {
              const u = rows[0];
              if (String(u.pin).trim() === String(password).trim()) {
                onLoginSuccess(u);
              } else {
                if (alertBox) {
                  alertBox.innerText = "Password tidak sesuai. Silakan coba kembali.";
                  alertBox.style.display = "block";
                }
              }
            } else {
              if (alertBox) {
                alertBox.innerText = "Username '" + username + "' tidak terdaftar di database Supabase.";
                alertBox.style.display = "block";
              }
            }
          })
          .catch(function(err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            if (alertBox) {
              alertBox.innerText = "Gagal memverifikasi ke Supabase: " + ((err && err.message) || String(err));
              alertBox.style.display = "block";
            }
          });
      }

      initSupabaseClient();
      if (state.supabaseClient) {
        state.supabaseClient
          .from('admin_users')
          .select('*')
          .ilike('username', username)
          .then(function(res) {
            if (res.error) {
              let msg = res.error.message || "";
              if (msg.includes("NetworkError") || msg.includes("Failed to fetch") || msg.includes("fetch")) {
                // Seamless Fallback ke Serverless Proxy jika browser terkena NetworkError
                tryProxyFallback();
                return;
              }
              submitBtn.disabled = false;
              submitBtn.innerHTML = \`<span>Masuk</span>\`;
              if (alertBox) {
                alertBox.innerText = "Gagal memverifikasi ke Supabase: " + msg;
                alertBox.style.display = "block";
              }
              return;
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            const rows = res.data || [];
            if (rows.length > 0) {
              const u = rows[0];
              if (String(u.pin).trim() === String(password).trim()) {
                onLoginSuccess(u);
              } else {
                if (alertBox) {
                  alertBox.innerText = "Password tidak sesuai. Silakan coba kembali.";
                  alertBox.style.display = "block";
                }
              }
            } else {
              if (alertBox) {
                alertBox.innerText = "Username '" + username + "' tidak terdaftar di database Supabase.";
                alertBox.style.display = "block";
              }
            }
          })
          .catch(function(err) {
            // Seamless Fallback ke Serverless Proxy jika browser memblokir Supabase domain
            tryProxyFallback();
          });`;

if (code.includes(oldLoginVerify)) {
  code = code.replace(oldLoginVerify, newLoginVerify);
  console.log("✓ admin login NetworkError fallback updated");
} else {
  console.warn("⚠️ oldLoginVerify not found exactly");
}

// 6. Fix line 2980: remove updated_at from admin_users update
const oldPinUpdate = `state.supabaseClient.from('admin_users').update({ pin: newPin, updated_at: new Date().toISOString() }).eq('username', username).then(function() {});`;
const newPinUpdate = `state.supabaseClient.from('admin_users').update({ pin: newPin }).eq('username', username).then(function() {});`;
if (code.includes(oldPinUpdate)) {
  code = code.replace(oldPinUpdate, newPinUpdate);
  console.log("✓ line 2980 updated_at removed");
}

// 7. Fix triggerSyncDaftarAcara schema mapping (line 4252)
const oldTriggerSync = `      const rows = (state.events || []).map(function(ev) {
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
      });`;

const newTriggerSync = `      const rows = (state.events || []).map(function(ev) {
        return {
          id: ev.id,
          name: ev.name,
          date: ev.date || (state.activeConfig && state.activeConfig.EVENT_DATE) || "17 Agustus 2026",
          venue: ev.venue || (state.activeConfig && state.activeConfig.EVENT_VENUE) || "",
          home_url: ev.homeUrl || ev.home_url || ((window.location.origin || "") + (window.location.pathname || "/") + "?event=" + encodeURIComponent(ev.id)),
          drive_folder_id: ev.drive_folder_id || ev.driveFolderId || "",
          photobooth_url: ev.photobooth_url || ev.photoboothUrl || "",
          all_photos_label: ev.all_photos_label || ev.allPhotosLabel || "Semua Foto",
          frame_image_url: ev.frame_image_url || ev.frameImageUrl || "",
          logo_url: ev.logo_url || ev.logoUrl || "",
          custom_categories: ev.custom_categories || ev.customCategories || [],
          status: ev.status || "Aktif",
          updated_at: new Date().toISOString()
        };
      });`;

if (code.includes(oldTriggerSync)) {
  code = code.replace(oldTriggerSync, newTriggerSync);
  console.log("✓ triggerSyncDaftarAcara schema updated");
}

// 8. Fix handleSyncDrivePhotosDirectly (around line 4865)
const oldDirectSync = `    function handleSyncDrivePhotosDirectly() {
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

const newDirectSync = `    function handleSyncDrivePhotosDirectly() {
      testAndSyncDriveFolder();
    }`;

if (code.includes(oldDirectSync)) {
  code = code.replace(oldDirectSync, newDirectSync);
  console.log("✓ handleSyncDrivePhotosDirectly routed to testAndSyncDriveFolder");
}

// 9. Attach all button functions to window object at end of file
const windowExports = `
// =============================================================================
// GLOBAL EXPORTS: Pastikan seluruh fungsi tombol Admin & Gallery terikat ke window
// =============================================================================
window.handleSaveAllSettings = handleSaveAllSettings;
window.testAndSyncDriveFolder = testAndSyncDriveFolder;
window.handleSyncDrivePhotosDirectly = testAndSyncDriveFolder;
window.syncSingleCategory = syncSingleCategory;
window.syncCategoriesAndDisplayLinks = syncCategoriesAndDisplayLinks;
window.handleTestGallery = handleTestGallery;
window.handleChangeAdminPassword = handleChangeAdminPassword;
window.handleAddAdminUser = handleAddAdminUser;
window.handleDeleteAdminUser = handleDeleteAdminUser;
window.handleDeleteCurrentEvent = handleDeleteCurrentEvent;
window.confirmAddNewEvent = confirmAddNewEvent;
window.openActiveEventHome = openActiveEventHome;
window.copyActiveEventUrl = copyActiveEventUrl;
window.openNewEventModal = openNewEventModal;
window.closeNewEventModal = closeNewEventModal;
window.handleAdminLogout = handleAdminLogout;
window.openAdminSettingsModal = openAdminSettingsModal;
window.closeAdminSettingsModal = closeAdminSettingsModal;
window.openAdminLoginModal = openAdminLoginModal;
window.closeAdminLoginModal = closeAdminLoginModal;
window.switchAdminTab = switchAdminTab;
`;

if (!code.includes("window.handleSaveAllSettings = handleSaveAllSettings;")) {
  code += "\n" + windowExports;
  console.log("✓ Global window exports attached");
}

fs.writeFileSync('js/app.js', code, 'utf8');
console.log("=== Selesai memodifikasi js/app.js ===");
