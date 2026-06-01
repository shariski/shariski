/* shariski.com — rail journey sound layer (synthetic, Web Audio)
   Silent until the rider opts in. Everything is generated from code — no assets.

   Ambience is THEMED PER WORLD (detected from the page filename):
     main line / works line → wind that thickens as you scroll
     depot                  → quiet terminal hum (a hub at rest)
     water                  → submerged rush + rising bubbles + a swish each stroke
     keys                   → mechanical keyboard, typed at a human cadence (NOT scroll-bound)
     kerf                   → a vintage typewriter: strikes + carriage-return ding
     departure              → teardown: low industrial hum + occasional metallic clinks
     gold                   → bullion vault: deep resonant hum + sparse metallic shimmer

   Typing/clinks/shimmer are TIME-BASED (steady), so fast scrolling never machine-guns them.
   Only the wind/water beds (and the water swish) respond to scroll speed.

   Public: window.RAILSOUND = { enable, disable, toggle, isOn, setVolume }
*/
(function () {
  'use strict';

  // ---------- which world are we in? ----------
  const path = location.pathname.toLowerCase();
  const THEME =
    /water/.test(path)      ? 'water'     :
    /keys/.test(path)       ? 'keys'      :
    /kerf/.test(path)       ? 'kerf'      :
    /gold/.test(path)       ? 'gold'      :
    /departure/.test(path)  ? 'departure' :
    /depot/.test(path)      ? 'depot'     : 'wind';   // main + works line = wind
  // discrete sounds tied to SCROLL distance (px). Only water uses this now.
  const STEP_PX = { water: 80 };

  // ---------- persisted state (shared across pages) ----------
  const LS = 'shariski.sound';
  let enabled = false, volume = 0.7;
  try {
    const s = JSON.parse(localStorage.getItem(LS) || '{}');
    if (typeof s.on === 'boolean') enabled = s.on;
    if (typeof s.vol === 'number') volume = s.vol;
  } catch (e) {}
  function persist() { try { localStorage.setItem(LS, JSON.stringify({ on: enabled, vol: volume })); } catch (e) {} }

  // ---------- audio graph ----------
  let ctx, master, comp, bus, noiseBuf, brownBuf, bed, started = false;

  function makeNoise(seconds, brown) {
    const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } else d[i] = w; }
    return buf;
  }
  function gain(v) { const g = ctx.createGain(); if (v != null) g.gain.value = v; return g; }
  function filt(type, freq, q) { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q != null) f.Q.value = q; return f; }
  function pan(x) { if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = x; return p; } return ctx.createGain(); }
  function noiseSrc(buf) { const s = ctx.createBufferSource(); s.buffer = buf || noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.5; return s; }
  function slice(s, t, dur) { s.start(t, Math.random() * 1.2, dur + 0.02); s.stop(t + dur + 0.03); }
  function env(p, t, peak, atk, dec) { p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + atk); p.exponentialRampToValueAtTime(0.0004, t + atk + dec); }
  function now() { return ctx.currentTime; }
  function loopNoise(buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }

  function build() {
    if (started) return;
    // iOS: route through the media "playback" session so audio is NOT silenced by the
    // hardware ring/mute switch — the rider explicitly opted in. (Safari 16.4+; no-op elsewhere.)
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    noiseBuf = makeNoise(2, false);
    brownBuf = makeNoise(3, true);
    master = gain(0.0001); master.connect(ctx.destination);
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 24; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.18;
    comp.connect(master);
    bus = gain(0.9); bus.connect(comp);
    bed = buildBed();
    started = true;
  }

  // ---------- continuous beds ----------
  function buildBed() {
    if (THEME === 'water') {
      const rum = loopNoise(brownBuf), lp = filt('lowpass', 240, 0.6), rg = gain(0.16); rum.connect(lp).connect(rg).connect(comp);
      const rush = loopNoise(noiseBuf), bp = filt('bandpass', 420, 0.5), rushG = gain(0.0); rush.connect(bp).connect(rushG).connect(comp);
      return { update(norm, prog) {
        lp.frequency.setTargetAtTime(240 - prog * 120, now(), 0.3);
        rushG.gain.setTargetAtTime(0.04 + norm * 0.34, now(), 0.2);
        bp.frequency.setTargetAtTime(380 + norm * 520, now(), 0.2);
      } };
    }
    if (THEME === 'gold') {
      const a = ctx.createOscillator(); a.type = 'sine'; a.frequency.value = 58;
      const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = 87;
      const hg = gain(0.05); a.connect(hg); b.connect(hg); hg.connect(comp); a.start(); b.start();
      const room = loopNoise(brownBuf), lp = filt('lowpass', 160), rg = gain(0.05); room.connect(lp).connect(rg).connect(comp);
      return { update(norm) { rg.gain.setTargetAtTime(0.05 + norm * 0.12, now(), 0.3); } };
    }
    if (THEME === 'depot') {                            // a quiet terminal at rest
      const a = ctx.createOscillator(); a.type = 'sine'; a.frequency.value = 55;
      const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = 82.5;
      const hg = gain(0.045); a.connect(hg); b.connect(hg); hg.connect(comp); a.start(); b.start();
      const air = loopNoise(noiseBuf), lp = filt('lowpass', 480, 0.5), ag = gain(0.014); air.connect(lp).connect(ag).connect(comp);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05; const lg = gain(6); lfo.connect(lg).connect(b.frequency); lfo.start();
      return { update() {} };
    }
    if (THEME === 'keys' || THEME === 'kerf' || THEME === 'departure') {
      const room = loopNoise(brownBuf), lp = filt('lowpass', 180), rg = gain(0.03); room.connect(lp).connect(rg).connect(comp);
      if (THEME === 'departure') {
        const hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 50;
        const hl = filt('lowpass', 120), hgn = gain(0.02); hum.connect(hl).connect(hgn).connect(comp); hum.start();
      }
      return { update(norm) { rg.gain.setTargetAtTime(0.025 + norm * 0.04, now(), 0.3); } };
    }
    // default — wind (main + works line)
    const wind = loopNoise(brownBuf), lp = filt('lowpass', 130, 0.5), wg = gain(0.0); wind.connect(lp).connect(wg).connect(comp);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08; const lg = gain(18); lfo.connect(lg).connect(lp.frequency); lfo.start();
    return { update(norm) {
      lp.frequency.setTargetAtTime(110 + norm * 220, now(), 0.2);
      wg.gain.setTargetAtTime(0.18 + norm * 0.5, now(), 0.25);
    } };
  }

  // ---------- one-shots ----------
  // crisp mechanical key: a short top-click + a plasticky mid "thock" + a tiny low tap.
  // (no descending pitch sweep — that was the buzzy/farty part when fired rapidly.)
  function keystroke(g, pitch) {
    const t = now() + 0.004, p = pan((Math.random() * 2 - 1) * 0.35); p.connect(bus);
    const s = noiseSrc(), hp = filt('highpass', 2600), cg = gain(); env(cg.gain, t, 0.42 * g, 0.0008, 0.01); s.connect(hp).connect(cg).connect(p); slice(s, t, 0.012);
    const s2 = noiseSrc(), bp = filt('bandpass', 820 * pitch, 1.1), cg2 = gain(); env(cg2.gain, t, 0.38 * g, 0.001, 0.03); s2.connect(bp).connect(cg2).connect(p); slice(s2, t, 0.035);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 150 * pitch; const og = gain(); env(og.gain, t, 0.12 * g, 0.001, 0.03); o.connect(og).connect(p); o.start(t); o.stop(t + 0.05);
  }
  function spacebar() {
    const t = now() + 0.004, p = pan((Math.random() * 2 - 1) * 0.12); p.connect(bus);
    const s = noiseSrc(), bp = filt('bandpass', 520, 0.9), cg = gain(); env(cg.gain, t, 0.4, 0.001, 0.05); s.connect(bp).connect(cg).connect(p); slice(s, t, 0.05);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 120; const og = gain(); env(og.gain, t, 0.2, 0.002, 0.05); o.connect(og).connect(p); o.start(t); o.stop(t + 0.08);
  }
  // typewriter hammer: metallic strike + platen thunk + short metal tail
  function typeStrike(g) {
    const t = now() + 0.004, p = pan((Math.random() * 2 - 1) * 0.3); p.connect(bus);
    const s = noiseSrc(), bp = filt('bandpass', 2200, 1.4), cg = gain(); env(cg.gain, t, 0.4 * g, 0.0008, 0.02); s.connect(bp).connect(cg).connect(p); slice(s, t, 0.025);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 175; const og = gain(); env(og.gain, t, 0.3 * g, 0.001, 0.05); o.connect(og).connect(p); o.start(t); o.stop(t + 0.08);
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 3200 * (0.95 + Math.random() * 0.1); const o2g = gain(); env(o2g.gain, t, 0.045 * g, 0.001, 0.04); o2.connect(o2g).connect(p); o2.start(t); o2.stop(t + 0.06);
  }
  function typeBell() {                            // carriage-return ding
    const t = now() + 0.004;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 2100;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 2100 * 2.76;
    const g = gain(); env(g.gain, t, 0.16, 0.002, 0.55); const g2 = gain(0.3); o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus);
    o.start(t); o2.start(t); o.stop(t + 0.75); o2.stop(t + 0.75);
  }
  function carriage() {                            // return slide
    const t = now() + 0.004, s = noiseSrc(brownBuf), bp = filt('bandpass', 900, 0.8);
    bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(1500, t + 0.18);
    const g = gain(); env(g.gain, t, 0.16, 0.02, 0.2); s.connect(bp).connect(g).connect(bus); s.start(t); s.stop(t + 0.3);
  }
  function clink() {                              // metallic ratchet (teardown)
    const t = now() + 0.005, p = pan((Math.random() * 2 - 1) * 0.3); p.connect(bus);
    [2100, 3150, 4300].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f * (0.98 + Math.random() * 0.04);
      const g = gain(); env(g.gain, t, 0.055 / (i + 1), 0.001, 0.12 + i * 0.04); o.connect(g).connect(p); o.start(t); o.stop(t + 0.35); });
    const s = noiseSrc(), bp = filt('bandpass', 3000, 1.2), cg = gain(); env(cg.gain, t, 0.16, 0.001, 0.02); s.connect(bp).connect(cg).connect(p); slice(s, t, 0.03);
  }
  function shimmer() {                            // sparse metallic ring (gold)
    const t = now() + 0.005, p = pan((Math.random() * 2 - 1) * 0.4); p.connect(bus);
    const base = 1600 + Math.random() * 520;
    [1, 1.5, 2.04].forEach((m, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = base * m;
      const g = gain(); env(g.gain, t, 0.07 / (i + 1), 0.004, 0.5 + i * 0.15); o.connect(g).connect(p); o.start(t); o.stop(t + 0.95); });
  }
  function bubble() {
    const t = now() + 0.005, p = pan((Math.random() * 2 - 1) * 0.5); p.connect(bus);
    const o = ctx.createOscillator(); o.type = 'sine'; const f0 = 260 + Math.random() * 260;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 2.4, t + 0.07);
    const g = gain(); env(g.gain, t, 0.12, 0.006, 0.08); o.connect(g).connect(p); o.start(t); o.stop(t + 0.12);
  }
  function swish(g) {
    const t = now() + 0.005, p = pan((Math.random() * 2 - 1) * 0.5); p.connect(bus);
    const s = noiseSrc(brownBuf), bp = filt('bandpass', 500 + Math.random() * 300, 0.7), cg = gain(); env(cg.gain, t, 0.16 * g, 0.04, 0.14); s.connect(bp).connect(cg).connect(p); slice(s, t, 0.2);
  }
  function splash() {
    const t = now() + 0.01, s = noiseSrc(brownBuf), bp = filt('bandpass', 700, 0.6);
    bp.frequency.setValueAtTime(1200, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.5);
    const g = gain(); env(g.gain, t, 0.5, 0.01, 0.5); s.connect(bp).connect(g).connect(bus); s.start(t); s.stop(t + 0.6);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.2);
    const og = gain(); env(og.gain, t, 0.3, 0.005, 0.22); o.connect(og).connect(bus); o.start(t); o.stop(t + 0.3);
  }
  function dive() {                               // whoosh into a world (main / works line)
    if (!started || !enabled) return;
    const t = now() + 0.01, s = noiseSrc(brownBuf); s.loop = true;
    const bp = filt('bandpass', 220, 0.7); bp.frequency.setValueAtTime(220, t); bp.frequency.exponentialRampToValueAtTime(3600, t + 0.85);
    const g = gain(); env(g.gain, t, 0.5, 0.25, 0.85); s.connect(bp).connect(g).connect(bus); s.start(t); s.stop(t + 1.2);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.9);
    const og = gain(); env(og.gain, t, 0.4, 0.05, 0.9); o.connect(og).connect(bus); o.start(t); o.stop(t + 1.05);
  }

  // ---------- time-based ambient (steady, never scroll-driven) ----------
  // returns ms until the next event; negative = this theme has no ambient one-shots.
  let wordPos = 0, twPos = 0;
  function ambientNext() {
    const r = Math.random();
    if (THEME === 'keys') {
      if (wordPos >= 3 && r < 0.24) { spacebar(); wordPos = 0; return 200 + Math.random() * 300; }
      keystroke(0.8 + Math.random() * 0.25, 0.9 + Math.random() * 0.35); wordPos++;
      if (r < 0.05) return 600 + Math.random() * 1300;       // thinking pause
      return 70 + Math.random() * 110;                        // normal inter-key
    }
    if (THEME === 'kerf') {                                   // typewriter
      if (twPos >= 28 + Math.random() * 16) { typeBell(); carriage(); twPos = 0; return 520 + Math.random() * 520; }
      if (twPos > 0 && r < 0.16) { typeStrike(0.5); twPos++; return 180 + Math.random() * 220; } // space
      typeStrike(0.72 + Math.random() * 0.22); twPos++;
      if (r < 0.05) return 500 + Math.random() * 900;
      return 120 + Math.random() * 150;
    }
    if (THEME === 'departure') { clink(); return 1500 + Math.random() * 2800; }
    if (THEME === 'gold')      { shimmer(); return 2800 + Math.random() * 4500; }
    if (THEME === 'water')     { bubble(); return 900 + Math.random() * 1900; }
    return -1;                                                // wind / depot → bed only
  }
  let ambTimer = 0;
  function ambientTick() {
    if (!enabled || !started) return;
    const d = ambientNext();
    if (d < 0) return;
    ambTimer = setTimeout(ambientTick, d);
  }

  // ---------- scroll → speed + (water only) discrete emission ----------
  let speed = 0, lastY = (window.scrollY || 0), scrollAcc = 0;
  function trackSpeed() {
    const y = window.scrollY || window.pageYOffset || 0, ady = Math.abs(y - lastY); lastY = y;
    speed += (ady - speed) * 0.18;
    if (started && enabled) {
      const norm = Math.min(1, speed / 60);
      const max = document.documentElement.scrollHeight - innerHeight, prog = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (bed && bed.update) bed.update(norm, prog);
      const sp = STEP_PX[THEME] || 0;
      if (sp > 0) { scrollAcc += ady; let n = 0; while (scrollAcc >= sp && n < 4) { scrollAcc -= sp; swish(0.8 + Math.random() * 0.4); n++; } if (scrollAcc > sp * 4) scrollAcc = 0; }
    }
    requestAnimationFrame(trackSpeed);
  }
  requestAnimationFrame(trackSpeed);

  document.addEventListener('rail:dive', dive);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(ambTimer); else if (enabled && started) ambientTick(); });

  // ---------- enable / disable ----------
  let entered = false;
  function applyMaster() {
    if (!started) return;
    const t = now();
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
    master.gain.linearRampToValueAtTime(enabled ? volume : 0.0001, t + (enabled ? 0.6 : 0.4));
  }
  function enable() {
    enabled = true; persist(); build();
    if (ctx.state === 'suspended') ctx.resume();
    applyMaster();
    if (!entered) { entered = true; if (THEME === 'water') splash(); }
    clearTimeout(ambTimer); ambientTick();
    syncUI();
  }
  function disable() { enabled = false; persist(); if (started) { applyMaster(); clearTimeout(ambTimer); } syncUI(); }
  function toggle() { enabled ? disable() : enable(); }
  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); persist(); applyMaster(); }

  window.RAILSOUND = { enable, disable, toggle, setVolume, isOn: () => enabled };

  // ---------- opt-in toggle UI ----------
  const css = document.createElement('style');
  css.textContent = `
  .rs-toggle{position:fixed;left:20px;bottom:70px;z-index:62;cursor:pointer;
    font-family:var(--mono,monospace);font-size:11px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--dim,#7c86a6);background:rgba(136,166,255,.05);
    border:1px solid rgba(136,166,255,.22);border-radius:999px;padding:9px 14px 9px 12px;
    display:flex;align-items:center;gap:10px;
    transition:color .25s,border-color .25s,box-shadow .25s,opacity .4s ease,transform .4s ease}
  .rs-toggle:hover{color:var(--accent,#88a6ff);border-color:var(--accent,#88a6ff);box-shadow:0 0 18px rgba(136,166,255,.2)}
  .rs-eq{display:flex;align-items:flex-end;gap:2px;height:12px}
  .rs-eq i{width:2px;height:4px;border-radius:1px;background:currentColor;opacity:.55;transform-origin:bottom}
  .rs-toggle.on{color:var(--accent,#88a6ff);border-color:rgba(136,166,255,.4)}
  .rs-toggle.on .rs-eq i{opacity:1}
  .rs-toggle.on .rs-eq i:nth-child(1){animation:rseq .9s ease-in-out infinite}
  .rs-toggle.on .rs-eq i:nth-child(2){animation:rseq .9s ease-in-out infinite .15s}
  .rs-toggle.on .rs-eq i:nth-child(3){animation:rseq .9s ease-in-out infinite .3s}
  .rs-toggle.on .rs-eq i:nth-child(4){animation:rseq .9s ease-in-out infinite .45s}
  @keyframes rseq{0%,100%{height:3px}50%{height:12px}}
  @media (prefers-reduced-motion: reduce){.rs-toggle.on .rs-eq i{animation:none;height:8px}}
  `;
  document.head.appendChild(css);

  const LABELS = { wind: 'sound', water: 'water', keys: 'keys', kerf: 'type', departure: 'sound', gold: 'sound', depot: 'sound' };
  const btn = document.createElement('button');
  btn.className = 'rs-toggle';
  btn.setAttribute('aria-label', 'toggle sound');
  btn.innerHTML = '<span class="rs-eq"><i></i><i></i><i></i><i></i></span><span class="rs-label">sound</span>';
  btn.addEventListener('click', toggle);
  function syncUI() {
    btn.classList.toggle('on', enabled);
    btn.querySelector('.rs-label').textContent = enabled ? (LABELS[THEME] || 'sound') + ' on' : 'sound off';
  }
  function mount() {
    document.body.appendChild(btn); syncUI();
    if (enabled) {
      // Sound was on last visit, but autoplay policy needs a fresh user gesture to
      // start audio. Resume on the first interaction — but IGNORE taps on the toggle
      // itself, so the toggle's own handler stays in charge. (Otherwise a single tap
      // both arms-on via this listener AND toggles it, cancelling out to silence.)
      enabled = false; syncUI();
      const EVTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
      const rm = () => EVTS.forEach(t => removeEventListener(t, arm));
      const arm = (e) => {
        if (e && e.target && e.target.closest && e.target.closest('.rs-toggle')) return;
        rm(); enable();
      };
      EVTS.forEach(t => addEventListener(t, arm, { passive: true }));
      btn.addEventListener('click', rm, { once: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
