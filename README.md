# novaforvision.com

Site vitrine de NOVA For Vision, studio de postproduction, VFX et création IA basé à Liège.

- `index.html` : l'accueil (NOVA)
- `projets/`, `services/`, `studio/`, `contact/` : les quatre autres pages
- `services/`, `studio/`, `contact/`, bas de l'accueil : pages en images. Les prestations (Services, accueil) et les métiers (Studio) sont des « affiches » (`.af`, `.af-c`) : une rangée de panneaux image, celui qu'on survole ou qu'on touche s'ouvre et montre son texte ; sur la page Services, le panneau ouvert joue un extrait du film. Rangée à faire glisser sous 1025 px. Le déroulé (`#tl`) tient en une ligne, les fins de page (`.fin`) sont posées sur une image, Contact a son image à droite (`.ct-pic`). Ancres des prestations inchangées (`#campagnes-ia`, `#clips-vfx`, `#postproduction`, `#direction-artistique`, `#tournage`, `#deroule`). Une seule animation de poussière reste : l'intro de l'accueil.
- `assets/site.css`, `assets/site.js` : styles et script communs aux cinq pages
- `assets/` : logo, polices, plans du studio, stills Tea Storm
- `media/` : showreel, films, aperçus, affiches, campagne Oakley × Meta, spec ad LOEWE (`media/loewe/`), avant / après
- `en/` : version anglaise des cinq pages (`en/`, `en/projects/`, `en/services/`, `en/studio/`, `en/contact/`), reliée au français par les balises hreflang et le lien FR / EN de la bande du haut. Toute modification d'une page française est à reporter dans sa version anglaise.
- `assets/site.js` sert les deux langues : les textes affichés par le script passent par `lng('français', 'english')`, selon `<html lang>`.
- `mail/` : images de l'email de prospection (logo, GIF Oakley × Meta, photos Tea Storm), appelées depuis `https://novaforvision.com/mail/`. Ne pas renommer ni supprimer : les emails déjà envoyés les utilisent.
- `v1/` : sauvegarde de l'ancienne page unique (hors Google)

Publié avec GitHub Pages, sans étape de build.
