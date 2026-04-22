# Générateur de devis freelance

Application Vue 3 pour créer, télécharger et envoyer des devis freelance IT en français.

## Prérequis

- Node.js 20+
- npm
- Une clé Brevo Transactional Email API pour l'envoi des emails

## Installation

```bash
npm install
npm run dev
```

## Variables d'environnement

Copiez `.env.example` vers `.env` puis renseignez:

```bash
VITE_BREVO_API_KEY=
VITE_OWNER_EMAIL=
```

Les clés API ne sont jamais stockées dans `localStorage`.

## Données

Les prestations se trouvent dans `src/data/services.json`. Chaque service contient un identifiant, une catégorie, un prix, une unité, une durée estimée et des options.

Les valeurs par défaut de l'entreprise, de TVA, de numérotation et d'email se trouvent dans `src/data/settings.json`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

## Déploiement GitHub Pages

1. Configurez `base` dans `vite.config.js` si le dépôt est servi depuis un sous-chemin.
2. Lancez `npm run build`.
3. Publiez le contenu de `dist/` via GitHub Pages ou une action dédiée.

## Fonctionnalités

- Formulaire de devis en 4 étapes
- Calculs automatiques en CHF
- PDF A4 avec jsPDF et AutoTable
- Envoi email via Brevo avec PDF en pièce jointe
- Historique local limité aux 20 derniers devis
- Mode sombre par défaut avec préférence persistée
