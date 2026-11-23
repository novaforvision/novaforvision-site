/* NOVA FOR VISION · script commun aux cinq pages (NOVA, Projets, Services, Studio, Contact).
   Chaque bloc ne s'active que si sa section est présente sur la page. Pas de dépendance, pas d'étape de build. */
(() => {
  'use strict';
  // langue de la page : <html lang="en"> sur /en/, sinon français
  const IS_EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  const lng = (fr, en) => (IS_EN ? en : fr);
  const MAIL = 'contact@novaforvision.com';
  const FPS = 25;
  const P = {
    oakley:{title:'OAKLEY × META',artist:'Spec ad',roles:lng('Création IA · VFX · Montage · Sound design · Motion design','AI creation · VFX · Editing · Sound design · Motion design'),dur:28.75,fps:24,ig:null,full:'/media/oakley/film.mp4'},
    ndrangetha:{title:'NDRANGETHA',artist:'Thabiti',roles:lng('Montage · VFX · IA · SFX','Editing · VFX · AI · SFX'),dur:35.0,ig:'https://www.instagram.com/reel/Dcyn_7qtQiD/',dir:'Lyra Film'},
    killcam:{title:'KILLCAM',artist:'King Kifla',roles:lng('Montage · VFX','Editing · VFX'),dur:29.8,ig:'https://www.instagram.com/reel/DaQpBznNIB9/',dir:'Lyra Film'},
    crame:{title:'CRAMÉ',artist:'RR',roles:lng('Montage · VFX · IA · SFX','Editing · VFX · AI · SFX'),dur:38.08,ig:null,dir:'Lyra Film'},
    back:{title:'BACK',artist:'LP2.0',roles:lng('Montage · VFX','Editing · VFX'),dur:22.95,ig:'https://www.instagram.com/reel/DWozdhSj1l3/',dir:'Lyra Film'},
    demandeashh:{title:'DEMANDEASHH',artist:'Sheu',roles:lng('Teaser IA','AI teaser'),dur:33.28,ig:'https://www.instagram.com/reel/DaArXcHsMV4/',dir:'NOVA'},
    jamaiquaine:{title:'JAMAÏQUAINE IS DEAD',artist:'LP Killer',roles:'VFX',dur:33.686,ig:'https://www.instagram.com/reel/DTZaV9mDPdE/',dir:'Lyra Film'},
    beymen:{title:'BEYMEN HOME & DECOR',artist:lng('Campagne','Campaign'),roles:lng('Création IA · Blocking 3D · Montage · Motion design du logo','AI creation · 3D blocking · Editing · Logo motion design'),dur:27.75,fps:24,ig:null,full:'/media/beymen/film.mp4'},
    loewe:{title:'LOEWE',artist:'Spec ad',roles:lng('Création IA · Stills et film','AI creation · Stills and film'),dur:5.05,fps:24,ig:null,full:'/media/loewe/film.mp4?v=2'},
    bellodallas:{title:'ZORO',artist:'Bello & Dallas',roles:'VFX',dur:13.44,ig:null,dir:'Kespey'}
  };
  const fullSrc = id => P[id].full || `/media/full/${id}.mp4`;

  const $ = s => document.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const pad = n => String(n).padStart(2,'0');
  const tc = (s, fps = FPS) => { s = Math.max(0,s||0); const f = Math.floor((s%1)*fps); const t = Math.floor(s); return `${pad(Math.floor(t/3600))}:${pad(Math.floor(t/60)%60)}:${pad(t%60)}:${pad(f)}`; };
  const root = document.documentElement;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const desk = matchMedia('(min-width:761px)');
  // le réglage « Réduire les animations » du téléphone n'éteint plus le site : le studio veut le même site pour tous
  const reduce = false;
  const playV = v => { if (v) { const p = v.play(); if (p && p.catch) p.catch(e => { if (e && e.name === 'NotAllowedError') v._blocked = true; }); } };
  // hauteur de la bande, relue seulement quand la fenêtre change de taille (la lire à chaque image forçait un recalcul des styles)
  let BAND = 56;
  const readBand = () => { BAND = parseFloat(getComputedStyle(root).getPropertyValue('--band')) || 56; };
  readBand();
  const bandH = () => BAND;
  const fgCol = getComputedStyle(root).getPropertyValue('--fg').trim() || '#eeefed';

  /* ---------- Performance : lire d'abord, écrire ensuite ----------
     La boucle d'animation lit toutes ses mesures au début de chaque image (défilement, taille de la fenêtre, positions),
     puis écrit. Avant, lectures et écritures alternaient : le navigateur recalculait la page plusieurs fois par image. */
  const F = { sy: 0, sx: 0, vw: 0, vh: 0, docH: 0 };
  const snapF = () => { F.sy = window.scrollY; F.sx = window.scrollX; F.vw = window.innerWidth; F.vh = window.innerHeight; };
  const readDoc = () => { F.docH = document.documentElement.scrollHeight; };
  snapF();
  // n'écrit une propriété de style que si sa valeur change (variables CSS comprises)
  const setS = (el, prop, val) => { const c = el._st || (el._st = {}); if (c[prop] === val) return; c[prop] = val; if (prop.charCodeAt(0) === 45) el.style.setProperty(prop, val); else el.style[prop] = val; };
  const clrS = (el, prop) => { if (el._st) delete el._st[prop]; };
  // canevas hors écran dont on relit les pixels : le navigateur le garde en mémoire classique, la relecture est plus rapide
  const ctxRead = c => c.getContext('2d', { willReadFrequently: true });
  const dec = s => { try { return decodeURIComponent(s); } catch(e) { return s; } };

  /* ---------- Mouvement ---------- */
  // la pause des animations ne vaut que pour la visite en cours (l'ancien réglage gardé d'une visite à l'autre est effacé)
  try { localStorage.removeItem('nova-motion'); } catch(e){}
  const sessStore = { get(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { sessionStorage.setItem(k,v); } catch(e){} } };
  const saved = sessStore.get('nova-motion');
  let motion = saved ? saved === 'on' : !reduce;
  const motionBtn = $('#motion');

  /* ---------- État partagé : chaque section le remplit si elle est sur la page ---------- */
  const player = { ctx:null, video:null, id:null, restore:null, opener:null, onClose:null };
  let soundOn = true, seeking = false;
  let openPlayer = () => {}, closePlayer = () => {}, togglePlay = () => {};
  const LOGO_END = 1.92;
  let heroVisible = false, heroTop = 0, heroStep = 1, N = 0, cur0 = 0, SV = [], SID = [], oakV = null;
  let heroFrame = null, layoutHero = null, setCurrent = null, onIntroOpen = null, heroClickable = () => false;
  let CF = [], tr = null, trVisible = false, trTick = null;
  let ba = null, baVisible = false, baTick = null;
  let items = [], active = -1, worksVisible = false, layoutWorks = null, applyWorks = null, playPreview = null, openWork = null, scrollToItem = null;
  let hidePeek = () => {}, drawPeek = null, drawLit = null, layoutCredits = null, drawCredits = null;
  let routeTo = null, tabsInit = null;
  let measureWorks = null, measurePeek = null, measureCredits = null, measureMt = null, sbTick = null;
  let lbOpen = false, lbPop = null;
  // hauteur de la page : relue quand le contenu change de taille, plus à chaque image
  readDoc();
  { const docRO = new ResizeObserver(readDoc); docRO.observe(document.body); docRO.observe(root); }

  /* ---------- Blocs proches de l'écran : on ne mesure (et on ne charge) rien de ce qui est loin ---------- */
  const nearMap = new WeakMap(), isNear = el => nearMap.get(el) === true;
  const nearIO = new IntersectionObserver(es => es.forEach(en => nearMap.set(en.target, en.isIntersecting)), {rootMargin:'300px 0px'});
  const lazyIO = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; const v = en.target; if (v.dataset.poster) { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); } if (v.dataset.preload) { v.preload = v.dataset.preload; v.removeAttribute('data-preload'); } lazyIO.unobserve(v); }), {rootMargin:'1400px 0px'});
  $$('video[data-poster],video[data-preload]').forEach(v => { if (!v.closest('#stage')) lazyIO.observe(v); });
  // vidéos différées : on les met en mémoire quand le réseau est libre ou quand on s'en approche
  const warmV = v => { if (v && v.dataset.poster) { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); } if (!v || v.preload === 'auto') return; v.preload = 'auto'; if (v.readyState === 0 && v.paused) { try { v.load(); } catch(e){} } };
  // préchargement en tâche de fond seulement sur ordinateur avec une bonne connexion ; sur mobile, les vidéos se chargent quand on commence à défiler
  const fastNet = (() => { const c = navigator.connection; return !(c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || ''))); })();

  /* ---------- Titres découpés lettre par lettre ---------- */
  $$('.split').forEach(h => {
    h.setAttribute('aria-label', h.textContent.trim());
    const words = h.textContent.trim().split(/\s+/); h.textContent = ''; let k = 0;
    words.forEach((w,i) => {
      const m = document.createElement('span'); m.className = 'wm'; m.setAttribute('aria-hidden','true');
      const sp = document.createElement('span'); sp.className = 'w';
      [...w].forEach(c => { const ch = document.createElement('span'); ch.className = 'ch'; ch.textContent = c; ch.style.transitionDelay = (k++*24) + 'ms'; sp.appendChild(ch); });
      m.appendChild(sp); h.appendChild(m); if (i < words.length-1) { h.appendChild(document.createTextNode(' ')); k += 2; }
    });
  });

  /* ---------- Intro (accueil) : la poussière se rassemble en étoile, s'illumine, puis ouvre l'écran ---------- */
  const intro = $('#intro');
  let introOn = !!intro && root.classList.contains('intro-run'), introCurOK = false;
  // l'intro n'accueille que la première arrivée sur l'accueil : venir d'une autre page du site ne la rejoue pas
  if (!intro) { try { sessionStorage.setItem('nova-intro','1'); } catch(e){} }
  function endIntro(){ if (!introOn) return; introOn = false; introCurOK = true; root.classList.remove('intro-gate'); intro.hidden = true; try { sessionStorage.setItem('nova-intro','1'); } catch(e){} if (setCurrent) setCurrent(0); }
  if (introOn) {
    const hole = $('#ihole'), draw = $('#idraw'), icv = $('#icv'), ix = icv.getContext('2d');
    draw.style.display = 'none';
    const SW = 2527.41, SH = 914.63;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    icv.width = Math.round(innerWidth*dpr); icv.height = Math.round(innerHeight*dpr);
    const base = Math.min(innerWidth*.62, 780) / SW;
    const cxs = innerWidth/2, cys = innerHeight/2;
    const place = (el, sc, rot) => el.setAttribute('transform', `translate(${cxs} ${cys}) rotate(${rot}) scale(${sc}) translate(${-SW/2} ${-SH/2})`);
    const P2 = []; let ready = false, t0 = null, done = false, opened = false;
    // le son de l'intro : la poussière de la vidéo de présentation NOVA, puis sa petite note au fond quand l'étoile s'ouvre,
    // très bas et noyés dans la réverb. On essaie de le lancer tout de suite ; si le navigateur le bloque (cas courant sur ordinateur),
    // l'intro attend un clic sur « Entrer » : la poussière flotte, puis se rassemble avec le son au clic.
    let sfx = null, decided = true, gate = false, gateT = 0, fromGate = false, enterBtn = null;
    if (motion) {
      try { sfx = new Audio(); sfx.preload = 'auto'; sfx.src = '/media/sfx/nova-intro.mp3?v=3'; } catch(e){ sfx = null; }
      if (sfx) {
        decided = false;
        let pr = null; try { pr = sfx.play(); } catch(e){}
        if (pr && pr.then) pr.then(() => { decided = true; }, () => { if (!decided) openGate(); });
        else decided = true;
        // son lent à charger : l'intro part quand même, le son la rejoint
        setTimeout(() => { if (!gate) decided = true; }, 1500);
      }
    }
    function openGate(){
      if (done || gate) return;
      gate = true; gateT = performance.now();
      intro.classList.add('gate'); root.classList.add('intro-gate'); intro.removeAttribute('aria-hidden');
      enterBtn = document.createElement('button'); enterBtn.type = 'button'; enterBtn.className = 'i-enter'; enterBtn.textContent = lng('Entrer', 'Enter');
      intro.appendChild(enterBtn);
      requestAnimationFrame(() => requestAnimationFrame(() => enterBtn && enterBtn.classList.add('on')));
    }
    // une partie de la poussière flotte déjà à l'écran (en laissant le mot lisible) ; le reste arrivera du bord au clic
    let gateSet = false;
    function spreadDust(){
      gateSet = true;
      const W = icv.width, H = icv.height, M = Math.max(W, H), clear = 110*dpr;
      for (const p of P2) {
        p.g = Math.random() < .42;
        if (!p.g) continue;
        const ang = Math.random()*Math.PI*2, r = Math.max(clear, (.05 + .55*Math.sqrt(Math.random())) * M);
        p.sx = W/2 + Math.cos(ang)*r; p.sy = H/2 + Math.sin(ang)*r*.62;
      }
    }
    function closeGate(){
      intro.classList.remove('gate'); root.classList.remove('intro-gate');
      if (enterBtn) { const b = enterBtn; enterBtn = null; b.classList.remove('on'); b.blur(); setTimeout(() => b.remove(), 700); }
      intro.setAttribute('aria-hidden', 'true');
    }
    function enter(){
      if (!gate || done) return;
      gate = false; fromGate = true; decided = true;
      try { sfx.currentTime = 0; const pr = sfx.play(); if (pr) pr.catch(() => {}); } catch(e){}
      for (const p of P2) if (p.g && p.gx !== undefined) { p.sx = p.gx; p.sy = p.gy; }
      t0 = null; closeGate();
    }
    const img = new Image();
    img.onload = () => {
      const w = Math.round(SW*base*dpr), h = Math.round(SH*base*dpr);
      const oc = document.createElement('canvas'); oc.width = w; oc.height = h; const ox = ctxRead(oc); ox.drawImage(img, 0, 0, w, h);
      let data; try { data = ox.getImageData(0,0,w,h).data; } catch(e) { skip(); return; }
      const step = Math.max(2, Math.round((innerWidth < 600 ? 2.2 : 2.6)*dpr));
      const ox0 = icv.width/2 - w/2, oy0 = icv.height/2 - h/2;
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
        if (data[(y*w + x)*4 + 3] < 120) continue;
        const tx = ox0 + x + (Math.random()-.5)*step, ty = oy0 + y + (Math.random()-.5)*step;
        const ang = Math.random()*Math.PI*2, rad = (.35 + Math.random()*.75) * Math.max(icv.width, icv.height);
        const sx = icv.width/2 + Math.cos(ang)*rad, sy = icv.height/2 + Math.sin(ang)*rad*.6;
        P2.push({ sx, sy, tx, ty, x:sx, y:sy, d: 120 + Math.random()*520, du: 950 + Math.random()*450, sw: (Math.random()-.5)*.9, s: (.7 + Math.random()*1.1)*dpr, a: .45 + Math.random()*.55, ox: (tx - icv.width/2), oy: (ty - icv.height/2) });
      }
      ready = true;
    };
    img.src = '/assets/nova-star.svg';
    const eio = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2, ein = t => t*t*t*t;
    function stepI(now){
      if (done) return;
      if (!ready || (!decided && !gate)) { requestAnimationFrame(stepI); return; }
      const W = icv.width, H = icv.height;
      if (gate) {
        // en attendant le clic : la poussière flotte doucement, à faible intensité
        if (!gateSet) spreadDust();
        ix.clearRect(0,0,W,H); ix.fillStyle = '#ffffff';
        const k = clamp((now - gateT)/900, 0, 1), amp = reduce ? 0 : dpr;
        for (const p of P2) {
          if (!p.g) continue;
          p.gx = p.sx + Math.sin(now*.00023 + p.sw*7) * 14*amp; p.gy = p.sy + Math.cos(now*.00019 + p.d) * 10*amp;
          ix.globalAlpha = p.a * .3 * k; ix.fillRect(p.gx, p.gy, p.s, p.s);
        }
        ix.globalAlpha = 1; requestAnimationFrame(stepI); return;
      }
      if (t0 === null) t0 = now;
      const t = now - t0;
      if (t >= 2250 && !introCurOK) { introCurOK = true; if (setCurrent) setCurrent(0); }
      ix.clearRect(0,0,W,H);
      // l'ouverture : l'étoile devient une fenêtre qui tourne et grandit
      const o = clamp((t - 2150)/950, 0, 1), oe = ein(o);
      if (t >= 2150) { place(hole, base*(1 + oe*48), -oe*90); if (!opened) { opened = true; try { if (onIntroOpen) onIntroOpen(); } catch(e){} } }
      const sweep = (t - 1550)/600;              // balayage de lumière de gauche à droite
      ix.fillStyle = '#ffffff';
      for (const p of P2) {
        const e = eio(clamp((t - p.d)/p.du, 0, 1));
        // trajectoire en légère spirale vers sa place dans l'étoile
        const ang = (1 - e) * p.sw * 2.2, cs = Math.cos(ang), sn = Math.sin(ang);
        const fx = p.sx + (p.tx - p.sx)*e, fy = p.sy + (p.ty - p.sy)*e;
        const rx = W/2 + (fx - W/2)*cs - (fy - H/2)*sn, ry = H/2 + (fx - W/2)*sn + (fy - H/2)*cs;
        let x = rx, y = ry, a = p.a * (fromGate && p.g ? .3 + .7*clamp(t/300, 0, 1) : clamp(t/300, 0, 1)), sz = p.s;
        if (sweep > 0 && sweep < 1.2) { const bx = (sweep - .1) * W, d = Math.abs(x - bx); if (d < W*.06) { const k = 1 - d/(W*.06); a = Math.min(1, a + k*.6); sz = p.s*(1 + k*.8); } }
        if (o > 0) { if (o > .42) continue; const f = 1 + oe*48, th = -oe*Math.PI/2, c2 = Math.cos(th), s2 = Math.sin(th); x = W/2 + (p.ox*c2 - p.oy*s2)*f; y = H/2 + (p.ox*s2 + p.oy*c2)*f; a *= 1 - o/.42; }
        ix.globalAlpha = a; ix.fillRect(x, y, sz, sz);
      }
      ix.globalAlpha = 1;
      if (t >= 2950 && !intro.classList.contains('fade')) intro.classList.add('fade');
      if (t >= 3300) { done = true; endIntro(); return; }
      requestAnimationFrame(stepI);
    }
    requestAnimationFrame(stepI);
    function skip(){ if (!introOn || done) return; done = true; decided = true; if (gate) { gate = false; closeGate(); } intro.classList.add('fade'); setTimeout(endIntro, 360); }
    // un clic ou une touche : « Entrer » si l'intro attend, sinon on passe l'intro ; faire défiler passe l'intro (sans le son)
    intro.addEventListener('click', () => { if (gate) enter(); else skip(); });
    window.addEventListener('keydown', e => { if (done) return; if (gate) { if (e.key === 'Escape') skip(); else if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key !== 'Tab') { e.preventDefault(); enter(); } } else skip(); });
    window.addEventListener('wheel', skip, {once:true, passive:true});
    window.addEventListener('touchstart', () => { if (!gate) skip(); }, {passive:true});
    window.addEventListener('scroll', () => { if (gate && window.scrollY > 30) skip(); }, {passive:true});
    setTimeout(() => { if (!ready) skip(); }, 2500);
  } else if (intro) intro.hidden = true;

  /* ---------- Curseur étoile ---------- */
  const curS = $('#cur-star'), curL = $('#cur-l'), curT = $('#cur-t');
  const cur = { x:-100, y:-100, sx:-100, sy:-100, lx:-100, ly:-100, rot:0, vx:0 };
  window.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; cur.vx = e.clientX - cur.x; cur.x = e.clientX; cur.y = e.clientY; }, {passive:true});
  // d'une page à l'autre, l'étoile reprend là où était la souris (sinon elle reste invisible jusqu'au premier mouvement)
  try { const s = JSON.parse(sessionStorage.getItem('nova-cur') || 'null'); if (s && fine.matches && Date.now() - s.t < 8000) { cur.x = cur.sx = cur.lx = s.x; cur.y = cur.sy = cur.ly = s.y; } } catch(e){}
  const saveCur = () => { try { if (cur.x > -50) sessionStorage.setItem('nova-cur', JSON.stringify({ x: cur.x, y: cur.y, t: Date.now() })); } catch(e){} };
  window.addEventListener('pagehide', saveCur);
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('a[href]')) saveCur(); }, true);
  let curTarget = null;
  document.addEventListener('pointerover', e => { curTarget = e.target; updateCursor(); });
  function updateCursor(){
    if (!curS || !fine.matches || !curTarget || !curTarget.closest) return;
    const e = { target: curTarget };
    const inter = e.target.closest('a,button:not(.work-media),input,[data-peek],[data-peek-imgs]');
    const c = inter ? null : e.target.closest('[data-cursor]');
    let label = c && !(c.closest('.playing,.open')) ? c.dataset.cursor : null;
    if (c && c.id === 'hero' && !heroClickable()) label = null;
    if (label) {
      if (curT.textContent !== label) curT.textContent = label;
      curL.classList.add('on');
      if (!curS.classList.contains('play')) { curS.classList.remove('out','link'); void curS.offsetWidth; curS.classList.add('play'); }
      return;
    }
    curL.classList.remove('on');
    if (curS.classList.contains('play')) { curS.classList.remove('play'); curS.classList.add('out'); clearTimeout(curS._t); curS._t = setTimeout(() => curS.classList.remove('out'), 420); }
    curS.classList.toggle('link', !!inter);
  }
  document.addEventListener('pointerleave', () => { cur.x = cur.y = -100; curTarget = null; });
  function drawCursor(){
    if (!curS || !fine.matches) return;
    if ((cur.n = (cur.n || 0) + 1) % 6 === 0) updateCursor();
    cur.sx = lerp(cur.sx, cur.x, .35); cur.sy = lerp(cur.sy, cur.y, .35);
    cur.lx = lerp(cur.lx, cur.x, .18); cur.ly = lerp(cur.ly, cur.y, .18);
    cur.rot = lerp(cur.rot, clamp(cur.vx*1.2, -30, 30), .12); cur.vxs = lerp(cur.vxs || 0, Math.abs(cur.vx), .2); cur.vx *= .85;
    const st = 1 + Math.min(cur.vxs/45, .9);
    setS(curS, 'transform', `translate3d(${cur.sx.toFixed(1)}px,${cur.sy.toFixed(1)}px,0) rotate(${cur.rot.toFixed(1)}deg) scale(${st.toFixed(3)},${(1/Math.sqrt(st)).toFixed(3)})`);
    setS(curL, 'transform', `translate3d(${cur.lx.toFixed(1)}px,${cur.ly.toFixed(1)}px,0)`);
  }

  /* ---------- Lecteur intégré (accueil, projets) ---------- */
  const pc = $('#pc'), seek = $('#pc-seek'), pcCur = $('#pc-cur');
  if (pc) {
    openPlayer = (ctx, video, id, slot, onClose) => {
      if (player.ctx) closePlayer(true);
      const d = P[id];
      player.ctx = ctx; player.video = video; player.id = id; player.onClose = onClose || null; player.opener = document.activeElement;
      player.restore = { src: video.getAttribute('src') || '', time: video.currentTime || 0, muted: video.muted, loop: video.loop };
      $('#pc-title').textContent = d.title; $('#pc-meta').textContent = `${d.artist} · ${d.roles}${d.dir ? lng(' · Réalisation ', ' · Directed by ') + d.dir : ''}`;
      $('#pc-dur').textContent = tc(d.dur, d.fps); pcCur.textContent = tc(0, d.fps);
      const ig = $('#pc-ig'); ig.hidden = !d.ig; if (d.ig) ig.href = d.ig;
      const full = fullSrc(id);
      if (!video.getAttribute('src') || !video.src.endsWith(full)) video.src = full;
      video.loop = false; video.muted = !soundOn; video.currentTime = 0;
      playV(video);
      slot.appendChild(pc); pc.hidden = false;
      $('#pc-play').textContent = 'Pause';
      $('#pc-close').focus({preventScroll:true});
    };
    closePlayer = silent => {
      if (!player.ctx) return;
      const v = player.video, r = player.restore;
      v.pause();
      if (r.src && !v.src.endsWith(r.src)) v.src = r.src; else if (!r.src) { v.removeAttribute('src'); v.load(); }
      v.muted = r.muted; v.loop = r.loop;
      try { v.currentTime = (v === oakV && r.time < LOGO_END + .1) ? LOGO_END + .1 : r.time; } catch(e){}
      pc.hidden = true; document.body.appendChild(pc);
      const cb = player.onClose; const op = player.opener;
      player.ctx = null; player.video = null; player.id = null;
      if (cb) cb();
      if (!silent && op && op.focus && document.contains(op)) op.focus({preventScroll:true});
    };
    togglePlay = () => { const v = player.video; if (!v) return; if (v.paused) playV(v); else v.pause(); };
    $('#pc-close').addEventListener('click', e => { e.stopPropagation(); closePlayer(); });
    $('#pc-play').addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
    $('#pc-sound').addEventListener('click', e => { e.stopPropagation(); soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', String(soundOn)); e.currentTarget.textContent = soundOn ? lng('Son activé', 'Sound on') : lng('Son coupé', 'Sound off'); if (player.video) player.video.muted = !soundOn; });
    ['play','pause','ended'].forEach(ev => document.addEventListener(ev, e => {
      if (e.target !== player.video) return;
      if (ev === 'ended') { closePlayer(); return; }
      $('#pc-play').textContent = ev === 'play' ? 'Pause' : lng('Lecture', 'Play');
    }, true));
    seek.addEventListener('input', () => { seeking = true; const v = player.video; if (!v) return; const d = v.duration || P[player.id].dur; v.currentTime = seek.value/1000*d; setS(seek, '--p', (seek.value/10)+'%'); });
    seek.addEventListener('change', () => { seeking = false; });
    pc.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('keydown', e => {
      if (!player.ctx) return;
      if (e.key === 'Escape') { e.preventDefault(); closePlayer(); }
      else if (e.key === ' ' && pc.contains(e.target) && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') { e.preventDefault(); togglePlay(); }
    });
  }

  /* ---------- Accueil : les projets phares, qui se succèdent seuls ---------- */
  const heroWrap = $('#top'), hero = $('#hero');
  if (hero && heroWrap) {
    const seam = $('#seam');
    const slides = $$('#stage .slide'), shades = slides.map(s => s.querySelector('.shade'));
    SV = slides.map(s => s.querySelector('video')); SID = slides.map(s => s.dataset.id);
    const caps = $$('#caps .cap'), ticks = $$('#ticks .tick');
    N = slides.length; heroVisible = true;
    // Les projets se succèdent seuls, comme une bande démo : un passage à la fois, toujours joué en entier.
    // (Avant, le passage suivait le défilement : en défilant vite, plusieurs rideaux s'enchaînaient sur des films pas encore chargés,
    // et la page se recalait seule à l'arrêt.) from : le projet affiché ; to : celui qui arrive (-1 hors passage).
    const TR = 1050, DWELL = 6500;
    let from = 0, to = -1, tr0 = 0, dwell = 0, lastT = 0, heroHover = false, pending = -1;
    // Oakley : le titre attend que le logo de la vidéo ait disparu, puis la boucle repart après le logo (il ne revient plus)
    oakV = SV[SID.indexOf('oakley')] || null;
    let logoDone = !oakV, holdT0 = performance.now();
    // le titre attend tant que la vidéo peut encore montrer le logo ; il s'affiche quand même si la vidéo ne peut pas jouer
    const logoHold = () => !logoDone && motion && oakV && !oakV._blocked && !oakV.error && performance.now() - holdT0 < 15000;
    // l'étoile de l'intro s'ouvre sur le logo de la campagne
    onIntroOpen = () => { if (!oakV || !motion || oakV.readyState < 2) return; try { oakV.currentTime = 0; } catch(e){} logoDone = false; holdT0 = performance.now(); playV(oakV); };
    const oakLoopOwn = () => !(player.ctx && player.video === oakV);
    if (oakV) {
      oakV.loop = false;
      oakV.addEventListener('timeupdate', () => { if (oakV.currentTime >= LOGO_END + .08) logoDone = true; });
      oakV.addEventListener('error', () => { logoDone = true; });
      oakV.addEventListener('ended', () => { if (!oakLoopOwn()) return; oakV.currentTime = LOGO_END; playV(oakV); });
    }
    // autres films avec un logo au début (data-logo = fin du logo, en secondes ; LOEWE) : le film repart du logo quand on arrive dessus,
    // le titre attend que le logo soit parti, puis la boucle repart après le logo
    const LG = slides.map((s,i) => i > 0 && s.dataset.logo ? { v: SV[i], end: parseFloat(s.dataset.logo) || 0, done: false, t0: performance.now() } : null);
    const lgHold = i => { const L = LG[i]; return !!L && !L.done && motion && !L.v._blocked && !L.v.error && performance.now() - L.t0 < 8000; };
    const lgOwn = L => !(player.ctx && player.video === L.v);
    LG.forEach(L => {
      if (!L) return;
      L.v.loop = false;
      L.v.addEventListener('timeupdate', () => { if (L.v.currentTime >= L.end + .05) L.done = true; });
      L.v.addEventListener('error', () => { L.done = true; });
      L.v.addEventListener('ended', () => { if (!lgOwn(L)) return; L.v.currentTime = L.end; playV(L.v); });
    });
    setCurrent = i => {
      if (i === cur0 && caps[i].classList.contains('on')) return;
      if (introOn && i === 0 && !introCurOK) return;
      cur0 = i;
      caps.forEach((c,k) => { c.classList.toggle('on', k === i && !(k === 0 && logoHold()) && !lgHold(k)); c.setAttribute('aria-hidden', String(k !== i)); c.toggleAttribute('inert', k !== i); });
      slides.forEach((s,k) => s.classList.toggle('cur', k === i));
      $('#hcount').textContent = `${pad(i+1)} / ${pad(N)}`;
      ticks.forEach((t,k) => t.setAttribute('aria-current', String(k === i)));
    };
    if (!introOn) setCurrent(0);
    // taille de l'image du haut : relue quand elle change, plus à chaque image
    let HW = hero.clientWidth, HH = hero.clientHeight;
    const readHero = () => { HW = hero.clientWidth; HH = hero.clientHeight; };
    new ResizeObserver(readHero).observe(hero);
    layoutHero = () => {
      heroStep = 0;   // plus de piste de défilement : le haut de page fait un écran
      heroTop = heroWrap.getBoundingClientRect().top + window.scrollY;
      readHero();
    };
    const go = i => {
      i = ((i % N) + N) % N;
      if (introOn) return;
      // un passage est en cours : la demande est gardée et jouée juste après
      if (to >= 0) { pending = i === to ? -1 : i; return; }
      if (i === from) return;
      if (player.ctx === 'hero') closePlayer(true);
      to = i; tr0 = performance.now(); dwell = 0;
      warmV(SV[i]);
    };
    // un tiret mène à son projet ; flèches gauche et droite au clavier ; glissé horizontal au doigt
    ticks.forEach((t,k) => t.addEventListener('click', e => { e.stopPropagation(); go(k); }));
    window.addEventListener('keydown', e => {
      if ((e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!heroVisible || player.ctx || window.scrollY > HH*.5) return;
      const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      go((to >= 0 ? to : from) + (e.key === 'ArrowRight' ? 1 : -1));
    });
    let swX = 0, swY = 0, swT = 0;
    hero.addEventListener('touchstart', e => { const p = e.touches[0]; swX = p.clientX; swY = p.clientY; swT = performance.now(); }, {passive:true});
    hero.addEventListener('touchend', e => {
      const p = e.changedTouches[0], dx = p.clientX - swX, dy = p.clientY - swY;
      if (player.ctx || performance.now() - swT > 800 || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)*1.6) return;
      go((to >= 0 ? to : from) + (dx < 0 ? 1 : -1));
    }, {passive:true});
    // le compte à rebours attend tant que la souris est sur les boutons du projet ou sur la barre du bas
    hero.addEventListener('pointerover', e => { heroHover = e.pointerType === 'mouse' && !!e.target.closest('.cap-a,.hbar'); });
    hero.addEventListener('pointerleave', () => { heroHover = false; });
    heroClickable = () => !player.ctx && !introOn && to < 0;
    hero.addEventListener('click', e => { if (!heroClickable() || e.target.closest('a,.hbar,.pc,.cap-a')) return; openHero(); });
    $$('#caps [data-play]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openHero(); }));
    hero.setAttribute('data-cursor', lng('Lire', 'Play'));
    $('#hhint').textContent = fine.matches ? lng('Flèches ← → pour changer de projet', 'Use ← → to change project') : lng('Glissez pour changer de projet', 'Swipe to change project');
    function openHero(){
      if (player.ctx === 'hero') return;
      hero.classList.add('playing');
      openPlayer('hero', SV[cur0], SID[cur0], $('#pslot-hero'), () => { hero.classList.remove('playing','fill'); });
      fitHero();
    }
    // film en lecture : image entière, sauf si les bandes noires seraient très fines (on remplit alors l'écran)
    function fitHero(){
      if (player.ctx !== 'hero') return;
      const v = player.video, vr = (v.videoWidth && v.videoHeight) ? v.videoWidth/v.videoHeight : 16/9;
      const W = hero.clientWidth, H = hero.clientHeight;
      const bar = W/H > vr ? (W - H*vr)/2 : (H - W/vr)/2;
      hero.classList.toggle('fill', bar < 48);
    }
    SV.forEach(v => v.addEventListener('loadedmetadata', fitHero));
    window.addEventListener('resize', fitHero);
    const easeIO = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
    // le bord du rideau lâche une fine poussière de lumière pendant le passage
    const hdc = $('#hdust'), hdx = hdc.getContext('2d'), hp = [];
    let hdLastX = null, hdIdle = 0, hdAcc = 0;
    // le canevas vide est masqué : une couche transparente de la taille de l'écran ne coûte plus rien entre deux passages
    setS(hdc, 'visibility', 'hidden');
    function heroDust(xc, sl, seamO, bend = 0){
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W = Math.round(HW*dpr), H = Math.round(HH*dpr);
      if (hdc.width !== W || hdc.height !== H) { hdc.width = W; hdc.height = H; }
      const x = xc*dpr, moved = hdLastX === null ? 0 : Math.abs(x - hdLastX);
      if (motion && seamO > .05 && moved > .5) {
        hdAcc += Math.min(4, moved*.05);
        for (; hdAcc >= 1 && hp.length < 140; hdAcc--) { const y = Math.random()*H, u = y/H; hp.push({ x: x + sl*dpr*(.5 - u) + 4*u*(1-u)*bend*dpr + (Math.random()-.5)*3*dpr, y, vx: (x < (hdLastX ?? x) ? -1 : 1)*(.3 + Math.random()*1.1)*dpr, vy: (Math.random()-.5)*.4*dpr, life: 1, dec: .016 + Math.random()*.022, s: (.6 + Math.random()*.9)*dpr }); }
      }
      hdLastX = x;
      if (!hp.length) { if (!hdIdle) { hdx.clearRect(0,0,W,H); hdIdle = 1; setS(hdc, 'visibility', 'hidden'); } return; }
      hdIdle = 0; setS(hdc, 'visibility', 'visible');
      hdx.clearRect(0,0,W,H); hdx.fillStyle = '#ffffff';
      for (let i = hp.length - 1; i >= 0; i--) { const p = hp[i]; p.x += p.vx; p.y += p.vy; p.vx *= .97; p.life -= p.dec; if (p.life <= 0) { hp.splice(i,1); continue; } hdx.globalAlpha = p.life*.5; hdx.fillRect(p.x, p.y, p.s, p.s); }
      hdx.globalAlpha = 1;
    }
    const SLANT_DEG = 35.2, SLANT = Math.tan(SLANT_DEG*Math.PI/180);   // angle de la branche oblique de l'étoile NOVA
    // courbure du rideau : le milieu de la ligne oblique traîne un peu derrière ses deux bouts quand on fait défiler,
    // puis se redresse ; la ligne est tracée en SVG (elle peut se courber), l'élément #seam ne porte plus que l'étoile
    const SVGN = 'http://www.w3.org/2000/svg';
    const seamC = document.createElementNS(SVGN, 'svg'); seamC.setAttribute('class', 'seam-c'); seamC.setAttribute('aria-hidden', 'true');
    const seamP = document.createElementNS(SVGN, 'path'); seamC.appendChild(seamP); seam.after(seamC); seam.classList.add('curved');
    let bend = 0;
    const vfx = new WeakMap();
    const setV = (el, key, css) => { if (vfx.get(el) === key) return; vfx.set(el, key); el.style.cssText = css; };
    const tickI = ticks.map(t => t.querySelector('i'));
    const seamScale = (1/Math.cos(SLANT_DEG*Math.PI/180)).toFixed(3);
    let seamD = '';
    heroFrame = now => {
      const dt = lastT ? Math.min(100, now - lastT) : 0; lastT = now;
      const SL = HH*SLANT;
      let t = 0, e = 0, seamX = 0, seamO = 0;
      if (to >= 0) {
        t = motion ? clamp((now - tr0)/TR, 0, 1) : 1; e = easeIO(t);
        // le titre change à mi-passage
        if (t >= .5 && cur0 !== to) setCurrent(to);
      }
      // rideau : le projet suivant se découvre de droite à gauche derrière une ligne oblique (l'angle de l'étoile NOVA),
      // son film arrive en léger travelling ; le précédent recule dans l'ombre. Le milieu de la ligne traîne un peu, puis se redresse.
      bend = motion && to >= 0 ? Math.sin(Math.PI*t)*HW*.03 : 0;
      const b2 = (2*bend).toFixed(1), xc = (HW + SL/2) - e*(HW + SL);
      slides.forEach((sl,i) => {
        const v = SV[i];
        if (i === to) {
          setV(sl, 'i'+e.toFixed(4)+'_'+HW+'_'+HH+'_'+b2, 'z-index:2;' + (e >= .9999 ? 'clip-path:inset(0 0 0 0)' : e <= 0 ? `clip-path:polygon(${(xc + SL/2).toFixed(1)}px 0,100% 0,100% 100%,${(xc - SL/2).toFixed(1)}px 100%)` : `clip-path:path('M ${(xc + SL/2).toFixed(1)} 0 L ${HW} 0 L ${HW} ${HH} L ${(xc - SL/2).toFixed(1)} ${HH} Q ${(xc + 2*bend).toFixed(1)} ${(HH/2).toFixed(1)} ${(xc + SL/2).toFixed(1)} 0 Z')`));
          // la vidéo glisse un peu mais couvre toujours tout l'écran : l'échelle compense le décalage
          const tx = (1-e)*10, sc = 1 + tx/50 + (1-e)*.044;
          setV(v, 'v'+tx.toFixed(2)+sc.toFixed(3), e >= 1 ? '' : `transform:translate3d(${tx.toFixed(2)}%,0,0) scale(${sc.toFixed(3)})`);
          setV(shades[i], 's0', 'opacity:0');
        } else if (i === from) {
          setV(sl, 'f', 'z-index:1;clip-path:inset(0 0 0 0)');
          const tx = -e*8, sc = 1 + Math.abs(tx)/50;
          setV(v, 'v'+tx.toFixed(2)+sc.toFixed(3), e <= 0 ? '' : `transform:translate3d(${tx.toFixed(2)}%,0,0) scale(${sc.toFixed(3)})`);
          setV(shades[i], 's'+e.toFixed(3), `opacity:${(e*.55).toFixed(3)}`);
        } else setV(sl, 'h', 'visibility:hidden');
      });
      if (to >= 0 && t > 0 && t < 1) { seamX = xc; seamO = Math.sin(Math.PI*t); }
      setS(seam, 'transform', `translate3d(${(seamX + bend).toFixed(1)}px,0,0) rotate(${SLANT_DEG}deg) scaleY(${seamScale})`);
      setS(seam, 'opacity', seamO.toFixed(3));
      setS(seamC, 'opacity', seamO.toFixed(3));
      if (seamO > 0) { const d = `M ${(seamX + SL/2).toFixed(1)} 0 Q ${(seamX + 2*bend).toFixed(1)} ${(HH/2).toFixed(1)} ${(seamX - SL/2).toFixed(1)} ${HH}`; if (d !== seamD) { seamD = d; seamP.setAttribute('d', d); } }
      heroDust(seamX, SL, seamO, bend);
      // fin du passage : le projet arrivé devient le projet affiché
      if (to >= 0 && t >= 1) { if (cur0 !== to) setCurrent(to); from = to; to = -1; dwell = 0; if (pending >= 0) { const q = pending; pending = -1; go(q); } }
      // boucle Oakley sans le logo
      if (oakV && oakLoopOwn() && oakV.duration && !oakV.paused && oakV.currentTime > oakV.duration - .09) oakV.currentTime = LOGO_END;
      if (cur0 === 0 && !introOn && caps[0].getAttribute('aria-hidden') === 'false' && !caps[0].classList.contains('on') && !logoHold()) caps[0].classList.add('on');
      LG.forEach((L,i) => {
        if (!L || !lgOwn(L)) return;
        if (L.v.duration && !L.v.paused && L.v.currentTime > L.v.duration - .09) L.v.currentTime = L.end;
        if (i === cur0 && caps[i].getAttribute('aria-hidden') === 'false' && !caps[i].classList.contains('on') && !lgHold(i)) caps[i].classList.add('on');
      });
      // compte à rebours du projet affiché : il démarre quand son titre est là, et attend pendant un film en lecture,
      // un survol des boutons ou l'intro. Sans mouvement ou sur une connexion lente, rien n'avance seul.
      const auto = motion && fastNet;
      if (auto && to < 0 && !player.ctx && !heroHover && !introOn && caps[from].classList.contains('on')) dwell += dt;
      const nx = (from + 1) % N;
      if (auto && dwell > 1200) warmV(SV[nx]);
      // le film suivant doit pouvoir s'afficher : sinon on l'attend, 4 s au plus
      if (auto && to < 0 && dwell >= DWELL && (SV[nx].readyState >= 2 || dwell >= DWELL + 4000)) go(nx);
      // tirets : les projets passés sont pleins, celui affiché se remplit le temps qu'il reste à l'écran
      const fill = to >= 0 ? (cur0 === from ? 1 : 0) : auto ? clamp(dwell/DWELL, 0, 1) : 1;
      tickI.forEach((ti,i) => setS(ti, 'transform', `scaleX(${(i < cur0 ? 1 : i === cur0 ? fill : 0).toFixed(3)})`));
      // seuls les films visibles jouent
      SV.forEach((v,i) => {
        if (player.ctx === 'hero' && i === cur0) return;
        const vis = i === from || i === to;
        const want = heroVisible && motion && vis, L = LG[i];
        // film à logo sorti de l'écran : il reprendra au logo la prochaine fois
        if (L && !vis && heroVisible && lgOwn(L) && (L.v.currentTime > 0 || L.done)) { if (!v.paused) v.pause(); try { v.currentTime = 0; } catch(e){} L.done = false; }
        if (want && v.paused) { if (L && v.currentTime < L.end) L.t0 = performance.now(); playV(v); } else if (!want && !v.paused) v.pause();
      });
    };
    new IntersectionObserver(es => es.forEach(en => { heroVisible = en.isIntersecting; if (!heroVisible) { if (player.ctx === 'hero') closePlayer(true); SV.forEach(v => { if (!v.paused) v.pause(); }); } }), {threshold:0}).observe(heroWrap);
    window.addEventListener('load', () => { [SV[1], SV[2]].forEach(v => { if (v && v.dataset.poster) { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); } }); });
  }

  /* ---------- Campagnes (projets) : films en grand (Oakley × Meta, Beymen) ---------- */
  // chaque .camp-film porte data-id (clé de P) ; son, timecode et bouton « Lire avec le son » sont cherchés dans sa section
  CF = $$('.camp-film').map(film => {
    const v = film.querySelector('video'), id = film.dataset.id;
    if (!v || !P[id]) return null;
    const sec = film.closest('.camp') || film.parentNode, snd = film.querySelector('.camp-snd'), slot = sec.querySelector('.pslot'), btn = sec.querySelector('.camp-play');
    const c = { film, v, id, ctx: 'camp-' + id, fps: P[id].fps || FPS, vis: false, tcEl: film.querySelector('.camp-tc'), last: '' };
    new IntersectionObserver(es => es.forEach(en => {
      c.vis = en.isIntersecting && en.intersectionRatio > .25;
      if (player.ctx === c.ctx) { if (!en.isIntersecting) closePlayer(true); return; }
      if (c.vis && motion) playV(v); else if (!c.vis) v.pause();
    }), {threshold:[0,.25,.6]}).observe(film);
    if (snd) snd.addEventListener('click', e => {
      e.stopPropagation();
      const on = snd.getAttribute('aria-pressed') !== 'true';
      snd.setAttribute('aria-pressed', String(on)); snd.textContent = on ? lng('Son coupé', 'Sound off') : lng('Son', 'Sound');
      v.muted = !on; if (on) playV(v);
    });
    const open = () => { if (player.ctx === c.ctx) return; film.classList.add('playing'); openPlayer(c.ctx, v, id, slot, () => { film.classList.remove('playing'); if (motion && c.vis) playV(v); }); };
    if (btn) btn.addEventListener('click', () => {
      const r = film.getBoundingClientRect(), top = bandH() + 8;
      if (r.top < top - 1 || r.bottom > window.innerHeight) window.scrollTo({top: r.top + window.scrollY - top, behavior: motion ? 'smooth' : 'auto'});
      open();
    });
    film.addEventListener('click', () => { if (player.ctx === c.ctx) { togglePlay(); return; } open(); });
    return c;
  }).filter(Boolean);
  // transition couleur → noir et blanc, parcourue à la souris
  tr = $('#tr');
  if (tr) {
    const wipe = $('#wipe'), trTl = $('#tr-tl'), trHead = $('#tr-head'), trRange = $('#tr-range'), trState = $('#tr-state');
    const TR_DUR = 2.4, TR_CUT = .86;
    let trHover = false, trWant = null, trLast = '';
    const trSeek = t => { trWant = clamp(t, 0, TR_DUR - .04); };
    let trW = trTl.clientWidth;
    new ResizeObserver(() => { trW = trTl.clientWidth; }).observe(trTl);
    trTick = () => {
      if (trWant !== null && !tr.seeking && tr.readyState >= 1) { tr.currentTime = trWant; trWant = null; }
      const t = tr.currentTime || 0, k = t >= TR_CUT ? lng('Noir et blanc', 'Black and white') : lng('Couleur', 'Colour');
      if (k !== trLast) { trLast = k; trState.textContent = k; }
      setS(trHead, 'transform', `translate3d(${(t/TR_DUR*trW).toFixed(1)}px,0,0)`);
      const rv = Math.round(t/TR_DUR*1000);
      if (document.activeElement !== trRange && +trRange.value !== rv) trRange.value = rv;
    };
    wipe.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; trHover = true; tr.pause(); });
    wipe.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) { if (!trHover) { trHover = true; tr.pause(); } const r = wipe.getBoundingClientRect(); trSeek(clamp((e.clientX - r.left)/r.width, 0, 1)*TR_DUR); } });
    wipe.addEventListener('pointerdown', e => { trHover = true; tr.pause(); const r = wipe.getBoundingClientRect(); trSeek(clamp((e.clientX - r.left)/r.width, 0, 1)*TR_DUR); });
    const trResume = () => { trHover = false; if (motion && trVisible) { tr.playbackRate = .5; playV(tr); } };
    wipe.addEventListener('pointerleave', trResume);
    wipe.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') trResume(); });
    trRange.addEventListener('input', () => { tr.pause(); trSeek(trRange.value/1000*TR_DUR); });
    new IntersectionObserver(es => es.forEach(en => { trVisible = en.isIntersecting; if (trVisible && motion && !trHover) { tr.playbackRate = .5; playV(tr); } else if (!trVisible) tr.pause(); }), {threshold:.2}).observe(wipe);
    if (!fine.matches) $('#wipe-hint').textContent = lng('Glissez sur l’image pour parcourir la transition', 'Drag across the image to scrub through the transition');
    new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) warmV(tr); }), {rootMargin:'900px 0px'}).observe(wipe);
  }
  const motionClip = $('#oak-motion');
  if (motionClip) new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && motion) playV(motionClip); else motionClip.pause(); }), {threshold:.3}).observe(motionClip);

  /* ---------- Avant / Après (projets, clips) ---------- */
  ba = $('#ba');
  if (ba) {
    const baBox = $('#ba-box'), baTl = $('#ba-tl'), baHead = $('#ba-head'), baRange = $('#ba-range'), baState = $('#ba-state');
    const BA_DUR = 11.12;
    const BA = [[0,2.2,4.04],[4.04,4.68,5.96],[5.96,7.2,8.96],[8.96,9.72,11.12]];
    const chBtns = $$('#ba-ch button');
    BA.forEach(([s0,s1,s2]) => { [[s0,s1,''],[s1,s2,' a']].forEach(([x,y,c]) => { const el = document.createElement('span'); el.className = 'seg' + c; el.style.left = (x/BA_DUR*100) + '%'; el.style.width = `calc(${((y-x)/BA_DUR*100).toFixed(3)}% - 2px)`; baTl.insertBefore(el, baHead); }); });
    let baHover = false, baWanted = null, baSeeking = false, baSeekAt = 0, baLastKey = '';
    const baSeek = t => { baWanted = clamp(t, 0, BA_DUR - .04); };
    let baW = baTl.clientWidth;
    new ResizeObserver(() => { baW = baTl.clientWidth; }).observe(baTl);
    baTick = () => {
      if (baSeeking && performance.now() - baSeekAt > 300) baSeeking = false;
      if (baWanted !== null && !baSeeking && ba.readyState >= 1) { baSeeking = true; baSeekAt = performance.now(); ba.currentTime = baWanted; baWanted = null; }
      const t = ba.currentTime || 0;
      let ci = 0, after = false;
      BA.forEach(([s0,s1],i) => { if (t >= s0 - .001) { ci = i; after = t >= s1; } });
      const key = ci + (after ? 'a' : 'b');
      if (key !== baLastKey) { baLastKey = key; baState.textContent = after ? lng('Après', 'After') : lng('Avant', 'Before'); chBtns.forEach((b,i) => { b.setAttribute('aria-current', String(i === ci)); b.querySelector('.st').textContent = i === ci ? (after ? lng('Après', 'After') : lng('Avant', 'Before')) : ''; }); }
      setS(baHead, 'transform', `translate3d(${(t/BA_DUR*baW).toFixed(1)}px,0,0)`);
      const rv = Math.round(t/BA_DUR*1000);
      if (document.activeElement !== baRange && +baRange.value !== rv) baRange.value = rv;
    };
    ba.addEventListener('seeked', () => { baSeeking = false; });
    const fromX = (e, el) => { const r = el.getBoundingClientRect(); return clamp((e.clientX - r.left)/r.width, 0, 1); };
    baBox.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; baHover = true; ba.pause(); });
    baBox.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) { if (!baHover) { baHover = true; ba.pause(); } baSeek(fromX(e, baBox)*BA_DUR); } });
    baBox.addEventListener('pointerdown', e => { baHover = true; ba.pause(); baSeek(fromX(e, baBox)*BA_DUR); });
    const baResume = () => { baHover = false; if (motion && baVisible) playV(ba); };
    baBox.addEventListener('pointerleave', baResume);
    baBox.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') baResume(); });
    baRange.addEventListener('input', () => { ba.pause(); baSeek(baRange.value/1000*BA_DUR); });
    baRange.addEventListener('change', () => { if (motion) playV(ba); });
    chBtns.forEach((b,i) => b.addEventListener('click', () => { baSeek(BA[i][0]); if (motion) playV(ba); }));
    if (!fine.matches) $('#ba-hint').textContent = lng('Glissez sur l’image pour parcourir le film', 'Drag across the image to scrub through the film');
    new IntersectionObserver(es => es.forEach(en => { baVisible = en.isIntersecting; if (baVisible && motion && !baHover) playV(ba); else if (!baVisible) ba.pause(); }), {threshold:.2}).observe(baBox);
  }

  /* ---------- Clips : la bobine (projets) ---------- */
  const works = $('#bobine'), track = $('#track');
  if (works && track) {
    items = $$('#track .work');
    let horiz = false, centers = [], pitch = 1, stepPx = 1, pShown = 0, pPrev = 0, wVel = 0;
    items.forEach(el => el.querySelector('.work-media').setAttribute('data-cursor', lng('Lire', 'Play')));
    layoutWorks = () => {
      if (player.ctx === 'works') closePlayer(true);
      horiz = desk.matches;
      works.classList.toggle('h', horiz);
      // onglet masqué : rien à mesurer, la bobine se met en place quand on l'ouvre
      if (!works.getClientRects().length) return;
      if (horiz) {
        const vh = window.innerHeight - parseFloat(getComputedStyle(root).getPropertyValue('--band') || 56);
        works.style.setProperty('--ih', clamp(vh*.56, 240, 640) + 'px');
        stepPx = Math.round(window.innerHeight*.62);
        works.style.setProperty('--h-total', (window.innerHeight + stepPx*(items.length-1)) + 'px');
        setS(track, 'transform', 'none');
        centers = items.map(el => el.offsetLeft + el.offsetWidth/2);
        pitch = (centers[centers.length-1] - centers[0]) / (items.length-1) || 1;
      } else {
        works.style.removeProperty('--h-total'); setS(track, 'transform', '');
        items.forEach(el => { const m = el.querySelector('.work-media'); m.style.transform = ''; el.style.opacity = ''; fx.delete(el); });
      }
      applyWorks(true);
    };
    const targetP = () => clamp(-(works.getBoundingClientRect().top - bandH()) / stepPx, 0, items.length-1);
    // mesures de la bobine prises au début de l'image (voir la boucle)
    const wMedia = items.map(el => el.querySelector('.work-media'));
    let mTop = null, mBest = -1;
    const bestMid = () => { const mid = F.vh/2; let best = 0, bd = 1e9; wMedia.forEach((m,i) => { const r = m.getBoundingClientRect(); const d = Math.abs((r.top + r.height/2) - mid); if (d < bd) { bd = d; best = i; } }); return best; };
    measureWorks = () => { if (horiz) mTop = works.getBoundingClientRect().top; else mBest = bestMid(); };
    const centerAt = p => { const i = Math.floor(p), j = Math.min(i+1, centers.length-1); return lerp(centers[i], centers[j], p - i); };
    const fx = new WeakMap();
    const setFx = (el, o, s) => { const key = `${o.toFixed(2)}|${s.toFixed(3)}`; if (fx.get(el) === key) return; fx.set(el, key); el.style.opacity = o > .995 ? '' : o.toFixed(2); el.querySelector('.work-media').style.transform = s > .999 ? '' : `scale(${s.toFixed(3)})`; };
    applyWorks = snap => {
      if (!centers.length && horiz) return;
      if (horiz) {
        const top = (!snap && mTop !== null) ? mTop : works.getBoundingClientRect().top; mTop = null;
        const tp = clamp(-(top - bandH()) / stepPx, 0, items.length-1);
        pPrev = pShown;
        pShown = (snap || !motion) ? tp : lerp(pShown, tp, .14);
        if (Math.abs(pShown - tp) < .0005) pShown = tp;
        wVel = lerp(wVel, pShown - pPrev, .3);
        if (Math.abs(wVel) < 1e-5) wVel = 0;
        const x = (snap ? window.innerWidth : F.vw)/2 - centerAt(pShown);
        const sk = motion ? clamp(-wVel*60, -6, 6) : 0, sy = motion ? 1 - Math.min(Math.abs(wVel)*1.2, .06) : 1;
        setS(track, 'transform', `translate3d(${x.toFixed(1)}px,0,0) skewX(${sk.toFixed(2)}deg) scaleY(${sy.toFixed(3)})`);
        if (player.ctx !== 'works') items.forEach((el,i) => { const d = Math.min(Math.abs(centers[i] - centerAt(pShown)) / pitch, 1); setFx(el, 1 - d*.62, 1 - d*.06); });
        setActive(Math.round(pShown));
      } else {
        const best = (!snap && mBest >= 0) ? mBest : bestMid(); mBest = -1;
        setActive(best);
      }
    };
    const wcap = $('#works-cap');
    function setActive(i){
      if (i === active) return;
      if (player.ctx === 'works') closePlayer(true);
      const prev = items[active];
      active = i;
      if (prev) { const v = prev.querySelector('video'); if (v) v.pause(); prev.classList.remove('playing'); }
      const el = items[i], d = P[el.dataset.id];
      wcap.classList.add('swap');
      setTimeout(() => {
        $('#wc-idx').textContent = `${pad(i+1)} / ${pad(items.length)}`;
        $('#wc-title').textContent = d.title; $('#wc-artist').textContent = d.artist; $('#wc-dir').textContent = d.dir || ''; $('#wc-dir-row').hidden = !d.dir; $('#wc-roles').textContent = d.roles; $('#wc-dur').textContent = tc(d.dur, d.fps);
        const ig = $('#wc-ig'); ig.hidden = !d.ig; if (d.ig) ig.href = d.ig;
        wcap.classList.remove('swap');
      }, motion ? 140 : 0);
      playPreview(el);
    }
    playPreview = el => {
      const v = el.querySelector('video'); if (!v || !motion || !worksVisible) return;
      if (!v.getAttribute('src')) v.src = v.dataset.src;
      v.onplaying = () => el.classList.add('playing');
      playV(v);
    };
    openWork = i => {
      const el = items[i], v = el.querySelector('video');
      if (!v.getAttribute('src')) v.src = v.dataset.src;
      let slot = $('#pslot-works');
      if (horiz) {
        // la bobine glissait encore vers le film suivant : le lecteur s'ouvrait puis se refermait aussitôt.
        // On l'arrête sur le film demandé (la page se cale sur sa position), le film reste ouvert.
        if (Math.round(targetP()) !== i) window.scrollTo({ top: works.getBoundingClientRect().top + window.scrollY - bandH() + i*stepPx, behavior: 'auto' });
        works.classList.add('open'); el.classList.add('open');
        const m = el.querySelector('.work-media'), r = el.getBoundingClientRect();
        const avail = window.innerHeight - bandH() - 230, s = clamp(Math.min(avail / r.height, window.innerWidth*.9 / r.width), 1, 1.6);
        m.style.transform = `scale(${s.toFixed(3)})`;
        el.style.opacity = '';
      } else {
        el.classList.add('open');
        slot = el.querySelector('.pslot') || el.appendChild(Object.assign(document.createElement('div'), {className:'pslot'}));
      }
      openPlayer('works', v, el.dataset.id, slot, () => {
        works.classList.remove('open'); el.classList.remove('open');
        fx.delete(el); el.querySelector('.work-media').style.transform = '';
        if (el === items[active]) playPreview(el);
      });
    };
    $('#wc-play').addEventListener('click', () => openWork(active));
    const primeV = v => { if (!v) return; if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src; const m = v.muted; v.muted = !soundOn; const p = v.play(); if (p && p.catch) p.catch(() => {}); v.pause(); v.muted = m; };
    scrollToItem = (i, then) => {
      if (then) primeV(items[i].querySelector('video'));
      if (!horiz) {
        items[i].scrollIntoView({behavior: motion ? 'smooth' : 'auto', block:'center'});
        if (then) { const t0 = performance.now(); let last = -1, still = 0; const wait = () => { const y = window.scrollY; still = y === last ? still + 1 : 0; last = y; if ((performance.now() - t0 > 250 && still >= 6) || performance.now() - t0 > 2500) { setActive(i); then(); } else requestAnimationFrame(wait); }; requestAnimationFrame(wait); }
        return;
      }
      const top = works.getBoundingClientRect().top + window.scrollY - bandH() + i*stepPx;
      window.scrollTo({top, behavior: motion ? 'smooth' : 'auto'});
      if (then) { let done = false; const fin = () => { if (done) return; done = true; window.removeEventListener('scrollend', fin); setTimeout(then, 120); }; window.addEventListener('scrollend', fin); setTimeout(fin, motion ? 1400 : 80); }
    };
    // glisser la bobine
    let drag = null;
    track.addEventListener('pointerdown', e => { if (!horiz || e.button !== 0 || player.ctx === 'works') return; drag = { x:e.clientX, y:e.clientY, p:targetP(), moved:false, id:e.pointerId }; });
    window.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) drag.moved = true;
      if (drag.moved) { const p = clamp(drag.p - dx/pitch, 0, items.length-1); window.scrollTo({top: works.getBoundingClientRect().top + window.scrollY - bandH() + p*stepPx, behavior:'auto'}); }
    });
    const endDrag = () => { setTimeout(() => drag = null, 0); };
    window.addEventListener('pointerup', endDrag); window.addEventListener('pointercancel', endDrag);
    items.forEach((el,i) => {
      const m = el.querySelector('.work-media');
      m.addEventListener('click', e => { if (drag && drag.moved) { e.preventDefault(); return; } if (player.ctx === 'works' && el.classList.contains('open')) { togglePlay(); return; } if (!horiz || i === active) openWork(i); else scrollToItem(i); });
    });
    works.addEventListener('wheel', e => {
      if (!horiz || player.ctx === 'works' || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      const p = -(works.getBoundingClientRect().top - bandH())/stepPx;
      if ((p <= 0 && e.deltaX < 0) || (p >= items.length-1 && e.deltaX > 0)) return;
      e.preventDefault(); window.scrollBy({top: e.deltaX * stepPx / pitch, behavior:'auto'});
    }, {passive:false});
    document.addEventListener('keydown', e => {
      if (player.ctx || !horiz || e.altKey || e.metaKey || e.ctrlKey) return;
      const r = works.getBoundingClientRect(); if (!r.height || r.top > bandH()+1 || r.bottom < window.innerHeight - 1) return;
      if (e.key === 'ArrowRight' && active < items.length-1) { e.preventDefault(); scrollToItem(active+1); }
      if (e.key === 'ArrowLeft' && active > 0) { e.preventDefault(); scrollToItem(active-1); }
    });
    if (!fine.matches) $('#works-hint').textContent = lng('Défilez ; touchez un film pour le lire', 'Scroll; tap a film to play it');
    new IntersectionObserver(es => es.forEach(en => {
      worksVisible = en.isIntersecting;
      const el = items[active]; if (!el) return;
      if (worksVisible) playPreview(el); else { if (player.ctx === 'works') closePlayer(true); const v = el.querySelector('video'); if (v) v.pause(); }
    }), {threshold:0}).observe(works);
    desk.addEventListener('change', layoutWorks);
  }

  /* ---------- Aperçu flottant (générique) ---------- */
  const peek = $('#peek'), peekV = $('#peek-v'), peekI = $('#peek-i');
  if (peek) {
    const pk = { x:0, y:0, tx:0, ty:0, on:false, imgs:null, k:0, t:0 };
    const showPeek = (el, e) => {
      if (!fine.matches) return;
      const ar = parseFloat(el.dataset.par || '1.3333');
      peek.style.width = (ar < 1 ? 180 : 280) + 'px'; peek.style.setProperty('--par', ar);
      if (el.dataset.peekImgs) { pk.imgs = el.dataset.peekImgs.split(','); pk.k = 0; pk.t = performance.now(); peekI.src = pk.imgs[0]; peekI.hidden = false; peekV.hidden = true; peekV.pause(); }
      else { pk.imgs = null; peekI.hidden = true; peekV.hidden = false; if (!peekV.src.endsWith(el.dataset.peek)) peekV.src = el.dataset.peek; if (motion) playV(peekV); }
      if (!pk.on) { pk.x = pk.tx = e.clientX; pk.y = pk.ty = e.clientY; }
      pk.on = true; peek.classList.add('on');
    };
    hidePeek = () => { pk.on = false; peek.classList.remove('on'); peekV.pause(); };
    $$('[data-peek],[data-peek-imgs]').forEach(el => { el.addEventListener('pointerenter', e => showPeek(el, e)); el.addEventListener('pointerleave', hidePeek); });
    window.addEventListener('pointermove', e => { pk.tx = e.clientX; pk.ty = e.clientY; }, {passive:true});
    measurePeek = () => { if (pk.on) { pk.w = peek.offsetWidth; pk.h = peek.offsetHeight; } };
    drawPeek = now => {
      if (!pk.on) return;
      pk.x = lerp(pk.x, pk.tx, motion ? .16 : 1); pk.y = lerp(pk.y, pk.ty, motion ? .16 : 1);
      const w = pk.w || 0, h = pk.h || 0;
      const x = pk.x + 28 + w > F.vw ? pk.x - 28 - w : pk.x + 28;
      setS(peek, 'transform', `translate3d(${x.toFixed(1)}px,${(pk.y - h/2).toFixed(1)}px,0)`);
      if (pk.imgs && now - pk.t > 420) { pk.t = now; pk.k = (pk.k + 1) % pk.imgs.length; peekI.src = pk.imgs[pk.k]; }
    };
  }

  /* ---------- Mise au point (studio) : les mots passent du flou au net, comme une caméra qui fait le point ---------- */
  // découpe en mots ; les espaces insécables restent dans le mot (« final : » ne se coupe pas en fin de ligne)
  // les mots d'un passage clé (<span class="k">) gardent la marque « k » (ils restent en blanc sur la page Studio)
  const toWords = el => {
    const frags = [];
    const walk = (node, k) => node.childNodes.forEach(n => { if (n.nodeType === 3) frags.push([n.textContent, k]); else if (n.nodeType === 1) walk(n, k || n.classList.contains('k')); });
    walk(el, false); el.textContent = ''; const out = [];
    frags.forEach(([txt, k]) => txt.split(/([ \t\r\n]+)/).forEach(w => { if (!w) return; if (/^[ \t\r\n]+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; } const s = document.createElement('span'); s.className = k ? 'wd k' : 'wd'; s.textContent = w; el.appendChild(s); out.push(s); }));
    return out;
  };
  const focusIn = (el, units, step, wait) => {
    if (!motion) { el.classList.add('go'); return; }
    units.forEach((u,i) => { u.style.transitionDelay = (wait + i*step) + 'ms'; });
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('go')));
  };
  const studioPage = document.body.classList.contains('p-studio');

  /* ---------- Texte qui s'allume (accueil) ; sur la page Studio, il fait sa mise au point à l'arrivée ---------- */
  const lit = $('#lit');
  if (lit && studioPage) {
    const wds = toWords(lit); lit.classList.add('fp');
    focusIn(lit, wds, 24, 250);
    const facts = $('.studio .facts');
    if (facts) { facts.classList.add('fp'); setTimeout(() => facts.classList.add('go'), motion ? 250 + wds.length*24 + 500 : 0); }
  }
  if (studioPage) $$('.member').forEach((m,k) => {
    // le nom lettre par lettre, puis « Co-founder » et le métier, puis le texte mot à mot
    const nm = m.querySelector('.m-name'), tx = m.querySelector('.m-txt'); if (!nm || !tx) return;
    const name = nm.textContent.trim(), ls = [];
    nm.setAttribute('aria-label', name); nm.textContent = '';
    name.split(' ').forEach((w,i,a) => {
      const ws = document.createElement('span'); ws.className = 'w'; ws.setAttribute('aria-hidden','true');
      [...w].forEach(c => { const s = document.createElement('span'); s.className = 'fl'; s.textContent = c; ws.appendChild(s); ls.push(s); });
      nm.appendChild(ws); if (i < a.length-1) nm.appendChild(document.createTextNode(' '));
    });
    const tw = toWords(tx);
    [m, nm, tx].forEach(e => e.classList.add('fp'));
    const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect();
      const d = k*150;
      focusIn(nm, ls, 30, d);
      if (motion) setTimeout(() => m.classList.add('go'), d); else m.classList.add('go');
      focusIn(tx, tw, 12, d + 600);
    }, {threshold:.25});
    io.observe(m);
  });
  // Accueil, partie Studio : le titre et le texte font leur mise au point phrase par phrase quand la partie arrive à l'écran
  const brief = $('#brief-t'), nova = $('#nova');
  if (lit && !studioPage && brief && nova) {
    brief.classList.remove('rv');   // le titre ne monte plus de sous sa ligne : il fait sa mise au point avec le texte
    const phrases = [];
    [...brief.children].forEach(s => phrases.push(toWords(s)));
    // le texte se coupe en deux phrases aux deux-points (« Studio indépendant à Liège : » puis la suite)
    const lw = toWords(lit), cut = lw.findIndex(w => /:$/.test(w.textContent)) + 1;
    if (cut > 0 && cut < lw.length) phrases.push(lw.slice(0, cut), lw.slice(cut)); else phrases.push(lw);
    const more = nova.querySelector('.studio-body>.link');
    [brief, lit].forEach(e => e.classList.add('fp')); if (more) more.classList.add('fp-l');
    let d = 0;
    phrases.forEach(ws => { ws.forEach((w,i) => { w.style.transitionDelay = (d + i*40) + 'ms'; }); d += 420 + ws.length*40; });
    const go = () => { [brief, lit].forEach(e => e.classList.add('go')); if (more) { more.style.transitionDelay = motion ? d + 'ms' : '0ms'; more.classList.add('go'); } };
    if (!motion) go();
    else { const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); go(); }, {threshold:.35}); io.observe(nova); }
  }

  /* ---------- Générique qui défile (projets, clips) ---------- */
  const credits = $('#generique');
  if (credits) {
    const crWin = $('#cr-win'), crList = $('#cr-list'), crNames = $$('#cr-list .name');
    let crOn = false, crLast = '', crRect = null;
    // positions des noms dans la liste : relevées à la mise en page (le défilement ne les change pas)
    const crG = { total: 0, winH: 0, cy: [], ok: false };
    const crGeom = () => {
      if (!credits.getClientRects().length) { crG.ok = false; return; }
      crG.total = credits.offsetHeight; crG.winH = crWin.clientHeight;
      crG.cy = crNames.map(n => { const li = n.parentElement; return li.offsetTop + li.offsetHeight/2; });
      crG.ok = true;
    };
    const crRO = new ResizeObserver(() => { crGeom(); crLast = ''; }); crRO.observe(crList); crRO.observe(crWin);
    layoutCredits = () => {
      crOn = !reduce;
      credits.classList.toggle('roll', crOn);
      if (!crOn) { setS(crList, 'transform', ''); crNames.forEach(n => { n.style.removeProperty('--o'); clrS(n, '--o'); }); return; }
      if (!credits.getClientRects().length) return;
      const listH = crList.offsetHeight;
      credits.style.setProperty('--cr-h', Math.round(window.innerHeight + listH * 1.15) + 'px');
      crGeom();
      drawCredits(true);
    };
    measureCredits = () => { crRect = (crOn && isNear(credits)) ? credits.getBoundingClientRect() : null; };
    drawCredits = force => {
      if (!crOn || (!force && !isNear(credits))) return;
      const r = (!force && crRect) ? crRect : credits.getBoundingClientRect(); crRect = null;
      const vh = force ? window.innerHeight : F.vh;
      if (!force && (r.bottom < 0 || r.top > vh)) return;
      if (!crG.ok) crGeom();
      if (!crG.ok) return;
      const total = crG.total - (vh - bandH());
      const p = clamp((bandH() - r.top) / Math.max(1,total), 0, 1);
      const winH = crG.winH, cy = crG.cy;
      const y = winH/2 - lerp(cy[0], cy[cy.length-1], p);
      const key = y.toFixed(1); if (key === crLast && !force) return; crLast = key;
      setS(crList, 'transform', `translate3d(0,${key}px,0)`);
      crNames.forEach((n,i) => { const d = Math.abs(cy[i] + y - winH/2) / (winH/2); setS(n, '--o', clamp(1 - d*.85, .12, 1).toFixed(2)); });
    };
    $$('#cr-list button.name').forEach(b => b.addEventListener('click', () => { hidePeek(); const i = items.findIndex(el => el.dataset.id === b.dataset.open); if (i < 0 || !scrollToItem) return; scrollToItem(i, () => openWork(i)); }));
    nearIO.observe(credits);
  }

  /* ---------- Contact : la phrase à compléter ---------- */
  const sentence = $('#sentence');
  if (sentence) {
    const sen = $('#sen'), slMsg = $('#sl-msg');
    const fit = el => { el.size = Math.max(el.placeholder.length - 1, Math.min(el.value.length + 1, el.id === 's-idea' ? 40 : 22)); };
    ['s-name','s-idea'].forEach(id => { const el = $('#' + id); el.addEventListener('input', () => fit(el)); });
    // les deux choix de la phrase : un bouton dans le texte et une petite liste sur mesure ; le select reste la source de la valeur
    const STAR_MINI = '<svg viewBox="0 0 100 36" aria-hidden="true"><path d="M50 0 C53 12 60 16 100 18 C60 20 53 24 50 36 C47 24 40 20 0 18 C40 16 47 12 50 0Z"/></svg>';
    const picks = [];
    $$('select.sen-sel').forEach(sel => {
      const wrap = document.createElement('span'); wrap.className = 'pick';
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'sen-sel'; btn.id = sel.id + '-b';
      btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', sel.getAttribute('aria-label') + ' : ' + sel.value);
      btn.textContent = sel.value;
      const list = document.createElement('span'); list.className = 'pick-l'; list.setAttribute('role', 'listbox'); list.id = sel.id + '-l'; list.setAttribute('aria-label', sel.getAttribute('aria-label'));
      btn.setAttribute('aria-controls', list.id);
      const opts = [...sel.options].map((o, i) => {
        const it = document.createElement('span'); it.className = 'pick-o'; it.setAttribute('role', 'option'); it.id = sel.id + '-o' + i; it.tabIndex = -1;
        it.setAttribute('aria-selected', String(o.selected)); it.innerHTML = '<span></span>' + STAR_MINI; it.firstChild.textContent = o.text;
        it.addEventListener('click', e => { e.stopPropagation(); choose(i); close(true); });
        it.addEventListener('pointermove', () => setAct(i));
        list.appendChild(it); return it;
      });
      sel.hidden = true; sel.tabIndex = -1;
      sel.parentNode.insertBefore(wrap, sel); wrap.append(btn, list, sel);
      let act = sel.selectedIndex;
      function setAct(i){ act = (i + opts.length) % opts.length; opts.forEach((o, k) => o.classList.toggle('act', k === act)); opts[act].focus({preventScroll:true}); }
      function choose(i){ sel.selectedIndex = i; opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === i))); btn.textContent = sel.value; btn.setAttribute('aria-label', sel.getAttribute('aria-label') + ' : ' + sel.value); sel.dispatchEvent(new Event('change', {bubbles:true})); }
      function open(){
        picks.forEach(pk => pk !== api && pk.close(false));
        wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
        // la liste reste dans le cadre de la phrase
        wrap.classList.remove('right');
        const box = sentence.getBoundingClientRect(), r = list.getBoundingClientRect();
        if (r.right > box.right + 1) wrap.classList.add('right');
        setAct(sel.selectedIndex);
      }
      function close(focusBtn){ if (!wrap.classList.contains('open')) return; wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); opts.forEach(o => o.classList.remove('act')); if (focusBtn) btn.focus({preventScroll:true}); }
      btn.addEventListener('click', e => { e.stopPropagation(); wrap.classList.contains('open') ? close(false) : open(); });
      btn.addEventListener('keydown', e => { if (['ArrowDown','ArrowUp','Enter',' '].includes(e.key)) { e.preventDefault(); open(); } });
      list.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setAct(act + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(act - 1); }
        else if (e.key === 'Home') { e.preventDefault(); setAct(0); }
        else if (e.key === 'End') { e.preventDefault(); setAct(opts.length - 1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(act); close(true); }
        else if (e.key === 'Escape') { e.preventDefault(); close(true); }
        else if (e.key === 'Tab') close(false);
      });
      const api = { close, wrap }; picks.push(api);
    });
    document.addEventListener('click', e => picks.forEach(pk => { if (!pk.wrap.contains(e.target)) pk.close(false); }));
    const compose = () => {
      const name = $('#s-name').value.trim(), type = $('#s-type').value, when = $('#s-when').value, idea = $('#s-idea').value.trim();
      const sentenceTxt = IS_EN
        ? `My name is ${name || '…'}, I’m preparing ${type} for ${when}.${idea ? ' The idea: ' + idea + '.' : ''}`
        : `Je m’appelle ${name || '…'}, je prépare ${type} pour ${when}.${idea ? ' L’idée : ' + idea + '.' : ''}`;
      return { subject: `${lng('Projet : ', 'Project: ')}${type}${name ? ' · ' + name : ''}`, body: `${lng('Bonjour NOVA,', 'Hello NOVA,')}\n\n${sentenceTxt}\n\n${name}`.trim() };
    };
    // la phrase est en place dès l'arrivée ; à l'envoi, le message part directement
    const dissolve = done => done();
    const assemble = () => { sentence.classList.add('ready'); sentence.classList.remove('gone'); };
    requestAnimationFrame(assemble);
    sentence.addEventListener('submit', e => {
      e.preventDefault();
      picks.forEach(pk => pk.close(false));
      const m = compose();
      slMsg.textContent = '';
      dissolve(() => { slMsg.textContent = lng('Votre messagerie s’ouvre avec le message prêt', 'Your email app opens with the message ready'); window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`; });
    });
    $('#sl-ig').addEventListener('click', () => {
      const m = compose();
      try { navigator.clipboard.writeText(m.body).then(() => { slMsg.textContent = lng('Message copié : collez-le dans la conversation Instagram', 'Message copied: paste it into the Instagram conversation'); }, () => { slMsg.textContent = lng('Instagram s’ouvre : écrivez votre message dans la conversation', 'Instagram opens: write your message in the conversation'); }); } catch(_) { slMsg.textContent = lng('Instagram s’ouvre : écrivez votre message dans la conversation', 'Instagram opens: write your message in the conversation'); }
    });
  }
  const copyBtn = $('#copy');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const reset = () => setTimeout(() => copyBtn.textContent = lng('Copier', 'Copy'), 2000);
    const fallback = () => { const s = getSelection(), rg = document.createRange(); rg.selectNodeContents($('#mail')); s.removeAllRanges(); s.addRange(rg); copyBtn.textContent = lng('Sélectionnée', 'Selected'); reset(); };
    try { navigator.clipboard.writeText(MAIL).then(() => { copyBtn.textContent = lng('Copiée', 'Copied'); reset(); }, fallback); } catch(e){ fallback(); }
  });

  /* ---------- Barre de défilement (ordinateur) : une poignée rectangulaire posée sur la page, à la place de celle du navigateur ---------- */
  if (fine.matches) {
    const sb = document.createElement('div'); sb.className = 'sbar'; sb.setAttribute('aria-hidden', 'true');
    const th = document.createElement('i'); sb.appendChild(th); document.body.appendChild(sb);
    let drag = null, sbDirty = true;
    // dessinée dans la boucle d'animation, avec les mesures du début de l'image (live : lecture directe, hors boucle)
    const sbDraw = live => {
      sbDirty = false;
      const vh = live ? window.innerHeight : F.vh, dh = live ? document.documentElement.scrollHeight : F.docH, sy = live ? window.scrollY : F.sy, max = dh - vh;
      if (max < 2) { if (!sb.hidden) sb.hidden = true; return; }
      if (sb.hidden) sb.hidden = false;
      const h = Math.max(40, Math.round(vh * vh / dh)), y = Math.round(sy / max * (vh - h));
      setS(th, 'height', h + 'px'); setS(th, 'transform', `translate3d(0,${y}px,0)`);
    };
    const sbQueue = () => { sbDirty = true; };
    window.addEventListener('scroll', sbQueue, {passive:true});
    window.addEventListener('resize', sbQueue);
    new ResizeObserver(sbQueue).observe(document.body);
    sbTick = () => { if (sbDirty) sbDraw(false); };
    // on peut aussi attraper la poignée et la faire glisser
    th.addEventListener('pointerdown', e => { e.preventDefault(); th.setPointerCapture(e.pointerId); drag = { y: e.clientY, s: window.scrollY }; sb.classList.add('drag'); });
    th.addEventListener('pointermove', e => {
      if (!drag) return;
      const vh = window.innerHeight, dh = document.documentElement.scrollHeight, h = th.offsetHeight;
      window.scrollTo({ top: drag.s + (e.clientY - drag.y) * (dh - vh) / Math.max(1, vh - h), behavior: 'auto' });
    });
    const sbEnd = () => { drag = null; sb.classList.remove('drag'); };
    th.addEventListener('pointerup', sbEnd); th.addEventListener('pointercancel', sbEnd);
    sbDraw(true);
  }

  /* ---------- Révélations ---------- */
  $$('.h2.rv>span').forEach(s => { const li = document.createElement('span'); li.className = 'li'; while (s.firstChild) li.appendChild(s.firstChild); s.appendChild(li); });
  // les éléments masqués (clip-path) sont observés via leur parent, sinon ils ne croisent jamais l'écran
  const revIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { (en.target._rv || en.target).classList.add('in'); revIO.unobserve(en.target); } }), {threshold:.2, rootMargin:'0px 0px -5% 0px'});
  $$('.rv,.svc,.rise,.up,.chars:not(.cap-t)').forEach(el => revIO.observe(el));
  $$('.clip-in').forEach(el => { const w = el.parentElement; w._rv = el; revIO.observe(w); });

  /* ---------- Affiches (Services, Studio, accueil) : le panneau survolé s'ouvre, son film joue ---------- */
  // Ouverture au survol (après un court arrêt), au focus ou au toucher. Un seul film joue à la fois : celui du panneau
  // ouvert, quand la rangée est à l'écran, sur ordinateur avec une bonne connexion. Le fichier n'est demandé qu'à ce moment.
  // Sur téléphone, les affiches défilent à l'horizontale et restent en images fixes.
  $$('.af').forEach(af => {
    const cards = [...af.children].filter(c => c.classList.contains('af-c'));
    if (!cards.length) return;
    const wide = matchMedia('(min-width:1025px)');
    let cur = Math.max(0, cards.findIndex(c => c.classList.contains('on'))), vis = false, hovT = 0, lastTouch = false;
    const vids = cards.map(c => c.querySelector('video'));
    const sync = () => vids.forEach((v, i) => {
      if (!v) return;
      const want = vis && motion && fastNet && wide.matches && i === cur;
      if (want) { if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src; if (v.paused) playV(v); }
      else { if (!v.paused) v.pause(); v.classList.remove('rdy'); }   // panneau refermé : on revoit l'image fixe
    });
    const open = i => { if (i === cur) return; cur = i; cards.forEach((c, k) => c.classList.toggle('on', k === i)); sync(); };
    cards.forEach((c, i) => {
      c.classList.toggle('on', i === cur);
      c.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse' || !wide.matches) return; clearTimeout(hovT); hovT = setTimeout(() => open(i), 70); });
      c.addEventListener('pointerleave', () => clearTimeout(hovT));
      c.addEventListener('pointerdown', e => { lastTouch = e.pointerType !== 'mouse'; }, {passive:true});
      c.addEventListener('focusin', () => { if (wide.matches && !lastTouch) open(i); });
      const a = c.querySelector('.af-a');
      // au doigt sur grand écran : le premier toucher ouvre le panneau, le second suit le lien
      if (a) a.addEventListener('click', e => { if (a.tagName === 'BUTTON') { open(i); return; } if (wide.matches && lastTouch && i !== cur) { e.preventDefault(); open(i); } });
      const v = vids[i];
      if (v) {
        v.addEventListener('playing', () => v.classList.add('rdy'));
        // data-start : la boucle reprend après le logo du film, pas au tout début du fichier
        const st = parseFloat(v.dataset.start || '0'), rate = parseFloat(v.dataset.rate || '1');
        if (rate !== 1) { v.defaultPlaybackRate = rate; v.addEventListener('loadedmetadata', () => { v.playbackRate = rate; }); }
        if (st > 0) { v.loop = false; v.addEventListener('loadedmetadata', () => { try { v.currentTime = st; } catch(e){} }); v.addEventListener('ended', () => { try { v.currentTime = st; } catch(e){} playV(v); }); }
      }
    });
    new IntersectionObserver(es => { vis = es[0].isIntersecting; sync(); }, {threshold:.2}).observe(af);
    if (wide.addEventListener) wide.addEventListener('change', sync);
    // une adresse mène à sa prestation (services/#clips-vfx, depuis l'accueil) : son panneau s'ouvre
    const fromHash = () => { const id = dec(location.hash.slice(1)), k = id ? cards.findIndex(c => c.id === id) : -1; if (k < 0) return; open(k); if (!wide.matches) af.scrollLeft = cards[k].offsetLeft - af.offsetLeft; };
    fromHash(); window.addEventListener('hashchange', fromHash);
  });

  /* ---------- Services : déroulé en une ligne ---------- */
  // Déroulé : une ligne de montage. À l'arrivée à l'écran, l'étoile la parcourt comme une tête de lecture et allume
  // les six étapes une à une ; au survol d'une étape, elle s'y pose et la suite repasse en gris. Verticale sur téléphone.
  const tl = $('#tl');
  if (tl) {
    const st = $$('.tl-s', tl), tlBar = tl.querySelector('.tl-bar'), tlStar = tl.querySelector('.tl-star'), n = st.length, vq = matchMedia('(max-width:900px)');
    let tp = 0, ta = 0, tb = 0, vert = false, played = false, sweeping = false;
    tl.classList.add('run');
    const drawTl = () => {
      setS(tlBar, 'transform', (vert ? 'scaleY(' : 'scaleX(') + tp.toFixed(4) + ')');
      if (tlStar && !vert) setS(tlStar, 'transform', 'translate3d(' + (ta + (tb - ta)*tp - 15).toFixed(1) + 'px,0,0)');
      st.forEach((s, i) => s.classList.toggle('on', i <= tp*(n - 1) + 1e-3));
    };
    // relevé : position des repères de la première et de la dernière étape (relu seulement si la taille change)
    const measureTl = () => {
      vert = vq.matches;
      const s0 = st[0], s1 = st[n - 1];
      // la ligne va du rond de la première étape à celui de la dernière (centre du rond : 5,5 px du bord, 10 px du haut)
      ta = vert ? s0.offsetTop + 10 : s0.offsetLeft + 5.5; tb = vert ? s1.offsetTop + 10 : s1.offsetLeft + 5.5;
      setS(tlBar, vert ? 'top' : 'left', ta + 'px'); setS(tlBar, vert ? 'height' : 'width', (tb - ta) + 'px');
      setS(tlBar, vert ? 'left' : 'top', ''); setS(tlBar, vert ? 'width' : 'height', '');
      clrS(tlBar, 'transform'); drawTl();
    };
    const easeIO = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
    const sweepTl = () => {
      played = true; tl.classList.add('live');
      if (!motion) { tp = 1; drawTl(); tl.classList.add('ease'); return; }
      sweeping = true;
      const T = 1500, t0 = performance.now();
      const step = now => { const x = Math.min(1, (now - t0)/T); tp = easeIO(x); drawTl(); if (x < 1) requestAnimationFrame(step); else { sweeping = false; tl.classList.add('ease'); } };
      requestAnimationFrame(step);
    };
    const tlTo = q => { if (!played || sweeping || vert) return; tp = q; drawTl(); };
    const tlIO = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { tlIO.disconnect(); sweepTl(); } }, {threshold:.4});
    tlIO.observe(tl);
    st.forEach((s, i) => s.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') tlTo(i/(n - 1)); }));
    tl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') tlTo(1); });
    new ResizeObserver(measureTl).observe(tl);
    if (document.fonts) document.fonts.ready.then(measureTl);
    measureTl();
  }

  /* ---------- Parallaxe des stills (projets) et bandeau des disciplines (accueil) ---------- */
  const rail = $('#rail'), railStars = $$('#rail i'), railBox = rail ? rail.parentElement : null;
  // parallaxe à la souris : chaque cadre flotte à sa profondeur, l'image glisse à l'inverse dans son cadre ;
  // une grille de stills par campagne, et l'image d'ouverture en pleine largeur ne bouge que dans son cadre
  const DEPTH = [1, .55, .8, 1.2, .7, 1];
  const stillSets = $$('.stills, .ts-lead').map(box => { const phs = $$('.ph', box); return { box, phs, figs: phs.map(ph => ph.closest('figure')), lead: box.classList.contains('ts-lead') }; });
  stillSets.forEach(s => nearIO.observe(s.box));
  if (railBox) nearIO.observe(railBox);
  const pm = { x:0, y:0, on:false }, par = { x:0, y:0 };
  window.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; pm.x = e.clientX; pm.y = e.clientY; pm.on = true; }, {passive:true});
  document.documentElement.addEventListener('mouseleave', () => { pm.on = false; });
  let railLast = '', railRect = null, railSW = rail ? rail.scrollWidth : 0;
  if (rail) new ResizeObserver(() => { railSW = rail.scrollWidth; railLast = ''; }).observe(rail);
  // lectures (début d'image) : positions des stills proches de l'écran et du bandeau
  function measureScrollFx(){
    const vh = F.vh;
    stillSets.forEach(s => {
      s.m = null;
      if (!isNear(s.box)) return;
      const sb = s.box.getBoundingClientRect();
      if (sb.bottom < -50 || sb.top > vh + 50) return;
      s.m = s.phs.map(ph => ph.getBoundingClientRect());
    });
    railRect = railBox && isNear(railBox) ? railBox.getBoundingClientRect() : null;
  }
  // écritures
  function drawScrollFx(){
    const vh = F.vh;
    let eased = false;
    stillSets.forEach(({m, phs, figs, lead}) => {
      if (!m) return;
      if (!eased) {
        eased = true;
        const tx = motion && pm.on ? clamp((pm.x - F.vw/2) / (F.vw/2), -1, 1) : 0, ty = motion && pm.on ? clamp((pm.y - vh/2) / (vh/2), -1, 1) : 0;
        par.x += (tx - par.x) * .06; par.y += (ty - par.y) * .06;
      }
      phs.forEach((ph, i) => {
        const r = m[i]; if (r.bottom < -50 || r.top > vh + 50) return;
        const d = motion ? ((r.top + r.height/2) - vh/2) / vh : 0, k = lead ? .6 : DEPTH[i % DEPTH.length];
        setS(ph, '--py', (d*(lead ? -5 : -7)).toFixed(2) + '%');
        setS(ph, '--mx', (-par.x*1.8*k).toFixed(2) + '%');
        setS(ph, '--my', (-par.y*.8*k).toFixed(2) + '%');
        if (figs[i] && !lead) setS(figs[i], 'transform', `translate3d(${(par.x*10*k).toFixed(1)}px,${(par.y*8*k).toFixed(1)}px,0)`);
      });
    });
    const rr = railRect; railRect = null;
    if (rr && rr.bottom > 0 && rr.top < vh) {
      const p = clamp((vh - rr.top) / (vh + rr.height), 0, 1);
      const x = -(p * (railSW - F.vw*.6)).toFixed(1);
      const key = x + '';
      if (key !== railLast) { railLast = key; rail.style.transform = `translate3d(${x}px,0,0)`; railStars.forEach((st,i) => st.style.transform = `rotate(${((p*540) + i*30).toFixed(1)}deg)`); }
    }
  }

  /* ---------- Studio : le métier survolé, ou le plus proche du centre de l'écran, montre son plan ---------- */
  const svcList = $('#svc'), svcRows = $$('#svc li'), svcPv = $('.svc-pv');
  const svcImgs = svcPv ? $$('.svc-pv img') : [], svcCap = svcPv ? svcPv.querySelector('figcaption') : null;
  let svcFront = svcImgs[0], svcBack = svcImgs[1], svcOn = -1, svcHover = -1, svcWarm = false;
  function showSvc(i){
    if (i === svcOn || i < 0 || !svcPv) return; svcOn = i;
    svcRows.forEach((li, k) => li.classList.toggle('on', k === i));
    svcCap.textContent = svcRows[i].dataset.cap;
    const src = svcRows[i].dataset.pv;
    if (svcFront.getAttribute('src') === src) return;
    svcBack.src = src; svcBack.classList.remove('off'); svcFront.classList.add('off');
    [svcFront, svcBack] = [svcBack, svcFront];
  }
  if (svcPv && svcList) {
    svcList.classList.add('pv');
    svcRows.forEach((li, i) => {
      li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { svcHover = i; showSvc(i); } });
      li.addEventListener('focusin', () => showSvc(i));
    });
    svcList.addEventListener('pointerleave', () => { svcHover = -1; });
    nearIO.observe(svcList);
    showSvc(1);
  }
  // lecture (début d'image) : le métier le plus proche du centre de l'écran ; écriture ensuite
  let svcBest = -1;
  function measureSvc(){
    svcBest = -1;
    if (!svcPv || !svcList || svcHover >= 0 || !isNear(svcList) || !svcPv.offsetParent) return;
    const mid = F.vh * .5, lr = svcList.getBoundingClientRect();
    if (lr.bottom < mid * .5 || lr.top > mid * 1.5) { svcBest = -2; return; }
    let best = -1, bd = 1e9;
    svcRows.forEach((li, k) => { const r = li.getBoundingClientRect(), d = Math.abs(r.top + r.height/2 - mid); if (d < bd) { bd = d; best = k; } });
    svcBest = best;
  }
  function drawSvc(){
    if (svcBest === -1) return;
    if (!svcWarm) { svcWarm = true; svcRows.forEach(li => { const im = new Image(); im.src = li.dataset.pv; }); }
    if (svcBest >= 0) showSvc(svcBest);
  }

  /* ---------- Vidéos des portes de l'accueil : elles jouent quand elles sont à l'écran ---------- */
  const inview = $$('video[data-inview]');
  inview.forEach(v => {
    const rate = parseFloat(v.dataset.rate || '1'), start = parseFloat(v.dataset.start || '0');
    v.defaultPlaybackRate = rate;
    // data-start : la boucle reprend après le titre du clip, pas au tout début du fichier
    if (start > 0) {
      v.loop = false;
      const toStart = () => { try { v.currentTime = start; } catch(e){} };
      v.addEventListener('loadedmetadata', () => { if (v.currentTime < start) toStart(); }, {once:true});
      v.addEventListener('ended', () => { toStart(); if (v._in && motion) playV(v); });
    }
    new IntersectionObserver(es => es.forEach(en => {
      v._in = en.isIntersecting && en.intersectionRatio >= .25;
      if (v._in && motion) { v.playbackRate = rate; playV(v); } else if (!v.paused) v.pause();
    }), {threshold:[0,.25,.5]}).observe(v);
  });

  /* ---------- Visionneuse de stills (projets) : défile seule à l'écran, vignettes, glissé sur téléphone ---------- */
  /* ---------- Projets : image en grand ----------
     Un clic sur une image d'une visionneuse l'ouvre en plein écran, entière, sans défilement automatique.
     Ordinateur : pas de zoom (vue d'ensemble ; pour le détail, on télécharge la photo), flèches, Échap,
     clic à côté de l'image pour fermer.
     Téléphone : toucher ou pincement pour zoomer, glisser sur le côté change d'image, vers le bas ferme,
     et le bouton retour ferme aussi. */
  const LB_MAX = 5;
  let lbEl = null, lbView = null, lbImg = null, lbVid = null, lbCap = null, lbN = null, lbHint = null, lbX = null;
  let lbItems = [], lbI = 0, lbOnClose = null, lbBack = null, lbPushed = false, lbIgnorePop = false;
  const lbZ = { s: 1, tx: 0, ty: 0, bw: 0, bh: 0, ox: 0, oy: 0, W: 0, H: 0, nat: 0 };
  // la meilleure version disponible d'une image : data-full, puis la plus grande du srcset, puis la source
  const bestSrc = img => {
    if (img.dataset.full) return img.dataset.full;
    const set = img.getAttribute('srcset') || img.dataset.srcset || '';
    let best = '', bw = 0;
    set.split(',').forEach(c => { const m = c.trim().match(/^(\S+)\s+(\d+)w$/); if (m && +m[2] > bw) { bw = +m[2]; best = m[1]; } });
    return best || img.dataset.src || img.getAttribute('src') || '';
  };
  const lbBuild = () => {
    lbEl = document.createElement('div');
    lbEl.className = 'lb'; lbEl.hidden = true;
    lbEl.setAttribute('role', 'dialog'); lbEl.setAttribute('aria-modal', 'true');
    lbEl.setAttribute('aria-label', lng('Image en grand', 'Full-size image'));
    lbEl.innerHTML = `<div class="lb-top wrap"><span class="lb-cap"></span><span class="lb-n mono"></span><button class="lb-x" type="button">${lng('Fermer', 'Close')}</button></div>`
      + `<div class="lb-view"><img class="lb-media" alt="" draggable="false"><video class="lb-media" muted loop playsinline preload="auto" hidden></video></div>`
      + `<div class="lb-bot wrap"><button class="lb-prev" type="button">${lng('Précédente', 'Previous')}</button><span class="lb-hint mono"></span><button class="lb-next" type="button">${lng('Suivante', 'Next')}</button></div>`;
    document.body.appendChild(lbEl);
    lbView = lbEl.querySelector('.lb-view'); lbImg = lbEl.querySelector('img'); lbVid = lbEl.querySelector('video');
    lbCap = lbEl.querySelector('.lb-cap'); lbN = lbEl.querySelector('.lb-n'); lbHint = lbEl.querySelector('.lb-hint'); lbX = lbEl.querySelector('.lb-x');
    lbX.addEventListener('click', () => lbClose());
    lbEl.querySelector('.lb-prev').addEventListener('click', () => lbGo(-1));
    lbEl.querySelector('.lb-next').addEventListener('click', () => lbGo(1));
    lbImg.addEventListener('load', () => { if (!lbImg.hidden) { lbZ.nat = lbImg.naturalWidth; lbFit(lbZ.s <= 1.001); } });
    lbVid.addEventListener('loadedmetadata', () => { if (!lbVid.hidden) lbFit(true); });
    // gestes : un ou deux doigts (ou la souris)
    const pts = new Map(); let g = null;
    const vxy = e => { const r = lbView.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    lbView.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      lbView.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, vxy(e));
      lbEase(false);
      if (pts.size === 1) { const [x, y] = pts.get(e.pointerId); g = { x0: x, y0: y, tx: lbZ.tx, ty: lbZ.ty, moved: false, pinch: false, t: performance.now() }; }
      else if (pts.size === 2) { const [a, b] = [...pts.values()]; g = { pinch: true, d0: Math.hypot(a[0]-b[0], a[1]-b[1]) || 1, s0: lbZ.s, mx: (a[0]+b[0])/2, my: (a[1]+b[1])/2, tx: lbZ.tx, ty: lbZ.ty, moved: true }; }
    });
    lbView.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId) || !g) return;
      pts.set(e.pointerId, vxy(e));
      if (g.pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()], d = Math.hypot(a[0]-b[0], a[1]-b[1]), mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2;
        // l'image suit les deux doigts : échelle autour du point de départ, puis déplacement du milieu
        const s1 = clamp(g.s0 * d / g.d0, 1, LB_MAX), u = (g.mx - lbZ.ox - g.tx) / g.s0, v = (g.my - lbZ.oy - g.ty) / g.s0;
        lbZ.s = s1; lbZ.tx = mx - lbZ.ox - u*s1; lbZ.ty = my - lbZ.oy - v*s1; lbClamp(); lbApply();
        return;
      }
      const [x, y] = pts.get(e.pointerId), dx = x - g.x0, dy = y - g.y0;
      if (!g.moved && Math.hypot(dx, dy) > 6) g.moved = true;
      if (!g.moved) return;
      if (lbZ.s > 1.001) { lbZ.tx = g.tx + dx; lbZ.ty = g.ty + dy; lbClamp(); lbApply(); }
      else if (e.pointerType !== 'mouse') { lbZ.tx = dx * .9; lbZ.ty = Math.max(0, dy) * .9; lbApply(); }
    });
    const end = e => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId); pts.delete(e.pointerId);
      if (!g) return;
      if (g.pinch) { if (pts.size === 0) { g = null; if (lbZ.s < 1.02) lbZoom(1); } else { const [x, y] = [...pts.values()][0]; g = { x0: x, y0: y, tx: lbZ.tx, ty: lbZ.ty, moved: true, pinch: false }; } return; }
      const dx = p[0] - g.x0, dy = p[1] - g.y0, gg = g; g = null;
      if (!gg.moved) {
        if (e.type !== 'pointerup') return;
        // ordinateur : pas de zoom ; un clic à côté de l'image ferme
        if (e.pointerType === 'mouse') { const out = p[0] < lbZ.ox || p[0] > lbZ.ox + lbZ.bw || p[1] < lbZ.oy || p[1] > lbZ.oy + lbZ.bh; if (out) lbClose(); return; }
        if (lbVid.hidden) lbToggle(p[0], p[1]);
        return;
      }
      if (lbZ.s <= 1.001 && e.pointerType !== 'mouse') {
        // sans zoom : glisser sur le côté change d'image, vers le bas ferme
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { lbGo(dx < 0 ? 1 : -1); return; }
        if (dy > 90 && dy > Math.abs(dx)) { lbClose(); return; }
        lbZoom(1);
      }
    };
    lbView.addEventListener('pointerup', end); lbView.addEventListener('pointercancel', end);
    lbView.addEventListener('wheel', e => {
      e.preventDefault();
      if (!lbVid.hidden || fine.matches) return;
      const [x, y] = vxy(e), k = Math.exp(-e.deltaY * (e.ctrlKey ? .012 : .0025));
      lbEase(false); lbZoomAt(lbZ.s * k, x, y);
    }, {passive:false});
    // la page derrière ne défile pas (iOS ignore parfois overflow:hidden)
    lbEl.addEventListener('touchmove', e => e.preventDefault(), {passive:false});
    document.addEventListener('keydown', e => {
      if (!lbOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); lbClose(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); lbGo(e.key === 'ArrowRight' ? 1 : -1); }
      else if (e.key === 'Tab') {
        // le focus reste dans la fenêtre
        const f = [...lbEl.querySelectorAll('button')], i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
      else if (fine.matches) return;
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); lbZoomAt(lbZ.s * 1.5, lbZ.W/2, lbZ.H/2, true); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); lbZoomAt(lbZ.s / 1.5, lbZ.W/2, lbZ.H/2, true); }
      else if (e.key === '0') { e.preventDefault(); lbZoom(1); }
    }, true);
    window.addEventListener('resize', () => { if (lbOpen) lbFit(false); });
  };
  const lbEase = on => { (lbVid.hidden ? lbImg : lbVid).classList.toggle('ease', !!on && motion); };
  const lbApply = () => {
    const m = lbVid.hidden ? lbImg : lbVid;
    m.style.transform = `translate3d(${(lbZ.ox + lbZ.tx).toFixed(1)}px,${(lbZ.oy + lbZ.ty).toFixed(1)}px,0) scale(${lbZ.s.toFixed(4)})`;
    lbView.dataset.cursor = !lbVid.hidden || fine.matches ? '' : lbZ.s > 1.001 ? lng('Dézoomer', 'Zoom out') : lng('Zoomer', 'Zoom in');
    lbView.classList.toggle('zoomed', lbZ.s > 1.001);
  };
  // l'image zoomée couvre toujours la vue (pas de bord vide qui dérive)
  const lbClamp = () => {
    const w = lbZ.bw * lbZ.s, h = lbZ.bh * lbZ.s;
    lbZ.tx = w <= lbZ.W ? (lbZ.W - w)/2 - lbZ.ox : clamp(lbZ.tx, lbZ.W - w - lbZ.ox, -lbZ.ox);
    lbZ.ty = h <= lbZ.H ? (lbZ.H - h)/2 - lbZ.oy : clamp(lbZ.ty, lbZ.H - h - lbZ.oy, -lbZ.oy);
  };
  const lbZoomAt = (s1, x, y, ease) => {
    s1 = clamp(s1, 1, LB_MAX);
    const u = (x - lbZ.ox - lbZ.tx) / lbZ.s, v = (y - lbZ.oy - lbZ.ty) / lbZ.s;
    lbZ.s = s1; lbZ.tx = x - lbZ.ox - u*s1; lbZ.ty = y - lbZ.oy - v*s1;
    lbClamp(); lbEase(ease); lbApply();
  };
  const lbZoom = s1 => lbZoomAt(s1, lbZ.W/2, lbZ.H/2, true);
  // clic : zoom sur le point visé (au moins x2,5, ou la taille réelle de l'image si elle est plus grande), re-clic : retour
  const lbToggle = (x, y) => {
    if (lbZ.s > 1.001) { lbZoomAt(1, x, y, true); return; }
    const real = lbZ.nat ? lbZ.nat / (lbZ.bw * Math.min(window.devicePixelRatio || 1, 2)) : 0;
    lbZoomAt(clamp(Math.max(2.5, real), 1, LB_MAX), x, y, true);
  };
  const lbFit = reset => {
    const r = lbView.getBoundingClientRect(), it = lbItems[lbI]; if (!it) return;
    const m = lbVid.hidden ? lbImg : lbVid;
    const w = (lbVid.hidden ? lbImg.naturalWidth : lbVid.videoWidth) || it.w, h = (lbVid.hidden ? lbImg.naturalHeight : lbVid.videoHeight) || it.h;
    lbZ.W = r.width; lbZ.H = r.height;
    const k = Math.min(lbZ.W / w, lbZ.H / h);
    lbZ.bw = w * k; lbZ.bh = h * k; lbZ.ox = (lbZ.W - lbZ.bw)/2; lbZ.oy = (lbZ.H - lbZ.bh)/2;
    m.style.width = lbZ.bw.toFixed(1) + 'px'; m.style.height = lbZ.bh.toFixed(1) + 'px';
    if (reset) { lbZ.s = 1; lbZ.tx = 0; lbZ.ty = 0; } else lbClamp();
    lbEase(false); lbApply();
  };
  const lbShow = i => {
    const n = lbItems.length; lbI = (i + n) % n;
    const it = lbItems[lbI];
    lbCap.textContent = it.cap; lbN.textContent = pad(lbI + 1) + ' / ' + pad(n);
    lbZ.nat = 0;
    if (it.video) {
      lbImg.hidden = true; lbImg.removeAttribute('src');
      lbVid.hidden = false; lbVid.poster = it.poster || '';
      if (!lbVid.src.endsWith(it.video)) lbVid.src = it.video;
      lbVid.defaultPlaybackRate = lbVid.playbackRate = it.rate || 1;
      if (motion) playV(lbVid);
      lbHint.textContent = '';
    } else {
      lbVid.pause(); lbVid.hidden = true; lbVid.removeAttribute('src'); try { lbVid.load(); } catch(e) {}
      lbImg.hidden = false; lbImg.alt = it.alt || '';
      // l'image déjà affichée d'abord (instantanée), puis la meilleure version
      lbImg.src = it.now || it.full;
      if (it.full && it.full !== it.now) { const hi = new Image(); hi.onload = () => { if (lbItems[lbI] === it && lbOpen) lbImg.src = it.full; }; hi.src = it.full; }
      lbHint.textContent = fine.matches ? lng('← → pour changer d\'image · Échap pour fermer', '← → to browse · Esc to close') : lng('Touchez pour zoomer', 'Tap to zoom');
    }
    lbFit(true);
    // images voisines préparées
    [lbI + 1, lbI - 1].forEach(j => { const nb = lbItems[(j + n) % n]; if (nb && nb.full) { const im = new Image(); im.src = nb.full; } });
  };
  const lbGo = d => { if (lbItems.length > 1) lbShow(lbI + d); };
  function lbOpenAt(items, i, onClose){
    if (!lbEl) lbBuild();
    lbItems = items; lbOnClose = onClose; lbBack = document.activeElement;
    lbOpen = true; lbEl.hidden = false; root.classList.add('lb-on');
    lbShow(i);
    requestAnimationFrame(() => lbEl.classList.add('on'));
    lbX.focus({preventScroll:true});
    // le bouton retour du téléphone ferme l'image au lieu de quitter la page
    try { history.pushState({ lb: 1 }, ''); lbPushed = true; } catch(e) { lbPushed = false; }
  }
  function lbClose(fromPop){
    if (!lbOpen) return;
    lbOpen = false;
    lbEl.classList.remove('on'); root.classList.remove('lb-on');
    lbVid.pause();
    setTimeout(() => { if (!lbOpen) { lbEl.hidden = true; lbImg.removeAttribute('src'); lbVid.removeAttribute('src'); try { lbVid.load(); } catch(e) {} } }, 260);
    if (lbPushed && !fromPop) { lbIgnorePop = true; history.back(); }
    lbPushed = false;
    if (lbOnClose) lbOnClose(lbI);
    if (lbBack && lbBack.focus && document.contains(lbBack)) lbBack.focus({preventScroll:true});
  }
  lbPop = () => { if (lbIgnorePop) { lbIgnorePop = false; return true; } if (lbOpen) { lbClose(true); return true; } return false; };
  window.addEventListener('popstate', () => { if (!document.querySelector('[role="tab"]') && lbPop) lbPop(); });

  const VW_DUR = 3600, viewers = [];
  $$('[data-vw]').forEach(vw => {
    const figs = $$('.vw-f', vw), thumbs = $$('.vw-t', vw), stage = vw.querySelector('.vw-stage'), capEl = vw.querySelector('.vw-cap'), numEl = vw.querySelector('.vw-n');
    const n = figs.length, st = { cur: -1, t0: 0, vis: false, hover: false, hold: 0, wait: false, waitT: 0 };
    figs.forEach(f => {
      const v = f.querySelector('video'); if (!v) return;
      // data-rate : vidéo ralentie (le saut du coureur d'Oakley × Meta passe à mi-vitesse, comme sur l'accueil)
      const r = parseFloat(v.dataset.rate || '1'); if (r !== 1) { v.defaultPlaybackRate = r; v.playbackRate = r; }
      v.addEventListener('playing', () => { if (st.wait && figs[st.cur] === f) { st.wait = false; st.t0 = performance.now(); } });
    });
    const load = i => { const m = figs[i].querySelector('img,video'); if (m && m.dataset.src) { if (m.dataset.srcset) m.srcset = m.dataset.srcset; m.src = m.dataset.src; m.removeAttribute('data-src'); m.removeAttribute('data-srcset'); } };
    const show = (i, user) => {
      i = (i + n) % n; if (i === st.cur) return;
      load(i); load((i + 1) % n);
      figs.forEach((f, k) => { f.classList.toggle('on', k === i); const v = f.querySelector('video'); if (v) { if (k === i && motion) { if (f.dataset.dur) try { v.currentTime = 0; } catch(e) {} if (st.vis) playV(v); } else v.pause(); } });
      // un film pas encore chargé : le minuteur attend qu'il commence vraiment (au plus 4 s), sinon il était passé avant d'avoir été vu
      const cv = figs[i].querySelector('video'); st.wait = !!(cv && figs[i].dataset.dur && cv.readyState < 3); st.waitT = 0;
      thumbs.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-current', String(k === i)); if (k !== i) t.style.removeProperty('--t'); });
      if (capEl) capEl.textContent = figs[i].dataset.cap || '';
      if (numEl) numEl.textContent = `${pad(i + 1)} / ${pad(n)}`;
      st.cur = i; st.t0 = performance.now();
      if (user) st.hold = performance.now() + 9000;
      // la vignette en cours reste visible dans la planche (téléphone)
      const strip = thumbs[i].parentElement;
      if (strip.scrollWidth > strip.clientWidth + 2) { const tl = thumbs[i].offsetLeft - strip.clientWidth/2 + thumbs[i].offsetWidth/2; strip.scrollTo({ left: tl, behavior: motion ? 'smooth' : 'auto' }); }
    };
    thumbs.forEach((t, k) => t.addEventListener('click', () => show(k, true)));
    let sx = null, sy = 0, swiped = false;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; swiped = false; });
    stage.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; show(st.cur + (dx < 0 ? 1 : -1), true); } });
    // un clic ouvre la vue en grand ; en la fermant, la visionneuse reste sur la dernière image regardée
    const title = (vw.closest('section') && vw.closest('section').querySelector('.camp-title')) ? vw.closest('section').querySelector('.camp-title').textContent.trim() : '';
    const items = () => figs.map(f => {
      const im = f.querySelector('img'), v = f.querySelector('video'), cap = f.dataset.cap || '';
      const lab = title && cap ? title + ' · ' + cap : (cap || title);
      if (v) return { video: v.getAttribute('src') || v.dataset.src, poster: v.getAttribute('poster') || v.dataset.poster || '', rate: parseFloat(v.dataset.rate || '1'), cap: lab, w: 16, h: 9 };
      return { full: bestSrc(im), now: im.currentSrc || '', alt: im.alt, cap: lab, w: +im.getAttribute('width') || 16, h: +im.getAttribute('height') || 9 };
    });
    stage.addEventListener('click', () => {
      if (swiped) { swiped = false; return; }
      figs.forEach(f => { const v = f.querySelector('video'); if (v) v.pause(); });
      lbOpenAt(items(), st.cur, i => { if (i !== st.cur) show(i, true); else { st.hold = performance.now() + 9000; const v = figs[st.cur].querySelector('video'); if (v && st.vis && motion) playV(v); } });
    });
    stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') st.hover = true; });
    stage.addEventListener('pointerleave', () => { st.hover = false; });
    vw.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(st.cur + (e.key === 'ArrowRight' ? 1 : -1), true); const t = thumbs[st.cur]; if (t && vw.contains(document.activeElement)) t.focus({preventScroll:true}); } });
    new IntersectionObserver(es => es.forEach(en => { const was = st.vis; st.vis = en.isIntersecting && en.intersectionRatio > .45; if (!st.vis) { st.t0 = performance.now(); st.waitT = 0; }
      // de retour à l'écran : l'image reprend là où elle en était (avant, après un détour, elle était passée aussitôt)
      else if (!was && st.cur >= 0) st.t0 = performance.now() - (parseFloat(thumbs[st.cur].style.getPropertyValue('--t')) || 0) * (parseFloat(figs[st.cur].dataset.dur) || VW_DUR); vw._vis = st.vis; figs.forEach((f, k) => { const v = f.querySelector('video'); if (v) { if (st.vis && k === st.cur && motion) playV(v); else v.pause(); } }); }), {threshold:[0,.45,.7]}).observe(stage);
    show(0);
    viewers.push(now => {
      if (!st.vis) return;
      const t = thumbs[st.cur];
      // une vidéo reste à l'écran le temps de sa durée (data-dur, en ms), une image 3,6 s
      const dur = parseFloat(figs[st.cur].dataset.dur) || VW_DUR;
      if (!motion || st.hover || now < st.hold || lbOpen) { st.t0 = now - (parseFloat(t.style.getPropertyValue('--t')) || 0) * dur; return; }
      if (st.wait) { if (!st.waitT) st.waitT = now; if (now - st.waitT < 4000) { st.t0 = now; return; } st.wait = false; }
      const k = (now - st.t0) / dur;
      if (k >= 1) { show(st.cur + 1); return; }
      t.style.setProperty('--t', k.toFixed(3));
    });
  });

  /* ---------- Liens internes : défilement doux, durée selon la distance ---------- */
  let glide = null;
  const easeGlide = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  function stopGlide(){ if (glide) { cancelAnimationFrame(glide.raf); glide = null; } }
  function glideTo(target, focusEl){
    stopGlide();
    const destY = () => target === 0 ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - (target.id === 'top' ? 0 : bandH()));
    const y0 = window.scrollY, dist = Math.abs(destY() - y0);
    const done = () => { if (focusEl) { if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex','-1'); focusEl.focus({preventScroll:true}); } };
    if (!motion || dist < 2) { window.scrollTo(0, destY()); done(); return; }
    const dur = clamp(620 + 230*Math.log2(1 + dist/400), 700, 1700), t0 = performance.now();
    glide = { raf: 0 };
    const step = now => {
      const t = clamp((now - t0)/dur, 0, 1), e = easeGlide(t);
      window.scrollTo(0, y0 + (destY() - y0)*e);
      if (t < 1) glide.raf = requestAnimationFrame(step); else { glide = null; done(); }
    };
    glide.raf = requestAnimationFrame(step);
  }
  // l'utilisateur reprend la main dès qu'il fait défiler lui-même
  ['wheel','touchstart','keydown'].forEach(ev => window.addEventListener(ev, stopGlide, {passive:true}));

  /* ---------- Projets : deux onglets (Campagnes, Clips), chacun avec son adresse ---------- */
  // (l'index des prestations de la page Services est aussi une liste d'onglets : il garde son propre code)
  const tablist = $('[role="tablist"]:not(.ix-tabs)');
  if (tablist) {
    const tabs = $$('[role="tab"]', tablist);
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
    const keyOf = t => t.getAttribute('href').slice(1);
    const head = tablist.closest('.pj-head') || tablist;
    let curTab = -1;
    const showTab = i => {
      if (i === curTab) return;
      curTab = i;
      tabs.forEach((t,k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p,k) => { p.hidden = k !== i; if (k !== i) $$('video', p).forEach(v => { if (!v.paused) v.pause(); }); });
      root.dataset.tab = keyOf(tabs[i]);
      if (player.ctx && player.video && !panels[i].contains(player.video)) closePlayer(true);
      hidePeek();
      relayout();
    };
    // une adresse mène à un onglet par son nom (#campagnes, #clips) ou à une section qu'il contient (#avant-apres, #generique)
    const find = h => {
      const ti = tabs.findIndex(t => keyOf(t) === h);
      if (ti >= 0) return { i: ti, el: null };
      const el = h ? document.getElementById(h) : null;
      const pi = el ? panels.findIndex(p => p.contains(el)) : -1;
      return { i: pi, el: pi >= 0 ? el : null };
    };
    routeTo = (h, initial) => {
      const r = find(h);
      if (r.i < 0) return false;
      showTab(r.i);
      if (r.el) {
        if (initial) { const go = () => window.scrollTo(0, Math.max(0, r.el.getBoundingClientRect().top + window.scrollY - bandH())); go(); requestAnimationFrame(go); window.addEventListener('load', go, {once:true}); }
        else glideTo(r.el, r.el);
      } else if (!initial && window.scrollY > head.getBoundingClientRect().top + window.scrollY + 4) glideTo(head);
      return true;
    };
    tabs.forEach((t,i) => {
      t.addEventListener('click', e => { e.preventDefault(); if (i === curTab) return; history.pushState(null, '', '#' + keyOf(t)); showTab(i); });
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[j].focus(); tabs[j].click();
      });
    });
    const fromHash = initial => { const h = dec(location.hash.slice(1)); if (!h) { showTab(0); return; } if (!routeTo(h, initial) && curTab < 0) showTab(0); };
    window.addEventListener('popstate', () => { if (lbPop && lbPop()) return; fromHash(false); });
    window.addEventListener('hashchange', () => fromHash(false));
    tabsInit = () => fromHash(true);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = dec(a.getAttribute('href').slice(1)); if (!id) return;
    if (id === 'top') { e.preventDefault(); glideTo(0); return; }
    if (routeTo && routeTo(id, false)) { e.preventDefault(); history.pushState(null, '', '#' + id); return; }
    const el = document.getElementById(id); if (!el) return;
    e.preventDefault();
    glideTo(el, el);
  });

  /* ---------- Mouvement (bouton de l'accueil) ---------- */
  function applyMotion(){
    root.classList.toggle('motion-off', !motion);
    if (motionBtn) { motionBtn.setAttribute('aria-pressed', String(motion)); motionBtn.querySelector('span').textContent = motion ? lng('Mouvement activé', 'Motion on') : lng('Mouvement en pause', 'Motion paused'); }
    if (!motion) {
      $$('video').forEach(v => { if (v !== player.video) v.pause(); });
      // les projets du haut s'arrêtent sur leur belle image (chargée à ce moment-là seulement)
      $$('.slide .still[data-src]').forEach(im => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
    }
    else {
      CF.forEach(c => { if (c.vis && player.ctx !== c.ctx) playV(c.v); });
      if (ba && baVisible) playV(ba);
      if (tr && trVisible) playV(tr);
      if (playPreview && items[active]) playPreview(items[active]);
      inview.forEach(v => { if (v._in) playV(v); });
      $$('.vw-f.on video').forEach(v => { const w = v.closest('[data-vw]'); if (w && w._vis) playV(v); });
    }
  }
  if (motionBtn) motionBtn.addEventListener('click', e => { e.stopPropagation(); motion = !motion; sessStore.set('nova-motion', motion ? 'on' : 'off'); applyMotion(); });

  /* ---------- Boucle ---------- */
  const tcEl = $('#tc'), prog = $('#prog'), band = $('#band');
  let tcLast = '', progLast = '', bandSolid = null, bandMoved = null;
  function frame(now){
    // 1) lectures, avant toute écriture : la page est déjà calculée, ces mesures ne coûtent rien
    snapF();
    if (worksVisible && measureWorks) measureWorks();
    if (measureCredits) measureCredits();
    if (measureMt) measureMt();
    if (measurePeek) measurePeek();
    measureScrollFx(); measureSvc();
    // 2) écritures
    drawCursor();
    if (heroVisible && heroFrame) heroFrame(now);
    if (worksVisible && applyWorks) applyWorks(false);
    if (baVisible && baTick) baTick();
    if (trVisible && trTick) trTick();
    if (drawLit) drawLit();
    if (drawCredits) drawCredits(false);
    for (let i = 0; i < viewers.length; i++) viewers[i](now);
    if (drawPeek) drawPeek(now);
    drawScrollFx(); drawSvc();
    // timecode de la bande
    let src = null, fps = FPS;
    if (player.ctx) { src = player.video; fps = P[player.id].fps || FPS; }
    else if (heroVisible && heroFrame && F.sy < heroTop + heroStep*(N-1) + F.vh*.3) { src = SV[cur0]; fps = SID[cur0] === 'oakley' ? 24 : FPS; }
    else if (CF.some(c => c.vis)) { const c = CF.find(c => c.vis); src = c.v; fps = c.fps; }
    else if (baVisible) src = ba;
    else if (worksVisible && items[active]) src = items[active].querySelector('video');
    if (src && tcEl) { const s = tc(src.currentTime, fps); if (s !== tcLast) { tcLast = s; tcEl.textContent = s; } }
    for (let i = 0; i < CF.length; i++) { const c = CF[i]; if (c.vis && c.tcEl) { const s2 = tc(c.v.currentTime, c.fps); if (s2 !== c.last) { c.last = s2; c.tcEl.textContent = s2; } } }
    if (player.ctx) {
      const v = player.video, s3 = tc(v.currentTime, P[player.id].fps); if (pcCur.textContent !== s3) pcCur.textContent = s3;
      if (!seeking && v.duration) { const val = Math.round(v.currentTime/v.duration*1000); if (+seek.value !== val) seek.value = val; setS(seek, '--p', (val/10)+'%'); }
    }
    // la bande s'assombrit sous le contenu : après l'accueil en images, ou dès qu'on quitte le haut d'une autre page
    const solid = heroFrame ? F.sy > heroTop + heroStep*(N-1) + F.vh*.6 : F.sy > 8;
    if (band && solid !== bandSolid) { bandSolid = solid; band.classList.toggle('solid', solid); }
    const moved = F.sy > 24;
    if (band && moved !== bandMoved) { bandMoved = moved; band.classList.toggle('moved', moved); }
    if (prog) {
      const max = F.docH - F.vh;
      const pr = (F.sy / Math.max(1,max) * 180).toFixed(1);
      if (pr !== progLast) { progLast = pr; prog.style.transform = `rotate(${pr}deg)`; }
    }
    if (sbTick) sbTick();
    requestAnimationFrame(frame);
  }

  function relayout(force){ snapF(); readBand(); readDoc(); if (layoutHero) layoutHero(); if (layoutWorks) layoutWorks(); if (layoutCredits) layoutCredits(); }
  relayout();
  applyMotion();
  if (tabsInit) tabsInit();
  let rz = 0, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    // téléphone : la barre d'adresse qui se replie en défilant ne change que la hauteur de quelques dizaines de pixels.
    // On ne recalcule rien : avant, la hauteur du générique changeait (la page sautait sur iPhone) et les effets se reconstruisaient en plein geste.
    if (!fine.matches && w === lastW && Math.abs(h - lastH) < 160) return;
    lastW = w; lastH = h;
    cancelAnimationFrame(rz); rz = requestAnimationFrame(relayout);
  });
  if (document.fonts) document.fonts.ready.then(() => relayout(true));
  if (layoutHero) window.addEventListener('load', layoutHero);
  requestAnimationFrame(frame);
})();
