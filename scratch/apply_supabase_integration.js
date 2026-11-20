const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../js/app.js');
let code = fs.readFileSync(appJsPath, 'utf8');

console.log("Reading js/app.js... current length:", code.length);

// 1. Tambah DATABASE_ENGINE, SUPABASE_URL, SUPABASE_ANON_KEY ke GLOBAL_CONFIG
if (!code.includes('SUPABASE_URL:')) {
  code = code.replace(
    'GAS_API_URL: "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec",',
    'GAS_API_URL: "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec",\n      DATABASE_ENGINE: "supabase",\n      SUPABASE_URL: "",\n      SUPABASE_ANON_KEY: "",'
  );
  console.log("✓ GLOBAL_CONFIG updated with Supabase properties");
}

// 2. Tambah supabase state variables ke object state
if (!code.includes('supabaseClient: null,')) {
  code = code.replace(
    'isAutoRefreshing: false\n    };',
    'isAutoRefreshing: false,\n      supabaseClient: null,\n      supabaseRealtimeChannel: null,\n      supabaseUrl: "",\n      supabaseAnonKey: "",\n      databaseEngine: "supabase"\n    };'
  );
  console.log("✓ state updated with Supabase properties");
}

// 3. Muat stored Supabase credentials di DOMContentLoaded
if (!code.includes('savedSupabaseUrl')) {
  const targetLoad = 'const savedApiUrl = localStorage.getItem("WEDDING_GAS_API_URL") || GLOBAL_CONFIG.GAS_API_URL;';
  const replacementLoad = `const savedApiUrl = localStorage.getItem("WEDDING_GAS_API_URL") || GLOBAL_CONFIG.GAS_API_URL;
      if (savedApiUrl) {
        state.gasApiUrl = savedApiUrl;
        const apiUrlInput = document.getElementById("cfgGasApiUrl");
        if (apiUrlInput) apiUrlInput.value = savedApiUrl;
      }

      const savedSupabaseUrl = localStorage.getItem("WEDDING_SUPABASE_URL") || GLOBAL_CONFIG.SUPABASE_URL || "";
      const savedSupabaseKey = localStorage.getItem("WEDDING_SUPABASE_ANON_KEY") || GLOBAL_CONFIG.SUPABASE_ANON_KEY || "";
      if (savedSupabaseUrl) state.supabaseUrl = savedSupabaseUrl;
      if (savedSupabaseKey) state.supabaseAnonKey = savedSupabaseKey;
      const supaUrlInp = document.getElementById("cfgSupabaseUrl");
      if (supaUrlInp && savedSupabaseUrl) supaUrlInp.value = savedSupabaseUrl;
      const supaKeyInp = document.getElementById("cfgSupabaseAnonKey");
      if (supaKeyInp && savedSupabaseKey) supaKeyInp.value = savedSupabaseKey;`;

  code = code.replace(
    /const savedApiUrl = localStorage\.getItem\("WEDDING_GAS_API_URL"\) \|\| GLOBAL_CONFIG\.GAS_API_URL;\s*if \(savedApiUrl\) \{\s*state\.gasApiUrl = savedApiUrl;\s*const apiUrlInput = document\.getElementById\("cfgGasApiUrl"\);\s*if \(apiUrlInput\) apiUrlInput\.value = savedApiUrl;\s*\}/,
    replacementLoad
  );
  console.log("✓ DOMContentLoaded credentials loading updated");
}

// 4. Update remoteCfg loading dari config.json
if (!code.includes('if (remoteCfg.SUPABASE_URL)')) {
  const targetRemote = `if (remoteCfg.GAS_API_URL) {
              state.gasApiUrl = remoteCfg.GAS_API_URL;
              const apiUrlInput = document.getElementById("cfgGasApiUrl");
              if (apiUrlInput) apiUrlInput.value = remoteCfg.GAS_API_URL;
            }`;

  const replacementRemote = `if (remoteCfg.GAS_API_URL) {
              state.gasApiUrl = remoteCfg.GAS_API_URL;
              const apiUrlInput = document.getElementById("cfgGasApiUrl");
              if (apiUrlInput) apiUrlInput.value = remoteCfg.GAS_API_URL;
            }
            if (remoteCfg.SUPABASE_URL) {
              state.supabaseUrl = remoteCfg.SUPABASE_URL;
              const sUrlEl = document.getElementById("cfgSupabaseUrl");
              if (sUrlEl) sUrlEl.value = remoteCfg.SUPABASE_URL;
            }
            if (remoteCfg.SUPABASE_ANON_KEY) {
              state.supabaseAnonKey = remoteCfg.SUPABASE_ANON_KEY;
              const sKeyEl = document.getElementById("cfgSupabaseAnonKey");
              if (sKeyEl) sKeyEl.value = remoteCfg.SUPABASE_ANON_KEY;
            }
            if (remoteCfg.DATABASE_ENGINE) {
              state.databaseEngine = remoteCfg.DATABASE_ENGINE;
            }`;

  code = code.replace(targetRemote, replacementRemote);
  console.log("✓ remoteCfg loading updated");
}

// 5. Update startup sequence di .finally(...)
const targetFinally = `        .finally(function() {
          // 4. Fail-Safe: Jika URL belum terdeteksi, baca baris Pengaturan di Google Spreadsheet publik via GViz
          syncFromSpreadsheetGViz(function() {
            // 5. Ambil data galeri & konfigurasi live dari Google Apps Script untuk event aktif
            fetchGalleryData(false, false);
            startLiveAutoRefresh();
            startBadgeExpiryChecker();
          });
        });`;

const replacementFinally = `        .finally(function() {
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

if (code.includes('// 4. Fail-Safe: Jika URL belum terdeteksi, baca baris Pengaturan di Google Spreadsheet publik via GViz')) {
  code = code.replace(targetFinally, replacementFinally);
  console.log("✓ .finally(...) startup sequence updated for Dual-Engine");
}

// 6. Sisipkan modul fungsi Supabase sebelum handleTriggerDatabaseSetup
if (!code.includes('function initSupabaseClient()')) {
  const supabaseModuleCode = `    // ==========================================================================
    // SUPABASE DATABASE & REALTIME WEBSOCKET ADAPTER (v4.26.0)
    // ==========================================================================
    function getSupabaseConfig() {
      const url = (state.supabaseUrl || (state.activeConfig && state.activeConfig.SUPABASE_URL) || localStorage.getItem("WEDDING_SUPABASE_URL") || GLOBAL_CONFIG.SUPABASE_URL || "").trim();
      const key = (state.supabaseAnonKey || (state.activeConfig && state.activeConfig.SUPABASE_ANON_KEY) || localStorage.getItem("WEDDING_SUPABASE_ANON_KEY") || GLOBAL_CONFIG.SUPABASE_ANON_KEY || "").trim();
      return { url: url, key: key };
    }

    function updateSupabaseUIBadge(isConnected, customMsg) {
      const badge = document.getElementById("supabaseStatusBadge");
      if (!badge) return;
      if (isConnected) {
        badge.textContent = customMsg || "✓ Terhubung & Realtime Aktif";
        badge.style.background = "#D1FAE5";
        badge.style.color = "#065F46";
      } else {
        const cfg = getSupabaseConfig();
        if (!cfg.url || !cfg.key) {
          badge.textContent = "Belum Terhubung (Fallback Sheets)";
          badge.style.background = "#F1F5F9";
          badge.style.color = "#64748B";
        } else {
          badge.textContent = customMsg || "Koneksi Terputus / Error";
          badge.style.background = "#FEE2E2";
          badge.style.color = "#B91C1C";
        }
      }
    }

    function initSupabaseClient() {
      const cfg = getSupabaseConfig();
      if (!cfg.url || !cfg.key) {
        state.supabaseClient = null;
        updateSupabaseUIBadge(false);
        return null;
      }
      if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        console.warn("⚠️ Library @supabase/supabase-js belum terpasang atau gagal dimuat.");
        state.supabaseClient = null;
        updateSupabaseUIBadge(false, "Library SDK Belum Siap");
        return null;
      }

      try {
        state.supabaseClient = window.supabase.createClient(cfg.url, cfg.key);
        state.supabaseUrl = cfg.url;
        state.supabaseAnonKey = cfg.key;
        updateSupabaseUIBadge(true);
        setupSupabaseRealtime();
        return state.supabaseClient;
      } catch (err) {
        console.error("⚠️ Inisialisasi Supabase gagal:", err);
        state.supabaseClient = null;
        updateSupabaseUIBadge(false, "Gagal Inisialisasi");
        return null;
      }
    }

    function setupSupabaseRealtime() {
      if (!state.supabaseClient) return;
      if (state.supabaseRealtimeChannel) {
        try {
          state.supabaseClient.removeChannel(state.supabaseRealtimeChannel);
        } catch(e) {}
        state.supabaseRealtimeChannel = null;
      }

      try {
        state.supabaseRealtimeChannel = state.supabaseClient
          .channel('wedding-realtime-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, function(payload) {
            console.log("⚡ [Supabase Realtime] Events change detected:", payload);
            handleSupabaseRealtimeEventChange(payload);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, function(payload) {
            console.log("⚡ [Supabase Realtime] Settings change detected:", payload);
            handleSupabaseRealtimeSettingChange(payload);
          })
          .subscribe(function(status) {
            if (status === 'SUBSCRIBED') {
              console.log("⚡ [Supabase Realtime] WebSocket Subscribed!");
              updateSupabaseUIBadge(true, "✓ Realtime Aktif (WebSocket)");
            }
          });
      } catch (e) {
        console.warn("⚠️ Gagal mendaftarkan Supabase realtime subscription:", e);
      }
    }

    function handleSupabaseRealtimeEventChange(payload) {
      if (!payload) return;
      const eventType = payload.eventType; // 'INSERT', 'UPDATE', 'DELETE'
      const newRec = payload.new;
      const oldRec = payload.old;

      if (eventType === 'DELETE' && oldRec && oldRec.id) {
        state.events = (state.events || []).filter(function(e) { return e.id !== oldRec.id; });
        try { localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events)); } catch(e) {}
        renderAdminEventsManager();
        if (state.currentEventId === oldRec.id) {
          showEventNotFoundScreen(true);
          showToast("⚠️ Event aktif telah dihapus dari database.");
        }
        return;
      }

      if (newRec && newRec.id) {
        const mapped = mapSupabaseEventRow(newRec);
        if (!Array.isArray(state.events)) state.events = [];
        const idx = state.events.findIndex(function(e) { return e.id === mapped.id; });
        if (idx >= 0) {
          state.events[idx] = Object.assign({}, state.events[idx], mapped);
        } else {
          state.events.unshift(mapped);
        }
        try { localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events)); } catch(e) {}
        renderAdminEventsManager();

        // Jika event yang berubah adalah event yang sedang dibuka di browser
        if (state.currentEventId && state.currentEventId === mapped.id) {
          state.activeConfig = Object.assign({}, state.activeConfig, {
            EVENT_NAME: mapped.name,
            COUPLE_NAME: mapped.name,
            EVENT_DATE: mapped.date,
            EVENT_VENUE: mapped.venue,
            DRIVE_FOLDER_ID: mapped.driveFolderId,
            PHOTOBOOTH_URL: mapped.photoboothUrl,
            ALL_PHOTOS_LABEL: mapped.allPhotosLabel,
            FRAME_IMAGE_URL: mapped.frameImageUrl,
            EVENT_LOGO_URL: mapped.logoUrl,
            logoUrl: mapped.logoUrl,
            CUSTOM_CATEGORIES: mapped.customCategories
          });
          if (Array.isArray(mapped.customCategories) && mapped.customCategories.length > 0) {
            state.customCategories = mapped.customCategories;
          }
          state.allPhotosLabel = mapped.allPhotosLabel || "Semua Foto";
          populateConfigToUI(state.activeConfig);
          showToast("⚡ [Realtime] Acara '" + mapped.name + "' baru saja diperbarui live!");
        }
      }
    }

    function handleSupabaseRealtimeSettingChange(payload) {
      if (!payload || !payload.new) return;
      const k = payload.new.key;
      const v = payload.new.value;
      if (k && v !== undefined) {
        state.activeConfig[k] = v;
        if (k === 'SLIDESHOW_INTERVAL_SEC') {
          const sec = parseInt(v, 10);
          if (sec > 0) state.intervalMs = sec * 1000;
        } else if (k === 'NEW_BADGE_MINUTES') {
          const m = parseInt(v, 10);
          if (m > 0) state.newBadgeDurationMs = m * 60 * 1000;
        }
      }
    }

    function mapSupabaseEventRow(row) {
      if (!row) return null;
      let cats = [];
      if (Array.isArray(row.custom_categories)) {
        cats = row.custom_categories;
      } else if (typeof row.custom_categories === 'string') {
        try { cats = JSON.parse(row.custom_categories); } catch(e) { cats = []; }
      }
      return {
        id: row.id,
        name: row.name || "",
        date: row.date || "",
        venue: row.venue || "",
        homeUrl: row.home_url || "",
        driveFolderId: row.drive_folder_id || "",
        allPhotosLabel: row.all_photos_label || "Semua Foto",
        photoboothUrl: row.photobooth_url || "",
        frameImageUrl: row.frame_image_url || "",
        logoUrl: row.logo_url || "",
        EVENT_LOGO_URL: row.logo_url || "",
        customCategories: cats,
        status: row.status || "Aktif",
        coverSettings: row.cover_settings || null
      };
    }

    function fetchEventsFromSupabase(callback) {
      if (!state.supabaseClient) {
        if (callback) callback(false);
        return;
      }

      state.supabaseClient
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .then(function(res) {
          if (res.error) {
            console.error("⚠️ Error membaca tabel events Supabase:", res.error);
            updateSupabaseUIBadge(false, "Error: " + res.error.message);
            if (callback) callback(false);
            return;
          }

          const rows = res.data;
          if (Array.isArray(rows) && rows.length > 0) {
            const mappedEvents = rows.map(mapSupabaseEventRow).filter(Boolean);
            state.events = mappedEvents;
            try { localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(mappedEvents)); } catch(e) {}

            // Cari event yang aktif
            const curSlug = state.currentEventId || getActiveEventIdFromUrl();
            if (curSlug) {
              const matched = state.events.find(function(ev) {
                if (!ev || !ev.id) return false;
                const eId = String(ev.id).toLowerCase().trim();
                const curId = String(curSlug).toLowerCase().trim();
                return eId === curId || eId.startsWith(curId) || curId.startsWith(eId) || eId.replace(/-\\d+$/, '') === curId.replace(/-\\d+$/, '');
              });

              if (matched) {
                state.currentEventId = matched.id;
                showEventNotFoundScreen(false);
                state.activeConfig = Object.assign({}, state.activeConfig, {
                  ACTIVE_EVENT_ID: matched.id,
                  EVENT_NAME: matched.name,
                  COUPLE_NAME: matched.name,
                  EVENT_DATE: matched.date,
                  EVENT_VENUE: matched.venue,
                  EVENT_LOGO_URL: matched.logoUrl,
                  logoUrl: matched.logoUrl,
                  ALL_PHOTOS_LABEL: matched.allPhotosLabel || "Semua Foto",
                  DRIVE_FOLDER_ID: matched.driveFolderId,
                  FRAME_IMAGE_URL: matched.frameImageUrl,
                  PHOTOBOOTH_URL: matched.photoboothUrl,
                  CUSTOM_CATEGORIES: matched.customCategories
                });
                state.allPhotosLabel = matched.allPhotosLabel || "Semua Foto";
                state.activeCategory = state.allPhotosLabel;
                if (Array.isArray(matched.customCategories)) {
                  state.customCategories = matched.customCategories;
                }
                populateConfigToUI(state.activeConfig);
              }
            }

            renderAdminEventsManager();
            updateSupabaseUIBadge(true, "✓ Terhubung (" + mappedEvents.length + " Event)");
            
            // Juga ambil settings global secara non-blocking
            state.supabaseClient.from('settings').select('*').then(function(sRes) {
              if (sRes.data && Array.isArray(sRes.data)) {
                sRes.data.forEach(function(st) {
                  if (st.key && st.value !== undefined) {
                    state.activeConfig[st.key] = st.value;
                  }
                });
              }
            }).catch(function() {});

            if (callback) callback(true);
          } else {
            console.log("ℹ️ Tabel events Supabase kosong. Mengalir ke callback...");
            if (callback) callback(false);
          }
        })
        .catch(function(err) {
          console.error("⚠️ Exception query Supabase:", err);
          updateSupabaseUIBadge(false, "Koneksi Timeout");
          if (callback) callback(false);
        });
    }

    function saveEventToSupabase(eventObj, onSuccess, onError) {
      if (!state.supabaseClient || !eventObj || !eventObj.id) {
        if (onError) onError(new Error("Supabase tidak aktif atau data event kosong"));
        return;
      }
      const row = {
        id: eventObj.id,
        name: eventObj.name || "",
        date: eventObj.date || "",
        venue: eventObj.venue || "",
        home_url: eventObj.homeUrl || "",
        drive_folder_id: eventObj.driveFolderId || "",
        all_photos_label: eventObj.allPhotosLabel || "Semua Foto",
        photobooth_url: eventObj.photoboothUrl || "",
        frame_image_url: eventObj.frameImageUrl || "",
        logo_url: eventObj.logoUrl || eventObj.EVENT_LOGO_URL || "",
        custom_categories: eventObj.customCategories || [],
        status: eventObj.status || "Aktif",
        updated_at: new Date().toISOString()
      };

      state.supabaseClient
        .from('events')
        .upsert(row, { onConflict: 'id' })
        .then(function(res) {
          if (res.error) {
            console.error("⚠️ Gagal menyimpan event ke Supabase:", res.error);
            if (onError) onError(res.error);
          } else {
            console.log("✓ Berhasil menyimpan event ke Supabase:", eventObj.id);
            if (onSuccess) onSuccess(res.data);
          }
        })
        .catch(function(err) {
          if (onError) onError(err);
        });
    }

    function deleteEventFromSupabase(eventId, onSuccess, onError) {
      if (!state.supabaseClient || !eventId) return;
      state.supabaseClient
        .from('events')
        .delete()
        .eq('id', eventId)
        .then(function(res) {
          if (res.error) {
            console.error("⚠️ Gagal menghapus event dari Supabase:", res.error);
            if (onError) onError(res.error);
          } else {
            console.log("✓ Berhasil menghapus event dari Supabase:", eventId);
            if (onSuccess) onSuccess(res.data);
          }
        })
        .catch(function(err) {
          if (onError) onError(err);
        });
    }

    function handleTestSupabaseConnection() {
      const urlInput = (document.getElementById("cfgSupabaseUrl")?.value || "").trim();
      const keyInput = (document.getElementById("cfgSupabaseAnonKey")?.value || "").trim();
      const statusText = document.getElementById("supabaseSyncStatusText");

      if (!urlInput || !keyInput) {
        showToast("⚠️ Mohon isi Project URL dan Anon Key Supabase terlebih dahulu.", "warning");
        if (statusText) {
          statusText.style.display = "block";
          statusText.style.color = "#DC2626";
          statusText.textContent = "URL & Anon Key wajib diisi.";
        }
        return;
      }

      if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        showToast("⚠️ Library Supabase JS belum siap dimuat di browser.", "warning");
        return;
      }

      if (statusText) {
        statusText.style.display = "block";
        statusText.style.color = "#0284C7";
        statusText.textContent = "⏳ Menguji koneksi ke Supabase...";
      }

      try {
        const testClient = window.supabase.createClient(urlInput, keyInput);
        testClient
          .from('events')
          .select('count', { count: 'exact', head: true })
          .then(function(res) {
            if (res.error) {
              if (statusText) {
                statusText.style.color = "#DC2626";
                statusText.textContent = "❌ Gagal: " + res.error.message;
              }
              showToast("❌ Koneksi Supabase gagal: " + res.error.message, "error");
            } else {
              if (statusText) {
                statusText.style.color = "#059669";
                statusText.textContent = "✓ Koneksi Berhasil! Terhubung ke tabel 'events' (Total: " + (res.count || 0) + " baris).";
              }
              showToast("✓ Koneksi Supabase Berhasil!", "success");
              state.supabaseUrl = urlInput;
              state.supabaseAnonKey = keyInput;
              localStorage.setItem("WEDDING_SUPABASE_URL", urlInput);
              localStorage.setItem("WEDDING_SUPABASE_ANON_KEY", keyInput);
              initSupabaseClient();
            }
          })
          .catch(function(err) {
            if (statusText) {
              statusText.style.color = "#DC2626";
              statusText.textContent = "❌ Gagal menghubungi endpoint: " + err.message;
            }
            showToast("❌ Koneksi Supabase timeout / gagal: " + err.message, "error");
          });
      } catch (e) {
        if (statusText) {
          statusText.style.color = "#DC2626";
          statusText.textContent = "Format URL atau Kunci API tidak valid.";
        }
        showToast("⚠️ Format URL Supabase tidak valid.", "warning");
      }
    }

    function handleMigrateSpreadsheetToSupabase() {
      const urlInput = (document.getElementById("cfgSupabaseUrl")?.value || "").trim();
      const keyInput = (document.getElementById("cfgSupabaseAnonKey")?.value || "").trim();
      const statusText = document.getElementById("supabaseSyncStatusText");

      if (!urlInput || !keyInput) {
        showToast("⚠️ Masukkan URL dan Anon Key Supabase terlebih dahulu.", "warning");
        return;
      }

      if (statusText) {
        statusText.style.display = "block";
        statusText.style.color = "#0284C7";
        statusText.textContent = "⏳ Memulai migrasi data ke Supabase...";
      }

      const client = state.supabaseClient || (typeof window.supabase !== 'undefined' ? window.supabase.createClient(urlInput, keyInput) : null);
      if (!client) {
        showToast("⚠️ Supabase client belum siap.", "warning");
        return;
      }

      const eventsToMigrate = (Array.isArray(state.events) && state.events.length > 0) ? state.events : GLOBAL_CONFIG.EVENTS;
      if (!eventsToMigrate || eventsToMigrate.length === 0) {
        if (statusText) {
          statusText.style.color = "#DC2626";
          statusText.textContent = "⚠️ Tidak ada data event yang terdeteksi untuk dimigrasikan.";
        }
        return;
      }

      const rows = eventsToMigrate.map(function(ev) {
        return {
          id: ev.id,
          name: ev.name || "",
          date: ev.date || "",
          venue: ev.venue || "",
          home_url: ev.homeUrl || "",
          drive_folder_id: ev.driveFolderId || "",
          all_photos_label: ev.allPhotosLabel || "Photostage",
          photobooth_url: ev.photoboothUrl || "",
          frame_image_url: ev.frameImageUrl || "",
          logo_url: ev.logoUrl || ev.EVENT_LOGO_URL || "",
          custom_categories: ev.customCategories || [],
          status: ev.status || "Aktif",
          updated_at: new Date().toISOString()
        };
      });

      client
        .from('events')
        .upsert(rows, { onConflict: 'id' })
        .then(function(res) {
          if (res.error) {
            if (statusText) {
              statusText.style.color = "#DC2626";
              statusText.textContent = "❌ Gagal migrasi: " + res.error.message;
            }
            showToast("❌ Gagal migrasi ke Supabase: " + res.error.message, "error");
          } else {
            if (statusText) {
              statusText.style.color = "#059669";
              statusText.textContent = "✓ Berhasil memigrasikan " + rows.length + " event aktif ke Supabase PostgreSQL!";
            }
            showToast("✓ Sukses memindahkan " + rows.length + " event ke Supabase!", "success");
            localStorage.setItem("WEDDING_SUPABASE_URL", urlInput);
            localStorage.setItem("WEDDING_SUPABASE_ANON_KEY", keyInput);
            state.supabaseUrl = urlInput;
            state.supabaseAnonKey = keyInput;
            initSupabaseClient();
          }
        })
        .catch(function(err) {
          if (statusText) {
            statusText.style.color = "#DC2626";
            statusText.textContent = "❌ Error: " + err.message;
          }
          showToast("❌ Error migrasi: " + err.message, "error");
        });
    }

    window.handleTestSupabaseConnection = handleTestSupabaseConnection;
    window.handleMigrateSpreadsheetToSupabase = handleMigrateSpreadsheetToSupabase;

`;

  code = code.replace(
    'function handleTriggerDatabaseSetup() {',
    supabaseModuleCode + '    function handleTriggerDatabaseSetup() {'
  );
  console.log("✓ Supabase functions inserted before handleTriggerDatabaseSetup");
}

// 7. Update populateConfigToUI untuk populate Supabase inputs & badge
if (!code.includes('cfgSupabaseUrlEl')) {
  const targetPopulate = `      const apiBadge = document.getElementById("apiStatusBadge");
      if (apiBadge) {
        if (state.gasApiUrl) {
          apiBadge.innerText = "✓ Terhubung ke Apps Script";
          apiBadge.style.color = "#10B981";
        } else {
          apiBadge.innerText = "Mode Pratinjau Lokal";
          apiBadge.style.color = "#F59E0B";
        }
      }`;

  const replacementPopulate = `      const apiBadge = document.getElementById("apiStatusBadge");
      if (apiBadge) {
        if (state.gasApiUrl) {
          apiBadge.innerText = "✓ Terhubung ke Apps Script";
          apiBadge.style.color = "#10B981";
        } else {
          apiBadge.innerText = "Mode Pratinjau Lokal";
          apiBadge.style.color = "#F59E0B";
        }
      }

      const cfgSupabaseUrlEl = document.getElementById("cfgSupabaseUrl");
      if (cfgSupabaseUrlEl) cfgSupabaseUrlEl.value = (state.supabaseUrl || cfg.SUPABASE_URL || localStorage.getItem("WEDDING_SUPABASE_URL") || "");
      const cfgSupabaseKeyEl = document.getElementById("cfgSupabaseAnonKey");
      if (cfgSupabaseKeyEl) cfgSupabaseKeyEl.value = (state.supabaseAnonKey || cfg.SUPABASE_ANON_KEY || localStorage.getItem("WEDDING_SUPABASE_ANON_KEY") || "");
      updateSupabaseUIBadge(!!state.supabaseClient);`;

  code = code.replace(targetPopulate, replacementPopulate);
  console.log("✓ populateConfigToUI updated with Supabase fields");
}

// 8. Update confirmAddNewEvent untuk simpan ke Supabase
if (!code.includes('if (state.supabaseClient) {\n        saveEventToSupabase(newEventObj);')) {
  const targetAdd = `      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);
      state.currentEventId = newId;`;

  const replacementAdd = `      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);
      state.currentEventId = newId;

      if (state.supabaseClient) {
        saveEventToSupabase(newEventObj);
      }`;

  code = code.replace(targetAdd, replacementAdd);
  console.log("✓ confirmAddNewEvent updated with Supabase hook");
}

// 9. Update handleDeleteCurrentEvent untuk delete di Supabase
if (!code.includes('deleteEventFromSupabase(deleteId);')) {
  const targetDel = `      function finalizeEventDeletion(resEvents, resActiveId) {`;
  const replacementDel = `      if (state.supabaseClient) {
        deleteEventFromSupabase(deleteId);
      }
      function finalizeEventDeletion(resEvents, resActiveId) {`;

  code = code.replace(targetDel, replacementDel);
  console.log("✓ handleDeleteCurrentEvent updated with Supabase hook");
}

// 10. Update handleSaveAllSettings untuk ambil nilai Supabase input & simpan ke Supabase
if (!code.includes('const newSupabaseUrl =')) {
  const targetSaveStart = `      const newApiUrl = (document.getElementById("cfgGasApiUrl")?.value || "").trim();`;
  const replacementSaveStart = `      const newApiUrl = (document.getElementById("cfgGasApiUrl")?.value || "").trim();
      const newSupabaseUrl = (document.getElementById("cfgSupabaseUrl")?.value || "").trim();
      const newSupabaseAnonKey = (document.getElementById("cfgSupabaseAnonKey")?.value || "").trim();

      if (newSupabaseUrl) {
        state.supabaseUrl = newSupabaseUrl;
        localStorage.setItem("WEDDING_SUPABASE_URL", newSupabaseUrl);
      }
      if (newSupabaseAnonKey) {
        state.supabaseAnonKey = newSupabaseAnonKey;
        localStorage.setItem("WEDDING_SUPABASE_ANON_KEY", newSupabaseAnonKey);
      }
      initSupabaseClient();`;

  code = code.replace(targetSaveStart, replacementSaveStart);

  const targetSavePayload = `        GAS_API_URL: newApiUrl,`;
  const replacementSavePayload = `        GAS_API_URL: newApiUrl,
        SUPABASE_URL: newSupabaseUrl,
        SUPABASE_ANON_KEY: newSupabaseAnonKey,`;

  code = code.replace(targetSavePayload, replacementSavePayload);

  // Hook simpan ke Supabase saat handleSaveAllSettings
  const targetSaveSupabaseCall = `      if (state.gasApiUrl) {`;
  const replacementSaveSupabaseCall = `      if (state.supabaseClient) {
        const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
        if (curEv) {
          saveEventToSupabase(curEv);
        }
        state.supabaseClient.from('settings').upsert([
          { key: 'ALL_PHOTOS_LABEL', value: allPhotosLabelInput, updated_at: new Date().toISOString() },
          { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
        ]).then(function() {});
      }

      if (state.gasApiUrl) {`;

  code = code.replace(targetSaveSupabaseCall, replacementSaveSupabaseCall);
  console.log("✓ handleSaveAllSettings updated with Supabase persistence");
}

fs.writeFileSync(appJsPath, code, 'utf8');
console.log("✓ Successfully saved js/app.js. New length:", code.length);

