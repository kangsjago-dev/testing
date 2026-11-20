const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

console.log('Original js/app.js length:', code.length);

// 1. NEUTRALIZE callBackend completely
const callBackendStart = code.indexOf('function callBackend(action, payload, onSuccess, onError) {');
if (callBackendStart !== -1) {
  let depth = 0;
  let callBackendEnd = -1;
  for (let i = callBackendStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) {
        callBackendEnd = i + 1;
        break;
      }
    }
  }
  if (callBackendEnd !== -1) {
    const replacement = `function callBackend(action, payload, onSuccess, onError) {
      console.warn("⚠️ [TERISOLASI] Panggilan ke Google Apps Script (callBackend:" + action + ") dinonaktifkan permanen untuk mencegah perubahan pada website lain.");
      if (onError) onError(new Error("Google Apps Script telah diputus total. Sistem murni menggunakan Supabase."));
    }`;
    code = code.substring(0, callBackendStart) + replacement + code.substring(callBackendEnd);
    console.log('✓ callBackend neutralized successfully');
  }
}

// 2. Fix handleDeleteEvent to use deleteEventFromSupabase
const oldDeleteEventRegex = /\/\/ 1\. Coba panggil action deleteEvent ke backend[\s\S]*?finalizeEventDeletion\(updatedEvents, nextId\);\s*\}\s*catch\(e\)\s*\{\s*\}\s*\}/;
// Let's find handleDeleteEvent block
const hdeIdx = code.indexOf('function handleDeleteEvent(');
if (hdeIdx !== -1) {
  const hdeEnd = code.indexOf('function finalizeEventDeletion', hdeIdx);
  // Let's check between hdeIdx and hdeEnd
  console.log('handleDeleteEvent found at:', hdeIdx);
}

// Let's inspect handleDeleteEvent precisely
const fs2 = require('fs');
fs2.writeFileSync('scratch/debug_hde.txt', code.substring(code.indexOf('function handleDeleteEvent('), code.indexOf('function handleDeleteEvent(') + 3000));
console.log('Written debug_hde.txt');

