# novaforvision.com

Site vitrine de NOVA For Vision, studio de postproduction, VFX et création IA basé à Liège.

- `index.html` : l'accueil (NOVA)
- `projets/`, `studio/`, `contact/` : les trois autres pages
- `assets/site.css`, `assets/site.js` : styles et script communs aux quatre pages
- `assets/` : logo, polices, plans du studio, stills Tea Storm
- `media/` : showreel, films, aperçus, affiches, campagne Oakley × Meta, spec ad LOEWE (`media/loewe/`), avant / après
- `en/` : version anglaise des quatre pages (`en/`, `en/projects/`, `en/studio/`, `en/contact/`), reliée au français par les balises hreflang et le lien FR / EN de la bande du haut. Toute modification d'une page française est à reporter dans sa version anglaise.
- `assets/site.js` sert les deux langues : les textes affichés par le script passent par `lng('français', 'english')`, selon `<html lang>`.
- `mail/` : images de l'email de prospection (logo, GIF Oakley × Meta, photos Tea Storm), appelées depuis `https://novaforvision.com/mail/`. Ne pas renommer ni supprimer : les emails déjà envoyés les utilisent.
- `v1/` : sauvegarde de l'ancienne page unique (hors Google)

Publié avec GitHub Pages, sans étape de build.
