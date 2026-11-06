/* NOVA FOR VISION · script commun aux quatre pages (NOVA, Projets, Studio, Contact).
   Chaque bloc ne s'active que si sa section est présente sur la page. Pas de dépendance, pas d'étape de build. */
(() => {
  'use strict';
  const FPS = 25;
  const P = {
    oakley:{title:'OAKLEY × META',artist:'Campagne IA',roles:'Création IA · VFX · Montage · Sound design · Motion design',dur:28.75,fps:24,ig:null,full:'/media/oakley/film.mp4'},
    ndrangetha:{title:'NDRANGETHA',artist:'Thabiti',roles:'Montage · VFX · IA · SFX',dur:35.0,ig:'https://www.instagram.com/reel/Dcyn_7qtQiD/',dir:'Lyra Film'},
    killcam:{title:'KILLCAM',artist:'King Kifla',roles:'Montage · VFX',dur:29.8,ig:'https://www.instagram.com/reel/DaQpBznNIB9/',dir:'Lyra Film'},
    crame:{title:'CRAMÉ',artist:'RR',roles:'Montage · VFX · IA · SFX',dur:38.08,ig:null,dir:'Lyra Film'},
    back:{title:'BACK',artist:'LP2.0',roles:'Montage · VFX',dur:22.95,ig:'https://www.instagram.com/reel/DWozdhSj1l3/',dir:'Lyra Film'},
    demandeashh:{title:'DEMANDEASHH',artist:'Sheu',roles:'Teaser IA',dur:33.28,ig:'https://www.instagram.com/reel/DaArXcHsMV4/',dir:'NOVA'},
    jamaiquaine:{title:'JAMAÏQUAINE IS DEAD',artist:'LP Killer',roles:'VFX',dur:33.686,ig:'https://www.instagram.com/reel/DTZaV9mDPdE/',dir:'Lyra Film'},
    bellodallas:{title:'REEL VFX',artist:'Bello & Dallas',roles:'VFX',dur:13.44,ig:null,dir:'Kespey'}
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
  const bandH = () => parseFloat(getComputedStyle(root).getPropertyValue('--band')) || 56;
  const fgCol = getComputedStyle(root).getPropertyValue('--fg').trim() || '#eeefed';

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
  let parts = [], dc = null, dustBuilt = false, dustAwake = 0;
  let routeTo = null, tabsInit = null;

  /* ---------- Blocs proches de l'écran : on ne mesure (et on ne charge) rien de ce qui est loin ---------- */
  const nearMap = new WeakMap(), isNear = el => nearMap.get(el) === true;
  const nearIO = new IntersectionObserver(es => es.forEach(en => nearMap.set(en.target, en.isIntersecting)), {rootMargin:'300px 0px'});
  const lazyIO = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; const v = en.target; if (v.dataset.poster) { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); } if (v.dataset.preload) { v.preload = v.dataset.preload; v.removeAttribute('data-preload'); } lazyIO.unobserve(v); }), {rootMargin:'1400px 0px'});
  $$('video[data-poster]').forEach(v => { if (!v.closest('#stage')) lazyIO.observe(v); });
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
  let introOn = !!intro && root.classList.contains('intro-run');
  // l'intro n'accueille que la première arrivée sur l'accueil : venir d'une autre page du site ne la rejoue pas
  if (!intro) { try { sessionStorage.setItem('nova-intro','1'); } catch(e){} }
  function endIntro(){ if (!introOn) return; introOn = false; intro.hidden = true; try { sessionStorage.setItem('nova-intro','1'); } catch(e){} if (setCurrent) setCurrent(0); }
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
    const img = new Image();
    img.onload = () => {
      const w = Math.round(SW*base*dpr), h = Math.round(SH*base*dpr);
      const oc = document.createElement('canvas'); oc.width = w; oc.height = h; const ox = oc.getContext('2d'); ox.drawImage(img, 0, 0, w, h);
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
      if (!ready) { requestAnimationFrame(stepI); return; }
      if (t0 === null) t0 = now;
      const t = now - t0, W = icv.width, H = icv.height;
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
        let x = rx, y = ry, a = p.a * clamp(t/300, 0, 1), sz = p.s;
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
    function skip(){ if (!introOn || done) return; done = true; intro.classList.add('fade'); setTimeout(endIntro, 360); }
    intro.addEventListener('click', skip);
    window.addEventListener('keydown', skip, {once:true});
    window.addEventListener('wheel', skip, {once:true, passive:true});
    window.addEventListener('touchstart', skip, {once:true, passive:true});
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
    curS.style.transform = `translate3d(${cur.sx.toFixed(1)}px,${cur.sy.toFixed(1)}px,0) rotate(${cur.rot.toFixed(1)}deg) scale(${st.toFixed(3)},${(1/Math.sqrt(st)).toFixed(3)})`;
    curL.style.transform = `translate3d(${cur.lx.toFixed(1)}px,${cur.ly.toFixed(1)}px,0)`;
  }

  /* ---------- Lecteur intégré (accueil, projets) ---------- */
  const pc = $('#pc'), seek = $('#pc-seek'), pcCur = $('#pc-cur');
  if (pc) {
    openPlayer = (ctx, video, id, slot, onClose) => {
      if (player.ctx) closePlayer(true);
      const d = P[id];
      player.ctx = ctx; player.video = video; player.id = id; player.onClose = onClose || null; player.opener = document.activeElement;
      player.restore = { src: video.getAttribute('src') || '', time: video.currentTime || 0, muted: video.muted, loop: video.loop };
      $('#pc-title').textContent = d.title; $('#pc-meta').textContent = `${d.artist} · ${d.roles}${d.dir ? ' · Réalisation ' + d.dir : ''}`;
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
    $('#pc-sound').addEventListener('click', e => { e.stopPropagation(); soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', String(soundOn)); e.currentTarget.textContent = soundOn ? 'Son activé' : 'Son coupé'; if (player.video) player.video.muted = !soundOn; });
    ['play','pause','ended'].forEach(ev => document.addEventListener(ev, e => {
      if (e.target !== player.video) return;
      if (ev === 'ended') { closePlayer(); return; }
      $('#pc-play').textContent = ev === 'play' ? 'Pause' : 'Lecture';
    }, true));
    seek.addEventListener('input', () => { seeking = true; const v = player.video; if (!v) return; const d = v.duration || P[player.id].dur; v.currentTime = seek.value/1000*d; seek.style.setProperty('--p', (seek.value/10)+'%'); });
    seek.addEventListener('change', () => { seeking = false; });
    pc.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('keydown', e => {
      if (!player.ctx) return;
      if (e.key === 'Escape') { e.preventDefault(); closePlayer(); }
      else if (e.key === ' ' && pc.contains(e.target) && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') { e.preventDefault(); togglePlay(); }
    });
  }

  /* ---------- Accueil : trois projets qui glissent avec le défilement ---------- */
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
    setCurrent = i => {
      if (i === cur0 && caps[i].classList.contains('on')) return;
      if (introOn && i === 0 && performance.now() < 2300) return;
      cur0 = i;
      caps.forEach((c,k) => { c.classList.toggle('on', k === i && !(k === 0 && logoHold())); c.setAttribute('aria-hidden', String(k !== i)); c.toggleAttribute('inert', k !== i); });
      slides.forEach((s,k) => s.classList.toggle('cur', k === i));
      $('#hcount').textContent = `${pad(i+1)} / ${pad(N)}`;
      ticks.forEach((t,k) => t.setAttribute('aria-current', String(k === i)));
    };
    if (!introOn) setCurrent(0); else setTimeout(() => setCurrent(0), 2400);
    layoutHero = () => {
      heroStep = window.innerHeight * .7;
      heroTop = heroWrap.getBoundingClientRect().top + window.scrollY;
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
    hero.setAttribute('data-cursor', 'Lire');
    if (!fine.matches) $('#hhint').textContent = 'Faites défiler pour changer de projet';
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
    function heroDust(xc, sl, seamO){
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W = Math.round(hero.clientWidth*dpr), H = Math.round(hero.clientHeight*dpr);
      if (hdc.width !== W || hdc.height !== H) { hdc.width = W; hdc.height = H; }
      const x = xc*dpr, moved = hdLastX === null ? 0 : Math.abs(x - hdLastX);
      if (motion && seamO > .05 && moved > .5) {
        hdAcc += Math.min(4, moved*.05);
        for (; hdAcc >= 1 && hp.length < 140; hdAcc--) { const y = Math.random()*H; hp.push({ x: x + sl*dpr*(.5 - y/H) + (Math.random()-.5)*3*dpr, y, vx: (x < (hdLastX ?? x) ? -1 : 1)*(.3 + Math.random()*1.1)*dpr, vy: (Math.random()-.5)*.4*dpr, life: 1, dec: .016 + Math.random()*.022, s: (.6 + Math.random()*.9)*dpr }); }
      }
      hdLastX = x;
      if (!hp.length) { if (!hdIdle) { hdx.clearRect(0,0,W,H); hdIdle = 1; } return; }
      hdIdle = 0;
      hdx.clearRect(0,0,W,H); hdx.fillStyle = '#ffffff';
      for (let i = hp.length - 1; i >= 0; i--) { const p = hp[i]; p.x += p.vx; p.y += p.vy; p.vx *= .97; p.life -= p.dec; if (p.life <= 0) { hp.splice(i,1); continue; } hdx.globalAlpha = p.life*.5; hdx.fillRect(p.x, p.y, p.s, p.s); }
      hdx.globalAlpha = 1;
    }
    const SLANT_DEG = 35.2, SLANT = Math.tan(SLANT_DEG*Math.PI/180);   // angle de la branche oblique de l'étoile NOVA
    const vfx = new WeakMap();
    const setV = (el, key, css) => { if (vfx.get(el) === key) return; vfx.set(el, key); el.style.cssText = css; };
    heroFrame = () => {
      hTarget = clamp((window.scrollY - heroTop) / heroStep, 0, N-1);
      if (player.ctx === 'hero' && Math.abs(hTarget - cur0) > .25) closePlayer(true);
      pos = (!motion) ? hTarget : lerp(pos, hTarget, .1);
      if (Math.abs(pos - hTarget) < .0005) pos = hTarget;
      // rideau : la slide suivante se découvre de droite à gauche, son film arrive en léger travelling ; la précédente recule dans l'ombre
      let seamX = 0, seamO = 0;
      const HW = hero.clientWidth, HH = hero.clientHeight, SL = HH*SLANT;
      slides.forEach((sl,i) => {
        const v = SV[i];
        const t = i === 0 ? 1 : clamp(pos - (i-1), 0, 1), e = easeIO(t);
        const k = i < N-1 ? clamp(pos - i, 0, 1) : 0, ek = easeIO(k);
        const xc = (HW + SL/2) - e*(HW + SL);
        if (i > 0) setV(sl, 'c'+e.toFixed(4)+'_'+HW+'_'+HH, e >= .9999 ? 'clip-path:inset(0 0 0 0)' : `clip-path:polygon(${(xc + SL/2).toFixed(1)}px 0,100% 0,100% 100%,${(xc - SL/2).toFixed(1)}px 100%)`);
        // la vidéo glisse un peu mais couvre toujours tout l'écran : l'échelle compense le décalage (sinon des coins noirs apparaissent le long de la jointure oblique)
        const tx = (1-e)*10 - ek*8, sc = 1.004 + Math.abs(tx)/50 + (1-e)*.04;
        setV(v, 'v'+tx.toFixed(2)+sc.toFixed(3), tx === 0 && e >= 1 && ek <= 0 ? '' : `transform:translate3d(${tx.toFixed(2)}%,0,0) scale(${sc.toFixed(3)})`);
        setV(shades[i], 's'+ek.toFixed(3), `opacity:${(ek*.55).toFixed(3)}`);
        if (i > 0 && t > 0 && t < 1) { seamX = xc; seamO = Math.sin(Math.PI*t); }
      });
      seam.style.transform = `translate3d(${seamX.toFixed(1)}px,0,0) rotate(${SLANT_DEG}deg) scaleY(${(1/Math.cos(SLANT_DEG*Math.PI/180)).toFixed(3)})`;
      seam.style.opacity = seamO.toFixed(3);
      heroDust(seamX, SL, seamO);
      // boucle Oakley sans le logo
      if (oakV && oakLoopOwn() && oakV.duration && !oakV.paused && oakV.currentTime > oakV.duration - .09) oakV.currentTime = LOGO_END;
      if (cur0 === 0 && !introOn && caps[0].getAttribute('aria-hidden') === 'false' && !caps[0].classList.contains('on') && !logoHold()) caps[0].classList.add('on');
      const ci = clamp(Math.round(pos), 0, N-1);
      if (ci !== cur0 && !introOn) setCurrent(ci);
      ticks.forEach((tk,i) => { const f = i === 0 ? 1 : clamp(pos - (i-1), 0, 1); tk.querySelector('i').style.transform = `scaleX(${f.toFixed(3)})`; });
      // seuls les films visibles jouent
      SV.forEach((v,i) => {
        if (player.ctx === 'hero' && i === cur0) return;
        const vis = i === Math.floor(pos) || i === Math.ceil(pos);
        const want = heroVisible && motion && vis;
        if (want && v.paused) playV(v); else if (!want && !v.paused) v.pause();
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
      oakSound.setAttribute('aria-pressed', String(on)); oakSound.textContent = on ? 'Son coupé' : 'Son';
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
    trTick = () => {
      if (trWant !== null && !tr.seeking && tr.readyState >= 1) { tr.currentTime = trWant; trWant = null; }
      const t = tr.currentTime || 0, k = t >= TR_CUT ? 'Noir et blanc' : 'Couleur';
      if (k !== trLast) { trLast = k; trState.textContent = k; }
      trHead.style.transform = `translate3d(${(t/TR_DUR*trTl.clientWidth).toFixed(1)}px,0,0)`;
      if (document.activeElement !== trRange) trRange.value = Math.round(t/TR_DUR*1000);
    };
    wipe.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; trHover = true; tr.pause(); });
    wipe.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) { if (!trHover) { trHover = true; tr.pause(); } const r = wipe.getBoundingClientRect(); trSeek(clamp((e.clientX - r.left)/r.width, 0, 1)*TR_DUR); } });
    wipe.addEventListener('pointerdown', e => { trHover = true; tr.pause(); const r = wipe.getBoundingClientRect(); trSeek(clamp((e.clientX - r.left)/r.width, 0, 1)*TR_DUR); });
    const trResume = () => { trHover = false; if (motion && trVisible) { tr.playbackRate = .5; playV(tr); } };
    wipe.addEventListener('pointerleave', trResume);
    wipe.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') trResume(); });
    trRange.addEventListener('input', () => { tr.pause(); trSeek(trRange.value/1000*TR_DUR); });
    new IntersectionObserver(es => es.forEach(en => { trVisible = en.isIntersecting; if (trVisible && motion && !trHover) { tr.playbackRate = .5; playV(tr); } else if (!trVisible) tr.pause(); }), {threshold:.2}).observe(wipe);
    if (!fine.matches) $('#wipe-hint').textContent = "Glissez sur l’image pour parcourir la transition";
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
    baTick = () => {
      if (baSeeking && performance.now() - baSeekAt > 300) baSeeking = false;
      if (baWanted !== null && !baSeeking && ba.readyState >= 1) { baSeeking = true; baSeekAt = performance.now(); ba.currentTime = baWanted; baWanted = null; }
      const t = ba.currentTime || 0;
      let ci = 0, after = false;
      BA.forEach(([s0,s1],i) => { if (t >= s0 - .001) { ci = i; after = t >= s1; } });
      const key = ci + (after ? 'a' : 'b');
      if (key !== baLastKey) { baLastKey = key; baState.textContent = after ? 'Après' : 'Avant'; chBtns.forEach((b,i) => { b.setAttribute('aria-current', String(i === ci)); b.querySelector('.st').textContent = i === ci ? (after ? 'Après' : 'Avant') : ''; }); }
      baHead.style.transform = `translate3d(${(t/BA_DUR*baTl.clientWidth).toFixed(1)}px,0,0)`;
      if (document.activeElement !== baRange) baRange.value = Math.round(t/BA_DUR*1000);
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
    if (!fine.matches) $('#ba-hint').textContent = "Glissez sur l’image pour parcourir le film";
    new IntersectionObserver(es => es.forEach(en => { baVisible = en.isIntersecting; if (baVisible && motion && !baHover) playV(ba); else if (!baVisible) ba.pause(); }), {threshold:.2}).observe(baBox);
  }

  /* ---------- Clips : la bobine (projets) ---------- */
  const works = $('#bobine'), track = $('#track');
  if (works && track) {
    items = $$('#track .work');
    let horiz = false, centers = [], pitch = 1, stepPx = 1, pShown = 0, pPrev = 0, wVel = 0;
    items.forEach(el => el.querySelector('.work-media').setAttribute('data-cursor', 'Lire'));
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
        track.style.transform = 'none';
        centers = items.map(el => el.offsetLeft + el.offsetWidth/2);
        pitch = (centers[centers.length-1] - centers[0]) / (items.length-1) || 1;
      } else {
        works.style.removeProperty('--h-total'); track.style.transform = '';
        items.forEach(el => { const m = el.querySelector('.work-media'); m.style.transform = ''; el.style.opacity = ''; });
      }
      applyWorks(true);
    };
    const targetP = () => clamp(-(works.getBoundingClientRect().top - bandH()) / stepPx, 0, items.length-1);
    const centerAt = p => { const i = Math.floor(p), j = Math.min(i+1, centers.length-1); return lerp(centers[i], centers[j], p - i); };
    const fx = new WeakMap();
    const setFx = (el, o, s) => { const key = `${o.toFixed(2)}|${s.toFixed(3)}`; if (fx.get(el) === key) return; fx.set(el, key); el.style.opacity = o > .995 ? '' : o.toFixed(2); el.querySelector('.work-media').style.transform = s > .999 ? '' : `scale(${s.toFixed(3)})`; };
    applyWorks = snap => {
      if (!centers.length && horiz) return;
      if (horiz) {
        const tp = targetP();
        pPrev = pShown;
        pShown = (snap || !motion) ? tp : lerp(pShown, tp, .14);
        if (Math.abs(pShown - tp) < .0005) pShown = tp;
        wVel = lerp(wVel, pShown - pPrev, .3);
        const x = window.innerWidth/2 - centerAt(pShown);
        const sk = motion ? clamp(-wVel*60, -6, 6) : 0, sy = motion ? 1 - Math.min(Math.abs(wVel)*1.2, .06) : 1;
        track.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${sk.toFixed(2)}deg) scaleY(${sy.toFixed(3)})`;
        if (player.ctx !== 'works') items.forEach((el,i) => { const d = Math.min(Math.abs(centers[i] - centerAt(pShown)) / pitch, 1); setFx(el, 1 - d*.62, 1 - d*.06); });
        setActive(Math.round(pShown));
      } else {
        const mid = window.innerHeight/2; let best = 0, bd = 1e9;
        items.forEach((el,i) => { const r = el.querySelector('.work-media').getBoundingClientRect(); const d = Math.abs((r.top + r.height/2) - mid); if (d < bd) { bd = d; best = i; } });
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
    if (!fine.matches) $('#works-hint').textContent = 'Défilez ; touchez un film pour le lire';
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
    drawPeek = now => {
      if (!pk.on) return;
      pk.x = lerp(pk.x, pk.tx, motion ? .16 : 1); pk.y = lerp(pk.y, pk.ty, motion ? .16 : 1);
      const w = peek.offsetWidth, h = peek.offsetHeight;
      const x = pk.x + 28 + w > window.innerWidth ? pk.x - 28 - w : pk.x + 28;
      peek.style.transform = `translate3d(${x.toFixed(1)}px,${(pk.y - h/2).toFixed(1)}px,0)`;
      if (pk.imgs && now - pk.t > 420) { pk.t = now; pk.k = (pk.k + 1) % pk.imgs.length; peekI.src = pk.imgs[pk.k]; }
    };
  }

  /* ---------- Texte qui s'allume (accueil, studio) ---------- */
  const lit = $('#lit');
  if (lit) {
    const words = lit.textContent.split(/(\s+)/);
    lit.textContent = '';
    const wds = [];
    words.forEach(w => { if (/^\s+$/.test(w)) { lit.appendChild(document.createTextNode(w)); return; } const s = document.createElement('span'); s.className = 'wd'; s.textContent = w; lit.appendChild(s); wds.push(s); });
    let litLast = -1;
    drawLit = () => {
      if (!isNear(lit)) return;
      const r = lit.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh*.85 - r.top) / (vh*.85 - vh*.35 + r.height*.5), 0, 1);
      const n = Math.round(p * wds.length);
      if (n === litLast) return; litLast = n;
      wds.forEach((s,i) => s.style.setProperty('--o', i < n ? '1' : '.4'));
    };
    nearIO.observe(lit);
  }

  /* ---------- Générique qui défile (projets, clips) ---------- */
  const credits = $('#generique');
  if (credits) {
    const crWin = $('#cr-win'), crList = $('#cr-list'), crNames = $$('#cr-list .name');
    let crOn = false, crLast = '';
    layoutCredits = () => {
      crOn = !reduce;
      credits.classList.toggle('roll', crOn);
      if (!crOn) { crList.style.transform = ''; crNames.forEach(n => n.style.removeProperty('--o')); return; }
      if (!credits.getClientRects().length) return;
      const listH = crList.offsetHeight;
      credits.style.setProperty('--cr-h', Math.round(window.innerHeight + listH * 1.15) + 'px');
      drawCredits(true);
    };
    drawCredits = force => {
      if (!crOn || (!force && !isNear(credits))) return;
      const r = credits.getBoundingClientRect(); const vh = window.innerHeight;
      if (!force && (r.bottom < 0 || r.top > vh)) return;
      const total = credits.offsetHeight - (vh - bandH());
      const p = clamp((bandH() - r.top) / Math.max(1,total), 0, 1);
      const winH = crWin.clientHeight;
      const first = crNames[0].parentElement, last = crNames[crNames.length-1].parentElement;
      const c0 = first.offsetTop + first.offsetHeight/2, c1 = last.offsetTop + last.offsetHeight/2;
      const y = winH/2 - lerp(c0, c1, p);
      const key = y.toFixed(1); if (key === crLast && !force) return; crLast = key;
      crList.style.transform = `translate3d(0,${key}px,0)`;
      crNames.forEach(n => { const li = n.parentElement; const cy = li.offsetTop + li.offsetHeight/2 + y; const d = Math.abs(cy - winH/2) / (winH/2); n.style.setProperty('--o', clamp(1 - d*.85, .12, 1).toFixed(2)); });
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
      const sentenceTxt = `Je m’appelle ${name || '…'}, je prépare ${type} pour ${when}.${idea ? ' L’idée : ' + idea + '.' : ''}`;
      return { subject: `Projet : ${type}${name ? ' · ' + name : ''}`, body: `Bonjour NOVA,\n\n${sentenceTxt}\n\n${name}`.trim() };
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
    sentence.addEventListener('submit', e => {
      e.preventDefault();
      picks.forEach(pk => pk.close(false));
      const m = compose();
      slMsg.textContent = '';
      dissolve(() => { slMsg.textContent = 'Votre messagerie s’ouvre avec le message prêt'; window.location.href = `mailto:contact@novaforvision.fr?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`; });
    });
    $('#sl-ig').addEventListener('click', () => {
      const m = compose();
      try { navigator.clipboard.writeText(m.body).then(() => { slMsg.textContent = 'Message copié : collez-le dans la conversation Instagram'; }, () => { slMsg.textContent = 'Instagram s’ouvre : écrivez votre message dans la conversation'; }); } catch(_) { slMsg.textContent = 'Instagram s’ouvre : écrivez votre message dans la conversation'; }
    });
  }
  const copyBtn = $('#copy');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const reset = () => setTimeout(() => copyBtn.textContent = 'Copier', 2000);
    const fallback = () => { const s = getSelection(), rg = document.createRange(); rg.selectNodeContents($('#mail')); s.removeAllRanges(); s.addRange(rg); copyBtn.textContent = 'Sélectionnée'; reset(); };
    try { navigator.clipboard.writeText('contact@novaforvision.fr').then(() => { copyBtn.textContent = 'Copiée'; reset(); }, fallback); } catch(e){ fallback(); }
  });

  /* ---------- Grands titres : une poussière discrète se détache des lettres sous le curseur ---------- */
  const hovC = document.createElement('canvas'); hovC.className = 'hov-dust'; hovC.setAttribute('aria-hidden','true'); document.body.appendChild(hovC);
  const hovX = hovC.getContext('2d'), hovP = []; let hovDirty = false;
  const hovEls = $$('.dhov');
  // relevé des pixels des lettres, caractère par caractère (gère les lignes, les lettres animées et la couleur de chaque ligne)
  function sampleGlyphs(el){
    const er = el.getBoundingClientRect(), pts = [];
    const oc = document.createElement('canvas'); oc.width = Math.ceil(er.width); oc.height = Math.ceil(er.height);
    if (!oc.width || !oc.height) return pts;
    const ox = oc.getContext('2d'), rg = document.createRange(), cols = [];
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
    if (!hovP.length) { if (hovDirty) { hovX.clearRect(0,0,hovC.width,hovC.height); hovDirty = false; } return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(innerWidth*dpr), H = Math.round(innerHeight*dpr);
    if (hovC.width !== W || hovC.height !== H) { hovC.width = W; hovC.height = H; }
    hovX.setTransform(1,0,0,1,0,0); hovX.clearRect(0,0,W,H); hovX.setTransform(dpr,0,0,dpr,-scrollX*dpr,-scrollY*dpr);
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
    let dustVis = false, dustIn = false;
    const dm = { x:-9999, y:-9999, on:false };
    const buildDust = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = dust.clientWidth, h = dust.clientHeight;
      if (!w || !h) return;
      dc.width = Math.round(w*dpr); dc.height = Math.round(h*dpr);
      const img = new Image();
      img.onload = () => {
        const oc = document.createElement('canvas'); oc.width = dc.width; oc.height = dc.height;
        const ox = oc.getContext('2d');
        const sw = Math.min(dc.width, dc.height*2.7633), sh = sw/2.7633;
        ox.drawImage(img, (dc.width - sw)/2, (dc.height - sh)/2, sw, sh);
        let data; try { data = ox.getImageData(0, 0, oc.width, oc.height).data; } catch(e) { return; }
        const step = Math.max(2, Math.round(3*dpr*(w < 600 ? .85 : 1)));
        parts = [];
        for (let y = 0; y < oc.height; y += step) for (let x = 0; x < oc.width; x += step) {
          const jx = x + (Math.random()-.5)*step*.6, jy = y + (Math.random()-.5)*step*.6;
          const a = data[((Math.round(jy)|0)*oc.width + (Math.round(jx)|0))*4 + 3];
          if (a > 110) parts.push({ hx:jx, hy:jy, x: dustIn ? jx : Math.random()*oc.width, y: dustIn ? jy : jy + (Math.random()-.5)*oc.height*.9, vx:0, vy:0, s:(.7 + Math.random()*.8)*dpr, a:.45 + Math.random()*.55 });
        }
        dustBuilt = true; dustAwake = 240;
      };
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
      const R = 90 * (dc.width / Math.max(1, dust.clientWidth)), R2 = R*R;
      const still = !motion;
      dctx.clearRect(0, 0, dc.width, dc.height);
      dctx.fillStyle = fgCol;
      let moving = 0;
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
        dctx.globalAlpha = p.a;
        dctx.fillRect(p.x, p.y, p.s, p.s);
      }
      dctx.globalAlpha = 1;
      if (moving) dustAwake = Math.max(dustAwake, 20);
    };
    window.addEventListener('resize', () => { if (dustBuilt) { dustBuilt = false; dustIn = true; if (dustVis) buildDust(); } });
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
  let railLast = '';
  function drawScrollFx(){
    const vh = window.innerHeight;
    let eased = false;
    stillSets.forEach(({box, phs, figs, lead}) => {
      if (!isNear(box)) return;
      const sb = box.getBoundingClientRect();
      if (sb.bottom < -50 || sb.top > vh + 50) return;
      if (!eased) {
        eased = true;
        const tx = motion && pm.on ? clamp((pm.x - innerWidth/2) / (innerWidth/2), -1, 1) : 0, ty = motion && pm.on ? clamp((pm.y - vh/2) / (vh/2), -1, 1) : 0;
        par.x += (tx - par.x) * .06; par.y += (ty - par.y) * .06;
      }
      phs.forEach((ph, i) => {
        const r = ph.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
        const d = motion ? ((r.top + r.height/2) - vh/2) / vh : 0, k = lead ? .6 : DEPTH[i % DEPTH.length];
        ph.style.setProperty('--py', (d*(lead ? -5 : -7)).toFixed(2) + '%');
        ph.style.setProperty('--mx', (-par.x*1.8*k).toFixed(2) + '%');
        ph.style.setProperty('--my', (-par.y*.8*k).toFixed(2) + '%');
        if (figs[i] && !lead) figs[i].style.transform = `translate3d(${(par.x*10*k).toFixed(1)}px,${(par.y*8*k).toFixed(1)}px,0)`;
      });
    });
    const rr = railBox && isNear(railBox) ? railBox.getBoundingClientRect() : null;
    if (rr && rr.bottom > 0 && rr.top < vh) {
      const p = clamp((vh - rr.top) / (vh + rr.height), 0, 1);
      const x = -(p * (rail.scrollWidth - window.innerWidth*.6)).toFixed(1);
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
  function drawSvc(){
    if (!svcPv || !svcList || svcHover >= 0 || !isNear(svcList) || !svcPv.offsetParent) return;
    if (!svcWarm) { svcWarm = true; svcRows.forEach(li => { const im = new Image(); im.src = li.dataset.pv; }); }
    const mid = window.innerHeight * .5, lr = svcList.getBoundingClientRect();
    if (lr.bottom < mid * .5 || lr.top > mid * 1.5) return;
    let best = -1, bd = 1e9;
    svcRows.forEach((li, k) => { const r = li.getBoundingClientRect(), d = Math.abs(r.top + r.height/2 - mid); if (d < bd) { bd = d; best = k; } });
    showSvc(best);
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
    const fromHash = initial => { const h = decodeURIComponent(location.hash.slice(1)); if (!h) { showTab(0); return; } if (!routeTo(h, initial) && curTab < 0) showTab(0); };
    window.addEventListener('popstate', () => fromHash(false));
    window.addEventListener('hashchange', () => fromHash(false));
    tabsInit = () => fromHash(true);
  }

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1)); if (!id) return;
    if (id === 'top') { e.preventDefault(); glideTo(0); return; }
    if (routeTo && routeTo(id, false)) { e.preventDefault(); history.pushState(null, '', '#' + id); return; }
    const el = document.getElementById(id); if (!el) return;
    e.preventDefault();
    glideTo(el, el);
  });

  /* ---------- Mouvement (bouton de l'accueil) ---------- */
  function applyMotion(){
    root.classList.toggle('motion-off', !motion);
    if (motionBtn) { motionBtn.setAttribute('aria-pressed', String(motion)); motionBtn.querySelector('span').textContent = motion ? 'Mouvement activé' : 'Mouvement en pause'; }
    if (!motion) { $$('video').forEach(v => { if (v !== player.video) v.pause(); }); }
    else {
      if (oak && oakVisible && player.ctx !== 'camp') playV(oak);
      if (ba && baVisible) playV(ba);
      if (tr && trVisible) playV(tr);
      if (playPreview && items[active]) playPreview(items[active]);
      inview.forEach(v => { if (v._in) playV(v); });
    }
  }
  if (motionBtn) motionBtn.addEventListener('click', e => { e.stopPropagation(); motion = !motion; sessStore.set('nova-motion', motion ? 'on' : 'off'); applyMotion(); });

  /* ---------- Boucle ---------- */
  const tcEl = $('#tc'), prog = $('#prog'), band = $('#band');
  let tcLast = '', progLast = '', bandSolid = null, bandMoved = null;
  function frame(now){
    drawCursor();
    if (heroVisible && heroFrame) heroFrame(now);
    if (worksVisible && applyWorks) applyWorks(false);
    if (baVisible && baTick) baTick();
    if (trVisible && trTick) trTick();
    if (drawLit) drawLit();
    if (drawCredits) drawCredits(false);
    if (drawPeek) drawPeek(now);
    drawScrollFx(); drawSvc();
    if (drawDust) drawDust();
    drawHoverDust();
    // timecode de la bande
    let src = null, fps = FPS;
    if (player.ctx) { src = player.video; fps = P[player.id].fps || FPS; }
    else if (heroVisible && heroFrame && window.scrollY < heroTop + heroStep*(N-1) + window.innerHeight*.3) { src = SV[cur0]; fps = SID[cur0] === 'oakley' ? 24 : FPS; }
    else if (oakVisible) { src = oak; fps = 24; }
    else if (baVisible) src = ba;
    else if (worksVisible && items[active]) src = items[active].querySelector('video');
    if (src && tcEl) { const s = tc(src.currentTime, fps); if (s !== tcLast) { tcLast = s; tcEl.textContent = s; } }
    if (oakVisible && oakTc) { const s2 = tc(oak.currentTime, 24); if (s2 !== oakTcLast) { oakTcLast = s2; oakTc.textContent = s2; } }
    if (player.ctx) {
      const v = player.video; pcCur.textContent = tc(v.currentTime, P[player.id].fps);
      if (!seeking && v.duration) { const val = Math.round(v.currentTime/v.duration*1000); seek.value = val; seek.style.setProperty('--p', (val/10)+'%'); }
    }
    // la bande s'assombrit sous le contenu : après l'accueil en images, ou dès qu'on quitte le haut d'une autre page
    const solid = heroFrame ? window.scrollY > heroTop + heroStep*(N-1) + window.innerHeight*.6 : window.scrollY > 8;
    if (band && solid !== bandSolid) { bandSolid = solid; band.classList.toggle('solid', solid); }
    const moved = window.scrollY > 24;
    if (band && moved !== bandMoved) { bandMoved = moved; band.classList.toggle('moved', moved); }
    if (prog) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pr = (window.scrollY / Math.max(1,max) * 180).toFixed(1);
      if (pr !== progLast) { progLast = pr; prog.style.transform = `rotate(${pr}deg)`; }
    }
    requestAnimationFrame(frame);
  }

  function relayout(){ if (layoutHero) layoutHero(); if (layoutWorks) layoutWorks(); if (layoutCredits) layoutCredits(); }
  relayout();
  applyMotion();
  if (tabsInit) tabsInit();
  let rz = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(relayout); });
  if (document.fonts) document.fonts.ready.then(relayout);
  if (layoutHero) window.addEventListener('load', layoutHero);
  requestAnimationFrame(frame);
})();
