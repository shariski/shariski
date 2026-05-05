# Kerf Portfolio Addition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kerf as a portfolio entry on shariski.com with two case-study pages — one for the engineering story, one for the AI-assisted build workflow — using only static HTML and the existing Tailwind CDN setup.

**Architecture:** Three flat HTML files in `public/` (one modified, two created) plus eight PNG assets under `public/images/kerf/`. No build step, no JS framework, no npm. Visual treatment matches the existing `case-settlement.html` exactly. Verification is by local HTTP serve plus browser visual check, since the project has no test framework.

**Tech Stack:** HTML5, Tailwind CSS (via CDN, unchanged), Python 3 `http.server` for local serving, Playwright MCP (optional) for headless visual verification.

**Spec:** `docs/superpowers/specs/2026-05-05-kerf-portfolio-addition-design.md`

**Note on TDD:** This is a static-HTML change with no test framework. The TDD analog used here is **verification before completion**: every task ends with an explicit verification step (browser check, link check, or asset check) before moving to the next task. Don't skip the verification steps — they are how we catch regressions on a project that has no automated tests.

**Note on git:** The shariski project is not currently a git repository. Task 0 below makes initialization optional. If you skip Task 0, also skip every `git add` / `git commit` step in later tasks — the work still completes correctly without history, but you lose the ability to roll back.

---

## File Structure

**Files modified:**
- `public/index.html` — single change: add a fourth entry to the existing `<div class="space-y-14">` inside `<section id="work">`.

**Files created:**
- `public/case-kerf.html` — engineering case study, six sections.
- `public/case-kerf-workflow.html` — AI-assisted build workflow case study, seven sections, includes four side-by-side image pairs.
- `public/images/kerf/audit-{home,dashboard,keyboards,practice}-{wireframe,impl}.png` — eight PNGs copied from `../kerf/`.

**Files unchanged:** `public/case-settlement.html`, `public/favicon.svg`, every other file in the project.

Each file has one responsibility:
- `case-kerf.html` makes the engineering argument.
- `case-kerf-workflow.html` makes the workflow argument.
- `index.html` exposes both.
- The PNGs are evidence for the workflow argument.

---

## Task 0 (optional): Initialize git so changes are tracked

**Files:**
- Create: `.gitignore` (root)

Skip this entire task if you don't want git history for the site. If you skip it, also skip every `git add` / `git commit` step in later tasks.

- [ ] **Step 1: Initialize repo and add a minimal gitignore**

Run from `/Users/falah/Work/shariski`:

```bash
git init
```

Then create `.gitignore` with this content:

```
.DS_Store
.claude/
.code-review-graph/
node_modules/
```

- [ ] **Step 2: Make the initial commit**

```bash
git add .gitignore docs/ public/
git commit -m "chore: initialize repo with existing site and design spec"
```

- [ ] **Step 3: Verify**

Run: `git log --oneline`
Expected: one commit visible.

---

## Task 1: Copy audit screenshots into the site

**Files:**
- Create: `public/images/kerf/` (directory)
- Copy: 8 PNGs from `../kerf/audit-*.png` into `public/images/kerf/`

- [ ] **Step 1: Create the image directory**

Run from `/Users/falah/Work/shariski`:

```bash
mkdir -p public/images/kerf
```

- [ ] **Step 2: Copy the eight audit screenshots**

```bash
cp ../kerf/audit-home-wireframe.png      public/images/kerf/
cp ../kerf/audit-home-impl.png           public/images/kerf/
cp ../kerf/audit-dashboard-wireframe.png public/images/kerf/
cp ../kerf/audit-dashboard-impl.png      public/images/kerf/
cp ../kerf/audit-keyboards-wireframe.png public/images/kerf/
cp ../kerf/audit-keyboards-impl.png      public/images/kerf/
cp ../kerf/audit-practice-wireframe.png  public/images/kerf/
cp ../kerf/audit-practice-impl.png       public/images/kerf/
```

- [ ] **Step 3: Verify all eight files are present**

Run: `ls public/images/kerf/`
Expected output:

```
audit-dashboard-impl.png
audit-dashboard-wireframe.png
audit-home-impl.png
audit-home-wireframe.png
audit-keyboards-impl.png
audit-keyboards-wireframe.png
audit-practice-impl.png
audit-practice-wireframe.png
```

- [ ] **Step 4: Commit (skip if Task 0 skipped)**

```bash
git add public/images/kerf/
git commit -m "feat: add kerf wireframe-vs-implementation audit screenshots"
```

---

## Task 2: Create `case-kerf.html` (engineering case study)

**Files:**
- Create: `public/case-kerf.html`

This task creates the entire file in one step because every section is interdependent prose and there is no test framework to TDD against. After writing, verify visually in a browser.

- [ ] **Step 1: Write `public/case-kerf.html`**

Create `public/case-kerf.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kerf — Engineering Case Study | Falahudin Halim Shariski</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="description" content="Engineering case study of kerf, a typing platform for split-keyboard transitioners. Pure-TypeScript adaptive engine beneath a React shell.">
<script src="https://cdn.tailwindcss.com"></script>
<style>
body {
  background-color: #020617;
  color: #cbd5e1;
  font-family: ui-sans-serif, system-ui;
}
</style>
</head>

<body class="px-6 py-16 max-w-4xl mx-auto">

<a href="index.html" class="text-sky-400 text-sm hover:underline">
← Back to Home
</a>

<h1 class="text-3xl font-bold text-white mt-8 mb-8">
Kerf — Typing Platform for Split-Keyboard Transitioners
</h1>

<h2 class="text-xl text-sky-400 mb-4">What kerf is</h2>
<p class="text-slate-400 mb-6 leading-relaxed">
kerf is a typing platform built for people transitioning from row-staggered keyboards to split columnar keyboards. Live at <a href="https://typekerf.com" target="_blank" class="text-sky-400 hover:underline">typekerf.com</a>. It treats the transition as a distinct learning journey — recognizing that someone three weeks into a Sofle is solving different problems than someone two years into a stock keyboard, and that the metrics, content, and feedback should adapt accordingly.
</p>

<h2 class="text-xl text-sky-400 mb-4">A domain core, not frontend logic</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
The easy way to build a typing platform is to grow business logic inside React components — keystroke handlers in event listeners, weakness scoring in <code class="text-slate-300">useEffect</code>, target selection wherever the screen needs it. I refused that on principle.
</p>
<p class="text-slate-400 mb-4 leading-relaxed">
Instead, the engine lives as pure TypeScript modules beneath the framework: <code class="text-slate-300">targetSelection</code>, <code class="text-slate-300">motionPatterns</code>, <code class="text-slate-300">weaknessScoring</code>, <code class="text-slate-300">fingerAssignment</code>, <code class="text-slate-300">statistics</code>. They take inputs and return values. They depend on no React, no Zustand, no DOM. The React layer is a renderer; Zustand holds UI state only.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
That separation paid off twice. First, it let me reason about the engine independently — testable, swappable, no hidden coupling to component lifecycle. Second, when a mid-build product pivot reframed the engine's responsibilities, the entire change happened inside the domain layer. The UI was unaffected because the UI was never the source of truth.
</p>

<h2 class="text-xl text-sky-400 mb-4">Values as architectural constraints</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
The product principles read like marketing copy if you let them: accuracy over speed, no gamification, transparent engine. They are not. They are constraints encoded in the engine.
</p>
<p class="text-slate-400 mb-4 leading-relaxed">
Weakness scoring is transparent because the function is pure and the inputs are visible — the user can see exactly which characters and patterns drove a target selection. There are no pass/fail verdicts because the engine never returns one; it surfaces target numbers, the user evaluates themselves. Target selection is deterministic given the same inputs, because non-determinism in feedback is a bug, not a feature.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
When values shape architecture, the values become enforceable. Removing the gamification later isn't a redesign — it's already absent.
</p>

<h2 class="text-xl text-sky-400 mb-4">Modeling the keyboard</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
A browser cannot tell which finger pressed a key. It receives a keycode and nothing else. For a typing platform that targets split columnar keyboards, that is the central modeling problem.
</p>
<p class="text-slate-400 mb-4 leading-relaxed">
Finger assignment is a deterministic resolver: given a keyboard profile (Sofle, Lily58) and a journey (conventional-mapping vs. strict-columnar), return which physical finger should press each key. Layered on top of that resolver are split-specific metrics — inner-column error rate, cross-hand bigram timing, thumb-cluster decision time — that no other typing platform surfaces because no other typing platform models the hardware this way.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
The resolver is small. The leverage is large. Almost every meaningful product feature reads from it.
</p>

<h2 class="text-xl text-sky-400 mb-4">What shipped</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
kerf is live at <a href="https://typekerf.com" target="_blank" class="text-sky-400 hover:underline">typekerf.com</a>. Onboarding captures keyboard profile, finger-assignment journey, and current phase (transitioning vs. refining). The dashboard surfaces split-specific metrics in language the user actually cares about. Practice sessions follow an explicit briefing → attention → evaluation loop — no mystery, no ceremony. The keyboards screen renders the user's specific layout with correct columnar finger assignments instead of the QWERTY default that other platforms ship.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
Shipped solo, end to end — product positioning, architecture, design system, implementation.
</p>

<h2 class="text-xl text-sky-400 mb-4">How it was built</h2>
<p class="text-slate-400 leading-relaxed">
Built with a structured Claude Code workflow — <a href="case-kerf-workflow.html" class="text-sky-400 hover:underline">see the build process →</a>
</p>

</body>
</html>
```

- [ ] **Step 2: Verify the file exists and is non-empty**

Run: `wc -l public/case-kerf.html`
Expected: a line count between 60 and 100.

- [ ] **Step 3: Visual verification in browser**

Run from `/Users/falah/Work/shariski`:

```bash
python3 -m http.server 8765 --directory public
```

Open `http://localhost:8765/case-kerf.html` in a browser. Verify:

1. Page loads with the same dark navy background as `case-settlement.html`.
2. H1 reads "Kerf — Typing Platform for Split-Keyboard Transitioners".
3. Six H2 headings appear, all in sky-blue, in this order: *What kerf is*, *A domain core, not frontend logic*, *Values as architectural constraints*, *Modeling the keyboard*, *What shipped*, *How it was built*.
4. The "← Back to Home" link points to `index.html` (will 404 until index is updated in Task 4 — that's expected).
5. The two `typekerf.com` links open in a new tab.
6. The "see the build process" link points to `case-kerf-workflow.html` (will 404 until Task 3 — expected).
7. Browser console has no errors.

Stop the server with Ctrl+C when done.

- [ ] **Step 4: Commit (skip if Task 0 skipped)**

```bash
git add public/case-kerf.html
git commit -m "feat: add kerf engineering case study"
```

---

## Task 3: Create `case-kerf-workflow.html` (build-workflow case study)

**Files:**
- Create: `public/case-kerf-workflow.html`

This page is longer than the engineering page because it makes a more contested claim ("I shipped a real product using AI") and needs more evidence — including the four inline image pairs.

- [ ] **Step 1: Write `public/case-kerf-workflow.html`**

Create `public/case-kerf-workflow.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>How Kerf Was Built — AI-Assisted Workflow Case Study | Falahudin Halim Shariski</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="description" content="The structured Claude Code workflow used to design, architect, and ship kerf — specs before code, decisions as ADRs, subagent-driven TDD, visual audits.">
<script src="https://cdn.tailwindcss.com"></script>
<style>
body {
  background-color: #020617;
  color: #cbd5e1;
  font-family: ui-sans-serif, system-ui;
}
</style>
</head>

<body class="px-6 py-16 max-w-4xl mx-auto">

<a href="index.html" class="text-sky-400 text-sm hover:underline">
← Back to Home
</a>

<h1 class="text-3xl font-bold text-white mt-8 mb-4">
How Kerf Was Built
</h1>
<p class="text-slate-500 text-sm mb-8">
A structured Claude Code workflow — specs before code, decisions as ADRs, subagent-driven TDD, visual audits.
</p>

<h2 class="text-xl text-sky-400 mb-4">Spec before code</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
kerf has a <code class="text-slate-300">docs/</code> folder before it has a working build. Product spec, technical architecture, information architecture, design system, task breakdown — written, revised, and committed as living documents. Decisions are visible artifacts, not tribal knowledge.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
The discipline matters more than the tool. A spec you can read, link, and amend is a spec you can argue with. A spec that lives only in conversation is one that drifts the moment the conversation ends.
</p>

<h2 class="text-xl text-sky-400 mb-4">Decisions as ADRs</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
Every meaningful product or architectural pivot lives in a design-evolution log as a numbered ADR. Cost, motivation, and downstream impact are captured at the time of the decision, not reconstructed later from git blame.
</p>
<p class="text-slate-400 mb-4 leading-relaxed">
The clearest example: ADR-003. Mid-build, the product reframed from "generic typing platform with split-keyboard support" to "deliberate-practice platform for split-keyboard transition." That change added six to nine weeks of work, introduced a new <code class="text-slate-300">session_targets</code> table, added journey-aware scoring to the weakness model, and inserted a target-selection engine layer above the existing exercise generator.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
The ADR was written before any of those changes were implemented. The architecture spec was updated. Then the code followed. Re-spec, then re-code — never the reverse.
</p>

<h2 class="text-xl text-sky-400 mb-4">Decompose into shippable milestones</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
The 18-to-26-week build is broken into phases, and each phase produces something demo-able. No big-bang integration. The first phase that runs onboarding doesn't need a working engine; the first phase with an engine doesn't need polished UI. The phases compose, but each one is shippable in isolation.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
Solo development without milestone discipline turns into a perpetually-90%-done branch. The discipline isn't about velocity. It's about always having something that works.
</p>

<h2 class="text-xl text-sky-400 mb-4">Subagent-driven TDD</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
Implementation runs through Claude Code subagents — fresh context per task, isolated changes, tests-first. The structure is what makes the model's output coherent across months: every task starts with a failing test, ends with a passing one, and gets reviewed before merge.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
The model is the typist. I am the architect, the reviewer, and the person responsible for the result. The subagent doesn't decide what good looks like; it executes against a spec that does.
</p>

<h2 class="text-xl text-sky-400 mb-4">Visual audits against design intent</h2>
<p class="text-slate-400 mb-6 leading-relaxed">
Visual audits compare rendered implementation against the design wireframes systematically — not vibes-based "looks fine," but a structured side-by-side check on every primary screen. Wireframe on the left, live implementation on the right.
</p>

<div class="space-y-10 mb-8">

<figure>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <img src="images/kerf/audit-home-wireframe.png" alt="Home screen wireframe" class="w-full rounded border border-slate-800">
    <img src="images/kerf/audit-home-impl.png" alt="Home screen implementation" class="w-full rounded border border-slate-800">
  </div>
  <figcaption class="text-slate-500 text-sm mt-2">
    Home — confirms hero hierarchy, primary CTA placement, and onboarding entry point match the spec.
  </figcaption>
</figure>

<figure>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <img src="images/kerf/audit-dashboard-wireframe.png" alt="Dashboard wireframe" class="w-full rounded border border-slate-800">
    <img src="images/kerf/audit-dashboard-impl.png" alt="Dashboard implementation" class="w-full rounded border border-slate-800">
  </div>
  <figcaption class="text-slate-500 text-sm mt-2">
    Dashboard — verifies split-specific metrics surface in the order and language the spec requires, not as a generic stats dump.
  </figcaption>
</figure>

<figure>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <img src="images/kerf/audit-keyboards-wireframe.png" alt="Keyboards screen wireframe" class="w-full rounded border border-slate-800">
    <img src="images/kerf/audit-keyboards-impl.png" alt="Keyboards screen implementation" class="w-full rounded border border-slate-800">
  </div>
  <figcaption class="text-slate-500 text-sm mt-2">
    Keyboards — checks that the rendered split layout uses correct columnar finger assignments rather than QWERTY defaults.
  </figcaption>
</figure>

<figure>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <img src="images/kerf/audit-practice-wireframe.png" alt="Practice session wireframe" class="w-full rounded border border-slate-800">
    <img src="images/kerf/audit-practice-impl.png" alt="Practice session implementation" class="w-full rounded border border-slate-800">
  </div>
  <figcaption class="text-slate-500 text-sm mt-2">
    Practice — confirms the briefing → attention → evaluation loop is preserved in the live UI, with no celebratory verdicts inserted.
  </figcaption>
</figure>

</div>

<h2 class="text-xl text-sky-400 mb-4">Re-spec when reality shifts</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
ADR-003 was the largest re-spec, but not the only one. Whenever implementation surfaced something the model missed — an unhandled phase transition, a journey case that broke the resolver, a UI affordance that contradicted a stated value — the docs were updated first, then the code. The doc tree is the source of truth. The codebase is the realization of the doc tree.
</p>
<p class="text-slate-400 mb-6 leading-relaxed">
This is the inversion of "code is the spec." Code lies; specs are read. When the spec is the artifact people argue with, you get a different shape of conversation, and a different shape of product.
</p>

<h2 class="text-xl text-sky-400 mb-4">What this workflow is and isn't</h2>
<p class="text-slate-400 mb-4 leading-relaxed">
This is not "I prompted Claude into a working app." kerf has a 22 KB product spec, a 53 KB architecture document, a 41 KB task breakdown, and a 91 KB design-evolution log. None of those documents exist by accident. They are the work.
</p>
<p class="text-slate-400 mb-4 leading-relaxed">
What changes with AI as leveraged tooling: the typing speed of implementation, the willingness to write a failing test before the function exists, the patience for refactoring when the spec shifts. What does not change: the responsibility for taste, for architecture, for whether the product is worth shipping at all.
</p>
<p class="text-slate-400 leading-relaxed">
The workflow above is what made AI assistance compound across a real product instead of dissolve into demo-ware. It's the discipline that scales, not the tool.
</p>

</body>
</html>
```

- [ ] **Step 2: Verify the file exists and is non-empty**

Run: `wc -l public/case-kerf-workflow.html`
Expected: a line count between 100 and 160.

- [ ] **Step 3: Visual verification in browser**

Run from `/Users/falah/Work/shariski`:

```bash
python3 -m http.server 8765 --directory public
```

Open `http://localhost:8765/case-kerf-workflow.html`. Verify:

1. Page loads with the same dark navy background as `case-settlement.html` and `case-kerf.html`.
2. H1 reads "How Kerf Was Built", subtitle below is in muted slate.
3. Seven H2 headings appear, all in sky-blue, in this order: *Spec before code*, *Decisions as ADRs*, *Decompose into shippable milestones*, *Subagent-driven TDD*, *Visual audits against design intent*, *Re-spec when reality shifts*, *What this workflow is and isn't*.
4. All four image pairs render. On desktop they appear side-by-side; on a narrow viewport they stack. Each pair has a captioned figcaption.
5. No broken images (every `<img>` shows; no broken-image icons).
6. The "← Back to Home" link points to `index.html` (still 404 until Task 4 — expected).
7. Browser console has no errors and no 404s for the eight image files.

Stop the server with Ctrl+C when done.

- [ ] **Step 4: Commit (skip if Task 0 skipped)**

```bash
git add public/case-kerf-workflow.html
git commit -m "feat: add kerf build-workflow case study with audit screenshots"
```

---

## Task 4: Add Kerf entry to homepage `index.html`

**Files:**
- Modify: `public/index.html` — insert one new `<div>` block inside the existing `<div class="space-y-14">` in the `#work` section, after the last existing project entry.

The existing structure (around lines 81–116) is:

```html
<div class="space-y-14">

<div>
<h3 class="text-xl font-semibold text-white mb-4">
Settlement Engine Refactor
</h3>
...
</div>

<div>
<h3 class="text-xl font-semibold text-white mb-4">
Redis ZSet Ordered Transaction Queue
</h3>
...
</div>

<div>
<h3 class="text-xl font-semibold text-white mb-4">
Financial Migration (USD → IDR)
</h3>
...
</div>

</div>
```

We add a fourth `<div>` block immediately before the closing `</div>` of the `space-y-14` wrapper.

- [ ] **Step 1: Insert the Kerf entry**

In `public/index.html`, find this exact block:

```html
<div>
<h3 class="text-xl font-semibold text-white mb-4">
Financial Migration (USD → IDR)
</h3>
<p class="text-slate-400 leading-relaxed">
Led precision-critical currency migration,
ensuring regulatory alignment without breaking financial reporting.
</p>
</div>

</div>
```

Replace it with:

```html
<div>
<h3 class="text-xl font-semibold text-white mb-4">
Financial Migration (USD → IDR)
</h3>
<p class="text-slate-400 leading-relaxed">
Led precision-critical currency migration,
ensuring regulatory alignment without breaking financial reporting.
</p>
</div>

<div>
<h3 class="text-xl font-semibold text-white mb-4">
Kerf — Typing Platform for Split-Keyboard Transitioners
</h3>
<p class="text-slate-400 leading-relaxed mb-4">
Live at <a href="https://typekerf.com" target="_blank" class="text-sky-400 hover:underline">typekerf.com</a>.
A pure-TypeScript adaptive engine sits beneath a React shell — finger-assignment resolver,
weakness scoring, target selection, and split-specific metrics, all framework-agnostic.
Designed and shipped solo through a structured Claude Code workflow.
</p>
<div class="flex gap-6">
<a href="case-kerf.html" class="text-sky-400 hover:underline text-sm">
View Engineering Case Study →
</a>
<a href="case-kerf-workflow.html" class="text-sky-400 hover:underline text-sm">
View Build Workflow →
</a>
</div>
</div>

</div>
```

(The closing `</div>` on the last line is the existing closing tag of the `space-y-14` wrapper — do not duplicate it.)

- [ ] **Step 2: Verify the homepage still parses**

Run: `grep -c "View Engineering Case Study" public/index.html`
Expected output: `1`

Run: `grep -c "View Build Workflow" public/index.html`
Expected output: `1`

Run: `grep -c "space-y-14" public/index.html`
Expected output: `1` (still exactly one wrapper, not duplicated).

- [ ] **Step 3: Visual verification in browser**

Run from `/Users/falah/Work/shariski`:

```bash
python3 -m http.server 8765 --directory public
```

Open `http://localhost:8765/index.html`. Verify:

1. The "Key Projects" section now lists four entries, in this order: Settlement Engine Refactor, Redis ZSet Ordered Transaction Queue, Financial Migration (USD → IDR), Kerf.
2. The Kerf entry shows two side-by-side links ("View Engineering Case Study →", "View Build Workflow →").
3. The visual rhythm matches Settlement Engine — same fonts, sizes, colors, spacing.
4. The animated grid background and reveal-on-scroll behavior still work.
5. Browser console has no errors.

Stop the server with Ctrl+C when done.

- [ ] **Step 4: Commit (skip if Task 0 skipped)**

```bash
git add public/index.html
git commit -m "feat: add kerf entry to homepage key projects"
```

---

## Task 5: End-to-end verification

**Files:** none modified — purely verification.

This task confirms every navigation path works after all previous tasks land. Skip nothing here.

- [ ] **Step 1: Start the local server**

Run from `/Users/falah/Work/shariski`:

```bash
python3 -m http.server 8765 --directory public
```

- [ ] **Step 2: Walk every navigation path**

Open `http://localhost:8765/` in a browser and click through each of these paths. Each should load without a 404 or console error:

1. Homepage → "View Engineering Case Study →" (Kerf row) → loads `case-kerf.html`.
2. From `case-kerf.html` → "see the build process →" → loads `case-kerf-workflow.html`.
3. From `case-kerf-workflow.html` → "← Back to Home" → loads `index.html`.
4. Homepage → "View Build Workflow →" (Kerf row) → loads `case-kerf-workflow.html` directly.
5. Homepage → "View Detailed Case Study →" (Settlement row) → loads `case-settlement.html` (existing, must not regress).
6. From `case-kerf.html` → "← Back to Home" → loads `index.html`.
7. From `case-settlement.html` → "← Back to Home" → loads `index.html` (regression check).

- [ ] **Step 3: Asset check on the workflow page**

While `case-kerf-workflow.html` is open, open the browser DevTools Network tab, hard-reload, and confirm:

- All 8 image requests under `/images/kerf/` return HTTP 200.
- No request returns 404 or 5xx.

- [ ] **Step 4: Mobile-width spot check**

Resize the browser window to roughly 400px wide (or use DevTools device toolbar). Confirm:

- Homepage Kerf entry — the two case-study links wrap or stack rather than overflowing horizontally.
- `case-kerf.html` — body remains readable; no horizontal scroll bar.
- `case-kerf-workflow.html` — image pairs stack vertically (single column) instead of forcing a horizontal scroll.

- [ ] **Step 5: Stop the server**

Ctrl+C in the terminal running `python3 -m http.server`.

- [ ] **Step 6: Final commit (skip if Task 0 skipped)**

If the previous task commits already covered every change, this step is a no-op — `git status` should report a clean tree. If anything is dirty (e.g. you fixed a typo during verification), commit it now:

```bash
git status
git add -A
git commit -m "chore: post-verification cleanup"
```

---

## Self-review notes

I checked this plan against the spec at `docs/superpowers/specs/2026-05-05-kerf-portfolio-addition-design.md`:

- **§2 Goal & audience:** covered by Tasks 2 and 3 (the two case studies) and Task 4 (homepage discoverability).
- **§3 Information architecture:** every file in the file tree is created or modified by exactly one task. The `images/kerf/` directory is Task 1; the two case-study files are Tasks 2 and 3; the homepage edit is Task 4.
- **§4.1 Homepage card:** Task 4 inserts the exact card content from the spec, with both trailing links.
- **§4.2 case-kerf.html sections:** Task 2's HTML contains all six sections in the order the spec requires (What kerf is → Domain core → Values → Modeling the keyboard → What shipped → How it was built).
- **§4.3 case-kerf-workflow.html sections:** Task 3's HTML contains all seven sections in order, plus the four audit-screenshot pairs inline with captions.
- **§5 Visual constraints:** Tailwind CDN preserved, no font additions, no new color tokens, no animations beyond the existing homepage grid, no emojis. Verified by inspection of the HTML written into Tasks 2, 3, and 4.
- **§6 Out of scope:** No analytics, OG meta tags, sitemap, blog scaffolding, favicon changes, settlement page refactor, or static site generator are introduced. (Note: a basic `<meta name="description">` is added to each new page — this is page-level metadata, not OG/social tags, and matches the existing `index.html` pattern.)
- **§7 Acceptance criteria 1–7:** mapped to verification steps in Tasks 4 and 5.

No placeholders found. All file paths are exact. All shell commands include expected output where verifiable. Type and identifier names referenced in the prose (`targetSelection`, `motionPatterns`, `weaknessScoring`, `fingerAssignment`, `session_targets`) are consistent across `case-kerf.html` and `case-kerf-workflow.html`.
