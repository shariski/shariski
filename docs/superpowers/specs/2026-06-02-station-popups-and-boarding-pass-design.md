# origin line — station popups (video) + boarding-pass fix

- **Date:** 2026-06-02
- **Status:** implemented + verified locally
- **Owner:** Falah (shariski)
- **Scope:** `public/index.html`, new `public/media/`. No `engine.js`, build step, or dependency.

Follow-up to `2026-06-01-shariski-redesign-implementation-design.md` §8/§12, which
intentionally shipped the station detail panels with placeholder `note` lines and an
empty `scene · artifact` slot. This pass fills them and fixes a keyboard-nav bug.

## 1. Boarding-pass `k`/↑ bug

**Symptom:** from the boarding pass, pressing `k` (or ↑) jumped to *water*, skipping
*departure*.

**Cause:** the platform overlay sits on top of departure, which is already stop `0`. The
shared engine's forward key ran `stepStop(1)` → `goTo(round(cur)+1)` = `goTo(1)`.

**Fix (in `index.html`, not `engine.js`):** a keydown listener registered *before*
`RAIL.init` so it runs first. While the platform is showing, ↑ / `k` / Enter calls
`pullOut()` (lands on departure, stop 0) and `stopImmediatePropagation()` so the shared
engine never also steps. Kept out of `engine.js` because the platform is an origin-line
concept; the engine is shared by 5 worlds + 2 other lines that have no platform.

## 2. Station popups → video

**Locked decisions:**

| # | Decision | Choice |
|---|----------|--------|
| 1 | Artifact slot content | Short **video** clip per stop |
| 2 | Frame | **Uniform square (1:1), `object-fit: cover`** (fair to portrait + landscape) |
| 3 | Playback | `autoplay muted loop playsinline`, `preload="metadata"` |
| 4 | Lifecycle | Built on open in `fill()`; **torn down** (pause + unload) on close / nav |
| 5 | Reduced motion | Show poster still, no autoplay |
| 6 | Fallback | No `media` → poster if present, else **collapse** the slot (never a broken box). Load error → same. |
| 7 | departure clip | Wired now with a dummy; real teardown clip dropped in later |
| 8 | `note` line | Becomes a one-line **field note** per stop |

**Data:** each `STATIONS` entry gains optional `media:'media/<stop>.mp4'` and
`poster:'media/<stop>.jpg'`. Helpers: `setSlotMedia(s)`, `showPoster(s)`,
`clearSlotMedia()`.

**Media:** `public/media/{departure,water,keys,kerf}.{mp4,jpg}` — currently **dummy
`testsrc2` placeholders** (mixed orientation, so the square crop is genuinely exercised).
See `public/media/README.md` for replacement + encoding guidance. The contact ("now")
stop has no media by design (shows contacts).

## 3. Verification (local, Playwright)

- First `k` from boarding pass → `RAIL.current() === 0` (departure), platform hidden.
  Second `k` → `1` (water). Bug fixed.
- departure popup: slot 435×435 square, `departure.mp4` autoplaying, `object-fit: cover`,
  field-note text present.
- Fallbacks: contact stop slot collapses (contacts shown); broken `src` collapses.
- Teardown: after close, slot has 0 children and no `<video>` is playing.
- Console: clean (only a deliberate 404 from the broken-src test).

## 4. Open / future

- Replace the 4 dummy clips with real footage (swimming, typing, kerf screen-rec, teardown).
- Optional: tap-to-unmute for clips with meaningful audio.
- Decide whether to commit the video binaries to git or serve them another way (size).
