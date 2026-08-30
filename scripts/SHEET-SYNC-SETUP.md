# Google Sheet → Vercel live sync (Option B)

Site: https://propfirm-plum.vercel.app/  
Sheet: https://docs.google.com/spreadsheets/d/1IXCAS8TbQtCvT24cFqbuU2igRQoy9gw9JM4wJlneBBs/edit  
Sheet ID: `1IXCAS8TbQtCvT24cFqbuU2igRQoy9gw9JM4wJlneBBs`

## How it works

```text
Edit Google Sheet
  → wait ~60s (debounce)
  → Apps Script POSTs /api/sync-firms
  → Vercel fetches Plans + Firms as TSV
  → validates
  → if OK: bust cache (site updates)
  → if bad: keep last good data, return errors
```

## 1. Vercel environment variables

Project → Settings → Environment Variables → Production (and Preview if you want):

| Name | Value |
|------|--------|
| `GOOGLE_SHEET_ID` | `1IXCAS8TbQtCvT24cFqbuU2igRQoy9gw9JM4wJlneBBs` |
| `GOOGLE_SHEET_PLANS_GID` | `0` (or your Plans tab gid) |
| `GOOGLE_SHEET_FIRMS_GID` | `812133584` |
| `SYNC_SECRET` | long random string (you invent) |

Then **Redeploy** so env vars apply.

## 2. Share the sheet for export

Vercel must download TSV without login:

1. Share → **Anyone with the link** → **Viewer**
2. Keep Editor access only for your team

## 3. Install Apps Script

1. Open the sheet → **Extensions → Apps Script**
2. Paste contents of `scripts/google-apps-script/SyncToVercel.gs`
3. Set `SYNC_SECRET` to the **same** value as Vercel
4. Save
5. Run **`installEditTrigger`** once (authorize Google when asked)
6. Run **`syncNow`** once to test

## 4. Test

```bash
curl -X POST "https://propfirm-plum.vercel.app/api/sync-firms" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source":"manual"}'
```

Expect `{ "ok": true, "stats": { ... } }`.

If `422`, fix sheet rows (validation errors in response) — site keeps previous good data.

## 5. Tab names / gids

- Plans tab gid: check URL when Plans is selected (`gid=...`). Default first tab is often `0`.
- Firms tab gid: `812133584` (from your link)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| HTML instead of TSV | Sheet not “Anyone with link → Viewer” |
| 401 Unauthorized | SYNC_SECRET mismatch |
| 422 validation | Duplicate plan rows or bad price/split |
| No update after edit | Run `installEditTrigger` again; wait 60s |
| Env not applied | Redeploy after adding vars |
