const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

const targetStr = `            if (res.error) {
              if (alertBox) {
                alertBox.innerText = "Gagal memverifikasi ke Supabase: " + res.error.message;
                alertBox.style.display = "block";
              }
              return;
            }`;

const replacementStr = `            if (res.error) {
              if (alertBox) {
                let msg = res.error.message || "";
                if (msg.includes("NetworkError") || msg.includes("Failed to fetch") || msg.includes("fetch")) {
                  msg = "Koneksi ke Supabase gagal (NetworkError). Periksa apakah Project URL & Anon Key Supabase sudah benar dan project Supabase aktif.";
                }
                alertBox.innerText = "Gagal memverifikasi ke Supabase: " + msg;
                alertBox.style.display = "block";
              }
              return;
            }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  console.log("✓ Replaced res.error message block in handleAdminLogin");
} else {
  console.log("✗ Target string not found");
}

const targetCatch = `          .catch(function(err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = \`<span>Masuk</span>\`;
            if (alertBox) {
              alertBox.innerText = "Koneksi Supabase gagal: " + (err.message || err);
              alertBox.style.display = "block";
            }
          });`;

const replacementCatch = `          .catch(function(err) {
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

if (code.includes(targetCatch)) {
  code = code.replace(targetCatch, replacementCatch);
  console.log("✓ Replaced catch message block in handleAdminLogin");
}

fs.writeFileSync('js/app.js', code, 'utf8');

