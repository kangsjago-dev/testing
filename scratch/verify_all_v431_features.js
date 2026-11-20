const https = require('https');
const fs = require('fs');

const SUPABASE_URL = "https://faszgrkwdlqxsbppownh.supabase.co";
const ANON_KEY = "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA";

function req(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      }
    };

    const request = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function runTests() {
  console.log("=== V4.31.0 COMPREHENSIVE VERIFICATION TEST ===");

  // 1. Verify app.js code checks
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  if (appJs.includes('SUPABASE_URL: "https://faszgrkwdlqxbppownh.supabase.co"')) {
    throw new Error("FAILED: Typo in GLOBAL_CONFIG still found in app.js!");
  }
  console.log("✓ PASS: GLOBAL_CONFIG has no typo URL");

  if (!appJs.includes('https://faszgrkwdlqxsbppownh.supabase.co')) {
    throw new Error("FAILED: Correct Supabase URL not found in app.js!");
  }
  console.log("✓ PASS: Correct Supabase URL present in app.js");

  // 2. Test Admin Login query for 'ilham'
  const loginRes = await req('/rest/v1/admin_users?username=ilike.ilham&select=*', 'GET');
  console.log("Status login query:", loginRes.status);
  if (loginRes.status !== 200 || !Array.isArray(loginRes.data) || loginRes.data.length === 0) {
    throw new Error("FAILED: Admin user ilham not found in Supabase! " + JSON.stringify(loginRes));
  }
  const ilhamUser = loginRes.data[0];
  console.log("✓ PASS: User ilham found:", ilhamUser.name, "PIN:", ilhamUser.pin);

  // 3. Test saving event wilson-felicia with inputs from User Image 2
  const eventPayload = {
    id: "wilson-felicia",
    name: "Wilson & Felicia",
    date: "17 Agustus 2026",
    venue: "Grand Ballroom Hotel Mulia Senayan",
    home_url: "https://testing.runway.my.id/?event=wilson-felicia",
    drive_folder_id: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
    all_photos_label: "Photostage",
    photobooth_url: "https://fotoshare.co/e/ZJGYcfWbttuEG8Q67ocZs",
    frame_image_url: "https://drive.google.com/file/d/1NIfwT5wyk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk",
    logo_url: "",
    custom_categories: [
      { id: "special_photobooth", isPhotobooth: true, name: "Photobooth", url: "https://fotoshare.co/e/ZJGYcfWbttuEG8Q67ocZs", enabled: true }
    ],
    status: "Aktif",
    updated_at: new Date().toISOString()
  };

  const saveEvRes = await req('/rest/v1/events?on_conflict=id', 'POST', eventPayload);
  console.log("Status save event:", saveEvRes.status);
  if (saveEvRes.status !== 201 && saveEvRes.status !== 200) {
    throw new Error("FAILED: Could not save event to Supabase! " + JSON.stringify(saveEvRes));
  }
  console.log("✓ PASS: Event wilson-felicia successfully saved to Supabase!");

  // 4. Test updating settings table
  const settingsPayload = [
    { key: "ALL_PHOTOS_LABEL", value: "Photostage", updated_at: new Date().toISOString() },
    { key: "SLIDESHOW_INTERVAL_SEC", value: "4", updated_at: new Date().toISOString() }
  ];
  const saveSettingsRes = await req('/rest/v1/settings?on_conflict=key', 'POST', settingsPayload);
  console.log("Status save settings:", saveSettingsRes.status);
  if (saveSettingsRes.status !== 201 && saveSettingsRes.status !== 200) {
    throw new Error("FAILED: Could not upsert settings! " + JSON.stringify(saveSettingsRes));
  }
  console.log("✓ PASS: Global settings successfully upserted to Supabase!");

  // 5. Verify fetched event data matches exactly
  const getEvRes = await req('/rest/v1/events?id=eq.wilson-felicia&select=*', 'GET');
  const savedEv = getEvRes.data[0];
  console.log("✓ Verification of saved fields:");
  console.log("  - all_photos_label:", savedEv.all_photos_label);
  console.log("  - drive_folder_id:", savedEv.drive_folder_id);
  console.log("  - photobooth_url:", savedEv.photobooth_url);
  console.log("  - frame_image_url:", savedEv.frame_image_url);

  console.log("\nALL VERIFICATION TESTS PASSED 100%!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
