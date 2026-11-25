// Gabarits des pages. Toutes les pages existent en français et en anglais (sauf mentions légales et 404).
// Direction : d'après AUGE Experience, le site préféré de Nathan. Fond clair, une couleur d'accent fixe,
// titres très gras et étroits mêlés d'italiques, accueil sur un écran, une page par projet (sans étude de cas).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAIL, IG, SITE, ROUTES, CAMPAIGNS, CLIPS, ARTISTS, ARTIST_CLIP, ARTIST_DIR, METIERS, TEAM, BA, ORDER, LOOPS, DESC, FRAMES } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad3 = n => String(n).padStart(3, '0');
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// Logo : lettres et étoile séparées, dans le repère du viewBox
const RAW = readFileSync(join(ROOT, 'assets/nova-white.svg'), 'utf8');
const grp = id => RAW.match(new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`))[1].replace(/ id="[^"]*"/g, '');
const MATRIX = 'matrix(1 0 0 -1 -595.1648 1266.58)';
const LOGO_VB = '0 0 2597.7095 914.6302';
const logoSvg = (cls, label) => `<svg class="${cls}" viewBox="${LOGO_VB}"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true" focusable="false"'}><g class="lg-l"><g transform="${MATRIX}">${grp('nova-letters')}</g></g><g class="lg-s"><g transform="${MATRIX}">${grp('nova-star')}</g></g></svg>`;

export function pages(V) {
  const out = [];
  for (const L of ['fr', 'en']) {
    const ctx = mk(L, V);
    const P = projectsOf(ctx);
    out.push({ path: L === 'fr' ? '' : 'en', html: home(ctx, P) });
    out.push({ path: ROUTES.projets[L].slice(1), html: works(ctx, P) });
    P.forEach(p => out.push({ path: (ROUTES.projets[L] + p.a).slice(1), html: project(ctx, P, p) }));
    out.push({ path: ROUTES.studio[L].slice(1), html: studio(ctx, P) });
    out.push({ path: ROUTES.contact[L].slice(1), html: contact(ctx) });
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

function projectsOf(c) {
  const { t, fr } = c;
  return ORDER.map((id, i) => {
    const camp = CAMPAIGNS.find(k => k.id === id), clip = CLIPS.find(k => k.id === id);
    const base = { i, id, ...LOOPS[id], cover: { v: id === 'teastorm' ? null : `/media/cover/${id}.mp4`, p: `/media/cover/${id}.jpg` }, desc: t(DESC[id]) };
    if (camp) {
      const cred = Object.fromEntries(camp.credits.map(([a, b]) => [t(a), t(b)]));
      const role = cred[fr ? 'Rôle' : 'Role'];
      const rows = [];
      if (cred.Client) rows.push(['Client', cred.Client]);
      rows.push([fr ? 'Livrables' : 'Deliverables', cred[fr ? 'Livrables' : 'Deliverables']]);
      if (camp.dur) rows.push([fr ? 'Durée du film' : 'Film length', mmss(camp.dur)]);
      return { ...base, a: camp.anchor, t: camp.title, k: 'c', cat: fr ? 'Campagne IA' : 'AI campaign', tint: camp.tint, d: camp.dur || null, w: 16, h: 9,
        film: camp.film || null, poster: camp.poster || null, roles: role.split(/, | et | and /).map(r => r.charAt(0).toUpperCase() + r.slice(1)), rows,
        gal: pick(id, camp.stills).map(s => ({ l: s.img, s: s.sm || s.img, alt: t(s.alt), v: s.video || null })) };
    }
    const roles = t(clip.role).split(', ').map(r => (r === 'SFX' ? 'Sound design' : r));
    return { ...base, a: clip.anchor, t: clip.title, k: 'v', cat: fr ? 'Clip' : 'Music video', tint: clip.tint, d: clip.dur, w: clip.w, h: clip.h,
      film: clip.film, poster: clip.poster, roles,
      rows: [[fr ? 'Artiste' : 'Artist', clip.artist], [fr ? 'Réalisation' : 'Director', clip.dir], [fr ? 'Durée' : 'Length', mmss(clip.dur)]],
      gal: FRAMES[id].map((f, j) => ({ l: f.l, s: f.s, alt: `${clip.title}, ${fr ? 'image' : 'frame'} ${j + 1}`, v: null, tall: id === 'demandeashh' })),
      ba: id === 'crame' ? { src: BA.src, poster: BA.poster, ch: BA.ch.map((x, j) => [x[0], x[2], t(BA.names[j])]), d: BA.dur } : null };
  });
}
const pHref = (c, p) => ROUTES.projets[c.L] + p.a + '/';
// six images au plus par projet, réparties dans la série
const PICK = { beymen: [0, 2, 4, 6, 8, 10], teastorm: [0, 3, 4, 5, 8, 9] };
function pick(id, list) { return PICK[id] ? PICK[id].map(i => list[i]) : list.slice(0, 6); }

/* ---------------- Morceaux communs ---------------- */

function head(c, { key, path, title, desc, preload = [], ld = null, robots = null, alt = null }) {
  const { L, V } = c;
  const url = SITE + path;
  const alts = alt ? `
<link rel="alternate" hreflang="fr" href="${SITE + alt.fr}">
<link rel="alternate" hreflang="en" href="${SITE + alt.en}">
<link rel="alternate" hreflang="x-default" href="${SITE + alt.fr}">` : '';
  return `<!doctype html>
<html lang="${L}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#ececE6">
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
<link rel="preload" href="/assets/fonts/archivo-800-78.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/geist-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/newsreader-italic-72.woff2" as="font" type="font/woff2" crossorigin>${preload.map(p => `\n<link rel="preload" href="${p}" as="image">`).join('')}
<link rel="stylesheet" href="/assets/nova.css?v=${V.css}">
<script>${boot(key)}</script>
<script defer src="/assets/nova.js?v=${V.js}"></script>
</head>`;
}

// avant le premier affichage : anciennes adresses, chargeur une fois par session, passage d'une page à l'autre
function boot(key) {
  const anchors = ORDER.map(id => (CAMPAIGNS.find(k => k.id === id) || CLIPS.find(k => k.id === id)).anchor);
  const redirects = key === 'home'
    ? `var m={contact:'contact/',studio:'studio/',campagnes:'projets/',clips:'projets/','clips-open':'projets/','avant-apres':'projets/crame/',generique:'studio/'},h=location.hash.slice(1);if(m[h]&&/^\\/(en\\/)?$/.test(location.pathname)){location.replace(location.pathname+(location.pathname==='/en/'?m[h].replace('projets','projects'):m[h]));return;}`
    : key === 'projets' ? `var a=${JSON.stringify(anchors)},h=location.hash.slice(1);if(a.indexOf(h)>-1&&/(projets|projects)\\/$/.test(location.pathname)){location.replace(location.pathname+h+'/');return;}` : '';
  return `(function(){${redirects}var d=document.documentElement;d.classList.add('js');try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r&&sessionStorage.getItem('nv-ld')!=='1')d.classList.add('ld-on');else if(!r&&sessionStorage.getItem('nv-tr'))d.classList.add('tr-in');if(localStorage.getItem('nv-son')!=='0')d.classList.add('son')}catch(e){}})();`;
}

const speaker = `<svg class="ic" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="currentColor"/><path class="ic-on" d="M13 6.5c1 1 1.5 2.2 1.5 3.5s-.5 2.5-1.5 3.5M15.5 4.5c1.6 1.5 2.5 3.4 2.5 5.5s-.9 4-2.5 5.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path class="ic-off" d="M13 7.5l5 5M18 7.5l-5 5" stroke="currentColor" stroke-width="1.4"/></svg>`;

function chrome(c, key, altHref, { cat = '' } = {}) {
  const { R, fr, L } = c;
  const other = L === 'fr' ? 'en' : 'fr';
  const nav = [['projets', { fr: 'Projets', en: 'Projects' }], ['studio', { fr: 'Studio', en: 'Studio' }], ['contact', { fr: 'Contact', en: 'Contact' }]];
  return `<a class="skip" href="#main">${fr ? 'Aller au contenu' : 'Skip to content'}</a>
<a class="mk" href="${R('home')}" data-tr="NOVA" aria-label="${fr ? 'NOVA FOR VISION, accueil' : 'NOVA FOR VISION, home'}"><img src="/assets/nova-star.svg" alt="" width="64" height="23"></a>
<footer class="ft">
  <p class="ft-l"><span>© 2026<span class="ft-x"> — BE 1043.314.281</span></span><span class="ft-s" aria-hidden="true">|</span><a href="/mentions-legales/"${fr ? '' : ' hreflang="fr"'}>${fr ? 'Mentions légales' : 'Legal notice'}</a><span class="ft-s" aria-hidden="true">|</span><button type="button" class="ft-son" data-son aria-pressed="false" aria-label="${fr ? 'Son' : 'Sound'}">${speaker}</button></p>
  ${cat ? `<p class="ft-c" data-scr>${esc(cat)}</p>` : ''}
  <p class="ft-r"><a href="${IG}" rel="noopener" target="_blank">Instagram</a><span class="ft-s" aria-hidden="true">|</span><a href="${altHref}" hreflang="${other}" lang="${other}" data-tr="${other === 'en' ? 'English' : 'Français'}">${other === 'en' ? 'English' : 'Français'}</a></p>
</footer>
<nav class="mn" id="mn" aria-label="Menu" hidden><ul>${nav.map(([k, n]) => `<li><a href="${R(k)}" data-tr="${c.t(n)}"${k === key ? ' aria-current="page"' : ''}>${c.t(n)}</a></li>`).join('')}</ul></nav>
<button class="mn-b" id="mn-b" type="button" aria-expanded="false" aria-controls="mn"><span class="mn-l" aria-hidden="true"></span><span class="sr">Menu</span></button>
<div class="cur" id="cur" aria-hidden="true"><i></i><span id="cur-t"></span></div>
<div class="tr" id="tr" aria-hidden="true"><div class="tr-m" id="tr-m"></div><p class="tr-t" id="tr-t"></p><p class="tr-n" id="tr-n">000</p></div>
<div class="ld" id="ld" aria-hidden="true">${logoSvg('ld-logo')}<p class="ld-i">for Vision</p><p class="ld-n" id="ld-n">000</p></div>`;
}

function page(c, key, body, { bodyClass = '', alt, cat = '', data = null } = {}) {
  return `<body class="${bodyClass}">
<main id="main">
${body}
</main>
${chrome(c, key, alt, { cat })}
${data ? `<script type="application/json" id="nv-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>` : ''}
</body>
</html>
`;
}

const orgLd = c => ({ '@type': 'Organization', '@id': `${SITE}/#studio`, name: 'NOVA FOR VISION', alternateName: 'NOVA', url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo.png`, width: 600, height: 600 }, image: `${SITE}/assets/og.jpg`,
  description: c.fr ? 'Studio indépendant de création visuelle à Liège : campagnes IA, clips, effets visuels et postproduction pour les marques et les artistes, en Belgique et en France.' : 'Independent visual creation studio in Liège, Belgium: AI campaigns, music videos, visual effects and post-production for brands and artists.',
  email: MAIL, address: { '@type': 'PostalAddress', addressLocality: 'Liège', addressCountry: 'BE' }, areaServed: ['BE', 'FR'],
  knowsAbout: c.fr ? ['Création vidéo IA', 'Campagnes publicitaires IA', 'Effets visuels (VFX)', 'Postproduction', 'Montage vidéo', 'Motion design', 'Sound design', 'Direction artistique', 'Storyboard'] : ['AI video creation', 'AI ad campaigns', 'Visual effects (VFX)', 'Post-production', 'Video editing', 'Motion design', 'Sound design', 'Art direction', 'Storyboard'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: MAIL, availableLanguage: ['French', 'English'] }, sameAs: [IG] });

const S = c => (c.fr
  ? { see: 'Voir le projet', play: 'Lire le film', pause: 'Pause', copied: 'Adresse copiée' }
  : { see: 'View project', play: 'Play the film', pause: 'Pause', copied: 'Address copied' });

// titre en deux voix : *mot* en italique, _mot_ dans la couleur d'accent, [a] image dans la ligne, ↪ flèche, ✱ astérisque.
// Les morceaux collés (sans espace) restent un seul mot : « (L’_I_A » donne un mot dont le I est en couleur.
function mixed(str, imgs = {}) {
  const sym = { '↪': `<span class="mx-w mx-sym" aria-hidden="true"><svg viewBox="0 0 120 96"><path d="M10 4c0 46 28 68 84 68" fill="none" stroke="currentColor" stroke-width="8"/><path d="M72 46l26 26-26 26" fill="none" stroke="currentColor" stroke-width="8"/></svg></span>`, '✱': '<span class="mx-w mx-sym mx-ast" aria-hidden="true">✱</span>' };
  return str.split('\n').map(line => {
    const segs = line.split(/(\*[^*]+\*|_[^_]+_|\[[a-z0-9]+\]|↪|✱)/).filter(Boolean);
    const words = []; let cur = '';
    const flush = () => { if (cur) { words.push(`<span class="mx-w">${cur}</span>`); cur = ''; } };
    for (const sg of segs) {
      if (/^\*.+\*$/.test(sg)) cur += `<em>${esc(sg.slice(1, -1))}</em>`;
      else if (/^_.+_$/.test(sg)) cur += `<span class="mx-a">${esc(sg.slice(1, -1))}</span>`;
      else if (/^\[[a-z0-9]+\]$/.test(sg)) { flush(); words.push(`<span class="mx-w mx-img"><img src="${imgs[sg.slice(1, -1)]}" alt="" loading="lazy" decoding="async"></span>`); }
      else if (sym[sg]) { flush(); words.push(sym[sg]); }
      else sg.split(/(\s+)/).forEach(w => { if (/^\s+$/.test(w)) flush(); else if (w) cur += esc(w); });
    }
    flush();
    return `<span class="mx-l">${words.join('')}</span>`;
  }).join('');
}
const plain = str => str.replace(/[*_]/g, '').replace(/\[[a-z0-9]+\]|↪|✱/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------------- Accueil : un écran ---------------- */

function home(c, P) {
  const { fr, L } = c;
  const s = S(c);
  const tiles = P.map(p => `<a class="tl" href="${pHref(c, p)}" data-tr="${esc(p.t)}" data-tr-img="${p.stage.p}">
  <span class="tl-m"><img src="${p.tile.p}" alt="" width="600" height="800" decoding="async"${p.i < 5 ? '' : ' loading="lazy"'}>${p.tile.v ? `<video muted loop playsinline preload="none" data-src="${p.tile.v}" aria-hidden="true"></video>` : ''}</span>
  <span class="tl-c"><span class="tl-t">${esc(p.t)}</span><span class="tl-k">${esc(p.cat)}</span></span>
</a>`).join('\n');
  const body = `
<section class="sp" id="sp" aria-label="${fr ? 'Projets' : 'Projects'}" data-see="${s.see}">
<div class="sp-tr" id="sp-tr">
${tiles}
</div>
</section>
<div class="hm">
  <h1 class="hm-h">${logoSvg('hm-logo', 'NOVA FOR VISION')}</h1>
  <div class="hm-d">
    <p class="hm-k" data-scr>NOVA FOR VISION©</p>
    <p class="hm-p">${fr ? 'Studio de création visuelle à Liège. Campagnes IA pour les marques, clips et effets visuels pour les artistes.' : 'Visual creation studio in Liège. AI campaigns for brands, music videos and visual effects for artists.'}</p>
  </div>
</div>`;
  const ld = { '@context': 'https://schema.org', '@graph': [orgLd(c), { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'NOVA FOR VISION', inLanguage: L, publisher: { '@id': `${SITE}/#studio` } }] };
  return head(c, {
    key: 'home', path: ROUTES.home[L], alt: ROUTES.home,
    title: fr ? 'NOVA FOR VISION · Studio de création visuelle à Liège' : 'NOVA FOR VISION · Visual creation studio in Liège',
    desc: fr ? 'Studio de création visuelle à Liège : campagnes IA, clips, effets visuels et postproduction pour les marques et les artistes. Oakley × Meta, LOEWE, Beymen, CRAMÉ, NDRANGETHA, ZORO.' : 'Visual creation studio in Liège, Belgium: AI campaigns, music videos, visual effects and post-production for brands and artists. Oakley × Meta, LOEWE, Beymen, CRAMÉ, NDRANGETHA, ZORO.',
    preload: P.slice(0, 4).map(p => p.tile.p), ld,
  }) + '\n' + page(c, 'home', body, { bodyClass: 'p-home', alt: ROUTES.home[L === 'fr' ? 'en' : 'fr'] });
}

/* ---------------- Projets : la roue ---------------- */

function works(c, P) {
  const { fr, L } = c;
  const s = S(c);
  const items = P.map(p => `<li class="wh-i" data-id="${p.id}"><a href="${pHref(c, p)}" data-tr="${esc(p.t)}" data-tr-img="${p.stage.p}"><span class="wh-n">(${pad3(p.i + 1)})</span><span class="wh-tb"><span class="wh-t">${esc(p.t)}</span><span class="wh-k">${esc(p.cat)}</span></span></a></li>`).join('\n');
  const body = `
<h1 class="sr">${fr ? 'Projets' : 'Projects'}</h1>
<section class="wh" id="wh" aria-label="${fr ? 'Tous les projets' : 'All projects'}" data-see="${s.see}">
  <a class="wh-st" id="wh-st" href="${pHref(c, P[0])}" data-tr="${esc(P[0].t)}" data-tr-img="${P[0].stage.p}" aria-label="${s.see} : ${esc(P[0].t)}"><img id="wh-si" src="${P[0].stage.p}" alt="" width="960" height="540"><video id="wh-sv" muted loop playsinline preload="none" aria-hidden="true"></video></a>
  <ol class="wh-l" id="wh-l">
${items}
  </ol>
  <div class="wh-th" id="wh-th" aria-hidden="true">${P.map(p => `<img src="${p.stage.p}" alt="" width="960" height="540" loading="lazy" decoding="async">`).join('')}</div>
</section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', url: SITE + ROUTES.projets[L], name: fr ? 'Projets de NOVA FOR VISION' : 'NOVA FOR VISION projects', hasPart: P.map(p => ({ '@type': 'CreativeWork', name: p.t, url: SITE + pHref(c, p) })) };
  return head(c, {
    key: 'projets', path: ROUTES.projets[L], alt: ROUTES.projets,
    title: fr ? 'Projets · NOVA FOR VISION' : 'Projects · NOVA FOR VISION',
    desc: fr ? 'Les projets de NOVA FOR VISION : campagnes IA (Oakley × Meta, Beymen, LOEWE, Tea Storm) et clips (CRAMÉ, NDRANGETHA, ZORO, KILLCAM, JAMAÏQUAINE IS DEAD, BACK, DEMANDEASHH).' : 'NOVA FOR VISION projects: AI campaigns (Oakley × Meta, Beymen, LOEWE, Tea Storm) and music videos (CRAMÉ, NDRANGETHA, ZORO, KILLCAM, JAMAÏQUAINE IS DEAD, BACK, DEMANDEASHH).',
    preload: [P[0].stage.p], ld,
  }) + '\n' + page(c, 'projets', body, { bodyClass: 'p-works', alt: ROUTES.projets[L === 'fr' ? 'en' : 'fr'], data: { p: P.map(p => ({ id: p.id, t: p.t, href: pHref(c, p), stage: p.stage })) } });
}

/* ---------------- Une page par projet ---------------- */

function project(c, P, p) {
  const { fr, L } = c;
  const s = S(c);
  const nx = P[(p.i + 1) % P.length];
  const other = L === 'fr' ? 'en' : 'fr';
  const altP = { fr: ROUTES.projets.fr + p.a + '/', en: ROUTES.projets.en + p.a + '/' };
  const tall = p.h > p.w;
  const gal = p.gal.map((g, j) => `<figure class="gl-f${j % 2 ? ' r' : ''}${g.tall ? ' t' : ''}">${g.v
    ? `<video muted loop playsinline preload="none" data-src="${g.v}" poster="${g.l}" aria-label="${esc(g.alt)}"></video>`
    : `<img src="${g.s}" srcset="${g.s} 800w, ${g.l} 1600w" sizes="(min-width: 760px) 44vw, 100vw" alt="${esc(g.alt)}" loading="lazy" decoding="async">`}</figure>`).join('');
  const film = p.film ? `
<section class="pf" id="pf-s" aria-label="${fr ? 'Le film' : 'The film'}">
  <div class="pf-box${tall ? ' t' : ''}" id="pf" style="--ar:${p.w}/${p.h}" data-play="${s.play}" data-pause="${s.pause}">
    <video id="pf-v" playsinline preload="none" poster="${p.poster || p.cover.p}" data-src="${p.film}"></video>
    <span class="pf-bar" aria-hidden="true"><i id="pf-p"></i></span>
    <button type="button" class="pf-btn" id="pf-btn">${s.play}</button>
  </div>
</section>` : '';
  const ba = p.ba ? `
<section class="ba" aria-label="${fr ? 'Avant / après' : 'Before / after'}">
  <p class="lb" data-scr>${fr ? 'Avant / après' : 'Before / after'}</p>
  <div class="ba-box"><video muted loop playsinline preload="none" data-src="${p.ba.src}" poster="${p.ba.poster}" aria-hidden="true"></video></div>
  <ol class="ba-ch">${p.ba.ch.map(([a, b, n]) => `<li data-a="${a}" data-b="${b}">${esc(n)}</li>`).join('')}</ol>
</section>` : '';
  const body = `
<article class="pj" style="--tint:${p.tint}">
  <div class="pj-hero"><div class="pj-hm">${p.cover.v ? `<video muted loop playsinline autoplay preload="auto" poster="${p.cover.p}" src="${p.cover.v}" aria-hidden="true"></video>` : `<img src="${p.cover.p}" alt="" fetchpriority="high">`}</div></div>
  <h1 class="pj-h"><span>${esc(p.t)}</span></h1>
  <p class="pj-mini" aria-hidden="true"><span class="pj-mt">${esc(p.t)}</span><span class="pj-mk">${esc(p.cat)}</span></p>
  <section class="pj-d">
    <p class="lb" data-scr>Description</p>
    <p class="pj-p" data-lines>${esc(p.desc)}</p>
  </section>
  <section class="pj-i">
    <div class="pj-y"><p>©2026</p>${p.film ? `<a class="btn" href="#pf-s" data-scroll>${s.play}</a>` : ''}</div>
    <div><p class="lb" data-scr>${fr ? 'Rôle' : 'Role'}</p><ul class="pj-r">${p.roles.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
    <div><p class="lb" data-scr>${fr ? 'Crédits' : 'Credits'}</p><dl class="pj-t">${p.rows.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl></div>
  </section>
  ${film}
  <section class="gl" aria-label="${fr ? 'Images' : 'Images'}">${gal}</section>
  ${ba}
  <a class="nx" href="${pHref(c, nx)}" data-tr="${esc(nx.t)}" data-tr-img="${nx.stage.p}">
    <span class="lb">${fr ? 'Projet suivant' : 'Next project'}</span>
    <span class="nx-m"><img src="${nx.stage.p}" alt="" width="960" height="540" loading="lazy" decoding="async"></span>
    <span class="nx-c"><span class="nx-t">${esc(nx.t)}</span><span class="nx-k">${esc(nx.cat)}</span></span>
  </a>
</article>`;
  const ld = { '@context': 'https://schema.org', '@type': p.film ? 'VideoObject' : 'CreativeWork', name: p.t, description: p.desc, creator: { '@id': `${SITE}/#studio` }, url: SITE + altP[L],
    ...(p.film ? { contentUrl: SITE + p.film, thumbnailUrl: SITE + (p.poster || p.cover.p), uploadDate: '2026-11-01', duration: `PT${Math.round(p.d)}S` } : { image: SITE + p.cover.p }) };
  return head(c, {
    key: 'project', path: altP[L], alt: altP,
    title: `${p.t} · ${p.cat} · NOVA FOR VISION`,
    desc: p.desc, preload: [p.cover.p], ld,
  }) + '\n' + page(c, 'projets', body, { bodyClass: 'p-pj', alt: altP[other], cat: p.cat });
}

/* ---------------- Studio ---------------- */

function studio(c, P) {
  const { t, fr, L } = c;
  const img = { a: '/media/stage/oakley.jpg', b: '/media/beymen/05-960.jpg', c: '/media/loewe/04-960.jpg' };
  const man = fr
    ? '(L’_I_A *propose*)\n↪ [a] L’ŒIL\n*dé*CIDE, [b] ✱\n[c] UNE IMAGE\nÀ LA *fois*.'
    : '(_A_I *proposes*)\n↪ [a] THE EYE\n*de*CIDES, [b] ✱\n[c] ONE IMAGE\nAT A *time*.';
  const clipOf = a => { const id = ARTIST_CLIP[a]; return id ? P.find(p => p.id === id) : null; };
  const rows = ARTISTS.map(a => { const p = clipOf(a); const inner = `<span>${esc(a)}</span><span>${p ? esc(p.t) : (fr ? 'Clips' : 'Music videos')}</span><span>${esc(ARTIST_DIR[a] || '—')}</span><span>${p ? (fr ? 'Voir' : 'View') : ''}</span>`; return `<li>${p ? `<a href="${pHref(c, p)}" data-tr="${esc(p.t)}" data-tr-img="${p.stage.p}">${inner}</a>` : `<span class="ar-r">${inner}</span>`}</li>`; }).join('');
  const end = fr ? '©NOVA *for Vision*\nC’EST AUSSI\nNOVA *Campagnes*,\nNOVA *Clips*,\nNOVA *Effets visuels*.' : '©NOVA *for Vision*\nIS ALSO\nNOVA *Campaigns*,\nNOVA *Music videos*,\nNOVA *Visual effects*.';
  const body = `
<article class="st">
  <section class="st-man" aria-label="${fr ? 'Manifeste' : 'Manifesto'}">
    <p class="lb lb-c" data-scr>Studio</p>
    <h1 class="mx" aria-label="${esc(plain(man))}">${mixed(man, img)}</h1>
  </section>
  <section class="st-star" id="st-star" aria-label="NOVA for Vision">
    <div class="st-sticky">
      <img class="st-s" src="/assets/nova-star.svg" alt="" width="2527" height="915">
      <div class="st-fr"><img src="/media/oakley/400mm-subject.jpg" alt="" loading="lazy" decoding="async"><p class="st-fo"><span class="st-fn">NOVA</span><em>for Vision</em><span class="st-fs">${fr ? 'NOVA FOR VISION©, studio de création visuelle à Liège : campagnes IA, clips, effets visuels et postproduction.' : 'NOVA FOR VISION©, visual creation studio in Liège: AI campaigns, music videos, visual effects and post-production.'}</span></p></div>
    </div>
  </section>
  <section class="st-sv">
    <p class="st-big" data-lines>${fr ? 'Un studio de création visuelle où l’IA, les effets visuels, le montage et le son servent une seule chose : l’image.' : 'A visual creation studio where AI, visual effects, editing and sound serve one thing: the image.'}</p>
    <div class="st-cols">
      <div><p class="lb" data-scr>${fr ? 'Savoir-faire' : 'Crafts'}</p><ul>${METIERS.map(m => `<li>${esc(t(m.name))}</li>`).join('')}</ul></div>
      <div><p class="lb" data-scr>${fr ? 'Engagements' : 'Commitments'}</p><ul><li>${fr ? 'Devis sous 48 h' : 'Quote within 48 hours'}</li><li>${fr ? 'Storyboard validé avant production' : 'Storyboard approved before production'}</li></ul>
        <p class="lb" data-scr>${fr ? 'Fondateurs' : 'Founders'}</p><ul class="st-team">${TEAM.map(m => `<li>${m.name}<span>${esc(t(m.craft))}</span></li>`).join('')}</ul></div>
      <p class="st-btn"><a class="btn" href="${ROUTES.projets[L]}" data-tr="${fr ? 'Projets' : 'Projects'}">${fr ? 'Voir tous les projets' : 'View all projects'}</a></p>
    </div>
  </section>
  <section class="st-ar" id="st-ar" aria-labelledby="st-ar-h">
    <h2 class="st-arh" id="st-ar-h">${fr ? 'Artistes' : 'Artists'} <em>${ARTISTS.length}</em></h2>
    <p class="lb" data-scr>${fr ? 'Artistes, projets et réalisateurs' : 'Artists, projects and directors'}</p>
    <ul class="ar">${rows}</ul>
    <div class="st-end">
      <p class="mx mx-s" aria-label="${esc(plain(end))}">${mixed(end)}</p>
      <p class="st-cta"><a class="cta cta-k" href="mailto:${MAIL}">${fr ? 'Écrire au studio' : 'Write to the studio'}</a><a class="cta" href="${ROUTES.projets[L]}" data-tr="${fr ? 'Projets' : 'Projects'}">${fr ? 'Voir tous les projets' : 'View all projects'}</a></p>
    </div>
  </section>
</article>`;
  const ld = { '@context': 'https://schema.org', '@type': 'AboutPage', url: SITE + ROUTES.studio[L], about: orgLd(c), mainEntity: TEAM.map(m => ({ '@type': 'Person', name: m.name, jobTitle: t(m.role), worksFor: { '@id': `${SITE}/#studio` } })) };
  return head(c, {
    key: 'studio', path: ROUTES.studio[L], alt: ROUTES.studio,
    title: fr ? 'Studio · NOVA FOR VISION' : 'Studio · NOVA FOR VISION',
    desc: fr ? 'NOVA FOR VISION, studio de création visuelle à Liège : savoir-faire, engagements, fondateurs (Mikail et Adem Yildirim) et artistes.' : 'NOVA FOR VISION, visual creation studio in Liège, Belgium: crafts, commitments, founders (Mikail and Adem Yildirim) and artists.',
    ld,
  }) + '\n' + page(c, 'studio', body, { bodyClass: 'p-studio', alt: ROUTES.studio[L === 'fr' ? 'en' : 'fr'] });
}

/* ---------------- Contact ---------------- */

function contact(c) {
  const { fr, L } = c;
  const s = S(c);
  const q = fr ? 'UNE *idée*\n↪ [a] À METTRE\nEN *image* ?' : 'AN *idea*\n↪ [a] TO TURN\nINTO *images*?';
  const body = `
<article class="ct">
  <section class="ct-a">
    <h1 class="mx" aria-label="${esc(plain(q))}">${mixed(q, { a: '/media/stage/crame.jpg' })}</h1>
    <div class="ct-row"><p class="lb" data-scr>${fr ? 'Écrire au studio' : 'Write to the studio'}</p><p class="ct-m"><a href="mailto:${MAIL}">${MAIL}</a> <span aria-hidden="true">→</span></p><p class="ct-c"><button type="button" class="ct-copy" data-copy="${MAIL}" data-done="${s.copied}">${fr ? 'Copier l’adresse' : 'Copy the address'}</button></p></div>
  </section>
  <section class="of">
    <div class="of-a"><p class="lb" data-scr>Studio</p><p class="of-city" aria-label="Liège"><span aria-hidden="true">LIÈ-</span><span aria-hidden="true">-GE</span></p></div>
    <div class="of-b"><p class="lb" data-scr>${fr ? 'Infos' : 'Details'}</p><p>${fr ? 'Liège, Belgique' : 'Liège, Belgium'}<br>${fr ? 'Devis sous 48 h' : 'Quote within 48 hours'}<br>${fr ? 'Français, anglais' : 'French, English'}</p><p class="of-ig"><a href="${IG}" rel="noopener" target="_blank">Instagram @novaforvision</a> <span aria-hidden="true">→</span></p><figure><img src="/media/loewe/02-960.jpg" alt="" loading="lazy" decoding="async"></figure></div>
  </section>
</article>`;
  const ld = { '@context': 'https://schema.org', '@type': 'ContactPage', url: SITE + ROUTES.contact[L], about: { '@type': 'Organization', name: 'NOVA FOR VISION', email: MAIL, url: `${SITE}/` } };
  return head(c, {
    key: 'contact', path: ROUTES.contact[L], alt: ROUTES.contact,
    title: fr ? 'Contact · NOVA FOR VISION' : 'Contact · NOVA FOR VISION',
    desc: fr ? 'Écrire à NOVA FOR VISION, studio de création visuelle à Liège : contact@novaforvision.com ou un message sur Instagram. Devis sous 48 h.' : 'Write to NOVA FOR VISION, a visual creation studio in Liège, Belgium: contact@novaforvision.com or a message on Instagram. Quote within 48 hours.',
    ld,
  }) + '\n' + page(c, 'contact', body, { bodyClass: 'p-contact', alt: ROUTES.contact[L === 'fr' ? 'en' : 'fr'] });
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
  <p>Pour ne pas rejouer l’écran d’ouverture à chaque page et enchaîner le passage d’une page à l’autre, le site note deux informations dans la mémoire de session de votre navigateur, qui s’effacent à la fermeture de l’onglet. Si vous coupez le son, ce choix est noté dans la mémoire locale du navigateur pour vos prochaines visites. Ces informations ne quittent jamais votre appareil. Aucun consentement n’est nécessaire pour cet usage.</p>
  <h3>Vos droits</h3>
  <p>Vous pouvez demander à consulter, corriger, supprimer ou recevoir les données vous concernant, ou vous opposer à leur usage, en écrivant à <a href="mailto:${MAIL}">${MAIL}</a>. Vous pouvez aussi introduire une réclamation auprès de l’Autorité de protection des données, rue de la Presse 35, 1000 Bruxelles (<a href="https://www.autoriteprotectiondonnees.be" rel="noopener" target="_blank">autoriteprotectiondonnees.be</a>).</p>
  <h2>Propriété intellectuelle</h2>
  <p>Les films, images, textes et le logo présentés sur ce site sont protégés par le droit d’auteur et appartiennent à NOVA FOR VISION et aux artistes et réalisateurs crédités. Toute reproduction sans autorisation est interdite.</p>
  <p>Les marques citées appartiennent à leurs titulaires. Oakley × Meta, Tea Storm et LOEWE sont des projets personnels non commandés, sans lien ni partenariat avec Oakley, Meta, Louis Vuitton ni LOEWE.</p>
  <p>Polices Geist, Archivo et Newsreader : licence SIL Open Font License 1.1. Animations : GSAP (licence MIT, GreenSock) et Lenis (licence MIT, darkroom.engineering).</p>
</article>`;
  return head(c, { key: 'legal', path: '/mentions-legales/', title: 'Mentions légales et confidentialité · NOVA FOR VISION', desc: 'Éditeur, hébergement, confidentialité et propriété intellectuelle du site de NOVA FOR VISION.', robots: 'noindex, follow' }) + '\n' + page(c, 'legal', body, { bodyClass: 'p-legal', alt: ROUTES.home.en });
}

function notFound(c) {
  const q = 'CE PLAN\nN’EXISTE *pas*.';
  const body = `
<section class="nf">
  <h1 class="mx" aria-label="Ce plan n’existe pas.">${mixed(q)}</h1>
  <p lang="en">This shot doesn’t exist.</p>
  <p class="nf-a"><a class="cta cta-k" href="/">Accueil</a><a class="cta" href="/projets/">Projets</a></p>
</section>`;
  return head(c, { key: 'home', path: '/404.html', title: 'Page introuvable · NOVA FOR VISION', desc: 'Cette page n’existe pas.', robots: 'noindex' }).replace(/<link rel="canonical"[^>]*>\n/, '') + '\n' + page(c, 'none', body, { bodyClass: 'p-404', alt: ROUTES.home.en });
}

/* ---------------- Plan du site ---------------- */
export function sitemap(date) {
  const keys = ['home', 'projets', 'studio', 'contact'];
  const alt = (fr, en) => `    <xhtml:link rel="alternate" hreflang="fr" href="${SITE + fr}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE + en}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + fr}"/>`;
  const urls = [];
  for (const L of ['fr', 'en']) {
    for (const k of keys) urls.push(`  <url>\n    <loc>${SITE + ROUTES[k][L]}</loc>\n${alt(ROUTES[k].fr, ROUTES[k].en)}\n    <lastmod>${date}</lastmod>\n  </url>`);
    for (const p of projectsOf(mk(L, {}))) {
      const fr = ROUTES.projets.fr + p.a + '/', en = ROUTES.projets.en + p.a + '/';
      const v = p.film ? `\n    <video:video>
      <video:thumbnail_loc>${SITE + (p.poster || p.cover.p)}</video:thumbnail_loc>
      <video:title>${esc(`${p.t}, ${p.cat}`)}</video:title>
      <video:description>${esc(p.desc)}</video:description>
      <video:content_loc>${SITE + p.film}</video:content_loc>
      <video:duration>${Math.round(p.d)}</video:duration>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>` : '';
      urls.push(`  <url>\n    <loc>${SITE + (L === 'fr' ? fr : en)}</loc>\n${alt(fr, en)}\n    <lastmod>${date}</lastmod>${v}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
