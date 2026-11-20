async function t() {
  const url = 'https://drive.google.com/embeddedfolderview?id=1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5#grid';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  console.log('status:', res.status);
  const html = await res.text();
  console.log('html length:', html.length);
  const entryRegex = /class="flip-entry"\s+id="entry-([a-zA-Z0-9_\-]+)"/g;
  let m;
  let count = 0;
  while ((m = entryRegex.exec(html)) !== null) {
    count++;
    if (count <= 3) console.log('Sample file ID:', m[1]);
  }
  console.log('Total entries found:', count);
}
t();

