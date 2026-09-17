# Developer pickup (17 Sep 2026)

Read [`HANDOFF.md`](HANDOFF.md) for routes, PFG URL mapping, and the copy list. Read [`scripts/DATA-PIPELINE.md`](scripts/DATA-PIPELINE.md) before touching data. This file is what changed after that handoff and what to fill in the Google Sheet.

Site under work: [propfirm-genie-two.vercel.app](https://propfirm-genie-two.vercel.app). Production paths on propfirmgenie.com stay as in HANDOFF.

## Google Sheet — columns that actually show

Two tabs. Do not rename headers. Do not hand-edit plan rows in `src/data/firms.js`.

After a sheet edit: **PropFirm Sync → Sync sheet → site now**, or locally:

```bash
npm run validate:firms
npm run sync:firms
```

### Plans tab (`scripts/firm-plans.tsv`) — 308 rows

Fill these first. They drive `/challenges` (one row per plan + size) and roll up into `/overview`.

| Priority | Column | What the site does |
|---|---|---|
| Identity | Firm, Plan Type, Account Size | Row key. Firm name must match the Firms tab. |
| Price | List Price, Discount % | Sale = List × (1 − % / 100). Type `30`, not `30%`. |
| Price | Price | Fallback if list/% are blank. Keep `(monthly)` here for monthly plans. The dollar amount is ignored when list + % are both set. |
| Price | Promo CODE | Default `KAGE`. Topstep / FTMO use `-`. DayTraders uses `KAGE`. |
| Rules | Drawdown Type, Activation Fee, Profit Target, Max Drawdown, Max Contract | Challenges mid columns. |
| Rules | Consistency Rule Eval, Funded | Eval / Funded split in one cell (`None / 40%`). |
| Rules | Payout Freq. | Challenges shows the raw cell. Overview compact-joins cadence only (`5 winning days`, not `$100 · $200`). |
| Rules | Profit Split | Number %. |
| Rules | Min Trading Days | Challenges + Overview “Days to pass”. Number or `None`. |
| Rules | Daily Drawdown | Challenges column. Dollar or `None`. **191 / 308 rows are still blank — fill this next.** |
| Rules | News Trading | `both`, `eval`, or `none`. 33 rows still blank. |
| Sort | Account Category | `Challenge` or `S2F`. Blank is inferred. |

Optional / low: **Price Note** (tooltip only), **Info** (not a table column).

Never write “cashback” in Offer or promo copy.

### Firms tab (`scripts/firms-meta.tsv`) — 25 firms

These drive `/firms` and the firm pin on `/overview` / `/challenges`.

| Priority | Column | What the site does |
|---|---|---|
| Identity | Firm | Must match Plans. |
| CTA | Affiliate Link | Challenges + `/firms` **View Firm** (bit.ly). Overview View Firm is `propfirmgenie.com/firm/{slug}`, not this link. |
| Rank | Rating, Reviews, isPopular | Directory sort and stars. |
| Rank | Max Allocation, Years, Country, Assets | `/firms` columns. Country = `US` or `United States`. |
| Rank | Platforms | Comma-separated names, not URLs. Icons resolve from the name (`NinjaTrader, Tradovate, …`). |
| Promo | Offer | Directory / overview discount chip (`30–40% OFF`). |
| Art | Logo | Public `https://` URL (Supabase `genie-assets/firms/`). Wins over the built-in map. Blank = built-in. |
| Ops | Enabled | Blank / YES = show. NO / hide = drop from every page. |
| Ops | Last Verified, Verified By | Ops only. Not on the UI. |

One Up Trader stays hidden (`Enabled` = NO, or omit from the live catalog).

### What is still empty (as of this pickup)

- **Daily Drawdown:** 191 blank plan rows. Challenges shows `—` until filled.
- **News Trading:** 33 blank.
- **Discount %:** 18 blank (sale then uses the Price cell).
- **Affiliate Link:** 2 firms.
- **Max Allocation / Years:** 2 firms.
- **Logo URL:** 22 firms still use the built-in map. Fine unless a new firm or rebrand.

Do not click Google Sheets **Convert to table**. It invents dropdowns and red “Invalid input” on Min Days / Daily DD / News / List Price.

## Mobile tables (this round)

`/challenges`, `/overview`, `/firms` on a phone:

- One overflow pane (the table), like Prop Firm Match. Native `position: sticky` left (Firm) and right (Promo / View Firm). No JS fake-pin, no window virtualizer on mobile.
- Page is **full bleed**: no side padding, no rounded chrome/board. A rounded card inside `overflow: hidden` is what looked like a hard cut against the grid.
- View Firm is a pill that **fits the sticky column** (`min-width: 0`, `width: 100%`). Do not put `shrink-0` on that button without a matching column width.
- Firm names wrap to 2 lines. Bookmark / heart sits next to the name, not at the far right of the pin.
- Hover (desktop): row radius 0, pin fill and seam shadow the same `#121c18`. A rounded hover row + old pin shadow looks like a cutout.

CSS that enforces the bleed lives in `src/app/globals.css` (`.pfg-table-page` mobile block) plus:

- `src/components/FirmCompareDemoGreen.edges.css`
- `src/components/FirmOverviewTable.css`
- `src/components/green/FirmDirectoryTable.css`

## View Firm URLs (do not mix)

| Page | Link |
|---|---|
| `/overview` | `https://propfirmgenie.com/firm/{slug}` |
| `/challenges` and `/firms` | Firms tab **Affiliate Link** (bit.ly) |
| Firm name / logo | PFG profile slug |

Slug exceptions are in `src/lib/firmGenie.js` (`GENIE_FIRM_SLUGS`).

## Do not

- Hand-edit plan arrays in `src/data/firms.js`.
- Restore `max-height` on the workbench or `overflow-y: auto` on the board. Window scroll on desktop; one inner pane on mobile.
- Add extra `::after` width on sticky pins (that created the end gap when you scrolled to View Firm).
- Put `overflow: hidden` on sticky Firm / View Firm cells (clips the seam cover and the pill).
- Commit contractor PDFs, `PROPFIRM_LOGO/`, or `demo-2-handoff/`.

## Verify

```bash
npm run dev
```

- [ ] `/challenges` at ~393px: table flush to both screen edges (no grid gutter, no rounded outer card). Promo KAGE + **View Firm** fully on screen, not a green circle.
- [ ] `/overview` at ~393px: same full-bleed chrome. Spotlight / Clear / columns button fully inside. View Firm pill complete.
- [ ] `/firms` at ~393px: still full-bleed (this page was already the reference).
- [ ] Desktop `/challenges` hover: green row, no bite taken out of the right pin.
- [ ] After filling Daily Drawdown on a known plan: sync → that Challenges cell is no longer `—`.

## Stack reminder

Next.js 16 App Router (`src/app`, `src/proxy.js` not `middleware.js`). React 19. Tailwind 4.
