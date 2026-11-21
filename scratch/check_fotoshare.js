fetch('https://fotoshare.co/e/ZJGYcfWbttuEG8Q67ocZs', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}).then(r => r.text()).then(html => {
  console.log('HTML length:', html.length);
  console.log('sessionImages match:', html.includes('sessionImages'));
  console.log('cdn-bz-op match:', html.includes('cdn-bz-op.fotoshare.co'));
  // Look for any image URLs
  const imgUrls = html.match(/https:\/\/[^"'\s<>]+\.(jpg|jpeg|png|webp)/gi) || [];
  console.log('Total img URLs in HTML:', imgUrls.length);
  if (imgUrls.length > 0) {
    console.log('First 5 img URLs:', imgUrls.slice(0, 5));
  }
  // Look for JSON or variables in script tags
  const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log('Total script tags:', scripts.length);
  scripts.forEach((s, idx) => {
    if (s.includes('data') || s.includes('images') || s.includes('photos') || s.includes('event')) {
      console.log(`Script ${idx}: len=${s.length}, snippet=${s.substring(0, 200).replace(/\n/g, ' ')}`);
    }
  });
}).catch(console.error);
