// Contenu du site, en français et en anglais. Chaque texte : { fr, en } ou une chaîne commune.
// Règles NOVA : aucune mention « spec ad », aucun outil nommé, pas de prix, l'e-mail comme seule action.

export const MAIL = 'contact@novaforvision.com';
export const IG = 'https://www.instagram.com/novaforvision/';
export const SITE = 'https://novaforvision.com';

export const ROUTES = {
  home: { fr: '/', en: '/en/' },
  projets: { fr: '/projets/', en: '/en/projects/' },
  studio: { fr: '/studio/', en: '/en/studio/' },
  contact: { fr: '/contact/', en: '/en/contact/' },
  legal: { fr: '/mentions-legales/', en: '/mentions-legales/' },
};

export const NAV = [
  ['home', { fr: 'Accueil', en: 'Home' }],
  ['projets', { fr: 'Projets', en: 'Projects' }],
  ['studio', { fr: 'Studio', en: 'Studio' }],
  ['contact', { fr: 'Contact', en: 'Contact' }],
];

// Teintes tirées des films : la page s'étalonne sur le film à l'écran.
export const CAMPAIGNS = [
  {
    id: 'oakley', anchor: 'oakley-meta', title: 'Oakley × Meta', tint: '#b85a22',
    line: { fr: 'Film IA', en: 'AI film' },
    credits: [
      [{ fr: 'Rôle', en: 'Role' }, { fr: 'Création IA, VFX, montage, sound design et motion design', en: 'AI creation, VFX, editing, sound design and motion design' }],
      [{ fr: 'Livrables', en: 'Deliverables' }, { fr: 'Film 16:9 et 9:16, motion design du logo, stills 4K', en: '16:9 and 9:16 film, logo motion design, 4K stills' }],
    ],
    dur: 28.757, fps: 24,
    film: '/media/oakley/film.mp4', poster: '/media/oakley/film.jpg',
    loop: '/media/hero/oakley.mp4', loopPoster: '/media/hero/oakley.jpg', loopStart: 2,
    stills: [
      { img: '/media/oakley/macro-prizm-led.jpg', w: 1400, h: 788, cap: { fr: 'Macro, verre Prizm', en: 'Macro, Prizm lens' }, alt: { fr: 'Gros plan sur le verre Prizm qui reflète le désert', en: 'Close-up of the Prizm lens reflecting the desert' } },
      { img: '/media/oakley/400mm-subject.jpg', w: 1400, h: 788, cap: { fr: 'Téléobjectif 400 mm', en: '400 mm telephoto' }, alt: { fr: 'Le coureur au téléobjectif, fond de dunes', en: 'The runner shot on a telephoto lens, dunes behind' } },
      { video: '/media/oakley/transition.mp4', img: '/media/oakley/transition.jpg', w: 1600, h: 900, cap: { fr: 'Le saut, de la couleur au noir et blanc', en: 'The jump, from colour to black and white' }, alt: { fr: 'Le saut du coureur, de la couleur au noir et blanc', en: 'The runner’s jump, from colour to black and white' } },
      { img: '/media/oakley/rain-world-onevision.jpg', w: 1400, h: 788, cap: { fr: 'One vision. Every World.', en: 'One vision. Every World.' }, alt: { fr: 'Le coureur sur un rocher, titre One vision. Every World.', en: 'The runner on a rock, title One vision. Every World.' } },
      { img: '/media/oakley/unettes-sable-logo.jpg', w: 1400, h: 788, cap: { fr: 'Les lunettes dans le sable', en: 'The glasses in the sand' }, alt: { fr: 'Une main pose les lunettes dans le sable', en: 'A hand sets the glasses down in the sand' } },
      { img: '/media/oakley/end-oakley-meta.jpg', w: 1400, h: 788, cap: { fr: 'Plan de fin', en: 'End shot' }, alt: { fr: 'Logos Oakley et Meta gravés dans le sable', en: 'Oakley and Meta logos carved in the sand' } },
      { video: '/media/oakley/motion.mp4', img: '/media/oakley/motion.jpg', w: 960, h: 540, cap: { fr: 'Motion design du logo', en: 'Logo motion design' }, alt: { fr: 'Animation du logo Oakley × Meta', en: 'Oakley × Meta logo animation' } },
    ],
  },
  {
    id: 'beymen', anchor: 'beymen', title: 'Beymen Home & Decor', tint: '#7a5a44',
    line: { fr: 'Campagne, film IA et stills', en: 'Campaign, AI film and stills' },
    credits: [
      [{ fr: 'Client', en: 'Client' }, 'Beymen.com'],
      [{ fr: 'Rôle', en: 'Role' }, { fr: 'Création IA, blocking 3D, montage et motion design du logo', en: 'AI creation, 3D blocking, editing and logo motion design' }],
      [{ fr: 'Livrables', en: 'Deliverables' }, { fr: 'Film long et 3 films courts en 16:9, 1:1 et 9:16, 12 stills', en: 'Long film and 3 short films in 16:9, 1:1 and 9:16, 12 stills' }],
    ],
    dur: 27.754, fps: 24,
    film: '/media/beymen/film.mp4', poster: '/media/beymen/film.jpg',
    loop: '/media/beymen/film.mp4', loopPoster: '/media/beymen/film.jpg', loopStart: 3,
    stills: [
      ['01', 'Minimal', 'Minimal', 'Le salon minimal : canapé bouclé blanc, fauteuil en cuir noir et table basse en bois, devant les rideaux en lin', 'The minimal living room: white bouclé sofa, black leather armchair and wooden coffee table in front of linen curtains'],
      ['02', 'Minimal', 'Minimal', 'Le canapé modulable bas sous une suspension en ruban de lumière, lampadaire noir', 'The low modular sofa under a ribbon pendant light, black floor lamp'],
      ['03', 'Minimal', 'Minimal', 'Le fauteuil en acier noir et cuir, un pull rouge jeté dessus, devant le canapé bouclé', 'The black steel and leather armchair, a red sweater thrown over it, in front of the bouclé sofa'],
      ['04', 'Minimal', 'Minimal', 'La lampe en verre vert sur la table basse en bois sombre, un livre ouvert', 'The green glass lamp on the dark wooden coffee table, an open book'],
      ['05', 'Artsy', 'Artsy', 'Le canapé en velours vert sauge sous deux toiles vert et ocre, table d’appoint en verre à lame jaune', 'The sage green velvet sofa under two green and ochre canvases, glass side table with a yellow blade'],
      ['06', 'Artsy', 'Artsy', 'Le canapé vert sous une toile graphique, la table d’appoint en verre à côté', 'The green sofa under a graphic canvas, the glass side table next to it'],
      ['07', 'Artsy', 'Artsy', 'La chaise rouge et son cardigan beige, un vase en forme de visage sur la table en verre', 'The red chair and its beige cardigan, a face-shaped vase on the glass table'],
      ['08', 'Artsy', 'Artsy', 'Le fauteuil en verre courbé, la table en verre à lame jaune et le chien en ballon chromé', 'The curved glass armchair, the glass table with a yellow blade and the chrome balloon dog'],
      ['09', 'Néoclassique', 'Neoclassical', 'Le Chesterfield en cuir brun dans un salon haussmannien, sous un lustre en cristal', 'The brown leather Chesterfield in a Haussmann-style living room, under a crystal chandelier'],
      ['10', 'Néoclassique', 'Neoclassical', 'Le Chesterfield et la table basse en marbre bordeaux, livres et plaid', 'The Chesterfield and the burgundy marble coffee table, books and a throw'],
      ['11', 'Néoclassique', 'Neoclassical', 'Le fauteuil pivotant vert forêt, la table en marbre bordeaux et une sculpture dorée', 'The forest green swivel armchair, the burgundy marble table and a gold sculpture'],
      ['12', 'Néoclassique', 'Neoclassical', 'Le fauteuil vert sur sa coque en noyer, un pull jacquard, parquet en point de Hongrie', 'The green armchair on its walnut shell, a jacquard sweater, herringbone parquet'],
    ].map(([n, cf, ce, af, ae]) => ({ img: `/media/beymen/${n}-1920.jpg`, sm: `/media/beymen/${n}-960.jpg`, w: 1920, h: 1080, cap: { fr: cf, en: ce }, alt: { fr: af, en: ae } })),
  },
  {
    id: 'loewe', anchor: 'loewe', title: 'LOEWE', tint: '#2c399a',
    line: { fr: 'Stills et film IA', en: 'AI stills and film' },
    credits: [
      [{ fr: 'Rôle', en: 'Role' }, { fr: 'Création IA, stills et film', en: 'AI creation, stills and film' }],
      [{ fr: 'Livrables', en: 'Deliverables' }, { fr: '5 stills 16:9, film 16:9', en: '5 stills 16:9, 16:9 film' }],
    ],
    dur: 5.0417, fps: 24,
    film: '/media/loewe/film.mp4', poster: '/media/loewe/film.jpg',
    loop: '/media/loewe/film.mp4', loopPoster: '/media/loewe/film.jpg', loopStart: 0,
    stills: [
      ['01', 'Le sac jaune moutarde serré contre l’épaule, trench beige ouvert, sur fond bleu', 'The mustard yellow bag held against the shoulder, open beige trench coat, on a blue background'],
      ['02', 'Penchée vers l’objectif, le sac en daim porté à l’épaule', 'Leaning towards the lens, the suede bag worn on the shoulder'],
      ['03', 'Le sac tenu à la main en pleine marche, jean large et chemise nouée à la taille', 'The bag carried mid-stride, wide jeans and a shirt tied at the waist'],
      ['04', 'Le sac de face, tenu à deux mains, monogramme doré', 'The bag from the front, held in both hands, gold monogram'],
      ['05', 'Le photographe face au mannequin, sur le fond bleu du studio', 'The photographer facing the model, on the blue studio backdrop'],
    ].map(([n, af, ae]) => ({ img: `/media/loewe/${n}-1920.jpg`, sm: `/media/loewe/${n}-960.jpg`, w: 1920, h: 1080, alt: { fr: af, en: ae } })),
  },
  {
    id: 'teastorm', anchor: 'tea-storm', title: 'Tea Storm', tint: '#7a1a1f',
    line: { fr: 'Stills IA', en: 'AI stills' },
    credits: [
      [{ fr: 'Rôle', en: 'Role' }, { fr: 'Stills IA', en: 'AI stills' }],
      [{ fr: 'Livrables', en: 'Deliverables' }, { fr: '10 stills 16:9', en: '10 stills, 16:9' }],
    ],
    stills: [
      ['00', 'Le flacon Tea Storm sur une table laquée noire et rouge, dans un rai de lumière', 'The Tea Storm bottle on a black and red lacquered table, in a shaft of light'],
      ['01', 'Le bouchon rose du flacon, monogramme LV doré, posé sur une coupe en céramique', 'The bottle’s pink stopper, gold LV monogram, resting on a ceramic bowl'],
      ['02', 'Le bouchon rose et son reflet sur une table laquée', 'The pink stopper and its reflection on a lacquered table'],
      ['03', 'Le flacon dans un panier de feuilles de thé, sous une ombre tressée', 'The bottle in a basket of tea leaves, under a woven shadow'],
      ['04', 'Le flacon parmi les feuilles de lotus, un bouton de fleur rouge derrière', 'The bottle among lotus leaves, a red flower bud behind'],
      ['05', 'Le flacon sur une pierre, entre des feuilles de lotus mouillées', 'The bottle on a stone, between wet lotus leaves'],
      ['06', 'Le bas du flacon, gravé Tea Storm Louis Vuitton, sur des feuilles de thé', 'The base of the bottle, engraved Tea Storm Louis Vuitton, on tea leaves'],
      ['07', 'Le flacon couché sur une feuille de lotus, gravure Tea Storm', 'The bottle lying on a lotus leaf, Tea Storm engraving'],
      ['08', 'Le flacon sur une table de bois, dans la lumière d’une fenêtre à lamelles', 'The bottle on a wooden table, in the light of a slatted window'],
      ['09', 'Le flacon sur une pierre, sous l’ombre d’une fenêtre ajourée', 'The bottle on a stone, under the shadow of a lattice window'],
    ].map(([n, af, ae]) => (n === '00'
      ? { img: '/assets/teastorm/00-2400.jpg', sm: '/assets/teastorm/00-1200.jpg', w: 2400, h: 1352, alt: { fr: af, en: ae } }
      : { img: `/assets/teastorm/${n}-1600.jpg`, sm: `/assets/teastorm/${n}-800.jpg`, w: 1600, h: 900, alt: { fr: af, en: ae } })),
  },
];

export const CLIPS = [
  { id: 'bellodallas', anchor: 'zoro', title: 'ZORO', artist: 'Bello & Dallas', role: { fr: 'VFX', en: 'VFX' }, dir: 'Kespey', dur: 13.44, tint: '#8e6b2d', w: 1596, h: 1080, ig: null },
  { id: 'crame', anchor: 'crame', title: 'CRAMÉ', artist: 'RR', role: { fr: 'Montage, VFX, IA, SFX', en: 'Editing, VFX, AI, SFX' }, dir: 'Lyra Film', dur: 38.08, tint: '#8f1b14', w: 1596, h: 1080, ig: null },
  { id: 'ndrangetha', anchor: 'ndrangetha', title: 'NDRANGETHA', artist: 'Thabiti', role: { fr: 'Montage, VFX, IA, SFX', en: 'Editing, VFX, AI, SFX' }, dir: 'Lyra Film', dur: 35.0, tint: '#6b7a52', w: 1698, h: 1080, ig: 'https://www.instagram.com/reel/Dcyn_7qtQiD/' },
  { id: 'killcam', anchor: 'killcam', title: 'KILLCAM', artist: 'King Kifla', role: { fr: 'Montage, VFX', en: 'Editing, VFX' }, dir: 'Lyra Film', dur: 29.8, tint: '#2c4f61', w: 1440, h: 1080, ig: 'https://www.instagram.com/reel/DaQpBznNIB9/' },
  { id: 'back', anchor: 'back', title: 'BACK', artist: 'LP2.0', role: { fr: 'Montage, VFX', en: 'Editing, VFX' }, dir: 'Lyra Film', dur: 22.95, tint: '#4a4740', w: 1440, h: 1080, ig: 'https://www.instagram.com/reel/DWozdhSj1l3/' },
  { id: 'demandeashh', anchor: 'demandeashh', title: 'DEMANDEASHH', artist: 'Sheu', role: { fr: 'Teaser IA', en: 'AI teaser' }, dir: 'NOVA', dur: 33.28, tint: '#1c3440', w: 1080, h: 1920, ig: 'https://www.instagram.com/reel/DaArXcHsMV4/' },
  { id: 'jamaiquaine', anchor: 'jamaiquaine', title: 'JAMAÏQUAINE IS DEAD', artist: 'LP Killer', role: { fr: 'VFX', en: 'VFX' }, dir: 'Lyra Film', dur: 33.686, tint: '#3f8270', w: 1440, h: 1080, ig: 'https://www.instagram.com/reel/DTZaV9mDPdE/' },
].map(c => ({ ...c, poster: `/media/poster/${c.id}.jpg`, prev: `/media/prev/${c.id}.mp4`, film: `/media/full/${c.id}.mp4`, thumb: `/assets/thumbs/clip-${c.id}.jpg` }));



export const ARTISTS = ['Boub’Z', 'Bello & Dallas', 'Mauvais Djo', 'La Fouine', 'Cheu-B', 'Oboy', 'Ghostkillertrack', 'Sky', 'Miami Yacine', 'Thabiti', 'RR', 'King Kifla', 'Sheu', 'LP2.0', 'LP Killer'];
export const ARTIST_CLIP = { 'Bello & Dallas': 'bellodallas', 'Thabiti': 'ndrangetha', 'RR': 'crame', 'King Kifla': 'killcam', 'Sheu': 'demandeashh', 'LP2.0': 'back', 'LP Killer': 'jamaiquaine' };
export const DIRECTORS = ['Lyra Film', 'Kespey'];

export const METIERS = [
  { name: { fr: 'Création IA', en: 'AI creation' }, text: { fr: 'Plans et visuels générés par IA, puis retravaillés en postproduction', en: 'AI-generated shots and visuals, then refined in post-production' }, img: '/assets/svc/ia.jpg' },
  { name: { fr: 'Effets visuels', en: 'Visual effects' }, text: { fr: 'VFX hybrides : 3D, compositing et IA générative', en: 'Hybrid VFX: 3D, compositing and generative AI' }, img: '/assets/svc/vfx.jpg' },
  { name: { fr: 'Montage', en: 'Editing' }, text: { fr: 'Rythme, structure et coupe, du teaser au film de campagne', en: 'Rhythm, structure and cut, from teaser to campaign film' }, img: '/assets/svc/montage.jpg' },
  { name: { fr: 'Sound design', en: 'Sound design' }, text: { fr: 'Effets sonores pensés avec les VFX et le montage', en: 'Sound effects designed together with the VFX and the edit' }, img: '/assets/svc/son.jpg' },
  { name: { fr: 'Direction artistique', en: 'Art direction' }, text: { fr: 'Moodboard, références et cohérence visuelle', en: 'Moodboard, references and visual consistency' }, img: '/assets/svc/da.jpg' },
  { name: { fr: 'Storyboard', en: 'Storyboard' }, text: { fr: 'Découpage plan par plan, validé avant production', en: 'Shot-by-shot breakdown, approved before production' }, img: '/assets/svc/storyboard.jpg' },
];


// Déroulé : six étapes, trois pistes, comme une timeline de montage
export const STEPS = [
  { who: 0, name: { fr: 'Brief', en: 'Brief' }, text: { fr: 'Vous nous envoyez l’idée et la date visée.', en: 'You send us the idea and the target date.' }, img: '/media/oakley/macro-prizm-led.jpg' },
  { who: 2, name: { fr: 'Devis', en: 'Quote' }, text: { fr: 'Vous recevez un devis sous 48 h.', en: 'You get a quote within 48 hours.' }, img: '/media/loewe/04-960.jpg' },
  { who: 1, name: { fr: 'Storyboard', en: 'Storyboard' }, text: { fr: 'On se met d’accord sur chaque plan. La production démarre une fois le storyboard validé.', en: 'We agree on every shot. Production starts once the storyboard is approved.' }, img: '/assets/svc/storyboard.jpg' },
  { who: 2, name: { fr: 'Production', en: 'Production' }, text: { fr: 'IA, 3D, tournage, montage, son.', en: 'AI, 3D, shooting, editing, sound.' }, img: '/assets/svc/vfx.jpg' },
  { who: 1, name: { fr: 'Retours', en: 'Feedback' }, text: { fr: 'Vos retours sur une première version.', en: 'Your feedback on a first cut.' }, img: '/media/beymen/05-960.jpg' },
  { who: 2, name: { fr: 'Livraison', en: 'Delivery' }, text: { fr: 'Les fichiers finaux, dans les formats prévus.', en: 'The final files, in the agreed formats.' }, img: '/media/oakley/end-oakley-meta.jpg' },
];
export const TRACKS = [{ fr: 'Vous', en: 'You' }, { fr: 'Ensemble', en: 'Together' }, { fr: 'NOVA', en: 'NOVA' }];

export const TEAM = [
  {
    name: 'Mikail Yildirim', role: { fr: 'Cofondateur', en: 'Co-founder' }, craft: { fr: 'VFX, montage et sound design', en: 'VFX, editing and sound design' },
    bio: {
      fr: 'Le clip musical est à l’origine de mon parcours. J’y ai développé mon expérience en montage, effets visuels et création sonore, en travaillant avec les artistes pour donner forme à leur univers. Autodidacte, j’aime garder la main sur l’ensemble d’une vidéo : son rythme, son esthétique, son ambiance. Aujourd’hui, l’intelligence artificielle fait partie de ma pratique et ouvre de nouvelles possibilités pour imaginer et produire des projets plus ambitieux.',
      en: 'Music videos are where it all started for me. That is where I built my experience in editing, visual effects and sound, working with artists to give shape to their world. Self-taught, I like to keep a hand on every part of a video: its rhythm, its look, its mood. Today, artificial intelligence is part of my practice and opens new ways to imagine and produce more ambitious projects.',
    },
  },
  {
    name: 'Adem Yildirim', role: { fr: 'Cofondateur', en: 'Co-founder' }, craft: { fr: 'Graphisme et photographie', en: 'Graphic design and photography' },
    bio: {
      fr: 'Architecte de formation, j’ai développé en parallèle une activité de graphiste et de photographe autodidacte. J’ai notamment travaillé pour YouTube, Twitch et des créateurs de contenu, avec une même exigence : créer des images qui attirent l’attention et portent une identité reconnaissable. Mon parcours mêle le sens de la composition, la culture du web et le goût du détail. Aujourd’hui, je réunis ces influences dans des campagnes marketing et des projets audiovisuels où la direction artistique prend une place centrale.',
      en: 'An architect by training, I built a parallel practice as a self-taught graphic designer and photographer. I have worked for YouTube, Twitch and content creators, always with the same standard: images that catch the eye and carry a recognisable identity. My background combines a sense of composition, web culture and an eye for detail. Today, I bring these influences together in marketing campaigns and audiovisual projects where art direction takes centre stage.',
    },
  },
];

// Avant / après CRAMÉ : [début, passage au plan final, fin] en secondes
export const BA = { src: '/media/ba/crame-ba.mp4', poster: '/media/ba/crame-ba.jpg', dur: 11.12, ch: [[0, 2.2, 4.04], [4.04, 4.68, 5.96], [5.96, 7.2, 8.96], [8.96, 9.72, 11.12]], names: [{ fr: 'Étalonnage', en: 'Colour grading' }, { fr: 'Débris', en: 'Debris' }, { fr: 'Feu', en: 'Fire' }, { fr: 'Police', en: 'Police' }] };

// Ordre des projets sur la bande de l'accueil et dans la roue de la page Projets.
// tile : boucle 3:4 (600x800) pour la bande ; stage : boucle 16:9 (960x540) pour la roue.
export const ORDER = ['oakley', 'crame', 'loewe', 'ndrangetha', 'beymen', 'bellodallas', 'teastorm', 'killcam', 'jamaiquaine', 'back', 'demandeashh'];
export const LOOPS = Object.fromEntries(ORDER.map(id => [id, id === 'teastorm'
  ? { tile: { p: '/media/tile/teastorm.jpg' }, stage: { p: '/media/stage/teastorm.jpg' } }
  : { tile: { v: `/media/tile/${id}.mp4`, p: `/media/tile/${id}.jpg` }, stage: { v: `/media/stage/${id}.mp4`, p: `/media/stage/${id}.jpg` } }]));
