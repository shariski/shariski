/* SwimmerFX — combined "particle body (D) + motion-trace arcs (B)".
   Drawn into the world engine's canvas each frame, after the underwater
   environment. No anatomy: a streamline cloud of drifting points implies the
   body; glowing accent arcs trace the active stroke and change per sub-stop.

   API:
     SwimmerFX.setStage('breath'|'arms'|'kick'|'free'|'breast')
     SwimmerFX.draw(ctx, W, H, time)            // call from drawEnv
*/
(function () {
  var ACCENT = '95,207,214';        // --accent, rgb
  var INK = '225,240,248';          // body dots
  var PI = Math.PI;

  // ---- seed the body once (path-space independent: spine t + cross u) ----
  var body = [], head = [];
  for (var i = 0; i < 150; i++)
    body.push({ t: Math.random(), u: Math.random() * 2 - 1, r: .7 + Math.random() * 1.7,
                ph: Math.random() * 6.28, sp: .4 + Math.random() * .8 });
  for (var j = 0; j < 26; j++) {
    var ang = Math.random() * 6.28, rad = Math.random();
    head.push({ hx: Math.cos(ang) * rad, hy: Math.sin(ang) * rad, r: .8 + Math.random() * 1.6,
                ph: Math.random() * 6.28, sp: .4 + Math.random() * .8 });
  }
  // head-bubble stream
  var hb = [];
  for (var b = 0; b < 12; b++) hb.push({ x: (Math.random() * 2 - 1), r: 1.5 + Math.random() * 4,
                                         ph: Math.random(), sp: .12 + Math.random() * .12 });

  function profile(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.pow(Math.sin(PI * t), 0.7); }

  // smooth energy ramp between stages so transitions don't snap
  var TARGET = { breath: .25, arms: .60, kick: .70, free: 1.0, breast: .55 };
  var stage = 'breath', energy = .25;

  function carve(ctx, x, y, s, rot, a) {
    if (a <= 0.02) return;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(' + ACCENT + ',' + a.toFixed(3) + ')';
    ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(' + ACCENT + ',.6)'; ctx.shadowBlur = 14 * a;
    ctx.beginPath();
    ctx.moveTo(-24 * s, -20 * s);
    ctx.bezierCurveTo(-2 * s, -28 * s, 18 * s, -2 * s, 8 * s, 24 * s);
    ctx.stroke();
    ctx.restore();
  }

  function ring(ctx, x, y, rr, a) {
    if (a <= 0.02) return;
    ctx.strokeStyle = 'rgba(' + ACCENT + ',' + a.toFixed(3) + ')';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.28); ctx.stroke();
  }

  function draw(ctx, W, H, time) {
    // ease energy toward the active stage
    energy += ((TARGET[stage] || .3) - energy) * 0.05;

    var L = Math.min(W * 0.6, 600);
    var cx = W * 0.5, cy = H * 0.64;
    var maxHalf = L * 0.058;
    var bob = Math.sin(time * 0.8) * H * 0.008;
    var tilt = Math.sin(time * 0.5) * 0.045;
    var jit = 1 + energy * 2;          // particle liveliness

    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.rotate(tilt);

    // ---------- D · particle body ----------
    for (var p = 0; p < body.length; p++) {
      var pt = body[p];
      var lx = (pt.t - 0.5) * L + Math.sin(time * pt.sp + pt.ph) * jit;
      var half = profile(pt.t) * maxHalf;
      var ly = pt.u * half + Math.cos(time * pt.sp * 0.8 + pt.ph) * jit * 0.8;
      var a = 0.34 + 0.42 * Math.sin(time * 1.6 + pt.ph);
      ctx.fillStyle = 'rgba(' + INK + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(lx, ly, pt.r, 0, 6.28); ctx.fill();
    }
    // denser head cluster near the front (left)
    var hX = -0.34 * L, hY = -maxHalf * 0.5, hR = L * 0.045;
    for (var h = 0; h < head.length; h++) {
      var hd = head[h];
      var x = hX + hd.hx * hR + Math.sin(time * hd.sp + hd.ph) * jit;
      var y = hY + hd.hy * hR + Math.cos(time * hd.sp + hd.ph) * jit;
      var ha = 0.42 + 0.42 * Math.sin(time * 1.6 + hd.ph);
      ctx.fillStyle = 'rgba(' + INK + ',' + ha.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, hd.r, 0, 6.28); ctx.fill();
    }
    // bubbles rising off the head (strongest on the breath stop)
    var bubA = stage === 'breath' ? 1 : 0.45;
    for (var k = 0; k < hb.length; k++) {
      var bb = hb[k];
      var f = ((time * bb.sp + bb.ph) % 1 + 1) % 1;
      var bx = hX + bb.x * hR * 1.3;
      var by = hY - f * H * 0.18;
      var baa = Math.min(1, f * 4) * (1 - f) * 1.3 * bubA;
      if (baa <= 0.02) continue;
      ctx.strokeStyle = 'rgba(200,240,250,' + (0.5 * baa).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(bx, by, bb.r, 0, 6.28); ctx.stroke();
    }

    // ---------- B · motion-trace arcs (per stroke) ----------
    if (stage === 'breath') {
      // calm: a couple of expanding ripples at the head
      for (var ri = 0; ri < 2; ri++) {
        var rp = ((time / 3.4 + ri * 0.5) % 1 + 1) % 1;
        ring(ctx, hX, hY, hR + rp * hR * 2.6, (1 - rp) * 0.4 * (0.6 + energy));
      }
    } else if (stage === 'arms') {
      drawPull(ctx, time, L, maxHalf, energy, 0.42, 2);
    } else if (stage === 'kick') {
      drawKick(ctx, time, L, maxHalf, energy, 1);
    } else if (stage === 'free') {
      drawPull(ctx, time, L, maxHalf, energy, 0.9, 2);   // fast windmill arcs
      drawKick(ctx, time, L, maxHalf, energy, 1.8);       // fast flutter
    } else if (stage === 'breast') {
      // two symmetric sweeps out front, slow rhythm
      var bp = ((time / 3) % 1 + 1) % 1;
      var sx = -0.34 * L + Math.sin(bp * PI) * 0.12 * L;
      var ba = Math.sin(bp * PI) * 0.9 * (0.5 + energy);
      carve(ctx, sx, -10, 0.95, -0.5, ba);
      ctx.save(); ctx.scale(1, -1); carve(ctx, sx, -10, 0.95, -0.5, ba); ctx.restore();
    }

    ctx.restore();
  }

  // a hand carving along the underside of the body, front -> back, repeating
  function drawPull(ctx, time, L, maxHalf, energy, freq, n) {
    for (var i = 0; i < n; i++) {
      var phase = ((time * freq + i / n) % 1 + 1) % 1;
      var x = -0.34 * L + phase * 0.62 * L;
      var y = maxHalf * 0.5 + Math.sin(phase * PI) * 6;
      var a = Math.sin(phase * PI) * 0.9 * (0.4 + energy);
      carve(ctx, x, y, 0.9, -0.35, a);
    }
  }

  // quick flutter flicks near the feet (back / right)
  function drawKick(ctx, time, L, maxHalf, energy, freq) {
    var x = 0.42 * L;
    for (var i = 0; i < 3; i++) {
      var y = (i - 1) * 7;
      var w = Math.sin(time * 9 * freq + i * 1.3) * 9 * energy;
      var a = (0.4 + 0.4 * Math.sin(time * 9 * freq + i)) * 0.7 * (0.4 + energy);
      if (a <= 0.02) continue;
      ctx.strokeStyle = 'rgba(' + ACCENT + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(' + ACCENT + ',.5)'; ctx.shadowBlur = 8 * a;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 10, y + w * 0.5, x + 22, y + w);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  window.SwimmerFX = {
    setStage: function (s) { if (s) stage = s; },
    draw: draw
  };
})();
