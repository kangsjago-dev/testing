const fs = require('fs');
const appJsPath = 'js/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

const startTarget = '    function syncFromSpreadsheetGViz(callback) {\n      // Single Source of Truth: Supabase menggantikan polling Google Sheets GViz';
const endTarget = '        .finally(function() {\n          if (callback) callback();\n        });\n    }';

const startIndex = content.indexOf(startTarget);
const endIndex = content.indexOf(endTarget);

console.log("Found indices:", startIndex, endIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `    function syncFromSpreadsheetGViz(callback) {
      // Single Source of Truth: Supabase menggantikan seluruh pembacaan Google Sheets GViz
      if (state.supabaseClient) {
        fetchEventsFromSupabase(function() {
          if (callback) callback();
        });
        return;
      }
      if (callback) callback();
    }`;

  content = content.substring(0, startIndex) + replacement + content.substring(endIndex + endTarget.length);
  fs.writeFileSync(appJsPath, content, 'utf8');
  console.log("✓ Successfully replaced syncFromSpreadsheetGViz block!");
} else {
  console.error("Target not found!");
}

