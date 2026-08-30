/**
 * Paste into: Google Sheet → Extensions → Apps Script
 *
 * SETUP:
 * 1. Set SYNC_URL + SYNC_SECRET (same as Vercel env SYNC_SECRET)
 * 2. Run installEditTrigger() once (authorize)
 * 3. Run syncNow() to test
 *
 * Sheet can stay PRIVATE — script PUSHes TSV (no "Anyone with link" needed).
 */

const SYNC_URL = 'https://propfirm-plum.vercel.app/api/sync-firms';
const SYNC_SECRET = 'PASTE_SAME_SECRET_AS_VERCEL'; // never commit real secret to git
const DEBOUNCE_MS = 60 * 1000;
const PLANS_TAB = 'Plans'; // rename if your tab differs (e.g. firm-plans)
const FIRMS_TAB = 'Firms';

function onEditInstallable(e) {
  scheduleSync_();
}

function installEditTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onEditInstallable') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditInstallable').forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getUi().alert('Trigger installed: sync runs ~60s after edits.');
}

function scheduleSync_() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('pendingSync', '1');
  props.setProperty('lastEditAt', String(Date.now()));
  ScriptApp.newTrigger('runSyncIfQuiet_').timeBased().after(DEBOUNCE_MS).create();
}

function runSyncIfQuiet_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('pendingSync') !== '1') return;

  const last = Number(props.getProperty('lastEditAt') || 0);
  if (Date.now() - last < DEBOUNCE_MS - 2000) {
    ScriptApp.newTrigger('runSyncIfQuiet_').timeBased().after(DEBOUNCE_MS).create();
    return;
  }

  props.setProperty('pendingSync', '0');
  cleanupOldTriggers_();
  syncNow();
}

function cleanupOldTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runSyncIfQuiet_') ScriptApp.deleteTrigger(t);
  });
}

function sheetToTsv_(sheet) {
  if (!sheet) return '';
  const values = sheet.getDataRange().getDisplayValues();
  return values
    .map(function (row) {
      return row
        .map(function (cell) {
          return String(cell).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
        })
        .join('\t');
    })
    .join('\n');
}

function findSheet_(ss, name) {
  var exact = ss.getSheetByName(name);
  if (exact) return exact;
  // fuzzy: first sheet if Plans missing
  if (name === PLANS_TAB) return ss.getSheets()[0];
  return null;
}

/** Manual run from Apps Script editor (Run → syncNow) */
function syncNow() {
  if (!SYNC_SECRET || SYNC_SECRET.indexOf('PASTE_') === 0) {
    throw new Error('Set SYNC_SECRET in this script to match Vercel SYNC_SECRET');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var plansSheet = findSheet_(ss, PLANS_TAB);
  var firmsSheet = findSheet_(ss, FIRMS_TAB);
  var plansTsv = sheetToTsv_(plansSheet);
  var firmsTsv = sheetToTsv_(firmsSheet);

  if (!plansTsv || plansTsv.indexOf('Firm') !== 0) {
    throw new Error('Plans tab missing or header row must start with Firm');
  }

  var res = UrlFetchApp.fetch(SYNC_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + SYNC_SECRET,
    },
    payload: JSON.stringify({
      source: 'google-apps-script',
      at: new Date().toISOString(),
      plansTsv: plansTsv,
      firmsTsv: firmsTsv || '',
    }),
    muteHttpExceptions: true,
  });

  var code = res.getResponseCode();
  var body = res.getContentText();
  Logger.log(code + ' ' + body);

  if (code < 200 || code >= 300) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Sync failed: ' + code, 'PropFirm Sync', 8);
    throw new Error('Sync failed: ' + code + ' ' + body);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Sheet synced to site', 'PropFirm Sync', 5);
}
