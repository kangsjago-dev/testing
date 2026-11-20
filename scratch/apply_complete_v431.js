const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

// 1. Fix Typo URL and empty key in GLOBAL_CONFIG
const oldGlobalConfig = `      DATABASE_ENGINE: "supabase",
      SUPABASE_URL: "https://faszgrkwdlqxbppownh.supabase.co",
      SUPABASE_ANON_KEY: "",`;

const newGlobalConfig = `      DATABASE_ENGINE: "supabase",
      SUPABASE_URL: "https://faszgrkwdlqxsbppownh.supabase.co",
      SUPABASE_ANON_KEY: "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA",`;

if (code.includes(oldGlobalConfig)) {
  code = code.replace(oldGlobalConfig, newGlobalConfig);
  console.log("✓ Fixed GLOBAL_CONFIG Supabase URL & Anon Key");
} else {
  console.log("⚠️ Old GLOBAL_CONFIG pattern not found, trying regex fallback");
  code = code.replace(/SUPABASE_URL:\s*"https:\/\/faszgrkwdlqxbppownh\.supabase\.co",\s*SUPABASE_ANON_KEY:\s*"",/g,
    `SUPABASE_URL: "https://faszgrkwdlqxsbppownh.supabase.co",\n      SUPABASE_ANON_KEY: "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA",`);
}

// 2. Sanitize localStorage in DOMContentLoaded
const oldDomStorage = `      // 1. Pemisahan Total: Putus seluruh link Google Apps Script / Google Sheets
      try { localStorage.removeItem("WEDDING_GAS_API_URL"); } catch(e) {}
      

      const savedSupabaseUrl = localStorage.getItem("WEDDING_SUPABASE_URL") || GLOBAL_CONFIG.SUPABASE_URL || "";
      const savedSupabaseKey = localStorage.getItem("WEDDING_SUPABASE_ANON_KEY") || GLOBAL_CONFIG.SUPABASE_ANON_KEY || "";`;

const newDomStorage = `      // 1. Pemisahan Total: Putus seluruh link Google Apps Script / Google Sheets & Sanitize Typo URL
      try {
        localStorage.removeItem("WEDDING_GAS_API_URL");
        const cachedUrl = localStorage.getItem("WEDDING_SUPABASE_URL");
        if (cachedUrl && cachedUrl.includes("faszgrkwdlqxbppownh")) {
          localStorage.setItem("WEDDING_SUPABASE_URL", "https://faszgrkwdlqxsbppownh.supabase.co");
        }
      } catch(e) {}

      const savedSupabaseUrl = localStorage.getItem("WEDDING_SUPABASE_URL") || GLOBAL_CONFIG.SUPABASE_URL || "https://faszgrkwdlqxsbppownh.supabase.co";
      const savedSupabaseKey = localStorage.getItem("WEDDING_SUPABASE_ANON_KEY") || GLOBAL_CONFIG.SUPABASE_ANON_KEY || "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA";`;

if (code.includes(oldDomStorage)) {
  code = code.replace(oldDomStorage, newDomStorage);
  console.log("✓ Added localStorage sanitization & fallback in DOMContentLoaded");
} else {
  console.log("⚠️ Old DOMContentLoaded pattern not found!");
}

// 3. Fix handleAdminLogin case insensitivity for username
const oldLoginQuery = `        state.supabaseClient
          .from('admin_users')
          .select('*')
          .eq('username', username)`;

const newLoginQuery = `        state.supabaseClient
          .from('admin_users')
          .select('*')
          .ilike('username', username)`;

if (code.includes(oldLoginQuery)) {
  code = code.replace(oldLoginQuery, newLoginQuery);
  console.log("✓ Updated handleAdminLogin to use case-insensitive username query");
} else {
  console.log("⚠️ Old handleAdminLogin query not found!");
}

// 4. Update getSupabaseConfig() with auto-sanitization
const oldGetSupa = `    function getSupabaseConfig() {
      const url = (state.supabaseUrl || (state.activeConfig && state.activeConfig.SUPABASE_URL) || localStorage.getItem("WEDDING_SUPABASE_URL") || GLOBAL_CONFIG.SUPABASE_URL || "").trim();
      const key = (state.supabaseAnonKey || (state.activeConfig && state.activeConfig.SUPABASE_ANON_KEY) || localStorage.getItem("WEDDING_SUPABASE_ANON_KEY") || GLOBAL_CONFIG.SUPABASE_ANON_KEY || "").trim();
      return { url: url, key: key };
    }`;

const newGetSupa = `    function getSupabaseConfig() {
      let url = (state.supabaseUrl || (state.activeConfig && state.activeConfig.SUPABASE_URL) || localStorage.getItem("WEDDING_SUPABASE_URL") || GLOBAL_CONFIG.SUPABASE_URL || "https://faszgrkwdlqxsbppownh.supabase.co").trim();
      let key = (state.supabaseAnonKey || (state.activeConfig && state.activeConfig.SUPABASE_ANON_KEY) || localStorage.getItem("WEDDING_SUPABASE_ANON_KEY") || GLOBAL_CONFIG.SUPABASE_ANON_KEY || "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA").trim();
      if (url.includes("faszgrkwdlqxbppownh")) {
        url = "https://faszgrkwdlqxsbppownh.supabase.co";
      }
      return { url: url, key: key };
    }`;

if (code.includes(oldGetSupa)) {
  code = code.replace(oldGetSupa, newGetSupa);
  console.log("✓ Updated getSupabaseConfig() with auto-repair and robust defaults");
} else {
  console.log("⚠️ Old getSupabaseConfig not found!");
}

// 5. Update saveEventToSupabase to return Promise and safeguard fields
const oldSaveEv = `    function saveEventToSupabase(eventObj, onSuccess, onError) {
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
    }`;

const newSaveEv = `    function saveEventToSupabase(eventObj, onSuccess, onError) {
      return new Promise(function(resolve, reject) {
        if (!state.supabaseClient) {
          initSupabaseClient();
        }
        if (!state.supabaseClient) {
          const err = new Error("Supabase client belum terinisialisasi. Periksa koneksi database.");
          if (onError) onError(err);
          return reject(err);
        }
        if (!eventObj || !eventObj.id) {
          const err = new Error("Data event kosong atau tidak valid.");
          if (onError) onError(err);
          return reject(err);
        }
        const row = {
          id: String(eventObj.id).trim(),
          name: String(eventObj.name || (state.activeConfig && state.activeConfig.EVENT_NAME) || "The Wedding Celebration").trim(),
          date: String(eventObj.date || (state.activeConfig && state.activeConfig.EVENT_DATE) || "17 Agustus 2026").trim(),
          venue: String(eventObj.venue || (state.activeConfig && state.activeConfig.EVENT_VENUE) || "").trim(),
          home_url: String(eventObj.homeUrl || ((window.location.origin || "") + (window.location.pathname || "/") + "?event=" + encodeURIComponent(eventObj.id))).trim(),
          drive_folder_id: String(eventObj.driveFolderId || (state.activeConfig && state.activeConfig.DRIVE_FOLDER_ID) || "").trim(),
          all_photos_label: String(eventObj.allPhotosLabel || state.allPhotosLabel || "Semua Foto").trim(),
          photobooth_url: String(eventObj.photoboothUrl || (state.activeConfig && state.activeConfig.PHOTOBOOTH_URL) || "").trim(),
          frame_image_url: String(eventObj.frameImageUrl || (state.activeConfig && state.activeConfig.FRAME_IMAGE_URL) || "").trim(),
          logo_url: String(eventObj.logoUrl || eventObj.EVENT_LOGO_URL || (state.activeConfig && state.activeConfig.EVENT_LOGO_URL) || "").trim(),
          custom_categories: eventObj.customCategories || state.customCategories || [],
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
          });
      });
    }`;

if (code.includes(oldSaveEv)) {
  code = code.replace(oldSaveEv, newSaveEv);
  console.log("✓ Updated saveEventToSupabase() to return Promise and safeguard non-null fields");
} else {
  console.log("⚠️ Old saveEventToSupabase not found!");
}

// 6. Remove redundant first copy of loadAdminUsers / handleAddAdminUser / handleDeleteAdminUser (lines ~3357-3489)
const oldFirstAdminBlock = `    /* ==========================================================================
       MANAJEMEN PENGGUNA ADMIN (MULTI-USER DENGAN PIN UNIK)
       ========================================================================== */
    function loadAdminUsers() {
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
    }

    function renderAdminUsersList(users) {
      const container = document.getElementById("adminUsersList");
      if (!container) return;
      if (!users || users.length === 0) {
        container.innerHTML = \`<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 6px;">Belum ada pengguna tambahan.</div>\`;
        return;
      }

      container.innerHTML = users.map(function(u) {
        const isCurrent = state.currentAdminUser && (state.currentAdminUser.id === u.id || state.currentAdminUser.name === u.name);
        return \`
          <div style="display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <span>\${escapeHtml(u.name)}</span>
                \${isCurrent ? '<span style="font-size: 0.68rem; background: #DBEAFE; color: #1E40AF; padding: 1px 6px; border-radius: 9999px;">Anda</span>' : ''}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">
                Akses: Terproteksi PIN Unik &bull; Peran: \${escapeHtml(u.role || 'Admin')}
              </div>
            </div>
            \${!isCurrent && users.length > 1 ? \`
              <button type="button" class="ctrl-icon-btn" style="width: 28px; height: 28px; border-color: #FECACA; color: #EF4444;" onclick="handleDeleteAdminUser('\${escapeHtml(u.id)}')" title="Hapus Pengguna">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            \` : ''}
          </div>
        \`;
      }).join("");
    }

    function handleAddAdminUser() {
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
    }

    function handleDeleteAdminUser(userId) {
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

if (code.includes(oldFirstAdminBlock)) {
  code = code.replace(oldFirstAdminBlock, `    // [Revisi v4.31.0: Duplikasi fungsi admin dihapus, disatukan di blok ADMIN USER & PASSWORD MANAGEMENT]`);
  console.log("✓ Removed redundant first admin functions block");
} else {
  console.log("⚠️ Old first admin block not matched exactly, checking markers");
}

// 7. Update ADMIN USER & PASSWORD MANAGEMENT (lines ~4455-4590) with handleDeleteAdminUser
const oldSecondAdminBlock = `    function handleChangeAdminPassword() {
      const passInp = document.getElementById("cfgNewAdminPassword");
      const alertBox = document.getElementById("changePassAlertBox");
      const newPass = (passInp ? passInp.value : "").trim();

      if (!newPass || newPass.length < 4) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "Password baru minimal 4 karakter.";
          alertBox.style.display = "block";
        }
        return;
      }

      state.adminPin = newPass;
      try {
        sessionStorage.setItem("WEDDING_ADMIN_PIN", newPass);
        localStorage.setItem("WEDDING_ADMIN_PIN", newPass);
      } catch(e) {}
      if (state.currentAdminUser) {
        state.currentAdminUser.password = newPass;
      }
      if (passInp) passInp.value = "";
      if (alertBox) {
        alertBox.className = "admin-alert-box success";
        alertBox.innerText = "✓ Password berhasil diperbarui!";
        alertBox.style.display = "block";
      }
      showToast("✓ Password Admin berhasil diganti!");

      if (state.supabaseClient) {
        const username = (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin";
        state.supabaseClient.from('admin_users').update({ pin: newPass }).eq('username', username).then(function() {});
      }
    }

    function handleAddAdminUser() {
      const uInp = document.getElementById("newAdminUsernameInput");
      const nInp = document.getElementById("newAdminNameInput");
      const pInp = document.getElementById("newAdminPasswordInput");
      const alertBox = document.getElementById("addUserAlertBox");

      const uVal = (uInp ? uInp.value : "").trim();
      const nVal = (nInp ? nInp.value : "").trim();
      const pVal = (pInp ? pInp.value : "").trim();

      if (!uVal || !pVal) {
        if (alertBox) {
          alertBox.innerText = "Username dan Password wajib diisi.";
          alertBox.style.display = "block";
        }
        return;
      }

      const newUser = {
        id: "usr_" + Date.now(),
        username: uVal,
        name: nVal || uVal,
        password: pVal,
        pin: pVal,
        role: "Admin",
        createdAt: new Date().toISOString()
      };

      if (!Array.isArray(state.adminAccounts)) state.adminAccounts = [];
      state.adminAccounts.push(newUser);

      if (uInp) uInp.value = "";
      if (nInp) nInp.value = "";
      if (pInp) pInp.value = "";
      if (alertBox) alertBox.style.display = "none";

      renderAdminUsersList(state.adminAccounts);
      showToast("✓ Akun admin '" + uVal + "' berhasil ditambahkan!");

      if (state.supabaseClient) {
        state.supabaseClient.from('admin_users').insert([{
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          pin: newUser.pin || newUser.password,
          role: newUser.role || "Admin"
        }]).then(function() {});
      }
    }`;

const newSecondAdminBlock = `    function handleChangeAdminPassword() {
      const passInp = document.getElementById("cfgNewAdminPassword");
      const alertBox = document.getElementById("changePassAlertBox");
      const newPass = (passInp ? passInp.value : "").trim();

      if (!newPass || newPass.length < 4) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "Password baru minimal 4 karakter.";
          alertBox.style.display = "block";
        }
        return;
      }

      state.adminPin = newPass;
      try {
        sessionStorage.setItem("WEDDING_ADMIN_PIN", newPass);
        localStorage.setItem("WEDDING_ADMIN_PIN", newPass);
      } catch(e) {}
      if (state.currentAdminUser) {
        state.currentAdminUser.password = newPass;
        state.currentAdminUser.pin = newPass;
      }
      if (passInp) passInp.value = "";

      if (state.supabaseClient) {
        const username = (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin";
        state.supabaseClient.from('admin_users').update({ pin: newPass }).eq('username', username)
          .then(function(res) {
            if (res.error) {
              if (alertBox) {
                alertBox.className = "admin-alert-box error";
                alertBox.innerText = "⚠️ Gagal update di Supabase: " + res.error.message;
                alertBox.style.display = "block";
              }
              showToast("⚠️ Gagal update password: " + res.error.message);
            } else {
              if (alertBox) {
                alertBox.className = "admin-alert-box success";
                alertBox.innerText = "✓ Password berhasil diperbarui di Supabase!";
                alertBox.style.display = "block";
              }
              showToast("✓ Password Admin berhasil diganti!");
            }
          })
          .catch(function(err) {
            showToast("Gangguan: " + (err && err.message ? err.message : String(err)));
          });
      } else {
        if (alertBox) {
          alertBox.className = "admin-alert-box success";
          alertBox.innerText = "✓ Password tersimpan di browser!";
          alertBox.style.display = "block";
        }
        showToast("✓ Password Admin berhasil diganti!");
      }
    }

    function handleAddAdminUser() {
      const uInp = document.getElementById("newAdminUsernameInput");
      const nInp = document.getElementById("newAdminNameInput");
      const pInp = document.getElementById("newAdminPasswordInput");
      const alertBox = document.getElementById("addUserAlertBox");

      const uVal = (uInp ? uInp.value : "").trim();
      const nVal = (nInp ? nInp.value : "").trim();
      const pVal = (pInp ? pInp.value : "").trim();

      if (!uVal || !pVal) {
        if (alertBox) {
          alertBox.innerText = "Username dan Password wajib diisi.";
          alertBox.style.display = "block";
        }
        return;
      }
      if (pVal.length < 4) {
        if (alertBox) {
          alertBox.innerText = "Password minimal 4 karakter.";
          alertBox.style.display = "block";
        }
        return;
      }

      const newUser = {
        id: "usr_" + Date.now(),
        username: uVal,
        name: nVal || uVal,
        pin: pVal,
        role: "Admin"
      };

      if (!Array.isArray(state.adminAccounts)) state.adminAccounts = [];
      state.adminAccounts.push(newUser);

      if (uInp) uInp.value = "";
      if (nInp) nInp.value = "";
      if (pInp) pInp.value = "";
      if (alertBox) alertBox.style.display = "none";

      renderAdminUsersList(state.adminAccounts);

      if (state.supabaseClient) {
        state.supabaseClient.from('admin_users').insert([{
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          pin: newUser.pin,
          role: newUser.role || "Admin"
        }]).then(function(res) {
          if (res.error) {
            if (alertBox) {
              alertBox.innerText = "⚠️ Gagal menyimpan ke Supabase: " + res.error.message;
              alertBox.style.display = "block";
            }
            showToast("⚠️ Gagal: " + res.error.message);
          } else {
            showToast("✓ Akun admin '" + uVal + "' berhasil ditambahkan!");
            loadAdminUsers();
          }
        }).catch(function(err) {
          showToast("Gangguan: " + (err && err.message ? err.message : String(err)));
        });
      } else {
        showToast("✓ Akun admin '" + uVal + "' berhasil disimpan!");
      }
    }

    function handleDeleteAdminUser(userId) {
      if (!confirm("Yakin ingin menghapus pengguna admin ini?")) return;
      if (state.supabaseClient) {
        state.supabaseClient
          .from('admin_users')
          .delete()
          .or('id.eq.' + userId + ',username.eq.' + userId)
          .then(function(res) {
            if (res.error) {
              showToast("⚠️ Gagal menghapus admin: " + res.error.message);
            } else {
              showToast("✓ Pengguna admin berhasil dihapus.");
              loadAdminUsers();
            }
          }).catch(function(err) {
            showToast("Gangguan: " + (err && err.message ? err.message : String(err)));
          });
      } else {
        if (Array.isArray(state.adminAccounts)) {
          state.adminAccounts = state.adminAccounts.filter(function(u) { return u.id !== userId && u.username !== userId; });
        }
        showToast("✓ Pengguna admin dihapus.");
        loadAdminUsers();
      }
    }`;

if (code.includes(oldSecondAdminBlock)) {
  code = code.replace(oldSecondAdminBlock, newSecondAdminBlock);
  console.log("✓ Updated handleChangeAdminPassword, handleAddAdminUser, and added handleDeleteAdminUser");
} else {
  console.log("⚠️ Old second admin block not found!");
}

// 8. Update handleSaveAllSettings to fully async, multi-tab and safeguard credentials
const saveSettingsStartIdx = code.indexOf('function handleSaveAllSettings() {');
const saveSettingsEndIdx = code.indexOf('function handleAdminLogout() {');

if (saveSettingsStartIdx !== -1 && saveSettingsEndIdx !== -1) {
  const newHandleSave = `async function handleSaveAllSettings() {
      const saveBtn = document.getElementById("btnSaveSettings");
      const alertBox = document.getElementById("saveAlertBox");

      const newSupabaseUrl = (document.getElementById("cfgSupabaseUrl")?.value || "").trim();
      const newSupabaseAnonKey = (document.getElementById("cfgSupabaseAnonKey")?.value || "").trim();

      // Lindungi Supabase URL & Key agar tidak tertimpa string kosong
      if (newSupabaseUrl && !newSupabaseUrl.includes("faszgrkwdlqxbppownh")) {
        state.supabaseUrl = newSupabaseUrl;
        try { localStorage.setItem("WEDDING_SUPABASE_URL", newSupabaseUrl); } catch(e) {}
      }
      if (newSupabaseAnonKey) {
        state.supabaseAnonKey = newSupabaseAnonKey;
        try { localStorage.setItem("WEDDING_SUPABASE_ANON_KEY", newSupabaseAnonKey); } catch(e) {}
      }

      initSupabaseClient();

      const activeSupaUrl = state.supabaseUrl || (state.activeConfig && state.activeConfig.SUPABASE_URL) || "https://faszgrkwdlqxsbppownh.supabase.co";
      const activeSupaKey = state.supabaseAnonKey || (state.activeConfig && state.activeConfig.SUPABASE_ANON_KEY) || "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA";

      const driveFolderInput = (document.getElementById("cfgDriveFolderId")?.value || state.activeConfig.DRIVE_FOLDER_ID || "").trim();
      const eventNameInput = (document.getElementById("cfgCoupleName")?.value || "").trim();
      const eventDateInput = (document.getElementById("cfgEventDate")?.value || "").trim();
      const eventVenueInput = (document.getElementById("cfgEventVenue")?.value || "").trim();
      const subtitleInput = (document.getElementById("cfgSubtitle")?.value || "").trim();
      const welcomeInput = (document.getElementById("cfgWelcomeMessage")?.value || "").trim();
      const footerInput = (document.getElementById("cfgFooterMessage")?.value || "").trim();
      const customCategoriesList = getCategoriesFromAdminInputs();
      const frameUrlInput = (document.getElementById("cfgFrameImageUrl")?.value || "").trim();
      const logoUrlInput = (document.getElementById("cfgEventLogoUrl")?.value || "").trim();

      // Ambil Password Baru dari Tab Akun Admin (mendukung #cfgNewAdminPassword dan #cfgNewPin)
      const newPinInput = (document.getElementById("cfgNewAdminPassword")?.value || document.getElementById("cfgNewPin")?.value || "").trim();

      // Ambil Form Tambah Admin Baru dari Tab Akun Admin
      const newAdminUserVal = (document.getElementById("newAdminUsernameInput")?.value || "").trim();
      const newAdminNameVal = (document.getElementById("newAdminNameInput")?.value || "").trim();
      const newAdminPassVal = (document.getElementById("newAdminPasswordInput")?.value || "").trim();

      try { localStorage.removeItem("WEDDING_GAS_API_URL"); } catch(e) {}

      // Format tanggal ke format bahasa Indonesia untuk display dan penyimpanan
      const formattedDate = eventDateInput ? formatIndonesianDate(eventDateInput) : (state.activeConfig.EVENT_DATE || "17 Agustus 2026");
      const finalEventName = eventNameInput || state.activeConfig.EVENT_NAME || "Wilson & Felicia";

      const allPhotosLabelInput = (document.getElementById("cfgMainGalleryLabel")?.value || document.getElementById("cfgAllPhotosLabel")?.value || state.allPhotosLabel || "").trim() || "Semua Foto";
      const coverEnabledInput = document.getElementById("cfgCoverEnabled") ? document.getElementById("cfgCoverEnabled").checked : false;
      const coverStyleInput = (document.getElementById("cfgCoverStyle")?.value || "romantic-collage");
      const coverHeadingInput = (document.getElementById("cfgCoverHeading")?.value || "").trim();
      const coverSubheadingInput = (document.getElementById("cfgCoverSubheading")?.value || "").trim();
      const coverQuoteInput = (document.getElementById("cfgCoverQuote")?.value || "").trim();
      const coverPhotosInput = getCoverPhotosFromAdminInputs();

      const coverSettingsPayload = {
        enabled: coverEnabledInput,
        style: coverStyleInput,
        heading: coverHeadingInput || ("The Wedding of " + finalEventName),
        subheading: coverSubheadingInput || "A Celebration of Love, Laughter & Happily Ever After",
        quote: coverQuoteInput || "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
        photos: coverPhotosInput
      };

      state.allPhotosLabel = allPhotosLabelInput;
      state.coverSettings = coverSettingsPayload;

      const pbItem = customCategoriesList.find(function(c) {
        return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
      });
      const pbUrlVal = pbItem ? String(pbItem.url || "").trim() : (state.activeConfig.PHOTOBOOTH_URL || "");

      // Cari atau buat objek event aktif secara robust (slug normalization)
      let curEv = (state.events || []).find(function(e) {
        if (!e || !e.id) return false;
        const eId = String(e.id).toLowerCase().trim();
        const curId = String(state.currentEventId || "").toLowerCase().trim();
        return eId === curId || eId.replace(/-\\d+$/, '') === curId.replace(/-\\d+$/, '');
      });

      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const homeUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId || "wilson-felicia");

      if (!curEv) {
        curEv = {
          id: state.currentEventId || "wilson-felicia",
          name: finalEventName,
          date: formattedDate,
          venue: eventVenueInput || "",
          homeUrl: homeUrl,
          subtitle: subtitleInput || "",
          welcomeMessage: welcomeInput || "",
          footerMessage: footerInput || "",
          allPhotosLabel: allPhotosLabelInput,
          driveFolderId: driveFolderInput,
          photoboothUrl: pbUrlVal,
          logoUrl: logoUrlInput,
          EVENT_LOGO_URL: logoUrlInput,
          frameImageUrl: frameUrlInput,
          customCategories: customCategoriesList,
          status: "Aktif"
        };
        if (!Array.isArray(state.events)) state.events = [];
        state.events.push(curEv);
      } else {
        curEv.name = finalEventName;
        curEv.date = formattedDate;
        curEv.venue = eventVenueInput || curEv.venue || "";
        curEv.homeUrl = homeUrl;
        curEv.subtitle = subtitleInput || curEv.subtitle || "";
        curEv.welcomeMessage = welcomeInput || curEv.welcomeMessage || "";
        curEv.footerMessage = footerInput || curEv.footerMessage || "";
        curEv.allPhotosLabel = allPhotosLabelInput;
        curEv.driveFolderId = driveFolderInput;
        curEv.photoboothUrl = pbUrlVal;
        curEv.logoUrl = logoUrlInput;
        curEv.EVENT_LOGO_URL = logoUrlInput;
        curEv.frameImageUrl = frameUrlInput;
        curEv.customCategories = customCategoriesList;
        curEv.status = curEv.status || "Aktif";
      }

      const payload = {
        ACTIVE_EVENT_ID: state.currentEventId || "wilson-felicia",
        EVENT_NAME: finalEventName,
        COUPLE_NAME: finalEventName,
        EVENT_DATE: formattedDate,
        EVENT_VENUE: eventVenueInput || state.activeConfig.EVENT_VENUE || "",
        SUBTITLE: subtitleInput || state.activeConfig.SUBTITLE || "The Wedding Gallery & Precious Memories",
        WELCOME_MESSAGE: welcomeInput || state.activeConfig.WELCOME_MESSAGE || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
        FOOTER_MESSAGE: footerInput || state.activeConfig.FOOTER_MESSAGE || "Diabadikan dengan cinta\\nTerima kasih atas doa restunya.",
        ALL_PHOTOS_LABEL: allPhotosLabelInput,
        CUSTOM_CATEGORIES: JSON.stringify(customCategoriesList),
        PHOTOBOOTH_URL: pbUrlVal,
        COVER_SETTINGS: coverSettingsPayload,
        EVENTS: JSON.stringify(state.events),
        DRIVE_FOLDER_ID: driveFolderInput,
        EVENT_LOGO_URL: logoUrlInput,
        logoUrl: logoUrlInput,
        FRAME_IMAGE_URL: frameUrlInput,
        SUPABASE_URL: activeSupaUrl,
        SUPABASE_ANON_KEY: activeSupaKey,
        ADMIN_USERNAME: (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin",
        NEW_PIN: newPinInput
      };

      state.activeConfig = Object.assign({}, state.activeConfig, payload);
      state.customCategories = customCategoriesList;

      // Hapus cache foto untuk kategori yang tautannya berubah
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      customCategoriesList.forEach(function(c) {
        const cName = String(c.name || "").trim();
        const cUrl = String(c.url || "").trim();
        if (state.categoryPhotosUrlMap[cName] !== cUrl) {
          delete state.categoryPhotosMap[cName];
          delete state.categoryPhotosUrlMap[cName];
          try { localStorage.removeItem("WEDDING_CAT_COUNT_" + cName); } catch(e) {}
        }
      });
      state.lastLocalCategoryEditTime = Date.now();

      try {
        localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(customCategoriesList));
        if (pbUrlVal) localStorage.setItem("WEDDING_PHOTOBOOTH_URL", pbUrlVal);
        localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
        localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events));
        localStorage.setItem("WEDDING_EVENT_CFG_" + state.currentEventId, JSON.stringify(state.activeConfig));
      } catch (e) {}

      // Langsung perbarui tampilan visual seketika (Instant UI Update)
      populateConfigToUI(state.activeConfig);
      renderCategoryTabs();

      // Muat ulang foto kategori aktif bila perlu
      if (state.activeCategory && state.activeCategory !== "Semua Foto") {
        const curCat = customCategoriesList.find(function(c) {
          return String((c && c.name) || "").trim().toLowerCase() === state.activeCategory.toLowerCase();
        });
        if (curCat) {
          applyCategoryFilter(curCat.name, curCat.url);
        } else {
          applyCategoryFilter(state.activeCategory);
        }
      }

      // Mulai proses penyimpanan ke database Supabase dengan UI feedback asynchronous
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = \`<span>Menyimpan ke Supabase...</span>\`;
      }
      if (alertBox) {
        alertBox.className = "admin-alert-box";
        alertBox.style.display = "none";
      }

      if (!state.supabaseClient) {
        initSupabaseClient();
      }

      if (state.supabaseClient) {
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
          }

          // Berhasil simpan semua data ke Supabase
          if (newPinInput && newPinInput.length >= 4) {
            state.adminPin = newPinInput;
            try {
              sessionStorage.setItem("WEDDING_ADMIN_PIN", newPinInput);
              localStorage.setItem("WEDDING_ADMIN_PIN", newPinInput);
            } catch(e) {}
            const passEl = document.getElementById("cfgNewAdminPassword");
            if (passEl) passEl.value = "";
            const pinEl = document.getElementById("cfgNewPin");
            if (pinEl) pinEl.value = "";
          }

          if (newAdminUserVal && newAdminPassVal) {
            const uInp = document.getElementById("newAdminUsernameInput");
            const nInp = document.getElementById("newAdminNameInput");
            const pInp = document.getElementById("newAdminPasswordInput");
            if (uInp) uInp.value = "";
            if (nInp) nInp.value = "";
            if (pInp) pInp.value = "";
            loadAdminUsers();
          }

          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
          }
          showToast("✓ Pengaturan berhasil disimpan langsung ke Supabase Realtime Database!");
          closeAdminSettingsModal();

        } catch (err) {
          console.error("⚠️ Gagal menyimpan ke Supabase:", err);
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
          }
          if (alertBox) {
            alertBox.className = "admin-alert-box error";
            alertBox.innerText = "⚠️ Gagal menyimpan ke Supabase: " + (err.message || String(err));
            alertBox.style.display = "block";
          }
          showToast("⚠️ Gagal menyimpan ke Supabase: " + (err.message || String(err)));
        }
      } else {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = \`<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>\`;
        }
        showToast("✓ Pengaturan tersimpan di browser!");
        closeAdminSettingsModal();
      }
    }

    `;

  code = code.substring(0, saveSettingsStartIdx) + newHandleSave + code.substring(saveSettingsEndIdx);
  console.log("✓ Replaced handleSaveAllSettings() with fully asynchronous, robust version");
} else {
  console.log("⚠️ Could not find boundaries for handleSaveAllSettings()!");
}

fs.writeFileSync('js/app.js', code, 'utf8');
console.log("All updates applied to js/app.js successfully!");

