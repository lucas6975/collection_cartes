# Architecture

## Vue d’ensemble

L’application est une SPA React. Toute la logique de jeu est concentrée dans
`src/domain/engine.ts`, sous forme de fonctions pures. Les pages ne calculent jamais elles-mêmes
de l’XP ou des récompenses : elles appellent la couche de données (`src/data/store.ts`).

```
Pages ──► GameBackend ──► moteur de jeu (engine.ts)
             │
             ├─ LocalBackend    (actuel)  : navigateur, mode démo, GitHub Pages
             └─ SupabaseBackend (à écrire) : fonctions RPC de supabase/migrations
```

## Mode démo et production

|                     | Mode démo (actuel)                 | Production (Supabase)                                     |
| ------------------- | ---------------------------------- | --------------------------------------------------------- |
| Authentification    | Choix d’un profil                  | Supabase Auth (invitation par e-mail ou SSO)              |
| Stockage            | `localStorage` du navigateur       | PostgreSQL                                                |
| Correction des quiz | Dans le navigateur                 | Fonctions `submit_quiz` et `submit_scenario` côté serveur |
| Anti-triche         | Non garanti (tout est côté client) | Tables de progression non modifiables par les clients     |

Le mode démo sert à évaluer l’expérience. **Il ne protège pas contre la triche**, puisque toutes
les données sont dans le navigateur.

## Protection des scores (production)

Le schéma `supabase/migrations/20261109000000_schema.sql` applique ces principes :

1. **Aucune écriture directe** : la sécurité par ligne (RLS) n’accorde aucun droit d’écriture sur
   les tables de progression. Seules des fonctions `security definer` écrivent.
2. **Le client envoie des réponses, pas des scores** : `submit_quiz(contexte, parcours, réponses)`
   corrige côté serveur et calcule XP, cartes et succès.
3. **Pas de questions choisies** : les questions soumises doivent correspondre exactement au
   parcours, au défi du jour (tiré côté serveur) ou à la file de révision. Une question répétée
   est refusée.
4. **Pas d’accumulation** : l’XP n’est accordée qu’à la première réussite d’une question, d’un
   parcours, d’une mise en situation ou d’un défi du jour.
5. **Réponses masquées** : la colonne `bonne_reponse` n’est pas lisible par les collaborateurs ;
   `check_answer` la révèle une fois la réponse donnée, pour le retour pédagogique.

Ces règles sont vérifiées par `supabase/tests/10_comportement.sql` (`npm run test:db`).

## Fiabilité des contenus

Un trigger (`guard_content`) repasse automatiquement un contenu modifié « à vérifier » et le
dépublie. Publier un contenu non vérifié est refusé par la base. Côté interface, l’espace
Validation permet de contrôler les sources et de publier.

## Brancher Supabase

1. Créer un projet Supabase et appliquer la migration, puis `supabase/seed.sql`.
2. Implémenter `SupabaseBackend` (interface `GameBackend` de `src/data/store.ts`) avec
   `@supabase/supabase-js` : lecture des contenus publiés, appels RPC `submit_quiz`,
   `submit_scenario`, `leaderboard`, `get_daily_challenge`, `check_answer`, `set_verification`.
3. Créer les comptes par invitation (Edge Function avec la clé de service, qui renseigne
   `prenom`, `nom`, `service`, `equipe` dans les métadonnées : le trigger `handle_new_user`
   crée le profil).
4. Stocker les illustrations importées dans Supabase Storage plutôt qu’en data URL.

## Design system

Les jetons sont définis dans `src/styles/index.css` (`@theme`) :

- Bleu `#153E75` / `#2563A6` : identité, confiance. Jaune `#F5C542` : récompenses et appels à l’action, avec parcimonie.
- Familles de cartes : incendie `#D9542B`, EPI `#2563A6`, risques `#B7791F`, postures `#13896F`, procédures `#6A4FB3` (palette validée pour le daltonisme).
- Raretés : bordure sobre (commune), bleue (peu commune), argentée animée (rare), dorée (épique), conique lumineuse (légendaire).
- Typographies : Manrope (titres), Inter (texte).
