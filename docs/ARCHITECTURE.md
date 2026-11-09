# Architecture

## Vue d’ensemble

Application React (Vite, TypeScript, Tailwind CSS, Motion). Les règles du jeu sont dans
`src/domain/packs.ts`, sous forme de fonctions pures et testées. Les pages passent par la couche
de données `src/data/store.ts`.

```
Pages ──► GameBackend ──► règles des packs (packs.ts)
             │
             ├─ LocalBackend    (actuel)  : navigateur, mode démo, GitHub Pages
             └─ SupabaseBackend (à écrire) : fonctions de supabase/migrations
```

## Mode démo et production

|                | Mode démo (actuel)           | Production (Supabase)                        |
| -------------- | ---------------------------- | -------------------------------------------- |
| Connexion      | Choix d’un profil            | Supabase Auth (invitation par e-mail ou SSO) |
| Stockage       | `localStorage` du navigateur | PostgreSQL                                   |
| Tirage du pack | Dans le navigateur           | Fonction `open_daily_pack()` côté serveur    |
| Anti-triche    | Non garanti                  | Collections non modifiables par les clients  |

En mode démo, le contenu du pack du jour dépend du collaborateur et de la date : recharger la
page ne permet pas de retirer un autre pack. Mais les données restant dans le navigateur, ce
mode **ne protège pas contre la triche**.

## Production : schéma Supabase

`supabase/migrations/20261109000000_schema.sql` :

- `profiles`, `cards`, `pack_openings`, `user_cards` avec sécurité par ligne (RLS) ;
- aucune politique d’écriture sur les collections : seule `open_daily_pack()` (security definer) peut ajouter des cartes ;
- un seul pack par jour garanti par une contrainte d’unicité `(user_id, jour)`, jour calculé à l’heure de Paris ;
- `active_participants()` renvoie uniquement prénom, nom, service, nombre de cartes et série.

Les scénarios de `supabase/tests/10_comportement.sql` vérifient ces règles (`npm run test:db`).

### Brancher Supabase

1. Créer un projet Supabase, appliquer la migration puis `supabase/seed.sql`.
2. Implémenter `SupabaseBackend` (interface `GameBackend`) avec `@supabase/supabase-js` :
   lecture de `cards` et `user_cards`, appel RPC `open_daily_pack` et `active_participants`.
3. Créer les comptes par invitation, en renseignant `prenom`, `nom`, `service`, `equipe` dans les
   métadonnées : le trigger `handle_new_user` crée le profil.
4. Retirer le bouton « Pack bonus (démo) ».

## Design

Jetons dans `src/styles/index.css` : bleu `#153E75` / `#2563A6`, jaune `#F5C542` (avec
parcimonie), familles de cartes en couleurs validées pour le daltonisme. Le verso des cartes et le
pack utilisent les bandes de signalisation noir et jaune et la mascotte Ulysse
(`public/mascotte.webp`).
