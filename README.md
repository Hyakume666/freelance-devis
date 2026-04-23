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

`npm run dev` suffit pour l'interface Vite, mais pas pour tester l'envoi d'email.
Pour tester `/api/send-quote` en local, utilisez un environnement de développement qui expose aussi le dossier `api/`, comme `vercel dev` ou un équivalent.

## Variables d'environnement

Copiez `.env.example` vers `.env.local` puis renseignez:

```bash
BREVO_API_KEY=
OWNER_EMAIL=
```

La clé Brevo est lue uniquement côté serveur via `/api/send-quote`.
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

## Déploiement

GitHub Pages seul n'est plus suffisant, car l'envoi d'emails nécessite maintenant une plateforme qui expose le dossier `api/`, comme Vercel ou un équivalent.

## Fonctionnalités

- Formulaire de devis en 4 étapes
- Calculs automatiques en CHF
- PDF A4 avec jsPDF et AutoTable
- Envoi email via Brevo avec PDF en pièce jointe via `/api/send-quote`
- Historique local limité aux 20 derniers devis
- Mode sombre par défaut avec préférence persistée
