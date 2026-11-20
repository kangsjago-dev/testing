const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../js/app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

console.log("Reading js/app.js... current length:", code.length);

// 1. Update GLOBAL_CONFIG: hilangkan GAS_API_URL, SPREADSHEET_ID, SPREADSHEET_URL
code = code.replace(
  'GAS_API_URL: "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec",',
  '// Google Apps Script dihilangkan (Supabase menjadi Single Source of Truth)'
);
code = code.replace(
  'SUPABASE_URL: "",',
  'SUPABASE_URL: "https://faszgrkwdlqxbppownh.supabase.co",'
);
code = code.replace(
  'SPREADSHEET_ID: "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20",\n      SPREADSHEET_URL: "https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit",',
  '// Google Sheets dihilangkan (Supabase menjadi Single Source of Truth)'
);
console.log("✓ GLOBAL_CONFIG cleaned of duplicate database properties");

// 2. Pembersihan startup sequence di DOMContentLoaded
const oldStartup = `        .finally(function() {
          // 4. Dual-Engine: Cek apakah Supabase Engine dikonfigurasi & aktif
          initSupabaseClient();
          if (state.supabaseClient) {
            fetchEventsFromSupabase(function(success) {
              if (success) {
                fetchGalleryData(false, false);
                startBadgeExpiryChecker();
                return;
              }
              // Jika Supabase kosong / belum disinkronkan, fallback ke Google Sheets
              syncFromSpreadsheetGViz(function() {
                fetchGalleryData(false, false);
                startLiveAutoRefresh();
                startBadgeExpiryChecker();
              });
            });
          } else {
            // Fallback: Baca Google Spreadsheet publik via GViz
            syncFromSpreadsheetGViz(function() {
              fetchGalleryData(false, false);
              startLiveAutoRefresh();
              startBadgeExpiryChecker();
            });
          }
        });`;

const newStartup = `        .finally(function() {
          // 4. Single Source of Truth: Inisialisasi Supabase Engine Murni
          initSupabaseClient();
          if (state.supabaseClient) {
            fetchEventsFromSupabase(function() {
              fetchGalleryData(false, false);
              startLiveAutoRefresh();
              startBadgeExpiryChecker();
            });
          } else {
            fetchGalleryData(false, false);
            startLiveAutoRefresh();
            startBadgeExpiryChecker();
          }
        });`;

if (code.includes(oldStartup)) {
  code = code.replace(oldStartup, newStartup);
  console.log("✓ DOMContentLoaded startup sequence updated to Pure Supabase");
}

// 3. Matikan GViz fetch di syncFromSpreadsheetGViz
const gvizSearch = `    function syncFromSpreadsheetGViz(callback) {
      const sid = state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
      if (!sid) { if (callback) callback(); return; }
      fetch("https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + Date.now())`;

if (code.includes(gvizSearch)) {
  const gvizReplacement = `    function syncFromSpreadsheetGViz(callback) {
      // Single Source of Truth: Supabase menggantikan polling Google Sheets GViz
      if (state.supabaseClient) {
        fetchEventsFromSupabase(function() {
          if (callback) callback();
        });
        return;
      }
      if (callback) callback();
      return;
      const sid = "";`;
  code = code.replace(gvizSearch, gvizReplacement);
  console.log("✓ syncFromSpreadsheetGViz retired (routed to Supabase)");
}

// 4. Update startLiveAutoRefresh: jangan poll spreadsheet GViz
const oldAutoRefresh = `    function startLiveAutoRefresh() {
      if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = setInterval(function() {
        syncFromSpreadsheetGViz(function() {
          if (!state.isAutoRefreshing) {
            fetchGalleryData(false, true);
          }
        });
      }, state.autoRefreshIntervalMs);
    }`;

const newAutoRefresh = `    function startLiveAutoRefresh() {
      if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = setInterval(function() {
        if (!state.isAutoRefreshing) {
          fetchGalleryData(false, true);
        }
      }, state.autoRefreshIntervalMs);
    }`;

if (code.includes(oldAutoRefresh)) {
  code = code.replace(oldAutoRefresh, newAutoRefresh);
  console.log("✓ startLiveAutoRefresh updated to avoid duplicate GViz polling");
}

// 5. Update confirmAddNewEvent: simpan murni ke Supabase tanpa panggil GAS
const oldConfirmAddTail = `      // Otomatis sinkronkan event baru ke database Google Sheets (sheet Daftar_Acara & Pengaturan)
      if (state.gasApiUrl) {
        callBackend("saveAdminSettings", {
          pin: getEffectiveAdminPin(),
          config: {
            EVENTS: JSON.stringify(state.events),
            event: newEventObj,
            ACTIVE_EVENT_ID: newId,
            EVENT_NAME: name,
            COUPLE_NAME: name,
            EVENT_DATE: formattedDate,
            EVENT_VENUE: venue || "",
            DRIVE_FOLDER_ID: driveFolder,
            PHOTOBOOTH_URL: pbUrl,
            CUSTOM_CATEGORIES: JSON.stringify(initialCats)
          }
        }, function() {
          showToast("✓ Event baru '" + name + "' berhasil dibuat dan disimpan ke database!");
        }, function(err) {
          showToast("✓ Event baru '" + name + "' aktif di browser.");
        });

        // Trigger eksplisit penambahan baris langsung ke sheet 'Daftar_Acara'
        callBackend("addEvent", {
          pin: getEffectiveAdminPin(),
          event: newEventObj
        });
      } else {
        showToast("✓ Event baru '" + name + "' berhasil dibuat!");
      }`;

const newConfirmAddTail = `      // Simpan murni ke Supabase Realtime Database (Single Source of Truth)
      if (state.supabaseClient) {
        saveEventToSupabase(newEventObj, function() {
          showToast("✓ Event baru '" + name + "' berhasil dibuat & tersimpan di Supabase Realtime Database!");
        }, function(err) {
          showToast("⚠️ Event tersimpan di browser: " + (err.message || err));
        });
      } else {
        showToast("✓ Event baru '" + name + "' berhasil dibuat!");
      }`;

if (code.includes(oldConfirmAddTail)) {
  code = code.replace(oldConfirmAddTail, newConfirmAddTail);
  console.log("✓ confirmAddNewEvent cleaned of duplicate GAS syncing");
}

// 6. Update handleDeleteCurrentEvent: hapus murni dari Supabase
const oldDeleteTail = `      // 1. Coba panggil action deleteEvent ke backend
      callBackend("deleteEvent", { pin: pin, targetEventId: deleteId }, function(res) {
        if (res && res.success) {
          finalizeEventDeletion(res.events, res.activeEventId);
        } else if (res && res.message && res.message.includes("Aksi tidak dikenali")) {
          // Fallback ke saveAdminSettings jika GAS deployment sedang versi lama
          callBackend("saveAdminSettings", {
            pin: pin,
            config: {
              ACTIVE_EVENT_ID: nextId,
              EVENTS: JSON.stringify(updatedEvents)
            }
          }, function(saveRes) {
            if (saveRes && saveRes.success) {
              finalizeEventDeletion(updatedEvents, nextId);
            } else {
              if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
              }
              showToast("⚠️ Gagal menghapus event: " + ((saveRes && saveRes.message) || "Terjadi kesalahan."), "error");
            }
          }, function(err) {
            if (deleteBtn) {
              deleteBtn.disabled = false;
              deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
            }
            showToast("⚠️ Gagal menghapus event: " + (err.message || err), "error");
          });
        } else {
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
          }
          showToast("⚠️ Gagal menghapus event: " + ((res && res.message) || "Terjadi kesalahan."), "error");
        }
      }, function(err) {
        // Fallback jika callBackend error: coba via saveAdminSettings
        callBackend("saveAdminSettings", {
          pin: pin,
          config: {
            ACTIVE_EVENT_ID: nextId,
            EVENTS: JSON.stringify(updatedEvents)
          }
        }, function(saveRes) {
          if (saveRes && saveRes.success) {
            finalizeEventDeletion(updatedEvents, nextId);
          } else {
            if (deleteBtn) {
              deleteBtn.disabled = false;
              deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
            }
            showToast("⚠️ Gagal menghapus event dari server: " + (err.message || err), "error");
          }
        }, function() {
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
          }
          showToast("⚠️ Gagal menghapus event: " + (err.message || err), "error");
        });
      });`;

const newDeleteTail = `      // Hapus murni dari Supabase Realtime Database (Single Source of Truth)
      if (state.supabaseClient) {
        deleteEventFromSupabase(deleteId, function() {
          finalizeEventDeletion(updatedEvents, nextId);
        }, function(err) {
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
          }
          showToast("⚠️ Gagal menghapus dari Supabase: " + (err.message || err), "error");
        });
      } else {
        finalizeEventDeletion(updatedEvents, nextId);
      }`;

if (code.includes(oldDeleteTail)) {
  code = code.replace(oldDeleteTail, newDeleteTail);
  console.log("✓ handleDeleteCurrentEvent cleaned of duplicate GAS deletion");
}

// 7. Update handleSaveAllSettings: simpan murni ke Supabase
const oldSaveTail = `      if (state.supabaseClient) {
        const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
        if (curEv) {
          saveEventToSupabase(curEv);
        }
        state.supabaseClient.from('settings').upsert([
          { key: 'ALL_PHOTOS_LABEL', value: allPhotosLabelInput, updated_at: new Date().toISOString() },
          { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
        ]).then(function() {});
      }

      if (state.gasApiUrl) {
        // Kirim langsung ke Google Apps Script (yang otomatis menyimpan ke Properties & Spreadsheet 'foto-panggung')
        callBackend("saveAdminSettings", { pin: getEffectiveAdminPin(), config: payload }, function(res) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
          if (payload.NEW_PIN) {
            state.adminPin = payload.NEW_PIN;
            try {
              sessionStorage.setItem("WEDDING_ADMIN_PIN", payload.NEW_PIN);
              localStorage.setItem("WEDDING_ADMIN_PIN", payload.NEW_PIN);
            } catch(e) {}
            const newPinEl = document.getElementById("cfgNewPin");
            if (newPinEl) newPinEl.value = "";
          }
          if (res && res.galleryData && res.galleryData.config) {
            res.galleryData.config = Object.assign({}, res.galleryData.config, payload);
            handleGalleryResponse(res.galleryData, false);
          }
          if (res && !res.success) {
            showToast("⚠️ " + (res.message || "Gagal menyimpan ke Google Spreadsheet. Pengaturan disimpan di browser."));
          } else {
            showToast("✓ Pengaturan & Kustomisasi Acara berhasil disimpan!");
          }
          closeAdminSettingsModal();
        }, function(err) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
          showToast("✓ Pengaturan berhasil disimpan di browser!");
          closeAdminSettingsModal();
        });
      } else {
        // Jika URL Apps Script belum diisi
        saveBtn.disabled = false;
        saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
        showToast("✓ Pengaturan berhasil disimpan di browser!");
        closeAdminSettingsModal();
      }`;

const newSaveTail = `      // Simpan murni ke Supabase Realtime Database (Single Source of Truth)
      if (state.supabaseClient) {
        const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
        if (curEv) {
          saveEventToSupabase(curEv);
        }
        state.supabaseClient.from('settings').upsert([
          { key: 'ALL_PHOTOS_LABEL', value: allPhotosLabelInput, updated_at: new Date().toISOString() },
          { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
        ]).then(function() {});

        saveBtn.disabled = false;
        saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
        if (payload.NEW_PIN) {
          state.adminPin = payload.NEW_PIN;
          try {
            sessionStorage.setItem("WEDDING_ADMIN_PIN", payload.NEW_PIN);
            localStorage.setItem("WEDDING_ADMIN_PIN", payload.NEW_PIN);
          } catch(e) {}
          const newPinEl = document.getElementById("cfgNewPin");
          if (newPinEl) newPinEl.value = "";
        }
        showToast("✓ Pengaturan berhasil disimpan langsung ke Supabase Realtime Database!");
        closeAdminSettingsModal();
      } else {
        saveBtn.disabled = false;
        saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
        showToast("✓ Pengaturan tersimpan di browser!");
        closeAdminSettingsModal();
      }`;

if (code.includes(oldSaveTail)) {
  code = code.replace(oldSaveTail, newSaveTail);
  console.log("✓ handleSaveAllSettings updated to Pure Supabase");
}

// 8. Tambahkan fungsi handleRefreshFromSupabase
if (!code.includes('function handleRefreshFromSupabase()')) {
  const refreshFuncCode = `    function handleRefreshFromSupabase() {
      const statusText = document.getElementById("supabaseSyncStatusText");
      if (statusText) {
        statusText.style.display = "block";
        statusText.style.color = "#0284C7";
        statusText.textContent = "⏳ Memuat ulang data dari Supabase...";
      }
      initSupabaseClient();
      if (!state.supabaseClient) {
        if (statusText) {
          statusText.style.color = "#DC2626";
          statusText.textContent = "⚠️ Klien Supabase belum terhubung.";
        }
        showToast("⚠️ Klien Supabase belum terhubung.", "warning");
        return;
      }
      fetchEventsFromSupabase(function(success) {
        if (success) {
          if (statusText) {
            statusText.style.color = "#059669";
            statusText.textContent = "✓ Data berhasil disinkronkan langsung dari Supabase!";
          }
          showToast("✓ Data berhasil disegarkan dari Supabase!", "success");
        } else {
          if (statusText) {
            statusText.style.color = "#DC2626";
            statusText.textContent = "⚠️ Gagal memuat data dari Supabase.";
          }
          showToast("⚠️ Gagal memuat data dari Supabase.", "error");
        }
      });
    }
    window.handleRefreshFromSupabase = handleRefreshFromSupabase;
`;

  code = code.replace(
    'window.handleMigrateSpreadsheetToSupabase = handleMigrateSpreadsheetToSupabase;',
    'window.handleMigrateSpreadsheetToSupabase = handleMigrateSpreadsheetToSupabase;\n' + refreshFuncCode
  );
  console.log("✓ handleRefreshFromSupabase added to js/app.js");
}

fs.writeFileSync(appJsPath, code, 'utf8');
console.log("✓ Successfully saved js/app.js. New length:", code.length);

