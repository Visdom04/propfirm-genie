# Google Sheet → Vercel live sync (PUSH mode)

Site: https://propfirm-plum.vercel.app/

Apps Script **pushes** Plans + Firms TSV to `/api/sync-firms`.  
Sheet can stay **private** (no “Anyone with link” needed).

## Vercel env

| Name | Required |
|------|----------|
| `SYNC_SECRET` | Yes — same as Apps Script |

`GOOGLE_SHEET_ID` / gids are optional in PUSH mode.

## Apps Script

1. Paste latest `scripts/google-apps-script/SyncToVercel.gs` (replace old script)
2. Set `SYNC_SECRET`
3. If Plans tab is not named `Plans`, set `PLANS_TAB` (e.g. `firm-plans`)
4. Run `installEditTrigger` once, then `syncNow`
5. **Extended compare cols:** run `ensureExtendedColumns` once (or rely on `syncNow` auto-append). Fill Min Trading Days / Daily Drawdown / News Trading / List Price / Discount %. Dropdowns for Category + News apply automatically.

Local seed (optional before paste into Sheet):

```bash
npm run extend:firms -- --write
npm run validate:firms
```

## Import from URL (one click)

After this branch is **pushed + Vercel deployed**:

1. Paste latest `SyncToVercel.gs` (keep your real `SYNC_SECRET`)
2. Reload the spreadsheet → menu **PropFirm Sync**
3. **Import plans from URL** → confirms → replaces Plans tab from  
   `https://propfirm-plum.vercel.app/data/firm-plans.tsv`  
   (fallback: GitHub raw on this branch)
4. Auto-runs `syncNow` after import

Or copy `scripts/firm-plans.tsv` into the Plans tab by hand.

## Test

After deploy is Ready, run `syncNow` — expect `"ok": true`.
