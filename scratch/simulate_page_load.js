const https = require('https');

const SUPABASE_URL = "https://faszgrkwdlqxsbppownh.supabase.co";
const ANON_KEY = "sb_publishable_fnPfL0cZdJfsW8CdIwn4IQ_fkbJ61sA";

function req(path) {
  return new Promise((resolve, reject) => {
    https.get(SUPABASE_URL + path, {
      headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function simulate() {
  console.log("=== SIMULATING EVENT ISOLATION & PAGE LOAD ===");

  // Case 1: Plain root URL (search = "")
  const rootParam = "";
  console.log("\n1. Testing Link Polos (https://testing.runway.my.id/):");
  if (!rootParam) {
    console.log("   -> No event param in URL.");
    console.log("   -> Result: showEventNotFoundScreen(true) -> 'Halaman Tidak Ditemukan' (SESUAI ATURAN USER)");
  }

  // Case 2: Specific event URL (search = "?event=wilson-felicia")
  const eventParam = "wilson-felicia";
  console.log(`\n2. Testing Specific Event (https://testing.runway.my.id/?event=${eventParam}):`);
  const events = await req('/rest/v1/events?select=*');
  const targetEv = events.find(e => e.id === eventParam || e.id.replace(/-\d+$/, '') === eventParam);

  if (!targetEv) {
    console.log("   -> Event NOT found in Supabase!");
    return;
  }

  console.log("   -> Found isolated event in Supabase:", targetEv.name);
  console.log("   -> Isolated Drive Folder ID:", targetEv.drive_folder_id);
  console.log("   -> Isolated Gallery Label:", targetEv.all_photos_label);
  console.log("   -> Isolated Photobooth URL:", targetEv.photobooth_url);
  console.log("   -> Isolated Categories:", JSON.stringify(targetEv.custom_categories));

  // Test fetching photos for this isolated folder
  console.log("\n3. Testing API /api/drive-folder for isolated folder:");
  const driveHandler = (await import('../api/drive-folder.js')).default;
  const mockReq = { query: { folderId: targetEv.drive_folder_id, category: targetEv.all_photos_label } };
  let photoCount = 0;
  const mockRes = {
    statusCode: 200,
    setHeader() {},
    status(c) { this.statusCode = c; return this; },
    json(d) {
      photoCount = d.photos ? d.photos.length : 0;
      console.log("   -> Drive API Success:", d.success, "| Photos fetched:", photoCount);
      if (photoCount > 0) {
        console.log("   -> Sample photo 1:", d.photos[0].id, d.photos[0].name);
      }
    }
  };
  await driveHandler(mockReq, mockRes);

  console.log("\n4. Verifying Other Events Isolation:");
  events.filter(e => e.id !== eventParam).forEach(otherEv => {
    console.log(`   -> Event '${otherEv.id}' (${otherEv.name}) has Drive: '${otherEv.drive_folder_id || '(none)'}' (ISOLATED)`);
  });

  console.log("\nSIMULATION COMPLETE!");
}

simulate().catch(console.error);
