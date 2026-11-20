async function t() {
  const url = 'https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  console.log('fotoshare status:', res.status);
  const html = await res.text();
  console.log('fotoshare length:', html.length);
  const m = html.match(/https:\/\/[^"']+\.(?:jpg|jpeg|png|webp)/gi);
  console.log('images found in html:', (m || []).length);
}
t();

