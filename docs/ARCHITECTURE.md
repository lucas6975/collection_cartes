# Architecture

## Aujourd’hui : sans compte, sans serveur

Application React (Vite, TypeScript, Tailwind CSS, Motion) publiée sur GitHub Pages.

- `src/domain/packs.ts` : règles du jeu (tirage, pack du jour, doublons, séries), fonctions pures testées.
- `src/data/store.ts` : la partie de chaque personne est enregistrée dans `localStorage` (clé
  `vigie-partie`), avec un identifiant aléatoire créé à la première visite. Le site demande au
  navigateur de conserver ces données (`navigator.storage.persist()`).
- Le contenu du pack du jour dépend de cet identifiant et de la date : recharger la page ne
  permet pas de retirer un autre pack.

Limites, acceptables pour tester l’intérêt du jeu :

- la collection est liée à un appareil et un navigateur ;
- une personne qui modifie les données de son navigateur, ou la date de son téléphone, peut
  tricher : rien n’est vérifié par un serveur ;
- pas de classement entre collègues.

## Seconde étape : comptes et classement (Supabase)

Si le jeu prend, `supabase/migrations/20261109000000_schema.sql` fournit la base :

- comptes (`profiles`), cartes, ouvertures de packs, collections, avec sécurité par ligne (RLS) ;
- tirage côté serveur (`open_daily_pack()`), un seul pack par jour garanti par la base ;
- `active_participants()` pour afficher les participants actifs.

Ce schéma est testé sur PostgreSQL (`npm run test:db`, scénarios dans `supabase/tests/`).
Pour le brancher : créer un projet Supabase, appliquer la migration et `supabase/seed.sql`,
puis remplacer la sauvegarde locale de `src/data/store.ts` par des appels à Supabase. Une
connexion par lien e-mail évite d’avoir à gérer des mots de passe.

## Design

Jetons dans `src/styles/index.css` : bleu `#153E75` / `#2563A6`, jaune `#F5C542` avec
parcimonie, familles de cartes en couleurs validées pour le daltonisme. Le verso des cartes et le
pack utilisent les bandes de signalisation noir et jaune et la mascotte Ulysse
(`public/mascotte.webp`).
