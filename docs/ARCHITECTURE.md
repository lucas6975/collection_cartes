# Architecture

## Jeux : dans le navigateur

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

## Inscriptions et tirages (Supabase)

Seules les inscriptions au tirage au sort sont centralisées. `supabase/setup.sql` crée :

- `participants` (prénom, nom, jours choisis, jeton secret du téléphone) et `tirages` ;
- des fonctions appelées par le site : `inscrire`, `ma_participation`, et pour l'administrateur
  `admin_liste`, `admin_tirer`, `admin_annuler_tirage`, `admin_supprimer` ;
- aucun accès direct aux tables : la liste des noms et les tirages exigent le code administrateur,
  vérifié par la base (stocké chiffré, tentatives ralenties).

Le tirage est fait par la base, parmi les inscrits du jour qui n'ont encore jamais gagné.
Le site appelle ces fonctions via l'API REST de Supabase (`src/data/api.ts`), avec l'URL et la clé
publique de `src/config.ts`. Tests : `supabase/test.sql`. Mise en place : `docs/SUPABASE.md`.

## Design

Jetons dans `src/styles/index.css` : bleu `#153E75` / `#2563A6`, jaune `#F5C542` avec
parcimonie, familles de cartes en couleurs validées pour le daltonisme. Le verso des cartes et le
pack utilisent les bandes de signalisation noir et jaune et la mascotte Ulysse
(`public/mascotte.webp`).
