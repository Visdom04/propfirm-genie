# Prop Firm Match — UI design reference

This document describes the **live patterns in this repository**: tokens, buttons, composite components, and card layouts. Use it as a map from visual intent to file and class names.

**Primary sources**

| Area | Files |
|------|--------|
| Global tokens & base buttons | `src/app/globals.css` |
| Hero (CTAs + floating firm cards) | `src/components/Hero.js`, `Hero.css` |
| Navigation | `src/components/Navbar.js`, `Navbar.css` |
| Feature grid | `src/components/Features.js`, `Features.css` |
| Community / tracker | `src/components/Community.js`, `Community.css` |
| Newsletter | `src/components/Newsletter.js`, `Newsletter.css` |
| Firm comparison table | `src/components/FirmGrid.js`, `FirmGrid.css` |

---

## Design tokens

Defined on `:root` in `globals.css`:

- **Background / foreground**: `--background` (`#0a0a14`), `--foreground` (`#ffffff`).
- **Accents**: `--accent-purple`, `--accent-blue`, `--accent-cyan`, `--accent-teal`, `--accent-pink`.
- **Neutrals**: `--slate-300` … `--slate-900`.
- **Glass**: `--glass-bg`, `--glass-border`, `--glass-blur` — used with the `.glass` utility.
- **Gradients**: `--gradient-primary`, `--gradient-vibrant`, `--gradient-surface` (hero and CTAs often inline `linear-gradient(180deg, #67e8f9, #818cf8)` to match).
- **Glows**: `--glow-purple`, `--glow-cyan`, `--glow-blue`.

**Typography**: Outfit via `var(--font-outfit)` on `body`; headings use tighter letter-spacing (`-0.04em`) and weight `800` where specified in section CSS.

---

## Buttons

The app uses **no single Button component**; patterns are class-based. Grouped by role below.

### 1. Global primary / secondary (`.btn`)

Base layout and two variants live in `globals.css`:

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
```

- **`.btn`**: `padding: 0.8rem 1.6rem`, `border-radius: 12px`, `font-weight: 700`, flex row with gap.
- **`.btn-primary`**: gradient fill, white text, purple glow; hover uses `translateY(-2px) scale(1.05)`.
- **`.btn-secondary`**: transparent, `1.5px` glass border, blur; hover lightens background and border.

**Used in**: `Navbar.js` — “Log in” / “Sign Up” (navbar overrides padding/radius — see below).

### 2. Hero CTAs

**File**: `Hero.css` — `.hero-btn-primary`, `.hero-btn-secondary`

```jsx
<button className="hero-btn-primary">Get Started</button>
<button className="hero-btn-secondary">Watch Video</button>
```

- Primary: same cyan→indigo gradient as brand; glow on hover via `box-shadow`.
- Secondary: glass-style border and backdrop blur; no scale on hover.

### 3. Navbar-specific buttons

**File**: `Navbar.css`

| Class | Role |
|--------|------|
| `.switch-btn` / `.switch-btn.active` | Segmented control (Forex / Futures / Crypto) |
| `.btn-link` | Text action, e.g. “We're Hiring” |
| `.navbar .btn-primary` | Pill-shaped sign-up; gradient + shadow |
| `.navbar .btn-secondary` | Outlined log in; no transform on hover |
| `.menu-btn` | Icon-only hamburger |

Example:

```jsx
<button className="switch-btn active">Forex</button>
<button className="btn btn-secondary">Log in</button>
<button className="btn btn-primary">Sign Up</button>
```

### 4. Full-width card CTAs

**File**: `Community.css` — `.comm-cta`

Gradient matches hero; includes trailing arrow icon in markup (`Community.js`).

```jsx
<button className="comm-cta">
  Join Our Discord
  <svg width="14" height="14" ... />
</button>
```

### 5. Newsletter submit (pill)

**File**: `Newsletter.css` — `.newsletter-btn` inside `.newsletter-form`

Rounded pill, gradient, sits beside `.newsletter-input` in a fused control.

```jsx
<button className="newsletter-btn">Subscribe</button>
```

### 6. Table / inline actions

**File**: `FirmGrid.css`

- **`.visit-link`**: link-styled control (not `<button>`) with cyan border and hover fill.
- **`.copy-btn`**: icon-only, transparent; hover color `#67e8f9`.

---

## Components (composite patterns)

These are **implemented as markup + CSS** rather than shared React primitives.

### Glass panel

**`globals.css`** — `.glass` on a container (e.g. search bar, category switcher):

```html
<div class="search-bar glass">...</div>
```

### Gradient text

**`globals.css`** — `.gradient-text` / `.gradient-vibrant-text` (clip text to gradient).

Section-specific duplicates: `.hero-gradient-line`, `.features-gradient`, `.promo-discount` (horizontal gradient in table).

### `FirmCard` (floating mini-card)

**`Hero.js`** exports inline `FirmCard`; styles in `Hero.css` under `.firm-card` and BEM children:

- `.firm-card__badge`, modifiers `--evaluation`, `--funded`
- `.firm-card__body`, `__logo`, `__info`, `__name`, `__platform`, `__balance`, etc.

```jsx
<div className="firm-card" style={{ ...position, animationDelay }}>
  <span className={`firm-card__badge firm-card__badge--evaluation`}>Evaluation</span>
  <div className="firm-card__body">...</div>
</div>
```

### Feature row item

**`Features.js`**: each cell is `.feature-card` with `.feature-icon` (gradient plate + SVG), title, description.

### Community hub layout

**`Community.js`**: two `.comm-card` columns (`.comm-left` / `.comm-right`) sharing:

- `.comm-card-top`, `.comm-label`, `.comm-icon--discord` / `--tracker`
- `.comm-brand`, `.comm-tags`, `.comm-tag`
- Tracker-only: `.tracker-stats`, `.tracker-stat--green|yellow|cyan`

### Newsletter block

**`Newsletter.js`**: `.newsletter-card` with decorative `.newsletter-glow--left|right`, content stack, and fused form.

### Firm table (data-dense “card”)

**`FirmGrid.js`**: not a card grid but a **single bordered surface** (`.firm-table-wrap`) containing `.firm-table`:

- Header row: `.firm-table-head` (cyan→indigo gradient).
- Rows: `.firm-row` with hover tint.
- Cells compose **`.firm-identity`**, **`.rating-wrap`**, **`.platform-tags`**, **`.promo-wrap`**, etc.

---

## Cards (summary)

| Pattern | Classes | File | Purpose |
|---------|---------|------|---------|
| Floating firm preview | `.firm-card` + BEM | `Hero.css` | Decorative stats cards around hero image |
| Feature tile | `.feature-card` | `Features.css` | Icon + title + copy in a grid |
| Community / tracker panel | `.comm-card` | `Community.css` | Large split sections with CTA |
| Newsletter shell | `.newsletter-card` | `Newsletter.css` | Centered promo with glows |
| Comparison surface | `.firm-table-wrap` | `FirmGrid.css` | Scrollable table as one “card” |

**Shared card language**

- Border: ~`1px solid rgba(255,255,255,0.07–0.08)`.
- Radius: `12px` (small), `16px` (features), `20px` (community), `24px` (newsletter).
- Hover (where applicable): stronger cyan border tint and/or slight `translateY`.

---

## Quick copy-paste snippets (minimal)

**Primary CTA (matches hero / community)**

```html
<button type="button" class="hero-btn-primary">Label</button>
```

**Muted outline button**

```html
<button type="button" class="hero-btn-secondary">Label</button>
```

**Feature card shell**

```html
<div class="feature-card">
  <div class="feature-icon"><!-- svg --></div>
  <h3 class="feature-card-title">Title</h3>
  <p class="feature-card-desc">Description</p>
</div>
```

**Community-style large card**

```html
<div class="comm-card">
  <div class="comm-card-top">...</div>
  <!-- content -->
  <button type="button" class="comm-cta">CTA</button>
</div>
```

---

## Maintenance

When adding new UI, prefer **reusing these class names** or extracting shared tokens from `globals.css` so contrast, radius, and gradient direction stay consistent. If you introduce a new button or card variant, add a row to the tables above and link the implementing file.
