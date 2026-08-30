/**
 * Paste into: Google Sheet → Extensions → Apps Script
 *
 * SETUP:
 * 1. Set SYNC_URL + SYNC_SECRET (same as Vercel env SYNC_SECRET)
 * 2. Run installEditTrigger() once (authorize)
 * 3. Reload sheet → menu "PropFirm Sync" appears
 * 4. Run syncNow() to test
 *
 * IMPORT: Menu → Import plans from URL
 * DIAGNOSE: Menu → Diagnose sheet (logs header + validation map)
 *
 * IMPORTANT: Do NOT click Google Sheets "Convert to table".
 * Tables auto-add dropdowns → red "Invalid input" triangles.
 * We no longer auto-apply data validation (was a root cause of red flags).
 */

const SYNC_URL = 'https://propfirm-plum.vercel.app/api/sync-firms';
const SYNC_SECRET = 'PASTE_SAME_SECRET_AS_VERCEL'; // never commit real secret to git
const DEBOUNCE_MS = 60 * 1000;
const PLANS_TAB = 'firm-plans'; // rename if your tab differs (e.g. Plans)
const FIRMS_TAB = 'Firms';

const PLANS_TSV_URL = 'https://propfirm-plum.vercel.app/data/firm-plans.tsv';
const PLANS_TSV_URL_FALLBACK =
  'https://raw.githubusercontent.com/mayur5689/propfirm/Visdom04/feat/demo-page-brand-kit/scripts/firm-plans.tsv';

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

const EXTENDED_HEADERS = [
  'Account Category',
  'Min Trading Days',
  'Daily Drawdown',
  'News Trading',
  'List Price',
  'Discount %',
];

const EXPECTED_HEADERS = CORE_HEADERS.concat(EXTENDED_HEADERS);

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PropFirm Sync')
    .addItem('Import plans from URL', 'importPlansFromUrl')
    .addItem('Diagnose sheet (find issues)', 'diagnoseSheet')
    .addItem('Strip ALL dropdowns', 'stripAllDropdowns')
    .addItem('Ensure header names only', 'ensureHeaderNamesOnly')
    .addItem('Sync sheet → site now', 'syncNow')
    .addSeparator()
    .addItem('Install edit auto-sync', 'installEditTrigger')
    .addToUi();
}

/** Log every header + whether that column has data-validation (root-cause tool). */
function diagnoseSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheet_(ss, PLANS_TAB);
  if (!sheet) throw new Error('Plans tab not found');

  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var lines = [];
  lines.push('Rows=' + lastRow + ' Cols=' + lastCol);
  lines.push('Expected headers (' + EXPECTED_HEADERS.length + '): ' + EXPECTED_HEADERS.join(' | '));
  lines.push('---');

  var blankHeader = [];
  var unexpected = [];
  for (var c = 0; c < lastCol; c++) {
    var name = String(headers[c] || '').trim();
    var colLetter = columnToLetter_(c + 1);
    var rules = sheet.getRange(2, c + 1, Math.min(lastRow, 5), c + 1).getDataValidations();
    var hasVal = false;
    var sampleRule = '';
    for (var r = 0; r < rules.length; r++) {
      if (rules[r][0]) {
        hasVal = true;
        try {
          sampleRule = JSON.stringify(rules[r][0].getCriteriaType()) + ' ' + JSON.stringify(rules[r][0].getCriteriaValues());
        } catch (e) {
          sampleRule = String(e);
        }
        break;
      }
    }
    if (!name && c < EXPECTED_HEADERS.length) blankHeader.push(colLetter);
    if (name && EXPECTED_HEADERS.indexOf(name) < 0) unexpected.push(colLetter + ':' + name);
    if (c >= EXPECTED_HEADERS.length && !name) {
      // ghost col past schema
      if (hasVal) lines.push(colLetter + ' GHOST+DROPDOWN ' + sampleRule);
    } else {
      lines.push(
        colLetter +
          '\t' +
          (name || '(BLANK)') +
          '\t' +
          (hasVal ? 'HAS_DROPDOWN ' + sampleRule : 'no-dropdown') +
          '\texpect=' +
          (EXPECTED_HEADERS[c] || '')
      );
    }
  }

  if (blankHeader.length) lines.push('BLANK HEADERS: ' + blankHeader.join(','));
  if (unexpected.length) lines.push('UNEXPECTED HEADERS: ' + unexpected.join(','));

  // Detect Google Table
  try {
    if (typeof sheet.getCurrentCell === 'function') {
      lines.push('Tip: if you see Convert to table chip — reject it. Tables invent dropdowns.');
    }
  } catch (e) {}

  Logger.log(lines.join('\n'));
  SpreadsheetApp.getUi().alert(
    'Diagnosis written to Apps Script → Executions/Logs (View → Logs).\n\n' +
      'Blank headers: ' +
      (blankHeader.length ? blankHeader.join(', ') : 'none') +
      '\nUnexpected: ' +
      (unexpected.length ? unexpected.join(', ') : 'none') +
      '\n\nOpen Logs for per-column HAS_DROPDOWN detail.'
  );
}

function columnToLetter_(column) {
  var temp = '';
  var col = column;
  while (col > 0) {
    var rem = (col - 1) % 26;
    temp = String.fromCharCode(65 + rem) + temp;
    col = Math.floor((col - 1) / 26);
  }
  return temp;
}

/** Remove every data-validation on the Plans tab (fixes red triangles). */
function stripAllDropdowns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheet_(ss, PLANS_TAB);
  if (!sheet) throw new Error('Plans tab not found');
  try {
    var filter = sheet.getFilter();
    if (filter) filter.remove();
  } catch (e) {}
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  SpreadsheetApp.getUi().alert(
    'All dropdowns stripped from Plans tab. Red triangles should clear after refresh.\nDo NOT Convert to table.'
  );
}

/** Ensure row-1 names match schema. Does NOT add dropdowns. */
function ensureHeaderNamesOnly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheet_(ss, PLANS_TAB);
  if (!sheet) throw new Error('Plans tab not found');
  sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
  // clear junk to the right
  if (sheet.getMaxColumns() > EXPECTED_HEADERS.length) {
    sheet
      .getRange(1, EXPECTED_HEADERS.length + 1, sheet.getMaxRows(), sheet.getMaxColumns())
      .clear();
  }
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
  SpreadsheetApp.getUi().alert('Header row forced to 19 expected names. No dropdowns added.');
}

function importPlansFromUrl() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Import plans from URL?',
    'Deletes + recreates "' +
      PLANS_TAB +
      '" from:\n' +
      PLANS_TSV_URL +
      '\n\nNo dropdowns will be applied.\nContinue?',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  var text = fetchPlansTsv_();
  var grid = tsvToGrid_(text);
  if (!grid.length || String(grid[0][0]).trim() !== 'Firm') {
    throw new Error('Downloaded TSV invalid — first cell must be Firm');
  }

  // Pause edit-trigger side effects during bulk write
  PropertiesService.getScriptProperties().setProperty('skipSync', '1');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = recreatePlansSheet_(ss);
  sheet.getRange(1, 1, grid.length, grid[0].length).setValues(grid);
  // Explicit: zero validations on fresh import
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();

  PropertiesService.getScriptProperties().setProperty('skipSync', '0');

  ui.alert('Imported ' + (grid.length - 1) + ' plan rows (no dropdowns). Syncing…');
  syncNow();
}

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
    // Force all cells to strings so Sheets does not auto-type / invent dropdowns
    return r.map(function (cell) {
      return String(cell);
    });
  });
}

function onEditInstallable(e) {
  if (PropertiesService.getScriptProperties().getProperty('skipSync') === '1') return;
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
  if (props.getProperty('skipSync') === '1') return;
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

/** Push sheet → site. Does NOT add dropdowns or rewrite headers. */
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
