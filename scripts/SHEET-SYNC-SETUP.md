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

## Test

After deploy is Ready, run `syncNow` — expect `"ok": true`.
