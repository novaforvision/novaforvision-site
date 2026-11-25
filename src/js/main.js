// NOVA FOR VISION · d'après AUGE Experience
// Écran d'ouverture, passage d'une page à l'autre en aplat d'accent (titre brouillé, compteur),
// accueil : bande de projets dont la hauteur grandit vers la droite ; Projets : une roue ;
// pages projet : couverture en mouvement, titre géant, film, images, projet suivant.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const body = document.body;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(hover: none)').matches;
const SAVE = !!(navigator.connection && navigator.connection.saveData);
const mobile = () => innerWidth <= 760;
const clamp = (a, b, v) => Math.min(b, Math.max(a, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get: (k, s = sessionStorage) => { try { return s.getItem(k); } catch (e) { return null; } },
  set: (k, v, s = sessionStorage) => { try { s.setItem(k, v); } catch (e) { /* mémoire indisponible */ } },
  del: (k, s = sessionStorage) => { try { s.removeItem(k); } catch (e) { /* */ } },
};
const playV = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); return p; };
const DATA = (() => { const el = $('#nv-data'); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } })();

/* ---------- Son ---------- */
const son = {
  on: () => root.classList.contains('son'),
  set(v) {
    root.classList.toggle('son', v); store.set('nv-son', v ? '1' : '0', localStorage);
    $$('[data-son]').forEach(b => b.setAttribute('aria-pressed', String(v)));
    $$('video[data-sound]').forEach(x => { x.muted = !v; });
  },
};
$$('[data-son]').forEach(b => { b.setAttribute('aria-pressed', String(son.on())); b.addEventListener('click', () => son.set(!son.on())); });

/* ---------- Menu ---------- */
(() => {
  const b = $('#mn-b'), m = $('#mn'); if (!b || !m) return;
  const isOpen = () => b.getAttribute('aria-expanded') === 'true';
  const set = o => {
    b.setAttribute('aria-expanded', String(o));
    if (o) { m.hidden = false; requestAnimationFrame(() => m.classList.add('on')); }
    else { m.classList.remove('on'); setTimeout(() => { if (!m.classList.contains('on')) m.hidden = true; }, 460); }
  };
  b.addEventListener('click', () => set(!isOpen()));
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { set(false); b.focus(); } });
  addEventListener('pointerdown', e => { if (isOpen() && !m.contains(e.target) && !b.contains(e.target)) set(false); });
})();

/* ---------- Curseur : un losange qui suit, une étiquette sur ce qui s'ouvre ---------- */
const cur = (() => {
  const el = $('#cur'), t = $('#cur-t');
  if (!el || COARSE) return { show() {}, hide() {} };
  gsap.set(el, { x: -100, y: -100 });
  const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
  addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  return { show(txt) { if (t.textContent !== txt) t.textContent = txt; el.classList.add('on'); }, hide() { el.classList.remove('on'); } };
})();

/* ---------- Brouillage : lettres au hasard qui se fixent de gauche à droite ---------- */
const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function scramble(el, text, dur = 0.7, mixedFonts = false) {
  if (RM || !text) { el.textContent = text; return Promise.resolve(); }
  const chars = [...text], n = chars.length;
  el.textContent = '';
  const spans = chars.map(ch => { const s = document.createElement('span'); s.textContent = ch; el.appendChild(s); return s; });
  const t0 = performance.now(); let last = 0;
  return new Promise(res => {
    const step = now => {
      const p = Math.min(1, (now - t0) / (dur * 1000)), swap = now - last > 55;
      if (swap) last = now;
      for (let i = 0; i < n; i++) {
        const ch = chars[i]; if (ch === ' ' || ch === '\n') continue;
        const s = spans[i];
        if (p >= 0.25 + (i / n) * 0.75) { if (s.className || s.textContent !== ch) { s.textContent = ch; s.className = ''; } }
        else if (swap) {
          const it = mixedFonts && Math.random() < 0.45;
          s.textContent = it ? GL[(Math.random() * 26) | 0].toLowerCase() : GL[(Math.random() * 26) | 0];
          s.className = it ? 'it' : '';
        }
      }
      if (p < 1) requestAnimationFrame(step); else { el.textContent = text; res(); }
    };
    requestAnimationFrame(step);
  });
}
// libellés : ils se brouillent quand ils entrent à l'écran, puis au survol
(() => {
  const els = $$('[data-scr]'); if (!els.length || RM) return;
  els.forEach(el => { el.dataset.txt = el.textContent; el.setAttribute('aria-label', el.textContent); });
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { io.unobserve(en.target); scramble(en.target, en.target.dataset.txt, 0.8); } }), { threshold: 0.5 });
  els.forEach(el => { io.observe(el); el.addEventListener('pointerenter', () => scramble(el, el.dataset.txt, 0.5)); });
  const k = $('.hm-k'); if (k) setInterval(() => { if (!document.hidden) scramble(k, k.dataset.txt, 0.8); }, 6000);
})();

/* ---------- Passage d'une page à l'autre ---------- */
const tr = $('#tr'), trm = $('#tr-m'), trt = $('#tr-t'), trn = $('#tr-n');
let leaving = false;
function leave(href, title, img) {
  if (leaving) return;
  if (RM || !tr) { location.href = href; return; }
  leaving = true; cur.hide();
  trm.innerHTML = img ? `<img src="${img}" alt="">` : '';
  trt.textContent = ''; trn.textContent = '000';
  tr.style.visibility = 'visible';
  const cnt = { v: 0 };
  gsap.timeline()
    .fromTo(tr, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.inOut' }, 0)
    .add(() => scramble(trt, title, 0.9, true), 0.25)
    .to(cnt, { v: 60, duration: 1, ease: 'power1.inOut', onUpdate: () => { trn.textContent = String(Math.round(cnt.v)).padStart(3, '0'); } }, 0.1)
    .add(() => { store.set('nv-tr', JSON.stringify({ t: title, img })); location.href = href; }, 1.15);
}
addEventListener('pageshow', e => { if (e.persisted) { leaving = false; gsap.set(tr, { clearProps: 'all' }); root.classList.remove('tr-in'); } });
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || /^(mailto|tel):/.test(a.getAttribute('href'))) return;
  if (url.pathname === location.pathname && url.hash) return;
  if (a.hasAttribute('data-scroll')) return;
  e.preventDefault();
  leave(url.href, a.dataset.tr || a.textContent.trim().slice(0, 40), a.dataset.trImg || '');
});
// l'aplat se retire sur la nouvelle page
function arrive() {
  const raw = store.get('nv-tr');
  if (!root.classList.contains('tr-in') || !tr) return Promise.resolve();
  let d = {}; try { d = JSON.parse(raw) || {}; } catch (e) { d = {}; }
  store.del('nv-tr');
  trt.textContent = d.t || ''; trm.innerHTML = d.img ? `<img src="${d.img}" alt="">` : '';
  const cnt = { v: 60 };
  return new Promise(res => {
    gsap.timeline({ onComplete: () => { root.classList.remove('tr-in'); gsap.set(tr, { clearProps: 'all' }); } })
      .add(res, 0.3)
      .to(cnt, { v: 100, duration: 0.45, ease: 'power1.out', onUpdate: () => { trn.textContent = String(Math.round(cnt.v)).padStart(3, '0'); } }, 0)
      .fromTo(tr, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'power3.inOut' }, 0.4);
  });
}

/* ---------- Écran d'ouverture : NOVA, for Vision, compteur ---------- */
function opening() {
  const ld = $('#ld');
  if (!root.classList.contains('ld-on') || !ld) return Promise.resolve();
  const svg = $('.ld-logo', ld), star = $('.lg-s', svg), letters = $('.lg-l', svg), it = $('.ld-i', ld), n = $('#ld-n');
  const bb = star.getBBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
  const cnt = { v: 0 };
  gsap.set(star, { svgOrigin: `${cx} ${cy}`, scaleX: 0.02, rotation: -40 });
  gsap.set(letters, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set(it, { autoAlpha: 0, y: 20 });
  if (son.on()) { try { const a = new Audio('/media/sfx/nova-intro.mp3?v=3'); a.volume = 0.6; playV(a); } catch (e) { /* son bloqué */ } }
  return new Promise(res => {
    const tl = gsap.timeline({ onComplete: () => { root.classList.remove('ld-on'); store.set('nv-ld', '1'); } });
    tl.add(res, 1.8);
    tl.to(star, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.1)
      .to(star, { rotation: 0, duration: 1.2, ease: 'power3.out' }, 0.1)
      .to(letters, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power3.inOut' }, 0.45)
      .to(it, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.85)
      .to(cnt, { v: 100, duration: 1.7, ease: 'power1.inOut', onUpdate: () => { n.textContent = String(Math.round(cnt.v)).padStart(3, '0'); } }, 0)
      .to(ld, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'power3.inOut' }, 1.9);
    const skip = () => { tl.progress(1); removeEventListener('pointerdown', skip); removeEventListener('keydown', skip); };
    setTimeout(() => { addEventListener('pointerdown', skip); addEventListener('keydown', skip); }, 400);
  });
}

/* ---------- Défilement doux (pages qui défilent) ---------- */
let lenis = null;
const onScroll = [];
function smooth() {
  if (RM || !$('.pj, .st, .ct, .lg')) { addEventListener('scroll', () => onScroll.forEach(f => f(scrollY)), { passive: true }); return; }
  lenis = new Lenis({ anchors: false, lerp: 0.1 });
  lenis.on('scroll', ({ scroll }) => onScroll.forEach(f => f(scroll)));
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Pied de page sur téléphone : visible seulement en fin de page ---------- */
function footerMobile() {
  const mq = matchMedia('(max-width: 760px)');
  const run = y => {
    if (!mq.matches) { root.classList.remove('ft-off'); return; }
    const max = document.documentElement.scrollHeight - innerHeight;
    root.classList.toggle('ft-off', max > 40 && y < max - 80);
  };
  onScroll.push(run);
  addEventListener('resize', () => run(scrollY));
  run(scrollY);
}

/* ---------- Apparitions (elles attendent que l'aplat se soit retiré) ---------- */
let enteredResolve;
const entered = new Promise(r => { enteredResolve = r; });
// lignes qui montent derrière un masque
function lines() {
  $$('[data-lines]').forEach(el => {
    if (RM) return;
    SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit(self) {
      gsap.set(self.lines, { yPercent: 105 });
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); entered.then(() => gsap.to(self.lines, { yPercent: 0, duration: 1, ease: 'power3.out', stagger: 0.08 })); } }, { threshold: 0.2 });
      io.observe(el);
    } });
  });
}
// titres en deux voix : chaque mot monte, ligne par ligne
function words(scope = document) {
  $$('.mx-l', scope).forEach(l => {
    const ws = $$('.mx-w', l); if (RM || !ws.length) return;
    gsap.set(ws, { yPercent: 115 });
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); entered.then(() => gsap.to(ws, { yPercent: 0, duration: 0.95, ease: 'power3.out', stagger: 0.05 })); } }, { threshold: 0.15 });
    io.observe(l);
  });
}
// vidéos qui ne se chargent qu'à l'écran
const vio = new IntersectionObserver(es => es.forEach(en => {
  const v = en.target;
  if (en.isIntersecting && !SAVE) { if (!v.src && v.dataset.src) v.src = v.dataset.src; playV(v); } else v.pause();
}), { rootMargin: '10% 0px' });

/* ---------- Accueil : la bande ---------- */
function strip() {
  const sp = $('#sp'); if (!sp) return null;
  const tiles = $$('.tl', sp), n = tiles.length, see = sp.dataset.see;
  const meds = tiles.map(t => $('.tl-m', t)), caps = tiles.map(t => $('.tl-c', t));
  let W = 0, total = 0, H = 0, hMin = 0, hMax = 0, vw = 0, pos = 0, target = 0, hover = false, drag = null, moved = false, last = performance.now(), ready = false;
  const measure = () => {
    W = tiles[0].offsetWidth; total = W * n; vw = innerWidth; H = meds[0].offsetHeight;
    hMax = H; hMin = H * (mobile() ? 0.6 : 0.62);
  };
  measure(); addEventListener('resize', measure);
  const xOf = k => { let x = (((k * W - pos) % total) + total) % total; if (x > total - W) x -= total; return x; };
  const render = () => {
    for (let k = 0; k < n; k++) {
      const x = xOf(k), f = clamp(0, 1, (x + W / 2) / vw), h = hMin + (hMax - hMin) * f;
      tiles[k].style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      meds[k].style.clipPath = `inset(0 0 ${(H - h).toFixed(1)}px 0)`;
      caps[k].style.transform = `translate3d(0,${(h + 14).toFixed(1)}px,0)`;
    }
  };
  render();
  const DRIFT = RM ? 0 : 26;
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(64, now - last) / 1000; last = now;
    if (ready && !drag && !hover && !leaving && !document.hidden) target += DRIFT * dt;
    pos += (target - pos) * (RM ? 1 : 0.085);
    render();
  });
  addEventListener('wheel', e => {
    if (e.ctrlKey || leaving) return;
    if (mobile() && Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
    e.preventDefault();
    target += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 40 : 1) * 1.1;
  }, { passive: false });
  addEventListener('keydown', e => { if (e.key === 'ArrowRight') { target += W; e.preventDefault(); } if (e.key === 'ArrowLeft') { target -= W; e.preventDefault(); } });
  sp.addEventListener('dragstart', e => e.preventDefault());
  sp.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag = { x: e.clientX, t: target, vx: 0, lx: e.clientX, lt: performance.now() }; moved = false; });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > 6) { moved = true; sp.classList.add('drag'); cur.hide(); }
    if (moved) { const now = performance.now(); drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now; target = drag.t - dx * 1.2; pos = target; }
  });
  const up = () => { if (!drag) return; if (moved) target -= drag.vx * 380; drag = null; sp.classList.remove('drag'); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  sp.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  const io = new IntersectionObserver(es => es.forEach(en => {
    const v = $('video', en.target); if (!v) return;
    if (en.isIntersecting && !SAVE) { if (!v.src) { v.src = v.dataset.src; v.addEventListener('playing', () => v.classList.add('on'), { once: true }); } playV(v); } else v.pause();
  }), { rootMargin: '0px 15% 0px 15%' });
  tiles.forEach((t, k) => {
    io.observe(t);
    const title = $('.tl-t', t), txt = title.textContent;
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; hover = true; cur.show(see); scramble(title, txt, 0.45); });
    t.addEventListener('pointerleave', () => { hover = false; cur.hide(); });
    t.addEventListener('focus', () => { const x = xOf(k); if (x < 0 || x + W > innerWidth) target += x - 30; });
  });
  return {
    enter() {
      ready = true;
      if (RM) return;
      const vis = tiles.filter((t, k) => { const x = xOf(k); return x > -W && x < innerWidth; }).sort((a, b) => xOf(tiles.indexOf(a)) - xOf(tiles.indexOf(b)));
      gsap.from(vis, { yPercent: -100, duration: 1.1, ease: 'power4.out', stagger: 0.07 });
      gsap.from('.hm-logo', { yPercent: 40, skewX: -14, autoAlpha: 0, duration: 1.1, ease: 'power4.out', delay: 0.1 });
      gsap.from('.hm-d', { autoAlpha: 0, y: 16, duration: 0.8, ease: 'power3.out', delay: 0.35 });
    },
  };
}

/* ---------- Projets : la roue ---------- */
function wheel() {
  const wh = $('#wh'); if (!wh) return null;
  const items = $$('.wh-i', wh), thumbs = $$('.wh-th img', wh), st = $('#wh-st'), si = $('#wh-si'), sv = $('#wh-sv');
  const P = items.map(el => DATA.p.find(p => p.id === el.dataset.id));
  const n = items.length, see = wh.dataset.see;
  let pos = 0, target = 0, active = -1, snapT, swapT, drag = null, moved = false, G = {};
  const geo = () => {
    const W = innerWidth, H = innerHeight, mob = W <= 760, m = mob ? 16 : Math.min(30, Math.max(16, W * 0.021));
    const sw = mob ? W - 2 * m : Math.min(W * 0.39, (H - 300) * 16 / 9), sh = sw * 9 / 16;
    const cy = mob ? 100 + sh / 2 : H / 2;
    G = { W, H, mob, m, sw, sh, cy };
    wh.style.setProperty('--sw', `${sw}px`); st.style.top = `${cy}px`;
  };
  geo(); addEventListener('resize', geo);
  const wrapD = k => { let d = (((k - pos) % n) + n) % n; if (d > n / 2) d -= n; return d; };
  function place() {
    const { W, H, mob, m, sw, sh, cy } = G;
    for (let k = 0; k < n; k++) {
      const el = items[k], d = wrapD(k), ad = Math.abs(d), sg = Math.sign(d);
      let x, y;
      if (mob) { y = cy + sh / 2 + 56 + d * 62; x = m + 8 / (1 + (d * d) / 0.45); }
      else { const a = sh / 2 + 66, g = 74; y = cy + (ad <= 1 ? d * a : sg * (a + (ad - 1) * g)); x = W / 2 - 80 + (sw / 2 + 112) / (1 + (d * d) / 0.45); }
      const sc = 1 - 0.36 * Math.min(ad, 1);
      const top = mob ? cy + sh / 2 + 20 : 40;
      const edge = clamp(0, 1, (y - top) / 80) * clamp(0, 1, (H - 70 - y) / 80);
      const op = (ad <= 0.5 ? 1 : ad <= 1.5 ? 1 - (ad - 0.5) * 0.35 : Math.max(0, 0.65 - (ad - 1.5) * 0.15)) * edge;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${(y - el.offsetHeight / 2).toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
      el.style.opacity = op.toFixed(3); el.style.visibility = op < 0.02 ? 'hidden' : 'visible';
      const th = thumbs[k];
      if (th && !mob) { th.style.transform = `translate3d(${(m + 22 - 80 / (1 + (d * d) / 0.45)).toFixed(1)}px,${(y - 26).toFixed(1)}px,0)`; th.style.opacity = (op * 0.95).toFixed(3); }
    }
    const a = (((Math.round(pos)) % n) + n) % n;
    if (a !== active) setActive(a);
  }
  function setActive(j) {
    active = j; const p = P[j];
    items.forEach((el, q) => el.classList.toggle('on', q === j));
    st.href = p.href; st.dataset.tr = p.t; st.dataset.trImg = p.stage.p; st.setAttribute('aria-label', `${see} : ${p.t}`);
    clearTimeout(swapT);
    swapT = setTimeout(() => {
      si.src = p.stage.p; sv.classList.remove('on'); sv.pause();
      if (p.stage.v && !SAVE) { sv.src = p.stage.v; sv.addEventListener('playing', () => sv.classList.add('on'), { once: true }); playV(sv); } else sv.removeAttribute('src');
    }, 140);
  }
  const snap = () => { clearTimeout(snapT); snapT = setTimeout(() => { target = Math.round(target); }, 150); };
  gsap.ticker.add(() => { pos += (target - pos) * (RM ? 1 : 0.12); place(); });
  addEventListener('wheel', e => { if (e.ctrlKey || leaving) return; e.preventDefault(); target += (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * (e.deltaMode === 1 ? 40 : 1) / 150; snap(); }, { passive: false });
  addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { target = Math.round(target) + 1; e.preventDefault(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { target = Math.round(target) - 1; e.preventDefault(); }
  });
  wh.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag = { y: e.clientY, t: target, vy: 0, ly: e.clientY, lt: performance.now() }; moved = false; });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!moved && Math.abs(dy) > 6) { moved = true; cur.hide(); }
    if (moved) { const now = performance.now(); drag.vy = (e.clientY - drag.ly) / Math.max(1, now - drag.lt); drag.ly = e.clientY; drag.lt = now; target = drag.t - dy / (G.mob ? 56 : 70); }
  });
  const up = () => { if (!drag) return; if (moved) target = Math.round(target - drag.vy * 6); drag = null; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  // un clic sur un titre qui n'est pas au centre le ramène au centre ; au centre, il ouvre le projet
  wh.addEventListener('click', e => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
    const li = e.target.closest('.wh-i'); if (!li) return;
    const k = items.indexOf(li);
    if (k !== active || Math.abs(pos - Math.round(pos)) > 0.2) { e.preventDefault(); e.stopPropagation(); target = Math.round(pos + wrapD(k)); }
  }, true);
  items.forEach((el, k) => $('a', el).addEventListener('focus', () => { target = Math.round(pos + wrapD(k)); }));
  st.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') cur.show(see); });
  st.addEventListener('pointerleave', () => cur.hide());
  place();
  return { enter() { if (!RM) gsap.from([st, '.wh-l', '.wh-th'], { autoAlpha: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.08 }); } };
}

/* ---------- Page projet ---------- */
function mix(hex, amt, base = '#ececE6') {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex), b = p(base);
  return `rgb(${a.map((v, i) => Math.round(v * amt + b[i] * (1 - amt))).join(',')})`;
}
function projectPage() {
  const pj = $('.pj'); if (!pj) return null;
  const hm = $('.pj-hm'), h1 = $('.pj-h'), mini = $('.pj-mini'), nxm = $('.nx-m');
  const tint = pj.style.getPropertyValue('--tint').trim();
  onScroll.push(y => {
    if (hm && y < innerHeight * 1.2) hm.style.transform = `translate3d(0,${(y * 0.32).toFixed(1)}px,0)`;
    if (mini) mini.classList.toggle('on', h1.getBoundingClientRect().bottom < 90);
    if (nxm) { const r = nxm.getBoundingClientRect(), p = clamp(0, 1, (innerHeight - r.top) / (innerHeight * 0.9)); nxm.style.transform = `scale(${(0.8 + 0.2 * p).toFixed(3)})`; }
  });
  // la page se teinte quand on arrive aux images
  const gl = $('.gl');
  if (gl && tint) new IntersectionObserver(es => es.forEach(en => { body.style.setProperty('--page', en.isIntersecting ? mix(tint, 0.16) : '#ececE6'); }), { rootMargin: '-35% 0px -35% 0px' }).observe(gl);
  // images : elles se découvrent en entrant
  $$('.gl-f').forEach(f => {
    const v = $('video', f); if (v) vio.observe(v);
    if (RM) return;
    const m = $('img, video', f);
    gsap.set(m, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 });
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); gsap.to(m, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }); gsap.to(m, { scale: 1, duration: 1.6, ease: 'power3.out' }); } }, { threshold: 0.1 });
    io.observe(f);
  });
  // le film
  const box = $('#pf');
  if (box) {
    const v = $('#pf-v'), btn = $('#pf-btn'), bar = $('#pf-p');
    v.dataset.sound = '1';
    const toggle = () => {
      if (!v.src) { v.src = v.dataset.src; v.preload = 'auto'; }
      v.muted = !son.on();
      if (v.paused) { playV(v); box.classList.add('playing'); btn.textContent = box.dataset.pause; cur.show(box.dataset.pause); }
      else { v.pause(); box.classList.remove('playing'); btn.textContent = box.dataset.play; cur.show(box.dataset.play); }
    };
    box.addEventListener('click', toggle);
    v.addEventListener('timeupdate', () => { bar.style.setProperty('--p', (v.currentTime / (v.duration || 1)).toFixed(4)); });
    v.addEventListener('ended', () => { box.classList.remove('playing'); btn.textContent = box.dataset.play; });
    box.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') cur.show(v.paused ? box.dataset.play : box.dataset.pause); });
    box.addEventListener('pointerleave', () => cur.hide());
    new IntersectionObserver(es => { if (!es[0].isIntersecting && !v.paused) toggle(); }, { threshold: 0.1 }).observe(box);
    $$('[data-scroll]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const go = () => { if (v.paused) toggle(); };
      if (lenis) lenis.scrollTo('#pf-s', { offset: -40, duration: 1.4, onComplete: go }); else { $('#pf-s').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); setTimeout(go, 600); }
    }));
  }
  // avant / après : les étapes s'allument avec la vidéo
  const ba = $('.ba-box video');
  if (ba) {
    vio.observe(ba);
    const ch = $$('.ba-ch li');
    ba.addEventListener('timeupdate', () => { const t = ba.currentTime; ch.forEach(li => li.classList.toggle('on', t >= +li.dataset.a && t < +li.dataset.b)); });
  }
  const nx = $('.nx');
  if (nx) { nx.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') cur.show(nx.querySelector('.lb').textContent); }); nx.addEventListener('pointerleave', () => cur.hide()); }
  return {
    enter() {
      if (RM) return;
      gsap.from('.pj-hm', { scale: 1.15, duration: 1.6, ease: 'power3.out' });
      gsap.from('.pj-h span', { yPercent: 30, skewX: -10, autoAlpha: 0, duration: 1.1, ease: 'power4.out', delay: 0.1 });
    },
  };
}

/* ---------- Studio : l'étoile qui s'ouvre sur une image ---------- */
function studioPage() {
  const sec = $('#st-star'); if (!sec) return;
  const star = $('.st-s', sec), fr = $('.st-fr', sec), fo = $('.st-fo', sec);
  const ease = t => t * t * (3 - 2 * t);
  const run = () => {
    const r = sec.getBoundingClientRect(), p = clamp(0, 1, -r.top / (r.height - innerHeight));
    const s1 = clamp(0, 1, p / 0.42);
    star.style.transform = `translate(-50%,-50%) scale(${(0.1 + 0.9 * s1 * s1).toFixed(4)}) rotate(${(s1 * 25).toFixed(1)}deg)`;
    star.style.opacity = (1 - clamp(0, 1, (p - 0.26) / 0.16)).toFixed(3);
    const c = 50 * (1 - ease(clamp(0, 1, (p - 0.22) / 0.42)));
    fr.style.clipPath = `inset(${c.toFixed(2)}% ${c.toFixed(2)}% ${c.toFixed(2)}% ${c.toFixed(2)}%)`;
    fo.style.opacity = clamp(0, 1, (p - 0.62) / 0.14).toFixed(3);
  };
  if (!RM) { onScroll.push(run); run(); }
  $$('.ar li').forEach((li, j) => { if (RM) return; gsap.set(li, { autoAlpha: 0, y: 14 }); const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); gsap.to(li, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: (j % 5) * 0.04 }); } }); io.observe(li); });
}

/* ---------- Contact ---------- */
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const txt = b.textContent;
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = b.dataset.done; setTimeout(() => { b.textContent = txt; }, 1800); } catch (e) { location.href = `mailto:${b.dataset.copy}`; }
}));

/* ---------- Démarrage ---------- */
smooth();
footerMobile();
const home = strip();
const wl = wheel();
const pp = projectPage();
studioPage();
lines();
words();
(async () => {
  if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, wait(1200)]);
  if (root.classList.contains('ld-on')) await opening(); else await arrive();
  enteredResolve();
  [home, wl, pp].forEach(x => x && x.enter());
})();
