const fs = require('fs');
const appJsPath = 'js/app.js';
let code = fs.readFileSync(appJsPath, 'utf8');

console.log("Reading js/app.js... length:", code.length);

// 1. Matikan pembacaan WEDDING_GAS_API_URL di DOMContentLoaded
const oldGasLoad = `      // 1. Muat URL API backend yang tersimpan
      const savedApiUrl = localStorage.getItem("WEDDING_GAS_API_URL") || GLOBAL_CONFIG.GAS_API_URL;
      if (savedApiUrl) {
        state.gasApiUrl = savedApiUrl;
        const apiUrlInput = document.getElementById("cfgGasApiUrl");
        if (apiUrlInput) apiUrlInput.value = savedApiUrl;
      }`;

const newGasLoad = `      // 1. Pemisahan Total: Putus seluruh link Google Apps Script / Google Sheets
      try { localStorage.removeItem("WEDDING_GAS_API_URL"); } catch(e) {}
      state.gasApiUrl = "";`;

if (code.includes(oldGasLoad)) {
  code = code.replace(oldGasLoad, newGasLoad);
  console.log("✓ WEDDING_GAS_API_URL purged from localStorage loader");
}

// 2. Netralkan callBackend agar TIDAK PERNAH mengirim request ke Google Apps Script
const oldCallBackendStart = `    function callBackend(action, payload, onSuccess, onError) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {`;

const oldCallBackendEnd = `      fetch(requestUrl, fetchOpts)
      .then(function(res) {
        if (backendTimeoutId) clearTimeout(backendTimeoutId);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(function(data) {
        if (onSuccess) onSuccess(data);
      })
      .catch(function(err) {
        if (backendTimeoutId) clearTimeout(backendTimeoutId);
        console.error("Backend API Error:", err);
        if (onError) onError(err);
      });
    }`;

const callBackendFullSearch = code.indexOf('function callBackend(action, payload, onSuccess, onError) {');
const callBackendFullEnd = code.indexOf('    function startLiveAutoRefresh() {');

if (callBackendFullSearch !== -1 && callBackendFullEnd !== -1 && callBackendFullSearch < callBackendFullEnd) {
  const newCallBackend = `    function callBackend(action, payload, onSuccess, onError) {
      console.warn("⚠️ [TERISOLASI] Panggilan ke Google Apps Script (callBackend:" + action + ") dinonaktifkan permanen untuk mencegah perubahan pada website lain.");
      if (onError) onError(new Error("Google Apps Script telah diputus total. Sistem murni menggunakan Supabase."));
    }

`;
  code = code.substring(0, callBackendFullSearch) + newCallBackend + code.substring(callBackendFullEnd);
  console.log("✓ callBackend completely neutralized (no network calls to GAS)");
}

// 3. Putus callBackend di handleAllPhotosLabelChange
const oldAllPhotosLabelGas = `      if (state.gasApiUrl) {
        const pbCat = Array.isArray(state.customCategories) ? state.customCategories.find(function(c) {
          return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
        }) : null;
        const currentPbUrl = (pbCat && pbCat.url) ? String(pbCat.url).trim() : (targetUrl || state.activeConfig.PHOTOBOOTH_URL || "");
        callBackend("saveAdminSettings", {
          pin: getEffectiveAdminPin(),
          config: {
            CUSTOM_CATEGORIES: state.customCategories,
            PHOTOBOOTH_URL: currentPbUrl,
            DRIVE_FOLDER_ID: state.activeConfig.DRIVE_FOLDER_ID || "",
            ALL_PHOTOS_LABEL: state.allPhotosLabel || "Semua Foto",
            EVENTS: JSON.stringify(state.events),
            ACTIVE_EVENT_ID: state.currentEventId
          }
        });
      }`;

if (code.includes(oldAllPhotosLabelGas)) {
  code = code.replace(oldAllPhotosLabelGas, '// Google Apps Script callBackend("saveAdminSettings") dihilangkan');
  console.log("✓ handleAllPhotosLabelChange cleaned of GAS call");
}

// 4. Putus callBackend di renderAdminCategoriesManager
const oldCatManagerGas = `      if (state.gasApiUrl) {
          const pbCat = Array.isArray(customCategoriesList) ? customCategoriesList.find(function(c) {
            return c && (c.isPhotobooth || c.id === "special_photobooth" || String(c.name || "").toLowerCase().includes("photobooth"));
          }) : null;
          callBackend("saveAdminSettings", {
            pin: getEffectiveAdminPin(),
            config: {
              CUSTOM_CATEGORIES: JSON.stringify(customCategoriesList),
              PHOTOBOOTH_URL: (pbCat && pbCat.url) ? String(pbCat.url).trim() : (state.activeConfig.PHOTOBOOTH_URL || ""),
              DRIVE_FOLDER_ID: driveFolderVal,
              ALL_PHOTOS_LABEL: allPhotosLabelVal,
              EVENTS: JSON.stringify(state.events),
              ACTIVE_EVENT_ID: state.currentEventId
            }
          }, function(res) {
          if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = \`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>\`;
          }
          showToast("✓ Kategori momen dan tautan display berhasil disinkronkan ke Google Sheet!");
        }, function(err) {
          if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = \`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>\`;
          }
          showToast("✓ Kategori momen dan tautan display tersimpan di browser!");
        });
      } else {`;

const newCatManagerGas = `      if (state.supabaseClient) {
        const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
        if (curEv) {
          saveEventToSupabase(curEv, function() {
            if (syncBtn) {
              syncBtn.disabled = false;
              syncBtn.innerHTML = \`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>\`;
            }
            showToast("✓ Kategori momen berhasil disimpan ke Supabase Realtime Database!");
          });
        }
      } else {`;

if (code.includes(oldCatManagerGas)) {
  code = code.replace(oldCatManagerGas, newCatManagerGas);
  console.log("✓ renderAdminCategoriesManager routed to Supabase");
}

// 5. Update handleAdminLogin agar autentikasi murni ke Supabase admin_users
const oldAdminLoginBlock = `      callBackend("adminLogin", { username: username, password: password, pin: password }, function(res) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = \`<span>Masuk</span>\`;
        if (res && res.success) {
          onLoginSuccess(res.user);
        } else {
          if (alertBox) {
            alertBox.innerText = (res && res.message) ? res.message : "Username atau Password tidak sesuai. Silakan coba kembali.";
            alertBox.style.display = "block";
          }
        }
      }, function(err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = \`<span>Masuk</span>\`;
        if (alertBox) {
          alertBox.innerText = (err && err.message) ? err.message : "Gagal terhubung ke database. Periksa koneksi internet Anda.";
          alertBox.style.display = "block";
        }
      });`;

const newAdminLoginBlock = `      initSupabaseClient();
      if (state.supabaseClient) {
        state.supabaseClient
          .from('admin_users')
          .select('*')
          .eq('username', username)
          .then(function(res) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            if (res.error) {
              if (alertBox) {
                alertBox.innerText = "Gagal memverifikasi ke Supabase: " + res.error.message;
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
              // Jika belum ada user di tabel, periksa master admin default
              if (username === "admin" && (password === "123" || password === "111111")) {
                onLoginSuccess({ username: "admin", name: "Super Admin", role: "Super Admin" });
              } else {
                if (alertBox) {
                  alertBox.innerText = "Username '" + username + "' tidak ditemukan di Supabase.";
                  alertBox.style.display = "block";
                }
              }
            }
          })
          .catch(function(err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            if (alertBox) {
              alertBox.innerText = "Koneksi Supabase gagal: " + (err.message || err);
              alertBox.style.display = "block";
            }
          });
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = \`<span>Masuk</span>\`;
        if (username === "admin" && (password === "123" || password === "111111")) {
          onLoginSuccess({ username: "admin", name: "Super Admin", role: "Super Admin" });
        } else {
          if (alertBox) {
            alertBox.innerText = "Klien Supabase belum terhubung. Periksa pengaturan di config.json.";
            alertBox.style.display = "block";
          }
        }
      }`;

if (code.includes(oldAdminLoginBlock)) {
  code = code.replace(oldAdminLoginBlock, newAdminLoginBlock);
  console.log("✓ handleAdminLogin routed to Supabase admin_users table");
}

// 6. Update loadAdminUsers & handleAddAdminUser & handleDeleteAdminUser ke Supabase
const oldLoadAdminUsers1 = `    function loadAdminUsers() {
      const container = document.getElementById("adminUsersList");
      if (!container) return;
      container.innerHTML = \`<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 6px;">Memuat data pengguna...</div>\`;

      callBackend("getAdminUsers", { pin: getEffectiveAdminPin() }, function(res) {
        if (res && res.success && Array.isArray(res.users)) {
          state.adminUsers = res.users;
          renderAdminUsersList(res.users);
        } else {
          renderAdminUsersList(state.adminUsers || []);
        }
      }, function() {
        renderAdminUsersList(state.adminUsers || []);
      });
    }`;

const newLoadAdminUsers1 = `    function loadAdminUsers() {
      const container = document.getElementById("adminUsersList");
      if (!container) return;
      if (state.supabaseClient) {
        state.supabaseClient.from('admin_users').select('*').then(function(res) {
          if (res.data && Array.isArray(res.data)) {
            state.adminUsers = res.data;
            renderAdminUsersList(res.data);
          } else {
            renderAdminUsersList(state.adminUsers || []);
          }
        }).catch(function() {
          renderAdminUsersList(state.adminUsers || []);
        });
      } else {
        renderAdminUsersList(state.adminUsers || []);
      }
    }`;

if (code.includes(oldLoadAdminUsers1)) {
  code = code.replace(oldLoadAdminUsers1, newLoadAdminUsers1);
  console.log("✓ loadAdminUsers (set 1) routed to Supabase");
}

const oldLoadAdminUsers2 = `    function loadAdminUsers() {
      callBackend("getAdminUsers", { pin: getEffectiveAdminPin() }, function(res) {
        if (res && res.success && Array.isArray(res.users)) {
          state.adminAccounts = res.users;
          renderAdminUsersList(res.users);
        } else {
          renderAdminUsersList(state.adminAccounts || []);
        }
      }, function() {
        renderAdminUsersList(state.adminAccounts || []);
      });
    }`;

const newLoadAdminUsers2 = `    function loadAdminUsers() {
      if (state.supabaseClient) {
        state.supabaseClient.from('admin_users').select('*').then(function(res) {
          if (res.data && Array.isArray(res.data)) {
            state.adminAccounts = res.data;
            renderAdminUsersList(res.data);
          } else {
            renderAdminUsersList(state.adminAccounts || []);
          }
        }).catch(function() {
          renderAdminUsersList(state.adminAccounts || []);
        });
      } else {
        renderAdminUsersList(state.adminAccounts || []);
      }
    }`;

if (code.includes(oldLoadAdminUsers2)) {
  code = code.replace(oldLoadAdminUsers2, newLoadAdminUsers2);
  console.log("✓ loadAdminUsers (set 2) routed to Supabase");
}

// 7. Update handleAddAdminUser & handleDeleteAdminUser ke Supabase
code = code.replace(
  'callBackend("addAdminUser", { pin: getEffectiveAdminPin(), newUser: newUser });',
  `if (state.supabaseClient) {
        state.supabaseClient.from('admin_users').insert([{
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          pin: newUser.pin || newUser.password,
          role: newUser.role || "Admin"
        }]).then(function() {});
      }`
);

code = code.replace(
  'callBackend("changeAdminPin", { currentPin: getEffectiveAdminPin(), newPin: newPass });',
  `if (state.supabaseClient) {
        const username = (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin";
        state.supabaseClient.from('admin_users').update({ pin: newPass }).eq('username', username).then(function() {});
      }`
);

// 8. Putus fallback callBackend di fetchGalleryData
const oldGalleryFallback = `          .catch(function() {
            if (dfTimeoutId) clearTimeout(dfTimeoutId);
            // Fallback ke backend GAS jika /api/drive-folder belum tersedia atau kosong
            callBackend("getGalleryData", { eventId: state.currentEventId, folderId: activeFolder }, function(response) {
              clearWatchdog();
              state.isAutoRefreshing = false;
              if (refreshIcon) refreshIcon.classList.remove("spin");
              handleGalleryResponse(response, isSilent);
              if (forceRefresh) showToast("Galeri foto berhasil diperbarui!");
            }, function(err) {
              clearWatchdog();
              state.isAutoRefreshing = false;
              if (refreshIcon) refreshIcon.classList.remove("spin");
              console.error("Gagal memuat galeri:", err);
              if (!isSilent) loadFallbackData("Gagal memuat data dari backend: " + err.message);
            });
          });
      } else {
        callBackend("getGalleryData", { eventId: state.currentEventId }, function(response) {
          clearWatchdog();
          state.isAutoRefreshing = false;
          if (refreshIcon) refreshIcon.classList.remove("spin");
          handleGalleryResponse(response, isSilent);
          if (forceRefresh) showToast("Galeri foto berhasil diperbarui!");
        }, function(err) {
          clearWatchdog();
          state.isAutoRefreshing = false;
          if (refreshIcon) refreshIcon.classList.remove("spin");
          console.error("Gagal memuat galeri:", err);
          if (!isSilent) loadFallbackData("Gagal memuat data dari backend: " + err.message);
        });
      }`;

const newGalleryFallback = `          .catch(function(err) {
            if (dfTimeoutId) clearTimeout(dfTimeoutId);
            clearWatchdog();
            state.isAutoRefreshing = false;
            if (refreshIcon) refreshIcon.classList.remove("spin");
            // Foto murni dibaca dari /api/drive-folder (tanpa fallback ke GAS website lain)
            state.allPhotos = [];
            state.filteredPhotos = [];
            renderPhotoGrid();
          });
      } else {
        clearWatchdog();
        state.isAutoRefreshing = false;
        if (refreshIcon) refreshIcon.classList.remove("spin");
        state.allPhotos = [];
        state.filteredPhotos = [];
        renderPhotoGrid();
      }`;

if (code.includes(oldGalleryFallback)) {
  code = code.replace(oldGalleryFallback, newGalleryFallback);
  console.log("✓ fetchGalleryData cleaned of GAS fallback");
}

// 9. Putus fallback callBackend di testAndSyncDriveFolder
const oldSyncDriveCall = `      callBackend("testAndSyncDriveFolder", {
        pin: getEffectiveAdminPin(),
        folderId: driveInput,
        allPhotosLabel: allPhotosLabel
      }, function(res) {
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
          showToast("✓ " + (res.message || "Foto Google Drive berhasil disinkronkan ke galeri!"));
          if (res.galleryData) {
            handleGalleryResponse(res.galleryData, false);
          } else {
            fetchGalleryData(true);
          }
        } else {
          showToast("⚠️ " + (res && res.message ? res.message : "Gagal menyinkronkan folder Google Drive"));
        }
      }, function(err) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = "🔄 Sinkron Google Drive";
        if (btnIcon) btnIcon.classList.remove("spin");
        showToast("⚠️ Gangguan koneksi ke Apps Script: " + err.message);
      });`;

const newSyncDriveCall = `      fetch("/api/drive-folder?folderId=" + encodeURIComponent(driveInput) + "&category=" + encodeURIComponent(allPhotosLabel))
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
        });`;

if (code.includes(oldSyncDriveCall)) {
  code = code.replace(oldSyncDriveCall, newSyncDriveCall);
  console.log("✓ testAndSyncDriveFolder routed to /api/drive-folder (Vercel)");
}

// 10. Bersihkan fallback callBackend di 4 fungsi getCategoryPhotos
code = code.replace(
  /\/\/ 2\. Coba lewat GAS Backend[\s\S]*?callBackend\("getCategoryPhotos"[\s\S]*?if \(callback\) callback\(state\.categoryPhotosMap\[cat\] \|\| \[\]\);\s*\}\);/,
  'if (callback) callback(state.categoryPhotosMap[cat] || []);'
);

fs.writeFileSync(appJsPath, code, 'utf8');
console.log("✓ Successfully saved updated js/app.js. New length:", code.length);

