# FleurMat — Fiches plantes QR

Application de fiches plantes pour serre et jardinerie. Les clients scannent un QR code devant chaque plante et accèdent instantanément à sa fiche d'information. Les vendeurs gèrent le catalogue via une interface d'administration locale.

## Architecture

- **Page publique** : HTML5 + CSS3 + JavaScript vanilla, zéro dépendance, chargement instantané sur mobile.
- **App admin** : React + Vite + TypeScript + Tailwind, tourne uniquement en local.
- **Hébergement** : fichiers statiques sur GitHub Pages — aucun serveur requis en production.

## Prérequis

- Node.js 20 ou supérieur
- git

## Installation

```bash
git clone https://github.com/<username>/fleur-mat.git
cd fleur-mat/admin
npm install
```

## Lancer l'administration

```bash
cd admin
npm run dev
```

Ouvre automatiquement http://localhost:5173

Au premier lancement, une fenêtre vous demande :
1. **Chemin absolu vers la racine du repo** — ex : `C:\Users\prenom\Documents\fleur-mat`
2. **URL publique GitHub Pages** — ex : `https://username.github.io/fleur-mat`

Ces réglages sont stockés dans votre navigateur. Modifiables via le menu **Réglages**.

## Workflow quotidien

1. Lancer l'admin (`npm run dev`)
2. Ajouter / modifier / supprimer des plantes via l'interface
3. L'admin écrit directement dans les fichiers du repo (`data/plantes.json` et `images/`)
4. Commiter et pousser :

```bash
git add data/plantes.json images/
git commit -m "Ajout rosier Pierre de Ronsard"
git push
```

GitHub Pages publie automatiquement les changements en quelques secondes.

## Déploiement sur GitHub Pages

1. Créer un repo GitHub (public ou privé avec GitHub Pro)
2. Pousser le code : `git push origin main`
3. Dans le repo GitHub → **Settings** → **Pages**
4. Source : **Deploy from a branch**
5. Branch : `main` / `/ (root)` → **Save**
6. URL résultante : `https://<username>.github.io/<nom-du-repo>/`

Entrer cette URL dans les réglages de l'admin pour que les QR codes pointent au bon endroit.

## Imprimer les QR codes

1. Depuis la liste du catalogue, cocher les plantes souhaitées
2. Cliquer **Imprimer QR (n)**
3. Sur la page d'impression, cliquer **Imprimer**
4. Dans le dialogue d'impression : choisir imprimante ou **Enregistrer en PDF**

Format : A4 portrait, 2 colonnes × 4 rangées = 8 QR par page, QR 5 cm × 5 cm, bordure pointillée pour découpe.

## Ajouter une plante manuellement

Éditer directement `data/plantes.json` en respectant le schéma :

```json
{
  "slug": "mon-slug-unique",
  "nomCommun": "Nom de la plante",
  "image": "mon-slug.jpg",
  "nomBotanique": "Genus species",
  "variete": "Nom variété",
  "prix": 4.90,
  "type": "Vivace",
  "exposition": "plein-soleil",
  "arrosage": "modere",
  "hauteurAdulte": "80 cm",
  "notes": "Conseil de culture."
}
```

Valeurs autorisées pour `exposition` : `plein-soleil`, `mi-ombre`, `ombre`  
Valeurs autorisées pour `arrosage` : `faible`, `modere`, `regulier`, `abondant`

Placer la photo dans `images/<slug>.jpg` (ou `.webp`).

## Structure du projet

```
/
├── index.html          ← Page client publique
├── style.css
├── app.js
├── sw.js               ← Service Worker (mode hors-ligne)
├── manifest.json
├── data/
│   └── plantes.json    ← Catalogue des plantes
├── images/             ← Photos des plantes
└── admin/              ← App d'administration (locale)
    ├── src/
    │   ├── pages/      ← Liste, Édition, Impression QR
    │   ├── components/ ← Modales
    │   └── lib/        ← API, types, utilitaires
    └── plugins/
        └── fs-plugin.ts ← Middleware Vite (lecture/écriture fichiers)
```
