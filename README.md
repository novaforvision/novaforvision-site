# novaforvision.com

Site vitrine de NOVA FOR VISION, studio de création visuelle basé à Liège : campagnes IA, clips, effets visuels et postproduction.

## Direction : « banc de montage »

Références : AUGE Experience (colonne vertébrale), Unanim studio, Pryzm, Artemii Lebedev, Grids (Obys), Butter, Santal, Jesper Landberg.

- Fond clair (`#e4e4e0`), texte noir : la couleur vient seulement des films.
- L'accueil tient sur un écran : une bande de projets bord à bord (hauteur = durée du film) que la molette, le doigt ou les flèches font défiler, NOVA en grand en bas, une phrase.
- Au clic : aplat à la teinte du film, titre brouillé puis formé, compteur, puis le film s'ouvre sur place. La molette passe au projet suivant avec un souffle de neige (changement de chaîne). Pas de page de cas.
- Projets : une roue (numéros, durées en timecode), filtre Tout / Campagnes / Clips.
- Studio : une phrase, les savoir-faire, la méthode sur une règle de montage à trois pistes, les fondateurs, les artistes.
- Contact : l'adresse e-mail en très grand, une image.
- Signature : le timecode (horloge de Liège en haut à droite, durées, règle de lecture).
- Geist pour tout, Geist Mono pour les données de film.
- Règles : aucune mention « spec ad », aucun outil nommé, pas de prix, l'e-mail comme seule action, pas de bouton rond ni de pastille, pas de code rouge-vert-bleu.

## Fichiers

- `src/content.mjs` : textes (FR et EN), projets, films, stills, crédits, savoir-faire, méthode, équipe, ordre de la bande
- `src/pages.mjs` : gabarits des pages (FR, EN, mentions légales, 404, plan du site)
- `src/css/nova.css` : styles
- `src/js/main.js` : script (GSAP seul : bande, roue, intro, film ouvert sur place)
- `src/build.mjs` : génère les pages HTML, `assets/nova.css`, `assets/nova.js` et `sitemap.xml`
- `media/tile/` : boucles 3:4 (600x800, 5 s) de la bande ; `media/stage/` : boucles 16:9 (960x540) de la roue. Script : `tools/media.sh` dans la session de travail (ffmpeg, recadrage centré, CRF 27).

Les pages HTML à la racine (`index.html`, `projets/`, `studio/`, `contact/`, `mentions-legales/`, `404.html`) et `en/` sont **générées** : modifier `src/`, puis reconstruire. `services/` et `en/services/` renvoient vers Studio.

```bash
npm install
npm run build      # régénère pages, styles, script et plan du site
npm run serve      # aperçu sur http://localhost:4173
```

Poids : `nova.js` 91 Ko, `nova.css` 17 Ko (avant : 164 Ko et 29 Ko). Les vidéos de la bande ne se chargent qu'à l'écran, et pas du tout en mode économie de données.

Mouvement réduit (réglage du système) : pas d'intro, pas de dérive ni de brouillage, ouvertures instantanées.

## Ne pas toucher

- `mail/` : images de l'e-mail de prospection, appelées depuis `https://novaforvision.com/mail/`. Ne pas renommer ni supprimer.
- `v1/` : sauvegarde de l'ancienne page unique (hors Google).
- `media/` : films et images du site.

Publié avec GitHub Pages : les fichiers générés sont commités, aucune étape de build côté serveur.
