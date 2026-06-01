# shariski.com Rail-Journey Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the live Tailwind shariski.com with the Claude Design rail-journey bundle (3-line network + 5 canvas worlds), shipped as cleaned static files.

**Architecture:** Vanilla HTML/CSS/canvas, no build step. Source lives in `shariski-com/project/`; we copy (not move) into `public/` with production renames, rewrite the hardcoded cross-links, strip the dev-only React "tweaks" panel, add per-page `<head>` metadata, and deploy via the unchanged nginx + GitHub Actions pipeline.

**Tech Stack:** Static HTML/CSS/JS, 2D `<canvas>`, Google Fonts (only external dep), nginx:alpine, GitHub Actions, Docker Compose on a VPS.

**Spec:** `docs/superpowers/specs/2026-06-01-shariski-redesign-implementation-design.md`

**Verification model:** No test framework. Gates are `grep` (no stale links), `curl` (HTTP 200 per route), `python3 -m http.server` + headless browser (no console errors, canvas boots), and a final interactive walkthrough by the user.

---

## Task 1: Scaffold the new `public/` tree

**Files:**
- Delete: `public/index.html` (old Tailwind homepage)
- Keep untouched: `public/case-settlement.html`, `public/case-kerf.html`, `public/case-kerf-workflow.html`, `public/favicon.svg`, `public/images/`
- Create (copied from source): `public/index.html`, `public/works.html`, `public/depot.html`, `public/rail/engine.js`, `public/rail/network.js`, `public/worlds/{departure,water,keys,kerf,gold}.html`, `public/cv/falahudin-halim-shariski-cv.pdf`

- [ ] **Step 1: Remove the old homepage and stage new dirs**

```bash
cd /Users/shariski/Work/shariski
rm -f public/index.html
mkdir -p public/rail public/worlds public/cv
```

- [ ] **Step 2: Copy source files into place with production names**

```bash
SRC=shariski-com/project
cp "$SRC/shariski-rail-journey.html" public/index.html
cp "$SRC/shariski-works-line.html"   public/works.html
cp "$SRC/shariski-depot.html"        public/depot.html
cp "$SRC/rail/engine.js"             public/rail/engine.js
cp "$SRC/rail/network.js"            public/rail/network.js
cp "$SRC"/worlds/{departure,water,keys,kerf,gold}.html public/worlds/
cp "$SRC"/uploads/CV-Falahudin_Halim_Shariski-*.pdf public/cv/falahudin-halim-shariski-cv.pdf
```

We copy (not move) so the `shariski-com/` source bundle stays intact. We deliberately do NOT copy `tweaks-panel.jsx`, `rail/tweaks-app.jsx`, the `uploads/` HTML experiments, `screenshots/`, `.thumbnail`, or `.DS_Store`.

- [ ] **Step 3: Verify the tree**

```bash
find public -type f -not -path '*/images/*' | sort
```
Expected: exactly index.html, works.html, depot.html, the 3 case-*.html, favicon.svg, rail/engine.js, rail/network.js, worlds/{departure,water,keys,kerf,gold}.html, cv/falahudin-halim-shariski-cv.pdf (plus whatever is under images/).

- [ ] **Step 4: Confirm no dev/junk files leaked in**

```bash
find public -name '*.jsx' -o -name '.DS_Store' -o -name '*.thumbnail'
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add public
git commit -m "feat(site): scaffold rail-journey static tree in public/"
```

---

## Task 2: Rewrite cross-references for the renames

The network is held together by hardcoded relative hrefs. Update them all, then prove with grep that none of the old names survive.

**Files:**
- Modify: `public/rail/network.js`
- Modify: `public/worlds/departure.html`, `water.html`, `keys.html`, `kerf.html`, `gold.html`

- [ ] **Step 1: Rewrite the `LINES[]` hrefs in network.js**

In `public/rail/network.js`, change the three `href:` values:
- `href:'shariski-rail-journey.html'` → `href:'index.html'`
- `href:'shariski-works-line.html'` → `href:'works.html'`
- `href:'shariski-depot.html'` → `href:'depot.html'`

- [ ] **Step 2: Rewrite the origin-line world back/merge links**

In each of `public/worlds/{departure,water,keys,kerf}.html`, replace every occurrence of `../shariski-rail-journey.html` with `../index.html` (the `?stop=N` query strings stay unchanged). Bulk-apply and confirm:

```bash
cd /Users/shariski/Work/shariski
sed -i '' 's#\.\./shariski-rail-journey\.html#../index.html#g' public/worlds/departure.html public/worlds/water.html public/worlds/keys.html public/worlds/kerf.html
```

- [ ] **Step 3: Rewrite the gold (works-line) world links**

In `public/worlds/gold.html`, replace every `../shariski-works-line.html` with `../works.html`:

```bash
sed -i '' 's#\.\./shariski-works-line\.html#../works.html#g' public/worlds/gold.html
```

- [ ] **Step 4: VERIFY — no stale filenames anywhere**

```bash
grep -rn "shariski-rail-journey\|shariski-works-line\|shariski-depot" public/ ; echo "exit: $?"
```
Expected: no matches (grep exit code 1). If anything prints, fix it before continuing.

- [ ] **Step 5: VERIFY — the intended new links exist**

```bash
grep -rn "index.html?stop=\|works.html?stop=" public/worlds/
grep -n "href:'index.html'\|href:'works.html'\|href:'depot.html'" public/rail/network.js
```
Expected: back/merge links in all 5 worlds + the 3 hrefs in network.js.

- [ ] **Step 6: Commit**

```bash
git add public/rail/network.js public/worlds
git commit -m "fix(site): repoint cross-line links to renamed pages"
```

---

## Task 3: Strip the dev-only React "tweaks" panel

This is the only thing pulling heavy third-party scripts (React + ReactDOM + Babel from unpkg). It's a design-time tool, not production.

**Files:**
- Modify: `public/index.html`
- Modify: `public/works.html`

- [ ] **Step 1: Remove the tweaks block from index.html**

In `public/index.html`, delete:
- the `<div id="tweaks-root"></div>` element,
- the three `unpkg` `<script>` tags (`react@18.3.1`, `react-dom@18.3.1`, `@babel/standalone`),
- the two `<script type="text/babel" src="tweaks-panel.jsx">` and `<script type="text/babel" src="rail/tweaks-app.jsx">` includes,
- the `window.SHARISKI = { ... }` export line (it only existed to feed the tweaks panel; the in-page functions it referenced stay defined and are still called directly).

Keep `<script src="rail/network.js"></script>` (that's the production line-switcher, not a tweak).

- [ ] **Step 2: Remove the orphaned tweaks-root from works.html**

In `public/works.html`, delete the `<div id="tweaks-root"></div>` element (works.html never loaded the tweaks scripts; the div is dead).

- [ ] **Step 3: VERIFY — no tweaks/unpkg/babel references remain**

```bash
grep -rn "tweaks\|unpkg.com\|babel\|react-dom\|tweaks-root" public/ ; echo "exit: $?"
```
Expected: no matches (exit 1).

- [ ] **Step 4: VERIFY — network.js still loaded where intended**

```bash
grep -rln "rail/network.js" public/index.html public/works.html public/depot.html
```
Expected: all three listed.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/works.html
git commit -m "chore(site): strip dev-only React tweaks panel for production"
```

---

## Task 4: Remove the dead rain-radar links in the depot

`github.com/shariski/rain-radar` and `/rain-radar-backend` both 404. Keep the RR-01 build card and its copy; drop only the dead links.

**Files:**
- Modify: `public/depot.html`

- [ ] **Step 1: Locate the rain-radar links**

```bash
grep -n "rain-radar" public/depot.html
```
Note the surrounding structure (the BUILDS entry's `repos`/link array for RR-01).

- [ ] **Step 2: Remove the two dead repo links**

Edit `public/depot.html`: in the RR-01 build entry, remove the `github.com/shariski/rain-radar` and `github.com/shariski/rain-radar-backend` link items, leaving the card title, tagline, problem, bullets, stack, and agentic note intact. If removing them empties a "repos" row, remove that now-empty row container too so no dangling label shows.

- [ ] **Step 3: VERIFY — rain-radar links gone, other repos intact**

```bash
grep -n "rain-radar" public/depot.html ; echo "exit: $?"
grep -on "github.com/shariski/[a-z-]*" public/depot.html | sort -u
```
Expected: first grep no matches (exit 1); second lists only live repos (ig-pulse, padanan, fpl-autopilot, and the bare profile if present).

- [ ] **Step 4: Commit**

```bash
git add public/depot.html
git commit -m "fix(depot): drop dead rain-radar repo links (404)"
```

---

## Task 5: Wire the contact block (origin line)

**Files:**
- Modify: `public/index.html` (the `CONTACTS` array)

- [ ] **Step 1: Set the real email**

In `public/index.html`, in `CONTACTS`, change the Email entry from `hello@shariski.com` to `falahudin6@gmail.com` (both the visible `v:` value and the `href:'mailto:...'`).

- [ ] **Step 2: Mark the phone as a tracked TODO until the number arrives**

Leave the GitHub / X / LinkedIn entries unchanged. For the Phone entry, keep the field but add a clear inline comment so it's obvious it must be filled before push:

```javascript
// TODO(phone): replace with real number before go-live, e.g. { l:'Phone', v:'+62 …', href:'tel:+62…' }
{ l:'Phone', v:'+62 — set your number', href:'' },
```

- [ ] **Step 3: VERIFY**

```bash
grep -n "falahudin6@gmail.com\|hello@shariski.com\|TODO(phone)" public/index.html
```
Expected: `falahudin6@gmail.com` present (×2), `hello@shariski.com` absent, the TODO present.

- [ ] **Step 4: Commit**

```bash
git add public/index.html
git commit -m "feat(contact): use real email; flag phone as pre-launch TODO"
```

---

## Task 6: Per-page `<head>` metadata (SEO + favicon + Open Graph)

Each prototype only has a bare `<title>`. Add a consistent metadata block to all 8 pages. Place it right after the existing `<meta name="viewport">` line in each `<head>`.

**Files:**
- Modify: `public/index.html`, `public/works.html`, `public/depot.html`, `public/worlds/{departure,water,keys,kerf,gold}.html`

- [ ] **Step 1: Define the per-page values**

| File | canonical URL | description |
|------|---------------|-------------|
| index.html | `https://shariski.com/` | "Falahudin Halim Shariski — a backend engineer who can't leave a process alone. A scroll-driven journey through learning hard things from zero." |
| works.html | `https://shariski.com/works.html` | "The works line: ML research at CIFOR, backend at GreatDay HR, the settlement engine at Bullion, tech lead at AIG NUSA HUB." |
| depot.html | `https://shariski.com/depot.html` | "The depot — recent builds shipped fast and agent-assisted: ig-pulse, padanan, fpl-autopilot, and more." |
| worlds/departure.html | `https://shariski.com/worlds/departure.html` | "Departure — an operating system for learning hard things: take it apart, make it efficient, repeat." |
| worlds/water.html | `https://shariski.com/worlds/water.html` | "Water — learning to swim from nothing, one breath at a time." |
| worlds/keys.html | `https://shariski.com/worlds/keys.html` | "Keys — rebuilding how I type, from the home row up." |
| worlds/kerf.html | `https://shariski.com/worlds/kerf.html` | "Kerf — going split-keyboard from zero, and forging a typing trainer for the transition." |
| worlds/gold.html | `https://shariski.com/worlds/gold.html` | "Bullion settlement engine — a case study: 91% faster, 17% cheaper, deterministically ordered." |

- [ ] **Step 2: Insert the metadata block in each page**

For each file, add (substituting that page's TITLE/DESC/URL; TITLE = the page's existing `<title>` text). Worlds reference the favicon one level up (`../favicon.svg`); root pages use `/favicon.svg`:

```html
<meta name="description" content="DESC" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta property="og:title" content="TITLE" />
<meta property="og:description" content="DESC" />
<meta property="og:type" content="website" />
<meta property="og:url" content="URL" />
```

(For the 5 world files, use `href="../favicon.svg"`.)

- [ ] **Step 3: VERIFY — every page has the metadata**

```bash
for f in public/index.html public/works.html public/depot.html public/worlds/*.html; do
  printf "%-30s desc:%s og:%s icon:%s\n" "$f" \
    "$(grep -c 'name=\"description\"' "$f")" \
    "$(grep -c 'property=\"og:' "$f")" \
    "$(grep -c 'rel=\"icon\"' "$f")"
done
```
Expected: every row `desc:1 og:4 icon:1`.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/works.html public/depot.html public/worlds
git commit -m "feat(seo): add per-page description, favicon, and Open Graph tags"
```

---

## Task 7: Add the "download CV" link on the works line

**Files:**
- Modify: `public/works.html`

- [ ] **Step 1: Inspect the works-line top-corner markup**

```bash
grep -n "class=\"mark\"\|class=\"corner\"" public/works.html
```
Identify the `.corner` (top-right context) block to append a subtle link to.

- [ ] **Step 2: Add the CV link**

In `public/works.html`, inside the top-right `.corner` element (or immediately after it), add a subtle link to the PDF:

```html
<a href="/cv/falahudin-halim-shariski-cv.pdf" target="_blank" rel="noopener"
   style="color:var(--accent);text-decoration:none;font-family:var(--mono);font-size:11px;letter-spacing:.04em">download CV ↗</a>
```

Match the surrounding mono/letter-spacing style already used in `.corner`; adjust the inline style only if the page already defines a class that fits.

- [ ] **Step 3: VERIFY**

```bash
grep -n "falahudin-halim-shariski-cv.pdf" public/works.html
test -f public/cv/falahudin-halim-shariski-cv.pdf && echo "PDF present"
```
Expected: link present; "PDF present".

- [ ] **Step 4: Commit**

```bash
git add public/works.html
git commit -m "feat(works): add download CV link"
```

---

## Task 8: Local verification (automated gates)

**Files:** none (verification only)

- [ ] **Step 1: Serve the site**

```bash
cd /Users/shariski/Work/shariski/public && python3 -m http.server 8765 >/tmp/shariski-http.log 2>&1 &
sleep 1
```

- [ ] **Step 2: Every route returns 200**

```bash
for p in / /works.html /depot.html \
  /worlds/departure.html /worlds/water.html /worlds/keys.html /worlds/kerf.html /worlds/gold.html \
  /rail/engine.js /rail/network.js /cv/falahudin-halim-shariski-cv.pdf /favicon.svg \
  /case-settlement.html /case-kerf.html /case-kerf-workflow.html ; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8765$p")
  printf "%-45s %s\n" "$p" "$code"
done
```
Expected: every route `200`.

- [ ] **Step 3: No stale links / no junk shipped (re-confirm)**

```bash
grep -rn "shariski-rail-journey\|shariski-works-line\|shariski-depot\|tweaks\|unpkg\|rain-radar\|hello@shariski.com" public/ ; echo "exit: $?"
```
Expected: no matches (exit 1).

- [ ] **Step 4: Headless browser console check (each page boots cleanly)**

Use the chrome-devtools (or playwright) MCP: navigate to `http://localhost:8765/`, `/works.html`, `/depot.html`, and one world (`/worlds/water.html`). For each, list console messages and confirm no errors (especially no 404s for engine.js/network.js/fonts, no JS exceptions), and confirm the `<canvas id="cv">` exists / the rail initializes.

- [ ] **Step 5: Stop the server**

```bash
pkill -f "http.server 8765" || true
```

- [ ] **Step 6: Report results** to the user with the route table + console findings, then hand off for interactive eyeball.

---

## Task 9: Go-live (after user eyeball + phone number)

**Files:** possibly `public/index.html` (phone), then deploy.

- [ ] **Step 1:** If the user has provided the phone number, replace the Phone TODO in `public/index.html` `CONTACTS` with the real `tel:`/WhatsApp link and re-run the Task 5 verify grep.
- [ ] **Step 2:** User performs the interactive walkthrough (spec §11) locally and approves.
- [ ] **Step 3:** Final commit of any eyeball fixes.

```bash
git add -A public
git commit -m "feat(site): launch rail-journey redesign"
```

- [ ] **Step 4:** Push to `main` (this triggers the deploy workflow). ONLY after explicit user go-ahead.

```bash
git push origin main
```

- [ ] **Step 5:** Watch the deploy and verify production.

```bash
gh run watch "$(gh run list --workflow=deploy --limit 1 --json databaseId -q '.[0].databaseId')"
curl -s -o /dev/null -w "%{http_code}\n" https://shariski.com/
```
Expected: workflow success; `200` from production.

---

## Notes / future (not in this plan)

- works.html: 3 of 4 career stops have no case-study world yet (by design).
- Station `note` copy + artifact images on the origin line stay empty for now (user decision).
- `?from=` param emitted by works.html is unused by gold.html (cosmetic, left alone).
- Optional: refresh repo `README.md` (still reflects the old positioning).
