/**
 * Paste into: Google Sheet → Extensions → Apps Script
 *
 * SETUP:
 * 1. Set SYNC_URL and SYNC_SECRET below (same secret as Vercel env SYNC_SECRET)
 * 2. Save → Triggers → Add trigger:
 *      Function: onEditDebounced
 *      Event: From spreadsheet → On edit
 *    OR use installable trigger for onEditInstallable (recommended)
 * 3. Share sheet: Anyone with the link → Viewer
 *    (so Vercel can export TSV)
 *
 * Flow: edit sheet → wait 60s → POST /api/sync-firms → Vercel pulls sheet + validates
 */

const SYNC_URL = 'https://propfirm-plum.vercel.app/api/sync-firms';
const SYNC_SECRET = 'PASTE_SAME_SECRET_AS_VERCEL'; // never commit real secret to git
const DEBOUNCE_MS = 60 * 1000; // wait 60s after last edit

function onEditInstallable(e) {
  scheduleSync_();
}

/** Call once from the Apps Script editor to install the trigger */
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

  // Clear previous delayed executions with same name is not available;
  // use Lock + timestamp check inside runSyncIfQuiet_
  ScriptApp.newTrigger('runSyncIfQuiet_')
    .timeBased()
    .after(DEBOUNCE_MS)
    .create();
}

function runSyncIfQuiet_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('pendingSync') !== '1') return;

  const last = Number(props.getProperty('lastEditAt') || 0);
  if (Date.now() - last < DEBOUNCE_MS - 2000) {
    // Still editing — schedule again
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

/** Manual run from Apps Script editor (Run → syncNow) */
function syncNow() {
  if (!SYNC_SECRET || SYNC_SECRET.indexOf('PASTE_') === 0) {
    throw new Error('Set SYNC_SECRET in this script to match Vercel SYNC_SECRET');
  }

  const res = UrlFetchApp.fetch(SYNC_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + SYNC_SECRET,
    },
    payload: JSON.stringify({ source: 'google-apps-script', at: new Date().toISOString() }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const body = res.getContentText();
  Logger.log(code + ' ' + body);

  if (code < 200 || code >= 300) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Sync failed: ' + code, 'PropFirm Sync', 8);
    throw new Error('Sync failed: ' + code + ' ' + body);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Sheet synced to site', 'PropFirm Sync', 5);
}
