// Gabarits des pages. Toutes les pages existent en français et en anglais (sauf mentions légales et 404).
// Direction « banc de montage » : fond clair, accueil sur un écran, les projets défilent dans une bande,
// le film s'ouvre sur place. Peu de texte, aucune information répétée.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAIL, IG, SITE, ROUTES, NAV, CAMPAIGNS, CLIPS, ARTISTS, DIRECTORS, METIERS, STEPS, TRACKS, TEAM, BA, ORDER, LOOPS } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0');
const tcode = (s, fps = 25) => { const f = Math.floor((s % 1) * fps); const t = Math.floor(s); return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(f)}`; };

// Logo : lettres et étoile séparées, dans le repère du viewBox (l'intro anime l'étoile seule)
const RAW = readFileSync(join(ROOT, 'assets/nova-white.svg'), 'utf8');
const grp = id => RAW.match(new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`))[1].replace(/ id="[^"]*"/g, '');
const MATRIX = 'matrix(1 0 0 -1 -595.1648 1266.58)';
const LOGO_VB = '0 0 2597.7095 914.6302';
const logoSvg = (cls, label) => `<svg class="${cls}" viewBox="${LOGO_VB}"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true" focusable="false"'}><g class="lg-l"><g transform="${MATRIX}">${grp('nova-letters')}</g></g><g class="lg-s"><g transform="${MATRIX}">${grp('nova-star')}</g></g></svg>`;

export function pages(V) {
  const out = [];
  for (const L of ['fr', 'en']) {
    const ctx = mk(L, V);
    out.push({ path: L === 'fr' ? '' : 'en', html: home(ctx) });
    out.push({ path: ROUTES.projets[L].slice(1), html: projets(ctx) });
    out.push({ path: ROUTES.studio[L].slice(1), html: studio(ctx) });
    out.push({ path: ROUTES.contact[L].slice(1), html: contact(ctx) });
    // l'ancienne page Services est fondue dans Studio
    out.push({ path: (L === 'fr' ? 'services' : 'en/services'), html: moved(ctx, ROUTES.studio[L]) });
  }
  const fr = mk('fr', V);
  out.push({ path: 'mentions-legales', html: legal(fr) });
  out.push({ path: '404.html', html: notFound(fr) });
  return out;
}

function mk(L, V) {
  const t = v => (v == null ? '' : typeof v === 'string' ? v : v[L]);
  const R = key => ROUTES[key][L];
  return { L, V, t, R, fr: L === 'fr' };
}

/* ---------------- Données des projets ---------------- */

const lc = s => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
function project(c, id, i) {
  const { t, fr } = c;
  const camp = CAMPAIGNS.find(k => k.id === id), clip = CLIPS.find(k => k.id === id);
  if (camp) {
    const cred = Object.fromEntries(camp.credits.map(([a, b]) => [t(a), t(b)]));
    const client = cred.Client;
    const line = t(camp.line);
    const m1 = client ? `${fr ? 'Campagne pour' : 'Campaign for'} ${client}` : (/^campa/i.test(line) ? line : `${fr ? 'Campagne' : 'Campaign'}, ${lc(line)}`);
    return {
      i, id, a: camp.anchor, t: camp.title, k: 'c', tint: camp.tint, d: camp.dur || null, fps: camp.fps || 24,
      film: camp.film || null, poster: camp.poster || null, w: 16, h: 9, m1, m2: ['loewe', 'teastorm'].includes(id) ? cred[fr ? 'Livrables' : 'Deliverables'] : cred[fr ? 'Rôle' : 'Role'],
      stills: camp.stills.map(s => ({ s: s.sm || s.img, l: s.img, alt: t(s.alt) })), ...LOOPS[id],
    };
  }
  return {
    i, id, a: clip.anchor, t: clip.title, k: 'v', tint: clip.tint, d: clip.dur, fps: 25, film: clip.film, poster: clip.poster, w: clip.w, h: clip.h,
    m1: `${fr ? 'Clip de' : 'Music video for'} ${clip.artist}`, m2: `${t(clip.role)}, ${fr ? 'réalisation' : 'directed by'} ${clip.dir}`, ig: clip.ig,
    ba: id === 'crame' ? { src: BA.src, poster: BA.poster, d: BA.dur, w: 1596, h: 1080, ch: BA.ch.map((x, j) => [x[0], x[2], t(BA.names[j])]) } : null,
    ...LOOPS[id],
  };
}
const projectsOf = c => ORDER.map((id, i) => project(c, id, i));
const dur = p => (p.d ? tcode(p.d, p.fps) : `${p.stills.length} stills`);
const dataTag = (c, list) => `<script type="application/json" id="nv-data">${JSON.stringify({ L: c.L, p: list, str: strings(c) }).replace(/</g, '\\u003c')}</script>`;
const strings = c => (c.fr
  ? { film: 'Voir le film', stills: 'Voir les stills', modeFilm: 'Film', modeStills: 'Stills', modeBa: 'Avant / après', close: 'Fermer', play: 'Lecture', pause: 'Pause', son: 'Son', fs: 'Plein écran', next: 'Molette : projet suivant', copied: 'Adresse copiée' }
  : { film: 'Watch the film', stills: 'See the stills', modeFilm: 'Film', modeStills: 'Stills', modeBa: 'Before / after', close: 'Close', play: 'Play', pause: 'Pause', son: 'Sound', fs: 'Full screen', next: 'Scroll: next project', copied: 'Address copied' });

/* ---------------- Morceaux communs ---------------- */

function head(c, { key, title, desc, preload = [], ld = null, robots = null, alt = true, home = false }) {
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
<meta name="theme-color" content="#e4e4e0">
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
<link rel="preload" href="/assets/fonts/geist-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/geist-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>${preload.map(p => `\n<link rel="preload" href="${p}" as="image">`).join('')}
<link rel="stylesheet" href="/assets/nova.css?v=${V.css}">
<script type="speculationrules">{"prefetch":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>
<script>${boot(key, home)}</script>
<script defer src="/assets/nova.js?v=${V.js}"></script>
</head>`;
}

// avant le premier affichage : anciennes adresses, intro une fois par session, préférence de son
function boot(key, home) {
  const redirects = key === 'home' ? `var m={contact:'contact/',studio:'studio/',campagnes:'projets/',clips:'projets/','clips-open':'projets/','avant-apres':'projets/#crame',generique:'studio/'},h=location.hash.slice(1);if(m[h]&&/^\\/(en\\/)?$/.test(location.pathname)){location.replace(location.pathname+m[h]);return;}` : '';
  return `(function(){${redirects}var d=document.documentElement;d.classList.add('js');try{${home ? `if(sessionStorage.getItem('nv-intro')!=='1'&&!location.hash&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('intro');` : ''}if(localStorage.getItem('nv-son')!=='0')d.classList.add('son')}catch(e){}})();`;
}

function top(c, key) {
  const { R, fr } = c;
  return `<a class="skip" href="#main">${fr ? 'Aller au contenu' : 'Skip to content'}</a>
<header class="tp">
  ${key === 'home' ? '<span></span>' : `<a class="tp-logo" href="${R('home')}" aria-label="${fr ? 'NOVA FOR VISION, accueil' : 'NOVA FOR VISION, home'}">${logoSvg('tp-svg')}</a>`}
  <p class="tp-clock mono" aria-hidden="true"><span>Liège</span> <span id="clock">00:00:00:00</span></p>
</header>`;
}

function foot(c, key, { sound = false } = {}) {
  const { R, fr, L } = c;
  const other = L === 'fr' ? 'en' : 'fr';
  const altHref = ROUTES[key] && key !== 'legal' ? ROUTES[key][other] : ROUTES.home[other];
  return `<footer class="ft">
  <p class="ft-l"><span>© 2026 NOVA FOR VISION</span><a href="/mentions-legales/"${fr ? '' : ' hreflang="fr"'}>${fr ? 'Mentions légales' : 'Legal notice'}</a>${sound ? `<button type="button" class="ft-son" data-son aria-pressed="false"><span class="on">${fr ? 'Son actif' : 'Sound on'}</span><span class="off">${fr ? 'Son coupé' : 'Sound off'}</span></button>` : ''}</p>
  <p class="ft-r"><a href="${IG}" rel="noopener" target="_blank">Instagram</a><a href="mailto:${MAIL}">${MAIL}</a><a href="${altHref}" hreflang="${other}" lang="${other}">${other.toUpperCase()}</a></p>
</footer>
<nav class="mn" id="mn" aria-label="Menu" hidden>
  <ul>${NAV.map(([k, n]) => `<li><a href="${R(k)}"${k === key ? ' aria-current="page"' : ''}>${c.t(n)}</a></li>`).join('')}</ul>
</nav>
<button class="mn-b" id="mn-b" type="button" aria-expanded="false" aria-controls="mn"><span class="mn-l" aria-hidden="true"></span><span class="sr">Menu</span></button>`;
}

// le film, ouvert sur place (accueil et projets)
function viewer(c) {
  const { fr } = c;
  return `<div class="fv" id="fv" role="dialog" aria-modal="true" aria-labelledby="fv-t" hidden>
  <div class="fv-top"><p class="mono" id="fv-idx"></p><p class="mono fv-hint" id="fv-hint"></p><button type="button" class="fv-x" id="fv-x">${fr ? 'Fermer' : 'Close'}</button></div>
  <div class="fv-stage" id="fv-stage"><video id="fv-v" playsinline preload="none"></video><img id="fv-i" alt="" hidden><canvas class="fv-noise" id="fv-n" aria-hidden="true"></canvas></div>
  <div class="fv-bot">
    <div class="fv-h"><h2 class="fv-t" id="fv-t"></h2><p class="fv-m" id="fv-m"></p></div>
    <div class="fv-c"><div class="fv-modes" id="fv-modes" role="group"></div><button type="button" id="fv-play"></button><button type="button" id="fv-snd" data-son aria-pressed="false"><span class="on">${fr ? 'Son actif' : 'Sound on'}</span><span class="off">${fr ? 'Son coupé' : 'Sound off'}</span></button><button type="button" id="fv-fs">${fr ? 'Plein écran' : 'Full screen'}</button><span class="mono fv-tc" id="fv-tc"></span></div>
    <div class="fv-rule" id="fv-rule" role="slider" tabindex="0" aria-label="${fr ? 'Position dans le film' : 'Position in the film'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="fv-ticks" id="fv-ticks"></div><div class="fv-ph" id="fv-ph"></div></div>
  </div>
</div>
<div class="tr" id="tr" aria-hidden="true"><div class="tr-m" id="tr-m"></div><p class="tr-t" id="tr-t"></p><p class="tr-n mono" id="tr-n">000</p></div>`;
}

function page(c, key, body, { bodyClass = '', withViewer = false, data = null, sound = false } = {}) {
  return `<body class="${bodyClass}">
${top(c, key)}
<main id="main">
${body}
</main>
${foot(c, key, { sound })}
<div class="cur" id="cur" aria-hidden="true"><span id="cur-t"></span></div>
${withViewer ? viewer(c) : ''}
${data ? dataTag(c, data) : ''}
</body>
</html>
`;
}

const orgLd = c => ({ '@type': 'Organization', '@id': `${SITE}/#studio`, name: 'NOVA FOR VISION', alternateName: 'NOVA', url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo.png`, width: 600, height: 600 }, image: `${SITE}/assets/og.jpg`,
  description: c.fr ? 'Studio indépendant de création visuelle à Liège : campagnes IA, clips, effets visuels et postproduction pour les marques et les artistes, en Belgique et en France.' : 'Independent visual creation studio in Liège, Belgium: AI campaigns, music videos, visual effects and post-production for brands and artists.',
  email: MAIL, address: { '@type': 'PostalAddress', addressLocality: 'Liège', addressCountry: 'BE' }, areaServed: ['BE', 'FR'],
  knowsAbout: c.fr ? ['Création vidéo IA', 'Campagnes publicitaires IA', 'Effets visuels (VFX)', 'Postproduction', 'Montage vidéo', 'Motion design', 'Sound design', 'Direction artistique', 'Storyboard'] : ['AI video creation', 'AI ad campaigns', 'Visual effects (VFX)', 'Post-production', 'Video editing', 'Motion design', 'Sound design', 'Art direction', 'Storyboard'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: MAIL, availableLanguage: ['French', 'English'] }, sameAs: [IG] });

// lien d'un projet : sans script, il mène au film (ou à la première image)
const href = p => p.film || p.stills[0].l;

/* ---------------- Accueil : un écran ---------------- */

function home(c) {
  const { fr, L } = c;
  const P = projectsOf(c);
  const dMax = 40;
  const tiles = P.map(p => {
    const h = p.d ? Math.min(1, p.d / dMax) : 0.62;
    return `<a class="tl" href="${href(p)}" data-id="${p.id}" style="--h:${h.toFixed(3)};--tint:${p.tint}">
  <span class="tl-m"><img src="${p.tile.p}" alt="" width="600" height="800" decoding="async"${p.i < 6 ? '' : ' loading="lazy"'}>${p.tile.v ? `<video muted loop playsinline preload="none" data-src="${p.tile.v}" aria-hidden="true"></video>` : ''}</span>
  <span class="tl-c"><span class="tl-t">${esc(p.t)}</span><span class="tl-s"><span>${esc(p.m1)}</span><span class="mono">${dur(p)}</span></span></span>
</a>`;
  }).join('\n');
  const body = `
<section class="sp" id="sp" aria-label="${fr ? 'Projets' : 'Projects'}">
<div class="sp-tr" id="sp-tr">
${tiles}
</div>
</section>
<div class="hm">
  <h1 class="hm-h">${logoSvg('hm-logo', 'NOVA FOR VISION')}</h1>
  <div class="hm-d">
    <p class="hm-k">NOVA FOR VISION</p>
    <p class="hm-p">${fr ? 'Studio de création visuelle à Liège. Campagnes IA, clips, effets visuels et postproduction, pour les marques et les artistes.' : 'Visual creation studio in Liège. AI campaigns, music videos, visual effects and post-production, for brands and artists.'}</p>
  </div>
</div>`;
  const ld = { '@context': 'https://schema.org', '@graph': [orgLd(c), { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'NOVA FOR VISION', inLanguage: L, publisher: { '@id': `${SITE}/#studio` } }] };
  return head(c, {
    key: 'home', home: true,
    title: fr ? 'NOVA FOR VISION · Studio de création visuelle à Liège' : 'NOVA FOR VISION · Visual creation studio in Liège',
    desc: fr ? 'Studio de création visuelle à Liège : campagnes IA, clips, effets visuels et postproduction pour les marques et les artistes. Oakley × Meta, LOEWE, Beymen, CRAMÉ, NDRANGETHA, ZORO.' : 'Visual creation studio in Liège, Belgium: AI campaigns, music videos, visual effects and post-production for brands and artists. Oakley × Meta, LOEWE, Beymen, CRAMÉ, NDRANGETHA, ZORO.',
    preload: P.slice(0, 4).map(p => p.tile.p), ld,
  }) + '\n' + page(c, 'home', body, { bodyClass: 'p-home', withViewer: true, data: P, sound: true });
}

/* ---------------- Projets : la roue ---------------- */

function projets(c) {
  const { fr, L } = c;
  const P = projectsOf(c);
  const nC = P.filter(p => p.k === 'c').length, nV = P.length - nC;
  const items = P.map(p => `<li class="wh-i" data-id="${p.id}" data-k="${p.k}" style="--tint:${p.tint}"><a href="${href(p)}" id="${p.a}"><span class="wh-n mono">${pad(p.i + 1)}</span><span class="wh-tb"><span class="wh-t">${esc(p.t)}</span><span class="wh-d mono">${dur(p)}</span></span></a></li>`).join('\n');
  const body = `
<h1 class="sr">${fr ? 'Projets' : 'Projects'}</h1>
<div class="wh-f" role="group" aria-label="${fr ? 'Filtrer les projets' : 'Filter projects'}">
  <button type="button" data-f="all" aria-pressed="true">${fr ? 'Tout' : 'All'} <span class="mono">${P.length}</span></button>
  <button type="button" data-f="c" aria-pressed="false">${fr ? 'Campagnes' : 'Campaigns'} <span class="mono">${nC}</span></button>
  <button type="button" data-f="v" aria-pressed="false">${fr ? 'Clips' : 'Music videos'} <span class="mono">${nV}</span></button>
</div>
<section class="wh" id="wh" aria-label="${fr ? 'Tous les projets' : 'All projects'}">
  <button type="button" class="wh-st" id="wh-st" aria-label=""><img id="wh-si" alt="" width="960" height="540"><video id="wh-sv" muted loop playsinline preload="none" aria-hidden="true"></video></button>
  <ol class="wh-l" id="wh-l">
${items}
  </ol>
  <div class="wh-th" id="wh-th" aria-hidden="true">${P.map(p => `<img src="${p.stage.p}" alt="" width="960" height="540" loading="lazy" decoding="async" data-id="${p.id}">`).join('')}</div>
  <div class="wh-m" id="wh-m" aria-live="polite"><p class="wh-m1" id="wh-m1"></p><p class="wh-m2" id="wh-m2"></p><p class="wh-go"><button type="button" id="wh-go"></button></p></div>
</section>`;
  const vids = P.filter(p => p.film);
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', url: SITE + ROUTES.projets[L], name: fr ? 'Projets de NOVA FOR VISION' : 'NOVA FOR VISION projects',
    hasPart: vids.map(p => ({ '@type': 'VideoObject', name: `${p.t}, ${p.m1}`, description: `${p.t}. ${p.m1}. ${p.m2}.`, contentUrl: SITE + p.film, thumbnailUrl: SITE + (p.poster || p.stage.p), uploadDate: '2026-11-01', duration: `PT${Math.round(p.d)}S`, creator: { '@id': `${SITE}/#studio` } })) };
  return head(c, {
    key: 'projets',
    title: fr ? 'Projets · NOVA FOR VISION' : 'Projects · NOVA FOR VISION',
    desc: fr ? 'Les projets de NOVA FOR VISION : campagnes IA (Oakley × Meta, Beymen, LOEWE, Tea Storm) et clips (CRAMÉ, NDRANGETHA, ZORO, KILLCAM, JAMAÏQUAINE IS DEAD, BACK, DEMANDEASHH).' : 'NOVA FOR VISION projects: AI campaigns (Oakley × Meta, Beymen, LOEWE, Tea Storm) and music videos (CRAMÉ, NDRANGETHA, ZORO, KILLCAM, JAMAÏQUAINE IS DEAD, BACK, DEMANDEASHH).',
    preload: [P[0].stage.p], ld,
  }) + '\n' + page(c, 'projets', body, { bodyClass: 'p-projets', withViewer: true, data: P, sound: true });
}

/* ---------------- Studio ---------------- */

function studio(c) {
  const { t, fr, L } = c;
  const body = `
<article class="st">
  <h1 class="st-h"><span class="st-in" aria-hidden="true"></span>${fr ? 'NOVA FOR VISION fabrique des images pour les marques et les artistes : campagnes IA, clips, effets visuels, montage et son.' : 'NOVA FOR VISION makes images for brands and artists: AI campaigns, music videos, visual effects, editing and sound.'}</h1>
  <section class="st-r" aria-labelledby="st-sf">
    <h2 class="st-k" id="st-sf">${fr ? 'Savoir-faire' : 'Crafts'}</h2>
    <ul class="st-sf">${METIERS.map(m => `<li><span class="st-sf-n">${t(m.name)}</span><span class="st-sf-t">${t(m.text)}</span></li>`).join('')}</ul>
  </section>
  <section class="st-r" aria-labelledby="st-me">
    <h2 class="st-k" id="st-me">${fr ? 'Méthode' : 'Method'}</h2>
    <div class="tl6" id="tl6">
      <div class="tl6-rule" aria-hidden="true">${STEPS.map((_, i) => `<span>${pad(i + 1)}</span>`).join('')}</div>
      <div class="tl6-tr">${TRACKS.map((tk, ti) => `<span class="tl6-row" style="--r:${ti + 2}" aria-hidden="true"></span><p class="tl6-lab mono" style="--r:${ti + 2}">${t(tk)}</p>`).join('')}
        <ol>${STEPS.map((s, i) => `<li style="--c:${i + 2};--r:${s.who + 2}"><span class="tl6-b">${t(s.name)}</span><span class="tl6-x">${t(s.text)}</span></li>`).join('')}</ol>
        <span class="tl6-ph" id="tl6-ph" aria-hidden="true"></span>
      </div>
    </div>
  </section>
  <section class="st-r" aria-labelledby="st-eq">
    <h2 class="st-k" id="st-eq">${fr ? 'Fondateurs' : 'Founders'}</h2>
    <div class="st-eq">${TEAM.map(m => `<details class="st-p"><summary><span class="st-pn">${m.name}</span><span class="st-pr">${t(m.role)}, ${lc(t(m.craft))}</span><span class="st-pm mono">${fr ? 'Parcours' : 'Background'}</span></summary><p>${t(m.bio)}</p></details>`).join('')}</div>
  </section>
  <section class="st-r" aria-labelledby="st-av">
    <h2 class="st-k" id="st-av">${fr ? 'Avec' : 'With'}</h2>
    <p class="st-av">${ARTISTS.map(esc).join(', ')}<span class="st-dir">${fr ? 'Réalisateurs' : 'Directors'} : ${DIRECTORS.join(', ')}</span></p>
  </section>
  <a class="st-mail" href="mailto:${MAIL}" data-fit>${fr ? 'Écrire au studio' : 'Write to the studio'}</a>
</article>`;
  const ld = { '@context': 'https://schema.org', '@type': 'AboutPage', url: SITE + ROUTES.studio[L], about: orgLd(c), mainEntity: TEAM.map(m => ({ '@type': 'Person', name: m.name, jobTitle: t(m.role), worksFor: { '@id': `${SITE}/#studio` } })) };
  return head(c, {
    key: 'studio',
    title: fr ? 'Studio · NOVA FOR VISION' : 'Studio · NOVA FOR VISION',
    desc: fr ? 'NOVA FOR VISION, studio de création visuelle à Liège : savoir-faire, méthode de travail et fondateurs, Mikail et Adem Yildirim.' : 'NOVA FOR VISION, visual creation studio in Liège, Belgium: crafts, way of working and founders, Mikail and Adem Yildirim.',
    ld,
  }) + '\n' + page(c, 'studio', body, { bodyClass: 'p-studio' });
}

/* ---------------- Contact ---------------- */

function contact(c) {
  const { fr, L } = c;
  const [u, d] = MAIL.split('@');
  const body = `
<section class="ct">
  <div class="ct-a">
    <h1 class="ct-k">${fr ? 'Écrire au studio' : 'Write to the studio'}</h1>
    <a class="ct-mail" href="mailto:${MAIL}"><span data-fit>${u}@</span><span data-fit>${d}</span></a>
    <p class="ct-acts"><button type="button" class="ct-copy" data-copy="${MAIL}" data-done="${fr ? 'Adresse copiée' : 'Address copied'}">${fr ? 'Copier l’adresse' : 'Copy the address'}</button><a href="${IG}" rel="noopener" target="_blank">${fr ? 'Message sur Instagram' : 'Message on Instagram'}</a></p>
    <dl class="ct-f">
      <div><dt>${fr ? 'Devis' : 'Quote'}</dt><dd>${fr ? 'Sous 48 h' : 'Within 48 hours'}</dd></div>
      <div><dt>Studio</dt><dd>${fr ? 'Liège, Belgique' : 'Liège, Belgium'}</dd></div>
      <div><dt>${fr ? 'Langues' : 'Languages'}</dt><dd>${fr ? 'Français, anglais' : 'French, English'}</dd></div>
    </dl>
  </div>
  <div class="ct-b" aria-hidden="true"><video muted loop playsinline autoplay preload="metadata" poster="/media/stage/loewe.jpg" src="/media/stage/loewe.mp4"></video></div>
</section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'ContactPage', url: SITE + ROUTES.contact[L], about: { '@type': 'Organization', name: 'NOVA FOR VISION', email: MAIL, url: `${SITE}/` } };
  return head(c, {
    key: 'contact',
    title: fr ? 'Contact · NOVA FOR VISION' : 'Contact · NOVA FOR VISION',
    desc: fr ? 'Écrire à NOVA FOR VISION, studio de création visuelle à Liège : contact@novaforvision.com ou un message sur Instagram. Devis sous 48 h.' : 'Write to NOVA FOR VISION, a visual creation studio in Liège, Belgium: contact@novaforvision.com or a message on Instagram. Quote within 48 hours.',
    ld,
  }) + '\n' + page(c, 'contact', body, { bodyClass: 'p-contact' });
}

/* ---------------- Page déplacée, mentions légales et 404 ---------------- */

function moved(c, to) {
  return `<!doctype html>
<html lang="${c.L}">
<head>
<meta charset="utf-8">
<title>NOVA FOR VISION</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${SITE + to}">
<meta http-equiv="refresh" content="0; url=${to}">
</head>
<body><p><a href="${to}">${c.fr ? 'Cette page a rejoint la page Studio.' : 'This page is now part of the Studio page.'}</a></p></body>
</html>
`;
}

function legal(c) {
  const body = `
<article class="lg">
  <h1>Mentions légales et confidentialité</h1>
  <p class="lg-d">Mise à jour le 25 novembre 2026</p>
  <h2>Éditeur du site</h2>
  <dl>
    <div><dt>Nom</dt><dd>NOVA FOR VISION, studio de création visuelle, d’effets visuels et de postproduction</dd></div>
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
  <p>Si vous nous écrivez (par e-mail ou en message Instagram), nous recevons votre nom, votre adresse ou votre compte et votre message. Ils servent uniquement à vous répondre et à préparer votre projet, à votre demande. Ils sont gardés le temps de l’échange et du projet, puis, si un contrat est conclu, le temps imposé par les obligations comptables. La messagerie du studio est hébergée chez Infomaniak (Suisse). Les messages Instagram suivent la politique de confidentialité de Meta.</p>
  <h3>Statistiques de visite</h3>
  <p>Le site mesure sa fréquentation avec Umami (Umami Software, Inc.), un outil sans cookie qui n’enregistre pas votre adresse IP dans les statistiques. Il compte les pages vues, la page d’où vous venez, le type d’appareil, le navigateur et le pays approximatif, sans pouvoir vous identifier. Cette mesure repose sur notre intérêt légitime à savoir quels projets intéressent les visiteurs.</p>
  <h3>Hébergement</h3>
  <p>Comme tout hébergeur, GitHub enregistre l’adresse IP des visiteurs pour la sécurité de son service, selon sa <a href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener" target="_blank">déclaration de confidentialité</a>.</p>
  <h3>Mémoire du navigateur</h3>
  <p>Pour ne pas rejouer l’intro à chaque page, le site note une information dans la mémoire de session de votre navigateur, qui s’efface à la fermeture de l’onglet. Si vous activez le son, ce choix est noté dans la mémoire locale du navigateur pour vos prochaines visites. Ces informations ne quittent jamais votre appareil. Aucun consentement n’est nécessaire pour cet usage.</p>
  <h3>Vos droits</h3>
  <p>Vous pouvez demander à consulter, corriger, supprimer ou recevoir les données vous concernant, ou vous opposer à leur usage, en écrivant à <a href="mailto:${MAIL}">${MAIL}</a>. Vous pouvez aussi introduire une réclamation auprès de l’Autorité de protection des données, rue de la Presse 35, 1000 Bruxelles (<a href="https://www.autoriteprotectiondonnees.be" rel="noopener" target="_blank">autoriteprotectiondonnees.be</a>).</p>
  <h2>Propriété intellectuelle</h2>
  <p>Les films, images, textes et le logo présentés sur ce site sont protégés par le droit d’auteur et appartiennent à NOVA FOR VISION et aux artistes et réalisateurs crédités. Toute reproduction sans autorisation est interdite.</p>
  <p>Les marques citées appartiennent à leurs titulaires. Oakley × Meta, Tea Storm et LOEWE sont des projets personnels non commandés, sans lien ni partenariat avec Oakley, Meta, Louis Vuitton ni LOEWE.</p>
  <p>Polices Geist et Geist Mono : licence SIL Open Font License 1.1. Animations : GSAP (licence MIT, GreenSock).</p>
</article>`;
  return head(c, { key: 'legal', title: 'Mentions légales et confidentialité · NOVA FOR VISION', desc: 'Éditeur, hébergement, confidentialité et propriété intellectuelle du site de NOVA FOR VISION.', robots: 'noindex, follow', alt: false }) + '\n' + page(c, 'legal', body, { bodyClass: 'p-legal' });
}

function notFound(c) {
  const body = `
<section class="nf">
  <h1 class="nf-h" data-fit>${'Ce plan n’existe pas'}</h1>
  <p lang="en">This shot doesn’t exist</p>
  <p class="nf-a"><a href="/">Accueil</a><a href="/projets/">Projets</a><a href="/en/" lang="en">English</a></p>
</section>`;
  return head(c, { key: 'home', title: 'Page introuvable · NOVA FOR VISION', desc: 'Cette page n’existe pas.', robots: 'noindex', alt: false }).replace(/<link rel="canonical"[^>]*>\n/, '') + '\n' + page(c, 'none', body, { bodyClass: 'p-404' });
}

/* ---------------- Plan du site (avec les films) ---------------- */
export function sitemap(date) {
  const keys = ['home', 'projets', 'studio', 'contact'];
  const alt = k => ['fr', 'en'].map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE + ROUTES[k][l]}"/>`).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + ROUTES[k].fr}"/>`;
  const vids = L => projectsOf(mk(L, {})).filter(p => p.film).map(p => ({ t: `${p.t}, ${p.m1}`, d: `${p.t}. ${p.m1}. ${p.m2}. NOVA FOR VISION.`, src: p.film, th: p.poster || p.stage.p, dur: Math.round(p.d) }));
  const v = L => vids(L).map(x => `    <video:video>
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
