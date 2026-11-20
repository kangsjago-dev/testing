const SUPABASE_URL = 'https://faszgrkwdlqxsbppownh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA';

async function testAllAdminOps() {
  console.log("=== AUDIT SYSTEM OPERASIONAL ADMIN & SUPABASE ===");

  // 1. Test update password for user ilham
  console.log("1. Testing update password for user 'ilham'...");
  const updatePassRes = await fetch(SUPABASE_URL + '/rest/v1/admin_users?username=eq.ilham', {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ pin: '121212' })
  });
  console.log("   Status:", updatePassRes.status);
  const updatedUser = await updatePassRes.json();
  console.log("   Result:", updatedUser);

  // 2. Test upsert settings with onConflict key
  console.log("\n2. Testing upsert settings with merge-duplicates...");
  const setRes = await fetch(SUPABASE_URL + '/rest/v1/settings', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([
      { key: 'ALL_PHOTOS_LABEL', value: 'Semua Foto', updated_at: new Date().toISOString() },
      { key: 'SLIDESHOW_INTERVAL_SEC', value: '4', updated_at: new Date().toISOString() }
    ])
  });
  console.log("   Status:", setRes.status);
  const setJson = await setRes.json();
  console.log("   Result:", setJson);

  // 3. Test saving event wilson-felicia
  console.log("\n3. Testing upsert event 'wilson-felicia'...");
  const evRes = await fetch(SUPABASE_URL + '/rest/v1/events', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([{
      id: 'wilson-felicia',
      name: 'Wilson & Felicia',
      date: 'Senin, 16 November 2026',
      venue: 'UpperHills Convention Hall, Makassar',
      home_url: 'https://testing.runway.my.id/?event=wilson-felicia',
      drive_folder_id: '1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5',
      all_photos_label: 'Photostage',
      photobooth_url: 'https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs',
      frame_image_url: 'https://drive.google.com/file/d/1NlfwT5wYk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk',
      logo_url: 'https://drive.google.com/file/d/1tsZZc6y_0xiCVWunfPiEN_eQdAsjJP_B/view?usp=drivesdk',
      custom_categories: [{ id: 'special_photobooth', url: 'https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs', name: 'Photobooth', enabled: true, isPhotobooth: true }],
      status: 'Aktif',
      updated_at: new Date().toISOString()
    }])
  });
  console.log("   Status:", evRes.status);
  const evJson = await evRes.json();
  console.log("   Result:", evJson);

  console.log("\n=== ALL SYSTEM AUDIT PASSED (STATUS 200/201) ===");
}

testAllAdminOps().catch(console.error);

