# Kerf Portfolio Addition — Design Spec

> Status: approved (brainstorming gate)
> Date: 2026-05-05
> Author: Falahudin Halim Shariski
> Site: shariski.com (static `/public` HTML)
> Subject project: kerf (live at typekerf.com, source at `../kerf`)

## 1. Goal

Add Kerf to shariski.com as portfolio evidence, with two distinct shareable URLs:

1. An engineering case study — for hiring managers and engineering leaders evaluating architectural judgment.
2. A build-workflow case study — a public, shareable signal that the author ships real products using a structured Claude Code workflow.

Both pages must coexist with the existing site without diluting its tone (restrained, financial-systems voice) or adding maintenance burden (no build step, no framework, no dependencies).

## 2. Audience and framing

- **Primary audience:** hiring managers, engineering leaders, recruiters.
- **Secondary audience:** other engineers curious about AI-assisted engineering workflows.
- **Explicit non-goal:** marketing or selling kerf the product. Kerf is the *artifact*; the case studies are about the engineer who built it.
- **Workflow disclosure depth:** medium. Real artifacts and named decisions (e.g. ADR-003) are referenced. No raw spec dumps. The four wireframe-vs-implementation audit screenshots are used as inline evidence.

## 3. Information architecture

```
public/
├── index.html                       (modified — Kerf entry added to Key Projects)
├── case-settlement.html             (unchanged)
├── case-kerf.html                   (new — engineering case study)
├── case-kerf-workflow.html          (new — AI-assisted build process)
├── favicon.svg                      (unchanged)
└── images/
    └── kerf/
        ├── audit-home-wireframe.png
        ├── audit-home-impl.png
        ├── audit-dashboard-wireframe.png
        ├── audit-dashboard-impl.png
        ├── audit-keyboards-wireframe.png
        ├── audit-keyboards-impl.png
        ├── audit-practice-wireframe.png
        └── audit-practice-impl.png
```

The Kerf entry on the homepage carries **two trailing links** (engineering + workflow) — a deliberate departure from the single-link pattern used for Settlement Engine. This is how the workflow story becomes discoverable without introducing a new homepage section.

## 4. Page designs

### 4.1 Homepage (`index.html`) — modification

Add a fourth entry to the existing `space-y-14` "Key Projects" list. Do not change the three existing entries. Do not restructure any other section. Visual rhythm and class names match Settlement Engine's entry.

**Card content (final copy):**

```
Kerf — Typing Platform for Split-Keyboard Transitioners

Live at typekerf.com. A pure-TypeScript adaptive engine sits beneath
a React shell — finger-assignment resolver, weakness scoring, target
selection, and split-specific metrics, all framework-agnostic.
Designed and shipped solo through a structured Claude Code workflow.

  View Engineering Case Study →    View Build Workflow →
```

Both links use the same sky-400 / hover:underline / text-sm treatment as the existing Settlement Engine link.

### 4.2 `case-kerf.html` — engineering case study

Visual treatment: identical to `case-settlement.html` (same head, body classes, container width, back-link, H2 styling). Different section structure because the lead engineering story is different.

**Sections, in order:**

1. **What kerf is.** One paragraph. Live link to typekerf.com. Names the product clearly so hiring managers know what they're reading about before evaluating any decisions.
2. **The engineering decision: a domain core, not frontend logic.** *(The lead.)* Why it would have been easy to write this as React with business logic in components, and why I refused. Pure-TS engine modules — `targetSelection`, `motionPatterns`, `weaknessScoring`, `fingerAssignment` — sit beneath React. Zustand only holds UI state. React is a renderer. Frame as transferable architectural judgment, not as kerf trivia.
3. **Values as architectural constraints.** *(Supporting.)* Accuracy-over-speed and anti-gamification aren't marketing copy — they constrain the engine. Transparent weakness scoring (no black-box rating). No pass/fail verdicts. Deterministic target selection. Values that constrain architecture make the architecture cleaner.
4. **Modeling the keyboard.** *(Supporting.)* Browsers can't see which finger pressed a key. Finger assignment is a deterministic resolver over keyboard profile + journey (conventional vs. columnar). That resolver drives split-specific metrics — inner-column error rate, cross-hand bigram timing — that no other typing platform surfaces.
5. **What shipped.** Live at typekerf.com; what users do with it; concrete shipped surface (onboarding, dashboard, practice, keyboards screens).
6. **Pointer to workflow page.** Single line + link: "Built with a structured Claude Code workflow — see the build process →"

**Length target:** roughly the length of `case-settlement.html`. Short paragraphs, plain prose, no marketing adjectives.

### 4.3 `case-kerf-workflow.html` — AI-assisted build case study

Visual treatment: identical to `case-kerf.html` and `case-settlement.html`. Longer body — this page is making a more contested claim and needs more evidence. Still single-screen-scrollable; not a manifesto.

**Sections, in order:**

1. **Spec before code.** Living documents in `docs/`: product spec, technical architecture, information architecture, design system. Written, revised, and committed *before* implementation. Decisions are visible artifacts, not tribal knowledge.
2. **Decisions as ADRs.** Every meaningful product or architectural pivot recorded in a design-evolution log. Concrete example: **ADR-003** mid-build reframed kerf from a generic typing app to deliberate-practice for split-keyboard transition. Captured cost (6–9 added weeks) and downstream changes (`session_targets` table, journey-aware scoring, new target-selection layer). Re-specced before re-coding.
3. **Decompose into shippable milestones.** 18–26-week build broken into phases that each produce something demo-able. No big-bang integrations.
4. **Subagent-driven TDD implementation.** Parallel Claude Code subagents on isolated tasks; tests-first; specs self-review before code review. The model is the typist; the structure (test gates, ADRs, audits) keeps output coherent across months.
5. **Visual audits against design intent.** Compared rendered implementation against design wireframes systematically. **Inline evidence:** the four `audit-*-wireframe.png` / `audit-*-impl.png` pairs (Home, Dashboard, Keyboards, Practice). Each pair laid out side-by-side, captioned with one line noting what the audit checked.
6. **Re-spec when reality shifts.** When implementation surfaced a flaw in the model (the insight that produced ADR-003), docs were updated *first*, then the code followed. The doc tree is the source of truth, not the codebase.
7. **What this workflow is and isn't.** A short, candid closing section that distinguishes "I shipped a real product using AI as leveraged tooling" from "I prompted my way to a demo." This is the credibility move — most AI-assisted-build write-ups skip it.

**Audit screenshot layout:** simple two-column flex per pair, full-width on mobile (stacks). Caption below. No lightbox, no carousel.

## 5. Visual and tonal constraints

- **Tailwind via CDN** — no build step, no npm install, no framework introduction.
- **Color tokens unchanged:** `bg-slate-950` body (`#020617`), `text-slate-400` body copy, `text-sky-400` H2 and links, `text-white` H1.
- **Typography unchanged:** `ui-sans-serif, system-ui`. No web font additions.
- **No emojis, no badges, no "Made with ❤️".** Existing site has none.
- **No marketing adjectives** ("innovative", "cutting-edge", "leveraging", etc.) — voice matches the existing pages.
- **No animations beyond the existing animated grid** on the homepage. Case study pages stay static, like `case-settlement.html`.

## 6. Out of scope (explicit non-goals)

These are deferred — not because they're wrong, but to keep this change focused and reviewable. Any of them can be a follow-up.

- Analytics, OG meta tags, sitemap, robots.txt updates.
- Blog scaffolding, RSS, or any content management.
- Favicon, font, or color-token changes.
- Refactoring `case-settlement.html` to share structure with the new pages.
- Migrating the site to a static site generator (Astro / 11ty / etc.) even though three near-identical HTML files begin to argue for one.
- Responsive QA beyond what the existing pages already do (the existing pages already work on mobile via Tailwind defaults; new pages will inherit the same defaults).
- Any changes to the kerf project itself or its docs.

## 7. Acceptance criteria

The change is complete when:

1. `public/index.html` displays a Kerf entry as the fourth item under "Key Projects", with two functional links.
2. `public/case-kerf.html` exists, is reachable from the homepage, has all six sections in the order above, links back to home, and visually matches `case-settlement.html`.
3. `public/case-kerf-workflow.html` exists, is reachable from both the homepage and `case-kerf.html`, has all seven sections in the order above, includes the four audit screenshot pairs inline with captions, links back to home.
4. All four audit screenshot pairs (8 PNGs total) are present under `public/images/kerf/` and load on the workflow page.
5. No existing page is visually altered other than the homepage's Key Projects list.
6. The site renders correctly when served as static files (e.g. `python3 -m http.server` from `/public`).
7. No new dependencies are introduced; no build step is added.

## 8. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Workflow page reads as buzzword-y instead of credible | Section 7 ("What this workflow is and isn't") explicitly draws the line; medium-disclosure depth means real ADR numbers and real audits, not vague claims. |
| Tonal mismatch — kerf is a consumer product, the existing site speaks fintech | Case study text is rewritten in the existing site's voice; product-y language stays on typekerf.com itself. |
| Three near-identical HTML files start to argue for a static site generator | Acknowledged and accepted as future work; YAGNI for now. |
| Audit screenshots become stale if kerf UI evolves | Screenshots are dated build artifacts; treated as historical evidence, not current state. Caption can mention the date if needed. |
| Sensitive content in kerf docs accidentally leaks via the workflow page | Medium disclosure (no raw spec dumps); only published references are ADR numbers, table names, module names — no business-sensitive material. |

## 9. Implementation note

This spec hands off to the writing-plans skill, which will produce a step-by-step implementation plan covering:

- Order of file creation
- Exact Tailwind class reuse from existing pages
- Image copy commands from `../kerf/` to `public/images/kerf/`
- Verification steps (local serve + visual check of each page + each link)
