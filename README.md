# Collection Sécu

Jeu de collection de cartes, dans l'esprit de WikiMaster, où chaque carte représente une notion de
sécurité : menace, défense, concept, outil ou incident célèbre. Le but est pédagogique : faire
découvrir et retenir les bonnes pratiques à l'équipe en jouant.

> Statut : mise en place du dépôt. Les règles du jeu restent à définir (voir
> [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)).

## Démarrage

Prérequis : Node.js 22 (voir `.nvmrc`).

```bash
npm install
npm run dev
```

## Scripts

| Commande            | Rôle                                            |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Serveur de développement (Vite)                 |
| `npm run build`     | Vérification des types puis build de production |
| `npm test`          | Tests, dont la validation de toutes les cartes  |
| `npm run lint`      | ESLint                                          |
| `npm run typecheck` | Vérification TypeScript                         |
| `npm run format`    | Formatage avec Prettier                         |

## Arborescence

```
src/
  data/cards/      une carte = un fichier JSON
  types/card.ts    schéma d'une carte (zod) : source de vérité du format
  lib/cards.ts     chargement et validation des cartes
  App.tsx          interface (prototype)
tests/             tests Vitest
docs/              game design et notes
```

## Ajouter une carte

Voir [`CONTRIBUTING.md`](CONTRIBUTING.md). Aucune connaissance du code n'est nécessaire : il suffit
d'ajouter un fichier JSON.
