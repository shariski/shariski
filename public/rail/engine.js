/* shariski.com — rail journey engine (vanilla canvas)
   Renders: astronomy sky (milky way, moon, twinkling stars) + perspective rail
   + ground/ballast + horizon fog + passing signal lights, with momentum + shake.
   Reads a shared CFG object; expose window.RAIL for the tweaks app + UI. */
(function () {
  'use strict';

  // ---- worlds (one expressive "World" control reshapes the whole palette) ----
  const WORLDS = {
    midnight: {
      label: 'midnight',
      sky: ['#04050e', '#080b1a', '#0e1322'],
      horizonGlow: 'rgba(120,150,255,0.10)',
      moon: '#e3e9ff', moonGlow: 'rgba(150,180,255,0.42)',
      star: '224,232,255',
      milky: '150,172,255',
      accent: '#88a6ff', ink: '#e9edf8', dim: '#7c86a6',
      rail: '210,222,255', sleeper: '92,100,132',
      ground: ['#0a0c16', '#04050d'],
      fog: '120,142,205', milkyMul: 1.0, starMul: 1.0
    },
    dusk: {
      label: 'golden dusk',
      sky: ['#160f2c', '#3a1e3c', '#7c3a2c'],
      horizonGlow: 'rgba(255,150,90,0.20)',
      moon: '#ffe7c4', moonGlow: 'rgba(255,170,100,0.42)',
      star: '255,233,214',
      milky: '255,190,150',
      accent: '#ff7a4d', ink: '#f1eadd', dim: '#bda07e',
      rail: '255,226,200', sleeper: '150,110,80',
      ground: ['#1b1109', '#0a0704'],
      fog: '255,172,112', milkyMul: 0.62, starMul: 0.7
    },
    dawn: {
      label: 'foggy dawn',
      sky: ['#1a2230', '#33414e', '#62737a'],
      horizonGlow: 'rgba(205,232,230,0.18)',
      moon: '#eef5f2', moonGlow: 'rgba(210,240,235,0.32)',
      star: '234,242,240',
      milky: '200,225,225',
      accent: '#6fc8bd', ink: '#e8efec', dim: '#8aa099',
      rail: '216,230,228', sleeper: '112,130,126',
      ground: ['#233032', '#131b1c'],
      fog: '205,228,224', milkyMul: 0.42, starMul: 0.85
    },
    water: {
      label: 'underwater',
      sky: ['#06121d', '#0a2536', '#0e3a4a'],
      horizonGlow: 'rgba(120,220,235,0.16)',
      moon: '#dff4f8', moonGlow: 'rgba(120,220,235,0.30)',
      star: '200,235,242',
      milky: '120,220,235',
      accent: '#5fcfd6', ink: '#e9edf8', dim: '#7c86a6',
      rail: '215,235,240', sleeper: '92,118,130',
      ground: ['#06121d', '#02080e'],
      fog: '120,200,215', milkyMul: 0, starMul: 0
    },
    keys: {
      label: 'keys',
      sky: ['#140d06', '#1c1308', '#241a0c'],
      horizonGlow: 'rgba(255,170,90,0.16)',
      moon: '#ffe6c2', moonGlow: 'rgba(255,170,100,0.30)',
      star: '255,224,196',
      milky: '255,190,150',
      accent: '#e6a14d', ink: '#f0e9dc', dim: '#9b8f7b',
      rail: '235,222,200', sleeper: '120,98,70',
      ground: ['#140d06', '#0c0804'],
      fog: '255,180,120', milkyMul: 0, starMul: 0
    },
    kerf: {
      label: 'kerf',
      sky: ['#1a2024', '#141a1d', '#0e1316'],
      horizonGlow: 'rgba(232,100,60,0.16)',
      moon: '#eef2f3', moonGlow: 'rgba(232,100,60,0.26)',
      star: '220,230,234',
      milky: '210,225,232',
      accent: '#e8643c', ink: '#eef2f3', dim: '#8a98a0',
      rail: '210,225,232', sleeper: '90,104,112',
      ground: ['#11161a', '#0a0d10'],
      fog: '232,120,80', milkyMul: 0, starMul: 0
    },
    gold: {
      label: 'gold vault',
      sky: ['#161009', '#1f160b', '#28200f'],
      horizonGlow: 'rgba(216,166,74,0.18)',
      moon: '#f6e7c0', moonGlow: 'rgba(216,166,74,0.30)',
      star: '246,231,196',
      milky: '230,200,140',
      accent: '#d8a64a', ink: '#f4eddc', dim: '#a08f6c',
      rail: '236,222,192', sleeper: '118,100,66',
      ground: ['#161009', '#0c0905'],
      fog: '216,176,96', milkyMul: 0, starMul: 0
    }
  };

  const CFG = { world: 'midnight', cruise: 6, cosmos: 6 };

  // ---- canvas + dom refs (set in init) ----
  let cab, wrap, cv, ctx, stationsEl, stEls = [], STATIONS = [];
  let onStationClick = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  // projection constants (kept from the original, tuned)
  const zNear = 1, zFar = 16, MSL = 16, BEND_F = 0.10, WAVES = 1.4, K = 9.0;
  let horizonY, DY, DX, cx, zFocus, BEND;

  // ---- star field (generated once, scaled by cosmos at draw time) ----
  const MAX_AMBIENT = 360, MAX_BAND = 320;
  let ambient = [], band = [];
  const BAND_ANGLE = -0.62;        // radians, diagonal sweep of the milky way
  const BAND_CX = 0.56, BAND_CY = 0.40; // band center in sky-normalized coords

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }

  function buildStars() {
    ambient = [];
    for (let i = 0; i < MAX_AMBIENT; i++) {
      ambient.push({
        nx: Math.random(), ny: Math.pow(Math.random(), 1.35), // bias toward top
        r: rnd(0.5, 1.7), b: rnd(0.25, 1), tw: rnd(0.6, 2.4), ph: rnd(0, 6.28),
        big: Math.random() < 0.06
      });
    }
    band = [];
    const ca = Math.cos(BAND_ANGLE), sa = Math.sin(BAND_ANGLE);
    for (let i = 0; i < MAX_BAND; i++) {
      const along = rnd(-0.75, 0.75);
      const across = gauss() * 0.12;
      const nx = BAND_CX + along * ca - across * sa;
      const ny = BAND_CY + along * sa + across * ca;
      band.push({
        nx, ny, r: rnd(0.4, 1.3), b: rnd(0.15, 0.8), tw: rnd(0.4, 1.8), ph: rnd(0, 6.28),
        across: Math.abs(across)
      });
    }
  }

  // ---- live state ----
  let cur = 0, target = 0, time = 0, last = 0, raf = 0, paused = false;
  // ---- branch / switch state ----
  let onStation = null, onStop = null, drawEnv = null, branchesEnabled = true;
  let armProgress = 0, branchVis = 0, branchSide = 1, lastStopKey = '';
  const ZSW = 3.0, BRANCH_SPREAD = 0.62;
  const N = () => STATIONS.length;

  function W_() { return WORLDS[CFG.world] || WORLDS.midnight; }

  function resize() {
    const r = cab.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizonY = 0.40 * H; DY = 0.66 * H; DX = 0.42 * W; cx = W / 2; BEND = BEND_F * W;
    zFocus = DY / (0.5 * H - horizonY);
  }

  function curveAt(z, phase) { const t = (z - zNear) / (zFar - zNear); return BEND * Math.sin(t * Math.PI * WAVES + phase) * t; }
  function fade(z) { return Math.max(0.05, Math.min(1, 1.12 - ((z - zNear) / (zFar - zNear)) * 1.05)); }

  // ---------- SKY ----------
  function drawSky(driftX) {
    const w = W_();
    const cosmos = CFG.cosmos / 10;
    const skyH = horizonY;

    // ONE continuous dark field — no horizon line, no separate ground
    ctx.fillStyle = w.sky[0];
    ctx.fillRect(0, 0, W, H);
    // faint deep-space tint at the very top, fading to nothing well above the rails
    const up = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    up.addColorStop(0, hexToRGBA(w.sky[1], 0.85));
    up.addColorStop(0.5, hexToRGBA(w.sky[1], 0.26));
    up.addColorStop(1, hexToRGBA(w.sky[1], 0));
    ctx.fillStyle = up; ctx.fillRect(0, 0, W, H * 0.6);
    // soft focal glow around the vanishing point (mood, not a band)
    const gs = parseRGBA(w.horizonGlow);
    const cg = ctx.createRadialGradient(cx, horizonY, 0, cx, horizonY, Math.max(W, H) * 0.62);
    cg.addColorStop(0, 'rgba(' + gs.rgb + ',' + (gs.a * 1.6).toFixed(3) + ')');
    cg.addColorStop(0.5, 'rgba(' + gs.rgb + ',' + (gs.a * 0.45).toFixed(3) + ')');
    cg.addColorStop(1, 'rgba(' + gs.rgb + ',0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);

    // milky way soft glow (rotated elliptical)
    const milkyA = Math.max(0, (0.10 + cosmos * 0.22) * w.milkyMul);
    if (milkyA > 0.01) {
      ctx.save();
      ctx.translate((BAND_CX * W + driftX * 0.6), BAND_CY * skyH);
      ctx.rotate(BAND_ANGLE);
      ctx.scale(1, 0.30);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.6);
      rg.addColorStop(0, 'rgba(' + w.milky + ',' + (milkyA * 0.9).toFixed(3) + ')');
      rg.addColorStop(0.5, 'rgba(' + w.milky + ',' + (milkyA * 0.32).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(' + w.milky + ',0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, W * 0.6, 0, 6.2832); ctx.fill();
      // a hint of nebula color core when cosmos high
      if (cosmos > 0.45) {
        const ng = ctx.createRadialGradient(W * 0.12, 0, 0, W * 0.12, 0, W * 0.34);
        ng.addColorStop(0, 'rgba(' + w.milky + ',' + (milkyA * 0.5 * (cosmos - 0.3)).toFixed(3) + ')');
        ng.addColorStop(1, 'rgba(' + w.milky + ',0)');
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(W * 0.12, 0, W * 0.34, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }

    // band stars (dense core of the milky way)
    const bandCount = Math.round(MAX_BAND * (0.18 + cosmos * 0.82) * w.starMul);
    const starRGB = w.star;
    for (let i = 0; i < bandCount; i++) {
      const s = band[i];
      let x = s.nx * W + driftX * 0.6; x = ((x % W) + W) % W;
      const y = s.ny * skyH;
      if (y > skyH) continue;
      const vf = Math.max(0, Math.min(1, (skyH - y) / (0.32 * skyH)));
      const tw = 0.55 + 0.45 * Math.sin(time * s.tw + s.ph);
      const a = s.b * tw * (0.55 + 0.45 * (1 - s.across / 0.36)) * vf;
      ctx.fillStyle = 'rgba(' + starRGB + ',' + Math.max(0, a).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.2832); ctx.fill();
    }

    // ambient stars (spread)
    const ambCount = Math.round(MAX_AMBIENT * (0.16 + cosmos * 0.84) * w.starMul);
    for (let i = 0; i < ambCount; i++) {
      const s = ambient[i];
      let x = s.nx * W + driftX; x = ((x % W) + W) % W;
      const y = s.ny * skyH;
      if (y > skyH - 2) continue;
      const vf = Math.max(0, Math.min(1, (skyH - y) / (0.32 * skyH)));
      const tw = 0.45 + 0.55 * Math.sin(time * s.tw + s.ph);
      const a = s.b * tw * vf;
      if (s.big) {
        const halo = ctx.createRadialGradient(x, y, 0, x, y, s.r * 6);
        halo.addColorStop(0, 'rgba(' + starRGB + ',' + (a * 0.5).toFixed(3) + ')');
        halo.addColorStop(1, 'rgba(' + starRGB + ',0)');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, s.r * 6, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + starRGB + ',' + Math.max(0, a).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.2832); ctx.fill();
    }

    // moon
    const mx = 0.76 * W + driftX * 0.35, my = 0.30 * skyH;
    const mr = Math.max(26, Math.min(64, 0.052 * Math.min(W, H * 1.6)));
    const pulse = 1 + 0.05 * Math.sin(time * 0.7);
    const halo = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 5.4 * pulse);
    halo.addColorStop(0, w.moonGlow);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, mr * 5.4 * pulse, 0, 6.2832); ctx.fill();
    const disc = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.2, mx, my, mr);
    disc.addColorStop(0, w.moon);
    disc.addColorStop(1, shade(w.moon, -0.16));
    ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fill();
    // faint maria (soft, off-centre, asymmetric — not a face)
    [[0.30, -0.34, 0.30, 0.42], [0.46, 0.10, 0.20, 0.34], [0.10, 0.40, 0.24, 0.30],
     [-0.30, 0.02, 0.16, 0.30], [0.04, -0.06, 0.42, 0.22]].forEach(c => {
      const ccx = mx + c[0] * mr, ccy = my + c[1] * mr, cr = c[2] * mr;
      const cg = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, cr);
      cg.addColorStop(0, 'rgba(0,0,0,' + (c[3] * 0.5).toFixed(3) + ')');
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(ccx, ccy, cr, 0, 6.2832); ctx.fill();
    });
  }

  // ---------- RAILS ----------
  // one steel rail (centerline arrays cxs/ys + zs), extruded into top + outer side faces
  function ribbonRail(cxs, ys, zs, side, mul) {
    const w = W_(), n = cxs.length, TI = [], TO = [], BO = [];
    for (let i = 0; i < n; i++) {
      const ip = Math.max(0, i - 1), iN = Math.min(n - 1, i + 1);
      let tx = cxs[iN] - cxs[ip], ty = ys[iN] - ys[ip];
      const L = Math.hypot(tx, ty) || 1; let px = -ty / L, py = tx / L;
      if ((side === 'l' && px > 0) || (side === 'r' && px < 0)) { px = -px; py = -py; }
      const z = zs[i];
      const half = Math.max(0.5, Math.min(7, (0.0052 * W) / z));
      const hh = Math.max(0.8, Math.min(14, (0.0095 * W) / z));
      TO.push({ x: cxs[i] + px * half, y: ys[i] + py * half });
      TI.push({ x: cxs[i] - px * half, y: ys[i] - py * half });
      BO.push({ x: cxs[i] + px * half, y: ys[i] + py * half + hh });
    }
    for (let i = 0; i < n - 1; i++) {
      const z = (zs[i] + zs[i + 1]) / 2, a = fade(z) * mul;
      ctx.beginPath();
      ctx.moveTo(TO[i].x, TO[i].y); ctx.lineTo(TO[i + 1].x, TO[i + 1].y);
      ctx.lineTo(BO[i + 1].x, BO[i + 1].y); ctx.lineTo(BO[i].x, BO[i].y); ctx.closePath();
      ctx.fillStyle = 'rgba(' + w.rail + ',' + (a * 0.16).toFixed(3) + ')'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(TI[i].x, TI[i].y); ctx.lineTo(TI[i + 1].x, TI[i + 1].y);
      ctx.lineTo(TO[i + 1].x, TO[i + 1].y); ctx.lineTo(TO[i].x, TO[i].y); ctx.closePath();
      ctx.fillStyle = 'rgba(' + w.rail + ',' + (a * 0.62).toFixed(3) + ')'; ctx.fill();
    }
    const ink = (arr, rgb, m, wScale) => {
      for (let i = 0; i < arr.length - 1; i++) {
        const z = (zs[i] + zs[i + 1]) / 2, a = fade(z) * mul;
        ctx.beginPath(); ctx.moveTo(arr[i].x, arr[i].y); ctx.lineTo(arr[i + 1].x, arr[i + 1].y);
        ctx.lineWidth = Math.max(0.4, (wScale * W) / z);
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (a * m).toFixed(3) + ')'; ctx.stroke();
      }
    };
    ink(BO, '8,7,5', 0.5, 0.0011); ink(TO, '8,7,5', 0.34, 0.0009); ink(TI, w.rail, 0.9, 0.0011);
  }

  // a full track (two rails) following a centerline function over [zA,zB]
  function drawTrack(centerFn, zA, zB, mul) {
    const cxsL = [], cxsR = [], ys = [], zs = [];
    for (let z = zB; z >= zA; z -= 0.16) {
      const c = centerFn(z), g = DX / z, y = horizonY + DY / z;
      cxsL.push(c - g); cxsR.push(c + g); ys.push(y); zs.push(z);
    }
    ribbonRail(cxsL, ys, zs, 'l', mul);
    ribbonRail(cxsR, ys, zs, 'r', mul);
  }

  // 3D wooden ties along a centerline
  function drawTies(centerFn, zA, zB, mul) {
    const w = W_();
    const frac = ((cur * 3) % 1 + 1) % 1;
    for (let i = 1; i <= MSL; i++) {
      let z = i - frac; if (z < zA) z += MSL; if (z > zB || z < zA) continue;
      const zN = Math.max(zA, z - 0.16), zF = z + 0.16;
      const cF = centerFn(zF), cN = centerFn(zN), gF = DX / zF, gN = DX / zN, a = fade(z) * mul;
      const yF = horizonY + DY / zF, yN = horizonY + DY / zN;
      const ohF = gF * 2 * 0.05, ohN = gN * 2 * 0.05;
      const tieH = Math.max(1, Math.min(20, (0.013 * W) / z));
      const fL = cF - gF - ohF, fR = cF + gF + ohF, nL = cN - gN - ohN, nR = cN + gN + ohN;
      ctx.beginPath(); ctx.moveTo(nL, yN); ctx.lineTo(nR, yN);
      ctx.lineTo(nR, yN + tieH); ctx.lineTo(nL, yN + tieH); ctx.closePath();
      ctx.fillStyle = 'rgba(' + w.sleeper + ',' + (a * 0.17).toFixed(3) + ')'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(fL, yF); ctx.lineTo(fR, yF);
      ctx.lineTo(nR, yN); ctx.lineTo(nL, yN); ctx.closePath();
      ctx.fillStyle = 'rgba(' + w.sleeper + ',' + (a * 0.30).toFixed(3) + ')'; ctx.fill();
      ctx.lineWidth = Math.max(0.35, (0.0016 * W) / z);
      ctx.strokeStyle = 'rgba(' + w.sleeper + ',' + (a * 0.42).toFixed(3) + ')';
      for (const t of [0.30, 0.66]) {
        ctx.beginPath(); ctx.moveTo(fL + (fR - fL) * t, yF); ctx.lineTo(nL + (nR - nL) * t, yN); ctx.stroke();
      }
      ctx.lineWidth = Math.max(0.4, (0.0018 * W) / z);
      ctx.strokeStyle = 'rgba(8,7,5,' + (a * 0.5).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(fL, yF); ctx.lineTo(fR, yF);
      ctx.lineTo(nR, yN); ctx.lineTo(nL, yN); ctx.closePath(); ctx.stroke();
    }
  }

  function drawRails(phase) {
    const w = W_();
    const mainCenter = z => cx + curveAt(z, phase);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // sub-worlds run on the same rail but without branching
    if (!branchesEnabled) {
      drawTies(mainCenter, zNear, zFar, 1);
      drawTrack(mainCenter, zNear, zFar, 1);
    } else {
    // ---- branch + main line: the inactive route is washed, the active one solid;
    //      throwing the lever (armProgress 0→1) crossfades the two.
    //      Only stops that actually have a world get a branch — others run straight. ----
    const bi = Math.round(cur);
    const stHere = STATIONS[bi];
    const hasBranch = stHere && (stHere.world || stHere.worldName);
    if (!hasBranch) {
      drawTies(mainCenter, zNear, zFar, 1);
      drawTrack(mainCenter, zNear, zFar, 1);
    } else {
    const fs = Math.max(0, 1 - Math.abs(cur - Math.round(cur)) / 0.42);   // settled at a stop?
    const arm = armProgress, washed = 0.40, present = fs;
    branchSide = (bi % 2 === 0) ? 1 : -1;
    branchVis = present;
    const mainMul = 1 - (1 - washed) * arm;                  // solid → washed as you throw
    const branchMul = (washed + (1 - washed) * arm) * present; // washed → solid as you throw
    const side = branchSide, zsw = ZSW;
    const bcenter = z => {
      const t = Math.max(0, (z - zsw) / (zFar - zsw));
      return mainCenter(z) + side * BRANCH_SPREAD * W * Math.pow(t, 1.7);
    };
    const paintMain = () => { drawTies(mainCenter, zNear, zFar, mainMul); drawTrack(mainCenter, zNear, zFar, mainMul); };
    const paintBranch = () => {
      if (present <= 0.02) return;
      drawTies(bcenter, zsw, zFar, branchMul * 0.8);
      drawTrack(bcenter, zsw, zFar, branchMul);
    };
    // draw the more-active (higher mul) route last so it sits on top
    if (mainMul >= branchMul) { paintBranch(); paintMain(); }
    else { paintMain(); paintBranch(); }
    }
    }

    // moving glint sliding along the running surface
    const sheenZ = zNear + (1 - ((cur * 0.5) % 1)) * (zFar - zNear);
    const proj = z => ({ lx: mainCenter(z) - DX / z, rx: mainCenter(z) + DX / z, y: horizonY + DY / z });
    ['l', 'r'].forEach(side => {
      const p = proj(sheenZ); const x = side === 'l' ? p.lx : p.rx;
      const a = fade(sheenZ) * 0.4;
      const rg = ctx.createRadialGradient(x, p.y, 0, x, p.y, 16);
      rg.addColorStop(0, 'rgba(' + w.rail + ',' + a.toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(' + w.rail + ',0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, p.y, 16, 0, 6.2832); ctx.fill();
    });
  }

  // ---------- PASSING SIGNAL LIGHTS ----------
  function drawLights(phase) {
    const w = W_();
    const cosmos = CFG.cosmos / 10, cruise = CFG.cruise / 10;
    const count = Math.round(2 + cosmos * 6);
    const spacing = (zFar - zNear) / count;
    const flow = (cur * (0.6 + cruise * 0.9)) % spacing;
    for (let i = 0; i < count + 1; i++) {
      let z = zNear + i * spacing - flow;
      if (z < zNear) z += (count + 1) * spacing;
      if (z > zFar || z < zNear) continue;
      const side = i % 2 === 0 ? -1 : 1;
      const c = cx + curveAt(z, phase);
      const x = c + side * (DX / z) * 1.7;
      const y = horizonY + DY / z - (DY / z) * 0.26;  // raised like a lamp/signal
      const a = fade(z);
      const r = Math.max(2, Math.min(22, (0.01 * W) / z));
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      rg.addColorStop(0, hexToRGBA(w.accent, a * 0.9));
      rg.addColorStop(0.4, hexToRGBA(w.accent, a * 0.32));
      rg.addColorStop(1, hexToRGBA(w.accent, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = hexToRGBA(w.accent, a); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
  }

  // ---------- STATIONS (HTML overlay riding the rail) ----------
  function updateStations(phase, shakeX, shakeY) {
    const focusIdx = Math.round(cur);
    stEls.forEach((el, i) => {
      const z = zFocus + (i - cur) * K;
      if (z <= 0.4 || z > zFar + 6) { el.style.opacity = 0; el.style.pointerEvents = 'none'; el.classList.remove('is-focus'); return; }
      const d = z - zFocus;                                   // >0 = far/incoming, <0 = passing
      const df = Math.min(1, Math.abs(d) / 3.2);
      const x = cx + curveAt(z, phase) * df + shakeX;
      const y = horizonY + DY / z + shakeY;
      const scale = Math.max(0.16, Math.min(6.5, zFocus / z));
      const blur = Math.min(22, Math.max(0, d) * 2.0) + Math.max(0, -d - 1.6) * 1.3;
      // a stop first appears as a faint speck at the far vanishing point, travels the
      // whole rail toward you, then sweeps past — you never see two stops close together
      const vin = 1 - Math.min(1, Math.max(0, (d - 1.0) / 9.0));
      const vout = 1 - Math.min(1, Math.max(0, (-d - 1.2) / 2.4));
      const op = Math.max(0, Math.min(1, Math.min(vin, vout)));
      el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) scale(' + scale.toFixed(3) + ')';
      el.style.filter = blur > 0.2 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(10 + Math.round(scale * 8));
      const focused = (i === focusIdx) && op > 0.82 && Math.abs(d) < 0.9;
      el.style.pointerEvents = focused ? 'auto' : 'none';
      el.classList.toggle('is-focus', focused);
    });
  }

  // ---------- main draw ----------
  function draw() {
    const w = W_();
    const cruise = CFG.cruise / 10;
    const phase = cur * (0.4 + cruise * 0.5);
    // drift: continuous slow pan + parallax with travel
    const driftX = (time * (4 + cruise * 14)) % (W * 2) + cur * 18;
    // train shake scales with cruise + active speed
    const speed = Math.abs(target - cur);
    const amp = (0.6 + cruise * 2.4) * (1 + speed * 5);
    const shakeX = Math.sin(time * 22) * amp * 0.6;
    const shakeY = Math.sin(time * 31 + 1.7) * amp * 0.4;

    ctx.clearRect(0, 0, W, H);
    if (drawEnv) drawEnv({ ctx, W, H, horizonY, DY, DX, cx, time, cur, N: N(), driftX, fade, world: W_() });
    else drawSky(driftX);

    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawRails(phase);
    drawLights(phase);
    ctx.restore();

    updateStations(phase, shakeX, shakeY);
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (paused) { last = ts; return; }
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    time += dt;
    // momentum: heavier (slower) at low cruise, snappier at high cruise
    const stiff = 0.04 + (CFG.cruise / 10) * 0.12;
    cur += (target - cur) * stiff;
    if (Math.abs(target - cur) < 0.0002) cur = target;
    draw();

    // notify the page when we settle on / leave a stop (drives the switch lever)
    const idx = Math.round(cur);
    const rested = Math.abs(cur - idx) < 0.06;
    const key = rested ? String(idx) : '';
    if (key !== lastStopKey) {
      lastStopKey = key;
      if (!rested) armProgress = 0;
      if (onStop) onStop(rested ? { index: idx, side: (idx % 2 === 0) ? 1 : -1, station: STATIONS[idx] } : null);
    }
  }

  // ---------- public API ----------
  function setTarget() {
    const r = wrap.getBoundingClientRect();
    const denom = wrap.offsetHeight - innerHeight;
    let p = denom > 0 ? (-r.top) / denom : 0; p = Math.max(0, Math.min(1, p));
    // rest at each stop, transit quickly between (smootherstep per segment)
    const f = p * (N() - 1);
    const seg = Math.min(N() - 2, Math.floor(f));
    const k = N() - 1 > 0 ? Math.max(0, Math.min(1, f - seg)) : 0;
    const s = k * k * k * (k * (k * 6 - 15) + 10);
    target = (N() - 1 > 0) ? seg + s : 0;
  }

  function applyConfig(partial) {
    Object.assign(CFG, partial || {});
    const w = W_();
    document.documentElement.style.setProperty('--accent', w.accent);
    document.documentElement.style.setProperty('--ink', w.ink);
    document.documentElement.style.setProperty('--dim', w.dim);
    document.body.style.background = w.sky[0];
  }

  function goTo(i) {
    // scroll the page so station i lands in focus
    const denom = wrap.offsetHeight - innerHeight;
    const p = (N() - 1) > 0 ? i / (N() - 1) : 0;
    const y = wrap.offsetTop + p * denom;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // step one stop along the line. forward (+1) = up-arrow / k — the 3D/game
  // locomotion convention. scroll is left untouched (down = forward), so keys
  // "drive the train" while scroll "browses the journey".
  function stepStop(d) { goTo(Math.max(0, Math.min(N() - 1, Math.round(cur) + d))); }

  function init(opts) {
    STATIONS = opts.stations;
    onStationClick = opts.onStationClick || null;
    onStop = opts.onStop || null;
    drawEnv = opts.drawEnv || null;
    if (opts.branches === false) branchesEnabled = false;
    cab = document.getElementById('cab');
    wrap = document.getElementById('wrap');
    cv = document.getElementById('cv');
    ctx = cv.getContext('2d');
    stationsEl = document.getElementById('stations');

    stEls = STATIONS.map((s, i) => {
      const d = document.createElement('div'); d.className = 'st';
      d.innerHTML =
        '<div class="idx">' + String(i + 1).padStart(2, '0') + ' / ' + String(STATIONS.length).padStart(2, '0') + '</div>' +
        '<div class="era">' + s.era + '</div>' +
        '<div class="ln">' + s.ln + '</div>' +
        '<div class="enter">' + (s.cue || (s.world ? '&#8600; throw the switch' : 'a stop on the line')) + '</div>';
      d.addEventListener('click', () => { if (onStationClick) onStationClick(i); });
      stationsEl.appendChild(d); return d;
    });

    buildStars();
    applyConfig({});
    resize();

    if (reduce) {
      document.body.classList.add('reduced');
      draw();
      const fb = document.getElementById('fallback');
      STATIONS.forEach((s, i) => {
        const d = document.createElement('div'); d.className = 'row';
        d.dataset.i = i;
        d.innerHTML = '<div class="era">' + s.era + '</div><div class="ln">' + s.ln + '</div>';
        d.addEventListener('click', () => { if (onStationClick) onStationClick(i); });
        fb.appendChild(d);
      });
      addEventListener('resize', () => { resize(); draw(); });
      return;
    }

    setTarget();
    cur = target;
    addEventListener('scroll', setTarget, { passive: true });
    addEventListener('resize', () => { resize(); setTarget(); });
    document.addEventListener('visibilitychange', () => { paused = document.hidden; });

    // ---- keyboard: drive the line ----
    //   forward = up (↑ / k), back = down (↓ / j) — the 3D/game locomotion convention.
    //   ← / h resurfaces to the line wherever a .backline exists (worlds); no-op on the
    //   main lines that have none. letterKeys:false (typing worlds) frees h/j/k/l for
    //   typing while arrows keep navigating.
    const letterKeys = opts.letterKeys !== false;
    addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && t.matches && t.matches('input,textarea,select,[contenteditable]')) return;
      if (opts.canNavigate && !opts.canNavigate()) return;
      const k = e.key;
      if (k === 'ArrowUp' || (letterKeys && (k === 'k' || k === 'K'))) { e.preventDefault(); stepStop(1); }
      else if (k === 'ArrowDown' || (letterKeys && (k === 'j' || k === 'J'))) { e.preventDefault(); stepStop(-1); }
      else if (k === 'ArrowLeft' || (letterKeys && (k === 'h' || k === 'H'))) {
        const bl = document.querySelector('.backline');
        if (bl) { e.preventDefault(); location.href = bl.getAttribute('href'); }
      }
    });

    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  // ---------- color utils ----------
  function hexToRGBA(hex, a) {    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')';
  }
  function shade(hex, amt) {
    const h = hex.replace('#', '');
    let r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    r = Math.max(0, Math.min(255, Math.round(r + 255 * amt)));
    g = Math.max(0, Math.min(255, Math.round(g + 255 * amt)));
    b = Math.max(0, Math.min(255, Math.round(b + 255 * amt)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function parseRGBA(str) {
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return { rgb: '255,255,255', a: 1 };
    const p = m[1].split(',').map(s => s.trim());
    return { rgb: p[0] + ',' + p[1] + ',' + p[2], a: p[3] !== undefined ? parseFloat(p[3]) : 1 };
  }

  function setArm(p) { armProgress = Math.max(0, Math.min(1, p)); }

  window.RAIL = { init, applyConfig, goTo, stepStop, current: () => Math.round(cur), setArm, WORLDS, CFG };
})();
