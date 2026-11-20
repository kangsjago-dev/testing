const SUPABASE_URL = 'https://faszgrkwdlqxsbppownh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA';

async function testSaveFlow() {
  // 1. Fetch current event from Supabase
  const res = await fetch(SUPABASE_URL + '/rest/v1/events?id=eq.wilson-felicia', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const data = await res.json();
  const currentEv = data[0];
  console.log('Current event in Supabase:', currentEv.id, currentEv.name);

  // 2. Simulate what saveEventToSupabase sends
  const row = {
    id: currentEv.id,
    name: currentEv.name || "",
    date: currentEv.date || "",
    venue: currentEv.venue || "",
    home_url: currentEv.home_url || "",
    drive_folder_id: currentEv.drive_folder_id || "",
    all_photos_label: currentEv.all_photos_label || "Semua Foto",
    photobooth_url: currentEv.photobooth_url || "",
    frame_image_url: currentEv.frame_image_url || "",
    logo_url: currentEv.logo_url || "",
    custom_categories: currentEv.custom_categories || [],
    status: currentEv.status || "Aktif",
    updated_at: new Date().toISOString()
  };

  console.log('Sending row to Supabase upsert...');
  const upsertRes = await fetch(SUPABASE_URL + '/rest/v1/events', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([row])
  });

  console.log('Upsert status:', upsertRes.status);
  const upsertData = await upsertRes.text();
  console.log('Upsert response:', upsertData);
}

testSaveFlow().catch(console.error);

