# novaforvision.com

Site vitrine de NOVA FOR VISION, studio de création IA, d'effets visuels et de postproduction basé à Liège.

## Direction : « découpé dans le film »

- Salle noire, texte blanc. La couleur vient des films : la page s'étalonne sur le film à l'écran (teinte de chaque projet dans `src/content.mjs`).
- Chaque page s'ouvre sur son titre découpé dans un film. Sur l'accueil, c'est le logo NOVA : au défilement, on plonge dans une lettre jusqu'au film en plein écran.
- Geist pour tout, Geist Mono pour les données de film (timecode, durées, crédits).
- Intro à l'étoile (première visite de l'accueil) ; l'étoile sert aussi de passage d'une page à l'autre.
- Règles : aucune mention « spec ad », aucun outil nommé, pas de prix, l'e-mail comme seule action, pas de bouton rond, pas de pastilles.

## Fichiers

- `src/content.mjs` : tous les textes (FR et EN), projets, films, stills, crédits, services, déroulé, équipe
- `src/pages.mjs` : gabarits des pages (FR, EN, mentions légales, 404, plan du site)
- `src/css/nova.css` : styles
- `src/js/main.js` : script (Lenis pour le défilement doux, GSAP avec ScrollTrigger et SplitText)
- `src/build.mjs` : génère les pages HTML, `assets/nova.css`, `assets/nova.js` et `sitemap.xml`

Les pages HTML à la racine (`index.html`, `projets/`, `services/`, `studio/`, `contact/`, `mentions-legales/`, `404.html`) et `en/` sont **générées** : modifier `src/`, puis reconstruire.

```bash
npm install
npm run build      # régénère pages, styles, script et plan du site
npm run serve      # aperçu sur http://localhost:4173
```

## Effets par page

| Page | Effets |
|---|---|
| Accueil | Intro à l'étoile · NOVA découpé dans les films (coupe toutes les 4 s) au-dessus du mur d'images qui dérive · plongée dans la lettre au défilement · manifeste qui s'allume mot à mot · projets à la une en bobine horizontale, page étalonnée · index avec aperçu au curseur · bandeau des artistes qui suit le défilement · services · « Écrire au studio » découpé dans un film |
| Projets | Titre découpé · chapitres par campagne (titre découpé dans son film, lecteur avec le son, stills qui glissent de côté, visionneuse) · clips en grille décalée (aperçu au survol) · avant / après CRAMÉ à la souris · générique qui défile |
| Services | Titre découpé · cinq prestations qui s'empilent · déroulé en timeline de montage (tête de lecture au défilement, étapes cliquables) |
| Studio | Titre découpé · texte qui monte ligne par ligne · métiers avec traînée d'images au curseur · équipe |
| Contact | Phrase à compléter qui compose l'e-mail ; l'image se précise à mesure qu'on écrit |

Mouvement réduit (réglage du système) : pas de défilement doux, pas de plongée, pas de dérive ; les contenus restent tous visibles.

## Ne pas toucher

- `mail/` : images de l'e-mail de prospection, appelées depuis `https://novaforvision.com/mail/`. Ne pas renommer ni supprimer.
- `v1/` : sauvegarde de l'ancienne page unique (hors Google).
- `media/` : films et images du site.

Publié avec GitHub Pages : les fichiers générés sont commités, aucune étape de build côté serveur.
