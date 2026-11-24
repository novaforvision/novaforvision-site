// Gabarits des pages. Toutes les pages existent en français et en anglais (sauf mentions légales et 404).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAIL, IG, SITE, ROUTES, NAV, CAMPAIGNS, CLIPS, REEL, WALL, ARTISTS, ARTIST_CLIP, DIRECTORS, METIERS, SERVICES, STEPS, TRACKS, TEAM, BA } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0');
const tcode = (s, fps = 25) => { const f = Math.floor((s % 1) * fps); const t = Math.floor(s); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(f)}`; };

// Logo et étoile : les tracés d'origine, réutilisés dans les masques (intro, titre NOVA, passage d'une page à l'autre)
const svgInner = f => readFileSync(join(ROOT, 'assets', f), 'utf8').replace(/^[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, '');
const LOGO_G = svgInner('nova-white.svg').replace(/<g id="nova-registered"[\s\S]*?<\/g>/, '').replace(/ fill="#FFFFFF"/g, '').replace(/ id="[^"]*"/g, '');
const STAR_G = svgInner('nova-star.svg').replace(/ fill="#FFFFFF"/g, '').replace(/ id="[^"]*"/g, '');
const LOGO_VB = [2597.7095, 914.6302], STAR_VB = [2527.4102, 914.6302];

export function pages(V) {
  const out = [];
  for (const L of ['fr', 'en']) {
    const ctx = mk(L, V);
    out.push({ path: L === 'fr' ? '' : 'en', html: home(ctx) });
    out.push({ path: ROUTES.projets[L].slice(1), html: projets(ctx) });
    out.push({ path: ROUTES.services[L].slice(1), html: services(ctx) });
    out.push({ path: ROUTES.studio[L].slice(1), html: studio(ctx) });
    out.push({ path: ROUTES.contact[L].slice(1), html: contact(ctx) });
  }
  const fr = mk('fr', V);
  out.push({ path: 'mentions-legales', html: legal(fr) });
  out.push({ path: '404.html', html: notFound(fr) });
  return out;
}

function mk(L, V) {
  const t = v => (v == null ? '' : typeof v === 'string' ? v : v[L]);
  const R = (key, hashPart = '') => ROUTES[key][L] + (hashPart ? `#${hashPart}` : '');
  const go = h => { if (h === 'mail') return `mailto:${MAIL}`; const [k, a] = h.split('#'); return R(k, a); };
  return { L, V, t, R, go, fr: L === 'fr' };
}

/* ---------------- Morceaux communs ---------------- */

function head(c, { key, title, desc, preload = [], ld = null, robots = null, alt = true }) {
  const { L, V } = c;
  const url = SITE + ROUTES[key][L];
  const alts = alt ? `
<link rel="alternate" hreflang="fr" href="${SITE + ROUTES[key].fr}">
<link rel="alternate" hreflang="en" href="${SITE + ROUTES[key].en}">
<link rel="alternate" hreflang="x-default" href="${SITE + ROUTES[key].fr}">` : '';
  return `<!doctype html>
<html lang="${L}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#000000">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cloud.umami.is; connect-src 'self' https://cloud.umami.is https://gateway.umami.is; img-src 'self' data:; media-src 'self'; font-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">${robots ? `\n<meta name="robots" content="${robots}">` : ''}
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" href="/assets/touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<script defer src="https://cloud.umami.is/script.js" data-website-id="89584e49-8283-4309-b6bb-89176b0ba237" data-domains="novaforvision.com"></script>
<link rel="canonical" href="${url}">${alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="NOVA FOR VISION">
<meta property="og:locale" content="${L === 'fr' ? 'fr_BE' : 'en_GB'}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="NOVA FOR VISION">
<meta name="twitter:card" content="summary_large_image">${ld ? `\n<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
<link rel="preload" href="/assets/fonts/geist-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/geist-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>${preload.map(p => `\n<link rel="preload" href="${p}" as="image" fetchpriority="high">`).join('')}
<link rel="stylesheet" href="/assets/nova.css?v=${V.css}">
<script type="speculationrules">{"prefetch":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>
<script>${boot(key)}</script>
<script defer src="/assets/nova.js?v=${V.js}"></script>
</head>`;
}

// script de démarrage : avant le premier affichage, pour éviter tout saut
function boot(key) {
  const redirects = key === 'home' ? `var m={contact:'contact/',studio:'studio/',campagnes:'projets/#campagnes',projets:'projets/#clips','clips-open':'projets/#clips','avant-apres':'projets/#avant-apres',generique:'projets/#generique'},h=location.hash.slice(1);if(m[h]&&location.pathname==='/'){location.replace('/'+m[h]);return;}` : '';
  return `(function(){${redirects}var d=document.documentElement;d.classList.add('js');var seen=false;try{seen=sessionStorage.getItem('nova-intro')==='1'}catch(e){}${key === 'home' ? `if(!seen&&!location.hash)d.classList.add('intro-run');` : ''}try{if(sessionStorage.getItem('nova-veil')==='1')d.classList.add('veil-in')}catch(e){}})();`;
}

function defs() {
  return `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<g id="g-logo">${LOGO_G}</g>
<g id="g-star">${STAR_G}</g>
</defs></svg>`;
}

function header(c, key) {
  const { t, R, L } = c;
  const other = L === 'fr' ? 'en' : 'fr';
  const altHref = ROUTES[key] && key !== 'legal' ? ROUTES[key][other] : ROUTES.home[other];
  return `<a class="skip" href="#main">${c.fr ? 'Aller au contenu' : 'Skip to content'}</a>
<header class="hd" id="hd">
  <a class="hd-logo" href="${R('home')}" aria-label="${c.fr ? 'NOVA FOR VISION, accueil' : 'NOVA FOR VISION, home'}"><img src="/assets/nova-white.svg" alt="" width="62" height="22"></a>
  <nav class="hd-nav" aria-label="${c.fr ? 'Pages' : 'Pages'}">${NAV.map(([k, n]) => `<a href="${R(k)}"${k === key ? ' aria-current="page"' : ''}>${t(n)}</a>`).join('')}</nav>
  <div class="hd-r">
    <a class="hd-lang" href="${altHref}" hreflang="${other}" lang="${other}">${other === 'en' ? 'EN' : 'FR'}</a>
    <span class="hd-tc mono" id="tc" aria-hidden="true">00:00:00:00</span>
    <button class="hd-menu" type="button" id="menu-btn" aria-expanded="false" aria-controls="menu">Menu</button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Menu">${[['home', { fr: 'Accueil', en: 'Home' }], ...NAV].map(([k, n], i) => `<a href="${R(k)}"${k === key ? ' aria-current="page"' : ''}>${t(n)}</a>`).join('')}</nav>
  <p class="menu-foot"><a href="mailto:${MAIL}">${MAIL}</a><a href="${altHref}" hreflang="${other}" lang="${other}">${other === 'en' ? 'English' : 'Français'}</a></p>
</div>`;
}

// le passage d'une page à l'autre : l'étoile se referme, puis s'ouvre sur la page suivante
function veil() {
  return `<div class="veil" id="veil" aria-hidden="true"><svg width="100%" height="100%"><defs><mask id="veil-m" maskUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%"><rect x="-50%" y="-50%" width="200%" height="200%" fill="#fff"/><g id="veil-hole" transform="scale(0)"><use href="#g-star" fill="#000"/></g></mask></defs><rect x="-50%" y="-50%" width="200%" height="200%" fill="#000" mask="url(#veil-m)"/></svg></div>`;
}

// titre découpé dans un film : le texte reste du vrai texte (référencement, lecteurs d'écran)
function cutTitle(c, { text, tag = 'h1', video, poster, start = 0, cls = '', id = '' }) {
  return `<div class="cut ${cls}"${id ? ` id="${id}"` : ''}>
  <video class="cut-v" data-src="${video}" poster="${poster}" muted loop playsinline preload="none"${start ? ` data-start="${start}"` : ''} aria-hidden="true"></video>
  <${tag} class="cut-t" data-fit>${esc(text)}</${tag}>
</div>`;
}

function wall(rows = 3, offset = 0) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const imgs = [];
    for (let i = 0; i < 8; i++) imgs.push(WALL[(offset + r * 8 + i) % WALL.length]);
    out.push(`<div class="wall-row" data-speed="${[0.6, -0.45, 0.35, -0.55][r % 4]}"><div class="wall-track">${[...imgs, ...imgs].map((s, i) => `<img src="${s}" alt="" width="360" height="203" loading="${r === 0 && i < 8 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div></div>`);
  }
  return `<div class="wall" aria-hidden="true">${out.join('')}</div>`;
}

function fin(c, film) {
  const { fr } = c;
  return `<section class="fin" aria-labelledby="fin-t">
  <a class="fin-link" href="mailto:${MAIL}" data-label="${fr ? 'Écrire' : 'Write'}">
    ${cutTitle(c, { text: fr ? 'Écrire au studio' : 'Write to the studio', tag: 'h2', video: film.src, poster: film.poster, start: film.start || 0, cls: 'cut-fin', id: '' }).replace('class="cut-t"', 'class="cut-t" id="fin-t"')}
  </a>
  <div class="fin-row wrap">
    <p class="fin-q">${fr ? 'Une idée, une image, un projet.<br><span class="dim">Et si on lui donnait forme ?</span>' : 'An idea, an image, a project.<br><span class="dim">Shall we give it shape?</span>'}</p>
    <dl class="facts mono">
      <div><dt>${fr ? 'E-mail' : 'Email'}</dt><dd><a href="mailto:${MAIL}">${MAIL}</a></dd></div>
      <div><dt>Instagram</dt><dd><a href="${IG}" rel="noopener" target="_blank">@novaforvision</a></dd></div>
      <div><dt>${fr ? 'Devis' : 'Quote'}</dt><dd>${fr ? 'Sous 48 h' : 'Within 48 hours'}</dd></div>
      <div><dt>Studio</dt><dd>${fr ? 'Liège, Belgique' : 'Liège, Belgium'}</dd></div>
    </dl>
  </div>
</section>`;
}

function footer(c) {
  const { fr } = c;
  return `<footer class="ft wrap">
  <span>© 2026 NOVA FOR VISION</span>
  <span>${fr ? 'Studio de création IA, Liège' : 'AI creation studio, Liège'}</span>
  <a href="/mentions-legales/"${fr ? '' : ' hreflang="fr"'}>${fr ? 'Mentions légales' : 'Legal notice'}</a>
  <a href="${IG}" rel="noopener" target="_blank">Instagram</a>
  <a href="#main" class="ft-top">${fr ? 'Retour en haut' : 'Back to top'}</a>
</footer>`;
}

function player(c) {
  const { fr } = c;
  return `<div class="pl" id="pl" role="dialog" aria-modal="true" aria-labelledby="pl-t" hidden>
  <div class="pl-top"><p class="pl-t" id="pl-t"></p><p class="pl-m" id="pl-m"></p><button class="pl-x" type="button" id="pl-x">${fr ? 'Fermer' : 'Close'}</button></div>
  <video class="pl-v" id="pl-v" playsinline preload="none"></video>
  <div class="pl-bar">
    <button type="button" id="pl-play">${fr ? 'Pause' : 'Pause'}</button>
    <span class="mono" id="pl-cur">00:00:00:00</span>
    <input class="pl-seek" id="pl-seek" type="range" min="0" max="1000" value="0" aria-label="${fr ? 'Position dans le film' : 'Position in the film'}">
    <span class="mono" id="pl-dur">00:00:00:00</span>
    <button type="button" id="pl-snd" aria-pressed="true">${fr ? 'Son activé' : 'Sound on'}</button>
    <a id="pl-ig" href="#" rel="noopener" target="_blank" hidden>Instagram</a>
  </div>
</div>`;
}

function lightbox(c) {
  const { fr } = c;
  return `<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="${fr ? 'Image en grand' : 'Enlarged image'}" hidden>
  <img class="lb-i" id="lb-i" alt="">
  <div class="lb-bar"><p id="lb-c"></p><span class="mono" id="lb-n"></span><button type="button" id="lb-p">${fr ? 'Précédente' : 'Previous'}</button><button type="button" id="lb-nx">${fr ? 'Suivante' : 'Next'}</button><button type="button" id="lb-x">${fr ? 'Fermer' : 'Close'}</button></div>
</div>`;
}

function page(c, key, body, { film, bodyClass = '', withPlayer = false, withLb = false, noFin = false } = {}) {
  return `<body class="${bodyClass}">
${defs()}
${header(c, key)}
<main id="main">
${body}
${noFin ? '' : fin(c, film)}
</main>
${footer(c)}
${withPlayer ? player(c) : ''}
${withLb ? lightbox(c) : ''}
<div class="peek" id="peek" aria-hidden="true"><div class="peek-in"></div></div>
${veil()}
</body>
</html>
`;
}

const filmData = (c, o) => esc(JSON.stringify({ t: o.title, m: o.meta, src: o.src, d: o.dur, fps: o.fps || 25, ig: o.ig || null }));
const clipMeta = (c, k) => `${k.artist}, ${c.t(k.role)}, ${c.fr ? 'réalisation' : 'directed by'} ${k.dir}`;
const campFilm = (c, k) => ({ title: k.title, meta: c.t(k.line), src: k.film, dur: k.dur, fps: k.fps });
const clipFilm = (c, k) => ({ title: k.title, meta: clipMeta(c, k), src: k.film, dur: k.dur, ig: k.ig });
const LOEWE_FILM = { src: '/media/loewe/film.mp4', poster: '/media/hero/loewe-p.jpg' }, OAK_FILM = { src: '/media/hero/oakley.mp4', poster: '/media/hero/oakley-p.jpg', start: 2 };
const FIN = { home: LOEWE_FILM, projets: OAK_FILM, services: LOEWE_FILM, studio: OAK_FILM };
const ALL = [...CAMPAIGNS.map(k => ({ k, type: 'c' })), ...CLIPS.map(k => ({ k, type: 'v' }))];

/* ---------------- Accueil ---------------- */

function home(c) {
  const { t, R, go, fr, L } = c;
  const reelFilms = { oakley: CAMPAIGNS[0], loewe: CAMPAIGNS[2] };
  const reelData = REEL.map(r => {
    const k = reelFilms[r.id] ? campFilm(c, reelFilms[r.id]) : clipFilm(c, CLIPS.find(x => x.id === r.id));
    return { src: r.src, poster: r.poster, start: r.start, title: r.title, by: t(r.by), film: k };
  });
  const featured = ['oakley', 'beymen', 'loewe', 'teastorm', 'crame', 'ndrangetha', 'bellodallas'].map(id => CAMPAIGNS.find(k => k.id === id) ? { k: CAMPAIGNS.find(k => k.id === id), type: 'c' } : { k: CLIPS.find(k => k.id === id), type: 'v' });
  const panelMedia = { oakley: { v: '/media/hero/oakley.mp4', p: '/media/hero/oakley-p.jpg', s: 2 }, beymen: { i: '/media/beymen/01-1920.jpg', sm: '/media/beymen/01-960.jpg' }, loewe: { v: '/media/loewe/film.mp4', p: '/media/hero/loewe-p.jpg' }, teastorm: { i: '/assets/teastorm/00-2400.jpg', sm: '/assets/teastorm/00-1200.jpg' } };
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${SITE}/#studio`, name: 'NOVA FOR VISION', alternateName: 'NOVA', url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo.png`, width: 600, height: 600 }, image: `${SITE}/assets/og.jpg`,
      description: fr ? 'Studio indépendant de création IA, d’effets visuels et de postproduction basé à Liège : campagnes publicitaires IA, VFX et montages pour les marques, les agences et les artistes, en Belgique et en France.' : 'Independent AI creation, visual effects and post-production studio based in Liège, Belgium: AI ad campaigns, VFX and edits for brands, agencies and artists.',
      email: MAIL, address: { '@type': 'PostalAddress', addressLocality: 'Liège', addressCountry: 'BE' }, areaServed: ['BE', 'FR'],
      knowsAbout: fr ? ['Création vidéo IA', 'Campagnes publicitaires IA', 'Effets visuels (VFX)', 'Postproduction', 'Montage vidéo', 'Motion design', 'Sound design', 'Direction artistique', 'Storyboard'] : ['AI video creation', 'AI ad campaigns', 'Visual effects (VFX)', 'Post-production', 'Video editing', 'Motion design', 'Sound design', 'Art direction', 'Storyboard'],
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: MAIL, availableLanguage: ['French', 'English'] }, sameAs: [IG] },
    { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'NOVA FOR VISION', inLanguage: L, publisher: { '@id': `${SITE}/#studio` } },
  ] };
  const S = REEL[0];
  const body = `
<div class="intro" id="intro" aria-hidden="true">
  <canvas id="intro-c"></canvas>
  <svg class="intro-s" width="100%" height="100%"><defs><mask id="intro-m" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%"><rect width="100%" height="100%" fill="#fff"/><g id="intro-hole" transform="scale(0)"><use href="#g-star" fill="#000"/></g></mask></defs><rect width="100%" height="100%" fill="#000" mask="url(#intro-m)"/></svg>
</div>

<section class="hero" id="hero" aria-labelledby="hero-t">
  <div class="hero-pin">
    <div class="hero-film">
      <video class="hero-v" muted playsinline preload="auto" poster="${S.poster}" aria-hidden="true"></video>
      <video class="hero-v" muted playsinline preload="none" aria-hidden="true"></video>
      <div class="grain" aria-hidden="true"></div>
    </div>
    <div class="hero-box" id="hero-box" aria-hidden="true"></div>
    <svg class="hero-cut" id="hero-cut" width="100%" height="100%" aria-hidden="true"><defs><mask id="hero-m" maskUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%"><rect x="-50%" y="-50%" width="200%" height="200%" fill="#fff"/><g id="hero-logo"><use href="#g-logo" fill="#000"/></g></mask></defs><rect x="-50%" y="-50%" width="200%" height="200%" fill="#000" mask="url(#hero-m)"/></svg>
    <div class="hero-copy wrap">
      <h1 id="hero-t"><span class="sr">NOVA FOR VISION, </span>${fr ? 'Studio de création IA' : 'AI creation studio'}</h1>
      <p>${fr ? 'Campagnes pour les marques, clips pour les artistes.' : 'Campaigns for brands, music videos for artists.'}</p>
      <p class="acts"><a href="${R('projets')}">${fr ? 'Voir les projets' : 'See the projects'}</a><a href="mailto:${MAIL}">${fr ? 'Écrire au studio' : 'Write to the studio'}</a></p>
    </div>
    <div class="hero-wall">${wall(4, 0)}</div>
    <div class="hero-cap wrap" id="hero-cap" aria-live="polite">
      <p class="hero-cap-t"><span id="hero-cap-t">${S.title}</span><span class="dim" id="hero-cap-b">${t(S.by)}</span></p>
      <button type="button" class="hero-watch" id="hero-watch">${fr ? 'Voir le film en entier' : 'Watch the full film'}</button>
      <span class="mono hero-cap-n" id="hero-cap-n" aria-hidden="true">01 / ${pad(REEL.length)}</span>
    </div>
  </div>
  <script type="application/json" id="reel-data">${JSON.stringify(reelData).replace(/</g, '\\u003c')}</script>
</section>

<section class="mani wrap" aria-labelledby="mani-t">
  <h2 class="mani-t" id="mani-t" data-words>${fr ? 'L’IA propose.<br>L’œil décide.' : 'AI proposes.<br>The eye decides.'}</h2>
  <p class="mani-p">${fr ? 'L’IA ouvre des pistes, on garde la meilleure et on la finit à la main.' : 'AI opens up directions, we keep the best one and finish it by hand.'}</p>
  <ul class="forces">
    <li><h3>${fr ? 'Précision' : 'Precision'}</h3><p>${fr ? 'Le choix, le rythme et la finition restent humains.' : 'The choices, the rhythm and the finish stay human.'}</p></li>
    <li><h3>${fr ? 'Rapidité d’exécution' : 'Speed of execution'}</h3><p>${fr ? 'Devis sous 48 h, storyboard validé avant production.' : 'Quote within 48 hours, storyboard approved before production.'}</p></li>
    <li><h3>${fr ? 'Compréhension de l’idée' : 'Understanding the idea'}</h3><p>${fr ? 'Avant de produire, on se met d’accord sur ce qu’on va voir.' : 'Before producing anything, we agree on what we are going to see.'}</p></li>
  </ul>
</section>

<section class="bob" id="bobine" aria-labelledby="bob-t">
  <div class="bob-head wrap"><h2 id="bob-t">${fr ? 'Projets à la une' : 'Featured projects'}</h2><a href="${R('projets')}">${fr ? 'Tous les projets' : 'All projects'}</a></div>
  <div class="bob-pin"><div class="bob-track">
${featured.map(({ k, type }, i) => {
    const m = type === 'v' ? { v: k.prev, p: k.poster } : panelMedia[k.id];
    const href = R('projets', k.anchor);
    const sub = type === 'v' ? `${k.artist}` : t(k.line);
    const role = type === 'v' ? t(k.role) : t(k.credits.find(x => t(x[0]) === (fr ? 'Rôle' : 'Role'))[1]);
    return `    <article class="bob-p" data-tint="${k.tint}">
      <a class="bob-m" href="${href}" data-cursor="${fr ? 'Voir le projet' : 'See the project'}">${m.v ? `<video data-src="${m.v}" poster="${m.p}" muted loop playsinline preload="none"${m.s ? ` data-start="${m.s}"` : ''} aria-hidden="true"></video>` : `<img src="${m.sm}" srcset="${m.sm} 960w, ${m.i} 1920w" sizes="(min-width: 900px) 62vw, 100vw" alt="" loading="lazy" decoding="async">`}</a>
      <div class="bob-x"><h3><a href="${href}">${esc(k.title)}</a></h3><p>${esc(sub)}</p><p class="dim">${esc(role)}</p></div>
    </article>`;
  }).join('\n')}
  </div></div>
</section>

<section class="idx wrap" aria-labelledby="idx-t">
  <h2 id="idx-t">${fr ? 'Tous les projets' : 'All projects'}</h2>
  <ol class="idx-l">
${ALL.map(({ k, type }) => `    <li><a href="${R('projets', k.anchor)}" data-peek="${type === 'v' ? k.prev : (k.stills[0].sm || k.stills[0].img)}"${type === 'v' ? ` data-peek-p="${k.thumb}"` : ''} data-tint="${k.tint}"><span class="idx-n">${esc(k.title)}</span><span class="idx-a">${esc(type === 'v' ? k.artist : t(k.line))}</span><span class="idx-r">${esc(type === 'v' ? t(k.role) : t(k.credits.find(x => t(x[0]) === (fr ? 'Rôle' : 'Role'))[1]))}</span><span class="idx-k mono">${type === 'v' ? (fr ? 'Clip' : 'Music video') : (fr ? 'Campagne' : 'Campaign')}</span></a></li>`).join('\n')}
  </ol>
</section>

<section class="band" aria-labelledby="band-t">
  <h2 class="band-t wrap" id="band-t">${fr ? 'Ils nous ont confié leurs images' : 'They trusted us with their images'}</h2>
  <div class="mq" data-mq="1" aria-hidden="true"><div class="mq-t">${[...ARTISTS, ...ARTISTS].map(a => `<span>${esc(a)}</span>`).join('')}</div></div>
  <div class="mq mq-2" data-mq="-1" aria-hidden="true"><div class="mq-t">${[...Array(2)].flatMap(() => METIERS.map(m => `<span>${esc(t(m.name))}</span>`).concat([`<span>${fr ? 'Postproduction' : 'Post-production'}</span>`])).join('')}</div></div>
  <p class="sr">${ARTISTS.join(', ')}</p>
</section>

<section class="svl wrap" aria-labelledby="svl-t">
  <h2 id="svl-t">${fr ? 'Ce que fait le studio' : 'What the studio does'}</h2>
  <ul class="svl-l">
${SERVICES.map(s => `    <li><a href="${R('services', s.id)}" data-peek="${s.media.video || s.media.sm}"${s.media.video ? ` data-peek-p="${s.media.poster}"` : ''}><span class="svl-n">${t(s.name)}</span><span class="svl-d">${t(s.text)}</span></a></li>`).join('\n')}
  </ul>
  <p class="more"><a href="${R('services')}">${fr ? 'Les services en détail' : 'Services in detail'}</a></p>
</section>`;
  return head(c, {
    key: 'home',
    title: fr ? 'NOVA FOR VISION · Studio de création IA à Liège, campagnes et clips' : 'NOVA FOR VISION · AI creation studio in Liège, campaigns and music videos',
    desc: fr ? 'Studio de création IA à Liège : campagnes publicitaires IA, effets visuels, montage et clips pour les marques, les agences et les artistes, en Belgique et en France.' : 'AI creation studio in Liège, Belgium: AI ad campaigns, visual effects, editing and music videos for brands, agencies and artists.',
    preload: [S.poster], ld,
  }) + '\n' + page(c, 'home', body, { film: FIN.home, bodyClass: 'p-home', withPlayer: true });
}

/* ---------------- Projets ---------------- */

function stillsStrip(c, k) {
  const { t } = c;
  return `<div class="strip" data-lb-group="${k.id}">
  <div class="strip-t">
${k.stills.map((s, i) => `    <figure class="still${s.w < s.h ? ' tall' : ''}">
      <button type="button" class="still-b" data-lb="${s.img}" data-lb-c="${esc(t(s.cap) || t(s.alt))}" aria-label="${esc((c.fr ? 'Agrandir : ' : 'Enlarge: ') + t(s.alt))}" data-cursor="${c.fr ? 'Agrandir' : 'Enlarge'}">${s.video ? `<video data-src="${s.video}" poster="${s.img}" muted loop playsinline preload="none" aria-hidden="true"></video>` : `<img src="${s.sm || s.img}"${s.sm ? ` srcset="${s.sm} ${s.w / 2}w, ${s.img} ${s.w}w" sizes="(min-width: 900px) 44vw, 86vw"` : ''} alt="${esc(t(s.alt))}" width="${s.w}" height="${s.h}" loading="lazy" decoding="async">`}</button>
      ${s.cap ? `<figcaption><span class="mono">${pad(i + 1)}</span>${esc(t(s.cap))}</figcaption>` : `<figcaption><span class="mono">${pad(i + 1)}</span></figcaption>`}
    </figure>`).join('\n')}
  </div>
</div>`;
}

function projets(c) {
  const { t, R, fr } = c;
  const body = `
<section class="ph" aria-labelledby="ph-t">
  ${cutTitle(c, { text: fr ? 'Projets' : 'Projects', video: '/media/hero/ndrangetha.mp4', poster: '/media/hero/ndrangetha-p.jpg', id: 'ph-cut' }).replace('class="cut-t"', 'class="cut-t" id="ph-t"')}
  <div class="ph-row wrap">
    <p class="ph-lede">${fr ? 'Campagnes pour les marques et les agences, clips pour les artistes et les réalisateurs.' : 'Campaigns for brands and agencies, music videos for artists and directors.'}</p>
    <nav class="ph-nav" aria-label="${fr ? 'Sur cette page' : 'On this page'}"><a href="#campagnes">${fr ? 'Campagnes' : 'Campaigns'}<sup class="mono">${CAMPAIGNS.length}</sup></a><a href="#clips">${fr ? 'Clips' : 'Music videos'}<sup class="mono">${CLIPS.length}</sup></a><a href="#avant-apres">${fr ? 'Avant / après' : 'Before / after'}</a><a href="#generique">${fr ? 'Générique' : 'Credits'}</a></nav>
  </div>
  ${wall(3, 5)}
</section>

<section class="grp wrap" id="campagnes" aria-labelledby="camp-h">
  <h2 id="camp-h">${fr ? 'Campagnes' : 'Campaigns'}</h2>
  <p>${fr ? 'Pour les marques et les agences : des campagnes publicitaires IA, du concept au film final, avec création IA, effets visuels et postproduction dans un seul workflow.' : 'For brands and agencies: AI ad campaigns, from concept to final film, with AI creation, visual effects and post-production in a single workflow.'}</p>
</section>
${CAMPAIGNS.map(k => `
<article class="cp" id="${k.anchor}" data-tint="${k.tint}" aria-labelledby="t-${k.id}">
  ${k.loop ? cutTitle(c, { text: k.title, tag: 'h3', video: k.loop, poster: k.loopPoster, start: k.loopStart, cls: 'cut-cp' }).replace('class="cut-t"', `class="cut-t" id="t-${k.id}"`) : `<div class="cut cut-cp cut-img" style="--img:url('${k.stills[0].sm}')"><h3 class="cut-t" id="t-${k.id}" data-fit>${esc(k.title)}</h3></div>`}
  <div class="cp-body wrap">
    <div class="cp-info">
      <p class="cp-line">${esc(t(k.line))}</p>
      <dl class="facts mono">${k.credits.map(([a, b]) => `<div><dt>${t(a)}</dt><dd>${esc(t(b))}</dd></div>`).join('')}${k.dur ? `<div><dt>${fr ? 'Durée' : 'Duration'}</dt><dd>${tcode(k.dur, k.fps)}</dd></div>` : ''}</dl>
    </div>
    ${k.film ? `<button type="button" class="cp-film" data-film="${filmData(c, campFilm(c, k))}" data-cursor="${fr ? 'Lire avec le son' : 'Play with sound'}">
      <img src="${k.poster}" alt="" loading="lazy" decoding="async" width="1600" height="900">
      <span class="cp-play">${fr ? 'Lire le film avec le son' : 'Play the film with sound'}<span class="mono">${tcode(k.dur, k.fps)}</span></span>
    </button>` : ''}
  </div>
  ${stillsStrip(c, k)}
</article>`).join('\n')}

<section class="grp wrap" id="clips" aria-labelledby="clips-h">
  <h2 id="clips-h">${fr ? 'Clips' : 'Music videos'}</h2>
  <p>${fr ? 'Montage, VFX et IA pour les clips rap et drill depuis 2023. Chaque film se lance ici même, avec le son.' : 'Editing, VFX and AI for rap and drill music videos since 2023. Each film plays right here, with sound.'}</p>
</section>
<div class="clips wrap">
${CLIPS.map((k, i) => `  <article class="clip${k.h > k.w ? ' v' : ''}" id="${k.anchor}" data-tint="${k.tint}">
    <button type="button" class="clip-m" data-film="${filmData(c, clipFilm(c, k))}" data-cursor="${fr ? 'Lire le film' : 'Play the film'}" aria-label="${esc((fr ? 'Lire ' : 'Play ') + k.title)}">
      <img src="${k.poster}" alt="${esc(fr ? `Image du clip ${k.title} de ${k.artist}` : `Still from ${k.title} by ${k.artist}`)}" loading="lazy" decoding="async" width="${k.w}" height="${k.h}">
      <video data-src="${k.prev}" muted loop playsinline preload="none" aria-hidden="true"></video>
    </button>
    <div class="clip-x"><h3>${esc(k.title)}</h3><p>${esc(k.artist)}</p><p class="dim">${esc(t(k.role))}, ${fr ? 'réalisation' : 'directed by'} ${esc(k.dir)}</p><span class="mono">${tcode(k.dur)}</span></div>
  </article>`).join('\n')}
</div>

<section class="ba wrap" id="avant-apres" aria-labelledby="ba-h">
  <div class="ba-side">
    <h2 id="ba-h">${fr ? 'Avant / après' : 'Before / after'}</h2>
    <p>${fr ? 'CRAMÉ, pour RR. Chaque plan passe d’abord tel qu’il a été tourné, puis tel qu’il sort de postproduction.' : 'CRAMÉ, for RR. Each shot plays first as it was filmed, then as it comes out of post-production.'}</p>
    <ol class="ba-ch" id="ba-ch">${BA.names.map((n, i) => `<li><button type="button" data-i="${i}"><span class="mono">${pad(i + 1)}</span>${t(n)}</button></li>`).join('')}</ol>
  </div>
  <div class="ba-stage">
    <div class="ba-box" id="ba-box" data-cursor="${fr ? 'Parcourir' : 'Scrub'}">
      <video id="ba-v" data-src="${BA.src}" poster="${BA.poster}" muted loop playsinline preload="none" aria-label="${fr ? 'Avant et après VFX sur le clip CRAMÉ' : 'Before and after VFX on the CRAMÉ music video'}"></video>
      <span class="ba-state mono" id="ba-state" aria-live="polite">${fr ? 'Avant' : 'Before'}</span>
    </div>
    <div class="ba-tl" id="ba-tl" data-dur="${BA.dur}" data-ch="${esc(JSON.stringify(BA.ch))}">
      ${BA.ch.map(([a, b, e]) => `<span class="seg" style="left:${(a / BA.dur * 100).toFixed(3)}%;width:${((b - a) / BA.dur * 100).toFixed(3)}%"></span><span class="seg a" style="left:${(b / BA.dur * 100).toFixed(3)}%;width:${((e - b) / BA.dur * 100).toFixed(3)}%"></span>`).join('')}
      <span class="ba-head" id="ba-head"></span>
      <input id="ba-r" type="range" min="0" max="1000" value="0" aria-label="${fr ? 'Parcourir l’avant et l’après' : 'Scrub through the before and after'}">
    </div>
    <p class="ba-legend mono"><span><i></i>${fr ? 'Plan brut' : 'Raw shot'}</span><span><i class="a"></i>${fr ? 'Plan final' : 'Final shot'}</span><span class="ba-hint">${fr ? 'Glissez sur l’image pour parcourir le film' : 'Drag across the image to scrub the film'}</span></p>
  </div>
</section>

<section class="cr" id="generique" aria-labelledby="cr-h">
  <div class="cr-pin">
    <div class="cr-roll">
      <h2 id="cr-h">${fr ? 'Générique' : 'Credits'}</h2>
      <p class="cr-sub">${fr ? 'Ils nous ont confié leurs images' : 'They trusted us with their images'}</p>
      <h3>${fr ? 'Artistes' : 'Artists'}</h3>
      <ul>${ARTISTS.map(a => ARTIST_CLIP[a] ? `<li><button type="button" data-film="${filmData(c, clipFilm(c, CLIPS.find(x => x.id === ARTIST_CLIP[a])))}" data-peek="${CLIPS.find(x => x.id === ARTIST_CLIP[a]).prev}">${esc(a)}<sup class="mono">${esc(CLIPS.find(x => x.id === ARTIST_CLIP[a]).title)}</sup></button></li>` : `<li>${esc(a)}</li>`).join('')}</ul>
      <h3>${fr ? 'Réalisation' : 'Directors'}</h3>
      <ul>${DIRECTORS.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
      <h3>Studio</h3>
      <ul><li>NOVA FOR VISION</li>${TEAM.map(p => `<li>${esc(p.name)}</li>`).join('')}</ul>
    </div>
  </div>
</section>`;
  return head(c, {
    key: 'projets',
    title: fr ? 'Projets : campagnes publicitaires IA et clips · NOVA FOR VISION' : 'Projects: AI ad campaigns and music videos · NOVA FOR VISION',
    desc: fr ? 'Campagnes publicitaires IA (Beymen Home & Decor, Oakley × Meta, LOEWE, Tea Storm) et clips rap et drill avec VFX et montage, par NOVA FOR VISION à Liège.' : 'AI ad campaigns (Beymen Home & Decor, Oakley × Meta, LOEWE, Tea Storm) and rap and drill music videos with VFX and editing, by NOVA FOR VISION in Liège, Belgium.',
    preload: ['/media/hero/ndrangetha-p.jpg'],
  }) + '\n' + page(c, 'projets', body, { film: FIN.projets, bodyClass: 'p-projets', withPlayer: true, withLb: true });
}

/* ---------------- Services ---------------- */

function services(c) {
  const { t, R, go, fr } = c;
  const body = `
<section class="ph" aria-labelledby="ph-t">
  ${cutTitle(c, { text: 'Services', video: '/media/hero/crame.mp4', poster: '/media/hero/crame-p.jpg', id: 'ph-cut' }).replace('class="cut-t"', 'class="cut-t" id="ph-t"')}
  <div class="ph-row wrap">
    <p class="ph-big" data-words>${fr ? 'L’IA propose. L’œil décide.' : 'AI proposes. The eye decides.'}</p>
    <div class="ph-side">
      <p>${fr ? 'L’IA ouvre des pistes et accélère la fabrication. Le choix, le rythme et la finition restent humains.' : 'AI opens up directions and speeds up production. The choices, the rhythm and the finish stay human.'}</p>
      <dl class="facts mono"><div><dt>${fr ? 'Devis' : 'Quote'}</dt><dd>${fr ? 'Sous 48 h' : 'Within 48 hours'}</dd></div><div><dt>Storyboard</dt><dd>${fr ? 'Validé avant production' : 'Approved before production'}</dd></div></dl>
    </div>
  </div>
</section>

<section class="stk" aria-labelledby="stk-h">
  <h2 class="sr" id="stk-h">${fr ? 'Prestations' : 'What we do'}</h2>
${SERVICES.map((s, i) => `  <article class="stk-p" id="${s.id}">
    <div class="stk-in wrap">
      <div class="stk-m">${s.media.video ? `<video data-src="${s.media.video}" poster="${s.media.poster}" muted loop playsinline preload="none"${s.media.start ? ` data-start="${s.media.start}"` : ''} aria-hidden="true"></video>` : `<img src="${s.media.sm}" srcset="${s.media.sm} 960w, ${s.media.img} 1920w" sizes="(min-width: 900px) 55vw, 100vw" alt="" loading="lazy" decoding="async">`}<span class="stk-cr mono">${esc(s.credit)}</span></div>
      <div class="stk-x">
        <h3>${t(s.name)}</h3>
        <p>${t(s.text)}</p>
        <ul>${s.items.map(x => `<li>${t(x)}</li>`).join('')}</ul>
        <a href="${go(s.href)}">${t(s.link)}</a>
      </div>
    </div>
  </article>`).join('\n')}
</section>

<section class="tl" id="deroule" aria-labelledby="tl-h">
  <div class="tl-pin">
    <div class="tl-head wrap"><h2 id="tl-h">${fr ? 'Du brief à la livraison' : 'From brief to delivery'}</h2><p>${fr ? 'Six étapes, trois rôles. La production démarre une fois le storyboard validé.' : 'Six steps, three roles. Production starts once the storyboard is approved.'}</p></div>
    <div class="tl-view wrap">
      <div class="tl-now" aria-live="polite">${STEPS.map((s, i) => `<div class="tl-step${i === 0 ? ' on' : ''}" data-i="${i}"><span class="mono">${pad(i + 1)} / ${pad(STEPS.length)}<span class="tl-who">${t(TRACKS[s.who])}</span></span><h3>${t(s.name)}</h3><p>${t(s.text)}</p></div>`).join('')}</div>
      <div class="tl-img">${STEPS.map((s, i) => `<img src="${s.img}" alt="" loading="lazy" decoding="async"${i === 0 ? ' class="on"' : ''}>`).join('')}</div>
    </div>
    <div class="tl-ed wrap" id="tl-ed">
      ${TRACKS.map((tr, r) => `<div class="tl-tr"><span class="tl-lab mono">${t(tr)}</span><div class="tl-lane">${STEPS.map((s, i) => s.who === r ? `<button type="button" class="tl-clip" data-i="${i}" style="left:${(i / STEPS.length * 100).toFixed(3)}%;width:calc(${(100 / STEPS.length).toFixed(3)}% - 4px)"><span>${t(s.name)}</span></button>` : '').join('')}</div></div>`).join('')}
      <div class="tl-ruler" aria-hidden="true">${STEPS.map((s, i) => `<span style="left:${(i / STEPS.length * 100).toFixed(3)}%">${pad(i + 1)}</span>`).join('')}</div>
      <span class="tl-head" id="tl-head" aria-hidden="true"></span>
    </div>
  </div>
</section>`;
  return head(c, {
    key: 'services',
    title: fr ? 'Services : campagnes IA, clips, VFX et postproduction · NOVA FOR VISION' : 'Services: AI campaigns, music videos, VFX and post-production · NOVA FOR VISION',
    desc: fr ? 'Campagnes publicitaires IA, clips et VFX, postproduction, direction artistique et tournage depuis Liège. Devis sous 48 h, storyboard validé avant production.' : 'AI ad campaigns, music videos and VFX, post-production, art direction and shooting from Liège, Belgium. Quote within 48 hours, storyboard approved first.',
    preload: ['/media/hero/crame-p.jpg'],
  }) + '\n' + page(c, 'services', body, { film: FIN.services, bodyClass: 'p-services' });
}

/* ---------------- Studio ---------------- */

function studio(c) {
  const { t, fr } = c;
  const ld = { '@context': 'https://schema.org', '@graph': TEAM.map(p => ({ '@type': 'Person', name: p.name, jobTitle: t(p.role), worksFor: { '@type': 'Organization', name: 'NOVA FOR VISION', url: `${SITE}/` } })) };
  const trail = [...METIERS.map(m => m.img), '/assets/thumbs/teastorm-03.jpg', '/assets/thumbs/beymen-05.jpg', '/assets/thumbs/loewe-01.jpg', '/assets/thumbs/oakley-macro-prizm-led.jpg', '/assets/thumbs/clip-ndrangetha.jpg', '/assets/thumbs/clip-jamaiquaine.jpg'];
  const body = `
<section class="ph" aria-labelledby="ph-t">
  ${cutTitle(c, { text: 'Studio', video: '/media/hero/bellodallas.mp4', poster: '/media/hero/bellodallas.jpg', id: 'ph-cut' }).replace('class="cut-t"', 'class="cut-t" id="ph-t"')}
</section>

<section class="st wrap" aria-label="${fr ? 'Le studio' : 'The studio'}">
  <p class="st-big" data-lines>${fr ? 'NOVA est un studio indépendant de création IA, d’effets visuels et de postproduction basé à Liège. Il réalise des campagnes publicitaires IA, des VFX et des montages pour les marques, les agences et les artistes, en Belgique et en France.' : 'NOVA is an independent AI creation, visual effects and post-production studio based in Liège, Belgium. It makes AI ad campaigns, VFX and edits for brands, agencies and artists, in Belgium, France and beyond.'}</p>
  <div class="st-row">
    <p>${fr ? 'Son workflow hybride associe IA générative, 3D et compositing, de l’exploration au plan final : donner forme à votre vision.' : 'Its hybrid workflow brings together generative AI, 3D and compositing, from first exploration to final shot: giving shape to your vision.'}</p>
    <dl class="facts mono">
      <div><dt>Base</dt><dd>${fr ? 'Liège, Belgique' : 'Liège, Belgium'}</dd></div>
      <div><dt>Formats</dt><dd>${fr ? 'Campagnes, clips, teasers' : 'Campaigns, music videos, teasers'}</dd></div>
      <div><dt>${fr ? 'Tournage' : 'Shooting'}</dt><dd>${fr ? 'Avec une équipe de production partenaire' : 'With a partner production crew'}</dd></div>
    </dl>
  </div>
</section>

<section class="mt wrap" id="metiers" aria-labelledby="mt-h" data-trail="${esc(JSON.stringify(trail))}">
  <h2 id="mt-h">${fr ? 'Métiers' : 'What we do'}</h2>
  <ul class="mt-l">
${METIERS.map(m => `    <li><h3>${t(m.name)}</h3><p>${t(m.text)}</p></li>`).join('\n')}
  </ul>
</section>

<section class="team wrap" aria-labelledby="team-h">
  <h2 id="team-h">${fr ? 'Équipe' : 'Team'}</h2>
${TEAM.map(p => `  <article class="pp">
    <h3 class="pp-n">${esc(p.name)}</h3>
    <p class="pp-r mono">${t(p.role)}<span>${t(p.craft)}</span></p>
    <p class="pp-b">${esc(t(p.bio))}</p>
  </article>`).join('\n')}
</section>`;
  return head(c, {
    key: 'studio',
    title: fr ? 'Le studio et l’équipe · NOVA FOR VISION' : 'The studio and the team · NOVA FOR VISION',
    desc: fr ? 'NOVA FOR VISION, studio indépendant de création IA, d’effets visuels et de postproduction à Liège : ses métiers et son équipe, Mikail et Adem Yildirim.' : 'NOVA FOR VISION, an independent AI creation, visual effects and post-production studio in Liège, Belgium: what we do and the team, Mikail and Adem Yildirim.',
    preload: ['/media/hero/bellodallas.jpg'], ld,
  }) + '\n' + page(c, 'studio', body, { film: FIN.studio, bodyClass: 'p-studio' });
}

/* ---------------- Contact ---------------- */

function contact(c) {
  const { fr } = c;
  const ld = { '@context': 'https://schema.org', '@type': 'ContactPage', url: SITE + ROUTES.contact[c.L], about: { '@type': 'Organization', name: 'NOVA FOR VISION', email: MAIL, url: `${SITE}/` } };
  const body = `
<section class="ct wrap" aria-labelledby="ct-h">
  <h1 class="ct-h" id="ct-h">${fr ? 'Une idée, une image, un projet.' : 'An idea, an image, a project.'}<span class="dim">${fr ? 'Et si on lui donnait forme ?' : 'Shall we give it shape?'}</span></h1>
  <div class="ct-grid">
    <form class="ct-f" id="ct-f" data-mail="${MAIL}" data-lang="${c.L}" novalidate>
      <p class="ct-s">
        ${fr ? 'Je m’appelle' : 'My name is'} <label class="sr" for="f-name">${fr ? 'Votre nom' : 'Your name'}</label><input id="f-name" name="name" autocomplete="name" placeholder="${fr ? 'votre nom' : 'your name'}" size="12">,
        ${fr ? 'je prépare' : 'I’m preparing'} <label class="sr" for="f-what">${fr ? 'Type de projet' : 'Type of project'}</label><select id="f-what" name="what"><option value="">${fr ? 'un projet' : 'a project'}</option>${(fr ? ['une campagne IA', 'un clip', 'des VFX', 'de la postproduction', 'autre chose'] : ['an AI campaign', 'a music video', 'VFX', 'post-production', 'something else']).map(o => `<option>${o}</option>`).join('')}</select>
        ${fr ? 'pour' : 'for'} <label class="sr" for="f-when">${fr ? 'Échéance' : 'Timing'}</label><select id="f-when" name="when"><option value="">${fr ? 'une date à fixer' : 'a date to set'}</option>${(fr ? ['ce mois-ci', 'dans 1 à 3 mois', 'une date encore libre'] : ['this month', '1 to 3 months from now', 'a date still open']).map(o => `<option>${o}</option>`).join('')}</select>.
        ${fr ? 'L’idée :' : 'The idea:'} <label class="sr" for="f-idea">${fr ? 'Votre idée' : 'Your idea'}</label><textarea id="f-idea" name="idea" rows="2" placeholder="${fr ? 'en quelques mots' : 'in a few words'}"></textarea>
      </p>
      <p class="ct-acts"><button type="submit">${fr ? 'Envoyer depuis ma messagerie' : 'Send from my email app'}</button><a href="${IG}" rel="noopener" target="_blank">${fr ? 'Ou en message Instagram' : 'Or a message on Instagram'}</a></p>
      <p class="ct-note">${fr ? 'Le bouton ouvre votre messagerie avec le message prêt. Rien n’est envoyé ni enregistré par le site.' : 'The button opens your email app with the message ready. The site sends and stores nothing.'}</p>
    </form>
    <figure class="ct-img" id="ct-img"><img src="/media/loewe/02-960.jpg" srcset="/media/loewe/02-960.jpg 960w, /media/loewe/02-1920.jpg 1920w" sizes="(min-width: 900px) 32vw, 100vw" alt="" width="960" height="540" decoding="async"><figcaption class="mono">LOEWE</figcaption></figure>
  </div>
  <dl class="facts mono ct-facts">
    <div><dt>${fr ? 'E-mail' : 'Email'}</dt><dd><a href="mailto:${MAIL}">${MAIL}</a> <button type="button" class="copy" data-copy="${MAIL}" data-done="${fr ? 'Copié' : 'Copied'}">${fr ? 'Copier' : 'Copy'}</button></dd></div>
    <div><dt>Instagram</dt><dd><a href="${IG}" rel="noopener" target="_blank">@novaforvision</a></dd></div>
    <div><dt>Studio</dt><dd>${fr ? 'Liège, Belgique' : 'Liège, Belgium'}</dd></div>
    <div><dt>${fr ? 'Devis' : 'Quote'}</dt><dd>${fr ? 'Sous 48 h' : 'Within 48 hours'}</dd></div>
  </dl>
</section>`;
  return head(c, {
    key: 'contact',
    title: fr ? 'Contact · NOVA FOR VISION, studio de création IA à Liège' : 'Contact · NOVA FOR VISION, AI creation studio in Liège',
    desc: fr ? 'Écrire à NOVA FOR VISION, studio de création IA à Liège : contact@novaforvision.com ou un message sur Instagram. Devis sous 48 h.' : 'Write to NOVA FOR VISION, an AI creation studio in Liège, Belgium: contact@novaforvision.com or a message on Instagram. Quote within 48 hours.',
    ld,
  }) + '\n' + page(c, 'contact', body, { bodyClass: 'p-contact', noFin: true });
}

/* ---------------- Mentions légales et 404 ---------------- */

function legal(c) {
  const body = `
<article class="lg wrap">
  <h1>Mentions légales et confidentialité</h1>
  <p class="dim">Mise à jour le 24 novembre 2026</p>
  <h2>Éditeur du site</h2>
  <dl class="facts mono">
    <div><dt>Nom</dt><dd>NOVA FOR VISION, studio de création IA, d’effets visuels et de postproduction</dd></div>
    <div><dt>Exploitant</dt><dd>Mikail Yildirim, entreprise en personne physique</dd></div>
    <div><dt>Adresse</dt><dd>Le Hangar Studio, rue Jean Lamoureux 47, 4040 Herstal, Belgique</dd></div>
    <div><dt>N° d’entreprise</dt><dd>BCE 1043.314.281</dd></div>
    <div><dt>TVA</dt><dd>BE 1043.314.281</dd></div>
    <div><dt>E-mail</dt><dd><a href="mailto:${MAIL}">${MAIL}</a></dd></div>
    <div><dt>Instagram</dt><dd><a href="${IG}" rel="noopener" target="_blank">@novaforvision</a></dd></div>
  </dl>
  <h2>Hébergement</h2>
  <p>Le site est hébergé par GitHub Pages (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis). Le nom de domaine est géré par Infomaniak Network SA (Genève, Suisse).</p>
  <h2>Confidentialité</h2>
  <p>Le site ne vend aucune donnée, n’affiche aucune publicité, ne fait aucun profilage et ne dépose aucun cookie. Le responsable du traitement est Mikail Yildirim (NOVA FOR VISION), joignable à <a href="mailto:${MAIL}">${MAIL}</a>.</p>
  <h3>Écrire au studio</h3>
  <p>La phrase à compléter de la page Contact n’envoie rien et n’enregistre rien : le bouton ouvre votre propre messagerie avec un message prêt, que vous restez libre d’envoyer ou non. Si vous nous écrivez (par e-mail ou en message Instagram), nous recevons votre nom, votre adresse ou votre compte et votre message. Ils servent uniquement à vous répondre et à préparer votre projet, à votre demande. Ils sont gardés le temps de l’échange et du projet, puis, si un contrat est conclu, le temps imposé par les obligations comptables. La messagerie du studio est hébergée chez Infomaniak (Suisse). Les messages Instagram suivent la politique de confidentialité de Meta.</p>
  <h3>Statistiques de visite</h3>
  <p>Le site mesure sa fréquentation avec Umami (Umami Software, Inc.), un outil sans cookie qui n’enregistre pas votre adresse IP dans les statistiques. Il compte les pages vues, la page d’où vous venez, le type d’appareil, le navigateur et le pays approximatif, sans pouvoir vous identifier. Cette mesure repose sur notre intérêt légitime à savoir quels projets intéressent les visiteurs.</p>
  <h3>Hébergement</h3>
  <p>Comme tout hébergeur, GitHub enregistre l’adresse IP des visiteurs pour la sécurité de son service, selon sa <a href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener" target="_blank">déclaration de confidentialité</a>.</p>
  <h3>Mémoire du navigateur</h3>
  <p>Pour ne pas rejouer l’intro à chaque page et enchaîner le passage d’une page à l’autre, le site note deux informations dans la mémoire de session de votre navigateur. Elles ne quittent jamais votre appareil et s’effacent à la fermeture de l’onglet. Aucun consentement n’est nécessaire pour cet usage.</p>
  <h3>Vos droits</h3>
  <p>Vous pouvez demander à consulter, corriger, supprimer ou recevoir les données vous concernant, ou vous opposer à leur usage, en écrivant à <a href="mailto:${MAIL}">${MAIL}</a>. Vous pouvez aussi introduire une réclamation auprès de l’Autorité de protection des données, rue de la Presse 35, 1000 Bruxelles (<a href="https://www.autoriteprotectiondonnees.be" rel="noopener" target="_blank">autoriteprotectiondonnees.be</a>).</p>
  <h2>Propriété intellectuelle</h2>
  <p>Les films, images, textes et le logo présentés sur ce site sont protégés par le droit d’auteur et appartiennent à NOVA FOR VISION et aux artistes et réalisateurs crédités. Toute reproduction sans autorisation est interdite.</p>
  <p>Les marques citées appartiennent à leurs titulaires. Oakley × Meta, Tea Storm et LOEWE sont des projets personnels non commandés, sans lien ni partenariat avec Oakley, Meta, Louis Vuitton ni LOEWE.</p>
  <p>Polices Geist et Geist Mono : licence SIL Open Font License 1.1. Animations : GSAP (licence MIT, GreenSock) et Lenis (licence MIT, darkroom.engineering).</p>
</article>`;
  return head(c, { key: 'legal', title: 'Mentions légales et confidentialité · NOVA FOR VISION', desc: 'Éditeur, hébergement, confidentialité et propriété intellectuelle du site de NOVA FOR VISION.', robots: 'noindex, follow', alt: false }) + '\n' + page(c, 'legal', body, { bodyClass: 'p-legal', noFin: true });
}

function notFound(c) {
  const body = `
<section class="nf wrap">
  <h1>Ce plan n’existe pas.</h1>
  <p lang="en" class="dim">This shot doesn’t exist.</p>
  <p class="acts"><a href="/">Accueil</a><a href="/projets/">Projets</a><a href="/en/" lang="en">English</a></p>
</section>`;
  return head(c, { key: 'home', title: 'Page introuvable · NOVA FOR VISION', desc: 'Cette page n’existe pas.', robots: 'noindex', alt: false }).replace(/<link rel="canonical"[^>]*>\n/, '') + '\n' + page(c, 'none', body, { bodyClass: 'p-404', noFin: true });
}

/* ---------------- Plan du site (avec les films) ---------------- */
export function sitemap(date) {
  const keys = ['home', 'projets', 'services', 'studio', 'contact'];
  const alt = k => ['fr', 'en'].map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE + ROUTES[k][l]}"/>`).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + ROUTES[k].fr}"/>`;
  const vids = L => [
    ...CAMPAIGNS.filter(k => k.film).map(k => ({ t: `${k.title}, ${L === 'fr' ? 'campagne' : 'campaign'}`, d: `${k.title}. ${k.credits.map(([a, b]) => (typeof b === 'string' ? b : b[L])).join('. ')}. NOVA FOR VISION.`, src: k.film, th: k.poster, dur: Math.round(k.dur) })),
    ...CLIPS.map(k => ({ t: `${k.title}, ${k.artist}`, d: `${L === 'fr' ? 'Clip' : 'Music video'} ${k.title} (${k.artist}), ${typeof k.role === 'string' ? k.role : k.role[L]}. ${L === 'fr' ? 'Réalisation' : 'Directed by'} ${k.dir}.`, src: k.film, th: k.poster, dur: Math.round(k.dur) })),
  ];
  const v = (L) => vids(L).map(x => `    <video:video>
      <video:thumbnail_loc>${SITE + x.th}</video:thumbnail_loc>
      <video:title>${esc(x.t)}</video:title>
      <video:description>${esc(x.d)}</video:description>
      <video:content_loc>${SITE + x.src}</video:content_loc>
      <video:duration>${x.dur}</video:duration>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`).join('\n');
  const urls = [];
  for (const L of ['fr', 'en']) for (const k of keys) urls.push(`  <url>\n    <loc>${SITE + ROUTES[k][L]}</loc>\n${alt(k)}\n    <lastmod>${date}</lastmod>${k === 'projets' ? '\n' + v(L) : ''}\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
