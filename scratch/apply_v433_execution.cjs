const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

// 1. In DOMContentLoaded: Prevent config.json from wiping out existing activeConfig with empty strings
const oldConfigJsonMerge = `            state.activeConfig = Object.assign({}, GLOBAL_CONFIG, remoteCfg);
            populateConfigToUI(state.activeConfig);`;

const newConfigJsonMerge = `            // Proteksi Nilai Riil: Cegah config.json menimpa data event aktif dengan string kosong
            for (const key in remoteCfg) {
              const val = remoteCfg[key];
              if (val !== "" && val !== null && val !== undefined) {
                if (Array.isArray(val) && val.length === 0) continue;
                state.activeConfig[key] = val;
              }
            }
            populateConfigToUI(state.activeConfig);`;

if (code.includes(oldConfigJsonMerge)) {
  code = code.replace(oldConfigJsonMerge, newConfigJsonMerge);
  console.log("✓ DOMContentLoaded config.json empty-string overwrite protected");
} else {
  console.warn("⚠️ oldConfigJsonMerge not found");
}

// 2. In fetchGalleryData: Robust activeFolder resolution from currentEvent
const oldActiveFolder = `      const activeFolder = state.activeConfig.DRIVE_FOLDER_ID ? (extractDriveFolderId(state.activeConfig.DRIVE_FOLDER_ID) || state.activeConfig.DRIVE_FOLDER_ID) : "";`;

const newActiveFolder = `      let activeFolder = (state.activeConfig && state.activeConfig.DRIVE_FOLDER_ID) || "";
      if (!activeFolder && state.currentEventId) {
        const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
        if (curEv && curEv.driveFolderId) {
          activeFolder = curEv.driveFolderId;
          state.activeConfig.DRIVE_FOLDER_ID = activeFolder;
        }
      }
      activeFolder = activeFolder ? (extractDriveFolderId(activeFolder) || activeFolder) : "";`;

if (code.includes(oldActiveFolder)) {
  code = code.replace(oldActiveFolder, newActiveFolder);
  console.log("✓ fetchGalleryData activeFolder resolution enhanced");
} else {
  console.warn("⚠️ oldActiveFolder not found");
}

// 3. In renderCategoryTabs: Ensure Photobooth tab is ALWAYS included when configured
const oldRenderCategoryTabsList = `      // 1. Kategori kustom dari database Supabase / admin / config (cek enabled flag)
      if (Array.isArray(state.customCategories)) {
        state.customCategories.forEach(function(item) {
          const catName = String((item && item.name) || item || "").trim();
          const isEnabled = (item && item.enabled !== undefined) ? item.enabled : true;
          if (catName && catName !== "Semua Foto" && catName !== mainLabel && isEnabled !== false && !seen[catName]) {
            seen[catName] = true;
            uniqueCategories.push(catName);
          }
        });
      }`;

const newRenderCategoryTabsList = `      // 1. Kategori kustom dari database Supabase / admin / config (cek enabled flag)
      if (Array.isArray(state.customCategories)) {
        state.customCategories.forEach(function(item) {
          const catName = String((item && item.name) || item || "").trim();
          const isEnabled = (item && item.enabled !== undefined) ? item.enabled : true;
          if (catName && catName !== "Semua Foto" && catName !== mainLabel && isEnabled !== false && !seen[catName]) {
            seen[catName] = true;
            uniqueCategories.push(catName);
          }
        });
      }

      // 1b. Pastikan Tab Photobooth selalu hadir jika photoboothUrl atau item Photobooth aktif
      const curActiveEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      const currentPbUrl = (state.activeConfig && state.activeConfig.PHOTOBOOTH_URL) || (curActiveEv && curActiveEv.photoboothUrl) || "";
      const pbCatItem = Array.isArray(state.customCategories) 
        ? state.customCategories.find(function(c) { return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth")); })
        : null;
      const isPbEnabled = pbCatItem ? (pbCatItem.enabled !== false) : (currentPbUrl ? true : false);
      const pbTabName = (pbCatItem && pbCatItem.name) ? pbCatItem.name : "Photobooth";
      if (isPbEnabled && (currentPbUrl || pbCatItem) && !seen[pbTabName]) {
        seen[pbTabName] = true;
        uniqueCategories.push(pbTabName);
      }`;

if (code.includes(oldRenderCategoryTabsList)) {
  code = code.replace(oldRenderCategoryTabsList, newRenderCategoryTabsList);
  console.log("✓ renderCategoryTabs Photobooth tab guarantee added");
} else {
  console.warn("⚠️ oldRenderCategoryTabsList not found");
}

// 4. In fetchEventsFromSupabase: Add automatic proxy fallback on NetworkError
const oldFetchEventsSupabase = `    function fetchEventsFromSupabase(callback) {
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
            let curSlug = state.currentEventId || getActiveEventIdFromUrl();
            if (!curSlug) {
              // Isolasi Mutlak: Link polos tanpa ?event= TIDAK membuka event apapun, tampilkan layar error
              showEventNotFoundScreen(true);
              if (callback) callback(false);
              return;
            }
            if (curSlug) {
              const matched = state.events.find(function(ev) {
                if (!ev || !ev.id) return false;
                const eId = String(ev.id).toLowerCase().trim();
                const curId = String(curSlug).toLowerCase().trim();
                return eId === curId || eId.startsWith(curId) || curId.startsWith(eId) || eId.replace(/-\d+$/, '') === curId.replace(/-\d+$/, '');
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
    }`;

const newFetchEventsSupabase = `    function processSupabaseEventsRows(rows, callback) {
      if (!Array.isArray(rows) || rows.length === 0) {
        if (callback) callback(false);
        return;
      }
      const mappedEvents = rows.map(mapSupabaseEventRow).filter(Boolean);
      state.events = mappedEvents;
      try { localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(mappedEvents)); } catch(e) {}

      let curSlug = state.currentEventId || getActiveEventIdFromUrl();
      if (!curSlug) {
        showEventNotFoundScreen(true);
        if (callback) callback(false);
        return;
      }

      const matched = state.events.find(function(ev) {
        if (!ev || !ev.id) return false;
        const eId = String(ev.id).toLowerCase().trim();
        const curId = String(curSlug).toLowerCase().trim();
        return eId === curId || eId.startsWith(curId) || curId.startsWith(eId) || eId.replace(/-\d+$/, '') === curId.replace(/-\d+$/, '');
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

      renderAdminEventsManager();
      updateSupabaseUIBadge(true, "✓ Terhubung (" + mappedEvents.length + " Event)");
      if (callback) callback(true);
    }

    function fetchEventsViaProxy(callback) {
      fetch("/api/supabase-proxy?path=rest/v1/events&select=*&order=created_at.desc")
        .then(function(r) { return r.json(); })
        .then(function(rows) {
          processSupabaseEventsRows(rows, callback);
        })
        .catch(function(err) {
          console.error("⚠️ Exception query Supabase via proxy:", err);
          updateSupabaseUIBadge(false, "Koneksi Offline");
          if (callback) callback(false);
        });
    }

    function fetchEventsFromSupabase(callback) {
      if (!state.supabaseClient) {
        fetchEventsViaProxy(callback);
        return;
      }

      state.supabaseClient
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .then(function(res) {
          if (res.error) {
            console.warn("⚠️ Client Supabase query gagal, beralih ke proxy fallback:", res.error.message);
            fetchEventsViaProxy(callback);
            return;
          }
          processSupabaseEventsRows(res.data, callback);
          // Ambil settings global
          state.supabaseClient.from('settings').select('*').then(function(sRes) {
            if (sRes.data && Array.isArray(sRes.data)) {
              sRes.data.forEach(function(st) {
                if (st.key && st.value !== undefined) state.activeConfig[st.key] = st.value;
              });
            }
          }).catch(function() {});
        })
        .catch(function(err) {
          console.warn("⚠️ Client Supabase exception, beralih ke proxy fallback:", err);
          fetchEventsViaProxy(callback);
        });
    }`;

if (code.includes(oldFetchEventsSupabase)) {
  code = code.replace(oldFetchEventsSupabase, newFetchEventsSupabase);
  console.log("✓ fetchEventsFromSupabase proxy fallback added");
} else {
  console.warn("⚠️ oldFetchEventsSupabase not found");
}

// 5. In saveEventToSupabase: Add automatic proxy fallback
const oldSaveEventSupabase = `        state.supabaseClient
          .from('events')
          .upsert(row, { onConflict: 'id' })
          .then(function(res) {
            if (res.error) {
              console.error("⚠️ Gagal menyimpan event ke Supabase:", res.error);
              if (onError) onError(res.error);
              reject(res.error);
            } else {
              console.log("✓ Berhasil menyimpan event ke Supabase:", eventObj.id);
              if (onSuccess) onSuccess(res.data);
              resolve(res.data);
            }
          })
          .catch(function(err) {
            if (onError) onError(err);
            reject(err);
          });`;

const newSaveEventSupabase = `        function trySaveViaProxy() {
          fetch("/api/supabase-proxy?path=rest/v1/events&on_conflict=id", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates,return=representation"
            },
            body: JSON.stringify([row])
          })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              console.log("✓ [Proxy Fallback] Berhasil menyimpan event ke Supabase:", eventObj.id);
              if (onSuccess) onSuccess(data);
              resolve(data);
            })
            .catch(function(err) {
              console.error("⚠️ Gagal menyimpan event via proxy:", err);
              if (onError) onError(err);
              reject(err);
            });
        }

        if (!state.supabaseClient) {
          trySaveViaProxy();
          return;
        }

        state.supabaseClient
          .from('events')
          .upsert(row, { onConflict: 'id' })
          .then(function(res) {
            if (res.error) {
              console.warn("⚠️ Client Supabase upsert gagal, beralih ke proxy fallback:", res.error.message);
              trySaveViaProxy();
            } else {
              console.log("✓ Berhasil menyimpan event ke Supabase:", eventObj.id);
              if (onSuccess) onSuccess(res.data);
              resolve(res.data);
            }
          })
          .catch(function(err) {
            console.warn("⚠️ Client Supabase exception, beralih ke proxy fallback:", err);
            trySaveViaProxy();
          });`;

if (code.includes(oldSaveEventSupabase)) {
  code = code.replace(oldSaveEventSupabase, newSaveEventSupabase);
  console.log("✓ saveEventToSupabase proxy fallback added");
} else {
  console.warn("⚠️ oldSaveEventSupabase not found");
}

// 6. In syncCategoriesAndDisplayLinks: Read Photobooth inputs and sync live photos
const oldSyncCategories = `      // Update properti customCategories pada objek event aktif di state.events
      if (Array.isArray(state.events)) {
        const curEv = state.events.find(function(e) { return e.id === state.currentEventId; }) || state.events[0];
        if (curEv) {
          curEv.customCategories = customCategoriesList;
          if (driveFolderVal) curEv.driveFolderId = driveFolderVal;
          if (allPhotosLabelVal) curEv.allPhotosLabel = allPhotosLabelVal;
        }
      }`;

const newSyncCategories = `      const pbItem = customCategoriesList.find(function(c) {
        return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
      });
      const pbUrlVal = pbItem ? String(pbItem.url || "").trim() : (state.activeConfig.PHOTOBOOTH_URL || "");
      if (pbUrlVal) state.activeConfig.PHOTOBOOTH_URL = pbUrlVal;

      // Update properti objek event aktif di state.events
      let curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      if (curEv) {
        curEv.customCategories = customCategoriesList;
        if (driveFolderVal) curEv.driveFolderId = driveFolderVal;
        if (allPhotosLabelVal) curEv.allPhotosLabel = allPhotosLabelVal;
        if (pbUrlVal) curEv.photoboothUrl = pbUrlVal;
      }`;

if (code.includes(oldSyncCategories)) {
  code = code.replace(oldSyncCategories, newSyncCategories);
  console.log("✓ syncCategoriesAndDisplayLinks Photobooth URL mapping added");
} else {
  console.warn("⚠️ oldSyncCategories not found");
}

// 7. In syncSingleCategory: trigger fetchGalleryData on main label / Photostage
const oldSyncSingleMain = `      const mainLabel = state.allPhotosLabel || "Semua Foto";
      if (categoryName === mainLabel || categoryName === "Semua Foto") {
        fetchGalleryData(true, false);
        return;
      }`;

const newSyncSingleMain = `      const mainLabel = state.allPhotosLabel || "Semua Foto";
      if (categoryName === mainLabel || categoryName === "Semua Foto" || categoryName === "Photostage") {
        showToast("🔄 Menyinkronkan foto Google Drive...");
        fetchGalleryData(true, false);
        return;
      }`;

if (code.includes(oldSyncSingleMain)) {
  code = code.replace(oldSyncSingleMain, newSyncSingleMain);
  console.log("✓ syncSingleCategory Photostage trigger updated");
} else {
  console.warn("⚠️ oldSyncSingleMain not found");
}

fs.writeFileSync('js/app.js', code, 'utf8');
console.log("=== Selesai memodifikasi js/app.js (v4.33.0) ===");

