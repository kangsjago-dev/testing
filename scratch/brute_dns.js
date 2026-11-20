const dns = require('dns').promises;
const base = 'faszgrkwdlqxbppownh';
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

async function testSubstitutions() {
  console.log('Testing 665 substitutions of 1 character...');
  const promises = [];
  const found = [];

  for (let i = 0; i < base.length; i++) {
    for (let c of chars) {
      if (c === base[i]) continue;
      const candidate = base.slice(0, i) + c + base.slice(i + 1);
      const host = candidate + '.supabase.co';
      promises.push(
        dns.lookup(host).then(res => {
          console.log(`\n🎉 MATCH FOUND: ${host} -> ${res.address}`);
          found.push({ host, ip: res.address });
        }).catch(() => {})
      );
    }
  }

  await Promise.all(promises);
  console.log('Finished testing substitutions. Total found:', found.length);
}

testSubstitutions();
