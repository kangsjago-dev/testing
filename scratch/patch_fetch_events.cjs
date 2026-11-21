const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

const startIdx = code.indexOf('    function fetchEventsFromSupabase(callback) {');
const endIdx = code.indexOf('    function saveEventToSupabase(eventObj, onSuccess, onError) {');

if (startIdx !== -1 && endIdx !== -1) {
  const newFetchFunc = `    function processSupabaseEventsRows(rows, callback) {
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
    }

`;
  code = code.slice(0, startIdx) + newFetchFunc + code.slice(endIdx);
  fs.writeFileSync('js/app.js', code, 'utf8');
  console.log("✓ fetchEventsFromSupabase successfully replaced with proxy fallback version");
} else {
  console.error("Could not find startIdx or endIdx");
}

