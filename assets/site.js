/* NOVA FOR VISION · script commun aux quatre pages (NOVA, Projets, Studio, Contact).
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
  let oak = null, oakVisible = false, oakTc = null, oakTcLast = '', tr = null, trVisible = false, trTick = null;
  let ba = null, baVisible = false, baTick = null;
  let items = [], active = -1, worksVisible = false, layoutWorks = null, applyWorks = null, playPreview = null, openWork = null, scrollToItem = null;
  let hidePeek = () => {}, drawPeek = null, drawLit = null, layoutCredits = null, drawCredits = null, drawDust = null;
  let parts = [], dc = null, dustBuilt = false, dustAwake = 0, ensureDust = null;
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

  /* ---------- Accueil : les projets phares qui glissent avec le défilement ---------- */
  const heroWrap = $('#top'), hero = $('#hero');
  if (hero && heroWrap) {
    const seam = $('#seam');
    const slides = $$('#stage .slide'), shades = slides.map(s => s.querySelector('.shade'));
    SV = slides.map(s => s.querySelector('video')); SID = slides.map(s => s.dataset.id);
    const caps = $$('#caps .cap'), ticks = $$('#ticks .tick');
    N = slides.length; heroVisible = true;
    let pos = 0, hTarget = 0, settleT = 0;
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
      heroStep = window.innerHeight * .7;
      heroTop = heroWrap.getBoundingClientRect().top + window.scrollY;
      readHero();
    };
    const scrollForSlide = i => heroTop + i*heroStep;
    // un tiret mène au projet ; le recalage ci-dessous attend la fin de ce défilement
    let heroAuto = 0;
    ticks.forEach((t,k) => t.addEventListener('click', e => { e.stopPropagation(); heroAuto = performance.now() + 1600; window.scrollTo({top: scrollForSlide(k), behavior: motion ? 'smooth' : 'auto'}); }));
    // après un arrêt du défilement, l'image se pose doucement sur le projet suivant dans le sens du geste ;
    // jamais pendant qu'un doigt est posé, et sur écran tactile seulement une fois l'élan terminé
    let touching = false, lastY = window.scrollY, lastDir = 0;
    const settleWait = fine.matches ? 260 : 450;
    function armSettle(){
      clearTimeout(settleT);
      if (touching) return;
      settleT = setTimeout(() => {
        if (!motion || player.ctx || touching || performance.now() < heroAuto) return;
        const p = (window.scrollY - heroTop) / heroStep;
        if (p <= 0.02 || p >= N - 1 - 0.02) return;
        const f = p - Math.floor(p);
        const r = lastDir > 0 ? (f > .15 ? Math.ceil(p) : Math.floor(p)) : lastDir < 0 ? (f < .85 ? Math.floor(p) : Math.ceil(p)) : Math.round(p);
        if (Math.abs(p - r) > .02) window.scrollTo({top: scrollForSlide(r), behavior:'smooth'});
      }, settleWait);
    }
    window.addEventListener('touchstart', () => { touching = true; clearTimeout(settleT); }, {passive:true});
    window.addEventListener('touchend', () => { touching = false; armSettle(); }, {passive:true});
    window.addEventListener('touchcancel', () => { touching = false; armSettle(); }, {passive:true});
    window.addEventListener('scroll', () => { const y = window.scrollY; if (y !== lastY) { lastDir = Math.sign(y - lastY); lastY = y; } armSettle(); }, {passive:true});
    heroClickable = () => !player.ctx && !introOn && Math.abs(pos - Math.round(pos)) < .04;
    hero.addEventListener('click', e => { if (!heroClickable() || e.target.closest('a,.hbar,.pc,.cap-a')) return; openHero(); });
    $$('#caps [data-play]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openHero(); }));
    hero.setAttribute('data-cursor', lng('Lire', 'Play'));
    if (!fine.matches) $('#hhint').textContent = lng('Faites défiler pour changer de projet', 'Scroll to change project');
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
    heroFrame = () => {
      hTarget = clamp((F.sy - heroTop) / heroStep, 0, N-1);
      if (player.ctx === 'hero' && Math.abs(hTarget - cur0) > .25) closePlayer(true);
      pos = (!motion) ? hTarget : lerp(pos, hTarget, .1);
      if (Math.abs(pos - hTarget) < .0005) pos = hTarget;
      // rideau : la slide suivante se découvre de droite à gauche, son film arrive en léger travelling ; la précédente recule dans l'ombre
      let seamX = 0, seamO = 0;
      const SL = HH*SLANT;
      // retard du rideau sur le défilement (positif en descendant) : le milieu plie dans l'autre sens, au plus 4 % de la largeur
      const lim = HW*.04, want = motion ? clamp((hTarget - pos)*HW*.1, -lim, lim) : 0;
      bend = motion ? lerp(bend, want, .18) : 0; if (Math.abs(bend) < .05) bend = 0;
      const b2 = (2*bend).toFixed(1);
      slides.forEach((sl,i) => {
        const v = SV[i];
        const t = i === 0 ? 1 : clamp(pos - (i-1), 0, 1), e = easeIO(t);
        const k = i < N-1 ? clamp(pos - i, 0, 1) : 0, ek = easeIO(k);
        const xc = (HW + SL/2) - e*(HW + SL);
        if (i > 0) setV(sl, 'c'+e.toFixed(4)+'_'+HW+'_'+HH+'_'+b2, e >= .9999 ? 'clip-path:inset(0 0 0 0)' : e <= 0 ? `clip-path:polygon(${(xc + SL/2).toFixed(1)}px 0,100% 0,100% 100%,${(xc - SL/2).toFixed(1)}px 100%)` : `clip-path:path('M ${(xc + SL/2).toFixed(1)} 0 L ${HW} 0 L ${HW} ${HH} L ${(xc - SL/2).toFixed(1)} ${HH} Q ${(xc + 2*bend).toFixed(1)} ${(HH/2).toFixed(1)} ${(xc + SL/2).toFixed(1)} 0 Z')`);
        // la vidéo glisse un peu mais couvre toujours tout l'écran : l'échelle compense le décalage (sinon des coins noirs apparaissent le long de la jointure oblique)
        const tx = (1-e)*10 - ek*8, sc = 1.004 + Math.abs(tx)/50 + (1-e)*.04;
        setV(v, 'v'+tx.toFixed(2)+sc.toFixed(3), tx === 0 && e >= 1 && ek <= 0 ? '' : `transform:translate3d(${tx.toFixed(2)}%,0,0) scale(${sc.toFixed(3)})`);
        setV(shades[i], 's'+ek.toFixed(3), `opacity:${(ek*.55).toFixed(3)}`);
        if (i > 0 && t > 0 && t < 1) { seamX = xc; seamO = Math.sin(Math.PI*t); }
      });
      setS(seam, 'transform', `translate3d(${(seamX + bend).toFixed(1)}px,0,0) rotate(${SLANT_DEG}deg) scaleY(${seamScale})`);
      setS(seam, 'opacity', seamO.toFixed(3));
      setS(seamC, 'opacity', seamO.toFixed(3));
      if (seamO > 0) { const d = `M ${(seamX + SL/2).toFixed(1)} 0 Q ${(seamX + 2*bend).toFixed(1)} ${(HH/2).toFixed(1)} ${(seamX - SL/2).toFixed(1)} ${HH}`; if (d !== seamD) { seamD = d; seamP.setAttribute('d', d); } }
      heroDust(seamX, SL, seamO, bend);
      // boucle Oakley sans le logo
      if (oakV && oakLoopOwn() && oakV.duration && !oakV.paused && oakV.currentTime > oakV.duration - .09) oakV.currentTime = LOGO_END;
      if (cur0 === 0 && !introOn && caps[0].getAttribute('aria-hidden') === 'false' && !caps[0].classList.contains('on') && !logoHold()) caps[0].classList.add('on');
      LG.forEach((L,i) => {
        if (!L || !lgOwn(L)) return;
        if (L.v.duration && !L.v.paused && L.v.currentTime > L.v.duration - .09) L.v.currentTime = L.end;
        if (i === cur0 && caps[i].getAttribute('aria-hidden') === 'false' && !caps[i].classList.contains('on') && !lgHold(i)) caps[i].classList.add('on');
      });
      const ci = clamp(Math.round(pos), 0, N-1);
      if (ci !== cur0 && !introOn) setCurrent(ci);
      tickI.forEach((ti,i) => { const f = i === 0 ? 1 : clamp(pos - (i-1), 0, 1); setS(ti, 'transform', `scaleX(${f.toFixed(3)})`); });
      // seuls les films visibles jouent
      SV.forEach((v,i) => {
        if (player.ctx === 'hero' && i === cur0) return;
        const vis = i === Math.floor(pos) || i === Math.ceil(pos);
        const want = heroVisible && motion && vis, L = LG[i];
        // film à logo sorti de l'écran : il reprendra au logo la prochaine fois
        if (L && !vis && heroVisible && lgOwn(L) && (L.v.currentTime > 0 || L.done)) { if (!v.paused) v.pause(); try { v.currentTime = 0; } catch(e){} L.done = false; }
        if (want && v.paused) { if (L && v.currentTime < L.end) L.t0 = performance.now(); playV(v); } else if (!want && !v.paused) v.pause();
      });
    };
    new IntersectionObserver(es => es.forEach(en => { heroVisible = en.isIntersecting; if (!heroVisible) { if (player.ctx === 'hero') closePlayer(true); SV.forEach(v => { if (!v.paused) v.pause(); }); } }), {threshold:0}).observe(heroWrap);
    window.addEventListener('load', () => { [SV[1], SV[2]].forEach(v => { if (v && v.dataset.poster) { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); } }); });
    window.addEventListener('load', () => { if (!fastNet || window.innerWidth < 761) return; setTimeout(() => warmV(SV[1]), 4000); setTimeout(() => warmV(SV[2]), 6000); });
    window.addEventListener('scroll', () => { if (window.scrollY > heroTop + 8) warmV(SV[1]); if (window.scrollY > heroTop + heroStep*.6) warmV(SV[2]); }, {passive:true});
  }

  /* ---------- Campagne (projets) ---------- */
  oak = $('#oak');
  if (oak) {
    const oakFilm = $('#camp-film'), oakSound = $('#oak-sound');
    oakTc = $('#oak-tc');
    new IntersectionObserver(es => es.forEach(en => {
      oakVisible = en.isIntersecting && en.intersectionRatio > .25;
      if (player.ctx === 'camp') { if (!en.isIntersecting) closePlayer(true); return; }
      if (oakVisible && motion) playV(oak); else if (!oakVisible) oak.pause();
    }), {threshold:[0,.25,.6]}).observe(oakFilm);
    oakSound.addEventListener('click', e => {
      e.stopPropagation();
      const on = oakSound.getAttribute('aria-pressed') !== 'true';
      oakSound.setAttribute('aria-pressed', String(on)); oakSound.textContent = on ? lng('Son coupé', 'Sound off') : lng('Son', 'Sound');
      oak.muted = !on; if (on) playV(oak);
    });
    const openOak = () => { if (player.ctx === 'camp') return; oakFilm.classList.add('playing'); openPlayer('camp', oak, 'oakley', $('#pslot-camp'), () => { oakFilm.classList.remove('playing'); if (motion && oakVisible) playV(oak); }); };
    $('#oak-play').addEventListener('click', () => {
      const r = oakFilm.getBoundingClientRect(), top = bandH() + 8;
      if (r.top < top - 1 || r.bottom > window.innerHeight) window.scrollTo({top: r.top + window.scrollY - top, behavior: motion ? 'smooth' : 'auto'});
      openOak();
    });
    oakFilm.addEventListener('click', () => { if (player.ctx === 'camp') { togglePlay(); return; } openOak(); });
  }
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
    // l'envoi : la phrase se défait en poussière qui rejoint l'étoile du bas
    const dissolve = done => {
      if (!motion || !dustBuilt || !parts.length || !dc) { done(); return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cv = document.createElement('canvas'); cv.className = 'fly'; cv.width = Math.round(innerWidth*dpr); cv.height = Math.round(innerHeight*dpr);
      document.body.appendChild(cv); const cx = cv.getContext('2d');
      const rects = [];
      sen.childNodes.forEach(n => { if (n.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(r => rects.push(r)); } else rects.push(n.getBoundingClientRect()); });
      const area = rects.reduce((a,r) => a + r.width*r.height, 0) || 1;
      const dr = dc.getBoundingClientRect(), k = dr.width / dc.width;
      const fl = [];
      const COUNT = 900;
      rects.forEach(r => { const n = Math.round(COUNT * r.width*r.height/area); for (let i = 0; i < n; i++) { const t = parts[(Math.random()*parts.length)|0]; fl.push({ x0:(r.left + Math.random()*r.width)*dpr, y0:(r.top + r.height*.25 + Math.random()*r.height*.6)*dpr, x1:(dr.left + t.hx*k)*dpr, y1:(dr.top + t.hy*k)*dpr, d:Math.random()*350, du:900 + Math.random()*500, bx:(Math.random()-.5)*260*dpr, by:-(80 + Math.random()*160)*dpr, s:(.8 + Math.random()*1.2)*dpr }); } });
      sentence.classList.add('gone');
      const t0 = performance.now(); let fired = false;
      (function step(now){
        const t = now - t0; cx.clearRect(0,0,cv.width,cv.height); cx.fillStyle = fgCol; let alive = 0;
        for (const f of fl) {
          const e = clamp((t - f.d)/f.du, 0, 1); if (e < 1) alive++;
          const q = 1 - Math.pow(1-e, 3), mx = (f.x0 + f.x1)/2 + f.bx, my = (f.y0 + f.y1)/2 + f.by;
          const x = (1-q)*(1-q)*f.x0 + 2*(1-q)*q*mx + q*q*f.x1, y = (1-q)*(1-q)*f.y0 + 2*(1-q)*q*my + q*q*f.y1;
          cx.globalAlpha = e < 1 ? .9 : 0; cx.fillRect(x, y, f.s, f.s);
        }
        if (!fired && t > 1150) { fired = true; parts.forEach(pp => { pp.vx += (Math.random()-.5)*6; pp.vy += (Math.random()-.5)*6; }); dustAwake = 240; done(); }
        if (alive || t < 1200) requestAnimationFrame(step); else { cv.remove(); setTimeout(() => sentence.classList.remove('gone'), 600); }
      })(t0);
    };
    // à l'arrivée sur la page, la phrase sort de l'étoile en poussière et vient se poser à sa place (l'inverse de l'envoi)
    const assemble = () => {
      const show = () => { sentence.classList.add('ready'); sentence.classList.remove('gone'); };
      if (!motion || !ensureDust) { show(); return; }
      sentence.classList.add('gone'); sentence.classList.add('ready');
      let started = false;
      const fail = setTimeout(() => { if (!started) { started = true; show(); } }, 1600);
      ensureDust(() => {
        if (started) return; started = true; clearTimeout(fail);
        if (!parts.length || !dc) { show(); return; }
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cv = document.createElement('canvas'); cv.className = 'fly'; cv.width = Math.round(innerWidth*dpr); cv.height = Math.round(innerHeight*dpr);
        document.body.appendChild(cv); const cx = cv.getContext('2d');
        const rects = [];
        sen.childNodes.forEach(n => { if (n.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(r => rects.push(r)); } else rects.push(n.getBoundingClientRect()); });
        const area = rects.reduce((a,r) => a + r.width*r.height, 0) || 1;
        const dr = dc.getBoundingClientRect(), k = dr.width / dc.width;
        const fl = [], COUNT = 900;
        rects.forEach(r => { const n = Math.round(COUNT * r.width*r.height/area); for (let i = 0; i < n; i++) { const t = parts[(Math.random()*parts.length)|0]; fl.push({ x0:(dr.left + t.hx*k)*dpr, y0:(dr.top + t.hy*k)*dpr, x1:(r.left + Math.random()*r.width)*dpr, y1:(r.top + r.height*.25 + Math.random()*r.height*.6)*dpr, d:Math.random()*350, du:900 + Math.random()*500, bx:(Math.random()-.5)*260*dpr, by:-(80 + Math.random()*160)*dpr, s:(.8 + Math.random()*1.2)*dpr }); } });
        // l'étoile frémit en lâchant sa poussière
        parts.forEach(pp => { pp.vx += (Math.random()-.5)*6; pp.vy += (Math.random()-.5)*6; }); dustAwake = 240;
        const t0 = performance.now(); let shown = false;
        (function step(now){
          const t = now - t0; cx.clearRect(0,0,cv.width,cv.height); cx.fillStyle = fgCol; let alive = 0;
          for (const f of fl) {
            const e = clamp((t - f.d)/f.du, 0, 1); if (e < 1) alive++;
            const q = 1 - Math.pow(1-e, 3), mx = (f.x0 + f.x1)/2 + f.bx, my = (f.y0 + f.y1)/2 + f.by;
            const x = (1-q)*(1-q)*f.x0 + 2*(1-q)*q*mx + q*q*f.x1, y = (1-q)*(1-q)*f.y0 + 2*(1-q)*q*my + q*q*f.y1;
            cx.globalAlpha = e < 1 ? .9*(1 - Math.pow(e, 4)) : 0; cx.fillRect(x, y, f.s, f.s);
          }
          if (!shown && t > 1000) { shown = true; show(); }
          if (alive || t < 1100) requestAnimationFrame(step); else cv.remove();
        })(t0);
      });
    };
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

  /* ---------- Grands titres : une poussière discrète se détache des lettres sous le curseur ---------- */
  const hovC = document.createElement('canvas'); hovC.className = 'hov-dust'; hovC.setAttribute('aria-hidden','true'); document.body.appendChild(hovC);
  const hovX = hovC.getContext('2d'), hovP = []; let hovDirty = false;
  // masqué tant qu'aucune poussière ne vole (sur téléphone, il ne sert jamais) : une couche plein écran de moins à composer
  setS(hovC, 'visibility', 'hidden');
  const hovEls = $$('.dhov');
  // relevé des pixels des lettres, caractère par caractère (gère les lignes, les lettres animées et la couleur de chaque ligne)
  function sampleGlyphs(el){
    const er = el.getBoundingClientRect(), pts = [];
    const oc = document.createElement('canvas'); oc.width = Math.ceil(er.width); oc.height = Math.ceil(er.height);
    if (!oc.width || !oc.height) return pts;
    const ox = ctxRead(oc), rg = document.createRange(), cols = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const pe = n.parentElement, cs = getComputedStyle(pe), fs = parseFloat(cs.fontSize);
      let ci = cols.indexOf(cs.color); if (ci < 0) { cols.push(cs.color); ci = cols.length - 1; }
      ox.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`; ox.textBaseline = 'alphabetic'; ox.fillStyle = `rgb(${ci*40 + 20},0,0)`;
      const tx = n.textContent;
      for (let i = 0; i < tx.length; i++) {
        if (!tx[i].trim()) continue;
        rg.setStart(n, i); rg.setEnd(n, i + 1);
        const r = rg.getBoundingClientRect(); if (!r.width) continue;
        const mt = ox.measureText(tx[i]), asc = mt.fontBoundingBoxAscent || fs*.8, desc = mt.fontBoundingBoxDescent || fs*.2;
        ox.fillText(tx[i], r.left - er.left, r.top - er.top + (r.height - (asc + desc))/2 + asc);
      }
    }
    let d; try { d = ox.getImageData(0,0,oc.width,oc.height).data; } catch(_) { return pts; }
    const st = parseFloat(getComputedStyle(el).fontSize) > 90 ? 3 : 2;
    for (let y = 0; y < oc.height; y += st) for (let x = 0; x < oc.width; x += st) { const k = (y*oc.width + x)*4; if (d[k+3] > 140) pts.push(x, y, Math.round((d[k]/(d[k+3]/255) - 20)/40)); }
    el._cols = cols;
    return pts;
  }
  hovEls.forEach(el => {
    let lx = null, ly = null;
    el.addEventListener('pointerleave', () => { lx = ly = null; });
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !motion || reduce || introOn) return;
      const r = el.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      const moved = lx === null ? 0 : Math.hypot(mx - lx, my - ly); lx = mx; ly = my;
      if (moved < 1.5) return;
      if (!el._g || el._gw !== Math.round(r.width)) { if (el.classList.contains('rv') || el.classList.contains('chars')) { if (!el.classList.contains('in')) return; } el._g = sampleGlyphs(el); el._gw = Math.round(r.width); }
      const g = el._g, R = 34, near = [];
      for (let i = 0; i < g.length; i += 3) { const dx = g[i] - mx, dy = g[i+1] - my; if (dx*dx + dy*dy < R*R) near.push(i); }
      if (!near.length) return;
      const n = Math.min(4, 1 + Math.floor(moved*.08));
      for (let k = 0; k < n && hovP.length < 120; k++) {
        const i = near[(Math.random()*near.length) | 0], gx = g[i], gy = g[i+1];
        const dx = gx - mx, dy = gy - my, dl = Math.hypot(dx, dy) || 1, sp = .15 + Math.random()*.45;
        hovP.push({ x: r.left + gx + scrollX, y: r.top + gy + scrollY, vx: dx/dl*sp + (Math.random()-.5)*.2, vy: dy/dl*sp*.6 - (.12 + Math.random()*.3), life: 1, dec: .011 + Math.random()*.014, s: 1 + Math.random()*.9, c: el._cols[g[i+2]] || fgCol });
      }
    }, {passive:true});
  });
  window.addEventListener('resize', () => hovEls.forEach(el => { el._g = null; }));
  function drawHoverDust(){
    if (!hovP.length) { if (hovDirty) { hovX.clearRect(0,0,hovC.width,hovC.height); hovDirty = false; setS(hovC, 'visibility', 'hidden'); } return; }
    setS(hovC, 'visibility', 'visible');
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(F.vw*dpr), H = Math.round(F.vh*dpr);
    if (hovC.width !== W || hovC.height !== H) { hovC.width = W; hovC.height = H; }
    hovX.setTransform(1,0,0,1,0,0); hovX.clearRect(0,0,W,H); hovX.setTransform(dpr,0,0,dpr,-F.sx*dpr,-F.sy*dpr);
    for (let i = hovP.length - 1; i >= 0; i--) {
      const p = hovP[i]; p.x += p.vx; p.y += p.vy; p.vx *= .985; p.vy *= .985; p.life -= p.dec;
      if (p.life <= 0) { hovP.splice(i,1); continue; }
      hovX.globalAlpha = Math.min(1, p.life*1.4)*.7; hovX.fillStyle = p.c; hovX.fillRect(p.x, p.y, p.s, p.s);
    }
    hovX.globalAlpha = 1; hovX.setTransform(1,0,0,1,0,0); hovDirty = true;
  }

  /* ---------- L'étoile de poussière (accueil, contact) ---------- */
  const dust = $('#dust');
  if (dust) {
    dc = $('#dust-c'); const dctx = dc.getContext('2d');
    let dustVis = false, dustIn = false, dustK = 1, dustW = 0, dustH = 0;
    const dm = { x:-9999, y:-9999, on:false };
    const dustWait = []; let dustBuilding = false;
    const buildDust = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = dust.clientWidth, h = dust.clientHeight; dustW = w; dustH = h;
      if (!w || !h) return;
      dustBuilding = true;
      dc.width = Math.round(w*dpr); dc.height = Math.round(h*dpr);
      const img = new Image();
      img.onload = () => {
        const oc = document.createElement('canvas'); oc.width = dc.width; oc.height = dc.height;
        const ox = ctxRead(oc);
        const sw = Math.min(dc.width, dc.height*2.7633), sh = sw/2.7633;
        ox.drawImage(img, (dc.width - sw)/2, (dc.height - sh)/2, sw, sh);
        let data; try { data = ox.getImageData(0, 0, oc.width, oc.height).data; } catch(e) { return; }
        const step = Math.max(2, Math.round(3*dpr*(w < 600 ? .85 : 1)));
        parts = [];
        for (let y = 0; y < oc.height; y += step) for (let x = 0; x < oc.width; x += step) {
          const jx = x + (Math.random()-.5)*step*.6, jy = y + (Math.random()-.5)*step*.6;
          const a = data[((Math.round(jy)|0)*oc.width + (Math.round(jx)|0))*4 + 3];
          if (a > 110) parts.push({ hx:jx, hy:jy, x: dustIn ? jx : Math.random()*oc.width, y: dustIn ? jy : jy + (Math.random()-.5)*oc.height*.9, vx:0, vy:0, s:(.7 + Math.random()*.8)*dpr, a:Math.round((.45 + Math.random()*.55)*100)/100 });
        }
        // grains rangés par opacité : le dessin ne change d'opacité qu'une cinquantaine de fois par image au lieu d'une fois par grain
        // (même couleur pour tous les grains : l'ordre de dessin ne change pas le résultat)
        parts.sort((p, q) => p.a - q.a);
        dustK = dc.width / Math.max(1, w);
        dustBuilt = true; dustAwake = 240; dustBuilding = false;
        dustWait.splice(0).forEach(f => f());
      };
      img.onerror = () => { dustBuilding = false; };
      img.src = '/assets/nova-star.svg';
    };
    dust.addEventListener('pointermove', e => { const r = dc.getBoundingClientRect(); const k = dc.width / r.width; dm.x = (e.clientX - r.left)*k; dm.y = (e.clientY - r.top)*k; dm.on = true; dustAwake = 240; });
    dust.addEventListener('pointerleave', () => { dm.on = false; dm.x = dm.y = -9999; dustAwake = 240; });
    new IntersectionObserver(es => es.forEach(en => { dustVis = en.isIntersecting; if (dustVis) { if (!dustBuilt) buildDust(); else if (!dustIn) dustAwake = 240; } }), {threshold:.15}).observe(dust);
    drawDust = () => {
      if (!dustVis || !dustBuilt) return;
      if (!dustIn) { dustIn = true; dustAwake = 260; }
      if (dustAwake <= 0 && !dm.on) return;
      dustAwake--;
      const R = 90 * dustK, R2 = R*R;
      const still = !motion;
      dctx.clearRect(0, 0, dc.width, dc.height);
      dctx.fillStyle = fgCol;
      let moving = 0, la = -1;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (still) { p.x = p.hx; p.y = p.hy; }
        else {
          const dx = p.x - dm.x, dy = p.y - dm.y, d2 = dx*dx + dy*dy;
          if (dm.on && d2 < R2) { const d = Math.sqrt(d2) || 1, f = (1 - d/R) * 2.4; p.vx += dx/d*f; p.vy += dy/d*f; }
          p.vx += (p.hx - p.x) * .045; p.vy += (p.hy - p.y) * .045;
          p.vx *= .84; p.vy *= .84;
          p.x += p.vx; p.y += p.vy;
          if (Math.abs(p.vx) + Math.abs(p.vy) > .05) moving++;
        }
        if (p.a !== la) { la = p.a; dctx.globalAlpha = la; }
        dctx.fillRect(p.x, p.y, p.s, p.s);
      }
      dctx.globalAlpha = 1;
      if (moving) dustAwake = Math.max(dustAwake, 20);
    };
    // reconstruite seulement si sa taille change (sur téléphone, la barre d'adresse qui se replie déclenchait une reconstruction en plein défilement)
    window.addEventListener('resize', () => { if (dustBuilt && (dust.clientWidth !== dustW || dust.clientHeight !== dustH)) { dustBuilt = false; dustIn = true; if (dustVis) buildDust(); } });
    // construit l'étoile même hors de l'écran quand un autre bloc en a besoin (la phrase de Contact en sort à l'arrivée)
    ensureDust = cb => { if (dustBuilt) { cb(); return; } dustWait.push(cb); if (!dustBuilding) buildDust(); };
  }

  /* ---------- Révélations ---------- */
  $$('.h2.rv>span').forEach(s => { const li = document.createElement('span'); li.className = 'li'; while (s.firstChild) li.appendChild(s.firstChild); s.appendChild(li); });
  // les éléments masqués (clip-path) sont observés via leur parent, sinon ils ne croisent jamais l'écran
  const revIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { (en.target._rv || en.target).classList.add('in'); revIO.unobserve(en.target); } }), {threshold:.2, rootMargin:'0px 0px -5% 0px'});
  $$('.rv,.svc,.chars:not(.cap-t)').forEach(el => revIO.observe(el));
  $$('.clip-in').forEach(el => { const w = el.parentElement; w._rv = el; revIO.observe(w); });

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
  /* ---------- Projets : image en grand, zoom et déplacement ----------
     Un clic sur une image d'une visionneuse l'ouvre en plein écran.
     Zoom : clic ou toucher (bascule), molette, pincement ; déplacement au glissé ; flèches, Échap ;
     sur téléphone, glisser sur le côté change d'image, vers le bas ferme, et le bouton retour ferme aussi. */
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
      if (!gg.moved) { if (e.type === 'pointerup' && lbVid.hidden) lbToggle(p[0], p[1]); return; }
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
      if (!lbVid.hidden) return;
      const [x, y] = vxy(e), k = Math.exp(-e.deltaY * (e.ctrlKey ? .012 : .0025));
      lbEase(false); lbZoomAt(lbZ.s * k, x, y);
    }, {passive:false});
    // la page derrière ne défile pas (iOS ignore parfois overflow:hidden)
    lbEl.addEventListener('touchmove', e => e.preventDefault(), {passive:false});
    document.addEventListener('keydown', e => {
      if (!lbOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); lbClose(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); lbGo(e.key === 'ArrowRight' ? 1 : -1); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); lbZoomAt(lbZ.s * 1.5, lbZ.W/2, lbZ.H/2, true); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); lbZoomAt(lbZ.s / 1.5, lbZ.W/2, lbZ.H/2, true); }
      else if (e.key === '0') { e.preventDefault(); lbZoom(1); }
      else if (e.key === 'Tab') {
        // le focus reste dans la fenêtre
        const f = [...lbEl.querySelectorAll('button')], i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    }, true);
    window.addEventListener('resize', () => { if (lbOpen) lbFit(false); });
  };
  const lbEase = on => { (lbVid.hidden ? lbImg : lbVid).classList.toggle('ease', !!on && motion); };
  const lbApply = () => {
    const m = lbVid.hidden ? lbImg : lbVid;
    m.style.transform = `translate3d(${(lbZ.ox + lbZ.tx).toFixed(1)}px,${(lbZ.oy + lbZ.ty).toFixed(1)}px,0) scale(${lbZ.s.toFixed(4)})`;
    lbView.dataset.cursor = !lbVid.hidden ? '' : lbZ.s > 1.001 ? lng('Dézoomer', 'Zoom out') : lng('Zoomer', 'Zoom in');
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
      lbHint.textContent = fine.matches ? lng('Cliquez pour zoomer · molette · glissez pour vous déplacer', 'Click to zoom · scroll wheel · drag to move') : lng('Touchez pour zoomer', 'Tap to zoom');
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

  /* ---------- Projets : loupe au survol des images (souris) ----------
     Un cadre moyen suit le curseur et montre, agrandi 2,5 fois, le détail de la photo sous la souris,
     dans la meilleure version disponible du fichier (data-full, sinon la plus grande du srcset). */
  const LOUPE_Z = 2.5;
  let loupe = null, loupeI = null;
  const lp = { on: false, x: 0, y: 0, img: null, stage: null, nat: [0, 0], L: 0, r: null, sr: null };
  function loupeSet(img, x, y, stageEl){
    lp.x = x; lp.y = y; if (stageEl) lp.stage = stageEl;
    if (!img || !img.complete || !img.naturalWidth) { loupeHide(); return; }
    if (!loupe) {
      loupe = document.createElement('div'); loupe.className = 'loupe'; loupe.setAttribute('aria-hidden', 'true'); loupe.innerHTML = '<i></i>';
      document.body.appendChild(loupe); loupeI = loupe.firstChild;
      window.addEventListener('resize', () => { lp.L = loupe.offsetWidth; });
    }
    if (img !== lp.img) {
      lp.img = img; lp.nat = [img.naturalWidth, img.naturalHeight];
      const best = bestSrc(img), now = img.currentSrc || best;
      setS(loupeI, 'backgroundImage', `url("${now}")`);
      // la version la plus grande remplace l'image affichée dès qu'elle est chargée
      if (best && best !== now) { const hi = new Image(); hi.onload = () => { if (lp.img === img) setS(loupeI, 'backgroundImage', `url("${best}")`); }; hi.src = best; }
    }
    if (!lp.on) { lp.on = true; lp.L = loupe.offsetWidth; loupe.classList.add('on'); root.classList.add('loupe-on'); }
  }
  function loupeHide(){ if (!lp.on) return; lp.on = false; lp.img = null; loupe.classList.remove('on'); root.classList.remove('loupe-on'); }
  // lecture en début d'image (voir la boucle), écriture ensuite : la loupe suit aussi pendant le défilement
  const measureLoupe = () => { lp.r = lp.on && lp.img ? lp.img.getBoundingClientRect() : null; lp.sr = lp.r && lp.stage ? lp.stage.getBoundingClientRect() : null; };
  const drawLoupe = () => {
    const r = lp.r, sr = lp.sr; lp.r = lp.sr = null;
    if (!r || !lp.on) return;
    if (sr && (lp.x < sr.left || lp.x > sr.right || lp.y < sr.top || lp.y > sr.bottom)) { loupeHide(); return; }
    // image en « cover » : taille et décalage réels de la photo dans son cadre (le léger zoom lent compris)
    const [nw, nh] = lp.nat, k = Math.max(r.width / nw, r.height / nh), rw = nw * k, rh = nh * k;
    const px = lp.x - (r.left + (r.width - rw) / 2), py = lp.y - (r.top + (r.height - rh) / 2), L = lp.L, Z = LOUPE_Z;
    setS(loupe, 'transform', `translate3d(${(lp.x - L/2).toFixed(1)}px,${(lp.y - L/2).toFixed(1)}px,0)`);
    setS(loupeI, 'backgroundSize', `${(rw*Z).toFixed(1)}px ${(rh*Z).toFixed(1)}px`);
    setS(loupeI, 'backgroundPosition', `${(L/2 - px*Z).toFixed(1)}px ${(L/2 - py*Z).toFixed(1)}px`);
  };

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
      if (st.hover && fine.matches) { const im = figs[i].querySelector('img'); loupeSet(im, lp.x, lp.y, stage); if (im && !(im.complete && im.naturalWidth)) im.addEventListener('load', () => { if (st.hover && figs[st.cur].contains(im)) loupeSet(im, lp.x, lp.y, stage); }, {once:true}); }
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
      if (fine.matches) { show(st.cur + 1, true); return; }
      figs.forEach(f => { const v = f.querySelector('video'); if (v) v.pause(); });
      lbOpenAt(items(), st.cur, i => { if (i !== st.cur) show(i, true); else { st.hold = performance.now() + 9000; const v = figs[st.cur].querySelector('video'); if (v && st.vis && motion) playV(v); } });
    });
    stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') st.hover = true; });
    stage.addEventListener('pointerleave', () => { st.hover = false; loupeHide(); });
    // la loupe suit la souris sur les photos (pas sur les vidéos)
    stage.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || !fine.matches) return; loupeSet(figs[st.cur].querySelector('img'), e.clientX, e.clientY, stage); });
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

  /* ---------- Studio : les métiers en poussière ; le nom se défait et se recompose en défilant ---------- */
  const mt = $('#metiers');
  let drawMt = null, layoutMt = null;
  if (mt) {
    const cv = mt.querySelector('.mt-cv'), cx = cv.getContext('2d');
    const mtItems = $$('.mt-i', mt), names = mtItems.map(li => li.querySelector('.mt-n').textContent.trim());
    const nowPs = $$('.mt-now p', mt), cnt = mt.querySelector('.mt-cnt'), nM = names.length;
    let NP = 0, PX = [], PY = [], PAX = null, PAY = null, PR = null, PS = null, PAL = null, W = 0, H = 0, dpr = 1, lastKey = '', curM = -1, seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const ms = { x: -1e9, y: -1e9, on: false };
    const span = () => Math.max(1, mt.offsetHeight - (window.innerHeight - bandH()));
    // relevé des points de chaque nom (police du site), un nom long passe sur deux lignes
    layoutMt = force => {
      if (!cv.clientWidth || !cv.clientHeight) return;
      // même taille qu'avant : rien à reconstruire (le relevé des 14 000 points prenait plus de 100 ms sur téléphone)
      const nd = Math.min(window.devicePixelRatio || 1, 2), nW = Math.round(cv.clientWidth * nd), nH = Math.round(cv.clientHeight * nd);
      // appel « polices prêtes » : inutile si les polices étaient déjà là au premier relevé
      if (NP && nW === W && nH === H && nd === dpr && (force !== true || mtFonts)) return;
      mtFonts = !document.fonts || document.fonts.status === 'loaded';
      dpr = nd; W = nW; H = nH; cv.width = W; cv.height = H;
      const oc = document.createElement('canvas'); oc.width = W; oc.height = H; const ox = ctxRead(oc);
      const step = Math.max(2, Math.round(2 * dpr)), family = getComputedStyle(cv).fontFamily || 'sans-serif';
      seed = 7;
      const words = names.map(name => {
        // le nom prend toute la largeur ; un nom en deux mots passe sur deux lignes si ça le rend nettement plus grand
        ox.font = `400 100px ${family}`;
        const wOf = l => ox.measureText(l).width / 100;
        let lines = [name], fs = Math.min(H * .5, W * .94 / wOf(name));
        if (name.includes(' ')) { const sp = name.indexOf(' '), ls = [name.slice(0, sp), name.slice(sp + 1)], fs2 = Math.min(H * .36, W * .94 / Math.max(...ls.map(wOf))); if (fs2 > fs * 1.25) { lines = ls; fs = fs2; } }
        ox.font = `400 ${fs}px ${family}`; ox.textBaseline = 'middle'; ox.textAlign = 'left';
        ox.clearRect(0, 0, W, H); ox.fillStyle = '#fff';
        const lh = fs * 1.02, y0 = H / 2 - (lines.length - 1) * lh / 2;
        lines.forEach((l, k) => ox.fillText(l, 0, y0 + k * lh));
        let d; try { d = ox.getImageData(0, 0, W, H).data; } catch(e) { return []; }
        const pts = [];
        for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 128) pts.push(x + (rnd() - .5) * step, y + (rnd() - .5) * step);
        for (let k = pts.length / 2 - 1; k > 0; k--) { const j = (rnd() * (k + 1)) | 0; [pts[2*k], pts[2*j]] = [pts[2*j], pts[2*k]]; [pts[2*k+1], pts[2*j+1]] = [pts[2*j+1], pts[2*k+1]]; }
        return pts;
      });
      if (words.some(w => !w.length)) return;
      const m = Math.min(14000, Math.max(...words.map(w => w.length / 2)));
      // les mêmes points qu'avant, rangés dans des tableaux de nombres contigus (lecture bien plus rapide à chaque image)
      // et triés par opacité (une trentaine de valeurs) : l'opacité du dessin change 30 fois par image au lieu de 14 000
      const ax = [], ay = [], pr = [], ps = [], al = [];
      for (let k = 0; k < m; k++) { const ang = rnd() * Math.PI * 2; ax.push(Math.cos(ang)); ay.push(Math.sin(ang)); pr.push(.4 + rnd()); ps.push((1.1 + rnd() * .8) * dpr); al.push(Math.round((.7 + rnd() * .3) * 100) / 100); }
      const ord = ax.map((_, k) => k).sort((a, b) => al[a] - al[b]);
      PX = words.map(() => new Float64Array(m)); PY = words.map(() => new Float64Array(m));
      PAX = new Float64Array(m); PAY = new Float64Array(m); PR = new Float64Array(m); PS = new Float64Array(m); PAL = new Float64Array(m);
      ord.forEach((k, o) => {
        words.forEach((w, wi) => { const q = (k % (w.length / 2)) * 2; PX[wi][o] = w[q]; PY[wi][o] = w[q + 1]; });
        PAX[o] = ax[k]; PAY[o] = ay[k]; PR[o] = pr[k]; PS[o] = ps[k]; PAL[o] = al[k];
      });
      NP = m;
      mtH = mt.offsetHeight;
      lastKey = '';
    };
    let mtH = mt.offsetHeight, mtRect = null, mtFonts = false;
    new ResizeObserver(() => { mtH = mt.offsetHeight; lastKey = ''; }).observe(mt);
    measureMt = () => { mtRect = (NP && isNear(mt)) ? mt.getBoundingClientRect() : null; };
    cv.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = cv.getBoundingClientRect(); ms.x = (e.clientX - r.left) * dpr; ms.y = (e.clientY - r.top) * dpr; ms.on = true; });
    cv.addEventListener('pointerleave', () => { ms.on = false; ms.x = ms.y = -1e9; });
    const smooth = t => t * t * (3 - 2 * t);
    drawMt = () => {
      const r = mtRect; mtRect = null;
      if (!r || !NP) return;
      if (r.bottom < 0 || r.top > F.vh) return;
      const f = clamp((bandH() - r.top) / Math.max(1, mtH - (F.vh - bandH())), 0, 1) * (nM - 1);
      const key = f.toFixed(4) + (ms.on && motion ? `|${ms.x | 0},${ms.y | 0}` : '');
      if (key === lastKey) return; lastKey = key;
      const i = Math.min(nM - 2, Math.floor(f)), t = f - i, e = smooth(clamp((t - .28) / .44, 0, 1)), b = Math.sin(Math.PI * e);
      cx.clearRect(0, 0, W, H); cx.fillStyle = fgCol;
      const R = 70 * dpr, spread = 70 * dpr, push = ms.on && motion, fade = 1 - b * .35;
      const XA = PX[i], XC = PX[i + 1], YA = PY[i], YC = PY[i + 1], sb = spread * b;
      let la = -1;
      for (let k = 0; k < NP; k++) {
        let x = XA[k] + (XC[k] - XA[k]) * e + PAX[k] * sb * PR[k], y = YA[k] + (YC[k] - YA[k]) * e + PAY[k] * sb * PR[k] * .6;
        if (push) { const dx = x - ms.x, dy = y - ms.y, d2 = dx * dx + dy * dy; if (d2 < R * R) { const d = Math.sqrt(d2) || 1, kk = (1 - d / R) * 28 * dpr; x += dx / d * kk; y += dy / d * kk; } }
        if (PAL[k] !== la) { la = PAL[k]; cx.globalAlpha = la * fade; }
        cx.fillRect(x, y, PS[k], PS[k]);
      }
      cx.globalAlpha = 1;
      const k = Math.round(f);
      if (k !== curM) { curM = k; nowPs.forEach((pp, j) => pp.classList.toggle('on', j === k)); mtItems.forEach((li, j) => li.classList.toggle('on', j === k)); if (cnt) cnt.textContent = `${pad(k + 1)} / ${pad(nM)}`; }
    };
    // un nom de la liste amène son métier à l'écran
    mtItems.forEach((li, j) => li.querySelector('.mt-n').addEventListener('click', () => {
      window.scrollTo({ top: mt.getBoundingClientRect().top + window.scrollY - bandH() + j / (nM - 1) * span(), behavior: motion ? 'smooth' : 'auto' });
    }));
    mt.classList.add('run');
    nearIO.observe(mt);
  }

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
  const tablist = $('[role="tablist"]');
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
      if (oak && oakVisible && player.ctx !== 'camp') playV(oak);
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
    if (lp.on) measureLoupe();
    // 2) écritures
    drawCursor();
    drawLoupe();
    if (heroVisible && heroFrame) heroFrame(now);
    if (worksVisible && applyWorks) applyWorks(false);
    if (baVisible && baTick) baTick();
    if (trVisible && trTick) trTick();
    if (drawLit) drawLit();
    if (drawCredits) drawCredits(false);
    if (drawMt) drawMt();
    for (let i = 0; i < viewers.length; i++) viewers[i](now);
    if (drawPeek) drawPeek(now);
    drawScrollFx(); drawSvc();
    if (drawDust) drawDust();
    drawHoverDust();
    // timecode de la bande
    let src = null, fps = FPS;
    if (player.ctx) { src = player.video; fps = P[player.id].fps || FPS; }
    else if (heroVisible && heroFrame && F.sy < heroTop + heroStep*(N-1) + F.vh*.3) { src = SV[cur0]; fps = SID[cur0] === 'oakley' ? 24 : FPS; }
    else if (oakVisible) { src = oak; fps = 24; }
    else if (baVisible) src = ba;
    else if (worksVisible && items[active]) src = items[active].querySelector('video');
    if (src && tcEl) { const s = tc(src.currentTime, fps); if (s !== tcLast) { tcLast = s; tcEl.textContent = s; } }
    if (oakVisible && oakTc) { const s2 = tc(oak.currentTime, 24); if (s2 !== oakTcLast) { oakTcLast = s2; oakTc.textContent = s2; } }
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

  function relayout(force){ snapF(); readBand(); readDoc(); if (layoutHero) layoutHero(); if (layoutWorks) layoutWorks(); if (layoutCredits) layoutCredits(); if (layoutMt) layoutMt(force === true); }
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
