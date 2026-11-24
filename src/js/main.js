/* NOVA FOR VISION · script du site
   Lenis (défilement doux) + GSAP (ScrollTrigger, SplitText). Chaque bloc ne s'active que si sa section est sur la page. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const EN = (root.lang || '').startsWith('en');
const tr = (fr, en) => (EN ? en : fr);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const DESK = () => innerWidth > 900;
const clamp = gsap.utils.clamp;
const pad = n => String(n).padStart(2, '0');
const tc = (s, fps = 25) => { s = Math.max(0, s || 0); const f = Math.floor((s % 1) * fps), t = Math.floor(s); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(f)}`; };
const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: k => { try { sessionStorage.removeItem(k); } catch (e) {} } };
const playV = v => { if (!v) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };

/* ---------- Défilement doux ---------- */
const lenis = new Lenis({ anchors: { offset: 0 }, autoRaf: false });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
window.nova = { lenis, ScrollTrigger };

/* ---------- Timecode de l'en-tête : la page se lit comme un film ---------- */
const tcEl = $('#tc');
if (tcEl) lenis.on('scroll', ({ scroll }) => { tcEl.textContent = tc(scroll / innerHeight * 4); });

/* ---------- Menu (téléphone) ---------- */
const menuBtn = $('#menu-btn'), menu = $('#menu');
if (menuBtn && menu) {
  const set = open => {
    menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.textContent = open ? tr('Fermer', 'Close') : 'Menu';
    if (open) { lenis.stop(); if (!RM) gsap.from($$('nav a', menu), { yPercent: 60, opacity: 0, stagger: .05, duration: .7, ease: 'power3.out' }); } else lenis.start();
  };
  menuBtn.addEventListener('click', () => set(menu.hidden));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { set(false); menuBtn.focus(); } });
}

/* ---------- Titres découpés dans un film : la taille suit la largeur ---------- */
const fits = $$('.cut-t[data-fit]');
function fitTitles() {
  const r = document.createRange();
  for (const el of fits) {
    const box = el.parentElement, cs = getComputedStyle(el);
    el.style.setProperty('--fs', '100px');
    r.selectNodeContents(el);
    const w = r.getBoundingClientRect().width;
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let fs = 100 * avail / Math.max(1, w) * 0.995;
    fs = Math.min(fs, innerHeight * 0.62);
    el.style.setProperty('--fs', fs.toFixed(2) + 'px');
    box.classList.add('fit');
  }
}
fitTitles();
document.fonts && document.fonts.ready.then(() => { fitTitles(); ScrollTrigger.refresh(); });

/* ---------- Vidéos : chargées à l'approche, jouées seulement à l'écran ---------- */
const startAt = v => { const s = parseFloat(v.dataset.start || 0); if (s && v.currentTime < s) { try { v.currentTime = s; } catch (e) {} } };
const loadV = v => { if (v.dataset.src && !v.getAttribute('src')) { v.preload = 'auto'; v.src = v.dataset.src; v.addEventListener('loadedmetadata', () => startAt(v), { once: true }); } };
const hoverOnly = v => FINE && v.closest('.clip-m');
const nearIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { loadV(e.target); nearIO.unobserve(e.target); } }), { rootMargin: '600px 0px' });
const playIO = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !RM && !hoverOnly(v)) { loadV(v); playV(v); v.closest('.clip-m') && v.closest('.clip-m').classList.add('playing'); }
  else if (!e.isIntersecting) v.pause();
}), { threshold: 0.15 });
$$('video[data-src]').forEach(v => { nearIO.observe(v); playIO.observe(v); v.addEventListener('ended', () => startAt(v)); v.addEventListener('seeked', () => {}); });
// boucle qui repart après le logo du film
$$('video[data-start]').forEach(v => v.addEventListener('timeupdate', () => { if (v.duration && v.currentTime > v.duration - 0.15) startAt(v); }));
if (FINE) $$('.clip-m').forEach(b => {
  const v = $('video', b);
  b.addEventListener('pointerenter', () => { loadV(v); playV(v); b.classList.add('playing'); });
  b.addEventListener('pointerleave', () => { v.pause(); b.classList.remove('playing'); });
});

/* ---------- La page s'étalonne sur le film à l'écran ---------- */
const body = document.body;
let tintNow = null;
const setTint = c => { if (c === tintNow) return; tintNow = c; body.style.setProperty('--tint', c || '#000'); };
function tintTriggers(els, extra = {}) {
  els.forEach(el => ScrollTrigger.create({
    trigger: el, start: 'top 55%', end: 'bottom 45%', ...extra,
    onToggle: self => { if (self.isActive) setTint(el.dataset.tint); else if (tintNow === el.dataset.tint) setTint(null); },
  }));
}

/* ---------- Curseur : une étiquette rectangulaire sur les films et les images ---------- */
let curLab = null;
if (FINE) {
  curLab = document.createElement('div'); curLab.className = 'cur-lab'; curLab.setAttribute('aria-hidden', 'true'); body.appendChild(curLab);
  const xTo = gsap.quickTo(curLab, 'x', { duration: .35, ease: 'power3' }), yTo = gsap.quickTo(curLab, 'y', { duration: .35, ease: 'power3' });
  addEventListener('pointermove', e => { xTo(e.clientX + 16); yTo(e.clientY + 18); }, { passive: true });
  document.addEventListener('pointerover', e => {
    const c = e.target.closest && e.target.closest('[data-cursor]');
    if (c) { curLab.textContent = c.dataset.cursor; curLab.classList.add('on'); } else curLab.classList.remove('on');
  });
}

/* ---------- Aperçu qui suit le curseur (listes) ---------- */
const peek = $('#peek');
if (peek && FINE) {
  const inner = $('.peek-in', peek);
  const img = document.createElement('img'); img.alt = '';
  const vid = document.createElement('video'); vid.muted = true; vid.loop = true; vid.playsInline = true;
  const xTo = gsap.quickTo(peek, 'x', { duration: .55, ease: 'power3' }), yTo = gsap.quickTo(peek, 'y', { duration: .55, ease: 'power3' });
  let cur = null;
  addEventListener('pointermove', e => { const w = peek.offsetWidth; const x = e.clientX + 28 + w > innerWidth ? e.clientX - w - 28 : e.clientX + 28; xTo(x); yTo(e.clientY - peek.offsetHeight / 2); }, { passive: true });
  const show = el => {
    const src = el.dataset.peek; if (cur === src) { peek.classList.add('on'); return; } cur = src;
    if (/\.mp4/.test(src)) { if (img.parentNode) img.remove(); vid.poster = el.dataset.peekP || ''; vid.src = src; inner.appendChild(vid); playV(vid); }
    else { vid.pause(); if (vid.parentNode) vid.remove(); img.src = src; inner.appendChild(img); }
    peek.classList.add('on');
    if (!RM) gsap.fromTo(inner, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .6, ease: 'power3.out' });
  };
  const hide = () => { peek.classList.remove('on'); vid.pause(); };
  $$('[data-peek]').forEach(el => {
    el.addEventListener('pointerenter', () => { show(el); if (el.dataset.tint) setTint(el.dataset.tint); });
    el.addEventListener('pointerleave', () => { hide(); if (el.dataset.tint) setTint(null); });
  });
}

/* ---------- Mur d'images qui dérive (accélère avec le défilement) ---------- */
const rows = $$('.wall-row');
if (rows.length && !RM) {
  const vis = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))));
  const R = rows.map(r => { io.observe(r); return { r, t: $('.wall-track', r), sp: parseFloat(r.dataset.speed || .5), x: 0, half: 0 }; });
  const measure = () => R.forEach(o => { o.half = o.t.scrollWidth / 2; });
  measure(); addEventListener('resize', measure);
  gsap.ticker.add((t, dt) => {
    const boost = 1 + Math.min(Math.abs(lenis.velocity || 0) * 0.12, 6);
    for (const o of R) {
      if (!vis.has(o.r) || !o.half) continue;
      o.x -= o.sp * 38 * boost * dt / 1000;
      o.x = gsap.utils.wrap(-o.half, 0, o.x);
      o.t.style.transform = `translate3d(${o.x.toFixed(2)}px,0,0)`;
    }
  });
}

/* ---------- Bandeau : deux lignes qui filent, sens et vitesse suivent le défilement ---------- */
const mqs = $$('.mq');
if (mqs.length && !RM) {
  const M = mqs.map(m => ({ m, t: $('.mq-t', m), d: parseFloat(m.dataset.mq), x: 0, half: 0, vis: false }));
  const io = new IntersectionObserver(es => es.forEach(e => { const o = M.find(o => o.m === e.target); if (o) o.vis = e.isIntersecting; }));
  M.forEach(o => io.observe(o.m));
  const measure = () => M.forEach(o => { o.half = o.t.scrollWidth / 2; });
  measure(); addEventListener('resize', measure); document.fonts && document.fonts.ready.then(measure);
  let dir = 1;
  gsap.ticker.add((t, dt) => {
    const v = lenis.velocity || 0; if (Math.abs(v) > .5) dir = Math.sign(v);
    const sp = 70 + Math.min(Math.abs(v) * 22, 900);
    for (const o of M) {
      if (!o.vis || !o.half) continue;
      o.x -= o.d * dir * sp * dt / 1000;
      o.x = gsap.utils.wrap(-o.half, 0, o.x);
      o.t.style.transform = `translate3d(${o.x.toFixed(2)}px,0,0)`;
    }
  });
}

/* ---------- Phrases qui s'allument mot après mot ---------- */
if (!RM) $$('[data-words]').forEach(el => {
  const st = new SplitText(el, { type: 'words', wordsClass: 'w' });
  gsap.fromTo(st.words, { '--o': 0.14 }, { '--o': 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: true } });
});
/* Studio : le texte monte ligne par ligne */
if (!RM) $$('[data-lines]').forEach(el => {
  SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit(self) {
    return gsap.from(self.lines, { yPercent: 105, stagger: 0.08, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
  } });
});

/* ---------- Lecteur de films (avec le son) ---------- */
const pl = $('#pl');
const openFilm = (() => {
  if (!pl) return () => {};
  const v = $('#pl-v'), seek = $('#pl-seek'), cur = $('#pl-cur'), dur = $('#pl-dur'), play = $('#pl-play'), snd = $('#pl-snd'), ig = $('#pl-ig');
  let data = null, opener = null, sound = true;
  const upd = () => { if (!data) return; const d = v.duration || data.d; cur.textContent = tc(v.currentTime, data.fps); const p = d ? v.currentTime / d : 0; seek.value = Math.round(p * 1000); seek.style.setProperty('--p0', (p * 100).toFixed(2) + '%'); };
  v.addEventListener('timeupdate', upd);
  v.addEventListener('play', () => { play.textContent = 'Pause'; });
  v.addEventListener('pause', () => { play.textContent = tr('Lecture', 'Play'); });
  v.addEventListener('ended', () => close());
  seek.addEventListener('input', () => { const d = v.duration || (data && data.d) || 0; v.currentTime = seek.value / 1000 * d; upd(); });
  play.addEventListener('click', () => (v.paused ? playV(v) : v.pause()));
  snd.addEventListener('click', () => { sound = !sound; v.muted = !sound; snd.setAttribute('aria-pressed', String(sound)); snd.textContent = sound ? tr('Son activé', 'Sound on') : tr('Son coupé', 'Sound off'); });
  const close = () => {
    if (pl.hidden) return;
    v.pause(); v.removeAttribute('src'); v.load(); pl.hidden = true; lenis.start(); data = null;
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  };
  $('#pl-x').addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (pl.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === ' ' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') { e.preventDefault(); v.paused ? playV(v) : v.pause(); }
    else if (e.key === 'Tab') { const f = $$('button,a:not([hidden]),input', pl).filter(x => !x.hidden); const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
  return (d, from) => {
    data = d; opener = from || document.activeElement;
    $('#pl-t').textContent = d.t; $('#pl-m').textContent = d.m || '';
    dur.textContent = tc(d.d, d.fps); cur.textContent = tc(0, d.fps);
    ig.hidden = !d.ig; if (d.ig) ig.href = d.ig;
    v.src = d.src; v.muted = !sound; v.currentTime = 0;
    pl.hidden = false; lenis.stop(); playV(v);
    $('#pl-x').focus({ preventScroll: true });
  };
})();
$$('[data-film]').forEach(b => b.addEventListener('click', () => { try { openFilm(JSON.parse(b.dataset.film), b); } catch (e) {} }));

/* ---------- Visionneuse des stills ---------- */
const lb = $('#lb');
if (lb) {
  const img = $('#lb-i'), cap = $('#lb-c'), num = $('#lb-n');
  let list = [], i = 0, opener = null;
  const show = k => { i = (k + list.length) % list.length; const b = list[i]; img.src = b.dataset.lb; img.alt = (b.getAttribute('aria-label') || '').replace(/^[^:]*:\s*/, ''); cap.textContent = b.dataset.lbC || ''; num.textContent = `${pad(i + 1)} / ${pad(list.length)}`; };
  const close = () => { lb.hidden = true; lenis.start(); img.removeAttribute('src'); opener && opener.focus({ preventScroll: true }); };
  $$('[data-lb]').forEach(b => b.addEventListener('click', () => {
    const g = b.closest('[data-lb-group]'); list = g ? $$('[data-lb]', g) : [b]; opener = b;
    show(list.indexOf(b)); lb.hidden = false; lenis.stop(); $('#lb-x').focus({ preventScroll: true });
  }));
  $('#lb-x').addEventListener('click', close);
  $('#lb-p').addEventListener('click', () => show(i - 1));
  $('#lb-nx').addEventListener('click', () => show(i + 1));
  img.addEventListener('click', () => show(i + 1));
  document.addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(i + 1); else if (e.key === 'ArrowLeft') show(i - 1); });
}

/* ---------- Accueil : intro, NOVA découpé dans les films, puis le film en plein écran ---------- */
const STAR = { w: 2527.4102, h: 914.6302 }, LOGO = { w: 2597.7095, h: 914.6302 };
const hero = $('#hero');
let reel = null;
if (hero) reel = initHero();

function initHero() {
  const data = JSON.parse($('#reel-data').textContent);
  const vids = $$('.hero-v', hero);
  const cap = $('#hero-cap'), capT = $('#hero-cap-t'), capB = $('#hero-cap-b'), capN = $('#hero-cap-n');
  const logo = $('#hero-logo'), box = $('#hero-box'), cutSvg = $('#hero-cut'), copy = $('.hero-copy', hero), wallEl = $('.hero-wall', hero), pin = $('.hero-pin', hero);
  let k = 0, a = 0, timer = 0, running = false, visible = true;
  const DWELL = 4200;

  // le film : deux lecteurs qui se relaient, coupe franche toutes les quatre secondes
  const prep = (v, d) => { if (v.dataset.cur === d.src) return; v.dataset.cur = d.src; v.poster = d.poster; v.src = d.src; v.preload = 'auto'; v.addEventListener('loadedmetadata', () => { try { v.currentTime = d.start || 0; } catch (e) {} }, { once: true }); };
  const label = () => { const d = data[k]; capT.textContent = d.title; capB.textContent = d.by; capN.textContent = `${pad(k + 1)} / ${pad(data.length)}`; };
  prep(vids[0], data[0]); vids[0].classList.add('on'); label();
  const cut = () => {
    const nk = (k + 1) % data.length, nv = vids[1 - a];
    prep(nv, data[nk]);
    const go = () => { try { if (nv.currentTime < (data[nk].start || 0)) nv.currentTime = data[nk].start || 0; } catch (e) {} playV(nv); nv.classList.add('on'); vids[a].classList.remove('on'); vids[a].pause(); a = 1 - a; k = nk; label(); prep(vids[1 - a], data[(k + 1) % data.length]); };
    if (nv.readyState >= 2) go(); else { let w = 0; const iv = setInterval(() => { w += 200; if (nv.readyState >= 2 || w > 2400) { clearInterval(iv); go(); } }, 200); }
  };
  const loop = () => { clearTimeout(timer); if (!running || !visible) return; timer = setTimeout(() => { cut(); loop(); }, DWELL); };
  const start = () => { if (RM || running) return; running = true; playV(vids[a]); loop(); prep(vids[1], data[1]); };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { if (running) { playV(vids[a]); loop(); } } else { vids[a].pause(); clearTimeout(timer); } }).observe(hero);
  vids.forEach((v, i) => v.addEventListener('timeupdate', () => { const d = data[i === a ? k : (k + 1) % data.length]; if (v.duration && v.currentTime > v.duration - .12) { try { v.currentTime = d.start || 0; } catch (e) {} playV(v); } }));
  $('#hero-watch').addEventListener('click', e => openFilm(data[k].film, e.currentTarget));

  // NOVA : le logo est un trou dans le noir ; au défilement on plonge dans une lettre jusqu'au plein écran
  let L = { s: 1, x: 0, y: 0, ox: 0, oy: 0, zmax: 60 };
  // le point le plus « plein » des lettres : on plonge là, l'écran se remplit de film plus vite
  const findStem = () => new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const W = 500, H = Math.round(W * LOGO.h / LOGO.w), c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H).data, on = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) on[i] = d[i * 4 + 3] > 140 ? 1 : 0;
      const L1 = new Uint16Array(W * H), R1 = new Uint16Array(W * H), U1 = new Uint16Array(W * H), D1 = new Uint16Array(W * H);
      for (let y = 0; y < H; y++) { let r = 0; for (let i = 0; i < W; i++) { const k = y * W + i; r = on[k] ? r + 1 : 0; L1[k] = r; } r = 0; for (let i = W - 1; i >= 0; i--) { const k = y * W + i; r = on[k] ? r + 1 : 0; R1[k] = r; } }
      for (let i = 0; i < W; i++) { let r = 0; for (let y = 0; y < H; y++) { const k = y * W + i; r = on[k] ? r + 1 : 0; U1[k] = r; } r = 0; for (let y = H - 1; y >= 0; y--) { const k = y * W + i; r = on[k] ? r + 1 : 0; D1[k] = r; } }
      let best = { r: 0, x: W * 0.06, y: H * 0.4 };
      for (let k = 0; k < W * H; k++) { if (!on[k]) continue; const r = Math.min(L1[k], R1[k], U1[k], D1[k]); if (r > best.r || (r === best.r && (k % W) < best.x)) best = { r, x: k % W, y: (k / W) | 0 }; }
      res({ ox: best.x / W * LOGO.w, oy: best.y / H * LOGO.h, sw: Math.max(2, best.r) * 2 / W });
    };
    im.onerror = () => res({ ox: LOGO.w * 0.05, oy: LOGO.h * 0.35, sw: 0.03 });
    im.src = '/assets/nova-white.svg';
  });
  const layout = () => {
    const r = box.getBoundingClientRect(), pr = pin.getBoundingClientRect();
    L.s = r.width / LOGO.w; L.x = r.left - pr.left; L.y = r.top - pr.top;
    L.zmax = Math.hypot(innerWidth, innerHeight) * 1.15 / Math.max(4, L.sw * r.width);
  };
  const draw = z => {
    const px = L.x + L.ox * L.s, py = L.y + L.oy * L.s;
    logo.setAttribute('transform', `translate(${px.toFixed(2)} ${py.toFixed(2)}) scale(${(L.s * z).toFixed(5)}) translate(${(-L.ox).toFixed(2)} ${(-L.oy).toFixed(2)})`);
  };
  findStem().then(o => { Object.assign(L, o); layout(); draw(1); ScrollTrigger.refresh(); });
  layout(); draw(1);
  addEventListener('resize', () => { layout(); draw(curZ); });
  let curZ = 1;
  if (!RM) {
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        const p = self.progress;
        const zp = clamp(0, 1, p / 0.6);
        curZ = 1 + (L.zmax - 1) * Math.pow(zp, 3.2);
        draw(curZ);
        cutSvg.style.opacity = zp >= 0.98 ? 0 : 1;
        const f = clamp(0, 1, p / 0.16);
        copy.style.opacity = 1 - f; copy.style.transform = `translate3d(0,${(f * 60).toFixed(1)}px,0)`;
        wallEl.style.opacity = 1 - f; wallEl.style.transform = `translate3d(0,${(f * 140).toFixed(1)}px,0)`;
        const cf = clamp(0, 1, (p - 0.62) / 0.08);
        cap.style.opacity = cf; cap.style.visibility = cf > 0 ? 'visible' : 'hidden';
        vids.forEach(v => { v.style.transform = `scale(${(1.12 - 0.12 * zp).toFixed(4)})`; });
      },
    });
  } else { hero.style.height = 'auto'; pin.style.position = 'relative'; cap.hidden = true; }
  return { start };
}

/* ---------- Intro : la poussière se rassemble en étoile, puis l'étoile s'ouvre sur le film ---------- */
const intro = $('#intro');
function endIntro() { root.classList.remove('intro-run'); if (intro) intro.hidden = true; store.set('nova-intro', '1'); reel && reel.start(); }
if (intro && root.classList.contains('intro-run') && !RM) runIntro();
else { if (intro) { root.classList.remove('intro-run'); intro.hidden = true; } store.set('nova-intro', '1'); reel && reel.start(); }

function runIntro() {
  root.classList.remove('veil-in');
  lenis.stop();
  const hole = $('#intro-hole'), cv = $('#intro-c'), ix = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  const base = Math.min(innerWidth * 0.62, 780) / STAR.w;
  const cx = innerWidth / 2, cy = innerHeight / 2;
  const place = (sc, rot) => hole.setAttribute('transform', `translate(${cx} ${cy}) rotate(${rot}) scale(${sc}) translate(${-STAR.w / 2} ${-STAR.h / 2})`);
  const P = []; let ready = false, t0 = null, done = false, opened = false;
  let sfx = null, decided = true, gate = false, gateT = 0, fromGate = false, enterBtn = null, gateSet = false;
  try { sfx = new Audio(); sfx.preload = 'auto'; sfx.src = '/media/sfx/nova-intro.mp3?v=3'; } catch (e) { sfx = null; }
  if (sfx) {
    decided = false;
    let pr = null; try { pr = sfx.play(); } catch (e) {}
    if (pr && pr.then) pr.then(() => { decided = true; }, () => { if (!decided) openGate(); }); else decided = true;
    setTimeout(() => { if (!gate) decided = true; }, 1500);
  }
  function openGate() {
    if (done || gate) return; gate = true; gateT = performance.now();
    intro.removeAttribute('aria-hidden');
    enterBtn = document.createElement('button'); enterBtn.type = 'button'; enterBtn.className = 'i-enter'; enterBtn.textContent = tr('Entrer avec le son', 'Enter with sound');
    intro.appendChild(enterBtn); requestAnimationFrame(() => requestAnimationFrame(() => enterBtn && enterBtn.classList.add('on'))); enterBtn.focus({ preventScroll: true });
  }
  function closeGate() { if (enterBtn) { const b = enterBtn; enterBtn = null; b.classList.remove('on'); setTimeout(() => b.remove(), 600); } intro.setAttribute('aria-hidden', 'true'); }
  function enter() { if (!gate || done) return; gate = false; fromGate = true; decided = true; try { sfx.currentTime = 0; const p = sfx.play(); p && p.catch(() => {}); } catch (e) {} for (const p of P) if (p.g && p.gx !== undefined) { p.sx = p.gx; p.sy = p.gy; } t0 = null; closeGate(); }
  function spread() { gateSet = true; const W = cv.width, H = cv.height, M = Math.max(W, H), clear = 110 * dpr; for (const p of P) { p.g = Math.random() < .42; if (!p.g) continue; const an = Math.random() * Math.PI * 2, r = Math.max(clear, (.05 + .55 * Math.sqrt(Math.random())) * M); p.sx = W / 2 + Math.cos(an) * r; p.sy = H / 2 + Math.sin(an) * r * .62; } }
  const im = new Image();
  im.onload = () => {
    const w = Math.round(STAR.w * base * dpr), h = Math.round(STAR.h * base * dpr);
    const oc = document.createElement('canvas'); oc.width = w; oc.height = h; const ox = oc.getContext('2d', { willReadFrequently: true }); ox.drawImage(im, 0, 0, w, h);
    let d; try { d = ox.getImageData(0, 0, w, h).data; } catch (e) { skip(); return; }
    const step = Math.max(2, Math.round((innerWidth < 600 ? 2.2 : 2.6) * dpr));
    const x0 = cv.width / 2 - w / 2, y0 = cv.height / 2 - h / 2;
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      if (d[(y * w + x) * 4 + 3] < 120) continue;
      const tx = x0 + x + (Math.random() - .5) * step, ty = y0 + y + (Math.random() - .5) * step;
      const an = Math.random() * Math.PI * 2, rad = (.35 + Math.random() * .75) * Math.max(cv.width, cv.height);
      const sx = cv.width / 2 + Math.cos(an) * rad, sy = cv.height / 2 + Math.sin(an) * rad * .6;
      P.push({ sx, sy, tx, ty, d: 120 + Math.random() * 520, du: 950 + Math.random() * 450, sw: (Math.random() - .5) * .9, s: (.7 + Math.random() * 1.1) * dpr, a: .45 + Math.random() * .55, ox: tx - cv.width / 2, oy: ty - cv.height / 2 });
    }
    ready = true;
  };
  im.src = '/assets/nova-star.svg';
  const eio = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), ein = t => t * t * t * t;
  function step(now) {
    if (done) return;
    if (!ready || (!decided && !gate)) { requestAnimationFrame(step); return; }
    const W = cv.width, H = cv.height;
    if (gate) {
      if (!gateSet) spread();
      ix.clearRect(0, 0, W, H); ix.fillStyle = '#fff';
      const k = clamp(0, 1, (now - gateT) / 900);
      for (const p of P) { if (!p.g) continue; p.gx = p.sx + Math.sin(now * .00023 + p.sw * 7) * 14 * dpr; p.gy = p.sy + Math.cos(now * .00019 + p.d) * 10 * dpr; ix.globalAlpha = p.a * .3 * k; ix.fillRect(p.gx, p.gy, p.s, p.s); }
      ix.globalAlpha = 1; requestAnimationFrame(step); return;
    }
    if (t0 === null) t0 = now;
    const t = now - t0;
    ix.clearRect(0, 0, W, H);
    const o = clamp(0, 1, (t - 2150) / 950), oe = ein(o);
    if (t >= 2150) { place(base * (1 + oe * 48), -oe * 90); if (!opened) { opened = true; reel && reel.start(); } }
    const sweep = (t - 1550) / 600;
    ix.fillStyle = '#fff';
    for (const p of P) {
      const e = eio(clamp(0, 1, (t - p.d) / p.du));
      const an = (1 - e) * p.sw * 2.2, cs = Math.cos(an), sn = Math.sin(an);
      const fx = p.sx + (p.tx - p.sx) * e, fy = p.sy + (p.ty - p.sy) * e;
      let x = W / 2 + (fx - W / 2) * cs - (fy - H / 2) * sn, y = H / 2 + (fx - W / 2) * sn + (fy - H / 2) * cs;
      let al = p.a * (fromGate && p.g ? .3 + .7 * clamp(0, 1, t / 300) : clamp(0, 1, t / 300)), sz = p.s;
      if (sweep > 0 && sweep < 1.2) { const bx = (sweep - .1) * W, dd = Math.abs(x - bx); if (dd < W * .06) { const kk = 1 - dd / (W * .06); al = Math.min(1, al + kk * .6); sz = p.s * (1 + kk * .8); } }
      if (o > 0) { if (o > .42) continue; const f = 1 + oe * 48, th = -oe * Math.PI / 2, c2 = Math.cos(th), s2 = Math.sin(th); x = W / 2 + (p.ox * c2 - p.oy * s2) * f; y = H / 2 + (p.ox * s2 + p.oy * c2) * f; al *= 1 - o / .42; }
      ix.globalAlpha = al; ix.fillRect(x, y, sz, sz);
    }
    ix.globalAlpha = 1;
    if (t >= 2950 && !intro.classList.contains('fade')) intro.classList.add('fade');
    if (t >= 3300) { done = true; lenis.start(); endIntro(); return; }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  function skip() { if (done) return; done = true; decided = true; if (gate) { gate = false; closeGate(); } intro.classList.add('fade'); lenis.start(); setTimeout(endIntro, 360); }
  intro.addEventListener('click', () => (gate ? enter() : skip()));
  addEventListener('keydown', e => { if (done) return; if (gate) { if (e.key === 'Escape') skip(); else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } } else if (e.key !== 'Tab') skip(); });
  addEventListener('wheel', () => { if (!gate) skip(); }, { once: true, passive: true });
  addEventListener('touchstart', () => { if (!gate) skip(); }, { passive: true, once: true });
  setTimeout(() => { if (!ready) skip(); }, 2500);
}

/* ---------- Projets à la une : la bobine défile de côté ---------- */
const bob = $('#bobine');
if (bob) {
  const track = $('.bob-track', bob), panels = $$('.bob-p', bob);
  const mm = gsap.matchMedia();
  mm.add({ d: '(min-width: 901px) and (prefers-reduced-motion: no-preference)', m: '(max-width: 900px), (prefers-reduced-motion: reduce)' }, ctx => {
    if (ctx.conditions.d) {
      const dist = () => track.scrollWidth - innerWidth;
      let on = false;
      const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: bob, start: 'top top', end: () => '+=' + dist(), pin: true, pinSpacing: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
        onToggle: s => { on = s.isActive; if (!on) setTint(null); else setTint(panels[0].dataset.tint); } } });
      panels.forEach(p => ScrollTrigger.create({ trigger: p, containerAnimation: tw, start: 'left 60%', end: 'right 40%', onToggle: s => { if (s.isActive && on) setTint(p.dataset.tint); } }));
    } else tintTriggers(panels);
  });
}

/* ---------- Pages intérieures : chapitres étalonnés ---------- */
tintTriggers($$('.cp[data-tint], .clip[data-tint]'));

/* ---------- Projets : les stills glissent de côté pendant qu'on descend ---------- */
if (!RM) gsap.matchMedia().add('(min-width: 761px)', () => {
  $$('.strip').forEach(s => {
    const t = $('.strip-t', s);
    gsap.fromTo(t, { x: () => innerWidth * 0.08 }, { x: () => -(t.scrollWidth - innerWidth * 0.92), ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
});

/* ---------- Avant / après : le film se parcourt à la souris ---------- */
const baBox = $('#ba-box');
if (baBox) {
  const v = $('#ba-v'), tl = $('#ba-tl'), head = $('#ba-head'), range = $('#ba-r'), state = $('#ba-state');
  const DUR = parseFloat(tl.dataset.dur), CH = JSON.parse(tl.dataset.ch), btns = $$('#ba-ch button');
  let scrub = false, want = null;
  const after = t => CH.some(([a, b, e]) => t >= b && t < e);
  const chapter = t => Math.max(0, CH.findIndex(([a, b, e]) => t >= a && t < e));
  const draw = () => {
    const t = want != null ? want : v.currentTime;
    head.style.transform = `translate3d(${(t / DUR * tl.clientWidth).toFixed(1)}px,0,0)`;
    range.value = Math.round(t / DUR * 1000);
    const st = after(t) ? tr('Après', 'After') : tr('Avant', 'Before'); if (state.textContent !== st) state.textContent = st;
    const c = chapter(t); btns.forEach((b, i) => b.classList.toggle('on', i === c));
    if (want != null && v.readyState >= 1 && !v.seeking) { v.currentTime = want; want = null; }
  };
  let vis = false;
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis && !scrub && !RM) playV(v); else if (!vis) v.pause(); }).observe(baBox);
  gsap.ticker.add(() => { if (vis) draw(); });
  const seekTo = t => { want = clamp(0, DUR - .04, t); };
  const fromX = e => clamp(0, 1, (e.clientX - baBox.getBoundingClientRect().left) / baBox.clientWidth);
  baBox.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) { if (!scrub) { scrub = true; v.pause(); } seekTo(fromX(e) * DUR); } });
  baBox.addEventListener('pointerdown', e => { scrub = true; v.pause(); seekTo(fromX(e) * DUR); });
  baBox.addEventListener('pointerleave', () => { scrub = false; if (!RM) playV(v); });
  range.addEventListener('input', () => { v.pause(); seekTo(range.value / 1000 * DUR); });
  btns.forEach((b, i) => b.addEventListener('click', () => { seekTo(CH[i][0]); if (!RM) setTimeout(() => playV(v), 60); }));
  if (!FINE) $('.ba-hint') && ($('.ba-hint').textContent = tr('Faites glisser sur l’image ou sur la ligne', 'Drag across the image or the line'));
}

/* ---------- Générique : les noms défilent comme la fin d'un film ---------- */
const cr = $('.cr');
if (cr) gsap.matchMedia().add({ d: '(min-width: 761px) and (prefers-reduced-motion: no-preference)', m: '(max-width: 760px), (prefers-reduced-motion: reduce)' }, ctx => {
  if (!ctx.conditions.d) { cr.classList.add('no-pin'); return () => cr.classList.remove('no-pin'); }
  const pinEl = $('.cr-pin', cr), roll = $('.cr-roll', cr);
  gsap.fromTo(roll, { y: () => innerHeight * 0.85 }, { y: () => -(roll.offsetHeight - innerHeight * 0.2), ease: 'none', scrollTrigger: { trigger: pinEl, start: 'top top', end: () => '+=' + (roll.offsetHeight + innerHeight * 0.4), pin: true, scrub: true, invalidateOnRefresh: true } });
});

/* ---------- Services : les prestations s'empilent ---------- */
const stk = $$('.stk-p');
if (stk.length && !RM) gsap.matchMedia().add('(min-width: 761px)', () => {
  stk.slice(0, -1).forEach(p => {
    gsap.to($('.stk-in', p), { scale: 0.9, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: p, start: 'top top', end: '+=100%', scrub: true } });
  });
});

/* ---------- Déroulé : une timeline de montage, la tête de lecture suit le défilement ---------- */
const tlS = $('#deroule');
if (tlS) gsap.matchMedia().add({ d: '(min-width: 901px) and (prefers-reduced-motion: no-preference)' }, ctx => {
  if (!ctx.conditions.d) return;
  tlS.classList.add('pinned');
  const steps = $$('.tl-step', tlS), imgs = $$('.tl-img img', tlS), clips = $$('.tl-clip', tlS), headEl = $('#tl-head'), ed = $('#tl-ed'), N = steps.length;
  let cur = -1;
  const setStep = i => { if (i === cur) return; cur = i; steps.forEach((s, j) => s.classList.toggle('on', j === i)); imgs.forEach((s, j) => s.classList.toggle('on', j === i)); clips.forEach(c => c.classList.toggle('on', +c.dataset.i === i)); };
  setStep(0);
  const st = ScrollTrigger.create({
    trigger: tlS, start: 'top top', end: 'bottom bottom',
    onUpdate: self => { const lane = ed.clientWidth - 110 - parseFloat(getComputedStyle(ed).paddingLeft) - parseFloat(getComputedStyle(ed).paddingRight); headEl.style.transform = `translate3d(${(self.progress * lane).toFixed(1)}px,0,0)`; setStep(Math.min(N - 1, Math.floor(self.progress * N))); },
  });
  clips.forEach(c => c.addEventListener('click', () => { const i = +c.dataset.i; lenis.scrollTo(st.start + (st.end - st.start) * (i + .5) / N); }));
  ScrollTrigger.refresh();
  return () => { tlS.classList.remove('pinned'); steps.forEach(s => s.classList.add('on')); };
});

/* ---------- Studio : une traînée d'images derrière le curseur ---------- */
const mt = $('[data-trail]');
if (mt && FINE && !RM) {
  const srcs = JSON.parse(mt.dataset.trail); srcs.forEach(s => { const i = new Image(); i.src = s; });
  const layer = document.createElement('div'); layer.className = 'trail'; layer.setAttribute('aria-hidden', 'true'); body.appendChild(layer);
  let last = null, n = 0;
  mt.addEventListener('pointermove', e => {
    if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 110) return;
    last = { x: e.clientX, y: e.clientY };
    const img = document.createElement('img'); img.src = srcs[n++ % srcs.length]; img.alt = ''; layer.appendChild(img);
    const w = img.offsetWidth || 180, h = w * 1.25;
    gsap.set(img, { x: e.clientX - w / 2, y: e.clientY - h / 2, scale: .55, rotate: gsap.utils.random(-6, 6), zIndex: n });
    gsap.timeline({ onComplete: () => img.remove() })
      .to(img, { scale: 1, duration: .5, ease: 'power3.out' })
      .to(img, { opacity: 0, y: '+=40', scale: .92, duration: .7, ease: 'power2.in' }, .55);
  });
  mt.addEventListener('pointerleave', () => { last = null; });
}

/* ---------- Contact : la phrase compose le message ; l'image se précise à mesure qu'on écrit ---------- */
const form = $('#ct-f');
if (form) {
  const f = { name: $('#f-name'), what: $('#f-what'), when: $('#f-when'), idea: $('#f-idea') }, img = $('#ct-img');
  const sharpen = () => { const n = Object.values(f).filter(x => x.value.trim()).length; img.style.setProperty('--blur', ((4 - n) * 6) + 'px'); img.style.setProperty('--sat', (0.35 + n * 0.1625).toFixed(2)); };
  Object.values(f).forEach(x => x.addEventListener('input', sharpen)); sharpen();
  // les champs s'élargissent avec le texte
  const grow = () => { f.name.size = Math.max(10, f.name.value.length + 1); }; f.name.addEventListener('input', grow);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = f.name.value.trim(), what = f.what.value, when = f.when.value, idea = f.idea.value.trim();
    const subj = EN ? `Project${what ? ': ' + what : ''}${name ? ', ' + name : ''}` : `Projet${what ? ' : ' + what : ''}${name ? ', ' + name : ''}`;
    const bodyTxt = EN
      ? `Hello NOVA,\n\nMy name is ${name || '…'}, I'm preparing ${what || 'a project'} for ${when || 'a date to set'}.\n\nThe idea: ${idea || '…'}\n\n`
      : `Bonjour NOVA,\n\nJe m’appelle ${name || '…'}, je prépare ${what || 'un projet'} pour ${when || 'une date à fixer'}.\n\nL’idée : ${idea || '…'}\n\n`;
    location.href = `mailto:${form.dataset.mail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(bodyTxt)}`;
  });
}
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); const t = b.textContent; b.textContent = b.dataset.done; setTimeout(() => (b.textContent = t), 2000); } catch (e) {} }));

/* ---------- Passage d'une page à l'autre : l'étoile se referme, puis s'ouvre ---------- */
const veil = $('#veil'), vHole = $('#veil-hole');
const vBase = () => Math.min(innerWidth * 0.62, 780) / STAR.w;
const vPlace = (sc, rot) => vHole && vHole.setAttribute('transform', `translate(${innerWidth / 2} ${innerHeight / 2}) rotate(${rot}) scale(${sc}) translate(${-STAR.w / 2} ${-STAR.h / 2})`);
function openVeil() {
  if (!veil) return;
  store.del('nova-veil');
  if (!root.classList.contains('veil-in')) return;
  veil.classList.add('on'); root.classList.remove('veil-in');
  const o = { k: 0 };
  vPlace(0, 0);
  gsap.to(o, { k: 1, duration: RM ? .01 : 1, ease: 'power3.in', delay: .05, onUpdate: () => vPlace(vBase() * (0.02 + o.k * 49), -90 * (1 - o.k)), onComplete: () => veil.classList.remove('on') });
}
openVeil();
addEventListener('pageshow', e => { if (e.persisted && veil) { veil.classList.remove('on'); root.classList.remove('veil-in'); } });
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.protocol.indexOf('http') !== 0) return;
  if (url.pathname === location.pathname && url.hash) return;
  if (/\.(mp4|jpg|png|svg|pdf)$/i.test(url.pathname)) return;
  e.preventDefault();
  store.set('nova-veil', '1');
  if (RM || !veil) { location.href = url.href; return; }
  veil.classList.add('on');
  const o = { k: 1 };
  vPlace(vBase() * 49, 0);
  gsap.to(o, { k: 0, duration: .55, ease: 'power3.in', onUpdate: () => vPlace(vBase() * (0.0 + o.k * 49), 60 * (1 - o.k)), onComplete: () => { location.href = url.href; } });
  setTimeout(() => { location.href = url.href; }, 1200);
});

/* ---------- Mise en place finale ---------- */
addEventListener('load', () => {
  fitTitles(); ScrollTrigger.refresh();
  if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) setTimeout(() => lenis.scrollTo(t, { immediate: true }), 60); }
});
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { fitTitles(); ScrollTrigger.refresh(); }, 150); });
