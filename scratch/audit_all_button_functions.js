const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');

const functionsToAudit = [
  'dismissDownloadWidget',
  'openShareModal',
  'fetchGalleryData',
  'openAdminModal',
  'startSlideshowFromCurrent',
  'closeLightbox',
  'navigateLightbox',
  'handleCurrentLightboxDownload',
  'prevSlide',
  'togglePlayPause',
  'nextSlide',
  'closeSlideshow',
  'closeShareModal',
  'shareViaWebShare',
  'copyShareUrl',
  'downloadQrCodeImage',
  'closeAdminLoginModal',
  'togglePasswordVisibility',
  'handleAdminLogin',
  'handleTestGallery',
  'closeAdminSettingsModal',
  'switchAdminTab',
  'openNewEventModal',
  'handleDeleteCurrentEvent',
  'copyActiveEventUrl',
  'openActiveEventHome',
  'addCategoryConfigRow',
  'syncCategoriesAndDisplayLinks',
  'handleChangeAdminPassword',
  'handleAddAdminUser',
  'handleDeleteAdminUser',
  'handleTestSupabaseConnection',
  'handleRefreshFromSupabase',
  'handleAdminLogout',
  'handleSaveAllSettings',
  'openAdminSettingsModal',
  'closeNewEventModal',
  'confirmAddNewEvent',
  'handleSyncDrivePhotosDirectly',
  'syncSingleCategory',
  'handleAllPhotosLabelChange',
  'handleEventDriveFolderInput'
];

console.log("=== AUDIT OF ALL ONCLICK FUNCTIONS IN APP.JS ===");
functionsToAudit.forEach(fn => {
  const isDefined = content.includes('function ' + fn) || content.includes(fn + ' = function') || content.includes('window.' + fn + ' =');
  const usesGas = content.substring(content.indexOf(fn), content.indexOf(fn) + 1500).includes('callBackend');
  console.log(`${fn.padEnd(32)}: ${isDefined ? 'DEFINED' : 'MISSING!'} ${usesGas ? '[WARNING: USES callBackend / GAS!]' : '[OK]'}`);
});

