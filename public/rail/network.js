/* shariski.com — the network: a small interchange control shared across lines.
   Each page sets window.SHARISKI_LINE ('origin' | 'works' | 'depot') before loading this.
   Injects a fixed trigger + an overlay transit map; click a line to switch. */
(function () {
  'use strict';

  var CURRENT = window.SHARISKI_LINE || 'origin';

  var LINES = [
    { id:'origin', label:'the origin line', sub:'how I got here — learning, from zero',
      href:'index.html', color:'#88a6ff', stops:5, ready:true },
    { id:'works',  label:'the works line',  sub:'professional experience + case studies',
      href:'works.html',  color:'#6fc8bd', stops:4, ready:true },
    { id:'depot',  label:'the depot',       sub:'recent builds — shipped fast, agent-assisted',
      href:'depot.html', color:'#b98cff', stops:4, ready:true }
  ];

  // resolve hrefs relative to page depth (worlds/* live one level down — not used there,
  // but keep it safe): pages at root use plain names.
  var PREFIX = location.pathname.indexOf('/worlds/') !== -1 ? '../' : '';

  var css = ''
    + '.net-btn{position:fixed;left:20px;bottom:22px;z-index:62;cursor:pointer;'
    + 'font-family:var(--mono,monospace);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim,#889);'
    + 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.16);border-radius:999px;'
    + 'padding:9px 15px;display:flex;align-items:center;gap:9px;opacity:0;transform:translateY(8px);'
    + 'transition:opacity .4s ease,transform .4s ease,color .25s,border-color .25s,box-shadow .25s}'
    + '.net-btn.show{opacity:1;transform:none}'
    + '.net-btn:hover{color:var(--accent,#9af);border-color:var(--accent,#9af);box-shadow:0 0 18px rgba(255,255,255,.12)}'
    + '.net-btn .nb-dots{display:flex;gap:3px}'
    + '.net-btn .nb-dots i{width:5px;height:5px;border-radius:50%;display:block}'
    + '.net-pop{position:fixed;inset:0;z-index:103;display:grid;place-items:center;padding:24px;'
    + 'background:rgba(6,8,12,.66);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .4s ease}'
    + '.net-pop.on{opacity:1;pointer-events:auto}'
    + '.net-card{width:min(540px,93vw);transform:translateY(14px);transition:transform .45s cubic-bezier(.2,.8,.2,1);'
    + 'background:linear-gradient(180deg,rgba(16,20,30,.98),rgba(9,12,20,.99));'
    + 'border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:clamp(26px,4vw,38px);'
    + 'box-shadow:0 44px 110px rgba(0,0,0,.55)}'
    + '.net-pop.on .net-card{transform:none}'
    + '.net-head{display:flex;justify-content:space-between;align-items:center;font-family:var(--mono,monospace);'
    + 'font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--dim,#889)}'
    + '.net-x{cursor:pointer;color:var(--dim,#889);font-size:20px;line-height:1;background:none;'
    + 'border:1px solid rgba(255,255,255,.14);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;transition:.25s}'
    + '.net-x:hover{color:#fff;border-color:#fff}'
    + '.net-title{margin-top:16px;font-size:clamp(22px,3vw,28px);line-height:1.1;letter-spacing:-.02em;'
    + "font-family:var(--display,sans-serif);font-variation-settings:'opsz' 70,'wght' 700;color:var(--ink,#eee)}"
    + '.net-list{margin-top:22px;display:flex;flex-direction:column;gap:9px}'
    + '.net-line{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:15px;text-decoration:none;'
    + 'padding:14px 15px;border-radius:11px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);'
    + 'transition:.22s;cursor:pointer}'
    + '.net-line:hover{background:rgba(255,255,255,.05);transform:translateX(3px)}'
    + '.net-line.here{cursor:default}.net-line.here:hover{transform:none;background:rgba(255,255,255,.02)}'
    + '.net-line.soon{cursor:not-allowed;opacity:.62}.net-line.soon:hover{transform:none;background:rgba(255,255,255,.02)}'
    + '.net-rail{display:flex;align-items:center}'
    + '.net-rail .seg{width:34px;height:3px;border-radius:2px}'
    + '.net-rail .node{width:10px;height:10px;border-radius:50%;border:2px solid #000;margin:0 -3px;position:relative;z-index:1}'
    + '.net-meta{display:flex;flex-direction:column;min-width:0}'
    + '.net-meta .l{font-family:var(--display,sans-serif);font-size:16px;color:var(--ink,#eee);display:block;'
    + "font-variation-settings:'wght' 620;letter-spacing:-.01em}"
    + '.net-meta .s{display:block;font-family:var(--mono,monospace);font-size:11px;letter-spacing:.02em;color:var(--dim,#889);margin-top:4px;line-height:1.4}'
    + '.net-tag{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.14em;text-transform:uppercase;'
    + 'color:var(--dim,#889);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:5px 10px;white-space:nowrap}'
    + '.net-line.here .net-tag{color:#fff;border-color:rgba(255,255,255,.4)}'
    + '.net-foot{margin-top:20px;padding-top:15px;border-top:1px dashed rgba(255,255,255,.12);'
    + 'font-family:var(--mono,monospace);font-size:11px;letter-spacing:.04em;color:var(--dim,#889);text-wrap:pretty;line-height:1.6}'
    + '@media (max-width:640px){.net-pop{padding:16px}.net-line{grid-template-columns:1fr auto;gap:12px;padding:13px 13px}.net-rail{display:none}.net-meta .s{white-space:normal}.net-tag{font-size:9px;letter-spacing:.1em;padding:4px 8px}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---- trigger button ----
  var cur = LINES.filter(function (l) { return l.id === CURRENT; })[0] || LINES[0];
  var btn = document.createElement('button');
  btn.className = 'net-btn';
  btn.innerHTML = '<span class="nb-dots">'
    + LINES.map(function (l) { return '<i style="background:' + l.color + '"></i>'; }).join('')
    + '</span><span>the network</span>';
  document.body.appendChild(btn);

  // ---- overlay ----
  var pop = document.createElement('div');
  pop.className = 'net-pop';
  pop.innerHTML = ''
    + '<div class="net-card" role="dialog" aria-label="the network">'
    + '<div class="net-head"><span>change line</span>'
    + '<button class="net-x" aria-label="close">&times;</button></div>'
    + '<div class="net-title">The shariski network</div>'
    + '<div class="net-list">'
    + LINES.map(function (l) {
        var here = l.id === CURRENT;
        var cls = 'net-line' + (here ? ' here' : '') + (l.ready ? '' : ' soon');
        var rail = '<span class="net-rail">';
        for (var k = 0; k < l.stops; k++) {
          if (k) rail += '<span class="seg" style="background:' + l.color + '"></span>';
          rail += '<span class="node" style="background:' + l.color + '"></span>';
        }
        rail += '</span>';
        var tag = here ? 'you are here' : (l.ready ? (l.stops + ' stops') : 'coming soon');
        var inner = rail
          + '<span class="net-meta"><span class="l">' + l.label + '</span>'
          + '<span class="s">' + l.sub + '</span></span>'
          + '<span class="net-tag">' + tag + '</span>';
        if (here || !l.ready) return '<div class="' + cls + '">' + inner + '</div>';
        return '<a class="' + cls + '" href="' + PREFIX + l.href + '">' + inner + '</a>';
      }).join('')
    + '</div>'
    + '<div class="net-foot">One person, three tracks: where I came from, what I’ve shipped at work, and what I’m building now. Hop between them anytime.</div>'
    + '</div>';
  document.body.appendChild(pop);

  function open() { pop.classList.add('on'); }
  function close() { pop.classList.remove('on'); }
  btn.addEventListener('click', open);
  pop.querySelector('.net-x').addEventListener('click', close);
  pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // reveal the trigger once any boarding beat has cleared (origin line has a platform overlay)
  var tries = 0;
  (function reveal() {
    var plat = document.querySelector('.platform');
    var boarding = plat && !plat.classList.contains('off');
    if ((!boarding || tries > 26) && tries > 3) { btn.classList.add('show'); return; }
    tries++; setTimeout(reveal, 300);
  })();

  window.SHARISKI_NETWORK = { open: open, close: close };
})();
