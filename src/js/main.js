// NOVA FOR VISION · « Banc de montage »
// Accueil : une bande de projets qui défile (molette, glisser, clavier). Projets : une roue.
// Au clic, l'aplat prend la teinte du film, le titre se brouille puis se forme, le film s'ouvre sur place ;
// la molette passe au projet suivant comme on change de chaîne. Pas de défilement doux, pas de page lourde.
import gsap from 'gsap';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(hover: none)').matches;
const SAVE = !!(navigator.connection && navigator.connection.saveData);
const mobile = () => innerWidth <= 760;
const pad = n => String(n).padStart(2, '0');
const tc = (s, fps = 25) => { s = Math.max(0, s || 0); const f = Math.floor((s % 1) * fps), t = Math.floor(s); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(f)}`; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get: (k, s = localStorage) => { try { return s.getItem(k); } catch (e) { return null; } },
  set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch (e) { /* mémoire indisponible */ } },
};
const DATA = (() => { const el = $('#nv-data'); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } })();
const S = DATA ? DATA.str : {};
const ALL = DATA ? DATA.p : [];
const byId = id => ALL.find(p => p.id === id);
const byAnchor = a => ALL.find(p => p.a === a);
const playV = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); return p; };

/* ---------- Horloge : heure de Liège en timecode ---------- */
function clock() {
  const el = $('#clock'); if (!el) return;
  let fmt;
  try { fmt = new Intl.DateTimeFormat('fr-BE', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); } catch (e) { fmt = null; }
  const tick = () => { const d = new Date(); const hms = fmt ? fmt.format(d) : d.toTimeString().slice(0, 8); el.textContent = `${hms}:${RM ? '00' : pad(Math.floor(d.getMilliseconds() / 40))}`; };
  tick(); setInterval(tick, RM ? 1000 : 40);
}

/* ---------- Menu ---------- */
function menu() {
  const b = $('#mn-b'), m = $('#mn'); if (!b || !m) return;
  const isOpen = () => b.getAttribute('aria-expanded') === 'true';
  const set = o => {
    b.setAttribute('aria-expanded', String(o));
    if (o) { m.hidden = false; requestAnimationFrame(() => m.classList.add('on')); }
    else { m.classList.remove('on'); setTimeout(() => { if (!m.classList.contains('on')) m.hidden = true; }, 400); }
  };
  b.addEventListener('click', () => set(!isOpen()));
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { set(false); b.focus(); } });
  addEventListener('pointerdown', e => { if (isOpen() && !m.contains(e.target) && !b.contains(e.target)) set(false); });
}

/* ---------- Son ---------- */
const son = {
  on: () => root.classList.contains('son'),
  set(v) {
    root.classList.toggle('son', v); store.set('nv-son', v ? '1' : '0');
    $$('[data-son]').forEach(b => b.setAttribute('aria-pressed', String(v)));
    const fv = $('#fv-v'); if (fv) fv.muted = !v;
  },
};
function sound() { $$('[data-son]').forEach(b => { b.setAttribute('aria-pressed', String(son.on())); b.addEventListener('click', () => son.set(!son.on())); }); }

/* ---------- Étiquette qui suit le curseur ---------- */
const cur = (() => {
  const el = $('#cur'), t = $('#cur-t');
  if (!el || COARSE) return { show() {}, hide() {} };
  gsap.set(el, { x: -300, y: -300 });
  const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', e => { xTo(e.clientX + 14); yTo(e.clientY + 16); }, { passive: true });
  return {
    show(txt, tint) { if (t.textContent !== txt) t.textContent = txt; el.style.setProperty('--tint', tint || '#000'); el.classList.add('on'); },
    hide() { el.classList.remove('on'); },
  };
})();

/* ---------- Titre brouillé : lettres et chiffres au hasard, en Geist et en Geist Mono, qui se fixent de gauche à droite ---------- */
const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el, text, dur = 0.8) {
  if (RM || !text) { el.textContent = text; return Promise.resolve(); }
  const chars = [...text], n = chars.length;
  el.textContent = ''; el.setAttribute('aria-label', text);
  const spans = chars.map(ch => { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); return s; });
  const t0 = performance.now(); let last = 0;
  return new Promise(res => {
    const step = now => {
      const p = Math.min(1, (now - t0) / (dur * 1000)), swap = now - last > 50;
      if (swap) last = now;
      for (let i = 0; i < n; i++) {
        const ch = chars[i]; if (ch === ' ') continue;
        const s = spans[i];
        if (p >= 0.3 + (i / n) * 0.7) { if (s.className || s.textContent !== ch) { s.textContent = ch; s.className = ''; } }
        else if (swap) { s.textContent = GL[(Math.random() * GL.length) | 0]; s.className = Math.random() < 0.5 ? 'mo' : ''; }
      }
      if (p < 1) requestAnimationFrame(step);
      else { el.textContent = text; el.removeAttribute('aria-label'); res(); }
    };
    requestAnimationFrame(step);
  });
}

/* ---------- Textes ajustés à la largeur ---------- */
function fit() {
  $$('[data-fit]').forEach(el => {
    el.style.fontSize = '100px';
    const r = document.createRange(); r.selectNodeContents(el);
    const tw = r.getBoundingClientRect().width, w = el.clientWidth;
    if (tw && w) el.style.fontSize = `${(100 * w / tw) * 0.995}px`;
  });
}

/* ---------- Le film, ouvert sur place ---------- */
const viewer = (() => {
  const fv = $('#fv'); if (!fv) return null;
  const v = $('#fv-v'), img = $('#fv-i'), stage = $('#fv-stage'), noise = $('#fv-n');
  const tEl = $('#fv-t'), mEl = $('#fv-m'), idx = $('#fv-idx'), hint = $('#fv-hint'), modes = $('#fv-modes');
  const playB = $('#fv-play'), fsB = $('#fv-fs'), tcEl = $('#fv-tc'), rule = $('#fv-rule'), ticks = $('#fv-ticks'), ph = $('#fv-ph');
  const tr = $('#tr'), trm = $('#tr-m'), trt = $('#tr-t'), trn = $('#tr-n');
  let list = ALL, i = 0, p = null, mode = 'film', open = false, pushed = false, opener = null, still = 0, stillT0 = 0, paused = false, acc = 0, lock = false, accT;
  const STILL_MS = 3200;

  const dOf = () => (mode === 'ba' ? p.ba.d : p.d) || v.duration || 1;
  const fps = () => (mode === 'ba' ? 25 : p.fps || 25);
  const aspect = () => (mode === 'ba' ? p.ba.w / p.ba.h : mode === 'stills' ? 16 / 9 : p.w / p.h);
  const contentRect = () => {
    const r = stage.getBoundingClientRect(), a = aspect();
    let w = r.width, h = w / a; if (h > r.height) { h = r.height; w = h * a; }
    return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
  };

  function ruler() {
    const out = [];
    if (mode === 'stills') {
      const n = p.stills.length;
      for (let j = 0; j < n; j++) out.push(`<u style="left:${(j / n) * 100}%;width:${100 / n}%"></u><b class="s" style="left:${(j / n) * 100}%">${pad(j + 1)}</b>`);
    } else {
      const d = dOf();
      for (let s = 0; s <= Math.floor(d); s++) {
        const l = s % 5 === 0;
        out.push(`<i class="${l ? 'l' : ''}" style="left:${(s / d) * 100}%"></i>`);
        if (mode === 'film' && l && s > 0 && s < d - 1.5) out.push(`<b style="left:${(s / d) * 100}%">${s}s</b>`);
      }
      if (mode === 'ba') p.ba.ch.forEach(([a, b, name]) => out.push(`<u style="left:${(a / d) * 100}%;width:${((b - a) / d) * 100}%"></u><b class="s" style="left:${(a / d) * 100}%">${name}</b>`));
    }
    ticks.innerHTML = out.join('');
  }

  function showStill(j) {
    const n = p.stills.length; still = ((j % n) + n) % n; stillT0 = performance.now();
    const s = p.stills[still]; img.src = innerWidth > 1100 ? s.l : s.s; img.alt = s.alt || '';
  }

  function setMode(m) {
    mode = m; paused = false;
    $$('button', modes).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
    if (m === 'stills') {
      v.pause(); v.hidden = true; img.hidden = false; showStill(0);
    } else {
      img.hidden = true; v.hidden = false;
      const src = m === 'ba' ? p.ba.src : p.film;
      v.poster = m === 'ba' ? p.ba.poster : (p.poster || p.stage.p);
      if (v.dataset.src !== src) { v.dataset.src = src; v.src = src; v.preload = 'auto'; }
      v.loop = true; v.muted = !son.on();
      if (open) { try { v.currentTime = 0; } catch (e) { /* pas encore chargé */ } playV(v); }
    }
    playB.textContent = S.pause;
    ruler();
  }

  function setProject(k, anim) {
    i = ((k % list.length) + list.length) % list.length; p = list[i];
    idx.textContent = `${pad(i + 1)} / ${pad(list.length)}`;
    const ms = [];
    if (p.film) ms.push(['film', S.modeFilm]);
    if (p.stills && p.stills.length) ms.push(['stills', `${S.modeStills} ${p.stills.length}`]);
    if (p.ba) ms.push(['ba', S.modeBa]);
    modes.innerHTML = ms.length > 1 ? ms.map(([m, l]) => `<button type="button" data-m="${m}" aria-pressed="false">${l}</button>`).join('') : '';
    if (anim) scramble(tEl, p.t, 0.55); else tEl.textContent = p.t;
    mEl.innerHTML = `<span>${p.m1}</span><br><span>${p.m2}</span>`;
    fv.style.setProperty('--tint', p.tint);
    setMode(p.film ? 'film' : 'stills');
  }

  const ready = () => new Promise(res => {
    if (mode === 'stills') { if (img.complete && img.naturalWidth) res(); else { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); } return; }
    if (v.readyState >= 3) { res(); return; }
    v.addEventListener('canplay', res, { once: true }); v.addEventListener('error', res, { once: true });
    v.load();
  });

  // la boucle : tête de lecture, timecode, stills qui s'enchaînent
  function frame() {
    if (!open || !p) return;
    const w = rule.clientWidth;
    let frac = 0;
    if (mode === 'stills') {
      const n = p.stills.length, el = paused ? 0 : performance.now() - stillT0;
      if (!paused && el > STILL_MS) showStill(still + 1);
      frac = (still + Math.min(1, el / STILL_MS)) / n;
      tcEl.textContent = `${pad(still + 1)} / ${pad(n)}`;
      $$('u', ticks).forEach((u, j) => u.classList.toggle('on', j === still));
    } else {
      const d = dOf(), t = v.currentTime || 0; frac = t / d;
      tcEl.textContent = `${tc(t, fps())} / ${tc(d, fps())}`;
      if (mode === 'ba') $$('u', ticks).forEach((u, j) => u.classList.toggle('on', t >= p.ba.ch[j][0] && t < p.ba.ch[j][1]));
    }
    ph.style.transform = `translateX(${Math.min(1, frac) * w}px)`;
    rule.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
  }

  function seekAt(x) {
    const r = rule.getBoundingClientRect(), f = Math.min(0.999, Math.max(0, (x - r.left) / r.width));
    if (mode === 'stills') showStill(Math.floor(f * p.stills.length));
    else { try { v.currentTime = f * dOf(); } catch (e) { /* lecture pas prête */ } }
  }
  rule.addEventListener('pointerdown', e => { rule.setPointerCapture(e.pointerId); seekAt(e.clientX); const mv = ev => seekAt(ev.clientX); rule.addEventListener('pointermove', mv); rule.addEventListener('pointerup', () => rule.removeEventListener('pointermove', mv), { once: true }); });
  rule.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); e.stopPropagation();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    if (mode === 'stills') showStill(still + dir); else { try { v.currentTime = Math.max(0, Math.min(dOf(), v.currentTime + dir)); } catch (er) { /* */ } }
  });

  function togglePlay() {
    if (mode === 'stills') { paused = !paused; if (!paused) stillT0 = performance.now(); }
    else if (v.paused) { playV(v); paused = false; } else { v.pause(); paused = true; }
    playB.textContent = paused ? S.play : S.pause;
  }
  playB.addEventListener('click', togglePlay);
  modes.addEventListener('click', e => { const b = e.target.closest('button[data-m]'); if (b && b.dataset.m !== mode) setMode(b.dataset.m); });
  fsB.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => {}); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); });
  stage.addEventListener('click', togglePlay);

  // changer de projet comme on change de chaîne : un souffle de neige, puis le projet suivant
  const nctx = noise.getContext('2d'); noise.width = 192; noise.height = 108;
  const idata = nctx.createImageData(192, 108);
  function snow(ms) {
    if (RM) return Promise.resolve();
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        const d = idata.data;
        for (let k = 0; k < d.length; k += 4) { const g = (Math.random() * 255) | 0; d[k] = d[k + 1] = d[k + 2] = g; d[k + 3] = 255; }
        nctx.putImageData(idata, 0, 0);
        noise.style.opacity = '1';
        if (now - t0 < ms) requestAnimationFrame(step); else { noise.style.opacity = '0'; res(); }
      };
      requestAnimationFrame(step);
    });
  }
  async function go(dir) {
    const sn = snow(220);
    await wait(90);
    setProject(i + dir, true);
    history.replaceState({ nv: p.id }, '', `#${p.a}`);
    await sn;
    if (mode !== 'stills') playV(v);
  }
  fv.addEventListener('wheel', e => {
    e.preventDefault();
    clearTimeout(accT); accT = setTimeout(() => { acc = 0; }, 220);
    if (lock) return;
    acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(acc) > 70) { const dir = acc > 0 ? 1 : -1; acc = 0; lock = true; setTimeout(() => { lock = false; }, 950); go(dir); }
  }, { passive: false });
  // glisser vers le haut ou le bas sur téléphone
  let ty = null;
  stage.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => { if (ty == null) return; const dy = ty - e.changedTouches[0].clientY; ty = null; if (Math.abs(dy) > 60 && !lock) { lock = true; setTimeout(() => { lock = false; }, 700); go(dy > 0 ? 1 : -1); } }, { passive: true });

  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { if (!document.fullscreenElement) { e.preventDefault(); close(); } return; }
    if (e.target.closest('button, [role="slider"]') && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); if (!lock) { lock = true; setTimeout(() => { lock = false; }, 500); go(1); } }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); if (!lock) { lock = true; setTimeout(() => { lock = false; }, 500); go(-1); } }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const dir = e.key === 'ArrowRight' ? 1 : -1; if (mode === 'stills') showStill(still + dir); else if (!lock) { lock = true; setTimeout(() => { lock = false; }, 500); go(dir); } }
    else if (e.key === 'f' || e.key === 'F') fsB.click();
    else if (e.key === 'Tab') {
      const f = $$('button:not([hidden]), [tabindex="0"]', fv).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const a = f.indexOf(document.activeElement);
      if (e.shiftKey && a <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && a === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  $('#fv-x').addEventListener('click', () => close());

  function show() {
    open = true; fv.hidden = false; root.classList.add('fv-on');
    hint.textContent = list.length > 1 ? S.next : '';
    gsap.ticker.add(frame);
  }

  async function openView(id, rect, opts = {}) {
    if (open) return;
    if (opts.list) list = opts.list;
    const k = list.findIndex(x => x.id === id); if (k < 0) return;
    opener = document.activeElement;
    cur.hide();
    setProject(k, false);
    pushed = !opts.silent;
    if (pushed) history.pushState({ nv: p.id }, '', `#${p.a}`);
    if (RM || !rect) {
      show(); gsap.fromTo(fv, { opacity: 0 }, { opacity: 1, duration: RM ? 0 : 0.35 });
      if (mode !== 'stills') playV(v);
      $('#fv-x').focus({ preventScroll: true });
      return;
    }
    const W = innerWidth, H = innerHeight;
    tr.style.setProperty('--tint', p.tint);
    trm.innerHTML = `<img src="${p.stage.p}" alt="">`;
    trt.textContent = ''; trn.textContent = '000';
    gsap.set(trm, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    gsap.set([trt, trn], { autoAlpha: 1, y: 0 });
    tr.style.backgroundColor = '';
    tr.classList.add('on');
    const mw = Math.min(W * (mobile() ? 0.62 : 0.26), 400), mh = mw * 9 / 16;
    const cnt = { v: 0 };
    const tl = gsap.timeline();
    tl.fromTo(tr, { clipPath: `inset(${rect.top}px ${W - rect.right}px ${H - rect.bottom}px ${rect.left}px)` }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.6, ease: 'power3.inOut' })
      .to(trm, { left: (W - mw) / 2, top: H * 0.5 - mh - 16, width: mw, height: mh, duration: 0.75, ease: 'power3.inOut' }, 0.05)
      .add(() => { scramble(trt, p.t, 0.8); }, 0.3)
      .to(cnt, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => { trn.textContent = String(Math.round(cnt.v)).padStart(3, '0'); } }, 0.2);
    await Promise.all([tl.then(), Promise.race([ready(), wait(2600)])]);
    show();
    gsap.set(fv, { autoAlpha: 0 });
    const r = contentRect();
    const tl2 = gsap.timeline({ onComplete: () => { tr.classList.remove('on'); gsap.set([tr, trm, trt, trn], { clearProps: 'all' }); trm.innerHTML = ''; } });
    tl2.to([trt, trn], { autoAlpha: 0, y: -16, duration: 0.3, ease: 'power2.in' }, 0)
      .to(trm, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 0.8, ease: 'power3.inOut' }, 0.05)
      .to(tr, { backgroundColor: getComputedStyle(root).getPropertyValue('--bg').trim() || '#e4e4e0', duration: 0.6, ease: 'power2.inOut' }, 0.25)
      .add(() => { if (mode !== 'stills') playV(v); }, 0.6)
      .set(fv, { autoAlpha: 1 }, 0.86)
      .fromTo([$('.fv-top', fv), $('.fv-bot', fv)], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }, 0.86)
      .add(() => $('#fv-x').focus({ preventScroll: true }), 0.87)
      .to(tr, { autoAlpha: 0, duration: 0.2 }, 0.9);
  }

  function close(fromPop) {
    if (!open) return;
    open = false; root.classList.remove('fv-on');
    gsap.ticker.remove(frame);
    if (!fromPop && pushed) history.back();
    else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    pushed = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    gsap.to(fv, { autoAlpha: 0, duration: RM ? 0 : 0.3, ease: 'power2.in', onComplete: () => {
      fv.hidden = true; gsap.set(fv, { clearProps: 'all' });
      v.pause(); v.removeAttribute('src'); v.dataset.src = ''; v.load(); img.removeAttribute('src');
    } });
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  addEventListener('popstate', e => {
    const st = e.state;
    if (open && !(st && st.nv)) close(true);
    else if (!open && st && st.nv) openView(st.nv, null, { silent: true });
  });

  return { open: openView, close, isOpen: () => open };
})();
const fvOpen = () => !!(viewer && viewer.isOpen());

// ouvrir le projet de l'adresse (#crame…) au chargement
function deepLink(list) {
  const a = decodeURIComponent(location.hash.slice(1)); if (!a || !viewer) return false;
  const p = byAnchor(a); if (!p) return false;
  history.replaceState({ nv: p.id }, '', `#${p.a}`);
  viewer.open(p.id, null, { silent: true, list });
  return true;
}

/* ---------- Accueil : la bande ---------- */
function strip() {
  const sp = $('#sp'); if (!sp) return null;
  const tiles = $$('.tl', sp), n = tiles.length;
  let W = 0, total = 0, pos = 0, target = 0, hover = false, drag = null, moved = false, last = performance.now();
  const measure = () => { W = tiles[0].offsetWidth; total = W * n; };
  measure(); addEventListener('resize', measure);
  const xOf = k => { let x = (((k * W - pos) % total) + total) % total; if (x > total - W) x -= total; return x; };
  const render = () => { for (let k = 0; k < n; k++) tiles[k].style.transform = `translate3d(${xOf(k).toFixed(2)}px,0,0)`; };
  // au départ, le premier projet est au bord gauche
  render();

  const DRIFT = RM ? 0 : 24; // px/s, la bande avance seule tant qu'on ne la touche pas
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(64, now - last) / 1000; last = now;
    if (fvOpen()) return;
    if (!drag && !hover && !root.classList.contains('intro') && !document.hidden) target += DRIFT * dt;
    pos += (target - pos) * (RM ? 1 : 0.09);
    render();
  });

  addEventListener('wheel', e => {
    if (fvOpen() || e.ctrlKey) return;
    if (mobile() && Math.abs(e.deltaY) > Math.abs(e.deltaX)) return; // sur téléphone la page défile
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    target += d * (e.deltaMode === 1 ? 40 : 1) * 1.15;
  }, { passive: false });
  addEventListener('keydown', e => {
    if (fvOpen() || e.altKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { target += W; e.preventDefault(); }
    if (e.key === 'ArrowLeft') { target -= W; e.preventDefault(); }
  });

  sp.addEventListener('dragstart', e => e.preventDefault());
  sp.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, t: target, vx: 0, lx: e.clientX, lt: performance.now() }; moved = false;
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > 6) { moved = true; sp.classList.add('drag'); try { sp.setPointerCapture(e.pointerId); } catch (er) { /* */ } cur.hide(); }
    if (moved) {
      const now = performance.now();
      drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
      target = drag.t - dx * 1.2; pos = target;
    }
  });
  const up = () => { if (!drag) return; if (moved) target -= drag.vx * 380; drag = null; sp.classList.remove('drag'); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  sp.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  // vidéos : chargées et lues seulement quand la vignette est à l'écran
  const io = new IntersectionObserver(es => es.forEach(en => {
    const vd = en.target.querySelector('video'); if (!vd) return;
    if (en.isIntersecting && !SAVE) {
      if (!vd.src) { vd.src = vd.dataset.src; vd.addEventListener('playing', () => vd.classList.add('on'), { once: true }); }
      playV(vd);
    } else vd.pause();
  }), { rootMargin: '0px 12% 0px 12%' });
  tiles.forEach(t => io.observe(t));

  tiles.forEach(t => {
    const p = byId(t.dataset.id); if (!p) return;
    const title = $('.tl-t', t);
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; hover = true; cur.show(p.film ? S.film : S.stills, p.tint); scramble(title, p.t, 0.4); });
    t.addEventListener('pointerleave', () => { hover = false; cur.hide(); });
    t.addEventListener('focus', () => { const x = xOf(tiles.indexOf(t)); if (x < 0 || x + W > innerWidth) target += x - parseFloat(getComputedStyle(root).getPropertyValue('--m') || 20); });
    t.addEventListener('click', e => {
      if (!viewer || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      hover = false;
      viewer.open(p.id, $('.tl-m', t).getBoundingClientRect(), { list: ALL });
    });
  });
  return { tiles };
}

/* ---------- Intro : l'étoile s'ouvre au centre, puis rejoint le logo ---------- */
function intro() {
  if (!root.classList.contains('intro')) return;
  const svg = $('.hm-logo'); if (!svg) { root.classList.remove('intro'); return; }
  const star = $('.lg-s', svg), letters = $('.lg-l', svg);
  const others = $$('.hm-d, .ft, .tp, .mn-b');
  const n = document.createElement('p'); n.className = 'in-n mono'; n.setAttribute('aria-hidden', 'true'); n.textContent = '000';
  document.body.appendChild(n);
  const r = svg.getBoundingClientRect(), s = r.width / 2597.7095, bb = star.getBBox();
  const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
  const dx = (innerWidth / 2 - (r.left + cx * s)) / s, dy = (innerHeight * 0.44 - (r.top + cy * s)) / s;
  const k = Math.min((innerWidth * 0.8) / (bb.width * s), 5);
  const tiles = $$('.tl').map(t => ({ t, x: t.getBoundingClientRect().left })).filter(o => o.x < innerWidth && o.x > -innerWidth * 0.5).sort((a, b) => a.x - b.x).map(o => o.t);
  const finish = () => {
    root.classList.remove('intro'); store.set('nv-intro', '1', sessionStorage); n.remove();
    gsap.set(star, { clearProps: 'transform' }); gsap.set(letters, { clearProps: 'clipPath' });
    gsap.set($$('.tl'), { clearProps: 'clipPath' }); gsap.set(others, { clearProps: 'opacity,visibility' });
    removeEventListener('pointerdown', skip); removeEventListener('keydown', skip); removeEventListener('wheel', skip);
  };
  if (son.on()) { try { const a = new Audio('/media/sfx/nova-intro.mp3?v=3'); a.volume = 0.7; playV(a); } catch (e) { /* son bloqué */ } }
  const cnt = { v: 0 };
  gsap.set(star, { svgOrigin: `${cx} ${cy}`, x: dx, y: dy, scaleX: 0.02, scaleY: k, rotation: -40 });
  const tl = gsap.timeline({ onComplete: finish });
  tl.to(star, { scaleX: k, duration: 0.9, ease: 'expo.out' }, 0.1)
    .to(star, { rotation: 0, duration: 1.3, ease: 'power3.out' }, 0.1)
    .to(cnt, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { n.textContent = String(Math.round(cnt.v)).padStart(3, '0'); } }, 0)
    .to(n, { autoAlpha: 0, duration: 0.25 }, 1.35)
    .to(star, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.95, ease: 'power3.inOut' }, 1.35)
    .fromTo(letters, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power3.inOut' }, 1.55)
    .fromTo(tiles, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 1.85)
    .fromTo(others, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 2.2);
  function skip() { tl.progress(1); }
  setTimeout(() => { addEventListener('pointerdown', skip); addEventListener('keydown', skip); addEventListener('wheel', skip); }, 300);
}

/* ---------- Projets : la roue ---------- */
function wheel() {
  const wh = $('#wh'); if (!wh) return;
  const items = $$('.wh-i', wh), thumbs = $$('.wh-th img', wh);
  const st = $('#wh-st'), si = $('#wh-si'), sv = $('#wh-sv'), meta = $('#wh-m'), m1 = $('#wh-m1'), m2 = $('#wh-m2'), goB = $('#wh-go');
  const P = items.map(el => byId(el.dataset.id));
  let vis = items.map((_, j) => j), pos = 0, target = 0, active = -1, snapT, swapT, drag = null, moved = false;
  let G = {};
  const geo = () => {
    const W = innerWidth, H = innerHeight, mob = W <= 760, m = parseFloat(getComputedStyle(root).getPropertyValue('--m')) || 20;
    const sw = mob ? W - 2 * m : Math.min(W * 0.4, (H - 280) * 16 / 9), sh = sw * 9 / 16;
    const cy = mob ? 92 + sh / 2 : H / 2;
    G = { W, H, mob, m, sw, sh, cy };
    wh.style.setProperty('--sw', `${sw}px`);
    st.style.top = `${cy}px`;
  };
  geo(); addEventListener('resize', geo);

  const wrapD = (k, n) => { let d = (((k - pos) % n) + n) % n; if (d > n / 2) d -= n; return d; };
  function place() {
    const n = vis.length, { W, mob, m, sw, sh, cy } = G;
    vis.forEach((j, k) => {
      const el = items[j], th = thumbs[j], d = wrapD(k, n), ad = Math.abs(d), sg = Math.sign(d);
      let x, y;
      if (mob) {
        const base = cy + sh / 2 + 44;
        y = base + d * 48 + (d > 0 ? 24 * Math.min(d, 1) : 0);
        x = m + 10 / (1 + (d * d) / 0.45);
      } else {
        const a = sh / 2 + 64, g = 72;
        y = cy + (ad <= 1 ? d * a : sg * (a + (ad - 1) * g));
        x = W / 2 - 70 + (sw / 2 + 102) / (1 + (d * d) / 0.45);
      }
      const sc = 1 - 0.38 * Math.min(ad, 1);
      const top = mob ? cy + sh / 2 + 16 : 70;
      const edge = Math.min(1, Math.max(0, (y - top) / (mob ? 30 : 90))) * Math.min(1, Math.max(0, (G.H - 70 - y) / 90));
      const op = (ad <= 0.5 ? 1 : ad <= 1.5 ? 1 - (ad - 0.5) * 0.4 : Math.max(0, 0.6 - (ad - 1.5) * 0.14)) * edge;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${(y - el.offsetHeight / 2).toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      el.style.opacity = op.toFixed(3); el.style.visibility = op < 0.02 ? 'hidden' : 'visible';
      if (th && !mob) {
        const tx = m - 70 / (1 + (d * d) / 0.45) + 18, ty = y - 26;
        th.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`; th.style.opacity = (op * 0.95).toFixed(3);
      }
    });
    const near = Math.abs(pos - Math.round(pos)) < 0.12;
    meta.style.opacity = near ? '1' : '0';
    if (mob) { meta.style.transform = `translate3d(${G.m}px,${G.cy + G.sh / 2 + 16 + 64 + 46 + 30}px,0)`; meta.style.display = 'none'; }
    else meta.style.transform = `translate3d(${(G.W / 2 + G.sw / 2 + 32).toFixed(1)}px,${(G.cy + (items[active] ? items[active].offsetHeight / 2 : 30) + 10).toFixed(1)}px,0)`;
    const a = vis[(((Math.round(pos)) % n) + n) % n];
    if (a !== active) setActive(a);
  }
  function setActive(j) {
    active = j; const p = P[j];
    items.forEach((el, q) => el.classList.toggle('on', q === j));
    m1.textContent = p.m1; m2.textContent = p.m2; goB.textContent = p.film ? S.film : S.stills;
    st.setAttribute('aria-label', `${p.film ? S.film : S.stills} : ${p.t}`);
    st.style.setProperty('--tint', p.tint);
    clearTimeout(swapT);
    swapT = setTimeout(() => {
      si.src = p.stage.p; sv.classList.remove('on'); sv.pause();
      if (p.stage.v && !SAVE) { sv.src = p.stage.v; sv.addEventListener('playing', () => sv.classList.add('on'), { once: true }); playV(sv); } else sv.removeAttribute('src');
    }, 140);
  }
  const snap = () => { clearTimeout(snapT); snapT = setTimeout(() => { target = Math.round(target); }, 150); };
  gsap.ticker.add(() => { if (fvOpen()) return; pos += (target - pos) * (RM ? 1 : 0.12); place(); });

  addEventListener('wheel', e => {
    if (fvOpen() || e.ctrlKey) return;
    e.preventDefault();
    target += (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * (e.deltaMode === 1 ? 40 : 1) / 150;
    snap();
  }, { passive: false });
  addEventListener('keydown', e => {
    if (fvOpen()) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { target = Math.round(target) + 1; e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { target = Math.round(target) - 1; e.preventDefault(); }
  });
  wh.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag = { y: e.clientY, t: target, vy: 0, ly: e.clientY, lt: performance.now() }; moved = false; });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!moved && Math.abs(dy) > 6) { moved = true; cur.hide(); }
    if (moved) { const now = performance.now(); drag.vy = (e.clientY - drag.ly) / Math.max(1, now - drag.lt); drag.ly = e.clientY; drag.lt = now; target = drag.t - dy / (G.mob ? 50 : 66); }
  });
  const up = () => { if (!drag) return; if (moved) target = Math.round(target - drag.vy * 6); drag = null; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  wh.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  const list = () => vis.map(j => P[j]);
  const openActive = () => viewer && viewer.open(P[active].id, st.getBoundingClientRect(), { list: list() });
  items.forEach((el, j) => {
    $('a', el).addEventListener('click', e => {
      if (!viewer || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (j === active && Math.abs(pos - Math.round(pos)) < 0.2) openActive();
      else { const k = vis.indexOf(j); target = Math.round(pos) + wrapD(k, vis.length) + (pos - Math.round(pos)); target = Math.round(target); }
    });
    $('a', el).addEventListener('focus', () => { const k = vis.indexOf(j); target = Math.round(pos + wrapD(k, vis.length)); });
  });
  st.addEventListener('click', openActive);
  goB.addEventListener('click', openActive);
  st.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { const p = P[active]; cur.show(p.film ? S.film : S.stills, p.tint); } });
  st.addEventListener('pointerleave', () => cur.hide());

  $$('.wh-f button').forEach(b => b.addEventListener('click', () => {
    $$('.wh-f button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const f = b.dataset.f;
    vis = items.map((_, j) => j).filter(j => f === 'all' || P[j].k === f);
    items.forEach((el, j) => { const on = vis.includes(j); el.classList.toggle('f', !on); if (thumbs[j]) thumbs[j].classList.toggle('f', !on); });
    pos = target = 0; active = -1;
    gsap.fromTo('.wh-l, .wh-th, .wh-m', { autoAlpha: 0 }, { autoAlpha: 1, duration: RM ? 0 : 0.4 });
  }));
  place();
  return { list };
}

/* ---------- Studio : la tête de lecture parcourt la méthode ---------- */
function method() {
  const box = $('#tl6'); if (!box) return;
  const tr = $('.tl6-tr', box), ph = $('#tl6-ph'), steps = $$('li', tr);
  const run = () => {
    const lab = parseFloat(getComputedStyle(box).getPropertyValue('--lab')) || 96;
    const o = { p: 0 };
    gsap.to(o, { p: 1, duration: RM ? 0 : 3.4, ease: 'power1.inOut', onUpdate() {
      ph.style.transform = `translateX(${o.p * (tr.clientWidth - lab)}px)`;
      const col = o.p * steps.length;
      steps.forEach((s, j) => s.classList.toggle('on', col >= j + 0.1));
    } });
  };
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.5 });
  io.observe(box);
}

/* ---------- Contact ---------- */
function contact() {
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const txt = b.textContent;
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = b.dataset.done || 'Copié'; setTimeout(() => { b.textContent = txt; }, 1800); } catch (e) { location.href = `mailto:${b.dataset.copy}`; }
  }));
  const v = $('.ct-b video'); if (v && RM) v.pause();
}

/* ---------- Démarrage ---------- */
clock(); menu(); sound(); contact(); method();
const home = strip();
const wl = wheel();
if (home) { if (!deepLink(ALL)) intro(); else root.classList.remove('intro'); }
if (wl) deepLink(wl.list());
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fit);
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 120); });
