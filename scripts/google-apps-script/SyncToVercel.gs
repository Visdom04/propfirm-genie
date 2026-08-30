/**
 * Paste into: Google Sheet → Extensions → Apps Script
 *
 * SETUP:
 * 1. Set SYNC_URL + SYNC_SECRET (same as Vercel env SYNC_SECRET)
 * 2. Run installEditTrigger() once (authorize)
 * 3. Reload sheet → menu "PropFirm Sync" appears
 * 4. Run syncNow() to test
 *
 * Sheet can stay PRIVATE — script PUSHes TSV (no "Anyone with link" needed).
 *
 * IMPORT:
 * Menu → PropFirm Sync → Import plans from URL
 * Fetches PLANS_TSV_URL (public/data/firm-plans.tsv on Vercel after deploy)
 * and replaces the Plans tab, then optionally syncs to site.
 */

const SYNC_URL = 'https://propfirm-plum.vercel.app/api/sync-firms';
const SYNC_SECRET = 'PASTE_SAME_SECRET_AS_VERCEL'; // never commit real secret to git
const DEBOUNCE_MS = 60 * 1000;
const PLANS_TAB = 'firm-plans'; // rename if your tab differs (e.g. Plans)
const FIRMS_TAB = 'Firms';

/**
 * Public TSV after commit+deploy.
 * Fallback: GitHub raw on your branch if Vercel not updated yet.
 */
const PLANS_TSV_URL = 'https://propfirm-plum.vercel.app/data/firm-plans.tsv';
const PLANS_TSV_URL_FALLBACK =
  'https://raw.githubusercontent.com/mayur5689/propfirm/Visdom04/feat/demo-page-brand-kit/scripts/firm-plans.tsv';

/** Extended H2H columns — append if missing (safe, does not wipe data). */
const EXTENDED_HEADERS = [
  'Account Category',
  'Min Trading Days',
  'Daily Drawdown',
  'News Trading',
  'List Price',
  'Discount %',
];

const CORE_HEADERS = [
  'Firm',
  'Plan Type',
  'Account Size',
  'Drawdown Type',
  'Activation Fee',
  'Profit Target',
  'Max Drawdown',
  'Max Contract',
  'Consistency Rule Eval, Funded',
  'Payout Freq.',
  'Profit Split',
  'Price',
  'Promo CODE',
];

/** Sheet menu (reload spreadsheet after pasting script) */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PropFirm Sync')
    .addItem('Import plans from URL', 'importPlansFromUrl')
    .addItem('Ensure extended columns', 'ensureExtendedColumns')
    .addItem('Fix validation / ghost cols', 'fixSheetValidations')
    .addItem('Sync sheet → site now', 'syncNow')
    .addSeparator()
    .addItem('Install edit auto-sync', 'installEditTrigger')
    .addToUi();
}

/** Hard wipe validations + filters (clearContents alone leaves ghost dropdowns). */
function nukeSheetMeta_(sheet) {
  if (!sheet) return;
  try {
    var filter = sheet.getFilter();
    if (filter) filter.remove();
  } catch (e) {}
  // Sheet.clear = content + formatting + data validations
  sheet.clear();
}

function applyDropdowns_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var existing = {};
  headers.forEach(function (h, i) {
    var name = String(h || '').trim();
    if (name) existing[name] = i + 1;
  });

  var lastRow = Math.max(sheet.getLastRow(), 2);

  // ONLY these two — never Min Days / Daily DD / List / Discount
  if (existing['Account Category']) {
    sheet
      .getRange(2, existing['Account Category'], lastRow, existing['Account Category'])
      .setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(['Challenge', 'S2F'], true)
          .setAllowInvalid(true)
          .build()
      );
  }
  if (existing['News Trading']) {
    sheet
      .getRange(2, existing['News Trading'], lastRow, existing['News Trading'])
      .setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(['both', 'eval', 'none'], true)
          .setAllowInvalid(true)
          .build()
      );
  }
  return existing;
}

function ensureExtendedHeaders_(sheet) {
  if (!sheet) return;
  // Do NOT sheet.clear() here — would wipe data. Only strip validations on used+ghost area.
  try {
    var filter = sheet.getFilter();
    if (filter) filter.remove();
  } catch (e) {}
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var existing = {};
  headers.forEach(function (h, i) {
    var name = String(h || '').trim();
    if (name) existing[name] = i + 1;
  });

  // If Max Contract header missing / blank col H, force full header row from known schema
  if (!existing['Max Contract'] || !String(headers[7] || '').trim()) {
    var expected = CORE_HEADERS.concat(EXTENDED_HEADERS);
    var width = Math.max(lastCol, expected.length);
    var row = [];
    for (var c = 0; c < width; c++) {
      row.push(expected[c] || '');
    }
    sheet.getRange(1, 1, 1, width).setValues([row]);
  }

  lastCol = Math.max(sheet.getLastColumn(), 1);
  headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  existing = {};
  headers.forEach(function (h, i) {
    var name = String(h || '').trim();
    if (name) existing[name] = i + 1;
  });

  EXTENDED_HEADERS.forEach(function (name) {
    if (existing[name]) return;
    var nextCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, nextCol).setValue(name);
    existing[name] = nextCol;
  });

  var realLast = 0;
  Object.keys(existing).forEach(function (k) {
    if (existing[k] > realLast) realLast = existing[k];
  });
  if (realLast > 0 && sheet.getMaxColumns() > realLast) {
    sheet.getRange(1, realLast + 1, sheet.getMaxRows(), sheet.getMaxColumns()).clear();
  }

  applyDropdowns_(sheet);
}

/** Fix red triangles + empty header cols without full re-import */
function fixSheetValidations() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var plansSheet = findSheet_(ss, PLANS_TAB);
  if (!plansSheet) throw new Error('Plans tab not found');
  ensureExtendedHeaders_(plansSheet);
  SpreadsheetApp.getUi().alert(
    'Cleared ALL dropdowns, fixed headers if needed. Only Account Category (Challenge/S2F) + News Trading (both/eval/none) have lists now.'
  );
}

/** One-time: add extended compare columns + dropdowns on Plans tab */
function ensureExtendedColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var plansSheet = findSheet_(ss, PLANS_TAB);
  if (!plansSheet) throw new Error('Plans tab not found');
  ensureExtendedHeaders_(plansSheet);
  SpreadsheetApp.getUi().alert(
    'Extended columns ready on Plans tab. Fill Min Trading Days / Daily Drawdown / News Trading / List Price / Discount %, then syncNow().'
  );
}

/**
 * Fetch PLANS_TSV_URL → DELETE+recreate Plans tab (kills ghost validations) → syncNow.
 */
function importPlansFromUrl() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Import plans from URL?',
    'This DELETES and recreates the "' +
      PLANS_TAB +
      '" tab from:\n' +
      PLANS_TSV_URL +
      '\n\nThen syncs to the site. Continue?',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  var text = fetchPlansTsv_();
  var grid = tsvToGrid_(text);
  if (!grid.length || String(grid[0][0]).trim() !== 'Firm') {
    throw new Error('Downloaded TSV invalid — first cell must be Firm');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = recreatePlansSheet_(ss);
  sheet.getRange(1, 1, grid.length, grid[0].length).setValues(grid);
  applyDropdowns_(sheet);

  ui.alert('Imported ' + (grid.length - 1) + ' plan rows into a fresh tab. Syncing to site…');
  syncNow();
}

/** Delete firm-plans tab and insert clean one (only way to kill stubborn validations). */
function recreatePlansSheet_(ss) {
  var old = findSheet_(ss, PLANS_TAB);
  var idx = old ? old.getIndex() : 1;
  if (old) {
    if (ss.getSheets().length === 1) {
      ss.insertSheet('_tmp_keep_');
    }
    ss.deleteSheet(old);
  }
  var sheet = ss.insertSheet(PLANS_TAB, Math.max(idx - 1, 0));
  var tmp = ss.getSheetByName('_tmp_keep_');
  if (tmp) ss.deleteSheet(tmp);
  return sheet;
}

function fetchPlansTsv_() {
  var urls = [PLANS_TSV_URL, PLANS_TSV_URL_FALLBACK];
  var lastErr = '';
  for (var i = 0; i < urls.length; i++) {
    try {
      var res = UrlFetchApp.fetch(urls[i], { muteHttpExceptions: true, followRedirects: true });
      var code = res.getResponseCode();
      var body = res.getContentText();
      if (code >= 200 && code < 300 && body && body.indexOf('Firm') === 0) {
        Logger.log('Imported from ' + urls[i]);
        return body;
      }
      lastErr = urls[i] + ' → HTTP ' + code;
    } catch (e) {
      lastErr = urls[i] + ' → ' + e;
    }
  }
  throw new Error(
    'Could not fetch plans TSV. Deploy/push first so URL exists.\nTried: ' + urls.join('\n') + '\nLast: ' + lastErr
  );
}

function tsvToGrid_(text) {
  var lines = String(text)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(function (l) {
      return l.trim().length > 0;
    });
  var rows = lines.map(function (line) {
    return line.split('\t');
  });
  var width = 0;
  rows.forEach(function (r) {
    if (r.length > width) width = r.length;
  });
  return rows.map(function (r) {
    while (r.length < width) r.push('');
    return r;
  });
}

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
  ensureExtendedHeaders_(plansSheet);
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
