# novaforvision.com

Site vitrine de NOVA FOR VISION, studio de création visuelle basé à Liège : campagnes IA, clips, effets visuels et postproduction.

## Direction : AUGE Experience, et seulement elle

Référence unique : AUGE Experience (auge-xp.com).

- Fond clair (`#ececE6`), texte noir, **une seule couleur d'accent** : pêche `#ffb27a` (variable `--acc` dans `src/css/nova.css`, une ligne à changer).
- Deux polices de titre comme AUGE : Archivo étroit très gras (capitales) et Newsreader italique (bas de casse), mélangés dans les grands titres. Geist pour le texte courant. Les trois sous licence OFL (fichiers `assets/fonts/OFL-*.txt`).
- Ouverture : logo, « for Vision » en italique, compteur 000 → 100 (une fois par visite).
- Passage d'une page à l'autre : aplat pêche qui monte, titre brouillé puis formé, compteur, petite image.
- Accueil sur un écran : bande de projets bord à bord dont la hauteur grandit vers la droite, qui dérive seule (molette, doigt, flèches) ; NOVA en grand en bas, une phrase.
- Curseur : losange, étiquette pêche « Voir le projet » sur les films.
- Pied de page fixe en capitales (mélange inversé sur les images) ; sur téléphone il n'apparaît qu'en fin de page.
- Une page par projet, sans étude de cas : film en tête, titre géant, rôle et crédits, film à lire, galerie, projet suivant. La couleur de la page se teinte légèrement du film.
- Projets : roue numérotée (001, 002…) avec vignettes.
- Studio : manifeste sombre (titres mélangés, petites images dans la phrase), l'étoile qui devient une image, savoir-faire, tableau « ARTISTES 15 » sur l'aplat pêche, phrase de fin et deux grands boutons.
- Contact : une question, l'adresse e-mail, la carte du bureau (LIÈ-GE).
- Règles : aucune mention « spec ad », aucun outil nommé, pas de prix, l'e-mail comme seule action, pas de bouton rond ni de pastille, pas de code rouge-vert-bleu, pas de coulisses, pas de visages de l'équipe.

## Fichiers

- `src/content.mjs` : textes (FR et EN), projets, films, images, crédits, ordre de la bande, descriptions courtes des projets
- `src/pages.mjs` : gabarits des pages (FR, EN, pages projet, mentions légales, 404, plan du site)
- `src/css/nova.css` : styles
- `src/js/main.js` : script (GSAP + SplitText, Lenis pour le défilement doux des pages qui défilent)
- `src/build.mjs` : génère les pages HTML, `assets/nova.css`, `assets/nova.js` et `sitemap.xml`
- `media/tile/` : boucles de la bande ; `media/stage/` : boucles de la roue ; `media/cover/` : film en tête des pages projet ; `media/frames/` : images de galerie

Les pages HTML à la racine (`index.html`, `projets/`, `studio/`, `contact/`, `mentions-legales/`, `404.html`) et `en/` sont **générées** : modifier `src/`, puis reconstruire. `services/` et `en/services/` renvoient vers Studio.

```bash
npm install
npm run build      # régénère pages, styles, script et plan du site
npm run serve      # aperçu sur http://localhost:4173
```

Poids : `nova.js` 113 Ko, `nova.css` 19 Ko. Les vidéos ne se chargent qu'à l'écran, et pas du tout en mode économie de données.

Mouvement réduit (réglage du système) : pas d'ouverture, pas de dérive ni de brouillage, passages instantanés.

## Ne pas toucher

- `mail/` : images de l'e-mail de prospection, appelées depuis `https://novaforvision.com/mail/`. Ne pas renommer ni supprimer.
- `v1/` : sauvegarde de l'ancienne page unique (hors Google).
- `media/` : films et images du site.

Publié avec GitHub Pages : les fichiers générés sont commités, aucune étape de build côté serveur.
