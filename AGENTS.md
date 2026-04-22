# Project: Générateur de devis freelance
## Stack
Vue 3, Vite, Pinia, Vue Router 4, Tailwind CSS, @vueuse/motion, jsPDF, Brevo API

## Conventions
- Composition API + <script setup> uniquement
- Lucide Vue Next pour tous les icônes (jamais d'emojis)
- Formatage prix: "1 200.00 CHF" (Intl.NumberFormat)
- Langue: français partout dans l'UI
- Pas de TypeScript — JSDoc comments

## Structure
- /src/components/ui/ → composants réutilisables
- /src/data/ → JSON uniquement, pas de base de données
- /src/composables/ → logique métier

## À ne jamais faire
- localStorage pour les clés API
- import.meta.env exposé côté client sauf VITE_ préfixés
- CSS transitions raw (utiliser @vueuse/motion)