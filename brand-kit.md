# PropFirmGenie — Brand kit (demo experience)

**Audience:** Social, content, and design partners  
**Source of truth:** Demo page (`/demo`) + `src/app/globals.css`, `src/components/DemoHero.css`  
**Last aligned with:** Product UI as implemented in-repo

---

## 1. Brand in one paragraph

**PropFirmGenie** helps traders **find and compare prop firms** with clarity—budget, rules, payouts, and markets—without the noise. The demo experience feels like a **premium dark “trading terminal meets product”** surface: deep navy space, **cool blue light** (not neon chaos), **frosted glass** panels, and a **friendly “genie”** character as the magical-but-trustworthy guide. Messaging should sound **smart, calm, and direct**—confident fintech, not hypey signals.

---

## 2. Name & logo lockup (wordmark)

- **Full name:** `PropFirm`**`Genie`** — the second word is the accent (demo nav uses **Genie** in **#60a5fa**).
- **Icon motif (nav):** Soft blue **lamp / genie drop** shape inside a ring; glow in **#60a5fa** family (**#93c5fd**, **#bfdbfe**).
- **Social tip:** When the logo isn’t used, lead with **wordmark + one line of value** (e.g. “Find your prop firm match in seconds”).

---

## 3. Color system

### 3.1 Demo page background (hero / primary social backdrop)

| Role | Hex | Notes |
|------|-----|--------|
| **Page base** | `#050e1d` | Main demo canvas—deeper than the global site token |
| **Fine grid lines** | `rgba(255,255,255,0.028)` | Subtle square grid (48px rhythm) |
| **Ambient orbs** | Blue washes | e.g. `rgba(29,78,216,0.32)`, `rgba(96,165,250,0.2)`, `rgba(147,197,253,0.12)` |

### 3.2 Global brand accents (also used across the product)

Use these when you need **consistent cross-channel** swatches (stories, slides, badges):

| Token | Hex | Use |
|--------|-----|-----|
| **Background (global)** | `#0a0a14` | Alternate dark base for non-demo assets |
| **Foreground / text** | `#ffffff` | Headlines on dark |
| **Accent blue (primary UI)** | `#3b82f6` | Links, strong emphasis |
| **Sky / UI blue** | `#60a5fa` | Demo emphasis, logo accent, active states |
| **Light sky** | `#93c5fd` | Badge text, secondary emphasis |
| **Ice highlight** | `#e0f2fe` | Gradient start, “lit” edges |
| **Deep blue** | `#2563eb` | Gradient end, depth |
| **Cyan** | `#06b6d4` | Ecosystem accent (charts, icons) |
| **Teal** | `#14b8a6` | Secondary accent |
| **Purple** | `#8b5cf6` | Brand gradient family (main site CTAs) |
| **Pink** | `#f472b6` | Sparingly—spark, not default text |

### 3.3 Headline gradient (demo)

**“Prop Firm” / accent words** use a **115°** blend:

`#e0f2fe` → `#93c5fd` → `#60a5fa` → `#3b82f6` → `#2563eb`

**Social:** Use this as text fill on dark, or as a **soft glow** behind type (low opacity).

### 3.4 Neutrals for body copy

| Use | Approximate |
|-----|-------------|
| **Primary body on dark** | `rgba(148,163,184,0.9)` — slate-400 feel |
| **Secondary / meta** | `rgba(148,163,184,0.78)` |
| **Muted labels** | `rgba(148,163,184,0.55–0.75)` |
| **Softer UI text** | `rgba(203,213,225,0.82)` |

### 3.5 Glass surfaces (for composite graphics)

- **Panel fill:** `rgba(255,255,255,0.045)` – `0.1` depending on layer  
- **Border:** `rgba(255,255,255,0.1)` – `0.18`  
- **Inner highlight:** `inset` white ~`0.09`–`0.18` opacity  
- **Blue rim (focus):** `rgba(96,165,250,0.14)` – `0.32`

---

## 4. Typography

| Role | Font | Weights | Notes |
|------|------|---------|--------|
| **Display / headlines** | **Outfit** | 700–800 | Tight tracking **-0.03em to -0.04em**; hero is heavy and compact |
| **UI / body / forms** | **Inter** | 400–600 | Badges, buttons, filters, mega menu |
| **Section titles** | Outfit | 700 | Fluid scale on web; social: use **bold, short lines** |

**Scale (reference):** Hero is large and single-line on desktop; subtitles stay **readable** (~16–18px equivalent), **not** thin gray on gray.

---

## 5. Visual language & motifs

1. **Deep space navy + blue luminescence** — not pure black, not purple-pink gamer default.  
2. **Square grid** — suggests precision, data, “terminal” without clutter.  
3. **Frosted glass** — Apple-style depth: blur, thin border, soft inner specular.  
4. **Sparkles / stars** — small **✦** or dot-stars in **#93c5fd** at low opacity; suggests “genie / magic” subtly.  
5. **Genie character** — friendly guide; use **consistent crop** and **blue aura** if featuring in posts.  
6. **Floating firm logos** — small **rounded glass tiles** around the hero; good for **“compare many firms”** narratives.

**Avoid:** Rainbow gradients unrelated to the blue system, heavy purple-pink unless matching **global** CTA gradients for specific campaigns, and clutter that hides the **one clear CTA**.

---

## 6. Buttons (reference for stories, carousels, paid ads)

### A. Primary CTA — “Find firms” (blue glass)

- **Shape:** Rounded rect, **~12px** radius (pill-leaning allowed in ads).  
- **Fill:** `rgba(96,165,250,0.22)` → hover **0.32**  
- **Border:** `rgba(96,165,250,0.35)`–`0.5`  
- **Text:** `#e0f2fe` → **#fff** on hover  
- **Font:** Inter **600**, slight **-0.01em** tracking  

**ASCII layout (structure only):**

```
┌─────────────────────┐
│     Find firms      │   ← frosted blue glass, white/cyan text
└─────────────────────┘
```

### B. Secondary — neutral glass

- **Fill:** `rgba(255,255,255,0.1)` + **blur**  
- **Border:** `rgba(255,255,255,0.18)`  
- **Text:** `rgba(255,255,255,0.88)`  

### C. Tag / filter pill

- **Radius:** **Full pill** (100px).  
- **Default:** muted glass; **Active:** blue tint `rgba(96,165,250,0.18)`, border `0.35`, text **`#93c5fd`**.  

### D. Nav “Sign up” (high contrast)

- **Fill:** `#f8fafc` / **#fff**  
- **Text:** `#0f172a`  
- **Radius:** ~12px — reads as **clean SaaS**, good for **thumbnail legibility**.

### E. Global product CTAs (non-demo graphics)

- **Gradient fill:** `#67e8f9` → `#818cf8` (cyan to indigo), **white** label, **purple/blue glow** optional.  
- Use when matching **main site** screenshots, not necessarily the demo glass hero.

---

## 7. Cards (two patterns to mirror in social templates)

### Card 1 — **Search / filter panel** (“control center”)

- **Outer:** Large rounded panel **20px** radius.  
- **Glass:** `rgba(255,255,255,0.045)`, **blur ~28px**, border `rgba(255,255,255,0.1)`.  
- **Accent:** Faint blue outer ring `rgba(96,165,250,0.06)`.  
- **Inside:** Search row + **divider line** (soft horizontal gradient).  
- **Lower section:** Small **uppercase** legend (“REFINE WITH FILTERS”), **dark inset** selects `rgba(0,0,0,0.22)`.  
- **Use in social:** “How it works” slide, **UI mock** for **AI matching**, or **before/after** (messy spreadsheet vs one panel).

**Block sketch:**

```
 ╭────────────────────────────────────────────╮
 │  🔍  [ Describe what you want...    ] [Find firms] │
 │  ────────────────────────────────────────── │
 │  REFINE WITH FILTERS                        │
 │  [ Account size ▾ ] [ Budget ▾ ] [ ... ]    │
 ╰────────────────────────────────────────────╯
```

### Card 2 — **Floating firm tile** (logo capsule)

- **Size:** ~56–76px outer, **18px** radius.  
- **Glass:** `rgba(255,255,255,0.055)`, blur, border `rgba(255,255,255,0.14)`.  
- **Logo:** Centered, slight **drop shadow**; opacity ~**0.92**.  
- **Use in social:** **carousel** of firms, **trust strip**, or **“50+ firms”** graphic repeated as a pattern.

**Block sketch:**

```
  ╭────────╮
  │ [logo] │   ← frosted square-ish capsule, firm mark inside
  ╰────────╯
```

**Bonus — Mega menu tile (full-bleed menus / link-in-bio style):**

- **14px** radius, `rgba(255,255,255,0.06)` fill, **icon in dark plate** + label; hover **lifts** slightly.

---

## 8. Badges & micro-labels

- **“AI-Powered Matching”** style: pill, **uppercase** ~0.06em spacing, **#93c5fd** text, `rgba(96,165,250,0.1)` fill, border `rgba(96,165,250,0.22)`, **pulsing dot** `#60a5fa`.  
- **Section labels:** Uppercase, **~0.72rem** equivalent, **white** or **soft slate**.

---

## 9. Voice & copy cues (social)

- **Lead with outcome:** match, compare, verified, unbiased, updated.  
- **Avoid:** Guaranteed profits, “get funded easy,” unverifiable rankings.  
- **Sample lines aligned to demo:**  
  - “Find the best **prop firm** in seconds.”  
  - “Tell us your budget and rules—we match you fast.”  
  - “Compare **50+ firms**—same layout as our full directory.”

---

## 10. Quick checklist for new assets

- [ ] Background: **`#050e1d`** (demo) or **`#0a0a14`** (global)—not flat **#000** unless intentional.  
- [ ] Headlines: **Outfit**, tight tracking; accent words use **blue gradient** above.  
- [ ] Body: **Inter**, slate-muted, high contrast on dark.  
- [ ] One **primary CTA** per asset; blue glass or white **Sign up** style for legibility.  
- [ ] Glass cards: **border + inner highlight**, not flat gray boxes.  
- [ ] Sparkles **sparse**; blue only.  
- [ ] **Genie** usage consistent with brand (friendly, not childish meme spam unless campaign intentional).

---

## 11. File references (for design/dev handoff)

| What | Where |
|------|--------|
| Demo layout & glass system | `src/components/DemoHero.js`, `DemoHero.css` |
| Global tokens & default buttons | `src/app/globals.css` |
| Fonts | `src/app/layout.js` (Outfit + Inter) |
| UI pattern map | `design.md` |

---

*This document is meant for **external-ready** guidance. For pixel-perfect web implementation, always defer to the CSS in the repo.*
