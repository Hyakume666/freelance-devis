# Design: Hardening du generateur de devis freelance

## Contexte

Le projet est une application Vue 3/Vite qui permet de construire un devis freelance, de generer un PDF et d'envoyer ce devis par email via Brevo. L'application est globalement saine: `npm run lint` passe et `npm run build` passe egalement.

Trois zones d'amelioration ont ete identifiees:

1. L'envoi Brevo repose aujourd'hui sur une cle exposee cote client via `VITE_BREVO_API_KEY`.
2. Le flux metier principal concentre plusieurs responsabilites sensibles: calculs de prix, generation des numeros, historique local, creation PDF et orchestration d'etapes.
3. Le build remonte un warning sur un chunk final de taille elevee, ce qui suggere un travail utile sur le decoupage et le chargement des dependances lourdes.

## Objectif

Ameliorer le projet en priorisant la reduction du risque reel avant les optimisations de confort:

1. securiser l'envoi email,
2. fiabiliser le coeur metier du generateur de devis,
3. simplifier la maintenance du frontend et reduire le poids charge.

## Sequence retenue

### Phase 1: securite et architecture d'envoi

Le premier chantier consiste a retirer la cle Brevo du client. L'envoi doit etre migre vers une couche serveur legere: fonction serverless, backend minimal ou proxy securise selon le contexte de deploiement retenu. Le frontend ne doit plus connaitre qu'un endpoint applicatif interne.

Cette phase doit produire:

- une interface claire entre le frontend et le service d'envoi,
- une gestion d'erreurs explicite pour les echecs de validation, de reseau et de fournisseur,
- une mise a jour de la documentation d'environnement et de deploiement.

### Phase 2: fiabilite metier

Une fois l'architecture d'envoi securisee, le travail se concentre sur la robustesse fonctionnelle. Les modules a verrouiller en priorite sont:

- `src/composables/useQuote.js` pour les calculs,
- `src/stores/quoteStore.js` pour le cycle de vie du devis,
- `src/composables/usePDF.js` pour la sortie PDF,
- `src/components/QuoteForm.vue` pour l'orchestration du tunnel.

Les comportements a verifier couvrent:

- selection de prestations et options,
- quantites et arrondis,
- deplacement, urgence, remise et TVA,
- generation et reutilisation des numeros de devis,
- persistence locale de l'historique,
- coherence entre l'etat affiche, le PDF genere et l'email envoye.

### Phase 3: structure frontend et performance

Le dernier chantier vise a ameliorer la maintenabilite et le chargement. `src/components/QuoteForm.vue` merite un decoupage plus net entre navigation d'etapes, validation, actions PDF/email et affichage. Cote performance, les dependances lourdes liees au PDF et a l'email doivent etre candidates a un chargement differe si cela ne degrade pas l'experience utilisateur.

Cette phase doit aussi traiter le warning de build sur la taille du chunk principal, en privilegiant les gains concrets plutot qu'un refactoring cosmetique.

## Utilisation des skills superpowers

### Pour la phase 1

- `superpowers:writing-plans` pour formaliser le plan de migration de l'envoi.
- `superpowers:using-git-worktrees` si le chantier doit etre isole du reste des modifications.
- `superpowers:verification-before-completion` avant toute annonce de fin de migration.

### Pour la phase 2

- `superpowers:test-driven-development` pour cadrer les cas de test des calculs et des flux critiques.
- `superpowers:systematic-debugging` si des ecarts apparaissent entre UI, PDF, historique et envoi.
- `superpowers:verification-before-completion` pour exiger des preuves via commandes et scenarios verifies.

### Pour la phase 3

- `superpowers:writing-plans` pour organiser le refactor sans deriver vers un redesign inutile.
- `superpowers:requesting-code-review` avant cloture d'une phase structurante.
- `superpowers:receiving-code-review` si un retour demande des ajustements ou remet en cause une hypothese.

## Architecture cible

### Frontend

Le frontend reste responsable de:

- la saisie du devis,
- le calcul et l'affichage des totaux,
- la previsualisation,
- le declenchement des actions utilisateur.

Il ne doit plus etre responsable du secret fournisseur email.

### Couche d'envoi

La couche d'envoi prend en charge:

- la validation minimale du payload recu,
- la creation ou la reception de la piece jointe selon l'implementation retenue,
- l'appel authentifie a Brevo,
- la normalisation des erreurs retournees au frontend.

## Erreurs et garde-fous

- Toute absence de configuration doit echouer avec un message explicite.
- Les erreurs Brevo doivent etre converties en messages lisibles sans exposer d'information sensible.
- Les donnees relues depuis `localStorage` doivent etre traitees defensivement.
- Les calculs monetaires doivent etre valides sur des cas limites, pas seulement sur le parcours nominal.

## Strategie de verification

La verification attendue pour clore chaque phase inclut:

- `npm run lint`,
- `npm run build`,
- verification ciblee du comportement modifie,
- controle manuel des messages d'erreur principaux,
- revue du diff avant cloture.

Pour la phase metier, il est recommande d'ajouter une couche de tests automatisee sur les calculs purs avant de modifier les regles de devis.

## Hors perimetre immediat

Les points suivants ne sont pas prioritaires dans cette sequence:

- refonte visuelle globale,
- changement de stack,
- persistance serveur de l'historique,
- internationalisation multi-langue.

## Critere de succes

Le plan est considere reussi si:

1. aucune cle sensible n'est exposee au client pour l'envoi d'emails,
2. les calculs et sorties du devis sont verifies sur les cas critiques,
3. le tunnel principal est plus simple a maintenir,
4. le warning de build est compris et traite de maniere proportionnee.
