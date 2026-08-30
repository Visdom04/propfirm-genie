# Firm data pipeline (Google Sheet → site)

This repo treats **the sheet as source of truth** for plan economics. The site reads generated `src/data/firms.js` — never edit plan rows in `firms.js` by hand.

## Files

| File | Who edits | Purpose |
|------|-----------|---------|
| `scripts/firm-plans.tsv` | Ops (via Google Sheet export) | One row = one **plan + account size** |
| `scripts/firms-meta.tsv` | Ops | Firm-level affiliate links, verification dates |
| `scripts/sync-firm-plans.mjs` | Dev only | Validates + writes `src/data/firms.js` |
| `scripts/validate-firm-plans.mjs` | Ops or CI | Fail fast before publish |

## Google Sheet setup

Create **two tabs**:

### Tab 1: `Plans` (export → `firm-plans.tsv`)

**Required columns (do not rename):**

| Column | Example | Rules |
|--------|---------|-------|
| Firm | Lucid Trading | Must match firm name in meta tab |
| Plan Type | Flex | Account product name |
| Account Size | 50k | 25k, 50k, 100k… |
| Drawdown Type | EOD | EOD, Intraday, Trailing… |
| Activation Fee | None | Dollar or None |
| Profit Target | $3,000 | Use `— (Straight to Funded)` for S2F |
| Max Drawdown | $2,000 | Eval max loss |
| Max Contract | 4 / 40 | Mini \| micro |
| Consistency Rule Eval, Funded | None / 40% | Eval / Funded split |
| Payout Freq. | Every 5 Days | Free text |
| Profit Split | 90% | Number % |
| Price | $98 | Current promo price |
| Promo CODE | KAGE | Default KAGE |

**Extended columns (for `/compare-firms` — add when ready):**

| Column | Example | Rules |
|--------|---------|-------|
| Account Category | Challenge | `Challenge` or `S2F` (auto-inferred if blank) |
| Min Trading Days | 2 | Number or None |
| Daily Drawdown | None | Dollar or None |
| News Trading | both | `both`, `eval`, or `none` |
| List Price | $165 | Strikethrough / pre-discount price |
| Discount % | 40 | 0–100 |

**Sheet data validation (recommended):**

- Account Category → dropdown: Challenge, S2F
- News Trading → dropdown: both, eval, none
- Freeze header row
- No merged cells in data area

### Tab 2: `Firms` (export → `firms-meta.tsv`)

| Column | Example |
|--------|---------|
| Firm | Lucid Trading |
| Affiliate Link | https://… |
| Last Verified | 2026-08-28 |
| Verified By | ops |
| isPopular | true |

## Weekly ops workflow

1. Check official firm pricing/rules pages for changes.
2. Edit Google Sheet.
3. **File → Download → Tab-separated values (.tsv)** for each tab.
4. Replace `scripts/firm-plans.tsv` and `scripts/firms-meta.tsv` in repo (or paste export).
5. Run:

```bash
npm run validate:firms
npm run sync:firms
```

6. Smoke check `/demo-2` and (when built) `/compare-firms` for 2–3 known pairs.

## What “robust” means here

- **Validate before sync** — bad rows block publish
- **Stable plan IDs** — `lucid-trading-flex-50k`, not row numbers
- **Header-driven parser** — column order can grow without breaking
- **Duplicate detection** — same firm + plan + size twice = error
- **Category inference** — Challenge vs S2F with warnings when inconsistent
- **Firm meta separate** — affiliate links not duplicated per plan row

## Do not

- Scrape competitor compare APIs into production
- Edit `firms.js` plan arrays manually
- Skip validation because “it’s just demo”
- Compare different account sizes without a UI warning (when compare ships)

## Later (when outgrowing sheets)

Same schema → Supabase tables. Sheet columns map 1:1 to DB columns; only the storage layer changes.
