# shariski.com — rail-journey redesign: implementation & deploy

- **Date:** 2026-06-01
- **Status:** approved-pending-review
- **Owner:** Falah (shariski)

## 1. Goal

Replace the current live shariski.com (a single Tailwind page + 3 case-study
pages) with the "rail journey" redesign exported from Claude Design
(`shariski-com/project/`). Full replacement of the live homepage, shipped
through the existing static-nginx + GitHub Actions pipeline with no new
toolchain.

## 2. Non-goals

- No framework / build step. The prototypes are clean vanilla HTML/CSS/canvas
  and ship as static files (the only external runtime dep is Google Fonts).
- No nginx config changes (keep `.html` extensions so no rewrite rules are
  needed; the default config already serves everything).
- No rebuild of the designs in React/Astro/etc. — identical visual output for
  far less work.
- Not writing new long-form content this pass (station "notes" / artifact
  slots intentionally stay empty — see §8).

## 3. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Implementation approach | Ship cleaned prototypes as static files |
| 2 | Scope this pass | Full network: 3 lines (origin/works/depot) + 5 worlds (departure/water/keys/kerf/gold) |
| 3 | Old case studies | Keep accessible but **unlinked** (old URLs keep working; not in new nav) |
| 4 | Primary contact email | `falahudin6@gmail.com` |
| 5 | Phone field | Keep it; wire a real `tel:`/WhatsApp link — **number TBD from user** (TODO until provided) |
| 6 | Station detail notes + artifact slots | Keep **exactly as-is** (placeholder/empty is acceptable on live for now) |
| 7 | CV PDF | Ship it; add a "download CV" link on the works line |
| 8 | rain-radar (RR-01) GitHub links | **Remove the dead repo links** (404); keep the build card + writeup |
| 9 | Go-live | Verify locally → user eyeballs locally → then commit + push to `main` |

## 4. Architecture (how the redesign works)

A "rail" metaphor. One shared canvas engine renders a perspective railway under
HTML overlays.

- **Shared engine — `rail/engine.js`** (vanilla 2D canvas): perspective rails,
  ties, astronomy sky, signal lights, momentum/shake; a draggable "switch
  lever" branches the track. Driven by scroll. Exposes
  `window.RAIL.{init, applyConfig, goTo, setArm}` and a palette table `WORLDS`
  (midnight/dusk/dawn/water/keys/kerf/gold). `prefers-reduced-motion` →
  static fallback list.
- **Shared switcher — `rail/network.js`**: injects a fixed "the network"
  button + overlay that hops between the 3 lines. Each page sets
  `window.SHARISKI_LINE` before loading it.
- **3 top-level lines:**
  - **origin** (`index.html`): the main journey. Boarding-pass intro
    ("platform" beat), 5 stations (departure/water/keys/kerf/now-contact),
    contact popover. 4 stations dive into worlds.
  - **works** (`works.html`): career/CV, 4 chronological stations
    (CIFOR → GreatDay → Bullion → AIG). Only Bullion dives into a world (gold).
  - **depot** (`depot.html`): split-flap board of recent agentic builds
    (rain-radar, ig-pulse, padanan, fpl-autopilot); self-rendered canvas, no
    engine.js; uses network.js.
- **5 worlds** (`worlds/*.html`, all use engine.js with a per-world palette &
  custom canvas env): `departure`, `water`, `keys`, `kerf` belong to the
  origin line; `gold` is a case study off the works line.
- **Query-param contract:** lines pass `?stop=N` to worlds; worlds link back
  with `?stop=N` to restore the rail position. `works.html` also emits
  `?from=N` on dive (currently unused by gold.html — harmless, left alone).

## 5. Target `public/` layout

```
public/
├── index.html              # origin line  (was shariski-rail-journey.html)
├── works.html              # works/career (was shariski-works-line.html)
├── depot.html              # agentic builds (was shariski-depot.html)
├── rail/
│   ├── engine.js           # unchanged
│   └── network.js          # LINES[] hrefs updated to new names
├── worlds/
│   ├── departure.html
│   ├── water.html
│   ├── keys.html
│   ├── kerf.html
│   └── gold.html
├── cv/
│   └── falahudin-halim-shariski-cv.pdf   # from shariski-com/.../uploads/
├── favicon.svg             # kept from current site
├── images/                 # kept only if retained case studies reference it
├── case-settlement.html    # kept, unlinked
├── case-kerf.html          # kept, unlinked
└── case-kerf-workflow.html # kept, unlinked
```

`shariski.com/` → origin journey. `/works.html`, `/depot.html`, `/worlds/*`.

## 6. Cross-reference rewrites (the bounded edit set from renaming)

The redesign is held together by hardcoded relative hrefs. Every old filename
must be updated, then verified with a `grep` sweep so nothing silently 404s.

| File | Old reference | New reference |
|------|---------------|---------------|
| `rail/network.js` | `shariski-rail-journey.html` | `index.html` |
| `rail/network.js` | `shariski-works-line.html` | `works.html` |
| `rail/network.js` | `shariski-depot.html` | `depot.html` |
| `worlds/departure.html` | `../shariski-rail-journey.html?stop=0` and `?stop=1` | `../index.html?stop=…` |
| `worlds/water.html` | `../shariski-rail-journey.html?stop=1` / `?stop=2` | `../index.html?stop=…` |
| `worlds/keys.html` | `../shariski-rail-journey.html?stop=2` / `?stop=3` | `../index.html?stop=…` |
| `worlds/kerf.html` | `../shariski-rail-journey.html?stop=3` / `?stop=4` | `../index.html?stop=…` |
| `worlds/gold.html` | `../shariski-works-line.html?stop=2` / `?stop=3` | `../works.html?stop=…` |

**Verification:** after edits, `grep -r "shariski-rail-journey\|shariski-works-line\|shariski-depot" public/` must return nothing.

## 7. Cleaning (production hygiene)

**Strip dev-only tooling** (the React "tweaks" dev panel — the only heavy
3rd-party dependency):
- `index.html`: remove the `unpkg` React + ReactDOM + Babel `<script>` tags,
  the `tweaks-panel.jsx` and `rail/tweaks-app.jsx` includes, and the
  `#tweaks-root` div + its `window.SHARISKI` tweak hooks if orphaned.
- `works.html`: remove the orphaned `#tweaks-root` div.

**Do NOT ship:** `tweaks-panel.jsx`, `rail/tweaks-app.jsx`, the `uploads/`
experiments (`shariski-water-station.html`, `shariski-rail-3d-text.html` —
superseded; the latter has a debug-orange `<body>` bg), `screenshots/`,
`.thumbnail`, `.DS_Store`.

## 8. Production polish

- **Per-page `<head>`** (origin/works/depot + worlds): real `<title>`,
  `<meta name="description">`, `<link rel="icon" href="/favicon.svg">`, and
  basic Open Graph tags (`og:title`, `og:description`, `og:type`, `og:url`).
  Prototypes only have a bare `<title>`.
- **Contact (`index.html` `CONTACTS`):** email → `falahudin6@gmail.com`;
  GitHub / X / LinkedIn kept; **phone** → real `tel:`/WhatsApp link once the
  number is provided (TODO comment + the field stays until then).
- **CV:** copy PDF → `public/cv/`, add a subtle "download CV" link on
  `works.html`.
- **Station detail panels (origin):** unchanged — placeholder `note` lines and
  empty `scene · artifact` slots stay as-is per decision #6.
- **depot RR-01:** remove the two dead `github.com/shariski/rain-radar[-backend]`
  links; keep the card and its copy. Other repo links verified live.

## 9. External-link status (checked 2026-06-01)

Live ✅: typekerf.com, github.com/shariski, /kerf, /ig-pulse, /padanan,
/fpl-autopilot, x.com/shariski.
Dead ❌: github.com/shariski/rain-radar, /rain-radar-backend (→ remove, §8).
Unverifiable ⚠️: linkedin.com/in/shariski (LinkedIn bot-blocks; eyeball manually).

## 10. Deployment (unchanged pipeline)

- `Dockerfile`: `FROM nginx:alpine` + `COPY public /usr/share/nginx/html`.
  nginx serves `index.html` by default — multi-page static works out of the box.
- `.github/workflows/deploy.yml`: SCPs `Dockerfile` + `public/` to VPS staging,
  atomic-swaps into `/opt/shariski`, `docker compose up -d --build shariski`,
  prunes old images. Triggers on push to `main`. **No changes required.**
- The old `public/` (Tailwind page) is fully overwritten by the swap (the
  workflow `rm -rf`s the old `public` before moving the new one in), so stale
  assets won't linger.

## 11. Verification plan (before any push)

Serve `public/` locally (e.g. `python3 -m http.server`) and walk through:
1. Origin loads, boarding-pass platform shows at top, hides on scroll, returns at top.
2. Scroll-drive through all 5 origin stations; headlines focus correctly.
3. Throw the switch at departure/water/keys/kerf → dives into each world; world
   loads with correct palette; "merge back" / overscroll returns to
   `index.html?stop=N` at the right station.
4. The network switcher opens; hopping origin ↔ works ↔ depot works from each page.
5. works.html: 4 stations; Bullion dive → gold world → merge back to works.
6. depot.html: board renders; detail panels open; repo links go to live repos
   (no 404s); rain-radar links removed.
7. Contact popover: email/socials correct; phone link (or TODO state) correct.
8. CV download link works.
9. `prefers-reduced-motion`: static fallback lists render and are clickable.
10. `grep` sweep for old filenames returns nothing; no console errors; favicon loads.

## 12. Open TODO / future (not blocking this pass)

- **Phone number** from user → wire the contact phone link.
- works.html: 3 of 4 career stops have no case-study world yet (by design;
  future content).
- Station `note` copy + artifact-slot images on the origin line (future content).
- `?from=` param emitted by works.html is unused by gold.html (cosmetic).
- Optional: refresh the repo `README.md` (still describes the old positioning).
