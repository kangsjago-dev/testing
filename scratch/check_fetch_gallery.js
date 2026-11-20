const fs = require('fs');
const code = fs.readFileSync('js/app.js', 'utf8');

const fnIdx = code.indexOf('function fetchGalleryData(');
const dfIdx = code.indexOf('/api/drive-folder?folderId=', fnIdx);
console.log(code.substring(dfIdx + 800, dfIdx + 2000));
