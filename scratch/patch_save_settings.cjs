const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

const targetSaveTry = `      if (state.supabaseClient) {
        try {
          const ops = [];

          // 1. Simpan Event ke tabel 'events'
          ops.push(saveEventToSupabase(curEv));

          // 2. Simpan Pengaturan Global ke tabel 'settings'
          ops.push(
            state.supabaseClient.from('settings').upsert([
              { key: 'ALL_PHOTOS_LABEL', value: allPhotosLabelInput, updated_at: new Date().toISOString() },
              { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
            ], { onConflict: 'key' })
          );

          // 3. Simpan Perubahan Password Admin jika diisi
          if (newPinInput && newPinInput.length >= 4) {
            const curUser = (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin";
            ops.push(
              state.supabaseClient.from('admin_users').update({ pin: newPinInput }).eq('username', curUser)
            );
          }

          // 4. Tambah Akun Admin Baru jika form diisi
          if (newAdminUserVal && newAdminPassVal && newAdminPassVal.length >= 4) {
            const newUserObj = {
              id: "usr_" + Date.now(),
              username: newAdminUserVal,
              name: newAdminNameVal || newAdminUserVal,
              pin: newAdminPassVal,
              role: "Admin"
            };
            ops.push(
              state.supabaseClient.from('admin_users').insert([newUserObj])
            );
          }

          const results = await Promise.all(ops);

          // Cek apakah ada error dari Supabase response
          for (const res of results) {
            if (res && res.error) {
              throw new Error(res.error.message || "Gagal menyimpan data ke Supabase");
            }
          }`;

const replacementSaveTry = `      async function saveViaProxyFallback() {
        try {
          const proxyOps = [];
          // 1. Simpan Event
          proxyOps.push(saveEventToSupabase(curEv));

          // 2. Simpan Settings
          proxyOps.push(fetch("/api/supabase-proxy?path=rest/v1/settings&on_conflict=key", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify([
              { key: 'ALL_PHOTOS_LABEL', value: allPhotosLabelInput, updated_at: new Date().toISOString() },
              { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
            ])
          }));

          // 3. Password Admin
          if (newPinInput && newPinInput.length >= 4) {
            const curUser = (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin";
            proxyOps.push(fetch("/api/supabase-proxy?path=rest/v1/admin_users&username=eq." + encodeURIComponent(curUser), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pin: newPinInput })
            }));
          }

          // 4. Tambah Admin Baru
          if (newAdminUserVal && newAdminPassVal && newAdminPassVal.length >= 4) {
            const newUserObj = {
              id: "usr_" + Date.now(),
              username: newAdminUserVal,
              name: newAdminNameVal || newAdminUserVal,
              pin: newAdminPassVal,
              role: "Admin"
            };
            proxyOps.push(fetch("/api/supabase-proxy?path=rest/v1/admin_users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify([newUserObj])
            }));
          }

          await Promise.all(proxyOps);
          return true;
        } catch (err) {
          throw err;
        }
      }

      try {
        let savedDirectly = false;
        if (state.supabaseClient) {
          try {
            const ops = [];
            ops.push(saveEventToSupabase(curEv));
            ops.push(
              state.supabaseClient.from('settings').upsert([
                { key: 'ALL_PHOTOS_LABEL', value: allPhotosLabelInput, updated_at: new Date().toISOString() },
                { key: 'SLIDESHOW_INTERVAL_SEC', value: String(state.activeConfig.SLIDESHOW_INTERVAL_SEC || 4), updated_at: new Date().toISOString() }
              ], { onConflict: 'key' })
            );
            if (newPinInput && newPinInput.length >= 4) {
              const curUser = (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin";
              ops.push(state.supabaseClient.from('admin_users').update({ pin: newPinInput }).eq('username', curUser));
            }
            if (newAdminUserVal && newAdminPassVal && newAdminPassVal.length >= 4) {
              const newUserObj = {
                id: "usr_" + Date.now(),
                username: newAdminUserVal,
                name: newAdminNameVal || newAdminUserVal,
                pin: newAdminPassVal,
                role: "Admin"
              };
              ops.push(state.supabaseClient.from('admin_users').insert([newUserObj]));
            }
            const results = await Promise.all(ops);
            for (const res of results) {
              if (res && res.error) throw new Error(res.error.message || "Gagal menyimpan data ke Supabase");
            }
            savedDirectly = true;
          } catch(directErr) {
            console.warn("⚠️ Direct Supabase save gagal, beralih ke proxy fallback:", directErr);
            await saveViaProxyFallback();
          }
        } else {
          await saveViaProxyFallback();
        }`;

if (code.includes(targetSaveTry)) {
  code = code.replace(targetSaveTry, replacementSaveTry);
  fs.writeFileSync('js/app.js', code, 'utf8');
  console.log("✓ handleSaveAllSettings proxy fallback successfully added!");
} else {
  console.error("Could not find targetSaveTry");
}

