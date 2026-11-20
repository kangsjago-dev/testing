const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');

const markers = [
  'const GLOBAL_CONFIG = {',
  'document.addEventListener("DOMContentLoaded"',
  'function handleAdminLogin(e)',
  'function getSupabaseConfig()',
  'function saveEventToSupabase',
  'MANAJEMEN PENGGUNA ADMIN',
  'ADMIN USER & PASSWORD MANAGEMENT',
  'function handleChangeAdminPassword()',
  'function handleAddAdminUser()',
  'function handleSaveAllSettings()'
];

markers.forEach(m => {
  const idx = content.indexOf(m);
  if (idx !== -1) {
    const lineNo = content.substring(0, idx).split('\n').length;
    console.log(m + ' -> line ' + lineNo);
  } else {
    console.log('NOT FOUND: ' + m);
  }
});

